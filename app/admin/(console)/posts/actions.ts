"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, type DisplayState } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/admin/audit";
import { oneOf, reqStr } from "@/lib/admin/form";
import { DISPLAY_STATES } from "@/components/admin/ui";
import { ingestPost, setPostDisplay } from "@/lib/post-ingest";

export async function changePostDisplay(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const display = oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden");
  await setPostDisplay(id, display, admin.email);
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}`);
}

/** Re-save edited MDX from the edit page through the same pipeline (no image upload). */
export async function savePostSource(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const source = String(fd.get("mdx") ?? "");
  const qs = new URLSearchParams();
  try {
    if (!source.trim()) throw new Error("The MDX is empty.");
    const result = await ingestPost({ source, actor: admin.email, postId: id });
    qs.set("msg", result.messages.join(" "));
    if (result.warnings.length) qs.set("warn", result.warnings.join(" · "));
  } catch (e) {
    qs.set("err", e instanceof Error ? e.message : String(e));
  }
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}`);
  redirect(`/admin/posts/${id}?${qs.toString()}`);
}

export async function deletePost(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  await db.post.update({ where: { id }, data: { deletedAt: new Date(), display: "hidden" } });
  await audit(admin.email, "soft_delete", "post", id);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}
