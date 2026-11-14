// Contact sheets from an audit folder: node scripts/contact-book-pages.mjs <outdir> [desktop|phone] [filter]
import { chromium } from "@playwright/test";
import { readdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const [out = ".local-library/books/before", only = "", filter = ""] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
for (const mode of only ? [only] : ["desktop", "phone"]) {
  const dir = path.resolve(out, mode);
  const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith(".png") && f.includes(filter)).sort();
  const per = mode === "phone" ? 12 : 6, cols = mode === "phone" ? 6 : 3;
  for (let i = 0, n = 1; i < files.length; i += per, n++) {
    const html = "<body style='margin:0;background:#222;font:12px sans-serif;color:#ddd'><div style='display:grid;grid-template-columns:repeat(" + cols + ",1fr);gap:6px;padding:6px'>" +
      files.slice(i, i + per).map((f) => "<div><div>" + f + "</div><img style='width:100%;display:block' src='" + pathToFileURL(path.join(dir, f)).href + "'></div>").join("") + "</div></body>";
    const tmp = path.join(dir, "_sheet.html");
    await writeFile(tmp, html);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await page.screenshot({ path: path.join(out, "sheet-" + mode + (filter ? "-" + filter : "") + "-" + String(n).padStart(2, "0") + ".jpg"), fullPage: true, type: "jpeg", quality: 80 });
    await unlink(tmp);
  }
  console.log(mode, files.length, "images");
}
await browser.close();
const sheets = (await readdir(out)).filter((file) => /^sheet-(desktop|phone).*\.jpg$/.test(file)).sort();
const summary = await readFile(path.join(out, "summary.txt"), "utf8").catch(() => "Audit summary is not present.");
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
await writeFile(path.join(out, "index.html"), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Book page review</title><style>body{margin:32px auto;max-width:1800px;padding:0 20px;background:#ece9df;color:#28332b;font:16px/1.6 system-ui}h1{font:42px Georgia}a{color:inherit}pre{white-space:pre-wrap;font-size:12px}figure{margin:36px 0}img{display:block;width:100%;height:auto}nav{display:flex;gap:20px;flex-wrap:wrap}</style><h1>Book page review</h1><p>Every captured page is below. Open a contact sheet for its full-size image. Measurements establish DOM fit and known diagram lettering; source screenshots still need visual judgment.</p><nav><a href="coverage.json">Book coverage and browser errors</a><a href="report-desktop.json">Desktop measurements</a><a href="report-phone.json">Phone measurements</a><a href="summary.txt">Audit summary</a></nav><details><summary>Measured results</summary><pre>${escape(summary)}</pre></details>${sheets.map((file) => `<figure><figcaption><a href="${escape(file)}">${escape(file)}</a></figcaption><a href="${escape(file)}"><img loading="lazy" src="${escape(file)}" alt="${escape(file)}"></a></figure>`).join("")}</html>`);
