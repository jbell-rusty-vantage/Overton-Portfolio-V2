import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, Empty, Field, PageHeader, Select, fmtDate, fmtDateTime } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { REPO_ROLES } from "../../repos/constants";
import { addLink, deleteProject, linkDeployment, linkRepo, removeLink, unlinkDeployment, unlinkRepo, updateProject } from "../actions";
import { BodyBlocksForm } from "../body-blocks-form";
import { ProjectFields } from "../project-fields";

export const metadata: Metadata = { title: "Edit project" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ProjectEditPage({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const project = await db.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      cover: true,
      repos: { include: { repo: { select: { id: true, fullName: true, display: true, activation: true, htmlUrl: true } } }, orderBy: { isPrimary: "desc" } },
      deployments: { include: { deployment: { select: { id: true, title: true, url: true, display: true } } }, orderBy: { isPrimary: "desc" } },
      links: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] },
    },
  });
  if (!project) notFound();

  const [stages, clients, repos, deployments, images, revisions] = await Promise.all([
    db.stage.findMany({ orderBy: { sortOrder: "asc" }, select: { code: true, label: true } }),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, publicAlias: true } }),
    db.repo.findMany({ where: { deletedAt: null }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    db.deployment.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true, url: true } }),
    db.mediaAsset.findMany({
      where: { kind: "image", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, title: true, url: true },
    }),
    db.revision.findMany({
      where: { entityType: "project", entityId: id },
      orderBy: { version: "desc" },
      take: 5,
      select: { version: true, author: true, message: true, createdAt: true },
    }),
  ]);

  const linkedRepoIds = new Set(project.repos.map((r) => r.repoId));
  const linkedDeploymentIds = new Set(project.deployments.map((d) => d.deploymentId));
  const availableRepos = repos.filter((r) => !linkedRepoIds.has(r.id));
  const availableDeployments = deployments.filter((d) => !linkedDeploymentIds.has(d.id));
  const notice = first(sp.notice);
  const error = first(sp.error);

  return (
    <>
      <PageHeader
        title={project.title}
        description={`/${project.slug} · updated ${fmtDateTime(project.updatedAt)}${project.publishedAt ? ` · first published ${fmtDate(project.publishedAt)}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge value={project.display} />
            <Badge value={project.activation} />
            <Link href="/admin/projects" className="btn-ghost">
              ← All projects
            </Link>
          </div>
        }
      />

      {notice ? <div className="card mb-4 border-ok/50 text-sm text-ok">{notice}</div> : null}
      {error ? <div className="card mb-4 border-danger/50 text-sm text-danger">{error}</div> : null}

      {/* Details ------------------------------------------------------------ */}
      <section className="card mb-6">
        <h2 className="mb-4 font-serif text-xl">Details</h2>
        <form action={updateProject} className="grid gap-4 md:grid-cols-3">
          <input type="hidden" name="id" value={project.id} />
          <ProjectFields project={project} stages={stages} clients={clients} />
          <Field label="Sort order">
            <input name="sortOrder" type="number" defaultValue={project.sortOrder} className="input" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Cover image" hint="Images from Media & artifacts.">
              <Select
                name="coverMediaId"
                defaultValue={project.coverMediaId ?? ""}
                options={[
                  { value: "", label: "— none —" },
                  ...images.map((m) => ({ value: m.id, label: m.title ? `${m.title} — ${m.url}` : m.url })),
                ]}
              />
            </Field>
          </div>
          <div className="flex items-end">
            {project.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.cover.url} alt={project.cover.alt ?? ""} className="h-20 w-32 rounded-md border border-line object-cover" />
            ) : (
              <span className="text-xs text-muted">No cover</span>
            )}
          </div>
          <div className="md:col-span-2">
            <Field label="Revision note (optional)">
              <input name="message" placeholder="What changed?" className="input" />
            </Field>
          </div>
          <div className="flex items-end md:col-span-1">
            <SubmitButton>Save project</SubmitButton>
          </div>
        </form>
      </section>

      {/* Repos -------------------------------------------------------------- */}
      <section className="card mb-6">
        <h2 className="mb-4 font-serif text-xl">Repos</h2>
        {project.repos.length === 0 ? (
          <p className="mb-4 text-sm text-muted">No repos linked.</p>
        ) : (
          <ul className="mb-5 divide-y divide-line">
            {project.repos.map((pr) => (
              <li key={pr.repoId} className="flex flex-wrap items-center gap-3 py-2">
                <a href={pr.repo.htmlUrl ?? "#"} target="_blank" rel="noreferrer" className="font-mono text-sm hover:underline">
                  {pr.repo.fullName}
                </a>
                <Badge value={pr.repo.activation} />
                <Badge value={pr.repo.display} />
                <form action={linkRepo} className="ml-auto flex items-center gap-2">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="repoId" value={pr.repoId} />
                  <Select name="role" options={REPO_ROLES} defaultValue={pr.role} className="input w-32" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" name="isPrimary" defaultChecked={pr.isPrimary} /> primary
                  </label>
                  <SubmitButton className="btn-ghost" pendingText="…">
                    Update
                  </SubmitButton>
                </form>
                <form action={unlinkRepo}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="repoId" value={pr.repoId} />
                  <SubmitButton className="btn-danger" pendingText="…">
                    Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        {availableRepos.length ? (
          <form action={linkRepo} className="grid gap-4 md:grid-cols-4 md:items-end">
            <input type="hidden" name="projectId" value={project.id} />
            <Field label="Add repo">
              <Select name="repoId" options={availableRepos.map((r) => ({ value: r.id, label: r.fullName }))} />
            </Field>
            <Field label="Role">
              <Select name="role" options={REPO_ROLES} defaultValue="other" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPrimary" /> Primary
            </label>
            <div>
              <SubmitButton className="btn-ghost">Link repo</SubmitButton>
            </div>
          </form>
        ) : (
          <p className="text-xs text-muted">
            No more repos to link. <Link href="/admin/repos" className="underline">Sync repos</Link> first.
          </p>
        )}
      </section>

      {/* Deployments -------------------------------------------------------- */}
      <section className="card mb-6">
        <h2 className="mb-4 font-serif text-xl">Live sites</h2>
        {project.deployments.length === 0 ? (
          <p className="mb-4 text-sm text-muted">No live sites linked.</p>
        ) : (
          <ul className="mb-5 divide-y divide-line">
            {project.deployments.map((pd) => (
              <li key={pd.deploymentId} className="flex flex-wrap items-center gap-3 py-2">
                <span className="font-medium">{pd.deployment.title}</span>
                <a href={pd.deployment.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
                  {pd.deployment.url}
                </a>
                <Badge value={pd.deployment.display} />
                {pd.isPrimary ? <Badge value="featured">primary</Badge> : null}
                <div className="ml-auto flex gap-2">
                  {!pd.isPrimary ? (
                    <form action={linkDeployment}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="deploymentId" value={pd.deploymentId} />
                      <input type="hidden" name="role" value={pd.role} />
                      <input type="hidden" name="isPrimary" value="on" />
                      <SubmitButton className="btn-ghost" pendingText="…">
                        Make primary
                      </SubmitButton>
                    </form>
                  ) : null}
                  <form action={unlinkDeployment}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="deploymentId" value={pd.deploymentId} />
                    <SubmitButton className="btn-danger" pendingText="…">
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        {availableDeployments.length ? (
          <form action={linkDeployment} className="grid gap-4 md:grid-cols-4 md:items-end">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="md:col-span-2">
              <Field label="Add live site">
                <Select name="deploymentId" options={availableDeployments.map((d) => ({ value: d.id, label: `${d.title} — ${d.url}` }))} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPrimary" /> Primary
            </label>
            <div>
              <SubmitButton className="btn-ghost">Link site</SubmitButton>
            </div>
          </form>
        ) : (
          <p className="text-xs text-muted">
            No more sites to link. <Link href="/admin/sites" className="underline">Add live sites</Link>.
          </p>
        )}
      </section>

      {/* Links -------------------------------------------------------------- */}
      <section className="card mb-6">
        <h2 className="mb-4 font-serif text-xl">Links</h2>
        {project.links.length === 0 ? (
          <p className="mb-4 text-sm text-muted">No extra links.</p>
        ) : (
          <ul className="mb-5 divide-y divide-line">
            {project.links.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-2">
                <Badge>{l.kind}</Badge>
                <span className="font-medium">{l.label}</span>
                <a href={l.url} target="_blank" rel="noreferrer" className="truncate text-sm text-accent underline">
                  {l.url}
                </a>
                <form action={removeLink} className="ml-auto">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="id" value={l.id} />
                  <SubmitButton className="btn-danger" pendingText="…">
                    Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addLink} className="grid gap-4 md:grid-cols-5 md:items-end">
          <input type="hidden" name="projectId" value={project.id} />
          <Field label="Kind">
            <Select name="kind" options={["link", "docs", "demo", "video", "article", "figma", "source", "other"]} />
          </Field>
          <Field label="Label">
            <input name="label" placeholder="Demo video" className="input" />
          </Field>
          <div className="md:col-span-2">
            <Field label="URL">
              <input name="url" type="url" required placeholder="https://…" className="input" />
            </Field>
          </div>
          <div>
            <SubmitButton className="btn-ghost">Add link</SubmitButton>
          </div>
        </form>
      </section>

      {/* Body blocks -------------------------------------------------------- */}
      <section className="card mb-6">
        <h2 className="mb-1 font-serif text-xl">Case study body</h2>
        <p className="mb-4 text-sm text-muted">
          A JSON array of component blocks, e.g. <code className="font-mono">[{"{"}&quot;component&quot;: &quot;Prose&quot;, &quot;props&quot;: {"{…}"}{"}"}]</code>.
        </p>
        <BodyBlocksForm projectId={project.id} initialJson={JSON.stringify(project.bodyBlocks ?? [], null, 2)} />
      </section>

      {/* History + danger --------------------------------------------------- */}
      <section className="card mb-6">
        <h2 className="mb-3 font-serif text-xl">Recent revisions</h2>
        {revisions.length === 0 ? (
          <Empty>No revisions yet.</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {revisions.map((r) => (
              <li key={r.version} className="text-muted">
                <span className="font-mono text-foreground">v{r.version}</span> · {fmtDateTime(r.createdAt)} · {r.author}
                {r.message ? ` — ${r.message}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={deleteProject} className="flex justify-end">
        <input type="hidden" name="id" value={project.id} />
        <SubmitButton className="btn-danger" confirm={`Delete “${project.title}”? It will be hidden and moved to the trash (soft delete).`}>
          Delete project
        </SubmitButton>
      </form>
    </>
  );
}
