import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import manifest from "../../assets/library/manifest.json" with { type: "json" };
const { zones, shelves } = manifest;

const dir = ".local-library/evidence";
test.beforeAll(async () => {
  await mkdir(dir, { recursive: true });
});
const shot = (page: Page, name: string) =>
  page.screenshot({ path: dir + "/" + name + ".png", animations: "disabled" });
async function worldReady(page: Page) {
  await expect(page.locator("[data-scene]")).toHaveAttribute(
    "data-scene",
    "ready",
    { timeout: 40000 },
  );
  await expect(page.locator("canvas")).toBeVisible();
}
test("a physical project binding opens its reader, follows history and survives reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/samples");
  await page.getByRole("button", { name: "Enter the library" }).click();
  await worldReady(page);
  await page.getByRole("button", { name: "Visit project stacks" }).click();
  await page
    .getByRole("button", { name: "Agent systems", exact: true })
    .last()
    .click();
  const meshLabel = page.locator('[data-pin="demo-agent-workbench"]');
  await expect(meshLabel).toBeVisible();
  await shot(page, "sample-shelf");
  await meshLabel.click();
  const dialog = page.getByRole("dialog", { name: "Agent Workbench" });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/page=architecture/);
  await page.reload();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.goForward();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: "Full reading page" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Agent Workbench" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("live local review shows only its scoped seed, with HTML and GLB parity", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Enter the library" }),
  ).toBeVisible();
  await shot(page, "entrance");
  test.skip(
    !(await page.getByText("Local draft preview").count()),
    "This preview uses fixtures.",
  );
  await page.goto("/projects/agentic-mission-control");
  await expect(
    page.getByRole("heading", { level: 1, name: "Mission Control" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Architecture" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open in library" }).click();
  await expect(
    page.getByRole("dialog", { name: "Mission Control" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(
    page.getByText("Temporal coordinates scheduling", { exact: false }),
  ).toBeVisible();
  await shot(page, "project-reader");
  const shelfLabel = async () => (await page.locator(".reader-copy > .eyebrow").textContent())!.split("·")[1].trim();
  const systems = await shelfLabel();
  await page.keyboard.press("Escape");
  await worldReady(page);
  await expect(
    page.getByRole("heading", { name: systems, exact: true }),
  ).toBeVisible();
  await page.goto("/projects/agent-knowledge-services");
  await expect(
    page.getByRole("heading", { level: 1, name: "Knowledge Services" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open in library" }).click();
  await expect(
    page.getByRole("dialog", { name: "Knowledge Services" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Knowledge Services" }),
  ).toBeVisible();
  const knowledge = await shelfLabel();
  await page.keyboard.press("Escape");
  await worldReady(page);
  await expect(
    page.getByRole("heading", { name: knowledge, exact: true }),
  ).toBeVisible();
});
test("every room and every shelf has an accessible destination", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/samples?view=world&zone=entrance");
  await worldReady(page);
  for (const z of zones) {
    await page.getByRole("button", { name: "Directory", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: new RegExp("^" + z.title) })
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: z.title }),
    ).toBeVisible();
    await shot(page, "room-" + z.slug);
    for (const shelf of shelves.filter((s) => s.zone === z.slug)) {
      await page
        .getByRole("button", { name: shelf.title, exact: true })
        .last()
        .click();
      await expect(
        page.getByRole("heading", { name: shelf.title }),
      ).toBeVisible();
      await page.getByRole("button", { name: "All shelves" }).click();
    }
  }
  await page.getByRole("button", { name: "Catalog terminal" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await page.getByRole("button", { name: "Start guided visit" }).click();
  await page.getByRole("button", { name: "Next room" }).click();
  await expect(page).toHaveURL(/zone=stacks.*tour=guided/);
  await page.getByRole("button", { name: "End visit" }).click();
  await expect(page).not.toHaveURL(/tour=guided/);
});
test("phone catalog, keyboard reader and reduced-motion world remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/samples?catalog=1");
  const search = page.getByRole("searchbox", { name: "Search the catalog" });
  await search.fill("unfindable sample");
  await expect(page.getByText("No volumes match this search.")).toBeVisible();
  await search.fill("Knowledge Atlas");
  await shot(page, "phone-catalog");
  await page.getByRole("link", { name: /Knowledge Atlas/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { level: 1, name: "Knowledge Atlas" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open in library" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot(page, "phone-reader");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await worldReady(page);
  await shot(page, "phone-world");
});
test("corrupt scene or missing WebGL leaves the project reader reachable", async ({
  page,
}) => {
  await page.route("**/library/hall*.glb", (route) =>
    route.fulfill({
      status: 200,
      contentType: "model/gltf-binary",
      body: "damaged scene",
    }),
  );
  await page.goto("/samples?view=world&zone=stacks&shelf=stacks-ai-agents");
  await expect(
    page.getByRole("heading", { name: "Illustrated view" }),
  ).toBeVisible({ timeout: 45000 });
  await shot(page, "fallback");
  await page
    .getByRole("button", { name: "Agent Workbench", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.unroute("**/library/hall*.glb");
  await page.getByRole("button", { name: "Retry 3D view" }).click();
  await worldReady(page);
});
test("context loss and cancelled entry preserve navigation", async ({
  page,
}) => {
  await page.goto("/samples?view=world&zone=stacks");
  await worldReady(page);
  await page
    .locator("canvas")
    .evaluate((c) =>
      c.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(
    page.getByRole("heading", { name: "Illustrated view" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Entrance page" }).click();
  await page.route("**/library/hall*.glb", (route) => route.abort());
  await page.getByRole("button", { name: "Enter the library" }).click();
  await page.getByRole("button", { name: "Entrance page" }).click();
  await expect(
    page.getByRole("button", { name: "Enter the library" }),
  ).toBeVisible();
});
test("HTML catalog and reader pass automatic accessibility checks", async ({
  page,
}) => {
  await page.goto("/samples?catalog=1");
  await expect(
    page.getByRole("heading", { name: "Library catalog" }),
  ).toBeVisible();
  const catalog = await new AxeBuilder({ page }).include(".library").analyze();
  expect(
    catalog.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
  ).toEqual([]);
  await page.goto("/samples?read=demo-agent-workbench");
  await expect(
    page.getByRole("heading", { name: "Agent Workbench" }),
  ).toBeVisible();
  const reader = await new AxeBuilder({ page }).include(".library").analyze();
  expect(reader.violations.map((v) => v.id)).toEqual([]);
});
test("sample edits move a volume, persist on reload, and never change the database catalog", async ({
  page,
}) => {
  await page.goto("/dev/library-admin");
  await page
    .getByLabel("Title", { exact: true })
    .fill("Revised sample edition");
  await page.getByLabel("Slot", { exact: true }).fill("8");
  await page.getByRole("button", { name: "Save sample volume" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved in this browser.");
  await page.reload();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Revised sample edition",
  );
  await page.goto("/samples?read=demo-agent-workbench");
  await expect(
    page.getByRole("heading", { name: "Revised sample edition" }),
  ).toBeVisible();
  await page.goto("/projects");
  await expect(page.getByText("Revised sample edition")).toBeHidden();
});
test("server detail and catalog can be read with JavaScript disabled", async ({
  browser,
}) => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  try {
    await page.goto("http://127.0.0.1:3077/projects");
    await page
      .getByRole("link", { name: "Open the Library text catalog" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Library catalog" }),
    ).toBeVisible();
    const card = page.locator(".volume-card").first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.locator("main article h1")).toBeVisible();
  } finally {
    await page.close();
  }
});

test("WebGL unavailable on first entry still permits keyboard reading", async ({
  page,
}) => {
  await page.addInitScript(`const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...rest){return type==="webgl2"?null:original.call(this,type,...rest)};`);
  await page.goto(
    "/samples?view=world&zone=stacks&shelf=stacks-data-knowledge",
  );
  await expect(
    page.getByRole("heading", { name: "Illustrated view" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Knowledge Atlas", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Knowledge Atlas" }),
  ).toBeVisible();
});
test("host and arbitrary preview flags cannot reveal the hidden collection", async ({
  request,
}) => {
  const cases: Record<string,string>[]=[{host:"localhost:3077"},{"x-forwarded-for":"192.0.2.25"}];
  for (const headers of cases) {
    const r = await request.get(
      "/catalog?preview=true&volume=agentic-mission-control",
      { headers },
    );
    expect(r.status()).toBe(404);
    expect(await r.text()).not.toContain("Mission Control");
  }
});
