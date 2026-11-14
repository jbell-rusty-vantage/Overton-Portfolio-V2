import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Moving through the continuous library: the first-person controller, its collision,
// routed travel, touch and pointer-lock control, exercised against the loopback draft
// review, where the engine is on window.estateEngine.
const visit = "/dev/travellers-rest";
const base = process.env.ESTATE_REVIEW_ORIGIN || "http://127.0.0.1:3077";
const dir = ".local-library/evidence/navigation";
test.beforeAll(async () => {
  await mkdir(dir, { recursive: true });
});
test.setTimeout(120000);

type Vec = { x: number; y: number; z: number; clone(): Vec & { set(x: number, y: number, z: number): Vec & { project(camera: unknown): Vec } }; distanceTo(v: Vec): number };
type Debug = {
  yaw: number;
  pitch: number;
  yawTo: number;
  speed: number;
  glide: number;
  resting: boolean;
  pending: boolean;
  locked: boolean;
  marker: string;
  travel: { kind: string; length: number; s: number; gaze: boolean } | null;
  feel: { walk: number; brisk: number; fine: number; mouse: number; coast: number };
};
type Probe = {
  estateEngine: {
    camera: { position: Vec; fov: number };
    controller: {
      travelling: boolean;
      place: string;
      gain: number;
      debug(): Debug;
      go(place: string): void;
      walk(x: number, z: number): boolean;
      restore(pose: { position: Vec; yaw: number; pitch: number }, instant?: boolean): void;
      ground: { freeAt(x: number, z: number, r?: number): boolean; radius: number; node(place: string): Vec };
    };
    volume(slug: string): { group: { position: Vec } } | null;
    pick(x: number, y: number): { target: { kind: string; slug?: string } } | null;
  };
};
type Sample = { t: number; x: number; y: number; z: number; speed: number; yaw: number; travelling: boolean; free: boolean; marker: string };

const ready = (page: Page) => expect(page.locator("canvas[data-scene=ready]")).toBeVisible({ timeout: 60000 });
async function enter(page: Page, hash: string) {
  await page.goto(visit + hash);
  await ready(page);
  // The custodian notices a first arrival in the library; stand free of his card.
  const explore = page.getByRole("button", { name: "Let me explore" });
  if (await explore.isVisible().catch(() => false)) await explore.click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}
/** Frame-by-frame record of the visitor for a while. Start it, act, then await it. */
const record = (page: Page, ms: number) =>
  page.evaluate(
    (ms) =>
      new Promise<Sample[]>((done) => {
        const e = (window as unknown as Probe).estateEngine;
        const out: Sample[] = [];
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = e.camera.position,
            d = e.controller.debug();
          out.push({ t: now - t0, x: p.x, y: p.y, z: p.z, speed: d.speed, yaw: d.yaw, travelling: e.controller.travelling, free: e.controller.ground.freeAt(p.x, p.z, e.controller.ground.radius - 0.004), marker: d.marker });
          if (now - t0 < ms) requestAnimationFrame(tick);
          else done(out);
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );
const state = (page: Page) =>
  page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine;
    const p = e.camera.position;
    return { x: p.x, y: p.y, z: p.z, travelling: e.controller.travelling, place: e.controller.place, ...e.controller.debug() };
  });
/** Nothing moving: neither the visitor nor the view. */
const settled = (page: Page) =>
  page.waitForFunction(() => (window as unknown as Probe).estateEngine.controller.debug().resting, null, { timeout: 20000 });
const reach = (page: Page, name: string | RegExp) =>
  page.getByRole("navigation", { name: /Within reach/ }).getByRole("button", { name });

