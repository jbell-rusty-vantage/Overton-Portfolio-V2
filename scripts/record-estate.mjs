// Record one continuous visit to the library against the running private preview:
//   node scripts/record-estate.mjs [base-url] [out-dir]
// Enter, hear the portrait, take a project volume, turn pages, return it, lift the
// 1832 letter, look at another scan, return it and open the cabinet screen. The video
// is one unbroken take of one page; close-up stills are written beside it.
import { chromium, expect } from "@playwright/test";
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { installEstateMedia } from "./test-estate-media.mjs";

const base = process.argv[2] || "http://127.0.0.1:3078/admin/library/preview";
const out = process.argv[3] || "docs/travellers-rest-review";
const raw = ".local-library/evidence/estate/recording";
const recordingPath = path.resolve(raw);
if (!recordingPath.startsWith(path.resolve(".local-library/evidence/estate") + path.sep)) throw Error("Recording cleanup escaped its workspace directory");
await rm(recordingPath, { recursive: true, force: true });
await mkdir(raw, { recursive: true });
await mkdir(out, { recursive: true });
const size = { width: 1280, height: 720 };
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({
  viewport: size,
  deviceScaleFactor: 1,
  recordVideo: { dir: raw, size },
});
// Rehearse the exact unpublished inventory bytes without uploading or importing.
await installEstateMedia(context);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const pause = (ms) => page.waitForTimeout(ms);
const still = (name) => page.screenshot({ path: path.join(out, name + ".png") });
const reach = (name) =>
  page.getByRole("navigation", { name: /Within reach/ }).getByRole("button", { name });
const guide = page.getByRole("region", { name: /the custodian/ });

try {
await page.goto(base);
await page.getByRole("link", { name: "Enter the library" }).first().waitFor({ timeout: 60000 });
await pause(1500);
await still("world-entrance");
// The owner's introduction on the entrance, then back up to the door.
await page.locator(".ea-intro").scrollIntoViewIfNeeded();
await pause(2200);
await still("world-introduction");
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await pause(1400);
await page.getByRole("link", { name: "Enter the library" }).first().click();
await page.locator("canvas[data-scene=ready]").waitFor({ timeout: 90000 });
// The whole walk: lawn, portico, hall, library doorway.
await pause(1300);
await still("world-grounds");
await guide.waitFor({ timeout: 40000 });
await pause(800);
await still("world-library");
await guide.getByRole("button", { name: "Hear his welcome" }).click();
await pause(6500);
await still("world-custodian");
await pause(13000);
await guide.getByRole("button", { name: /Show me John/ }).click();
await reach(/Mission Control/).waitFor({ timeout: 30000 });
await pause(9500);
await still("world-cabinet");
await reach(/Mission Control/).click();
await page.locator(".wb-reader[data-visible]").waitFor({ timeout: 30000 });
await pause(9000);
if (await guide.isVisible()) await guide.getByRole("button", { name: "Close the custodian" }).click();
await still("world-book");
for (let i = 0; i < 4; i++) {
  await page.keyboard.press("ArrowRight");
  if (i === 1) {
    await pause(430);
    await still("world-page-turn");
    await pause(1500);
  } else await pause(2100);
}
await still("world-reading");
const readingMarker = new URL(page.url()).hash;
await page.getByRole("button", { name: "Open full report", exact: true }).click();
await expect(page.getByRole("dialog", { name: "Mission Control full report" })).toBeVisible();
await pause(2400); await still("world-full-report");
await page.getByRole("button", { name: "Close report and return to book" }).click();
await expect.poll(() => new URL(page.url()).hash).toBe(readingMarker);
await page.getByRole("button", { name: "Ask Judge Overton", exact: true }).click();
const conversation = page.getByRole("complementary", { name: "Ask Judge Overton", exact: true });
await conversation.getByLabel("Your question").fill("How does Knowledge Services check its sources?");
await conversation.getByRole("button", { name: "Ask", exact: true }).click();
await expect(conversation.getByText("Deterministic rehearsal · no live model", { exact: true })).toBeVisible({ timeout: 30000 });
await conversation.getByRole("button", { name: /^Inspect \d+ sources?$/ }).click();
await expect(conversation.getByRole("region", { name: "Verified sources" })).toBeVisible();
await pause(2200); await still("world-portrait-sources");
await conversation.getByLabel("Your question").fill("Show me Knowledge Services");
await conversation.getByRole("button", { name: "Ask", exact: true }).click();
await expect(conversation.getByRole("status")).toContainText("Opened Knowledge Services", { timeout: 45000 });
await pause(2000); await still("world-portrait-destination");
await page.goBack();
await expect.poll(() => new URL(page.url()).hash).toBe(readingMarker);
await conversation.getByRole("button", { name: "Close conversation" }).click();
await writeFile(path.join(out, "visitor-proof.json"), JSON.stringify({ readingMarker, returned: new URL(page.url()).hash, report: true, citedMockConversation: true, guidedProjectAndBack: true, liveModel: false }, null, 2));
await page.keyboard.press("Escape");
await pause(3200);
// To the writing table for the letter.
await page.getByRole("button", { name: "Directory" }).click();
await page.getByRole("complementary", { name: "Directory" }).getByRole("button", { name: /The writing table/ }).click();
await reach(/John Overton to Andrew Jackson/).waitFor({ timeout: 30000 });
await pause(1200);
await still("world-desk");
await reach(/John Overton to Andrew Jackson/).click();
const panel = page.getByRole("complementary", { name: /Examining/ });
await panel.waitFor();
await pause(8500);
if (await guide.isVisible()) await guide.getByRole("button", { name: "Close the custodian" }).click();
await panel.getByRole("tab", { name: "Transcription" }).click();
await panel.getByRole("button", { name: /No man living but yourself can/ }).click();
await pause(2600);
await still("world-letter");
await panel.getByRole("button", { name: "Next scan" }).click();
await pause(3200);
await still("world-letter-scan-2");
await panel.getByRole("button", { name: "Return to the desk" }).click();
await pause(2600);
// Back to the cabinet and its screen.
await page.getByRole("button", { name: "Directory" }).click();
await page.getByRole("complementary", { name: "Directory" }).getByRole("button", { name: /The family cabinet/ }).click();
await reach("The work screen").waitFor({ timeout: 30000 });
await reach("The work screen").click();
const screen = page.getByRole("region", { name: "The work screen" });
await screen.getByRole("button", { name: "Play the recording" }).click();
await pause(6500);
await still("world-screen");
await screen.getByRole("button", { name: "Step back from the screen" }).click();
await pause(2500);
await page.getByRole("button", { name: "Walk back outside", exact: true }).click();
await expect(page.getByRole("heading", { name: "Travellers Rest", exact: true })).toBeVisible({ timeout: 45000 });
await still("world-returned-entrance");
expect(errors, "continuous visit has no page errors").toEqual([]);
} finally {
await context.close();
await browser.close();
}
const [file] = (await readdir(raw)).filter((f) => f.endsWith(".webm"));
await rename(path.join(raw, file), path.join(raw, "continuous-visit.webm"));
console.log("Recorded", path.join(raw, "continuous-visit.webm"), errors.length ? errors : "no page errors");
