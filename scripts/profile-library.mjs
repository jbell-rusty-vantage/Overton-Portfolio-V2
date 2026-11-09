// Measures an explicit fixture production build on loopback with a fresh browser cache.
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir, writeFile } from "node:fs/promises";

const port = Number(process.env.LIBRARY_PROFILE_PORT || 3082);
const base = "http://127.0.0.1:" + port;
const app = spawn(
  process.execPath,
  [
    createRequire(import.meta.url).resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      LIBRARY_CONTENT_SOURCE: "fixtures",
      DATABASE_URL: "",
      DATABASE_URL_UNPOOLED: "",
      LIBRARY_LOCAL_REVIEW: "",
      DB_DEPLOY_SKIP: "1",
    },
    stdio: "ignore",
  },
);
let browser;
try {
  for (let i = 0; i < 80; i++) {
    if (app.exitCode !== null)
      throw Error("The profile server could not start.");
    if (
      await fetch(base + "/projects")
        .then((r) => r.ok)
        .catch(() => false)
    )
      break;
    await delay(250);
  }
  browser = await chromium.launch({
    channel: "chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const results = [];
  for (const viewport of [
    { width: 1366, height: 860 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport, baseURL: base });
    await page.addInitScript(() => {
      const metrics = {
        lcp: 0,
        cls: 0,
        calls: 0,
        triangles: 0,
        frames: [],
        renderer: "",
      };
      window.libraryProfile = metrics;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) metrics.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) metrics.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
      let calls = 0,
        tris = 0,
        last = 0;
      const clock = (t) => {
        if (calls) {
          if (last && t - last < 220) metrics.frames.push(t - last);
          last = t;
          metrics.calls = Math.max(metrics.calls, calls);
          metrics.triangles = Math.max(metrics.triangles, tris);
        }
        calls = 0;
        tris = 0;
        requestAnimationFrame(clock);
      };
      requestAnimationFrame(clock);
      const gl = WebGL2RenderingContext.prototype;
      for (const method of ["drawElements", "drawArrays"]) {
        const original = gl[method];
        gl[method] = function (...args) {
          calls++;
          if (args[0] === this.TRIANGLES)
            tris += args[method === "drawElements" ? 1 : 2] / 3;
          return original.apply(this, args);
        };
      }
    });
    await page.goto("/projects");
    await page.getByRole("heading", { name: "Library catalog" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path:
        ".local-library/evidence/profile-catalog-" + viewport.width + ".png",
    });
    const catalog = await page.evaluate(() => ({
      lcp: window.libraryProfile.lcp,
      cls: window.libraryProfile.cls,
      sceneFetches: performance
        .getEntriesByType("resource")
        .filter((r) => r.name.includes(".glb")).length,
    }));
    await page.goto("/");
    await page.getByRole("button", { name: "Enter the library" }).waitFor();
    const started = Date.now();
    await page.getByRole("button", { name: "Enter the library" }).click();
    await page.locator('[data-scene="ready"]').waitFor({ timeout: 40000 });
    const coldWorldMs = Date.now() - started;
    await page.getByRole("button", { name: "Visit project stacks" }).click();
    await page
      .locator(
        '[data-pin="stacks-ai-agents"]:visible,[data-pin="stacks-data-knowledge"]:visible',
      )
      .first()
      .waitFor({ timeout: 6000 })
      .catch(() => {});
    await page.screenshot({
      path: ".local-library/evidence/profile-world-" + viewport.width + ".png",
    });
    const world = await page.evaluate(() => {
      const m = window.libraryProfile,
        gl = document.querySelector("canvas")?.getContext("webgl2");
      const debug = gl?.getExtension("WEBGL_debug_renderer_info");
      const frames = m.frames.sort((a, b) => a - b);
      return {
        scene: performance
          .getEntriesByType("resource")
          .filter((e) => e.name.endsWith(".glb"))
          .map((e) => ({
            file: new URL(e.name).pathname,
            wireBytes: e.transferSize,
            bodyBytes: e.encodedBodySize,
          })),
        renderer: debug
          ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
          : "unavailable",
        peakDrawCalls: m.calls,
        peakTriangles: m.triangles,
        drawnFrameSamples: frames.length,
        medianDrawnFrameMs: frames.length
          ? Number(frames[Math.floor(frames.length / 2)].toFixed(1))
          : null,
      };
    });
    await page.getByRole("button", { name: "Entrance page" }).click();
    const warmStart = Date.now();
    await page.getByRole("button", { name: "Enter the library" }).click();
    await page.locator('[data-scene="ready"]').waitFor();
    results.push({
      viewport,
      chrome: browser.version(),
      catalog,
      coldWorldMs,
      warmWorldMs: Date.now() - warmStart,
      world,
    });
    await page.close();
  }
  await mkdir(".local-library", { recursive: true });
  await writeFile(
    ".local-library/performance.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  app.kill();
}
