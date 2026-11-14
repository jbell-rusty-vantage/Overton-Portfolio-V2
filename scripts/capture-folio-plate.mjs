// Refresh the cabinet's loading/fallback plate from the current Blender-backed
// room, including its live book labels and printed folio index. No database writes.
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const base = process.argv[2] ?? "http://127.0.0.1:3078/admin/library/preview";
const out = ".local-library/folio";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    (process.platform === "win32" && existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe") ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, reducedMotion: "reduce" });
  await page.goto(base + "#cabinet");
  await page.waitForSelector("canvas[data-scene=ready][data-kit=blender]", { timeout: 60000 });
  const data = await page.evaluate(async () => {
    const engine = window.estateEngine;
    if (!engine) throw Error("Use the authorized local draft preview for the plate capture");
    await Promise.all([...engine.volumes.values()].map(volume => volume.ready));
    engine.renderer.setPixelRatio(1);
    engine.resize();
    engine.renderer.render(engine.scene, engine.camera);
    return document.querySelector("canvas[data-scene=ready]").toDataURL("image/png");
  });
  const png = Buffer.from(data.split(",")[1], "base64");
  await writeFile(out + "/cabinet-current.png", png);
  for (const [name, width] of [["cabinet", 1440], ["cabinet-small", 800]]) {
    const target = "public/travellers-rest/plates/" + name + ".webp";
    const backup = out + "/before-" + name + ".webp";
    if (!existsSync(backup)) await copyFile(target, backup);
    await sharp(png).resize(width).webp({ quality: 88 }).toFile(target);
  }
  console.log("Refreshed both cabinet plates from the current room; originals backed up in " + out);
} finally { await browser.close(); }
