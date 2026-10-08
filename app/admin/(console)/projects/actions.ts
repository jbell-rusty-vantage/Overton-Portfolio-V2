"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, Prisma, type ActivationState, type DisplayState, type ProjectStatus } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { audit, emitSignal, snapshot } from "@/lib/admin/audit";
import { bool, date, int, list, oneOf, reqStr, str } from "@/lib/admin/form";
import { slugify } from "@/lib/slug";
import { ACTIVATION_STATES, DISPLAY_STATES } from "@/components/admin/ui";
import { REPO_ROLES } from "../repos/constants";
import { PROJECT_STATUSES, type BodyBlocksState } from "./constants";

async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  fallback: string,
): Promise<string> {
  const root = base || fallback;
  let candidate = root;
  for (let n = 2; await exists(candidate); n++) candidate = `${root.slice(0, 76)}-${n}`;
  return candidate;
}

const projectSlugTaken = (exceptId?: string) => async (slug: string) =>
  !!(await db.project.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } }));

function projectFields(fd: FormData) {
  return {
    title: reqStr(fd, "title"),
    tagline: str(fd, "tagline"),
    summary: str(fd, "summary"),
    status: oneOf<ProjectStatus>(fd, "status", PROJECT_STATUSES, "active"),
    stageCode: str(fd, "stageCode"),
    clientId: str(fd, "clientId"),
    startedOn: date(fd, "startedOn"),
    endedOn: date(fd, "endedOn"),
    tags: list(fd, "tags"),
    display: oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden"),
    activation: oneOf<ActivationState>(fd, "activation", ACTIVATION_STATES, "tracking"),
    featuredRank: int(fd, "featuredRank"),
  };
}

const isPublic = (d: DisplayState) => d === "published" || d === "featured";

/** First publish: stamp publishedAt and emit the public signal (idempotent via dedupeKey). */
async function maybePublish(id: string, title: string, display: DisplayState, publishedAt: Date | null, actor: string) {
  if (!isPublic(display) || publishedAt) return;
  await db.project.update({ where: { id }, data: { publishedAt: new Date() } });
  await emitSignal({
    typeCode: "system.project_published",
    source: "system",
    title: `Project published: ${title}`,
    projectId: id,
    visibility: "public",
    dedupeKey: `project_published:${id}`,
    actor,
  });
}

function revalidateProject(id?: string) {
  revalidatePath("/admin/projects");
  revalidatePath("/admin/repos");
  if (id) revalidatePath(`/admin/projects/${id}`);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function createProject(fd: FormData) {
  const admin = await requireAdmin();
  const data = projectFields(fd);
  const slug = await uniqueSlug(slugify(str(fd, "slug") ?? data.title), projectSlugTaken(), "project");
  const created = await db.project.create({ data: { ...data, slug } });
  await maybePublish(created.id, created.title, created.display, created.publishedAt, admin.email);
  const row = await db.project.findUniqueOrThrow({ where: { id: created.id } });
  await snapshot("project", row.id, row, admin.email, "created");
  await audit(admin.email, "create", "project", row.id, { title: row.title, slug });
  revalidateProject();
  redirect(`/admin/projects/${row.id}`);
}

export async function updateProject(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const before = await db.project.findUniqueOrThrow({ where: { id } });
  const data = projectFields(fd);
  const wanted = slugify(str(fd, "slug") ?? "") || before.slug;
  const slug = wanted === before.slug ? before.slug : await uniqueSlug(wanted, projectSlugTaken(id), "project");
  const coverMediaId = str(fd, "coverMediaId");
  await db.project.update({
    where: { id },
    data: { ...data, slug, coverMediaId, sortOrder: int(fd, "sortOrder") ?? before.sortOrder },
  });
  await maybePublish(id, data.title, data.display, before.publishedAt, admin.email);
  const row = await db.project.findUniqueOrThrow({ where: { id } });
  await snapshot("project", id, row, admin.email, str(fd, "message") ?? "updated");
  await audit(admin.email, "update", "project", id, {
    display: row.display,
    ...(before.display !== row.display ? { displayFrom: before.display } : {}),
  });
  revalidateProject(id);
  redirect(`/admin/projects/${id}?notice=${encodeURIComponent("Saved")}${slug !== wanted ? `&error=${encodeURIComponent(`Slug “${wanted}” was taken; using “${slug}”.`)}` : ""}`);
}

export async function deleteProject(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const row = await db.project.update({ where: { id }, data: { deletedAt: new Date(), display: "hidden" } });
  await snapshot("project", id, row, admin.email, "soft deleted");
  await audit(admin.email, "soft_delete", "project", id, { title: row.title });
  revalidateProject(id);
  redirect("/admin/projects");
}

/** useActionState action: validates that bodyBlocks is a JSON array before saving. */
export async function saveBodyBlocks(_prev: BodyBlocksState, fd: FormData): Promise<BodyBlocksState> {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const raw = (fd.get("bodyBlocks") as string | null) ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim() === "" ? "[]" : raw);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`, savedAt: null };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: "Body blocks must be a JSON array, e.g. [{\"component\":\"Prose\",\"props\":{…}}]", savedAt: null };
  }
  const bad = parsed.findIndex((b) => typeof b !== "object" || b === null || Array.isArray(b));
  if (bad !== -1) return { ok: false, error: `Block #${bad + 1} must be an object`, savedAt: null };
  const row = await db.project.update({ where: { id }, data: { bodyBlocks: parsed as Prisma.InputJsonArray } });
  await snapshot("project", id, row, admin.email, "body blocks updated");
  await audit(admin.email, "update_body", "project", id, { blocks: parsed.length });
  revalidateProject(id);
  return { ok: true, error: null, savedAt: Date.now() };
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function createClient(fd: FormData) {
  const admin = await requireAdmin();
  const name = reqStr(fd, "name");
  const slug = await uniqueSlug(
    slugify(str(fd, "slug") ?? name),
    async (s) => !!(await db.client.findUnique({ where: { slug: s }, select: { id: true } })),
    "client",
  );
  const client = await db.client.create({
    data: { name, slug, publicAlias: str(fd, "publicAlias"), showName: bool(fd, "showName"), notes: str(fd, "notes") },
  });
  await snapshot("client", client.id, client, admin.email, "created");
  await audit(admin.email, "create", "client", client.id, { name });
  revalidatePath("/admin/projects");
}

// ---------------------------------------------------------------------------
// Linked repos / deployments / links (edit page)
// ---------------------------------------------------------------------------

async function touched(projectId: string, actor: string, message: string) {
  const row = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { repos: true, deployments: true, links: true },
  });
  await snapshot("project", projectId, row, actor, message);
  revalidateProject(projectId);
}

