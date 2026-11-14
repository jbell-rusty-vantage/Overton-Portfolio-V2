// Turns the hand-written volumes in content/library/books.mjs into content/library/books.json and prepares
// their images in public/library/artwork/. Writes nothing to the database and uploads nothing.
// A recording uses its Blob URL from content/library/blob-media.json when one exists
// (see scripts/upload-library-media.mjs); otherwise it is bundled in public/library/recordings/.
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { books, clients } from "../content/library/books.mjs";

const src = path.resolve("content/media-src");
const out = path.resolve("public/library/artwork");
const blobFile = path.resolve("content/library/blob-media.json");
const blob = existsSync(blobFile) ? JSON.parse(await readFile(blobFile, "utf8")) : {};
await mkdir(out, { recursive: true });
const order = ["overview", "architecture", "notes", "gallery", "metrics", "links"];
const problems = [];
const size = (file) => {
  const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", file]).toString().split(" ").map(Number);
  return { width: w, height: h, bytes: statSync(file).size };
};
function prepare(slug, name, source, max = 1600) {
  const file = `${slug}-${name}.webp`;
  const target = path.join(out, file);
  const from = path.join(src, source);
  if (!existsSync(from)) {
    problems.push(`${slug}: missing source ${source}`);
    return null;
  }
  if (!existsSync(target) || statSync(target).mtimeMs < statSync(from).mtimeMs)
    execFileSync("magick", [from, "-resize", `${max}x>`, "-quality", "82", target]);
  return { url: "/library/artwork/" + file, ...size(target) };
}

const result = [];
for (const b of books) {
  const media = [];
  const cover = `/library/artwork/${b.slug}-cover.webp`;
  if (!existsSync(path.join(out, `${b.slug}-cover.webp`))) problems.push(`${b.slug}: no cover rendered`);
  else media.push({ url: cover, kind: "image", role: "cover", title: `${b.title} — cover`, alt: `Cover of the volume “${b.bookTitle ?? b.title}”.`, ...size(path.join(out, `${b.slug}-cover.webp`)) });
  const pages = [];
  for (const template of order) {
    const blocks = [];
    for (const raw of b.pages[template] ?? []) {
      if (raw.image) {
        let item;
        if (raw.image.rendered) {
          const file = path.join(out, `${b.slug}-${raw.image.name}.webp`);
          item = existsSync(file) ? { url: `/library/artwork/${b.slug}-${raw.image.name}.webp`, ...size(file) } : null;
          if (!item) problems.push(`${b.slug}: plate ${raw.image.name} not rendered`);
        } else item = prepare(b.slug, raw.image.name, raw.image.src);
        if (!item) continue;
        media.push({ ...item, kind: "image", role: raw.image.rendered ? "diagram" : "screenshot", title: `${b.title} — ${raw.image.name}`, alt: raw.text });
        blocks.push({ component: "Image", props: { text: raw.text, url: item.url } });
      } else if (raw.video) {
        let hosted = blob[raw.video.file];
        const poster = prepare(b.slug, path.basename(raw.video.file, ".mp4").replace(b.slug + "-", "") + "-poster", raw.video.poster, 1280);
        const file = path.resolve("content/media-out", raw.video.file);
        if (!hosted) {
          // No Blob object yet: ship the recording with the app.
          await mkdir("public/library/recordings", { recursive: true });
          await copyFile(file, path.join("public/library/recordings", raw.video.file));
          hosted = { url: "/library/recordings/" + raw.video.file };
        }
        const meta = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "csv=p=0", file]).toString().trim().split(/[\n,]+/);
        if (poster) media.push({ ...poster, kind: "image", role: "inline", title: `${b.title} — recording still`, alt: raw.text });
        media.push({ url: hosted.url, blobPathname: hosted.pathname, kind: "video", role: "demo", title: `${b.title} — recording`, alt: raw.text, width: +meta[0], height: +meta[1], durationS: +meta[2], bytes: statSync(file).size, mimeType: "video/mp4", poster: poster?.url });
        blocks.push({ component: "Video", props: { text: raw.text, url: hosted.url, ...(poster ? { poster: poster.url } : {}) } });
      } else blocks.push(raw);
    }
    if (blocks.length) pages.push({ template, position: pages.length + 1, blocks });
  }
  const project = { ...b };
  delete project.pages;
  result.push({ ...project, cover, media, pages });
}
// Public repository facts from GitHub (id, description, language, dates) for the repos table.
const github = {};
for (const full of new Set(result.flatMap((b) => b.repos.map((r) => r.fullName)))) {
  try {
    github[full] = JSON.parse(
      execFileSync("gh", ["api", "repos/" + full, "--jq", "{id,name,full_name,description,html_url,homepage,private,fork,archived,default_branch,language,topics,stargazers_count,forks_count,pushed_at,created_at}"], { encoding: "utf8" }),
    );
  } catch {
    problems.push("GitHub lookup failed for " + full);
  }
}
await writeFile("content/library/books.json", JSON.stringify({ schemaVersion: 1, clients, github, books: result }, null, 1));
const words = JSON.stringify(result.map((b) => b.pages)).split(/\s+/).length;
console.log(`${result.length} volumes, ${result.reduce((n, b) => n + b.pages.length, 0)} pages, ${result.reduce((n, b) => n + b.media.length, 0)} media, about ${words} words`);
if (problems.length) console.log("Notes:\n - " + problems.join("\n - "));
