import type { Metadata } from "next";
import Link from "next/link";
import { db, type MediaKind, type Prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, Empty, Field, PageHeader, Select, fmtBytes, fmtDate } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { EMBED_PROVIDERS, MEDIA_KINDS, MEDIA_PURPOSES } from "@/lib/media";
import { MediaUploader } from "./uploader";
import { attachMediaToProject, deleteMedia, detachMediaLink, registerEmbed, updateMedia } from "./actions";

export const metadata: Metadata = { title: "Media & artifacts" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

const KIND_ICON: Record<string, string> = {
  image: "IMG",
  video: "VID",
  audio: "AUD",
  model3d: "3D",
  document: "DOC",
  other: "FILE",
};

export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  await requireAdmin();
  const sp = await searchParams;
  const kind = first(sp.kind);
  const purpose = first(sp.purpose);
  const q = first(sp.q);

  const where: Prisma.MediaAssetWhereInput = { deletedAt: null };
  if (kind && (MEDIA_KINDS as readonly string[]).includes(kind)) where.kind = kind as MediaKind;
  if (purpose) where.purpose = purpose;
  if (q) where.title = { contains: q, mode: "insensitive" };

  const [assets, projects, roles] = await Promise.all([
    db.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { links: { orderBy: { createdAt: "asc" } }, _count: { select: { links: true, postAssets: true } } },
    }),
    db.project.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.mediaRole.findMany({ orderBy: { sortOrder: "asc" }, select: { code: true, label: true } }),
  ]);
  const projectTitle = new Map(projects.map((p) => [p.id, p.title]));
  const filtered = Boolean(kind || purpose || q);

  return (
    <>
      <PageHeader
        title="Media & artifacts"
        description="Screenshots, demo videos, diagrams, textures and 3D scene assets. Files go straight from the browser to Vercel Blob; embeds (YouTube, Loom, live sites) are registered by URL."
      />

      <section className="card mb-6">
        <h2 className="mb-4 font-serif text-lg">Upload files</h2>
        <MediaUploader />
      </section>

      <details className="card mb-8">
        <summary className="cursor-pointer font-serif text-lg">Register an embed (no upload)</summary>
        <form action={registerEmbed} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Provider"><Select name="provider" options={EMBED_PROVIDERS} defaultValue="youtube" /></Field>
          <Field label="URL"><input name="url" type="url" required placeholder="https://…" className="input" /></Field>
          <Field label="Title"><input name="title" className="input" /></Field>
          <Field label="Kind"><Select name="kind" options={MEDIA_KINDS} defaultValue="video" /></Field>
          <Field label="Purpose"><Select name="purpose" options={MEDIA_PURPOSES} defaultValue="demo-video" /></Field>
          <Field label="Caption"><input name="caption" className="input" /></Field>
          <div className="md:col-span-2"><SubmitButton>Register embed</SubmitButton></div>
        </form>
      </details>

      <form className="mb-6 flex flex-wrap items-end gap-3" method="get">
        <Field label="Kind">
          <Select name="kind" options={[{ value: "", label: "all" }, ...MEDIA_KINDS.map((k) => ({ value: k, label: k }))]} defaultValue={kind ?? ""} />
        </Field>
        <Field label="Purpose">
          <Select
            name="purpose"
            options={[{ value: "", label: "all" }, ...MEDIA_PURPOSES.map((p) => ({ value: p, label: p }))]}
            defaultValue={purpose ?? ""}
          />
        </Field>
        <Field label="Search title"><input name="q" defaultValue={q ?? ""} className="input" placeholder="diagram…" /></Field>
        <button className="btn-ghost">Filter</button>
        {filtered ? <Link href="/admin/media" className="text-sm text-muted underline">Clear</Link> : null}
        <span className="ml-auto text-xs text-muted">{assets.length} item{assets.length === 1 ? "" : "s"}{assets.length === 200 ? " (latest 200)" : ""}</span>
      </form>

      {assets.length === 0 ? (
        <Empty>{filtered ? "Nothing matches these filters." : "No media yet. Drop some files above."}</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((m) => (
            <div key={m.id} className="card flex flex-col gap-3 p-4">
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-line bg-background">
                {m.kind === "image" ? (
                  // Plain <img>: Blob/remote hosts aren't in images.remotePatterns.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt ?? m.title ?? ""} loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <span className="font-mono text-2xl tracking-widest text-muted">{KIND_ICON[m.kind] ?? "FILE"}</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 flex-1 truncate font-serif text-lg" title={m.title ?? undefined}>{m.title ?? "Untitled"}</h3>
                  <Badge>{m.kind}</Badge>
                  <Badge>{m.provider}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {m.purpose ?? "—"} · {fmtBytes(m.bytes)}
                  {m.width && m.height ? ` · ${m.width}×${m.height}` : ""} · {fmtDate(m.createdAt)}
                </p>
                {m.tags.length ? <p className="mt-1 text-xs text-muted">#{m.tags.join(" #")}</p> : null}
                <p className="mt-1 text-xs text-muted">
                  Linked {m._count.links}× {m._count.postAssets ? `· used in ${m._count.postAssets} post${m._count.postAssets === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <input readOnly value={m.url} className="input font-mono text-xs" aria-label="URL" />

              {m.links.length ? (
                <ul className="space-y-1 text-xs">
                  {m.links.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {l.entityType === "project" ? projectTitle.get(l.entityId) ?? l.entityId : `${l.entityType} ${l.entityId.slice(0, 8)}`} ·{" "}
                        <span className="text-muted">{l.roleCode}</span>
                      </span>
                      <form action={detachMediaLink}>
                        <input type="hidden" name="linkId" value={l.id} />
                        <SubmitButton className="text-muted underline hover:text-danger" pendingText="…">detach</SubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : null}

              <details>
                <summary className="cursor-pointer text-sm text-muted">Edit</summary>
                <form action={updateMedia} className="mt-3 grid gap-3">
                  <input type="hidden" name="id" value={m.id} />
                  <Field label="Title"><input name="title" defaultValue={m.title ?? ""} className="input" /></Field>
                  <Field label="Alt text"><input name="alt" defaultValue={m.alt ?? ""} className="input" /></Field>
                  <Field label="Caption"><input name="caption" defaultValue={m.caption ?? ""} className="input" /></Field>
                  <Field label="Purpose"><Select name="purpose" options={MEDIA_PURPOSES} defaultValue={m.purpose ?? "general"} /></Field>
                  <Field label="Tags" hint="Comma separated"><input name="tags" defaultValue={m.tags.join(", ")} className="input" /></Field>
                  <div><SubmitButton>Save</SubmitButton></div>
                </form>
              </details>

              <details>
                <summary className="cursor-pointer text-sm text-muted">Attach to project</summary>
                {projects.length === 0 ? (
                  <p className="mt-3 text-xs text-muted">No projects yet.</p>
                ) : (
                  <form action={attachMediaToProject} className="mt-3 grid gap-3">
                    <input type="hidden" name="mediaId" value={m.id} />
                    <Field label="Project"><Select name="projectId" options={projects.map((p) => ({ value: p.id, label: p.title }))} /></Field>
                    <Field label="Role">
                      <Select name="roleCode" options={roles.map((r) => ({ value: r.code, label: r.label }))} defaultValue="gallery" />
                    </Field>
                    <Field label="Caption (optional)"><input name="caption" className="input" /></Field>
                    <div><SubmitButton>Attach</SubmitButton></div>
                  </form>
                )}
              </details>

              <form action={deleteMedia} className="mt-auto">
                <input type="hidden" name="id" value={m.id} />
                <SubmitButton
                  className="btn-danger"
                  pendingText="Deleting…"
                  confirm={`Delete "${m.title ?? m.url}"?${m.provider === "blob" ? " The file is removed from Blob storage." : ""}${
                    m._count.postAssets ? ` It is used in ${m._count.postAssets} blog post(s), which will show a broken image.` : ""
                  }`}
                >
                  Delete
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
