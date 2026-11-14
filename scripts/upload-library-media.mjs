// Credentials are SDK options, never process arguments. Every receipt verifies bytes.
import { readdir, readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { blobIdentity, publishImmutable } from "./immutable-blob.mjs";
import { loadLocalEnvironment } from "./database-target.mjs";
loadLocalEnvironment();
const dry = process.argv.includes("--dry-run");
const dir = "content/media-out", record = "content/library/blob-media.json";
const known = await readFile(record, "utf8").then(JSON.parse).catch(e => { if (e.code === "ENOENT") return {}; throw e; });
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!dry && !token) throw Error("Set BLOB_READ_WRITE_TOKEN");
await mkdir("content/library", { recursive: true });
for (const file of (await readdir(dir)).filter(f => f.endsWith(".mp4"))) {
  const bytes = await readFile(`${dir}/${file}`);
  if (dry) { console.log(file, blobIdentity(file, bytes)); continue; }
  known[file] = await publishImmutable(file, bytes, { token, contentType: "video/mp4" });
  await writeFile(record + ".tmp", JSON.stringify(known, null, 2) + "\n");
  await rename(record + ".tmp", record);
  console.log("verified", file, known[file].sha256);
}
