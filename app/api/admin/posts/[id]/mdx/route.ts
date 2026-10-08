import { db } from "@/lib/db";
import { getAdmin } from "@/lib/auth/session";

// Download a post's stored MDX (local image paths already rewritten to Blob URLs).
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/posts/[id]/mdx">) {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const post = await db.post.findUnique({ where: { id }, select: { slug: true, mdxSource: true } });
  if (!post) return new Response("Not found", { status: 404 });
  return new Response(post.mdxSource, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${post.slug}.mdx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
