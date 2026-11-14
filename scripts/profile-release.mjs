import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PROFILE_BASE || "http://127.0.0.1:3078";
const portfolio = process.env.PROFILE_PORTFOLIO || "/admin/preview/portfolio";
const estate = process.env.PROFILE_ESTATE || "/admin/preview/library";
const label = process.env.PROFILE_LABEL || "candidate";
const browser = await chromium.launch({ channel: "chrome" });
const results = { label, base, browser: browser.version(), profile: "Workstation Chrome; no network/CPU throttling; desktop 1366x860 and emulated 390x844", routes: [], estate: [] };
await mkdir(".local-library/release", { recursive: true });
function instrument() {
  window.releaseMetrics = { lcp: 0, cls: 0, frames: [], draws: 0, longTasks: [] };
  new PerformanceObserver(list => { for (const e of list.getEntries()) window.releaseMetrics.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.releaseMetrics.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver(list => { for (const e of list.getEntries()) window.releaseMetrics.longTasks.push(e.duration); }).observe({ type: "longtask", buffered: true });
  for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
    const original = WebGL2RenderingContext.prototype[name];
    WebGL2RenderingContext.prototype[name] = function (...args) {
      const m = window.releaseMetrics, now = performance.now();
      m.draws++;
      if (!m.frames.length || now - m.frames.at(-1) > 3) m.frames.push(now);
      return original.apply(this, args);
    };
  }
}
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 860 }, ...(process.env.PROFILE_STORAGE ? { storageState: process.env.PROFILE_STORAGE } : {}) });
    await context.addInitScript(instrument);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    let transferred = 0;
    cdp.on("Network.loadingFinished", e => { transferred += e.encodedDataLength; });
    // Compile development routes before measuring. New contexts still have cold caches.
    for (const warmth of ["cold", "warm"]) {
      transferred = 0;
      await page.goto(base + portfolio);
      await page.locator("#portfolio-title").waitFor();
      await page.waitForTimeout(2500);
      const metrics = await page.evaluate(() => ({ ...window.releaseMetrics, resources: performance.getEntriesByType("resource").map(e => ({ url: e.name, type: e.initiatorType, transfer: e.transferSize, compressed: e.encodedBodySize, decoded: e.decodedBodySize })), imagePixels: [...document.images].reduce((n, i) => n + i.naturalWidth * i.naturalHeight, 0) }));
      results.routes.push({ width, warmth, wireBytes: transferred, ...metrics });
    }
    if (process.env.PROFILE_SKIP_ESTATE !== "1") {
      for (let cycle = 0; cycle < 5; cycle++) {
        await page.goto(base + estate);
        await page.getByRole("link", { name: "Enter the library", exact: true }).first().waitFor({ timeout: 60000 });
        await page.waitForTimeout(4000);
        const entrance = await page.evaluate(() => ({ draws: window.releaseMetrics.draws, resources: performance.getEntriesByType("resource").filter(e => /\.glb/.test(e.name)).map(e => ({ url: e.name, bytes: e.encodedBodySize })) }));
        const start = performance.now();
        await page.getByRole("link", { name: "Enter the library", exact: true }).first().click();
        const canvas = page.locator("canvas[data-scene=ready]");
        await canvas.waitFor({ timeout: 90000 });
        const entryReadyMs = performance.now() - start;
        await page.waitForTimeout(5000);
        const metrics = await page.evaluate(() => {
          const m = window.releaseMetrics, f = m.frames.filter(t => t > performance.now() - 4000);
          const intervals = f.slice(1).map((t, i) => t - f[i]).sort((a, b) => a - b);
          return { draws: m.draws, p50: intervals[Math.floor(intervals.length * .5)], p95: intervals[Math.floor(intervals.length * .95)], longTasks: m.longTasks, preparation: document.querySelector("canvas[data-scene=ready]")?.getAttribute("data-preparation") };
        });
        const heap = await cdp.send("Runtime.getHeapUsage");
        results.estate.push({ width, cycle, entrance, entryReadyMs, heap, ...metrics });
        await writeFile(`.local-library/release/performance-${label}.json`, JSON.stringify(results, null, 2));
      }
    }
    await context.close();
  }
} finally {
  await writeFile(`.local-library/release/performance-${label}.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ label, routes: results.routes.map(r => ({ width: r.width, warmth: r.warmth, lcp: r.lcp, cls: r.cls, wireBytes: r.wireBytes, imagePixels: r.imagePixels })), estate: results.estate.map(r => ({ width: r.width, cycle: r.cycle, entryReadyMs: r.entryReadyMs, p95: r.p95 })) }, null, 2));
