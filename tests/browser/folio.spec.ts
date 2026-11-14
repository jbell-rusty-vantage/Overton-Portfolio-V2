import { expect, test } from "@playwright/test";
import { games } from "../../lib/performances";

const clips = games.flatMap(game => game.clips.map(clip => ({ ...clip, key: game.slug + "--" + clip.id })));
for (const mode of ["desktop", "phone"] as const) test(`${mode}: every soccer clip plays at viewing size, with one player and a remembered selection`, async ({ browser }) => {
  test.setTimeout(120000);
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3077",
    viewport: mode === "phone" ? { width: 390, height: 844 } : { width: 1366, height: 860 },
    isMobile: mode === "phone", hasTouch: mode === "phone", reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/dev/travellers-rest#screen/soccer");
  const folio = page.getByRole("region", { name: "The viewing folio", exact: true });
  await expect(folio).toBeVisible({ timeout: 60000 });
  const choices = folio.getByRole("navigation", { name: "All soccer highlights" }).getByRole("button");
  await expect(choices).toHaveCount(clips.length);
  for (const [index, clip] of clips.entries()) {
    await choices.nth(index).click();
    await expect(page).toHaveURL(new RegExp("#screen/soccer/" + clip.key + "$"));
    await expect(choices.nth(index)).toHaveAttribute("aria-pressed", "true");
    const video = folio.locator("video");
    await expect(video).toHaveCount(1);
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).toHaveAttribute("src", clip.src);
    await folio.getByRole("button", { name: "Play the recording", exact: true }).click();
    await expect.poll(() => video.evaluate(v => {
      const movie = v as HTMLVideoElement;
      return movie.videoWidth === 1280 && movie.readyState >= 2 && movie.currentTime > .15;
    })).toBe(true);
    expect((await video.boundingBox())!.width).toBeGreaterThan(mode === "phone" ? 300 : 600);
    await expect(folio.getByRole("button", { name: "Return to the cabinet" })).toBeInViewport();
  }
  await expect(folio.getByRole("button", { name: "Next clip", exact: false })).toBeDisabled();
  await page.goBack();
  await expect(choices.nth(clips.length - 2)).toHaveAttribute("aria-pressed", "true");
  await expect(folio.locator("video")).toHaveJSProperty("paused", true);
  await page.goForward();
  await expect(choices.last()).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(choices.last()).toHaveAttribute("aria-pressed", "true", { timeout: 60000 });
  await folio.getByRole("button", { name: "Return to the cabinet" }).click();
  await expect(page).toHaveURL(/#cabinet$/);
  await expect(page.locator(".folio-recording video")).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});

test("legacy free-kick links open the complete collection and native full screen returns to it", async ({ page }) => {
  await page.goto("/dev/travellers-rest#screen/film");
  const folio = page.getByRole("region", { name: "The viewing folio", exact: true });
  await expect(folio).toBeVisible({ timeout: 60000 });
  await expect(folio.getByRole("button", { name: /Free kick winner/ })).toHaveAttribute("aria-pressed", "true");
  const camera = () => page.evaluate(() => (window as unknown as { estateEngine: { camera: { position: { toArray(): number[] } } } }).estateEngine.camera.position.toArray());
  const before = await camera();
  await folio.locator("video").focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(200);
  await page.keyboard.up("ArrowRight");
  expect(await camera()).toEqual(before);
  await folio.getByRole("button", { name: "Full screen", exact: false }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.tagName)).toBe("VIDEO");
  await page.evaluate(() => document.exitFullscreen());
  await expect(folio).toBeVisible();
  await expect(folio.getByRole("navigation", { name: "All soccer highlights" }).getByRole("button")).toHaveCount(9);
});
