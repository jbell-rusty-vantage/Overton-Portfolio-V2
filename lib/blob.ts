import "server-only";
import { del, put } from "@vercel/blob";

// Server-side Vercel Blob helpers. Auth resolves automatically: on Vercel via
// OIDC (VERCEL_OIDC_TOKEN + BLOB_STORE_ID); elsewhere via BLOB_READ_WRITE_TOKEN
// if one is set. The store is public, so every blob is written with access "public".

export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function putPublic(pathname: string, body: Blob | ArrayBuffer | Buffer, contentType?: string) {
  return put(pathname, body, {
    access: "public",
    addRandomSuffix: true,
    contentType: contentType || undefined,
  });
}

/** Delete a blob; never throws (the DB row is the source of truth). Returns an error message on failure. */
export async function deleteBlobQuietly(url: string): Promise<string | null> {
  try {
    await del(url);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
