import { officePage } from "@/components/admin/office-page";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, DISPLAY_STATES, PageHeader, Select, fmtDate, fmtDateTime } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { changePostDisplay, deletePost, savePostSource } from "../actions";

export const metadata: Metadata = { title: "Edit post" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

async function EditPostPage({ params, searchParams }: PageProps<"/admin/posts/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const post = await db.post.findFirst({
    where: { id, deletedAt: null },
    include: {
      series: true,
      cover: { select: { url: true } },
      projects: { include: { project: { select: { title: true, slug: true } } } },
      assets: { include: { media: { select: { url: true, deletedAt: true } } }, orderBy: { originalPath: "asc" } },
    },
  });
  if (!post) notFound();

  const msg = first(sp.msg);
  const warn = first(sp.warn);
  const err = first(sp.err);

  return (
    <>
      <PageHeader
        title={post.title}
        description={post.excerpt ?? undefined}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/posts" className="btn-ghost">All posts</Link>
            <a href={`/api/admin/posts/${post.id}/mdx`} className="btn-ghost">Download MDX</a>
          </div>
        }
      />

      {msg ? <p className="mb-3 rounded-lg border border-ok/50 p-3 text-sm">{msg}</p> : null}
      {warn ? <p className="mb-3 rounded-lg border border-accent/60 p-3 text-sm text-accent">Warning: {warn}</p> : null}
      {err ? <p className="mb-3 rounded-lg border border-danger/50 p-3 text-sm text-danger">{err}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <form action={savePostSource} className="card grid gap-3">
          <input type="hidden" name="id" value={post.id} />
          <label className="block">
            <span className="label">MDX source</span>
            <textarea key={post.sourceHash ?? post.updatedAt.toISOString()} name="mdx" defaultValue={post.mdxSource} rows={32} spellCheck={false} className="input font-mono text-xs leading-relaxed" />
          </label>
          <p className="text-xs text-muted">
            Saved through the same pipeline as uploads: frontmatter wins (title, slug, display, date, tags, series, projects…). Local image
            paths that were uploaded before are re-linked; new images must be uploaded from the posts page.
          </p>
          <div><SubmitButton pendingText="Saving…">Save MDX</SubmitButton></div>
        </form>

        <aside className="space-y-4">
          <div className="card space-y-2 text-sm">
            <div className="flex items-center gap-2"><Badge value={post.display} /><span className="font-mono text-xs text-muted">/{post.slug}</span></div>
            <form action={changePostDisplay} className="flex items-center gap-1">
              <input type="hidden" name="id" value={post.id} />
              <Select name="display" options={DISPLAY_STATES} defaultValue={post.display} className="input py-1 text-xs" />
              <SubmitButton className="btn-ghost px-2 py-1 text-xs" pendingText="…">Set</SubmitButton>
            </form>
            <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1 text-xs">
              <dt className="text-muted">Published</dt><dd>{fmtDate(post.publishedAt)}</dd>
              <dt className="text-muted">Reading</dt><dd>{post.readingMinutes ? `${post.readingMinutes} min` : "—"}</dd>
              <dt className="text-muted">Series</dt><dd>{post.series?.title ?? "—"}</dd>
              <dt className="text-muted">Projects</dt><dd>{post.projects.map((p) => p.project.title).join(", ") || "—"}</dd>
              <dt className="text-muted">Tags</dt><dd>{post.tags.join(", ") || "—"}</dd>
              <dt className="text-muted">Canonical</dt><dd className="break-all">{post.canonicalUrl ?? "—"}</dd>
              <dt className="text-muted">Updated</dt><dd>{fmtDateTime(post.updatedAt)}</dd>
              <dt className="text-muted">Hash</dt><dd className="font-mono">{post.sourceHash?.slice(0, 12) ?? "—"}</dd>
            </dl>
            {post.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.cover.url} alt="" className="mt-2 w-full rounded-md border border-line" />
            ) : null}
          </div>

          <div className="card text-xs">
            <div className="label">Images ({post.assets.length})</div>
            {post.assets.length ? (
              <ul className="space-y-1">
                {post.assets.map((a) => (
                  <li key={a.id} className="truncate">
                    <span className="font-mono">{a.originalPath}</span> →{" "}
                    <a href={a.media.url} target="_blank" rel="noreferrer" className={a.media.deletedAt ? "text-danger line-through" : "text-accent underline"}>
                      blob
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">None.</p>
            )}
          </div>

          <details className="card text-xs">
            <summary className="cursor-pointer label">Frontmatter (as uploaded)</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono">{JSON.stringify(post.frontmatter, null, 2)}</pre>
          </details>

          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <SubmitButton className="btn-danger" pendingText="Deleting…" confirm={`Delete "${post.title}"? It will be hidden and removed from the list.`}>
              Delete post
            </SubmitButton>
          </form>
        </aside>
      </div>
    </>
  );
}

export default officePage(EditPostPage);
