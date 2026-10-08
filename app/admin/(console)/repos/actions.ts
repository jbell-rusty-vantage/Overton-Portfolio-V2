"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, type ActivationState, type DisplayState, type RedactionPolicy } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { audit, snapshot } from "@/lib/admin/audit";
import { bool, oneOf, reqStr, str } from "@/lib/admin/form";
import { slugify } from "@/lib/slug";
import { ACTIVATION_STATES, DISPLAY_STATES } from "@/components/admin/ui";
import { fetchGithubRepos, fetchGithubUser, normalizeLogin, type GithubRepo } from "@/lib/github";
import { ACCOUNT_KINDS, REDACTION_POLICIES, REPO_ROLES } from "./constants";

function back(fd: FormData, params?: Record<string, string>) {
  // Preserve the current filter (sent as hidden "returnTo") and append a notice/error.
  const returnTo = str(fd, "returnTo");
  const url = new URL(returnTo && returnTo.startsWith("/admin/repos") ? returnTo : "/admin/repos", "http://x");
  url.searchParams.delete("notice");
  url.searchParams.delete("error");
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  return `${url.pathname}${url.search}`;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function addAccount(fd: FormData) {
  const admin = await requireAdmin();
  const login = normalizeLogin(reqStr(fd, "login"));
  const kind = oneOf(fd, "kind", ACCOUNT_KINDS, "personal");
  const existing = await db.githubAccount.findFirst({ where: { login: { equals: login, mode: "insensitive" } } });
  if (existing) redirect(back(fd, { error: `Account ${login} already exists` }));
  const account = await db.githubAccount.create({
    data: { login, label: str(fd, "label"), kind, notes: str(fd, "notes"), htmlUrl: `https://github.com/${login}` },
  });
  await audit(admin.email, "github_account.create", null, account.id, { login, kind });
  revalidatePath("/admin/repos");
}

export async function removeAccount(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  // Repos keep existing (github_account_id is set null by the FK).
  const account = await db.githubAccount.delete({ where: { id } });
  await audit(admin.email, "github_account.delete", null, id, { login: account.login });
  revalidatePath("/admin/repos");
}

async function uniqueRepoSlug(base: string): Promise<string> {
  const root = base || "repo";
  let candidate = root;
  for (let n = 2; await db.repo.findUnique({ where: { slug: candidate }, select: { id: true } }); n++) {
    candidate = `${root.slice(0, 76)}-${n}`;
  }
  return candidate;
}

function githubFields(r: GithubRepo, accountId: string, now: Date) {
  return {
    githubAccountId: accountId,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    htmlUrl: r.html_url,
    homepageUrl: r.homepage || null,
    isPrivate: r.private,
    isFork: r.fork,
    isArchived: r.archived,
    defaultBranch: r.default_branch,
    primaryLanguage: r.language,
    topics: r.topics ?? [],
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    pushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
    githubCreatedAt: r.created_at ? new Date(r.created_at) : null,
    lastSyncedAt: now,
  };
}

/**
 * Pull every repo of one account from GitHub. New repos land as inactive+hidden;
 * existing rows only get GitHub-derived metadata refreshed (never activation,
 * display, redaction policy, public alias or notes).
 */
export async function syncAccount(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const account = await db.githubAccount.findUniqueOrThrow({ where: { id } });

  let repos: GithubRepo[];
  let profile: { avatar_url: string | null; html_url: string | null; type: string } | null = null;
  try {
    profile = await fetchGithubUser(account.login).catch(() => null);
    repos = await fetchGithubRepos(account.login, {
      isOrg: account.kind === "org" || profile?.type === "Organization",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await audit(admin.email, "github_account.sync_failed", null, id, { login: account.login, error: message });
    redirect(back(fd, { error: `Sync of ${account.login} failed: ${message}` }));
  }

  const now = new Date();
  let created = 0;
  let updated = 0;
  const failed: string[] = [];
  for (const r of repos) {
    try {
      const githubId = BigInt(r.id);
      const data = githubFields(r, account.id, now);
      // Match by GitHub id first, then by full name (rows created by hand / before ids were stored).
      const existing =
        (await db.repo.findUnique({ where: { githubId }, select: { id: true } })) ??
        (await db.repo.findUnique({ where: { fullName: r.full_name }, select: { id: true, githubId: true } }));
      if (existing) {
        await db.repo.update({ where: { id: existing.id }, data: { ...data, githubId } });
        updated++;
      } else {
        await db.repo.create({
          data: {
            ...data,
            githubId,
            slug: await uniqueRepoSlug(slugify(r.full_name)),
            activation: "inactive",
            display: "hidden",
          },
        });
        created++;
      }
    } catch (e) {
      failed.push(`${r.full_name}: ${e instanceof Error ? e.message.split("\n").pop() : String(e)}`);
    }
  }

  await db.githubAccount.update({
    where: { id },
    data: {
      lastSyncedAt: now,
      ...(profile?.avatar_url ? { avatarUrl: profile.avatar_url } : {}),
      htmlUrl: profile?.html_url ?? account.htmlUrl ?? `https://github.com/${account.login}`,
    },
  });
  await audit(admin.email, "github_account.sync", null, id, {
    login: account.login,
    fetched: repos.length,
    created,
    updated,
    failed: failed.length,
    failures: failed.slice(0, 20),
  });
  revalidatePath("/admin/repos");
  revalidatePath("/admin/projects");
  const notice = `Synced ${account.login}: ${repos.length} repos (${created} new, ${updated} updated${
    failed.length ? `, ${failed.length} failed` : ""
  })`;
  redirect(back(fd, failed.length ? { notice, error: failed.slice(0, 3).join(" · ") } : { notice }));
}

// ---------------------------------------------------------------------------
// Repos
// ---------------------------------------------------------------------------

export async function updateRepo(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const repo = await db.repo.update({
    where: { id },
    data: {
      activation: oneOf<ActivationState>(fd, "activation", ACTIVATION_STATES, "inactive"),
      display: oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden"),
      redactionPolicy: oneOf<RedactionPolicy>(fd, "redactionPolicy", REDACTION_POLICIES, "none"),
      publicAlias: str(fd, "publicAlias"),
      notes: str(fd, "notes"),
    },
  });
  await snapshot("repo", id, repo, admin.email, "updated");
  await audit(admin.email, "update", "repo", id, { activation: repo.activation, display: repo.display });
  revalidatePath("/admin/repos");
}

const PRESETS = {
  track_show: { activation: "tracking", display: "published" },
  track: { activation: "tracking" },
  hide: { display: "hidden" },
  untrack: { activation: "inactive" },
} as const satisfies Record<string, { activation?: ActivationState; display?: DisplayState }>;

export async function quickRepo(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const preset = oneOf(fd, "preset", Object.keys(PRESETS) as (keyof typeof PRESETS)[], "hide");
  const repo = await db.repo.update({ where: { id }, data: PRESETS[preset] });
  await snapshot("repo", id, repo, admin.email, `quick: ${preset}`);
  await audit(admin.email, `quick.${preset}`, "repo", id);
  revalidatePath("/admin/repos");
}

export async function assignRepo(fd: FormData) {
  const admin = await requireAdmin();
  const repoId = reqStr(fd, "repoId");
  const projectId = reqStr(fd, "projectId");
  const role = oneOf(fd, "role", REPO_ROLES, "other");
  const isPrimary = bool(fd, "isPrimary");
  if (isPrimary) {
    await db.projectRepo.updateMany({ where: { projectId, isPrimary: true }, data: { isPrimary: false } });
  }
  await db.projectRepo.upsert({
    where: { projectId_repoId: { projectId, repoId } },
    create: { projectId, repoId, role, isPrimary },
    update: { role, ...(isPrimary ? { isPrimary } : {}) },
  });
  await audit(admin.email, "project_repo.link", "repo", repoId, { projectId, role, isPrimary });
  revalidatePath("/admin/repos");
  revalidatePath("/admin/projects");
}

export async function unassignRepo(fd: FormData) {
  const admin = await requireAdmin();
  const repoId = reqStr(fd, "repoId");
  const projectId = reqStr(fd, "projectId");
  await db.projectRepo.deleteMany({ where: { projectId, repoId } });
  await audit(admin.email, "project_repo.unlink", "repo", repoId, { projectId });
  revalidatePath("/admin/repos");
  revalidatePath("/admin/projects");
}
