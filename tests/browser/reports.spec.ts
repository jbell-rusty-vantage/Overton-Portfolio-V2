import { test, expect } from "@playwright/test";
const published = process.env.RELEASE_PUBLIC === "1";
const office = published ? "/library" : "/admin/preview/library";
const reportPath = (slug: string) => (published ? "/projects/" : "/admin/preview/projects/") + slug;
const allSlugs = ["agentic-mission-control", "agent-knowledge-services", "ai-engineer-platform", "ai-engineer-worldsfair-showcase", "biotech-knowledge-platform", "biotech-research-ingestion", "human-upgrade-ingestion-pipeline", "polymarket-mcp-server", "the-library", "overtech-digital-services", "vantage-lead-analytics", "vantage-movers", "gowipe", "daryl-davis"];
const slugs = published ? ["vantage-movers", "gowipe", "overtech-digital-services", "agentic-mission-control", "ai-engineer-platform", "agent-knowledge-services"] : allSlugs;


test("the selected report collection keeps its sections and whole figures at desktop and phone width", async ({ page }) => {
  test.setTimeout(180000);
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const slug of slugs) {
      await page.goto(reportPath(slug));
      const report = page.locator("[data-report='" + slug + "']");
      await expect(report.locator("h1")).toBeVisible();
      const sections = report.locator("article section[data-section]");
      expect(await sections.count(), slug + " sections").toBeGreaterThan(1);
      expect(await report.locator("nav[aria-label='Report sections'] a").count()).toBe(await sections.count());
      const bounds = await report.evaluate((node) => ({ width: node.scrollWidth, viewport: innerWidth }));
      expect(bounds.width, slug + " fits viewport").toBeLessThanOrEqual(bounds.viewport);
      for (const picture of await report.locator("figure img").all()) {
        await picture.scrollIntoViewIfNeeded();
        await expect(picture).toBeVisible();
        await expect.poll(() => picture.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0), { message: slug + " figure loads" }).toBe(true);
        const fit = await picture.evaluate((node: HTMLImageElement) => ({ natural: node.naturalWidth / node.naturalHeight, fit: getComputedStyle(node).objectFit }));
        expect(fit.natural).toBeGreaterThan(0);
        expect(fit.fit).toBe("contain");
      }
    }
  }
});

test("report sections are linkable, figures trap focus and Escape returns to the report", async ({ page }) => {
  await page.goto(reportPath("gowipe"));
  const nav = page.getByRole("navigation", { name: "Report sections" });
  await nav.locator('a[href="#report-section-architecture"]').click();
  await expect(page).toHaveURL(/#report-section-architecture$/);
  await page.reload();
  await expect(page.locator("#report-section-architecture")).toBeInViewport();
  const figure = page.locator("#report-section-architecture .report-figure").first();
  await figure.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(figure).toBeFocused();
});

test("report prose and links are server-rendered in the authorized response", async ({ request }) => {
  const response = await request.get(reportPath("gowipe"));
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('data-report="gowipe"');
  expect(html).toContain("<h1>GoWipe</h1>");
  expect(html).toContain('href="https://gowipe.co/products/facialcleansingwipes"');
  // The office's streaming Suspense wrapper itself requires JS to reveal the
  // response. Server-rendered content is verified here; no-JS office usability
  // is a documented host limitation, not a claim made by this test.
});

test("cabinet warm-up finishes its current measurement when a visitor selects a book", async ({ page }) => {
  test.setTimeout(90000);
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const pending = new Promise<void>((resolve) => { requested = resolve; });
  await page.route("**/agentic-mission-control-timeline-v2.webp", async (route) => {
    requested();
    await gate;
    await route.continue();
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(office + "#cabinet");
  await pending;
  const measuring = page.locator("body > .wb-measure");
  await expect(measuring).toHaveCount(1);
  await page.evaluate(() => { location.hash = "#book/gowipe"; });
  await expect(page.locator('.wb-reader[data-volume="gowipe"]')).toHaveCount(1);
  // Its image is still pending: cancellation must not detach the in-flight host.
  await expect(measuring).toHaveCount(1);
  release();
  await expect(measuring).toHaveCount(0, { timeout: 10000 });
  await expect(page.locator('.wb-reader[data-visible][data-volume="gowipe"]')).toBeVisible({ timeout: 60000 });
  expect(await page.locator(".wb-pages .wb-page").first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});

// Coordinator integration qualification: deliberately not skipped. The report route
// and engine pausing are owned by World, and must pass before this journey is claimed.
test("world report closes to the same page through Escape, history and reload", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(office + "#book/gowipe");
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 60000 });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".wb-contents span")).toContainText("Pages 3–4 of");
  const before = await page.locator(".wb-contents span").innerText();
  await page.getByRole("button", { name: "Open full report", exact: true }).click();
  await expect(page).toHaveURL(/#report\/gowipe/);
  await expect(page.getByRole("dialog", { name: "GoWipe full report" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible();
  await expect(page.locator(".wb-contents span")).toHaveText(before);
  await page.getByRole("button", { name: "Open full report", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "GoWipe full report" })).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Close report and return to book" }).click();
  await expect(page.locator(".wb-contents span")).toHaveText(before);
  await page.getByRole("button", { name: "Open full report", exact: true }).click();
  await page.goBack();
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible();
  await expect(page.locator(".wb-contents span")).toHaveText(before);
});