test("survey movement updates physical reach, pauses without losing the view and walks outside", async ({page}) => {
  await enter(page,"#cabinet");
  const report = await page.evaluate(async () => {
    const e=(window as unknown as {estateEngine: {
      camera:{position:{x:number;y:number;z:number;clone():{set(x:number,y:number,z:number):unknown}}};
      controller:{pose():{position:unknown;yaw:number;pitch:number};restore(pose:unknown,instant:boolean):void};
      reachable():{label:string;target:{kind:string;slug?:string}}[];
      pause():void;resume():void;renderer:{info:{render:{frame:number}}};
    }}).estateEngine;
    const before=e.reachable().filter((r)=>r.target.kind==="book").length;
    const pose=e.controller.pose();
    e.controller.restore({...pose,position:e.camera.position.clone().set(.38,2.15,2.66)},true);
    const after=e.reachable().filter((r)=>r.target.kind==="book").length;
    e.pause();const frame=e.renderer.info.render.frame;
    await new Promise((resolve)=>setTimeout(resolve,150));
    const stopped=e.renderer.info.render.frame===frame;
    e.resume();
    return {before,after,stopped};
  });
  expect(report.before).toBeGreaterThan(0);
  expect(report.after).toBe(0);
  expect(report.stopped).toBe(true);
  await page.getByRole("button",{name:"Walk back outside"}).click();
  await expect(page).toHaveURL(/#approach$/, {timeout:30000});
  await expect(page.getByRole("link",{name:/Return to where I was/})).toBeVisible();
});

test("walking keys gather pace, coast to rest, work from the page body and stop at the table and the wall", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page, "#desk");
  // Focus is on the page, not the canvas: the keys still walk.
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  const start = await state(page);
  expect(Math.abs(start.yaw)).toBeLessThan(0.01);
  // North into the writing table: the visitor's edge stops at its edge.
  let run = record(page, 2200);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(1800);
  await page.keyboard.up("KeyW");
  let frames = await run;
  let now = await state(page);
  expect(now.z).toBeGreaterThan(1.2 + 0.28 - 0.01);
  expect(now.z).toBeLessThan(1.2 + 0.28 + 0.03);
  expect(Math.abs(now.x - start.x)).toBeLessThan(0.02);
  expect(frames.every((f) => f.free)).toBe(true);
  // Briskly backwards into the south wall: never through it, however fast.
  run = record(page, 2200);
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(1800);
  await page.keyboard.up("KeyS");
  await page.keyboard.up("ShiftLeft");
  frames = await run;
  now = await state(page);
  expect(now.z).toBeLessThan(2.86 - 0.28 + 0.01);
  expect(now.z).toBeGreaterThan(2.86 - 0.28 - 0.03);
  expect(Math.max(...frames.map((f) => f.speed))).toBeGreaterThan(start.feel.walk + 0.2);
  expect(frames.every((f) => f.free)).toBe(true);
  // Sideways along the wall: pace gathers, holds at walking speed and coasts to rest.
  await settled(page);
  run = record(page, 2600);
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(900);
  const held = await state(page);
  await page.keyboard.up("KeyA");
  frames = await run;
  now = await state(page);
  const walk = start.feel.walk;
  const top = Math.max(...frames.map((f) => f.speed));
  expect(top).toBeGreaterThan(walk * 0.93);
  expect(top).toBeLessThan(walk * 1.03);
  const peak = frames.findIndex((f) => f.speed === top);
  // Neither an instant start nor an instant stop.
  expect(frames.slice(0, peak).some((f) => f.speed > 0.1 && f.speed < walk * 0.9)).toBe(true);
  expect(frames.slice(peak).some((f) => f.speed > 0.1 && f.speed < walk * 0.9)).toBe(true);
  expect(now.speed).toBe(0);
  const coast = held.x - now.x;
  expect(coast).toBeGreaterThan(0.1);
  expect(coast).toBeLessThan(0.75);
  expect(Math.abs(now.z - held.z)).toBeLessThan(0.02);
  // Fine steps are a fraction of a stride.
  await page.keyboard.down("KeyC");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(700);
  const fine = await state(page);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyC");
  expect(fine.speed).toBeGreaterThan(start.feel.fine * 0.8);
  expect(fine.speed).toBeLessThan(start.feel.fine * 1.1);
  // The wheel takes a measured step forward.
  await settled(page);
  const before = await state(page);
  await page.mouse.move(700, 430);
  await page.mouse.wheel(0, -100);
  await page.waitForFunction(() => {
    const d = (window as unknown as Probe).estateEngine.controller.debug();
    return d.speed === 0 && d.glide === 0;
  });
  const stepped = await state(page);
  expect(before.z - stepped.z).toBeGreaterThan(0.3);
  expect(before.z - stepped.z).toBeLessThan(0.5);
  // Typing in a field is typing: the visitor stays put.
  await page.getByRole("button", { name: "Directory" }).click();
  await page.getByRole("searchbox").pressSequentially("wasd", { delay: 60 });
  await page.waitForTimeout(300);
  const typed = await state(page);
  expect(Math.hypot(typed.x - stepped.x, typed.z - stepped.z)).toBeLessThan(0.001);
  expect(errors).toEqual([]);
});

