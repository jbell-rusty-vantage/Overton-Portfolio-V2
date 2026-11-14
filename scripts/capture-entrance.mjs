// Captures the approved live composition before replacing the idle renderer.
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome" });
const receipt = {};
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await page.goto("http://127.0.0.1:3078/admin/preview/library?entrance=live");
    const canvas = page.locator(".ea-live-first-frame[data-ready]");
    await canvas.waitFor({ timeout: 90000 });
    await page.addStyleTag({ content: ".ea-hero-content,.ea-hero-shade{visibility:hidden!important}" });
    const png = await canvas.screenshot();
    await writeFile(`.local-library/release/entrance-${width}.png`, png);
    const bytes = await sharp(png).webp({ quality: 90 }).toBuffer();
    const hash = createHash("sha256").update(bytes).digest("hex"), url = `/media/${hash}/entrance.webp`;
    await mkdir(`public/media/${hash}`, { recursive: true });
    await writeFile("public" + url, bytes);
    receipt[width] = { url, sha256: hash, bytes: bytes.length, provenance: "Screenshot of the approved estate engine's approach camera, no repainting." };
    await page.close();
  }
  await mkdir("content/library", { recursive: true });
  await writeFile("content/library/entrance-delivery.json", JSON.stringify(receipt, null, 2) + "\n");
  console.log(receipt);
} finally { await browser.close(); }
