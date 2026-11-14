// Audit every page of every volume in the office preview.
//   node scripts/audit-book-pages.mjs <outdir> [desktop|phone|both] [slug,slug…] [base]
// Writes one screenshot per spread (desktop) or page (phone), a report.json with
// in-page measurements for every page, and contact sheets for looking through quickly.
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

const [out = ".local-library/books/before", which = "both", only = "", base = "http://127.0.0.1:3078/admin/library/preview"] = process.argv.slice(2);
const modes = which === "both" ? ["desktop", "phone"] : [which];
const browser = await chromium.launch({ channel: "chrome", executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (process.platform === "win32" && existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe") ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined),
  headless: true, args: ["--ignore-gpu-blocklist", "--enable-gpu"] });

// Runs in the page: measure both DOM pages in their own (untransformed) pixels.
function measure(rasterText = {}) {
  const reader = document.querySelector(".wb-reader");
  if (!reader) return null;
  const css = getComputedStyle(reader);
  const num = (n) => parseFloat(css.getPropertyValue(n));
  const W = num("--wb-w"), H = num("--wb-h"), top = num("--wb-top"), bottom = num("--wb-bottom"), side = num("--wb-side");
  const pages = [];
  for (const el of reader.querySelectorAll(".wb-pages > .wb-page")) {
    if (getComputedStyle(el).display === "none") continue;
    const sideName = el.classList.contains("left") ? "left" : "right";
    const sheet = el.querySelector(".wb-sheet");
    // Position of an element inside the page, ignoring the projective transform.
    const box = (n) => {
      let x = 0, y = 0, e = n;
      while (e && e !== el) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
      return { x, y, w: n.offsetWidth, h: n.offsetHeight };
    };
    const folio = el.querySelector(".wb-folio");
    const running = el.querySelector(".wb-running");
    const content = [...el.querySelectorAll(".wb-flow, .wb-plate, .wb-titlepage, .wb-halftitle, .wb-end")];
    const text = content.map((c) => c.innerText).join(" ").replace(/\s+/g, " ").trim();
    let lowest = 0, widest = 0;
    const leafs = content.flatMap((c) => [...c.querySelectorAll("*")]).filter((n) => !n.children.length || n.tagName === "P" || n.tagName === "PRE" || n.tagName === "IMG" || n.tagName === "VIDEO");
    for (const n of leafs) {
      const b = box(n);
      if (!b.w && !b.h) continue;
      lowest = Math.max(lowest, b.y + b.h);
      widest = Math.max(widest, b.x + b.w);
    }
    const pictures = [...el.querySelectorAll("img, video")].map((n) => {
      const b = box(n);
      const nw = n.naturalWidth ?? n.videoWidth ?? 0, nh = n.naturalHeight ?? n.videoHeight ?? 0;
      return {
        url: n.currentSrc || n.src,
        tag: n.tagName.toLowerCase(), loaded: n.tagName === "IMG" ? n.complete && nw > 0 : true,
        natural: [nw, nh], box: [Math.round(b.w), Math.round(b.h)], at: [Math.round(b.x), Math.round(b.y)],
        fit: getComputedStyle(n).objectFit,
        // Share of the box the picture really covers (letterboxing shows as < 1).
        cover: nw && nh && b.w && b.h ? +(Math.min(b.w / nw, b.h / nh) ** 2 * nw * nh / (b.w * b.h)).toFixed(2) : null,
        upscale: nw && b.w ? +(Math.min(b.w / nw, b.h / nh)).toFixed(2) : null,
        // DOM geometry can establish cropping/distortion, but cannot establish the
        // glyph size baked into raster pixels. Review the source or supply its font
        // metadata; never call an unmeasured raster label legible.
        cropped: nw && nh && getComputedStyle(n).objectFit === "cover" && Math.abs(nw / nh - b.w / b.h) > .02,
        smallestRasterTextPx: rasterText[new URL(n.currentSrc || n.src, location.href).pathname] ? +(rasterText[new URL(n.currentSrc || n.src, location.href).pathname].smallestFontPx * b.w / rasterText[new URL(n.currentSrc || n.src, location.href).pathname].sourceWidth).toFixed(2) : null,
        rasterTextQualification: rasterText[new URL(n.currentSrc || n.src, location.href).pathname] ? "measured from staged source-font metadata" : "requires source-font metadata or visual review",
      };
    });
    const clipped = [...el.querySelectorAll("pre, .wb-running, figcaption, h2, h3, p, a")].filter((n) => {
      const style = getComputedStyle(n);
      return (n.scrollWidth > n.clientWidth + 1 && style.overflowX === "hidden") || (n.scrollHeight > n.clientHeight + 1 && style.overflowY === "hidden");
    }).map((n) => n.tagName.toLowerCase() + (n.className ? "." + String(n.className).split(" ")[0] : ""));
    const limit = H - bottom;
    pages.push({
      side: sideName,
      empty: !sheet || !sheet.children.length,
      chars: text.length,
      folio: folio?.textContent ?? "",
      running: running?.textContent ?? "",
      kinds: content.map((c) => c.className.split(" ")[0]),
      lowest: Math.round(lowest), limit: Math.round(limit),
      overflow: Math.max(0, Math.round(lowest - limit)),
      // Figures deliberately use half the margin; only clipping beyond that is a defect.
      overflowX: Math.max(0, Math.round(widest - (W - side * .5))),
      fill: +((lowest - top) / (limit - top)).toFixed(2),
      trailingEmptyPx: Math.max(0, Math.round(limit - lowest)),
      trailingEmptyShare: +Math.max(0, (limit - lowest) / (limit - top)).toFixed(3),
      pictures, clipped,
      folioHit: folio && lowest > box(folio).y - 2,
    });
  }
  const slug = reader.dataset.volume;
  const book = window.estateEngine?.volume(slug);
  return { where: document.querySelector(".wb-contents span")?.textContent ?? "", pages,
    first: Number(reader.dataset.firstPage), last: Number(reader.dataset.lastPage), total: Number(reader.dataset.totalPages),
    nativeInk: !!reader.hasAttribute("data-visible") && book?.ink === false,
    opaquePaper: [...reader.querySelectorAll(".wb-pages > .wb-page")].every(el => getComputedStyle(el).backgroundColor === "rgb(241, 231, 204)"),
  };
}

const report = {};
const coverage = {};
const rasterText = JSON.parse(await readFile("assets/library/posters/staged-media.json", "utf8").catch(() => "{}")).rasterText ?? {};
for (const mode of modes) {
  const mine = {};
  const phone = mode === "phone";
  const context = await browser.newContext({
    ...(process.env.RELEASE_STORAGE_STATE ? { storageState: process.env.RELEASE_STORAGE_STATE } : {}),
    viewport: phone ? { width: 390, height: 844 } : { width: 1366, height: 860 },
    deviceScaleFactor: phone ? 2 : 1, hasTouch: phone, isMobile: phone,
    reducedMotion: process.env.BOOK_AUDIT_MOTION === "animate" ? "no-preference" : "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
  await page.goto(base + "#cabinet", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("canvas[data-scene=ready]", { timeout: 120000 });
  await page.addStyleTag({ content: ".tw-reach,.tw-tip{display:none!important}" });
  const greeting = page.getByRole("button", { name: "Close the custodian", exact: true });
  if (await greeting.isVisible()) await greeting.click();
  const slugs = only ? only.split(",") : await page.evaluate(() => [...window.estateEngine.volumes.keys()].filter((slug) => slug !== "travellers-rest-house-book"));
  coverage[mode] = { expected: slugs, completed: [], failed: [] };
  const dir = path.join(out, mode);
  await mkdir(dir, { recursive: true });
  const tries = {};
  for (let at = 0; at < slugs.length; at++) {
    const slug = slugs[at];
    // The preview hot-reloads when anyone edits the tree: a volume interrupted by a
    // reload is simply audited again.
    try {
    await page.evaluate((s) => { location.hash = "#book/" + s; }, slug);
    try {
      await page.waitForSelector(`.wb-reader[data-visible][data-volume="${slug}"]`, { timeout: 30000 });
    } catch { console.log("did not open:", slug); coverage[mode].failed.push(slug); continue; }
    await page.waitForTimeout(500);
    const entries = [];
    for (let i = 0; i < 80; i++) {
      await page.waitForFunction((slug) => {
        const reader = document.querySelector(`.wb-reader[data-visible][data-volume="${slug}"]`);
        return reader && [...reader.querySelectorAll(".wb-pages > .wb-page")].filter((el) => getComputedStyle(el).display !== "none").every((el) => { const r = el.getBoundingClientRect(); return r.width > 100 && r.height > 100; });
      }, slug, { timeout: 15000 });
      // Give pictures on this page a moment to arrive.
      await page.waitForFunction(() => [...document.querySelectorAll(".wb-pages img")].every((n) => n.complete), null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(250);
      const m = await page.evaluate(measure, rasterText);
      if (entries.some((entry) => entry.where === m.where)) throw Error("Repeated page marker during capture: " + m.where);
      const file = slug + "-" + String(i + 1).padStart(2, "0") + ".png";
      const clip = await page.evaluate(() => {
        const r = [...document.querySelectorAll(".wb-pages > .wb-page")].filter((e) => getComputedStyle(e).display !== "none").map((e) => e.getBoundingClientRect());
        const x0 = Math.min(...r.map((b) => b.left)), y0 = Math.min(...r.map((b) => b.top)), x1 = Math.max(...r.map((b) => b.right)), y1 = Math.max(...r.map((b) => b.bottom));
        return { x: Math.max(0, x0 - 8), y: Math.max(0, y0 - 8), width: Math.min(innerWidth, x1 + 8) - Math.max(0, x0 - 8), height: Math.min(innerHeight, y1 + 8) - Math.max(0, y0 - 8) };
      });
      await page.screenshot({ path: path.join(dir, file), clip });
      const next = page.getByRole("button", { name: "Next page" });
      // Is the toolbar's own Next button reachable, or does a neighbour cover it?
      const covered = await next.evaluate((b) => { const r = b.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(at === b || b.contains(at)); });
      entries.push({ file, toolbarCovered: covered, ...m });
      if (await next.isDisabled()) break;
      const before = m.where;
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction((b) => document.querySelector(".wb-contents span")?.textContent !== b && !!document.querySelector(".wb-reader[data-visible]"), before, { timeout: 10000 });
    }
    mine[mode + ":" + slug] = entries;
    const numbers = entries.flatMap(entry => Array.from({ length: entry.last - entry.first + 1 }, (_, i) => entry.first + i));
    const total = entries[0]?.total;
    if (numbers.length !== total || numbers.some((n, i) => n !== i + 1) || entries.some(e => !e.nativeInk || !e.opaquePaper))
      throw Error("Incomplete page sequence or lost native reading surface: " + slug);
    coverage[mode].completed.push(slug);
    console.log(mode, slug, entries.length, "views");
    await page.evaluate(() => { location.hash = "#cabinet"; });
    await page.waitForSelector(".wb-reader", { state: "detached", timeout: 15000 });
    await page.waitForTimeout(400);
    } catch (error) {
      tries[slug] = (tries[slug] ?? 0) + 1;
      console.log("interrupted:", slug, String(error.message).slice(0, 120));
      if (tries[slug] > 3) { coverage[mode].failed.push(slug); continue; }
      await page.goto(base + "#cabinet", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("canvas[data-scene=ready]", { timeout: 120000 });
      await page.addStyleTag({ content: ".tw-reach,.tw-tip{display:none!important}" });
      if (await greeting.isVisible()) await greeting.click();
      at--;
    }
  }
  coverage[mode].browserErrors = [...new Set(errors)];
  if (errors.length) console.log(mode, "errors:", coverage[mode].browserErrors.slice(0, 8));
  // Contact sheets.
  await writeFile(path.join(out, "report-" + mode + ".json"), JSON.stringify(mine, null, 1));
  await context.close();
}
await writeFile(path.join(out, "coverage.json"), JSON.stringify(coverage, null, 2));
for (const mode of ["desktop", "phone"]) Object.assign(report, JSON.parse(await readFile(path.join(out, "report-" + mode + ".json"), "utf8").catch(() => "{}")));
// Summary of measurable defects.
const tally = { views: 0, pages: 0, blank: 0, sparse: 0, overflow: 0, overflowX: 0, folioHit: 0, letterboxed: 0, cropped: 0, smallKnownRasterText: 0, unknownRasterText: 0, unloaded: 0, video: 0, clippedText: 0, toolbarCovered: 0 };
const lines = [];
for (const [key, entries] of Object.entries(report))
  for (const e of entries) {
    tally.views++;
    if (e.toolbarCovered) { tally.toolbarCovered++; lines.push(key + " " + e.file + ": toolbar Next covered"); }
    for (const p of e.pages ?? []) {
      tally.pages++;
      const flags = [];
      if (p.empty || (p.chars === 0 && !p.pictures.length)) { tally.blank++; flags.push("blank"); }
      else if (p.fill < 0.25 && !p.kinds.includes("wb-plate") && !p.kinds.includes("wb-titlepage")) { tally.sparse++; flags.push("sparse " + p.fill); }
      if (p.overflow > 1) { tally.overflow++; flags.push("overflow " + p.overflow + "px"); }
      if (p.overflowX > 1) { tally.overflowX++; flags.push("overflowX " + p.overflowX + "px"); }
      if (p.folioHit) { tally.folioHit++; flags.push("folio collision"); }
      for (const pic of p.pictures) {
        if (pic.cropped) { tally.cropped++; flags.push("cropped picture"); }
        if (pic.tag === "img" && pic.smallestRasterTextPx === null) tally.unknownRasterText++;
        if (pic.smallestRasterTextPx !== null && pic.smallestRasterTextPx < 12) { tally.smallKnownRasterText++; flags.push("raster text " + pic.smallestRasterTextPx + "px"); }
        if (pic.tag === "video") { tally.video++; flags.push("video " + pic.box.join("x")); }
        else if (!pic.loaded) { tally.unloaded++; flags.push("image not loaded"); }
        else if (pic.cover !== null && pic.cover < 0.9 && pic.fit === "contain") { tally.letterboxed++; flags.push("letterboxed " + pic.natural.join("x") + " in " + pic.box.join("x") + " cover " + pic.cover); }
      }
      if (p.clipped.length) { tally.clippedText++; flags.push("clipped " + p.clipped.join(",")); }
      if (flags.length) lines.push(key + " " + e.file + " " + p.side + " f" + p.folio + ": " + flags.join("; "));
    }
  }
await writeFile(path.join(out, "summary.txt"), JSON.stringify(tally) + "\n" + lines.join("\n") + "\n");
console.log(JSON.stringify(tally));
console.log(lines.length, "flagged pages; see", path.join(out, "summary.txt"));
await browser.close();
if (Object.values(coverage).some((mode) => mode.failed.length || mode.completed.length !== mode.expected.length || mode.browserErrors.length) || ["blank", "overflow", "overflowX", "folioHit", "letterboxed", "cropped", "smallKnownRasterText", "unloaded", "clippedText", "toolbarCovered"].some((key) => tally[key])) process.exitCode = 1;
