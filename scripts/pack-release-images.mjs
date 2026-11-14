// Regeneration uses sharp; hosting consumes only these validated derivatives.
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const studies = (await Promise.all(["vantage", "commerce-studio", "belllabs"].map(name => readFile(`content/showcases/${name}.json`, "utf8").then(JSON.parse)))).flat();
const urls = new Set(["/travellers-rest/plates/library.webp", "/travellers-rest/archive/judge-overton.webp"]);
for (const study of studies) for (const page of study.pages) for (const block of page.blocks) {
  if (block.component === "Image" && block.props.url?.startsWith("/")) urls.add(block.props.url);
}
const images = {};
for (const url of urls) {
  const original = await readFile("public" + url), metadata = await sharp(original).metadata();
  const variants = [];
  for (const width of [...new Set([480, 900, 1440].map(w => Math.min(w, metadata.width)))]) {
    const bytes = await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    const hash = createHash("sha256").update(bytes).digest("hex");
    const source = `/media/${hash}/${width}.webp`;
    await mkdir(`public/media/${hash}`, { recursive: true });
    await writeFile("public" + source, bytes);
    variants.push({ width, url: source, bytes: bytes.length, sha256: hash });
  }
  images[url] = { width: metadata.width, height: metadata.height, originalBytes: original.length, variants };
}
await mkdir("content/library", { recursive: true });
await writeFile("content/library/image-delivery.json", JSON.stringify(images, null, 2) + "\n");
console.log(JSON.stringify({ images: urls.size, originalBytes: Object.values(images).reduce((n, i) => n + i.originalBytes, 0), smallBytes: Object.values(images).reduce((n, i) => n + i.variants[0].bytes, 0) }));
