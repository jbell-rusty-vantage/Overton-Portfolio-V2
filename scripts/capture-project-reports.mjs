import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const out = process.argv[2] ?? ".local-library/showcase-review/reports";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ reducedMotion: "reduce" });
for (const [mode, width] of [["desktop", 1366], ["phone", 390]]) {
  await page.setViewportSize({ width, height: 844 });
  for (const slug of ["gowipe", "agentic-mission-control"]) {
    await page.goto(`http://127.0.0.1:3078/admin/library/preview?read=${slug}`);
    await page.locator(".project-report h1").waitFor();
    await page.screenshot({ path: `${out}/${slug}-${mode}-header.png` });
    await page.locator("#report-section-architecture").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/${slug}-${mode}-architecture.png` });
  }
}
await browser.close();
