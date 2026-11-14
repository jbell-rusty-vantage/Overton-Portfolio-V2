import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

// The continuous library, exercised against the loopback draft review. Two starter
// projects are admitted there; the complete private cabinet is covered by
// scripts/profile-estate.mjs against the office preview.
const visit = "/dev/travellers-rest";
const dir = ".local-library/evidence/estate";
test.beforeAll(async () => {
  await mkdir(dir, { recursive: true });
});
test.setTimeout(120000);

type Probe = {
  estateEngine: {
    volume(slug: string): { progress: number; target: number; spec: { rest: { position: { x: number; y: number; z: number } } }; group: { position: { x: number; y: number; z: number } } } | null;
    artifact(id: string): { progress: number; target: number } | null;
    controller: { travelling: boolean; place: string };
    stats(): { triangles: number; calls: number };
  };
};
const ready = (page: Page) =>
  expect(page.locator("canvas[data-scene=ready]")).toBeVisible({ timeout: 60000 });
async function enter(page: Page, hash: string) {
  await page.goto(visit + hash);
  await ready(page);
}
const shelved = (page: Page, slug: string) =>
  page.waitForFunction(
    (s) => {
      const v = (window as unknown as Probe).estateEngine.volume(s);
      if (!v || v.progress !== 0 || v.target !== 0) return false;
      const a = v.group.position,
        b = v.spec.rest.position;
      // Back in its own slot; a binding under the pointer or keyboard focus is tipped
      // out by its headcap (up to 45 mm proud, its spine 21 mm lower).
      return Math.abs(a.z - b.z) < 0.004 && Math.abs(a.y - b.y) < 0.025 && Math.abs(a.x - b.x) < 0.05;
    },
    slug,
    { timeout: 20000 },
  );
const reach = (page: Page, name: string | RegExp) =>
  page.getByRole("navigation", { name: /Within reach/ }).getByRole("button", { name });

