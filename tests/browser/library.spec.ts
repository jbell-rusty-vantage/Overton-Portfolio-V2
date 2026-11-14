import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
  const reader = await new AxeBuilder({ page }).include("[data-report]").analyze();
  expect(reader.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
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
