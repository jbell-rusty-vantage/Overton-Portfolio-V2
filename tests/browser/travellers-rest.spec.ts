import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const path = "/dev/travellers-rest?study=1";
const evidence = ".local-library/evidence/travellers-rest";
test.beforeAll(() => mkdir(evidence, { recursive: true }).then(() => {}));

test("the house visit leads through the surveyed library before either modern exhibit", async ({
  page,
}) => {
  const media: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (/\/performances\/|\.mp4/.test(request.url())) media.push(request.url());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Travellers Rest", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".tr-frame img")).toHaveJSProperty(
    "naturalWidth",
    1024,
  );
  await page.screenshot({ path: evidence + "/approach.png" });
  const sources = page.getByRole("button", { name: "Sources" });
  await sources.click();
  await expect(
    page.getByRole("link", { name: "The house survey" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sources).toBeFocused();
  await page.getByRole("button", { name: "Enter the house" }).click();
  await expect(page.getByAltText(/First-floor survey plan/)).toBeVisible();
  await page.getByRole("button", { name: "Step into the library" }).click();
  await page.getByRole("button", { name: "Survey photograph" }).click();
  await expect(
    page.getByAltText(/Survey photograph of the west fireplace/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Room study" }).click();
  await expect(page.locator(".tr-frame img")).toHaveJSProperty(
    "naturalWidth",
    1280,
  );
  await page.screenshot({ path: evidence + "/library.png" });
  await page.getByRole("button", { name: "Open the house book" }).click();
  for (const title of [
    "Before the house",
    "The hands that built it",
    "A judge and a campaign",
  ]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByRole("button", { name: "Turn the page" }).click();
  }
  await expect(
    page.getByRole("heading", { name: "A reader’s working life" }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "A judge and a campaign" }),
  ).toBeVisible();
  await page.goForward();
  await page.getByRole("button", { name: "Open the family cabinet" }).click();
  await expect(
    page.getByRole("heading", { name: "The family cabinet" }),
  ).toBeVisible();
  expect(media).toEqual([]);
  await page.getByRole("button", { name: /Open two screens/ }).click();
  await page.getByRole("button", { name: /Side screen/ }).click();
  await expect(
    page.getByAltText("Mission Control project case study"),
  ).toBeVisible();
  await page.getByRole("button", { name: /Main screen/ }).click();
  await page.locator("video").evaluate((v) => (v as HTMLVideoElement).play());
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  expect(media.some((url) => url.includes("/performances/"))).toBe(false);
  await page.getByRole("button", { name: /Thread the projector/ }).click();
  await expect(page.locator("video")).toHaveJSProperty("paused", true);
  await page.locator("video").evaluate((v) => (v as HTMLVideoElement).play());
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("video")).toHaveCount(0);
  await page.getByRole("button", { name: "Return to the marked leaf" }).click();
  await expect(
    page.getByRole("heading", { name: "A reader’s working life" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("both editable models load and accept keyboard rotation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  for (const [step, model] of [
    ["approach", "house"],
    ["library", "library"],
  ]) {
    await page.goto(path + "#" + step);
    const loaded = page.waitForResponse(
      (r) => r.url().endsWith("/" + model + ".glb") && r.ok(),
    );
    await page.getByRole("button", { name: "Explore in 3D" }).click();
    await loaded;
    await expect(page.locator("canvas")).toBeVisible();
    await page.getByRole("button", { name: "Rotate left" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Rotate left" }),
    ).toBeFocused();
    await page.screenshot({ path: evidence + "/" + model + "-3d.png" });
    const canvas = page.locator("canvas");
    const frame = await canvas.boundingBox();
    if (!frame) throw new Error("Model viewport is missing");
    // After one left turn these points lie on the front door and the writing table.
    const point =
      model === "house" ? { x: 0.47, y: 0.69 } : { x: 0.32, y: 0.63 };
    await canvas.click({
      position: { x: frame.width * point.x, y: frame.height * point.y },
    });
    await expect(page).toHaveURL(model === "house" ? /#entry$/ : /#leaf-1$/);
  }
  expect(errors).toEqual([]);
});

test("phone visitors can navigate and read without loading 3D", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page.screenshot({ path: evidence + "/phone.png" });
  const enter = page.getByRole("button", { name: "Enter the house" });
  await enter.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.getByRole("button", { name: "Step into the library" }).click();
  await page.getByRole("button", { name: "Open the house book" }).click();
  await expect(
    page.getByRole("heading", { name: "Before the house" }),
  ).toBeVisible();
  await expect(page.locator("canvas,video")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("the custodian and house book open the credited collection and restore the visit", async ({
  page,
}) => {
  await page.goto(path + "#library");
  const portrait = page.getByRole("button", { name: /Judge John Overton/ });
  await portrait.click();
  const dialog = page.getByRole("dialog", { name: "From the collections" });
  const selector = dialog.getByRole("combobox", {
    name: "From the collections",
  });
  await expect(selector).toHaveValue("judge-overton");
  await expect(dialog.getByRole("img")).toHaveJSProperty("naturalWidth", 1277);
  await page.screenshot({ path: evidence + "/portrait-collection.png" });
  await dialog.getByText("Credit and image terms").click();
  await expect(dialog.getByText(/Nell Savage Mahoney Papers/)).toBeVisible();
  for (const item of [
    "andrew-jackson",
    "overton-letter",
    "election-invitation",
    "murfree-leeper",
    "tennessee-map",
    "center-hall",
    "house-color",
  ]) {
    await selector.selectOption(item);
    const image = dialog.getByRole("img");
    await expect(image).toHaveAttribute(
      "src",
      "/travellers-rest/archive/" + item + ".webp",
    );
    await expect
      .poll(() =>
        image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  await selector.selectOption("south-elevation");
  await expect(dialog.getByRole("img")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(portrait).toBeFocused();
  await page.getByRole("button", { name: "Open the house book" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  const brothers = page.getByRole("button", {
    name: /Read about William and Franklin/,
  });
  await brothers.click();
  await expect(selector).toHaveValue("william-franklin");
  await expect(dialog.getByRole("img")).toHaveCount(0);
  await expect(
    dialog.getByRole("link", { name: /William’s record/ }),
  ).toHaveAttribute("href", /items\/show\/100$/);
  await expect(
    dialog.getByRole("link", { name: /Franklin’s record/ }),
  ).toHaveAttribute("href", /items\/show\/101$/);
  await page.keyboard.press("Escape");
  await expect(brothers).toBeFocused();
  await expect(page).toHaveURL(/#leaf-2$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Collection", exact: true }).click();
  await expect(selector).toHaveValue("judge-overton");
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: evidence + "/portrait-phone.png" });
});
