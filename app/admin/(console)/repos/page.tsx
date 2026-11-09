import { officePage } from "@/components/admin/office-page";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { db, type Prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { ACTIVATION_STATES, Badge, DISPLAY_STATES, Empty, Field, PageHeader, Select, fmtDate, fmtDateTime } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { addAccount, assignRepo, quickRepo, removeAccount, syncAccount, unassignRepo, updateRepo } from "./actions";
import { ACCOUNT_KINDS, REDACTION_POLICIES, REPO_ROLES, REPO_STATE_FILTERS, type RepoStateFilter } from "./constants";

export const metadata: Metadata = { title: "GitHub repos" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function ReposPage({ searchParams }: PageProps<"/admin/repos">) {
  await requireAdmin();
  const sp = await searchParams;
  const accountFilter = first(sp.account);
  const stateRaw = first(sp.state);
  const state: RepoStateFilter = (REPO_STATE_FILTERS as readonly string[]).includes(stateRaw)
    ? (stateRaw as RepoStateFilter)
    : "all";
  const q = first(sp.q).trim();
  const notice = first(sp.notice);
  const error = first(sp.error);

  const where: Prisma.RepoWhereInput = { deletedAt: null };
  if (accountFilter === "none") where.githubAccountId = null;
  else if (accountFilter) where.githubAccountId = accountFilter;
  if (state === "tracked") where.activation = "tracking";
  else if (state === "shown") where.display = { not: "hidden" };
  else if (state === "hidden") where.display = "hidden";
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { publicAlias: { contains: q, mode: "insensitive" } },
    ];
  }

  const [accounts, repos, projects, counts] = await Promise.all([
    db.githubAccount.findMany({ orderBy: { login: "asc" }, include: { _count: { select: { repos: true } } } }),
    db.repo.findMany({
      where,
      orderBy: [{ pushedAt: { sort: "desc", nulls: "last" } }, { fullName: "asc" }],
      include: {
        githubAccount: { select: { login: true } },
        projects: { include: { project: { select: { id: true, title: true, deletedAt: true } } } },
      },
    }),
    db.project.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.repo.groupBy({ by: ["activation", "display"], where: { deletedAt: null }, _count: { _all: true } }),
  ]);

  const total = counts.reduce((n, c) => n + c._count._all, 0);
  const tracked = counts.filter((c) => c.activation === "tracking").reduce((n, c) => n + c._count._all, 0);
  const shown = counts.filter((c) => c.display !== "hidden").reduce((n, c) => n + c._count._all, 0);

  const qs = new URLSearchParams();
  if (accountFilter) qs.set("account", accountFilter);
  if (state !== "all") qs.set("state", state);
  if (q) qs.set("q", q);
  const returnTo = `/admin/repos${qs.size ? `?${qs}` : ""}`;
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.title }));

  return (
    <>
      <PageHeader
        title="GitHub repos"
        description={`Every repo synced from your GitHub accounts. New repos arrive inactive and hidden — choose what is tracked (ingested) and shown. ${total} total · ${tracked} tracked · ${shown} shown.`}
      />

      {notice ? <div className="card mb-4 border-ok/50 text-sm text-ok">{notice}</div> : null}
      {error ? <div className="card mb-4 border-danger/50 text-sm text-danger">{error}</div> : null}

      {/* Accounts ----------------------------------------------------------- */}
      <section className="card mb-8">
        <h2 className="mb-4 font-serif text-xl">Accounts</h2>
        {accounts.length === 0 ? (
          <Empty>No GitHub accounts yet. Add your personal and client logins below, then sync.</Empty>
        ) : (
          <ul className="mb-6 divide-y divide-line">
            {accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                {a.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-line" />
                ) : (
                  <span className="h-8 w-8 rounded-full border border-line" />
                )}
                <div className="min-w-0">
                  <a href={a.htmlUrl ?? `https://github.com/${a.login}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                    {a.login}
                  </a>
                  {a.label ? <span className="ml-2 text-sm text-muted">{a.label}</span> : null}
                  <div className="text-xs text-muted">
                    {a._count.repos} repos · synced {fmtDateTime(a.lastSyncedAt)}
                  </div>
                </div>
                <Badge>{a.kind}</Badge>
                <div className="ml-auto flex gap-2">
                  <Link href={`/admin/repos?account=${a.id}`} className="btn-ghost">
                    View repos
                  </Link>
                  <form action={syncAccount}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SubmitButton pendingText="Syncing…">Sync repos</SubmitButton>
                  </form>
                  <form action={removeAccount}>
                    <input type="hidden" name="id" value={a.id} />
                    <SubmitButton className="btn-danger" confirm={`Remove account ${a.login}? Its repos stay (unlinked from the account).`}>
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form action={addAccount} className="grid gap-4 md:grid-cols-4 md:items-end">
          <input type="hidden" name="returnTo" value={returnTo} />
          <Field label="GitHub login">
            <input name="login" required placeholder="octocat" className="input" />
          </Field>
          <Field label="Label (optional)">
            <input name="label" placeholder="Personal / Acme client" className="input" />
          </Field>
          <Field label="Kind">
            <Select name="kind" options={ACCOUNT_KINDS} defaultValue="personal" />
          </Field>
          <div>
            <SubmitButton>Add account</SubmitButton>
          </div>
        </form>
      </section>

      {/* Filters ------------------------------------------------------------ */}
      <Form action="/admin/repos" className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Account">
          <Select
            name="account"
            defaultValue={accountFilter}
            options={[
              { value: "", label: "All accounts" },
              ...accounts.map((a) => ({ value: a.id, label: a.login })),
              { value: "none", label: "No account" },
            ]}
          />
        </Field>
        <Field label="State">
          <Select
            name="state"
            defaultValue={state}
            options={[
              { value: "all", label: "All" },
              { value: "tracked", label: "Tracked" },
              { value: "shown", label: "Shown (not hidden)" },
              { value: "hidden", label: "Hidden" },
            ]}
          />
        </Field>
        <Field label="Search">
          <input name="q" defaultValue={q} placeholder="name or description" className="input" />
        </Field>
        <button type="submit" className="btn-ghost">
          Filter
        </button>
        <span className="text-sm text-muted">{repos.length} shown</span>
      </Form>

      {/* Repos -------------------------------------------------------------- */}
      {repos.length === 0 ? (
        <Empty>{total === 0 ? "No repos yet. Add an account and press “Sync repos”." : "No repos match this filter."}</Empty>
      ) : (
        <div className="space-y-3">
          {repos.map((r) => {
            const linked = r.projects.filter((p) => !p.project.deletedAt);
            return (
              <div key={r.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={r.htmlUrl ?? "#"} target="_blank" rel="noreferrer" className="font-mono text-sm font-medium hover:underline">
                    {r.fullName}
                  </a>
                  {r.publicAlias ? <span className="text-sm text-muted">as “{r.publicAlias}”</span> : null}
                  <Badge value={r.activation} />
                  <Badge value={r.display} />
                  {r.redactionPolicy !== "none" ? <Badge value="redacted">{r.redactionPolicy.replace("_", " ")}</Badge> : null}
                  {r.isPrivate ? <Badge value="private">private</Badge> : null}
                  {r.isFork ? <Badge>fork</Badge> : null}
                  {r.isArchived ? <Badge>archived</Badge> : null}
                  <span className="ml-auto text-xs text-muted">
                    {r.primaryLanguage ?? "—"} · ★ {r.stars} · pushed {fmtDate(r.pushedAt)}
                  </span>
                </div>
                {r.description ? <p className="mt-1 text-sm text-muted">{r.description}</p> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(
                    [
                      ["track_show", "Track + show"],
                      ["track", "Track"],
                      ["hide", "Hide"],
                      ["untrack", "Untrack"],
                    ] as const
                  ).map(([preset, label]) => (
                    <form key={preset} action={quickRepo}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="preset" value={preset} />
                      <SubmitButton className="btn-ghost" pendingText="…">
                        {label}
                      </SubmitButton>
                    </form>
                  ))}
                  {linked.length ? <span className="ml-2 text-xs text-muted">Projects:</span> : null}
                  {linked.map((pr) => (
                    <form key={pr.projectId} action={unassignRepo} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs">
                      <input type="hidden" name="repoId" value={r.id} />
                      <input type="hidden" name="projectId" value={pr.projectId} />
                      <Link href={`/admin/projects/${pr.projectId}`} className="hover:underline">
                        {pr.project.title}
                      </Link>
                      <span className="text-muted">
                        · {pr.role}
                        {pr.isPrimary ? " · primary" : ""}
                      </span>
                      <button type="submit" title="Remove from project" className="text-muted hover:text-danger">
                        ×
                      </button>
                    </form>
                  ))}
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-muted">Edit · assign to project</summary>
                  <form action={updateRepo} className="mt-4 grid gap-4 md:grid-cols-3">
                    <input type="hidden" name="id" value={r.id} />
                    <Field label="Activation">
                      <Select name="activation" options={ACTIVATION_STATES} defaultValue={r.activation} />
                    </Field>
                    <Field label="Display">
                      <Select name="display" options={DISPLAY_STATES} defaultValue={r.display} />
                    </Field>
                    <Field label="Redaction policy">
                      <Select name="redactionPolicy" options={REDACTION_POLICIES} defaultValue={r.redactionPolicy} />
                    </Field>
                    <Field label="Public alias" hint="Shown instead of the full name (client work).">
                      <input name="publicAlias" defaultValue={r.publicAlias ?? ""} className="input" />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Notes">
                        <input name="notes" defaultValue={r.notes ?? ""} className="input" />
                      </Field>
                    </div>
                    <div className="md:col-span-3">
                      <SubmitButton>Save repo</SubmitButton>
                    </div>
                  </form>
                  {projects.length ? (
                    <form action={assignRepo} className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-4 md:items-end">
                      <input type="hidden" name="repoId" value={r.id} />
                      <Field label="Assign to project">
                        <Select name="projectId" options={projectOptions} />
                      </Field>
                      <Field label="Role">
                        <Select name="role" options={REPO_ROLES} defaultValue="other" />
                      </Field>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="isPrimary" /> Primary repo
                      </label>
                      <div>
                        <SubmitButton className="btn-ghost">Assign</SubmitButton>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-4 text-xs text-muted">
                      No projects yet — <Link href="/admin/projects" className="underline">create one</Link> to assign repos.
                    </p>
                  )}
                </details>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default officePage(ReposPage);