test("a dragged view eases to where the hand put it and carries a released swing a little further", async ({ page }) => {
  await enter(page, "#library");
  const result = await page.evaluate(async () => {
    const e = (window as unknown as Probe).estateEngine,
      c = e.controller;
    const canvas = document.querySelector<HTMLCanvasElement>(".tw canvas")!;
    const fire = (target: EventTarget, type: string, x: number, y: number) =>
      target.dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true }));
    const frame = () => new Promise<number>((r) => requestAnimationFrame(r));
    const yaw0 = c.debug().yaw;
    fire(canvas, "pointerdown", 600, 400);
    fire(window, "pointermove", 720, 400);
    const asked = c.debug().yawTo - yaw0;
    await frame();
    const early = (c.debug().yaw - yaw0) / asked;
    const trail: number[] = [];
    for (let i = 0; i < 45; i++) {
      await frame();
      trail.push((c.debug().yaw - yaw0) / asked);
    }
    const rest = c.debug();
    // A swing released while still moving (the hand's last moves and its lifting
    // fall within one frame here, as they do when a real swipe ends).
    for (let i = 1; i <= 4; i++) fire(window, "pointermove", 720 + i * 30, 400);
    const let_go = c.debug().yawTo;
    fire(window, "pointerup", 840, 400);
    const until = performance.now() + 1600;
    while (performance.now() < until) await frame();
    const after = c.debug();
    return { asked, expected: -120 * rest.feel.mouse * (e.camera.fov / 56) * c.gain, early, trail, settled: rest.yaw - rest.yawTo, carried: after.yawTo - let_go, final: after.yaw - after.yawTo, dragged: (c as unknown as { dragged: boolean }).dragged };
  });
  expect(result.asked).toBeCloseTo(result.expected, 5);
  // Part of the way at first, then all of it, without overshoot.
  expect(result.early).toBeGreaterThan(0.02);
  // (One frame closes at most 93% of the gap, however long the frame.)
  expect(result.early).toBeLessThan(0.95);
  expect(result.trail.every((v, i, all) => v <= 1.0001 && (i === 0 || v >= all[i - 1] - 1e-6))).toBe(true);
  expect(Math.abs(result.settled)).toBeLessThan(0.001);
  // The swing was to the right (yaw falls); it carries on a little and comes to rest.
  expect(result.carried).toBeLessThan(-0.01);
  expect(result.carried).toBeGreaterThan(-0.6);
  expect(Math.abs(result.final)).toBeLessThan(0.001);
  expect(result.dragged).toBe(true);
});

