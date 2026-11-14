import { test, expect } from "@playwright/test";

const published = process.env.RELEASE_PUBLIC === "1";
const office = published ? "/library" : "/admin/preview/library";
const selected = published ? "/" : "/admin/preview/portfolio";
const report = (slug: string) => (published ? "/projects/" : "/admin/preview/projects/") + slug;
const slugs = ["vantage-movers", "gowipe", "overtech-digital-services", "agentic-mission-control", "ai-engineer-platform", "agent-knowledge-services"];

for (const width of [1440, 390]) {
  test(`selected work → report → walkthrough → Back at ${width}px without a scene`, async ({ page }) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const sceneRequests: string[] = [];
    const errors: string[] = [];
    page.on("request", (request) => { if (/\.(glb|gltf)(\?|$)|world\/engine|World[^/]*\.js/.test(request.url())) sceneRequests.push(request.url()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(selected);
    await expect(page.locator(".pf-project")).toHaveCount(6);
    await expect(page.getByRole("article", { name: "History of Travellers Rest" })).toContainText("ratification of the 13th Amendment abolished slavery nationwide");
    for (const slug of slugs) {
      const card = page.locator("#work-" + slug);
      await card.getByRole("link", { name: /Read the case study/ }).click();
      await expect(page.locator(`[data-report="${slug}"] h1`)).toBeVisible();
      const walkthrough = page.getByRole("navigation", { name: "Report sections" }).getByRole("link", { name: /Walkthrough/i });
      await walkthrough.click();
      await expect(page).toHaveURL(/#report-section-/);
      const bounds = await page.locator(".project-report").evaluate((node) => ({ scroll: node.scrollWidth, width: innerWidth }));
      expect(bounds.scroll).toBeLessThanOrEqual(bounds.width);
      await page.getByRole("link", { name: "← Selected Work", exact: true }).click();
      await expect(card).toBeInViewport();
    }
    for (const picture of await page.locator(".portfolio img").all()) {
      await picture.scrollIntoViewIfNeeded();
      await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(sceneRequests).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `.local-library/showcase-2026/portfolio-${width}.png`, fullPage: true });
  });
}

test("entrance offers the 2D choice and browser Back preserves the selected card", async ({ page }) => {
  await page.goto(office);
  await page.getByRole("link", { name: "Browse portfolio", exact: true }).click();
  await expect(page.locator("#portfolio-title")).toBeVisible();
  const card = page.locator("#work-gowipe");
  await card.scrollIntoViewIfNeeded();
  await card.getByRole("link", { name: /Read the case study/ }).click();
  await expect(page.locator(".project-report h1")).toHaveText("GoWipe");
  await page.goBack();
  await expect(card).toBeInViewport();
});

test("keyboard navigation, résumé and the two-page PDF remain direct", async ({ page, request }) => {
  await page.goto(selected);
  await expect(page.locator("#portfolio-title")).toBeVisible();
  await page.getByRole("link", { name: "Skip to selected work" }).focus();
  await expect(page.getByRole("link", { name: "Skip to selected work" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#selected-work")).toBeInViewport();
  await page.getByRole("navigation", { name: "Portfolio navigation" }).getByRole("link", { name: "Résumé", exact: true }).click();
  await expect(page.locator("#resume-name")).toHaveText("John Overton Bell");
  await expect(page.getByRole("link", { name: "Download PDF", exact: true })).toHaveAttribute("download", "");
  const pdf = await request.get("/john-overton-bell-resume.pdf");
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("public entry and guessed URLs do not disclose hidden drafts", async ({ page, request }) => {
  test.skip(published, "Strict unpublished fixture proof runs separately on disposable data.");
  await page.goto("/projects");
  await expect(page.locator("#portfolio-title")).toBeVisible();
  await expect(page.locator(".pf-draft")).toHaveCount(0);
  // Current configured collection is unpublished. A future publication must
  // update this fixture expectation deliberately, never weaken authorization.
  for (const slug of slugs) {
    const response = await request.get("/projects/" + slug);
    expect(await response.text()).not.toContain(`data-report="${slug}"`);
  }
  await page.goto("/resume");
  await expect(page.getByRole("link", { name: "Case study", exact: true })).toHaveCount(0);
});

test("walkthrough film is controlled and its recorded scope is visible", async ({ page }) => {
  await page.goto(report("agentic-mission-control") + "#report-section-gallery");
  const film = page.locator(".report-video video").first();
  await expect(film).toBeVisible();
  expect(await film.evaluate((video: HTMLVideoElement) => video.controls && !video.autoplay && video.paused)).toBe(true);
  await film.evaluate((video: HTMLVideoElement) => { video.muted = true; return video.play(); });
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0);
  await film.evaluate((video: HTMLVideoElement) => video.pause());
  await expect(page.locator("#report-section-gallery")).toContainText(/November 9|2026-11-09/);
});

for (const width of [1366, 390]) {
  test(`all six revised books return from their report to the marked page at ${width}px`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const slug of slugs) {
      await page.goto(office + "#book/" + slug);
      const reader = page.locator(`.wb-reader[data-volume="${slug}"][data-visible]`);
      await expect(reader).toBeVisible({ timeout: 60000 });
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => reader.getAttribute("data-first-page")).not.toBe("1");
      const before = await page.locator(".wb-contents span").innerText();
      await page.getByRole("button", { name: "Open full report", exact: true }).click();
      await expect(page.locator(`dialog .project-report[data-report="${slug}"]`)).toBeVisible();
      await page.getByRole("button", { name: "Close report and return to book" }).click();
      await expect(reader).toBeVisible();
      await expect(page.locator(".wb-contents span")).toHaveText(before);
    }
  });
}
