// Captures screenshots and scroll recordings of live sites for the Library's project media.
// Usage: node scripts/capture-showcase.mjs <manifest.json> [slug ...]
// Originals land in content/media-src/<slug>/ (not shipped). Nothing is uploaded or written to the DB.
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const [manifestPath, ...only] = process.argv.slice(2);
if (!manifestPath) throw Error("Pass a capture manifest");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const outRoot = path.resolve("content/media-src");
const sizes = {
  desktop: { width: 1440, height: 900 },
  wide: { width: 1600, height: 1000 },
  mobile: { width: 390, height: 844 },
};
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--enable-unsafe-swiftshader"],
});
const failures = [];

async function settle(page, shot) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(shot.waitMs ?? 1200);
  // Dismiss overlays that would cover the page in a still.
  for (const text of shot.dismiss ?? []) {
    for (const b of [
      page.getByRole("button", { name: text }).first(),
      page.getByText(text, { exact: false }).first(),
    ]) {
      if (await b.isVisible().catch(() => false)) {
        await b.click().catch(() => {});
        await page.waitForTimeout(600);
        break;
      }
    }
  }
  if (shot.hide?.length)
    await page.addStyleTag({
      content: shot.hide.join(",") + "{display:none!important;visibility:hidden!important}",
    });
  // Floating chat bubbles and promo tabs in the bottom corners distract in a still.
  if (shot.cleanCorners !== false)
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed") continue;
        const r = el.getBoundingClientRect();
        if (!r.width || r.width > innerWidth * 0.45 || r.height > innerHeight * 0.4) continue;
        if (r.bottom > innerHeight - 200 && (r.left < 200 || r.right > innerWidth - 200))
          el.style.setProperty("display", "none", "important");
      }
    });
  for (const step of shot.steps ?? []) {
    if (step.click) await page.locator(step.click).first().click({ timeout: 8000 });
    if (step.clickText) await page.getByText(step.clickText, { exact: false }).first().click({ timeout: 8000 });
    if (step.fill) await page.locator(step.fill[0]).first().fill(step.fill[1]);
    if (step.press) await page.keyboard.press(step.press);
    if (step.scrollTo != null)
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), step.scrollTo);
    if (step.scrollToText)
      await page.getByText(step.scrollToText, { exact: false }).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(step.waitMs ?? 700);
  }
}

for (const shot of manifest.shots) {
  if (only.length && !only.includes(shot.slug)) continue;
  const dir = path.join(outRoot, shot.slug);
  await mkdir(dir, { recursive: true });
  // Re-runs only fill gaps; delete a file to retake it.
  if (existsSync(path.join(dir, shot.name + (shot.video ? ".webm" : ".png")))) continue;
  const viewport = sizes[shot.size ?? "desktop"];
  const video = shot.video;
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: video ? 1 : (shot.scale ?? 2),
    isMobile: shot.size === "mobile",
    hasTouch: shot.size === "mobile",
    colorScheme: shot.colorScheme ?? "light",
    reducedMotion: video ? "no-preference" : "reduce",
    ...(video ? { recordVideo: { dir, size: viewport } } : {}),
  });
  const opened = Date.now();
  const page = await context.newPage();
  try {
    await page.goto(shot.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await settle(page, shot);
    if (video) {
      // Slow, even scroll through the page; pauses at each stop if given.
      const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const distance = Math.min(total, video.maxScroll ?? 6000);
      const seconds = video.seconds ?? 14;
      // The recording starts at context creation; note where the scroll begins so the load can be trimmed.
      const trimStart = Math.max(0, (Date.now() - opened) / 1000 - 0.8);
      await page.evaluate(
        ([distance, ms]) =>
          new Promise((done) => {
            const t0 = performance.now();
            const tick = (now) => {
              const t = Math.min(1, (now - t0) / ms);
              const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
              window.scrollTo(0, Math.round(distance * eased));
              if (t < 1) requestAnimationFrame(tick);
              else done();
            };
            requestAnimationFrame(tick);
          }),
        [distance, seconds * 1000],
      );
      await writeFile(path.join(dir, shot.name + ".json"), JSON.stringify({ trimStart, seconds: seconds + 1.6 }));
      await page.waitForTimeout(900);
      const file = await page.video().path();
      await context.close();
      const target = path.join(dir, shot.name + ".webm");
      await rm(target, { force: true });
      await rename(file, target);
      console.log("video", shot.slug, shot.name);
      continue;
    }
    await page.screenshot({
      path: path.join(dir, shot.name + ".png"),
      fullPage: !!shot.fullPage,
      ...(shot.clip ? { clip: shot.clip } : {}),
    });
    console.log("still", shot.slug, shot.name);
  } catch (error) {
    failures.push(shot.slug + "/" + shot.name + ": " + String(error.message).split("\n")[0]);
  }
  await context.close().catch(() => {});
}
await browser.close();
if (failures.length) {
  console.error("Failed:\n" + failures.join("\n"));
  process.exitCode = 1;
}