test("a walking key or a drag takes over programmed travel at once", async ({ page }) => {
  await enter(page, "#library");
  await reach(page, "The law shelves").click();
  await expect(page).toHaveURL(/#reports$/);
  await page.waitForFunction(() => {
    const c = (window as unknown as Probe).estateEngine.controller;
    return c.travelling && c.debug().speed > 1.5;
  });
  await expect(page.getByRole("button", { name: "Skip travel" })).toBeVisible();
  await page.keyboard.down("KeyQ");
  const taken = await state(page);
  await page.keyboard.up("KeyQ");
  expect(taken.travelling).toBe(false);
  expect(taken.travel).toBeNull();
  // The pace is handed over, not dropped; the stop has not been reached and is still owed.
  expect(taken.speed).toBeGreaterThan(0.2);
  expect(taken.pending).toBe(true);
  await settled(page);
  const stopped = await page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine;
    return e.camera.position.distanceTo(e.controller.ground.node("reports"));
  });
  expect(stopped).toBeGreaterThan(0.8);
  await expect(page.getByRole("button", { name: "Skip travel" })).toHaveCount(0);
  await expect(page).toHaveURL(/#reports$/);
  // The plan resumes the walk to the same stop, although the address has not changed.
  await page.getByRole("button", { name: "Go to the law shelves" }).click();
  await page.waitForFunction(() => (window as unknown as Probe).estateEngine.controller.travelling);
  // A drag during travel takes the view; the walk goes on and arrives.
  await page.mouse.move(700, 420);
  await page.mouse.down();
  await page.mouse.move(760, 430, { steps: 4 });
  const looking = await state(page);
  await page.mouse.up();
  expect(looking.travelling).toBe(true);
  expect(looking.travel?.gaze).toBe(false);
  await settled(page);
  const end = await page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine;
    return { off: e.camera.position.distanceTo(e.controller.ground.node("reports")), pending: e.controller.debug().pending };
  });
  expect(end.off).toBeLessThan(0.01);
  expect(end.pending).toBe(false);
  await expect(page.locator(".tw-sr")).toHaveText(/law shelves/);
});

test("selecting the floor walks there round the writing table, with a mark where the visitor will stand", async ({ page }) => {
  await enter(page, "#desk");
  // Straight ahead lies the table; the spot chosen is on its far side.
  const run = record(page, 7000);
  const begun = await page.evaluate(() => (window as unknown as Probe).estateEngine.controller.walk(-4.95, -0.62));
  expect(begun).toBe(true);
  const frames = (await run).filter((f, i, all) => f.travelling || all[i - 1]?.travelling);
  expect(frames.length).toBeGreaterThan(10);
  const inTable = (f: Sample) => f.x > -5.75 - 0.25 && f.x < -4.15 + 0.25 && f.z > 0.3 - 0.25 && f.z < 1.2 + 0.25;
  expect(frames.filter(inTable)).toEqual([]);
  expect(frames.every((f) => f.free)).toBe(true);
  expect(frames.some((f) => f.marker === "target")).toBe(true);
  let length = 0;
  for (let i = 1; i < frames.length; i++) length += Math.hypot(frames[i].x - frames[i - 1].x, frames[i].z - frames[i - 1].z);
  expect(length).toBeGreaterThan(2.67 + 0.8);
  await settled(page);
  const end = await state(page);
  expect(Math.hypot(end.x + 4.95, end.z + 0.62)).toBeLessThan(0.03);
  expect(end.marker).toBe("");
  // The same through a real press on the boards: find bare floor in view, hover, click.
  const spot = await page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine;
    const canvas = document.querySelector<HTMLCanvasElement>(".tw canvas")!;
    const r = canvas.getBoundingClientRect();
    for (const [x, z] of [[-3.2, -1.6], [-3.0, 0.4], [-6.3, -1.5], [-3.4, 1.9], [-6.4, 1.6], [-2.6, -2.2]]) {
      const v = e.camera.position.clone().set(x, 0.53, z).project(e.camera);
      if (v.z > 1 || Math.abs(v.x) > 0.8 || Math.abs(v.y) > 0.7) continue;
      const sx = r.left + ((v.x + 1) / 2) * r.width,
        sy = r.top + ((1 - v.y) / 2) * r.height;
      if (document.elementFromPoint(sx, sy) !== canvas || e.pick(sx, sy)) continue;
      return { x, z, sx, sy };
    }
    return null;
  });
  expect(spot).not.toBeNull();
  await page.mouse.move(spot!.sx - 6, spot!.sy - 4);
  await page.mouse.move(spot!.sx, spot!.sy, { steps: 3 });
  await expect.poll(async () => (await state(page)).marker).toBe("preview");
  await page.screenshot({ path: dir + "/floor-preview.png" });
  await page.mouse.click(spot!.sx, spot!.sy);
  await page.waitForFunction(() => (window as unknown as Probe).estateEngine.controller.travelling);
  expect((await state(page)).marker).toBe("target");
  await settled(page);
  const there = await state(page);
  expect(Math.hypot(there.x - spot!.x, there.z - spot!.z)).toBeLessThan(0.45);
});

