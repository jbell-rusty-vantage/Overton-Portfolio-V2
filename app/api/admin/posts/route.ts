import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth/session";
import { ingestPost } from "@/lib/post-ingest";

// MDX upload for /admin/posts. A Route Handler rather than a Server Action
// because Server Action bodies are capped at 1MB by default and posts may carry
// images. On Vercel the request body is still limited to ~4.5MB in total.
//
// multipart/form-data fields:
//   file    — optional .mdx/.md file
//   mdx     — optional pasted MDX (used when no file is given)
//   images  — optional, repeated: image files referenced locally in the MDX

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin || admin.mustChangePassword) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "Expected multipart form data (is the upload over 4.5MB?)" }, { status: 400 });
  }

  const file = fd.get("file");
  const pasted = fd.get("mdx");
  let source = "";
  if (file instanceof File && file.size > 0) {
    if (!/\.(mdx?|markdown)$/i.test(file.name)) {
      return Response.json({ ok: false, error: `${file.name} is not an .mdx/.md file` }, { status: 400 });
    }
    source = await file.text();
  } else if (typeof pasted === "string") {
    source = pasted;
  }
  if (!source.trim()) {
    return Response.json({ ok: false, error: "Choose an .mdx file or paste MDX." }, { status: 400 });
  }

  const images = fd.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
  const nonImages = images.filter((f) => f.type && !f.type.startsWith("image/"));
  if (nonImages.length) {
    return Response.json({ ok: false, error: `Not images: ${nonImages.map((f) => f.name).join(", ")}` }, { status: 400 });
  }

  try {
    const result = await ingestPost({ source, images, actor: admin.email });
    revalidatePath("/admin/posts");
    revalidatePath(`/admin/posts/${result.postId}`);
    return Response.json({ ok: true, ...result });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
