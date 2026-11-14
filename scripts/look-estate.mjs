// Scripted look at the running preview: node scripts/look-estate.mjs <url> <w> <h> "<json steps>"
// steps: [["wait",ms],["click","selector"],["shot","file.png"],["eval","js"],["key","ArrowRight"],["ready"],["goto","url"],["text","selector"]]
import { chromium } from "@playwright/test";
const [url, w, h, raw, gpu] = process.argv.slice(2);
const steps = JSON.parse(raw);
const args = gpu ? ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] : ["--ignore-gpu-blocklist", "--enable-gpu"];
const browser = await chromium.launch({ channel: "chrome", headless: !gpu, args });
const context = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +w < 700 ? 2 : 1, hasTouch: +w < 700, isMobile: +w < 700 });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 300)));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 300)); });
await page.goto(url, { waitUntil: "domcontentloaded" });
for (const [op, arg] of steps) {
  try {
    if (op === "wait") await page.waitForTimeout(arg);
    else if (op === "ready") await page.waitForSelector("canvas[data-scene=ready]", { timeout: 90000 });
    else if (op === "click") await page.locator(arg).first().click({ timeout: 8000 });
    else if (op === "shot") await page.screenshot({ path: arg });
    else if (op === "eval") console.log("eval:", JSON.stringify(await page.evaluate(arg)));
    else if (op === "key") await page.keyboard.press(arg);
    else if (op === "goto") await page.goto(arg);
    else if (op === "text") console.log("text:", (await page.locator(arg).first().innerText()).slice(0, 400));
  } catch (e) { errors.push(op + " " + arg + ": " + String(e.message).split("\n")[0]); }
}
if (errors.length) console.log(errors.slice(0, 10).join("\n"));
await browser.close();
