import "server-only";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { artworkFilename } from "@/lib/library/artwork";

export async function listBundledArtwork() {
  const files = await readdir(join(process.cwd(), "public", "library", "artwork"), { withFileTypes: true })
    .catch((e: NodeJS.ErrnoException) => { if (e.code === "ENOENT") return []; throw e; });
  return files.filter((f) => f.isFile() && artworkFilename(f.name)).map((f) => f.name).sort();
}