test("on a phone the thumb-stick walks at the pace it is pushed and a drag elsewhere looks without selecting", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: base, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  // Out on the lawn there is room to walk in a straight line.
  await page.goto(visit + "#walk");
  await ready(page);
  const stick = page.locator(".tn-stick");
  await expect(stick).toBeVisible();
  await page.screenshot({ path: dir + "/phone-controls.png" });
  const box = (await stick.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(110);
  const cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", points: { x: number; y: number }[]) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map((p, id) => ({ ...p, id })) });
  const start = await state(page);
  // A light push forward: a slow, exact walk.
  await touch("touchStart", [{ x: cx, y: cy }]);
  await touch("touchMove", [{ x: cx, y: cy - 20 }]);
  await page.waitForTimeout(600);
  const light = await state(page);
  expect(light.speed).toBeGreaterThan(0.1);
  expect(light.speed).toBeLessThan(start.feel.walk * 0.5);
  // To the rim: a full stride (whatever the garden puts in the way further on).
  const run = record(page, 700);
  await touch("touchMove", [{ x: cx, y: cy - 60 }]);
  const stride = Math.max(...(await run).map((f) => f.speed));
  expect(stride).toBeGreaterThan(light.speed * 2.5);
  expect(stride).toBeLessThan(start.feel.walk * 1.25);
  await touch("touchEnd", []);
  await settled(page);
  const walked = await state(page);
  const ahead = { x: -Math.sin(start.yaw), z: -Math.cos(start.yaw) };
  expect((walked.x - start.x) * ahead.x + (walked.z - start.z) * ahead.z).toBeGreaterThan(0.5);
  expect(await page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine;
    return e.controller.ground.freeAt(e.camera.position.x, e.camera.position.z, e.controller.ground.radius - 0.004);
  })).toBe(true);
  await expect(page.locator(".tn-knob")).toHaveCSS("transform", "none");
  // A drag on the scene turns the view and is not read as a tap on anything.
  const url = page.url();
  await touch("touchStart", [{ x: 250, y: 420 }]);
  for (let i = 1; i <= 6; i++) await touch("touchMove", [{ x: 250 - i * 20, y: 420 }]);
  await touch("touchEnd", []);
  await settled(page);
  const turned = await state(page);
  expect(turned.yaw - walked.yaw).toBeGreaterThan(0.3);
  expect(page.url()).toBe(url);
  expect(Math.hypot(turned.x - walked.x, turned.z - walked.z)).toBeLessThan(0.01);
  // Two fingers spreading on the scene step forward; closing them steps back.
  await touch("touchStart", [{ x: 150, y: 400 }, { x: 240, y: 400 }]);
  for (let i = 1; i <= 5; i++) await touch("touchMove", [{ x: 150 - i * 8, y: 400 }, { x: 240 + i * 8, y: 400 }]);
  await touch("touchEnd", []);
  await settled(page);
  const pinched = await state(page);
  const facing = { x: -Math.sin(pinched.yaw), z: -Math.cos(pinched.yaw) };
  expect((pinched.x - turned.x) * facing.x + (pinched.z - turned.z) * facing.z).toBeGreaterThan(0.4);
  expect(Math.abs(pinched.yaw - turned.yaw)).toBeLessThan(0.05);
  expect(page.url()).toBe(url);
  // The plan opens on request and its stops are comfortable targets.
  await page.getByRole("button", { name: "Plan" }).tap();
  const stop = page.getByRole("button", { name: "Go to the writing table" });
  await expect(stop).toBeVisible();
  expect((await stop.boundingBox())!.width).toBeGreaterThanOrEqual(24);
  await page.screenshot({ path: dir + "/phone-plan-open.png" });
  await stop.tap();
  await expect(page).toHaveURL(/#desk$/);
  await context.close();
});

