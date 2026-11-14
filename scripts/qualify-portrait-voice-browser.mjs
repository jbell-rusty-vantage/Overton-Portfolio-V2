// Live browser proof of the spoken portrait: Chrome's fake microphone plays a recorded
// question into the real panel -> GPT-Live -> delegation -> grounded turn -> spoken reply,
// while the portrait's jaw is sampled from the engine. One real, metered voice session.
//   node scripts/qualify-portrait-voice-browser.mjs <microphone.wav> [--base http://127.0.0.1:3081]
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const wav = resolve(process.argv[2] ?? "");
const i = process.argv.indexOf("--base"), base = i > 0 ? process.argv[i + 1] : "http://127.0.0.1:3081";
const stay = process.argv.includes("--stay"); // the question should not navigate: stay before the portrait
const out = ".local-library/portrait-eval/voice-browser" + (stay ? "-portrait" : ""), steps = [];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${wav}%noloop`, "--autoplay-policy=no-user-gesture-required"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.grantPermissions(["microphone"], { origin: base });
const page = await context.newPage();
const errors = [], logs = []; page.on("pageerror", e => errors.push(String(e).slice(0, 200))); page.on("console", m => { if (m.type() === "error") logs.push(m.text().slice(0, 200)); });
const step = async (name, pass, detail = {}) => { steps.push({ name, pass, ...detail }); console.log(`${pass ? "pass" : "FAIL"} ${name} ${JSON.stringify(detail).slice(0, 300)}`); await page.screenshot({ path: `${out}/${String(steps.length).padStart(2, "0")}-${name.replace(/\W+/g, "-")}.png` }); };
try {
  await page.goto(base + "/admin/library/preview#entry");
  await page.locator(".tw[data-ready]").waitFor({ timeout: 180000 });
  const hashBefore = new URL(page.url()).hash;
  await page.getByRole("button", { name: "Ask Judge Overton", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "Ask Judge Overton" });
  const speak = panel.getByRole("button", { name: "Speak with the Judge" });
  await speak.waitFor({ timeout: 30000 });
  await step("panel offers spoken conversation", true, { note: await panel.locator(".portrait-voice small").textContent() });
  // Sample the portrait's jaw and live-drive state ten times a second from the engine.
  await page.evaluate(() => { const w = window; w.__jaw = []; w.__jawTimer = setInterval(() => { const p = w.estateEngine?.portrait; if (p) w.__jaw.push([Math.round(performance.now()), +(p.pose?.jaw ?? 0).toFixed(3), !!p.live]); }, 100); });
  const t0 = Date.now();
  await speak.click();
  await panel.getByText(/Listening/).waitFor({ timeout: 30000 });
  await step("session opens and listens", true, { ms: Date.now() - t0 });
  const caption = who => panel.locator(".portrait-voice-caption").filter({ has: page.locator("span", { hasText: new RegExp(`^${who}$`) }) });
  const visitor = caption("You");
  await visitor.waitFor({ timeout: 30000 });
  const judge = caption("The Judge");
  await judge.waitFor({ timeout: 45000 });
  const firstSpeechMs = Date.now() - t0;
  // Wait for the delegated, grounded turn to navigate (status) and for the spoken answer.
  if (stay) {
    // Capture the face mid-word: wait until the engine reports the jaw open.
    await page.waitForFunction(() => (window.estateEngine?.portrait?.pose?.jaw ?? 0) > 0.25, null, { timeout: 45000 }).catch(() => {});
    await page.screenshot({ path: `${out}/speaking-face.png` });
    await page.waitForTimeout(12000);
  } else {
    await panel.getByRole("status").filter({ hasText: /Opened|unavailable|cancelled/ }).first().waitFor({ timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(9000);
  }
  await step("portrait speaks the grounded answer", true, { firstSpeechMs, heard: (await visitor.innerText()).replace(/^You\s*/, ""), said: (await judge.innerText()).replace(/^The Judge\s*/, "") });
  const status = await panel.locator(".portrait-status").textContent(), hashAfter = new URL(page.url()).hash;
  const sourcesButton = await panel.getByRole("button", { name: /^Inspect \d+ sources?$/ }).textContent().catch(() => null);
  if (stay) await step("starting a spoken conversation brings the visitor before the portrait", hashAfter === "#portrait" && !!sourcesButton, { hashBefore, hashAfter, citations: sourcesButton, welcomeCardShown: await page.getByText("Hear his welcome").isVisible().catch(() => false) });
  else await step("spoken 'show me' opens the book through signed navigation", /^Opened /.test(status ?? "") && /mission/i.test(hashAfter), { status, hashBefore, hashAfter, citations: sourcesButton });
  const jaw = await page.evaluate(() => { clearInterval(window.__jawTimer); return window.__jaw; });
  const live = jaw.filter(j => j[2]), open = live.filter(j => j[1] > 0.15);
  await step("mouth follows the live voice", open.length > 5 && live.some(j => j[1] < 0.05), { samples: live.length, openSamples: open.length, maxJaw: Math.max(0, ...live.map(j => j[1])) });
  await panel.getByRole("button", { name: "End spoken conversation" }).click();
  await panel.getByText(/spoken conversation has ended/).waitFor({ timeout: 20000 });
  const mouthAfter = await page.evaluate(() => !!window.estateEngine?.portrait?.live);
  await step("ending closes the session and releases the mouth", !mouthAfter, { totalSessionMs: Date.now() - t0 });
} catch (error) { await step("unexpected failure", false, { error: String(error).slice(0, 400) }); }
finally {
  // Always close a voice session gracefully so its provider-reported duration settles.
  await page.getByRole("button", { name: "End spoken conversation" }).click({ timeout: 2000 }).catch(() => {});
  await page.getByText(/spoken conversation has ended/).waitFor({ timeout: 15000 }).catch(() => {});
  await writeFile(`${out}/observations.json`, JSON.stringify({ base, at: new Date().toISOString(), steps, pageErrors: errors, consoleErrors: logs }, null, 1));
  console.log(`${steps.filter(s => s.pass).length}/${steps.length} passed · page errors: ${errors.length} · console errors: ${logs.length}`);
  await browser.close();
}
