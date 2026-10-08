"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, type MediaKind, type MediaProvider } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { audit, emitSignal, snapshot } from "@/lib/admin/audit";
import { int, list, oneOf, reqStr, str } from "@/lib/admin/form";
import { deleteBlobQuietly, isBlobUrl } from "@/lib/blob";
import { EMBED_PROVIDERS, MEDIA_KINDS, MEDIA_PURPOSES } from "@/lib/media";

const PATH = "/admin/media";

const uploadedSchema = z.object({
  url: z.url(),
  pathname: z.string().min(1).max(1024),
  contentType: z.string().max(255).nullish(),
  size: z.number().int().nonnegative(),
  title: z.string().trim().max(300).nullish(),
  kind: z.enum(MEDIA_KINDS),
  purpose: z.enum(MEDIA_PURPOSES),
  alt: z.string().trim().max(1000).nullish(),
  width: z.number().int().positive().nullish(),
  height: z.number().int().positive().nullish(),
});

export type UploadedMediaInput = z.input<typeof uploadedSchema>;

/** Called by the client uploader after uploadPresigned() resolves. */
export async function registerUploadedMedia(input: UploadedMediaInput): Promise<{ id: string }> {
  const admin = await requireAdmin();
  const data = uploadedSchema.parse(input);
  if (!isBlobUrl(data.url)) throw new Error("Not a Vercel Blob URL");

  const media = await db.mediaAsset.create({
    data: {
      kind: data.kind as MediaKind,
      provider: "blob",
      url: data.url,
      blobPathname: data.pathname,
      mimeType: data.contentType || null,
      bytes: BigInt(data.size),
      width: data.width ?? null,
      height: data.height ?? null,
      title: data.title || null,
      alt: data.alt || null,
      purpose: data.purpose,
    },
  });
  await audit(admin.email, "upload", "media", media.id, { pathname: data.pathname, size: data.size });
  await emitSignal({
    typeCode: "system.media_uploaded",
    source: "system",
    title: `Uploaded ${media.title ?? data.pathname}`,
    summary: `${data.kind} · ${data.purpose}`,
    url: data.url,
    visibility: "private",
    actor: admin.email,
    payload: { mediaId: media.id, pathname: data.pathname, bytes: data.size, kind: data.kind },
  });
  revalidatePath(PATH);
  return { id: media.id };
}

export async function registerEmbed(fd: FormData) {
  const admin = await requireAdmin();
  const url = new URL(reqStr(fd, "url")).toString();
  const provider = oneOf(fd, "provider", EMBED_PROVIDERS, "external") as MediaProvider;
  const media = await db.mediaAsset.create({
    data: {
      kind: oneOf(fd, "kind", MEDIA_KINDS, "video") as MediaKind,
      provider,
      url,
      title: str(fd, "title"),
      caption: str(fd, "caption"),
      purpose: oneOf(fd, "purpose", MEDIA_PURPOSES, provider === "deployment" ? "general" : "demo-video"),
    },
  });
  await snapshot("media", media.id, media, admin.email, "registered embed");
  await audit(admin.email, "create", "media", media.id, { provider, url });
  revalidatePath(PATH);
}

export async function updateMedia(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const media = await db.mediaAsset.update({
    where: { id },
    data: {
      title: str(fd, "title"),
      alt: str(fd, "alt"),
      caption: str(fd, "caption"),
      purpose: oneOf(fd, "purpose", MEDIA_PURPOSES, "general"),
      tags: list(fd, "tags"),
    },
  });
  await snapshot("media", id, media, admin.email, "updated");
  await audit(admin.email, "update", "media", id);
  revalidatePath(PATH);
}

export async function attachMediaToProject(fd: FormData) {
  const admin = await requireAdmin();
  const mediaId = reqStr(fd, "mediaId");
  const projectId = reqStr(fd, "projectId");
  const roleCode = reqStr(fd, "roleCode");
  const position =
    int(fd, "position") ??
    (await db.mediaLink.count({ where: { entityType: "project", entityId: projectId, roleCode } }));
  await db.mediaLink.upsert({
    where: { mediaId_entityType_entityId_roleCode: { mediaId, entityType: "project", entityId: projectId, roleCode } },
    update: { caption: str(fd, "caption") },
    create: { mediaId, entityType: "project", entityId: projectId, roleCode, position, caption: str(fd, "caption") },
  });
  await audit(admin.email, "attach", "media", mediaId, { projectId, roleCode });
  revalidatePath(PATH);
}

export async function detachMediaLink(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "linkId");
  const link = await db.mediaLink.delete({ where: { id } });
  await audit(admin.email, "detach", "media", link.mediaId, { entityType: link.entityType, entityId: link.entityId, roleCode: link.roleCode });
  revalidatePath(PATH);
}

export async function deleteMedia(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const media = await db.mediaAsset.findUniqueOrThrow({ where: { id } });
  let blobError: string | null = null;
  if (media.provider === "blob" && media.url && isBlobUrl(media.url)) {
    blobError = await deleteBlobQuietly(media.url);
  }
  await db.mediaAsset.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit(admin.email, "soft_delete", "media", id, { url: media.url, blobDeleted: blobError === null, blobError });
  revalidatePath(PATH);
}