test("reduced motion arrives at once, by stop and by floor, and still walks by key", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", baseURL: base });
  const page = await context.newPage();
  await enter(page, "#library");
  const jump = await page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine,
      c = e.controller;
    c.go("reports");
    const stop = { off: e.camera.position.distanceTo(c.ground.node("reports")), travelling: c.travelling };
    const walked = c.walk(-3.4, -0.4);
    const p = e.camera.position;
    return { stop, walked, floor: Math.hypot(p.x + 3.4, p.z + 0.4), travelling: c.travelling };
  });
  expect(jump.stop).toEqual({ off: 0, travelling: false });
  expect(jump.walked).toBe(true);
  expect(jump.floor).toBeLessThan(0.001);
  expect(jump.travelling).toBe(false);
  // Stops chosen on the plan arrive without a flight, and there is nothing to skip.
  await page.getByRole("button", { name: "Go to the family cabinet" }).click();
  await expect(page).toHaveURL(/#cabinet$/);
  const at = await page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine;
    return { off: e.camera.position.distanceTo(e.controller.ground.node("cabinet")), travelling: e.controller.travelling };
  });
  expect(at).toEqual({ off: 0, travelling: false });
  await expect(page.getByRole("button", { name: "Skip travel" })).toHaveCount(0);
  // The visitor's own steps are still theirs to take; the eye does not bob.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const run = record(page, 1200);
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(700);
  await page.keyboard.up("KeyS");
  const frames = await run;
  expect(Math.hypot(frames[frames.length - 1].x - frames[0].x, frames[frames.length - 1].z - frames[0].z)).toBeGreaterThan(0.4);
  const level = frames[frames.length - 1].y;
  expect(frames.slice(-8).every((f) => Math.abs(f.y - level) < 0.002)).toBe(true);
  await context.close();
});

