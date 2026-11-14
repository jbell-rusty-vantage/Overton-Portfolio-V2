import { expect, test, type Browser, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// The project volumes as books: every page typeset within its paper, leaves that turn
// under a click or a drag, and a book that can be carried back to its shelf. Runs
// against the loopback draft review, where two starter projects are admitted.
const visit = "/dev/travellers-rest";
const dir = ".local-library/evidence/books";
const volumes = ["agentic-mission-control", "agent-knowledge-services"];
test.beforeAll(async () => {
  await mkdir(dir, { recursive: true });
});
test.setTimeout(150000);

type Probe = {
  estateEngine: {
    camera: unknown;
    volume(slug: string): {
      progress: number;
      target: number;
      turning: boolean;
      leafHeading: number;
      spec: { rest: { position: { x: number; y: number; z: number; clone(): { project(camera: unknown): { x: number; y: number } } } } };
      group: { position: { x: number; y: number; z: number } };
    } | null;
  };
};
const reader = (page: Page) => page.locator(".wb-reader[data-visible]");
const where = (page: Page) => page.locator(".wb-contents span");
async function enter(page: Page, hash: string) {
  await page.goto(visit + hash);
  await expect(page.locator("canvas[data-scene=ready]")).toBeVisible({ timeout: 60000 });
  // Held content suppresses automatic custodian cards in the real visitor flow.
}
async function open(page: Page, hash: string) {
  await enter(page, hash);
  await expect(reader(page)).toBeVisible({ timeout: 30000 });
}
const folio = async (page: Page) => Number(await page.locator(".wb-reader").getAttribute("data-first-page"));
const sheet = async (page: Page, side: "left" | "right") => (await page.locator(".wb-page." + side).boundingBox())!;

/** Measures the visible pages in their own, untransformed pixels. */
function measure() {
  const root = document.querySelector<HTMLElement>(".wb-reader")!;
  const css = getComputedStyle(root);
  const n = (name: string) => parseFloat(css.getPropertyValue(name));
  const W = n("--wb-w"),
    H = n("--wb-h"),
    top = n("--wb-top"),
    bottom = n("--wb-bottom"),
    side = n("--wb-side");
  const out: {
    side: string;
    kind: string;
    empty: boolean;
    words: number;
    pictures: number;
    under: number;
    over: number;
    wide: number;
    distorted: number;
    unloaded: number;
    folioHit: boolean;
  }[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(".wb-pages > .wb-page")) {
    if (getComputedStyle(el).display === "none") continue;
    const at = (node: HTMLElement) => {
      let x = 0,
        y = 0,
        e: HTMLElement | null = node;
      while (e && e !== el) {
        x += e.offsetLeft;
        y += e.offsetTop;
        e = e.offsetParent as HTMLElement | null;
      }
      return { x, y, r: x + node.offsetWidth, b: y + node.offsetHeight };
    };
    const body = el.querySelector<HTMLElement>(".wb-flow, .wb-plate, .wb-titlepage, .wb-halftitle, .wb-end");
    const parts = body
      ? [...body.querySelectorAll<HTMLElement>("*")].filter((x) => !x.children.length || /^(P|PRE|H1|H2|H3)$/.test(x.tagName))
      : [];
    let low = 0,
      high = H,
      right = 0,
      left = W;
    for (const p of parts) {
      const b = at(p);
      if (b.r === b.x && b.b === b.y) continue;
      low = Math.max(low, b.b);
      high = Math.min(high, b.y);
      right = Math.max(right, b.r);
      left = Math.min(left, b.x);
    }
    const media = [...el.querySelectorAll<HTMLImageElement | HTMLVideoElement>("img.wb-media, video.wb-media")];
    const folioEl = el.querySelector<HTMLElement>(".wb-folio");
    out.push({
      side: el.classList.contains("left") ? "left" : "right",
      kind: el.querySelector<HTMLElement>(".wb-sheet")?.dataset.kind ?? "",
      empty: !body,
      words: (body?.innerText.match(/\S+/g) ?? []).length,
      pictures: media.length,
      under: Math.max(0, top - high),
      over: Math.max(0, low - (H - bottom)),
      // A plate may reach into the side margin, never off the paper.
      wide: Math.max(0, right - (W - side * 0.5), side * 0.5 - left),
      distorted: media.filter((m) => {
        if (!(m instanceof HTMLImageElement) || !m.naturalWidth) return false;
        return Math.abs(m.naturalWidth / m.naturalHeight / (m.offsetWidth / m.offsetHeight) - 1) > 0.02;
      }).length,
      unloaded: media.filter((m) => m instanceof HTMLImageElement && !(m.complete && m.naturalWidth > 0)).length,
      folioHit: !!folioEl && low > at(folioEl).y - 2,
    });
  }
  return out;
}

async function everyPage(page: Page, slug: string, label: string) {
  await open(page, "#book/" + slug);
  const seen: ReturnType<typeof measure> = [];
  for (let i = 0; i < 60; i++) {
    await page
      .waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>(".wb-pages img")].every((m) => m.complete), null, { timeout: 15000 })
      .catch(() => {});
    const pages = await page.evaluate(measure);
    seen.push(...pages);
    if (i < 3) await page.screenshot({ path: dir + "/" + label + "-" + slug + "-" + (i + 1) + ".png" });
    const next = page.getByRole("button", { name: "Next page" });
    if (await next.isDisabled()) break;
    const before = await where(page).innerText();
    await page.keyboard.press("ArrowRight");
    await expect(where(page)).not.toHaveText(before, { timeout: 10000 });
    await expect(reader(page)).toBeVisible();
  }
  return seen;
}
function sound(pages: ReturnType<typeof measure>, slug: string) {
  expect(pages.length, slug + " has pages").toBeGreaterThan(5);
  for (const [i, p] of pages.entries()) {
    const name = slug + " page " + (i + 1) + " (" + p.kind + ")";
    expect(p.empty, name + " is not blank").toBe(false);
    expect(p.words + p.pictures, name + " carries words or a picture").toBeGreaterThan(0);
    expect(p.over, name + " ends above the foot margin").toBeLessThanOrEqual(1);
    expect(p.under, name + " starts below the head margin").toBeLessThanOrEqual(1);
    expect(p.wide, name + " stays on the paper").toBeLessThanOrEqual(1);
    expect(p.folioHit, name + " clears its folio").toBe(false);
    expect(p.distorted, name + " shows pictures at their own proportions").toBe(0);
    expect(p.unloaded, name + " has its pictures").toBe(0);
  }
}
const phone = (browser: Browser, reducedMotion?: "reduce") =>
  browser.newContext({
    baseURL: "http://127.0.0.1:3077",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion,
  });