export async function linkRepo(fd: FormData) {
  const admin = await requireAdmin();
  const projectId = reqStr(fd, "projectId");
  const repoId = reqStr(fd, "repoId");
  const role = oneOf(fd, "role", REPO_ROLES, "other");
  const isPrimary = bool(fd, "isPrimary");
  if (isPrimary) await db.projectRepo.updateMany({ where: { projectId }, data: { isPrimary: false } });
  await db.projectRepo.upsert({
    where: { projectId_repoId: { projectId, repoId } },
    create: { projectId, repoId, role, isPrimary },
    update: { role, isPrimary },
  });
  await audit(admin.email, "project_repo.link", "project", projectId, { repoId, role, isPrimary });
  await touched(projectId, admin.email, "repo linked");
}

export async function unlinkRepo(fd: FormData) {
  const admin = await requireAdmin();
  const projectId = reqStr(fd, "projectId");
  const repoId = reqStr(fd, "repoId");
  await db.projectRepo.deleteMany({ where: { projectId, repoId } });
  await audit(admin.email, "project_repo.unlink", "project", projectId, { repoId });
  await touched(projectId, admin.email, "repo unlinked");
}

export async function linkDeployment(fd: FormData) {
  const admin = await requireAdmin();
  const projectId = reqStr(fd, "projectId");
  const deploymentId = reqStr(fd, "deploymentId");
  const isPrimary = bool(fd, "isPrimary");
  const role = str(fd, "role") ?? "app";
  if (isPrimary) await db.projectDeployment.updateMany({ where: { projectId }, data: { isPrimary: false } });
  await db.projectDeployment.upsert({
    where: { projectId_deploymentId: { projectId, deploymentId } },
    create: { projectId, deploymentId, isPrimary, role },
    update: { isPrimary, role },
  });
  await audit(admin.email, "project_deployment.link", "project", projectId, { deploymentId, isPrimary });
  await touched(projectId, admin.email, "deployment linked");
}

export async function unlinkDeployment(fd: FormData) {
  const admin = await requireAdmin();
  const projectId = reqStr(fd, "projectId");
  const deploymentId = reqStr(fd, "deploymentId");
  await db.projectDeployment.deleteMany({ where: { projectId, deploymentId } });
  await audit(admin.email, "project_deployment.unlink", "project", projectId, { deploymentId });
  await touched(projectId, admin.email, "deployment unlinked");
}

export async function addLink(fd: FormData) {
  const admin = await requireAdmin();
  const projectId = reqStr(fd, "projectId");
  const url = new URL(reqStr(fd, "url")).toString();
  const link = await db.projectLink.create({
    data: {
      projectId,
      url,
      label: str(fd, "label") ?? new URL(url).hostname,
      kind: str(fd, "kind") ?? "link",
      sortOrder: int(fd, "sortOrder") ?? 0,
    },
  });
  await audit(admin.email, "project_link.create", "project", projectId, { linkId: link.id, url });
  await touched(projectId, admin.email, "link added");
}

export async function removeLink(fd: FormData) {
  const admin = await requireAdmin();
  const projectId = reqStr(fd, "projectId");
  const id = reqStr(fd, "id");
  await db.projectLink.deleteMany({ where: { id, projectId } });
  await audit(admin.email, "project_link.delete", "project", projectId, { linkId: id });
  await touched(projectId, admin.email, "link removed");
}