test("mouse look captures the pointer, releases it on Escape and leaves selection working", async ({ page }) => {
  await enter(page, "#cabinet");
  const button = page.getByRole("button", { name: "Mouse look" });
  await expect(button).toBeVisible();
  await button.click();
  await page.waitForFunction(() => (window as unknown as Probe).estateEngine.controller.debug().locked, null, { timeout: 5000 });
  await expect(page.locator(".tn-cross")).toBeVisible();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  // The mouse turns the view with no button held.
  const before = await state(page);
  await page.mouse.move(760, 430);
  await page.mouse.move(860, 430, { steps: 5 });
  await page.waitForTimeout(300);
  const turned = await state(page);
  expect(Math.abs(turned.yaw - before.yaw)).toBeGreaterThan(0.05);
  // Escape gives the pointer back. (A browser takes a real Escape for itself; a
  // scripted one reaches the page, which answers it the same way.)
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !(window as unknown as Probe).estateEngine.controller.debug().locked);
  await expect(page.locator(".tn-cross")).toHaveCount(0);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  // With the pointer captured, a click selects what is in the middle of the view:
  // face a volume, capture, click.
  await page.getByRole("button", { name: "Go to the family cabinet" }).click();
  await settled(page);
  await page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine;
    const p = e.camera.position,
      v = e.volume("agentic-mission-control")!.group.position;
    e.controller.restore({ position: p.clone(), yaw: Math.atan2(-(v.x - p.x), -(v.z - p.z)), pitch: Math.atan2(v.y - p.y, Math.hypot(v.x - p.x, v.z - p.z)) }, true);
  });
  await button.click();
  await page.waitForFunction(() => (window as unknown as Probe).estateEngine.controller.debug().locked, null, { timeout: 5000 });
  await page.mouse.click(400, 500);
  await expect(page).toHaveURL(/#book\/agentic-mission-control/);
  // A held book needs the pointer: it is released without being asked.
  await page.waitForFunction(() => !(window as unknown as Probe).estateEngine.controller.debug().locked);
  await expect(page.locator(".wb-reader[data-visible]")).toBeVisible({ timeout: 20000 });
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#cabinet$/);
  // And ordinary pointing still picks a spine off the shelf.
  await page.waitForFunction(() => {
    const e = (window as unknown as Probe).estateEngine;
    return !e.controller.travelling && e.volume("agent-knowledge-services") !== null;
  });
  await page.getByRole("button", { name: "Go to the family cabinet" }).click();
  await settled(page);
  const spine = await page.evaluate(() => {
    const e = (window as unknown as Probe).estateEngine;
    const canvas = document.querySelector<HTMLCanvasElement>(".tw canvas")!;
    const r = canvas.getBoundingClientRect();
    const g = e.volume("agent-knowledge-services")!.group.position;
    const v = e.camera.position.clone().set(g.x, g.y, g.z).project(e.camera);
    const cx = r.left + ((v.x + 1) / 2) * r.width,
      cy = r.top + ((1 - v.y) / 2) * r.height;
    // The binding's centre is inside the shelf: find a point that is on its spine.
    for (let ring = 0; ring < 14; ring++)
      for (let dy = -ring; dy <= ring; dy++)
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = cx + dx * 3,
            y = cy + dy * 3;
          if (document.elementFromPoint(x, y) === canvas && e.pick(x, y)?.target.slug === "agent-knowledge-services") return { x, y };
        }
    return null;
  });
  expect(spine).not.toBeNull();
  await page.mouse.click(spine!.x, spine!.y);
  await expect(page).toHaveURL(/#book\/agent-knowledge-services/);
});

test("the plan follows the visitor and every stop on it is a control", async ({ page }) => {
  await enter(page, "#library");
  const plan = page.getByRole("navigation", { name: "Plan of the ground floor" });
  await expect(plan).toBeVisible();
  await expect(plan.getByRole("button")).toHaveCount(9);
  await expect(plan.getByRole("button", { name: "Go to the judge’s library" })).toHaveAttribute("aria-current", "location");
  const mark = plan.locator(".tn-you");
  const before = await mark.getAttribute("transform");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyW");
  await settled(page);
  expect(await mark.getAttribute("transform")).not.toBe(before);
  // Keyboard alone: focus a stop and press Enter.
  const desk = plan.getByRole("button", { name: "Go to the writing table" });
  await desk.focus();
  await expect(plan.locator(".tn-note")).toHaveText("The writing table");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#desk$/);
  await settled(page);
  await expect(plan.getByRole("button", { name: "Go to the writing table" })).toHaveAttribute("aria-current", "location");
  // Walking keys still answer with focus on a stop, and nothing holds focus captive.
  const here = await state(page);
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(300);
  await page.keyboard.up("KeyS");
  await settled(page);
  expect((await state(page)).z).toBeGreaterThan(here.z + 0.1);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement !== document.body && !document.activeElement?.matches(".tn-stop[aria-label*=writing]"))).toBe(true);
  await page.screenshot({ path: dir + "/plan.png" });
  // The plan can be put away.
  await page.getByRole("button", { name: "Plan" }).click();
  await expect(plan).toHaveCount(0);
});
