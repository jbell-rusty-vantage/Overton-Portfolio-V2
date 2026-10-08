// Pure media helpers shared by the browser uploader and the server.
// No server-only imports here: this module is bundled into Client Components.
import { slugify } from "./slug";

export const MEDIA_KINDS = ["image", "video", "audio", "model3d", "document", "other"] as const;
export type MediaKindValue = (typeof MEDIA_KINDS)[number];

export const MEDIA_PURPOSES = [
  "general",
  "project-screenshot",
  "demo-video",
  "diagram",
  "book-texture",
  "scene-asset",
  "blog-image",
  "document",
] as const;
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export const EMBED_PROVIDERS = ["youtube", "loom", "deployment", "external"] as const;

/** Blob pathname prefixes the upload route is willing to sign. */
export const BLOB_PREFIXES = ["media/", "scene/", "blog/"] as const;

/** Files above this size are sent with multipart upload (parallel parts, retries). */
export const MULTIPART_THRESHOLD = 50 * 1024 * 1024;

/** Hard cap enforced by the signed upload token. */
export const MAX_UPLOAD_BYTES = 1_000_000_000;

export function inferMediaKind(mime: string | null | undefined, filename = ""): MediaKindValue {
  const m = (mime ?? "").toLowerCase();
  const ext = extensionOf(filename);
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "model/gltf-binary" || m === "model/gltf+json" || ext === "glb" || ext === "gltf") return "model3d";
  if (m === "application/pdf" || m.startsWith("text/")) return "document";
  // Browsers sometimes report an empty type; fall back to the extension.
  if (!m) {
    if (["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"].includes(ext)) return "image";
    if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)) return "audio";
    if (["pdf", "md", "mdx", "txt", "csv"].includes(ext)) return "document";
  }
  return "other";
}

export function extensionOf(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "";
  const i = base.lastIndexOf(".");
  return i > 0 ? base.slice(i + 1).toLowerCase() : "";
}

/** "My Diagram (v2).PNG" -> "my-diagram-v2.png" */
export function safeFileName(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "file";
  const ext = extensionOf(base);
  const stem = ext ? base.slice(0, base.length - ext.length - 1) : base;
  const slug = slugify(stem) || "file";
  return ext ? `${slug}.${ext.replace(/[^a-z0-9]/g, "")}` : slug;
}

/** media/2026/10/my-file.png (or scene/2026/10/… for scene assets). */
export function mediaPathname(purpose: string, filename: string, now = new Date()): string {
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const root = purpose === "scene-asset" ? "scene" : "media";
  return `${root}/${yyyy}/${mm}/${safeFileName(filename)}`;
}

export function titleFromFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const i = base.lastIndexOf(".");
  return (i > 0 ? base.slice(0, i) : base).replace(/[-_]+/g, " ").trim() || base;
}

export function isAllowedBlobPathname(pathname: string): boolean {
  if (pathname.includes("..") || pathname.startsWith("/")) return false;
  return BLOB_PREFIXES.some((p) => pathname.startsWith(p));
}
