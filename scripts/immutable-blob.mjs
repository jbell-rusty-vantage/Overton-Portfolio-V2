import { createHash } from "node:crypto";
import path from "node:path";
import { head, put, BlobNotFoundError } from "@vercel/blob";

export const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
export function blobIdentity(name, bytes, prefix = "library/recordings") {
  const digest = sha256(bytes);
  return { pathname: `${prefix}/${digest}/${path.basename(name)}`, sha256: digest, bytes: bytes.length };
}

/** Deterministic immutable names make retries safe before a local receipt exists. */
export async function publishImmutable(name, bytes, { token, contentType, prefix, sdk = { head, put }, read = fetch } = {}) {
  const identity = blobIdentity(name, bytes, prefix);
  const options = { token };
  let remote;
  try { remote = await sdk.head(identity.pathname, options); }
  catch (error) {
    if (!(error instanceof BlobNotFoundError) && error.code !== "blob_not_found") throw error;
    try {
      remote = await sdk.put(identity.pathname, bytes, { ...options, access: "public", addRandomSuffix: false, allowOverwrite: false, contentType, cacheControlMaxAge: 31536000 });
    } catch (uploadError) {
      try { remote = await sdk.head(identity.pathname, options); } catch { throw uploadError; }
    }
  }
  const metadata = await sdk.head(remote.url, options);
  if (metadata.pathname !== identity.pathname || metadata.size !== identity.bytes) throw Error("Immutable Blob metadata mismatch: " + name);
  const response = await read(metadata.url);
  if (!response.ok || sha256(Buffer.from(await response.arrayBuffer())) !== identity.sha256) throw Error("Immutable Blob checksum mismatch: " + name);
  return { ...identity, url: metadata.url, contentType, verifiedAt: new Date().toISOString() };
}
