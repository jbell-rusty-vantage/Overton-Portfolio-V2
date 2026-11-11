// Uploads the recordings in content/media-out to the project's public Blob store and records their URLs in
// content/library/blob-media.json. Already-recorded files are skipped unless their size changed.
// Needs BLOB_READ_WRITE_TOKEN: `vercel env pull .env.blob.local --environment=preview` (git-ignored).
// Usage: node --env-file=.env.blob.local scripts/upload-library-media.mjs [--dry-run]
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dry = process.argv.includes("--dry-run");
const dir = path.resolve("content/media-out");
const record = path.resolve("content/library/blob-media.json");
const known = existsSync(record) ? JSON.parse(await readFile(record, "utf8")) : {};
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!dry && !token) throw Error("Set BLOB_READ_WRITE_TOKEN");

for (const file of readdirSync(dir).filter((f) => f.endsWith(".mp4"))) {
  const bytes = statSync(path.join(dir, file)).size;
  if (known[file]?.bytes === bytes) {
    console.log("kept", file);
    continue;
  }
  const pathname = "library/recordings/" + file;
  console.log(dry ? "would upload" : "uploading", file, (bytes / 1e6).toFixed(1) + " MB");
  if (dry) continue;
  const output = execFileSync(
    process.platform === "win32" ? "vercel.cmd" : "vercel",
    ["blob", "put", path.join(dir, file), "--access", "public", "--pathname", pathname, "--allow-overwrite", "true", "--rw-token", token],
    { encoding: "utf8", shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, VERCEL_OIDC_TOKEN: "", BLOB_STORE_ID: "" } },
  );
  const url = output.match(/https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/\S+/i)?.[0];
  if (!url) throw Error("No URL returned for " + file + "\n" + output);
  known[file] = { url, pathname, bytes };
  await writeFile(record, JSON.stringify(known, null, 1));
}
console.log(Object.keys(known).length, "recordings recorded");
