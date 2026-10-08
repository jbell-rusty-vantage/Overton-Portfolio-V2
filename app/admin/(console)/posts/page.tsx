import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, DISPLAY_STATES, Empty, PageHeader, Select, fmtDate } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { PostUploadForm } from "./upload-form";
import { changePostDisplay } from "./actions";

export const metadata: Metadata = { title: "Blog posts" };

export default async function PostsPage() {
  await requireAdmin();
  const posts = await db.post.findMany({
    where: { deletedAt: null },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      display: true,
      publishedAt: true,
      updatedAt: true,
      readingMinutes: true,
      tags: true,
      series: { select: { title: true } },
      projects: { select: { project: { select: { title: true } } } },
      _count: { select: { assets: true } },
    },
  });
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Blog posts"
        description="MDX is the source of truth: write it in your editor, upload it here. Frontmatter sets title, slug, excerpt, tags, series, projects, display, date, canonicalUrl and cover. Re-uploading the same file is a no-op."
      />

      <details className="card mb-8" open={posts.length === 0}>
        <summary className="cursor-pointer font-serif text-lg">Upload MDX</summary>
        <div className="mt-5">
          <PostUploadForm />
        </div>
      </details>

      {posts.length === 0 ? (
        <Empty>No posts yet. Upload your first MDX file above.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Display</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Read</th>
                <th className="px-4 py-3">Projects</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-line align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/posts/${p.id}`} className="font-serif text-base hover:text-accent">
                      {p.title}
                    </Link>
                    <div className="font-mono text-xs text-muted">/{p.slug}</div>
                    {p.series || p.tags.length ? (
                      <div className="mt-1 text-xs text-muted">
                        {p.series ? `Series: ${p.series.title}` : ""}
                        {p.series && p.tags.length ? " · " : ""}
                        {p.tags.length ? `#${p.tags.join(" #")}` : ""}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={p.display} />
                    <form action={changePostDisplay} className="mt-2 flex items-center gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <Select name="display" options={DISPLAY_STATES} defaultValue={p.display} className="input py-1 text-xs" />
                      <SubmitButton className="btn-ghost px-2 py-1 text-xs" pendingText="…">Set</SubmitButton>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {fmtDate(p.publishedAt)}
                    {p.publishedAt && p.publishedAt > now ? <div className="text-accent">scheduled</div> : null}
                  </td>
                  <td className="px-4 py-3 text-xs">{p.readingMinutes ? `${p.readingMinutes} min` : "—"}</td>
                  <td className="px-4 py-3 text-xs">{p.projects.map((x) => x.project.title).join(", ") || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <Link href={`/admin/posts/${p.id}`} className="underline">Edit</Link>
                    {" · "}
                    <a href={`/api/admin/posts/${p.id}/mdx`} className="underline">Download MDX</a>
                    <div className="mt-1 text-muted">{p._count.assets} image{p._count.assets === 1 ? "" : "s"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
