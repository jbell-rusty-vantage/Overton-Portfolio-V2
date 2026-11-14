// Re-capture complete source sections into the local staging directory. No writes
// to the office/database, no form submissions, no server starts or restarts.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = "assets/library/posters/section-captures";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const results = [];
for (const [name, panel, label] of [
  ["agentic-mission-control-harness", "#harness", "Inside the harness"],
  ["agentic-mission-control-report", "#report", "Accepted report"],
  ["agentic-mission-control-timeline", "#timeline", "Run timeline"],
]) {
  try {
    await page.goto("file:///C:/Users/Pinda/Digital-Services-Business/research-episode-preview.html");
    await page.getByText(label, { exact: true }).click();
    await page.locator(panel).screenshot({ path: `${out}/${name}.png` });
    results.push({ name, source: "owner-supplied local research-episode-preview.html", section: panel, bounds: await page.locator(panel).boundingBox() });
  } catch (error) { results.push({ name, error: error.message }); }
}
for (const [name, url] of [
  ["gowipe-product", "https://gowipe.co/products/facialcleansingwipes"],
  ["gowipe-science", "https://gowipe.co/pages/science"],
  ["gowipe-story", "https://gowipe.co/pages/ourstory"],
  ["daryl-davis-booking", "https://daryldavis.myshopify.com/pages/book-me"],
]) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const dismiss = page.getByText("No thanks", { exact: true }).first();
    if (await dismiss.isVisible()) await dismiss.click();
    const main = page.locator("main").first();
    const section = main.locator(".shopify-section").filter({ has: page.locator("h1") }).first();
    const target = await section.count() ? section : main;
    await target.screenshot({ path: `${out}/${name}.png`, timeout: 15000 });
    results.push({ name, source: url, section: await target.getAttribute("id"), bounds: await target.boundingBox() });
  } catch (error) { results.push({ name, error: error.message }); }
}
await browser.close();
await writeFile(`${out}/sources.json`, JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results, null, 2));