test("no page of either review volume is blank, overflows its paper or distorts a picture", async ({ browser }) => {
  // Reduced motion lands every leaf at once, which is also the path it must work on.
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3077", viewport: { width: 1366, height: 860 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const slug of volumes) {
    const pages = await everyPage(page, slug, "desktop");
    sound(pages, slug);
    // Two pages to a spread: the volume never closes on an empty recto.
    expect(pages.length % 2, slug + " fills its last spread").toBe(0);
    // It opens on a plate and a title page, then a table of contents.
    expect(pages.slice(0, 3).map((p) => p.kind)).toEqual(["plate", "title", "contents"]);
  }
  expect(errors).toEqual([]);
  await context.close();
});

test("a click on the right page turns on, on the left page turns back, and a leaf in the air comes back", async ({ page }) => {
  await open(page, "#book/agentic-mission-control");
  expect(await folio(page)).toBe(1);
  // Bare paper low on the page: no words there to select.
  let r = await sheet(page, "right");
  await page.mouse.click(r.x + r.width * 0.55, r.y + r.height * 0.93);
  await expect(where(page)).toContainText("Pages 3–4 of", { timeout: 10000 });
  await expect(reader(page)).toBeVisible();
  const l = await sheet(page, "left");
  await page.mouse.click(l.x + l.width * 0.45, l.y + l.height * 0.93);
  await expect(where(page)).toContainText(/Pages? 1(?:–2)? of/, { timeout: 10000 });
  // A click on words also turns, after the moment a double-click would need.
  r = await sheet(page, "right");
  const words = (await page.locator(".wb-page.right .wb-summary").boundingBox())!;
  await page.mouse.click(words.x + 30, words.y + 8);
  await expect(where(page)).toContainText("Pages 3–4 of", { timeout: 10000 });
  await expect(reader(page)).toBeVisible();
  // Ask for the next page, then for the one just left while the leaf is still up:
  // the same leaf reverses and lands where it came from.
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => (window as unknown as Probe).estateEngine.volume("agentic-mission-control")!.turning);
  await page.keyboard.press("ArrowLeft");
  // A fast reverse can already have landed by the next protocol round trip.
  // Both a reverse in flight (-1) and a landed leaf (0) are valid; the marked
  // page below verifies that it returned to the original spread.
  expect(await page.evaluate(() => (window as unknown as Probe).estateEngine.volume("agentic-mission-control")!.leafHeading)).toBeLessThanOrEqual(0);
  await expect(reader(page)).toBeVisible({ timeout: 10000 });
  expect(await folio(page)).toBe(3);
});

