import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const out = ".local-library/showcase-2026/visuals";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await page.goto("http://127.0.0.1:3078/admin/library/preview?portfolio=1");
    await page.locator(".pf-project").first().waitFor();
    for (const img of await page.locator(".portfolio img").all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((node) => node.decode());
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${out}/entry-${width}.png` });
    await page.locator("#selected-work").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/selected-${width}.png` });
    await page.locator(".pf-history").screenshot({ path: `${out}/history-${width}.png` });
    for (const slug of ["vantage-movers", "gowipe", "overtech-digital-services", "agentic-mission-control", "ai-engineer-platform", "agent-knowledge-services"]) {
      await page.goto(`http://127.0.0.1:3078/admin/library/preview?read=${slug}`);
      await page.locator(".project-report h1").waitFor();
      await page.screenshot({ path: `${out}/${slug}-${width}.png` });
      await page.getByRole("navigation", { name: "Report sections" }).getByRole("link", { name: /Walkthrough/ }).click();
      await page.screenshot({ path: `${out}/${slug}-task-${width}.png` });
    }
    await page.close();
  }
} finally { await browser.close(); }
console.log("Captured desktop and emulated-phone entry, cards and six report journeys.");
