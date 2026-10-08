import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, Empty, Field, PageHeader, fmtDate } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { createClient, createProject } from "./actions";
import { ProjectFields } from "./project-fields";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  await requireAdmin();
  const [projects, stages, clients] = await Promise.all([
    db.project.findMany({
      where: { deletedAt: null },
      orderBy: [{ featuredRank: { sort: "asc", nulls: "last" } }, { sortOrder: "asc" }, { updatedAt: "desc" }],
      include: {
        cover: { select: { url: true, alt: true, kind: true } },
        client: { select: { name: true, publicAlias: true } },
        stage: { select: { label: true } },
        _count: { select: { repos: true, deployments: true, links: true } },
      },
    }),
    db.stage.findMany({ orderBy: { sortOrder: "asc" }, select: { code: true, label: true } }),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, publicAlias: true, showName: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="The core unit of the portfolio. Each project groups repos, live sites and links, and gets its own case study and timeline."
      />

      <details className="card mb-8" open={projects.length === 0}>
        <summary className="cursor-pointer font-serif text-lg">New project</summary>
        <form action={createProject} className="mt-5 grid gap-4 md:grid-cols-3">
          <ProjectFields stages={stages} clients={clients} />
          <div className="md:col-span-3">
            <SubmitButton>Create project</SubmitButton>
          </div>
        </form>
      </details>

      {projects.length === 0 ? (
        <Empty>No projects yet. Create one above, then link repos and live sites to it.</Empty>
      ) : (
        <div className="mb-10 space-y-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="card flex items-center gap-4 hover:border-accent">
              {p.cover && p.cover.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover.url} alt={p.cover.alt ?? ""} className="h-14 w-20 shrink-0 rounded-md border border-line object-cover" />
              ) : (
                <div className="h-14 w-20 shrink-0 rounded-md border border-dashed border-line" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-lg">{p.title}</h2>
                  <Badge>{p.status}</Badge>
                  <Badge value={p.display} />
                  <Badge value={p.activation} />
                  {p.featuredRank !== null ? <Badge value="featured">#{p.featuredRank}</Badge> : null}
                </div>
                {p.tagline ? <p className="truncate text-sm text-muted">{p.tagline}</p> : null}
                <p className="mt-1 text-xs text-muted">
                  /{p.slug} · {p._count.repos} repos · {p._count.deployments} sites · {p._count.links} links
                  {p.stage ? ` · ${p.stage.label}` : ""}
                  {p.client ? ` · ${p.client.name}` : ""}
                  {p.publishedAt ? ` · published ${fmtDate(p.publishedAt)}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="card">
        <h2 className="mb-1 font-serif text-xl">Clients</h2>
        <p className="mb-4 text-sm text-muted">
          Organizations work was done for. When “show name” is off, visitors see the public alias instead.
        </p>
        {clients.length ? (
          <ul className="mb-5 flex flex-wrap gap-2">
            {clients.map((c) => (
              <li key={c.id} className="rounded-full border border-line px-3 py-1 text-sm">
                {c.name}
                <span className="text-muted">{c.showName ? " · name shown" : c.publicAlias ? ` · as “${c.publicAlias}”` : " · hidden"}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <form action={createClient} className="grid gap-4 md:grid-cols-4 md:items-end">
          <Field label="Name">
            <input name="name" required className="input" />
          </Field>
          <Field label="Public alias">
            <input name="publicAlias" placeholder="A fintech startup" className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="showName" /> Show real name
          </label>
          <div>
            <SubmitButton className="btn-ghost">Add client</SubmitButton>
          </div>
        </form>
      </section>
    </>
  );
}