test("the outer margin is the leaf's edge: a short pull falls back, a long one goes over", async ({ page }) => {
  await open(page, "#book/agentic-mission-control");
  const pull = async (share: number) => {
    const r = await sheet(page, "right");
    // The outer margin of the right page, where the leaf is taken hold of.
    const edge = (await page.locator(".wb-page.right .wb-edge:not(.back)").boundingBox())!;
    const x = edge.x + edge.width / 2,
      y = edge.y + edge.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x - (r.width * share * i) / 10, y + i);
      await page.waitForTimeout(30);
    }
    // Held: the leaf is in the air under the pointer and the DOM page has stepped aside.
    expect(await page.evaluate(() => (window as unknown as Probe).estateEngine.volume("agentic-mission-control")!.turning)).toBe(true);
    await page.waitForTimeout(140);
    await page.mouse.up();
    await expect(reader(page)).toBeVisible({ timeout: 10000 });
  };
  await pull(0.22);
  expect(await folio(page)).toBe(1);
  await pull(1.3);
  expect(await folio(page)).toBe(3);
  await page.screenshot({ path: dir + "/leaf-dragged.png" });
});

test("selecting words, following a link and enlarging a picture leave the leaf where it is", async ({ page }) => {
  await open(page, "#book/agentic-mission-control");
  const start = await folio(page);
  const p = (await page.locator(".wb-page.right .wb-summary").boundingBox())!;
  await page.mouse.move(p.x + 4, p.y + 9);
  await page.mouse.down();
  await page.mouse.move(p.x + 150, p.y + 9, { steps: 6 });
  await page.mouse.up();
  expect((await page.evaluate(() => window.getSelection()!.toString())).length).toBeGreaterThan(5);
  // A click elsewhere only lets the selection go.
  const r = await sheet(page, "right");
  await page.mouse.click(r.x + r.width * 0.5, r.y + r.height * 0.8);
  await page.waitForTimeout(500);
  expect(await folio(page)).toBe(start);
  expect(await page.evaluate(() => window.getSelection()!.toString())).toBe("");
  // The cover plate enlarges; Escape closes the picture, not the book.
  await page.locator(".wb-page.left img[data-zoom]").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(reader(page)).toBeVisible();
  expect(await folio(page)).toBe(start);
  // The contents page is a set of real links into the volume.
  await page.keyboard.press("ArrowRight");
  await expect(where(page)).toContainText("Pages 3–4 of", { timeout: 10000 });
  await expect(reader(page)).toBeVisible();
  const entry = page.locator(".wb-page.left .wb-toc a").nth(1);
  const name = (await entry.locator(".wb-toc-t").innerText()).trim();
  const target = Number(await entry.locator(".wb-toc-n").innerText());
  await entry.click();
  await expect(reader(page)).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".wb-page .wb-chapter", { hasText: name })).toBeVisible();
  expect(Math.abs((await folio(page)) - target)).toBeLessThanOrEqual(1);
  // A source link on the paper is an ordinary link.
  await page.keyboard.press("End");
  await expect(reader(page)).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".wb-page .wb-link a").first()).toHaveAttribute("href", /^https?:|^\//);
});