test("Enter the library walks in through the south door and the custodian speaks in his frame", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(visit);
  await expect(page.getByRole("heading", { name: "Travellers Rest", exact: true })).toBeVisible();
  await page.screenshot({ path: dir + "/entrance.png" });
  await page.getByRole("link", { name: "Enter the library" }).first().click();
  await ready(page);
  // The walk is under way from the lawn; it can be skipped.
  await page.getByRole("button", { name: "Skip travel" }).click();
  const guide = page.getByRole("region", { name: /Judge John Overton, the custodian/ });
  await expect(guide).toBeVisible();
  await expect(page).toHaveURL(/#library$/);
  // An explicit sound choice starts the voiced welcome; captions follow the audio clock.
  await guide.getByRole("button", { name: "Hear his welcome" }).click();
  const line = guide.locator(".tw-line");
  await expect(line).toContainText(/Good afternoon|welcome to Travellers Rest/, { timeout: 15000 });
  await guide.getByRole("button", { name: "Pause the custodian" }).click();
  const held = await line.innerText();
  await page.waitForTimeout(1200);
  expect(await line.innerText()).toBe(held);
  await guide.getByRole("button", { name: "Resume the custodian" }).click();
  await expect(line).not.toHaveText(held, { timeout: 15000 });
  await page.screenshot({ path: dir + "/custodian.png" });
  // Muting mid-sentence carries on silently; captions keep advancing.
  await guide.getByRole("button", { name: "Sound on" }).click();
  await expect(guide.getByRole("button", { name: "Sound off" })).toBeVisible();
  // His choices use the same navigation as the room.
  await guide.getByRole("button", { name: "Show me John’s projects" }).click();
  await expect(page).toHaveURL(/#cabinet$/);
  await expect(line).toContainText(/cabinet|volume|projects/i, { timeout: 15000 });
  await expect(reach(page, /Mission Control/)).toBeVisible({ timeout: 20000 });
  expect(errors).toEqual([]);
});

test("a project volume leaves its slot, opens to its real pages, turns and returns", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page, "#cabinet");
  await page.getByRole("button", { name: "Let me explore" }).click();
  const spine = reach(page, /Mission Control/);
  await spine.focus();
  // Keyboard focus nudges the binding forward, as hover does.
  await page.waitForFunction(() => {
    const v = (window as unknown as Probe).estateEngine.volume("agentic-mission-control");
    return !!v && v.group.position.x > v.spec.rest.position.x + 0.01;
  });
  await page.keyboard.press("Enter");
  const reader = page.locator(".wb-reader[data-visible]");
  await expect(reader).toBeVisible({ timeout: 20000 });
  await expect(page).toHaveURL(/#book\/agentic-mission-control/);
  // The title page carries the project's own summary as selectable text.
  await expect(reader.locator(".wb-page.right")).toContainText("Mission Control is a Temporal macro-scheduler");
  await page.screenshot({ path: dir + "/project-book.png" });
  const where = page.locator(".wb-contents");
  for (let i = 0; i < 3; i++) {
    const before = await where.innerText();
    await page.keyboard.press("ArrowRight");
    await expect(where).not.toHaveText(before, { timeout: 10000 });
    await expect(reader).toBeVisible();
  }
  await expect(page).toHaveURL(/#book\/agentic-mission-control\/[a-z0-9-]+/);
  const marked = page.url();
  const text = await reader.locator(".wb-page.right").innerText();
  await page.screenshot({ path: dir + "/project-reader.png" });
  // Reload reopens the same volume at the same leaf.
  await page.reload();
  await ready(page);
  await expect(reader).toBeVisible({ timeout: 20000 });
  expect(page.url()).toBe(marked);
  expect(await reader.locator(".wb-page.right").innerText()).toBe(text);
  // The same authorized content opens as a full report and returns to this leaf.
  await where.click();
  await page.getByRole("menuitem", { name: "Open full report", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Mission Control full report" })).toBeVisible();
  await page.keyboard.press("Escape");
  expect(page.url()).toBe(marked);
  await expect(reader).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#cabinet$/);
  await shelved(page, "agentic-mission-control");
  expect(errors).toEqual([]);
});

test("rapid selections and a book recalled in mid-air settle in their own slots", async ({
  page,
}) => {
  await enter(page, "#cabinet");
  await page.getByRole("button", { name: "Let me explore" }).click();
  await reach(page, /Mission Control/).click();
  // Before the first volume has arrived, ask for another through the directory.
  await page.getByRole("button", { name: "Directory" }).click();
  await page.getByRole("complementary", { name: "Directory" }).getByRole("button", { name: /Knowledge Services/ }).click();
  await expect(page).toHaveURL(/#book\/agent-knowledge-services/);
  await page.waitForTimeout(350);
  // Recall it halfway through its flight.
  await page.keyboard.press("Escape");
  await shelved(page, "agentic-mission-control");
  await shelved(page, "agent-knowledge-services");
  await expect(page).not.toHaveURL(/#book/);
  // Hammer the page controls: every turn lands, none is lost or doubled.
  await reach(page, /Knowledge Services/).click();
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 20000 });
  const next = page.getByRole("button", { name: "Next page" });
  const total = Number(/of (\d+)/.exec(await page.locator(".wb-contents").innerText())?.[1]);
  expect(total).toBeGreaterThan(4);
  for (let i = 0; i < 4; i++) await next.click({ delay: 20 });
  // Four turns advance four spreads, capped at the actual final spread. Authored
  // content may grow; the interaction contract must not depend on an old page count.
  await expect(page.locator(".wb-contents")).toContainText(`Pages ${Math.min(9, total - 1)}–${Math.min(10, total)} of ${total}`, { timeout: 15000 });
});

test("the 1832 letter is lifted, read scan by scan with its transcription, and put back", async ({
  page,
}) => {
  await enter(page, "#desk");
  await page.getByRole("button", { name: "Let me explore" }).click();
  await reach(page, /John Overton to Andrew Jackson/).click();
  const panel = page.getByRole("complementary", { name: /Examining John Overton to Andrew Jackson/ });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Scan 1 of 4");
  await expect(panel).toContainText("Library of Congress");
  await page.waitForFunction(() => (window as unknown as Probe).estateEngine.artifact("overton-letter")?.progress === 1);
  await panel.getByRole("tab", { name: "Transcription" }).click();
  const lineButton = panel.getByRole("button", { name: /No man living but yourself can/ });
  await lineButton.click();
  await expect(lineButton).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: dir + "/letter.png" });
  await panel.getByRole("button", { name: "Next scan" }).click();
  await expect(page).toHaveURL(/#object\/overton-letter\/2$/);
  await expect(panel).toContainText("Scan 2 of 4");
  await expect(panel).toContainText(/Jno: Overton/);
  // Deep link and reload land on the same scan.
  await page.reload();
  await ready(page);
  await expect(panel).toContainText("Scan 2 of 4");
  await panel.getByRole("button", { name: "Return to the desk" }).click();
  await expect(page).toHaveURL(/#desk$/);
  await page.waitForFunction(() => (window as unknown as Probe).estateEngine.artifact("overton-letter")?.progress === 0);
});

test("Back, deep links and a withdrawn volume resolve to one coherent room state", async ({
  page,
}) => {
  await enter(page, "#library");
  await page.getByRole("button", { name: "Let me explore" }).click();
  await reach(page, "The family cabinet").click();
  await expect(page).toHaveURL(/#cabinet$/);
  await reach(page, /Mission Control/).click();
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 25000 });
  // Back puts the book away; Back again returns to the doorway.
  await page.goBack();
  await expect(page).toHaveURL(/#cabinet$/);
  await shelved(page, "agentic-mission-control");
  await page.goBack();
  await expect(page).toHaveURL(/#library$/);
  await page.goForward();
  await expect(page).toHaveURL(/#cabinet$/);
  // A volume that is not on the shelves any more.
  await page.goto(visit + "#book/withdrawn-volume/overview");
  await expect(page.getByRole("status").filter({ hasText: "not on the shelves" })).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(/#cabinet$/);
  // The earlier house-book links still arrive at the companion on the writing table.
  await page.goto(visit + "#leaf-2");
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".wb-pages").getByRole("heading", { name: "The hands that built it", exact: true })).toBeVisible();
});

test("the viewing folio plays a large recording and opens the soccer collection", async ({
  page,
}) => {
  await enter(page, "#cabinet");
  await page.getByRole("button", { name: "Let me explore" }).click();
  await reach(page, "The viewing folio").click();
  const panel = page.getByRole("region", { name: "The viewing folio" });
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Play the recording" }).click();
  await expect.poll(() => panel.locator("video").evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(0.5);
  await expect(panel.locator("video")).toHaveJSProperty("paused", false);
  await page.screenshot({ path: dir + "/screening.png" });
  await panel.getByRole("button", { name: "Soccer highlights · 9 clips" }).click();
  await expect(page).toHaveURL(/#screen\/soccer$/);
  await panel.getByRole("button", { name: /Free kick winner/ }).click();
  await expect(panel.getByRole("link", { name: /browser’s own player/ })).toHaveAttribute("href", /free_kick_goal|royal-palm/);
  await panel.getByRole("button", { name: "Return to the cabinet" }).click();
  await expect(page).toHaveURL(/#cabinet$/);
});

test("reduced motion keeps the still portrait, the full words and every choice", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce", baseURL: "http://127.0.0.1:3077" });
  const page = await context.newPage();
  await enter(page, "#portrait");
  const guide = page.getByRole("region", { name: /Judge John Overton, the custodian/ });
  await guide.getByRole("button", { name: "Read his welcome in silence" }).click();
  await expect(guide.locator(".tw-line")).toContainText("Where shall we begin?");
  await expect(guide.getByRole("button", { name: "Show me the letters" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip travel" })).toHaveCount(0);
  await guide.getByRole("button", { name: "Show me the letters" }).click();
  await expect(page).toHaveURL(/#desk$/);
  // The book arrives without a flight and still reads.
  await page.getByRole("button", { name: "Close the custodian" }).click();
  await reach(page, /^The house book/).click();
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 20000 });
  await context.close();
});

test("a missing scan, failed audio and an unavailable model each leave a usable visit", async ({
  page,
}) => {
  await page.route("**/letters/maj012882/p02.webp", (r) => r.abort());
  await page.route("**/voice/greeting.mp3", (r) => r.abort());
  await enter(page, "#object/overton-letter/2");
  const panel = page.getByRole("complementary", { name: /Examining/ });
  await expect(panel.getByRole("status")).toContainText("could not be loaded", { timeout: 20000 });
  await expect(panel.getByRole("link", { name: /Library of Congress item record/ }).first()).toBeVisible();
  await panel.getByRole("button", { name: "Return to the desk" }).click();
  // Free of the letter, the visitor is noticed; otherwise the custodian is one press away.
  const guide = page.getByRole("region", { name: /Judge John Overton, the custodian/ });
  if (!(await guide.isVisible().catch(() => false)))
    await page.getByRole("button", { name: "The custodian", exact: true }).click();
  await guide.getByRole("button", { name: "Hear his welcome" }).click();
  await expect(guide.getByRole("status")).toContainText("Captions continue", { timeout: 15000 });
  await expect(guide.locator(".tw-line")).toContainText(/\w+/, { timeout: 15000 });
  // No model at all: the plain pages carry the same rooms, books and records.
  await page.route("**/world-v2*.glb", (r) => r.abort());
  await page.goto(visit + "#cabinet");
  await page.reload();
  await expect(page.getByText("The 3D library could not be opened")).toBeVisible({ timeout: 60000 });
  await page.locator(".ea-project").filter({ has: page.getByRole("heading", { name: "Mission Control", exact: true }) }).click();
  const report = page.getByRole("dialog", { name: "Mission Control full report" });
  await expect(report.getByRole("heading", { name: "Mission Control", level: 1 })).toBeVisible();
  await expect(report.getByRole("navigation", { name: "Report sections" })).toBeVisible();
});

test("an emulated phone reads one page at a time and inspects a letter with touch", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3077",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await enter(page, "#cabinet");
  await page.getByRole("button", { name: "Let me explore" }).tap();
  await reach(page, /Mission Control/).tap();
  const reader = page.locator(".wb-reader[data-visible]");
  await expect(reader).toBeVisible({ timeout: 25000 });
  await expect(reader.locator(".wb-page.left")).toBeHidden();
  const where = page.locator(".wb-contents");
  const before = await where.innerText();
  await page.getByRole("button", { name: "Next page" }).tap();
  await expect(where).not.toHaveText(before, { timeout: 10000 });
  await page.screenshot({ path: dir + "/phone.png" });
  await page.getByRole("button", { name: "Return to the shelf" }).tap();
  await page.goto("http://127.0.0.1:3077" + visit + "#object/overton-letter");
  const panel = page.getByRole("complementary", { name: /Examining/ });
  await expect(panel).toBeVisible({ timeout: 30000 });
  await panel.getByRole("button", { name: "Zoom in" }).tap();
  await expect(panel.getByRole("button", { name: /Fit/ })).toContainText("140%");
  await panel.getByRole("button", { name: "Return to the desk" }).tap();
  await expect(page).toHaveURL(/#desk$/);
  await context.close();
});

test("the overlay controls pass automated accessibility checks and the plain view remains", async ({
  page,
}) => {
  await enter(page, "#cabinet");
  const results = await new AxeBuilder({ page }).include(".tw").analyze();
  expect(results.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? "")).map((v) => v.id)).toEqual([]);
  await page.getByRole("button", { name: "Directory" }).click();
  await page.getByRole("button", { name: "Plain page view" }).click();
  await expect(page.getByText("You are reading the plain page view.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The family cabinet", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Enter the 3D library" }).first().click();
  await ready(page);
});
