import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const base = process.env.RELEASE_BASE_URL || "http://localhost:3086";
const browser = await chromium.launch({ channel: "chrome" });
const result = { base, profile: "Chrome workstation, reduced motion; same-document visits; hidden-state event simulated", cycles: [] };
function instrument() {
  const contexts = new Map();
  window.releaseGPU = { contexts, draws: 0 };
  const proto = WebGL2RenderingContext.prototype;
  function state(gl) {
    if (!contexts.has(gl)) {
      const record = { lost: false, textures: new Set(), buffers: new Set(), programs: new Set() };
      contexts.set(gl, record);
      gl.canvas.addEventListener("webglcontextlost", () => { record.lost = true; record.textures.clear(); record.buffers.clear(); record.programs.clear(); contexts.delete(gl); });
    }
    return contexts.get(gl);
  }
  for (const [kind, field] of [["Texture", "textures"], ["Buffer", "buffers"], ["Program", "programs"]]) {
    const create = proto["create" + kind], remove = proto["delete" + kind];
    proto["create" + kind] = function (...args) { const value = create.apply(this, args); state(this)[field].add(value); return value; };
    proto["delete" + kind] = function (value) { state(this)[field].delete(value); return remove.call(this, value); };
  }
  for (const method of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
    const original = proto[method];
    proto[method] = function (...args) { window.releaseGPU.draws++; return original.apply(this, args); };
  }
}
try {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1366, height: 860 } });
  await context.addInitScript(instrument);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page), errors = [];
  page.on("pageerror", e => errors.push(e.message));
  const stats = () => page.evaluate(() => ({ draws: window.releaseGPU.draws, canvas: document.querySelectorAll("canvas[data-scene]").length, contexts: [...window.releaseGPU.contexts.values()].filter(r => !r.lost).map(r => ({ textures: r.textures.size, buffers: r.buffers.size, programs: r.programs.size })) }));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route("**/*.glb", async route => { await gate; await route.continue().catch(() => {}); });
  await page.goto(base + "/library#cabinet");
  await page.getByRole("button", { name: "Continue without 3D" }).click({ timeout: 60000 });
  release(); await page.unroute("**/*.glb");
  await page.waitForTimeout(2500);
  result.cancelledEntry = await stats();
  expect(result.cancelledEntry.contexts.filter(r => r.textures || r.buffers || r.programs)).toEqual([]);
  await page.goto(base + "/library");
  for (let cycle = 0; cycle < Number(process.env.RELEASE_LIFECYCLE_CYCLES || 5); cycle++) {
    await page.getByRole("link", { name: "Enter the library", exact: true }).first().click();
    await expect(page.locator("canvas[data-scene=ready]")).toBeVisible({ timeout: 90000 });
    await page.evaluate(() => { location.hash = "#book/gowipe"; });
    await expect(page.locator('.wb-reader[data-visible][data-volume="gowipe"]')).toBeVisible({ timeout: 60000 });
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    const mark = await page.locator(".wb-contents span").innerText();
    const active = await stats();
    await page.getByRole("button", { name: "Open full report", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "GoWipe full report" })).toBeVisible();
    await page.waitForTimeout(500); const paused = (await stats()).draws;
    await page.waitForTimeout(700); expect((await stats()).draws).toBe(paused);
    await page.keyboard.press("Escape");
    await expect(page.locator(".wb-contents span")).toHaveText(mark);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const hidden = (await stats()).draws; await page.waitForTimeout(700); expect((await stats()).draws).toBe(hidden);
    await page.evaluate(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event("visibilitychange")); });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Walk back outside", exact: true }).click();
    await expect(page.getByRole("link", { name: "Enter the library", exact: true }).first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(800);
    await cdp.send("HeapProfiler.collectGarbage");
    const exited = await stats(), heap = await cdp.send("Runtime.getHeapUsage");
    expect(exited.canvas).toBe(0);
    expect(exited.contexts.filter(r => r.textures || r.buffers || r.programs)).toEqual([]);
    result.cycles.push({ cycle, active, exited, heap, reportDraws: 0, hiddenDraws: 0 });
  }
  await page.getByRole("link", { name: "Enter the library", exact: true }).first().click();
  await expect(page.locator("canvas[data-scene=ready]")).toBeVisible({ timeout: 90000 });
  await page.locator("canvas[data-scene=ready]").evaluate(canvas => canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
  await expect(page.locator("canvas[data-scene]")).toHaveCount(0);
  await expect(page.getByText("The 3D library could not be opened on this device.", { exact: false })).toBeVisible();
  result.contextLossFallback = true; result.errors = errors;
  expect(errors).toEqual([]);
  console.log(JSON.stringify(result));
} finally {
  await writeFile(".local-library/release/lifecycle.json", JSON.stringify(result, null, 2));
  await browser.close();
}