test("the open book is carried back to its shelf; let go early, it settles open again", async ({ page }) => {
  const slug = "agentic-mission-control";
  await enter(page, "#cabinet");
  await page.getByRole("navigation", { name: /Within reach/ }).getByRole("button", { name: /Mission Control/ }).click();
  await expect(reader(page)).toBeVisible({ timeout: 30000 });
  const carry = async (far: number, check?: () => Promise<void>) => {
    const r = await sheet(page, "right");
    const x = r.x + r.width * 0.5,
      y = r.y + 9;
    // Toward the volume's own slot on the shelf.
    const slot = await page.evaluate((s) => {
      const e = (window as unknown as Probe).estateEngine;
      const p = e.volume(s)!.spec.rest.position.clone().project(e.camera);
      return { x: ((p.x + 1) / 2) * innerWidth, y: ((1 - p.y) / 2) * innerHeight };
    }, slug);
    const d = Math.hypot(slot.x - x, slot.y - y) || 1;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x + ((slot.x - x) / d) * far * (i / 10), y + ((slot.y - y) / d) * far * (i / 10));
      await page.waitForTimeout(30);
    }
    await check?.();
    await page.waitForTimeout(150);
    await page.mouse.up();
  };
  // A short carry: the book follows, then settles back open on the same page.
  await carry(50, async () => {
    expect(await page.evaluate((s) => (window as unknown as Probe).estateEngine.volume(s)!.progress, slug)).toBeLessThan(1);
    await expect(page.getByRole("status").filter({ hasText: "toward its shelf" })).toBeVisible();
  });
  await expect(reader(page)).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/#book\/agentic-mission-control/);
  // A long carry arms the return; letting go puts it back in its own slot.
  await carry(280, async () => {
    await expect(page.getByRole("status").filter({ hasText: "Let go to put it back" })).toBeVisible();
    await page.screenshot({ path: dir + "/book-carried.png" });
  });
  await expect(page).toHaveURL(/#cabinet$/);
  await page.waitForFunction(
    (s) => {
      const v = (window as unknown as Probe).estateEngine.volume(s)!;
      const a = v.group.position,
        b = v.spec.rest.position;
      return v.progress === 0 && v.target === 0 && Math.abs(a.z - b.z) < 0.012 && Math.abs(a.y - b.y) < 0.03;
    },
    slug,
    { timeout: 20000 },
  );
  await expect(page.locator(".wb-reader")).toHaveCount(0);
});

