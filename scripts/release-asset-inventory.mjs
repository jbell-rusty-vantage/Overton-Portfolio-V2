import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import sharp from "sharp";

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = dir + "/" + entry.name;
    if (entry.isDirectory()) files.push(...await walk(p)); else files.push(p);
  }
  return files;
}
const texts = [];
for (const folder of ["app", "components", "lib", "content", "assets"]) {
  for (const file of await walk(folder)) {
    if (/\/generated\/|content\/(projects|media-src|media-out)\//.test(file) || !/\.(tsx?|json|mjs|css)$/.test(file)) continue;
    texts.push({ file, text: await readFile(file, "utf8") });
  }
}
const estate = JSON.parse(await readFile("content/travellers-rest/blob-manifest.json", "utf8"));
const mime = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".glb": "model/gltf-binary", ".json": "application/json", ".vtt": "text/vtt", ".pdf": "application/pdf", ".ico": "image/x-icon" };
const files = [];
for (const file of await walk("public")) {
  if (/\/proof-[a-f0-9-]+\.webp$/.test(file)) continue;
  const url = file.slice(6), ext = path.extname(file).toLowerCase(), bytes = await readFile(file);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const bundled = !/^\/[^/]+\.(mp4|mov)$/i.test(url);
  const receipt = estate.find(e => e.localUrl === url);
  if (receipt && receipt.sha256 !== sha256) throw Error("Estate receipt drift: " + url);
  if (url.startsWith("/media/") && url.split("/")[2] !== sha256) throw Error("Content-addressed file drift: " + url);
  let dimensions = null, durationSeconds = null;
  if ([".webp", ".png", ".jpg"].includes(ext)) { const m = await sharp(bytes).metadata(); dimensions = { width: m.width, height: m.height }; }
  if ([".mp3", ".mp4"].includes(ext)) {
    const metadata = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "json", file], { encoding: "utf8", windowsHide: true }));
    durationSeconds = Number(metadata.format.duration);
    const video = metadata.streams.find(s => s.width); if (video) dimensions = { width: video.width, height: video.height };
  }
  files.push({ path: file, url, deliveryUrl: receipt?.url ?? (bundled ? "https://overton-portfolio-v2.vercel.app" + url : null), mime: mime[ext] ?? "application/octet-stream", bytes: bytes.length, sha256, dimensions, durationSeconds, bundled, publicEligible: bundled, credit: receipt?.credit ?? (url.startsWith("/performances/") ? "Owner-supplied soccer footage; selected published clips." : url.includes("/media/") ? "Derived from reviewed portfolio imagery or the approved estate renderer; source receipts in content/library." : "Owner portfolio derivative; source and credits in the corresponding content/asset manifest."), references: texts.filter(t => t.text.includes(url)).map(t => t.file) });
}
const groups = Map.groupBy(files, f => f.sha256);
const duplicates = [...groups.values()].filter(g => g.length > 1).map(g => g.map(f => ({ url: f.url, bundled: f.bundled })));
const inventory = { generatedAt: new Date().toISOString(), bundledBytes: files.filter(f => f.bundled).reduce((n, f) => n + f.bytes, 0), excludedMasterBytes: files.filter(f => !f.bundled).reduce((n, f) => n + f.bytes, 0), files, blob: estate, duplicates };
await mkdir("docs/releases/2026-11-13", { recursive: true });
await mkdir(".local-library/release", { recursive: true });
await writeFile("docs/releases/2026-11-13/assets.json", JSON.stringify(inventory, null, 2) + "\n");
const hashes = { sha256: createHash("sha256").update(JSON.stringify(inventory, null, 2) + "\n").digest("hex"), bundledBytes: inventory.bundledBytes, excludedMasterBytes: inventory.excludedMasterBytes, bundledFiles: files.filter(f => f.bundled).length, blobObjects: estate.length, duplicates };
await writeFile(".local-library/release/asset-summary.json", JSON.stringify(hashes, null, 2));
console.log(JSON.stringify(hashes));
