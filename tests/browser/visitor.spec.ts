import { test, expect } from "@playwright/test";
const office = "http://127.0.0.1:3078/admin/library/preview";
type DrawingProbe = { estateEngine: { invalidate(): void; renderer: { info: { render: { frame: number } } } } };
test("upper landing survives reload and Back and returns downstairs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(office + "#entry");
  await expect(page.locator(".tw[data-ready]")).toBeVisible({ timeout: 90000 });
  await page.getByRole("button", { name: "Directory", exact: true }).click();
  await page.getByRole("button", { name: "The upper landing" }).click();
  await expect(page.getByRole("complementary", { name: "Upper landing reconstruction" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Plan of the ground floor" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("complementary", { name: "Upper landing reconstruction" })).toBeVisible({ timeout: 90000 });
  await page.getByRole("button", { name: "Return downstairs", exact: true }).click();
  await expect(page).toHaveURL(/#entry$/);
  await expect(page.getByRole("complementary", { name: "Upper landing reconstruction" })).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/#landing$/);
  await expect(page.getByRole("complementary", { name: "Upper landing reconstruction" })).toBeVisible();
});

test("a report stops world draws and closing resumes them", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(office + "#book/gowipe");
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 90000 });
  const frames = () => page.evaluate(async () => {
    const engine = (window as unknown as DrawingProbe).estateEngine;
    const before = engine.renderer.info.render.frame;
    // A reduced-motion room intentionally rests when unchanged. Request a redraw
    // in both states: the overlay must suppress it; closing must permit it.
    engine.invalidate();
    for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);
    return engine.renderer.info.render.frame - before;
  });
  await page.getByRole("button", { name: "Open full report", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "GoWipe full report" })).toBeVisible();
  await expect.poll(frames).toBe(0);
  await page.keyboard.press("Escape");
  await expect.poll(frames).toBeGreaterThan(0);
});

test("neighbor reports close to their own book and plain view keeps that destination", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(office + "#report/gowipe/architecture/front/3");
  await expect(page.getByRole("dialog", { name: "GoWipe full report" })).toBeVisible({ timeout: 90000 });
  await page.locator(".report-footer a").last().click();
  const slug = new URL(page.url()).hash.split("/")[1];
  expect(slug).not.toBe("gowipe");
  await page.getByRole("button", { name: "Close report and return to book" }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe("#book/" + slug);
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 45000 });
  await page.getByRole("button", { name: "Directory", exact: true }).click();
  await page.getByRole("button", { name: "Plain page view", exact: true }).click();
  await expect(page.locator("[data-report='" + slug + "']")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Judge Overton", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#report\/gowipe\/architecture\/front\/3$/);
});

test("live entrance and authored tour yield to visitor control", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(office);
  await expect(page.locator(".ea-live-first-frame")).toHaveAttribute("data-ready", "true", { timeout: 90000 });
  await page.getByRole("link", { name: "Enter the library", exact: true }).first().click();
  await expect(page.getByLabel(/^The library at Travellers Rest,/)).toHaveAttribute("data-scene", "ready", { timeout: 90000 });
  const tour = page.getByRole("complementary", { name: "Guided visit" });
  await tour.getByRole("button", { name: "Let the custodian lead a tour" }).click();
  await expect(tour).toContainText("1 / 6");
  await tour.getByRole("button", { name: "Pause tour", exact: true }).click();
  await tour.getByRole("button", { name: "Resume tour", exact: true }).click();
  await tour.getByRole("button", { name: "Next tour stop" }).click();
  await expect(tour).toContainText("Before the house");
  await page.keyboard.press("w");
  await expect(tour).toContainText("Tour stopped");
});

test("reduced motion retains the narration clock and atmosphere controls require a sound choice", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(office + "#portrait");
  const guide = page.getByRole("region", { name: "Judge John Overton, the custodian" });
  await guide.getByRole("button", { name: "Hear his welcome" }).click();
  await expect(guide).toContainText("Where shall we begin?");
  await guide.getByRole("button", { name: "Pause the custodian" }).click();
  await expect(guide.getByRole("button", { name: "Resume the custodian" })).toBeVisible();
  await guide.getByRole("button", { name: "Close the custodian" }).click();
  await page.getByRole("button", { name: "How to move", exact: true }).click();
  const help = page.getByRole("complementary", { name: "How to move", exact: true });
  await expect(help.getByRole("button", { name: "Turn on wind and footsteps" })).toHaveAttribute("aria-pressed", "false");
  await help.getByLabel("Daylight", { exact: true }).selectOption("dusk");
  await help.getByLabel("Season", { exact: true }).selectOption("autumn");
  await expect(help.getByLabel("Daylight", { exact: true })).toHaveValue("dusk");
  await expect(help.getByLabel("Season", { exact: true })).toHaveValue("autumn");
});

test("portrait panel keeps field keys out of the book and fits phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(office + "#book/gowipe/front/3");
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 90000 });
  await expect(page.getByRole("region", { name: "Judge John Overton, the custodian", exact: true })).toHaveCount(0);
  const marker = new URL(page.url()).hash;
  await page.getByRole("button", { name: "Ask Judge Overton", exact: true }).click();
  const portrait = page.getByRole("complementary", { name: "Ask Judge Overton" });
  await expect(portrait).toHaveCSS("background-color", "rgb(32, 38, 33)");
  await portrait.getByLabel("Your question").fill("A question to edit");
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  expect(new URL(page.url()).hash).toBe(marker);
  const bounds = await portrait.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(portrait).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe(marker);
});