for (const size of ["desktop", "phone"] as const) {
  test(`${size}: taking a bookmarked book from the shelf or directory starts at page one`, async ({ browser }) => {
    const context = size === "phone" ? await phone(browser) : await browser.newContext({
      baseURL: "http://127.0.0.1:3077", viewport: { width: 1366, height: 860 },
    });
    const page = await context.newPage();
    await enter(page, "#cabinet");
    await page.getByRole("button", { name: "Let me explore", exact: true }).click();
    await page.getByRole("navigation", { name: /Within reach/ }).getByRole("button", { name: /Mission Control/ }).click();
    await expect(reader(page)).toBeVisible({ timeout: 30000 });
    for (const source of ["shelf", "directory"]) {
      await page.keyboard.press("End");
      await expect(where(page)).toContainText(" · End");
      await expect(reader(page)).toBeVisible();
      expect(await folio(page)).toBeGreaterThan(1);
      await page.getByRole("button", { name: "Return to the shelf", exact: true }).click();
      await expect(page).toHaveURL(/#cabinet$/);
      await expect(page.locator(".wb-reader")).toHaveCount(0);
      if (source === "shelf") {
        await page.getByRole("navigation", { name: /Within reach/ }).getByRole("button", { name: /Mission Control/ }).click();
      } else {
        // A new visit must also ignore the persisted bookmark for a fresh pickup.
        await page.reload();
        await expect(page.locator("canvas[data-scene=ready]")).toBeVisible({ timeout: 60000 });
        await page.getByRole("button", { name: "Let me explore", exact: true }).click();
        await page.getByRole("button", { name: "Directory", exact: true }).click();
        await page.getByRole("complementary", { name: "Directory", exact: true }).getByRole("button", { name: /Mission Control/ }).click();
      }
      await expect(reader(page)).toBeVisible({ timeout: 30000 });
      await expect(reader(page)).toHaveAttribute("data-first-page", "1");
      await expect(page.getByRole("button", { name: "Previous page", exact: true })).toBeDisabled();
      await expect(page).toHaveURL(/#book\/agentic-mission-control$/);
    }
    await context.close();
  });
}

test("Return to my place explicitly resumes the saved page", async ({ page }) => {
  await enter(page, "#cabinet");
  await page.getByRole("button", { name: "Read his welcome in silence", exact: true }).click();
  await page.getByRole("button", { name: "Close the custodian", exact: true }).click();
  await page.getByRole("navigation", { name: /Within reach/ }).getByRole("button", { name: /Mission Control/ }).click();
  await expect(reader(page)).toBeVisible({ timeout: 30000 });
  await page.keyboard.press("End");
  await expect(where(page)).toContainText(" · End");
  await expect(reader(page)).toBeVisible();
  const savedPage = await folio(page);
  const savedAddress = page.url();
  expect(savedPage).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Return to the shelf", exact: true }).click();
  await expect(page).toHaveURL(/#cabinet$/);
  await page.getByRole("button", { name: /Return to my place in .*Mission Control/ }).click();
  await expect(reader(page)).toBeVisible({ timeout: 30000 });
  await expect(reader(page)).toHaveAttribute("data-first-page", String(savedPage));
  expect(page.url()).toBe(savedAddress);
});

test("a deep link and a reload land on the same page, and the keyboard still reads", async ({ page }) => {
  await open(page, "#book/agent-knowledge-services");
  for (let i = 0; i < 2; i++) {
    const before = await where(page).innerText();
    await page.keyboard.press("ArrowRight");
    await expect(where(page)).not.toHaveText(before, { timeout: 10000 });
    await expect(reader(page)).toBeVisible();
  }
  await expect(page).toHaveURL(/#book\/agent-knowledge-services\/[a-z0-9-]+/);
  const marked = page.url();
  const text = await page.locator(".wb-pages").innerText();
  const at = await folio(page);
  await page.reload();
  await expect(page.locator("canvas[data-scene=ready]")).toBeVisible({ timeout: 60000 });
  await expect(reader(page)).toBeVisible({ timeout: 30000 });
  expect(page.url()).toBe(marked);
  expect(await folio(page)).toBe(at);
  expect(await page.locator(".wb-pages").innerText()).toBe(text);
  // The same address opened cold in a new tab arrives at the same page.
  const second = await page.context().newPage();
  await second.goto(marked);
  await expect(reader(second)).toBeVisible({ timeout: 60000 });
  expect(await folio(second)).toBe(at);
  await second.close();
  // A section's own address opens the page it begins on, wherever on that page.
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await expect(where(page)).toContainText("Pages 3–4 of", { timeout: 10000 });
  const last = page.locator(".wb-page.left .wb-toc a").last();
  const key = (await last.getAttribute("data-goto"))!;
  const title = (await last.locator(".wb-toc-t").innerText()).trim();
  await page.goto(visit + "#book/agent-knowledge-services/" + key);
  await page.reload();
  await expect(reader(page)).toBeVisible({ timeout: 60000 });
  await expect(page.locator(".wb-page .wb-chapter", { hasText: title })).toBeVisible();
  await page.keyboard.press("Home");
  await expect(where(page)).toContainText(/Pages? 1(?:–2)? of/, { timeout: 10000 });
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#cabinet$/);
});

test("a phone reads one clean page at a time and turns it with a tap or a swipe", async ({ browser }) => {
  const still = await phone(browser, "reduce");
  const quiet = await still.newPage();
  for (const slug of volumes) {
    const pages = await everyPage(quiet, slug, "phone");
    sound(pages, slug);
    expect(pages.every((p) => p.side === "right")).toBe(true);
  }
  await still.close();
  const context = await phone(browser);
  const page = await context.newPage();
  await open(page, "#book/agentic-mission-control");
  await expect(page.locator(".wb-page.left")).toBeHidden();
  // Every control of the reading bar can be reached: none lies under another.
  for (const name of ["Previous page", "Next page", "Return to the shelf"]) {
    const reachable = await page.getByRole("button", { name }).evaluate((b) => {
      const r = b.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top === b || b.contains(top);
    });
    expect(reachable, name + " is not covered").toBe(true);
  }
  const r = await sheet(page, "right");
  await page.touchscreen.tap(r.x + r.width * 0.7, r.y + r.height * 0.9);
  await expect(where(page)).toContainText("Page 2 of", { timeout: 10000 });
  await expect(reader(page)).toBeVisible();
  await page.touchscreen.tap(r.x + r.width * 0.12, r.y + r.height * 0.9);
  await expect(where(page)).toContainText(/Pages? 1(?:–2)? of/, { timeout: 10000 });
  await expect(reader(page)).toBeVisible();
  // A sideways swipe carries the leaf with the finger.
  const cdp = await context.newCDPSession(page);
  const touch = (type: string, x?: number, y?: number) =>
    cdp.send("Input.dispatchTouchEvent", { type: type as "touchStart", touchPoints: x === undefined ? [] : [{ x, y: y! }] });
  const y = r.y + r.height * 0.5;
  await touch("touchStart", r.x + r.width * 0.8, y);
  for (let i = 1; i <= 8; i++) {
    await touch("touchMove", r.x + r.width * (0.8 - 0.07 * i), y);
    await page.waitForTimeout(30);
  }
  await touch("touchEnd");
  await expect(where(page)).toContainText("Page 2 of", { timeout: 10000 });
  await expect(reader(page)).toBeVisible();
  await page.screenshot({ path: dir + "/phone-page.png" });
  await page.getByRole("button", { name: "Return to the shelf" }).tap();
  await expect(page).toHaveURL(/#cabinet$/);
  await context.close();
});

test("animated reading never skips a spread and its final counter includes the last page", async ({ page }) => {
  await open(page, "#book/agent-knowledge-services");
  const root = page.locator(".wb-reader");
  const seen: number[] = [];
  const total = Number(await root.getAttribute("data-total-pages"));
  while (true) {
    await expect(reader(page)).toBeVisible();
    const first = Number(await root.getAttribute("data-first-page"));
    const last = Number(await root.getAttribute("data-last-page"));
    seen.push(first, last);
    await expect(where(page)).toContainText(`Pages ${first}–${last} of ${total}`);
    // After the leaf lands, native text stays on opaque paper while the room runs.
    await page.waitForTimeout(350);
    const stable = await page.evaluate(() => {
      const book = (window as unknown as { estateEngine: { volume(s: string): { ink: boolean } } }).estateEngine.volume("agent-knowledge-services");
      const paper = document.querySelector<HTMLElement>(".wb-page.right")!;
      return { ink: book.ink, background: getComputedStyle(paper).backgroundColor, transform: getComputedStyle(paper).transform };
    });
    expect(stable.ink).toBe(false);
    expect(stable.background).toBe("rgb(241, 231, 204)");
    expect(stable.transform).toMatch(/^matrix\(/);
    if (last === total) break;
    await page.keyboard.press("ArrowRight");
    // A held key / burst of clicks must not land the leaf early and skip ahead.
    await page.evaluate(() => {
      for (let i = 0; i < 8; i++) window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", repeat: true }));
    });
    await expect(root).toHaveAttribute("data-first-page", String(first + 2));
  }
  expect(seen).toEqual(Array.from({ length: total }, (_, i) => i + 1));
  await expect(where(page)).toContainText("End");
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  await page.waitForTimeout(3000);
  await expect(reader(page)).toBeVisible();
});

test("resizing an open book keeps the page registration and print size in agreement", async ({ page }) => {
  await open(page, "#book/agent-knowledge-services");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".wb-reader")).toHaveAttribute("data-first-page", "3");
  for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 860 }]) {
    await page.setViewportSize(viewport);
    await expect(reader(page)).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const root = document.querySelector<HTMLElement>(".wb-reader")!;
      const engine = (window as unknown as { estateEngine: { volume(s: string): { metrics: { width: number }; ink: boolean } } }).estateEngine;
      const book = engine.volume("agent-knowledge-services");
      return book.metrics.width === parseFloat(getComputedStyle(root).getPropertyValue("--wb-w")) && !book.ink;
    })).toBe(true);
    const p = await sheet(page, "right");
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x + p.width).toBeLessThanOrEqual(viewport.width + 1);
    await page.keyboard.press("ArrowRight");
    await expect(reader(page)).toBeVisible();
  }
});
