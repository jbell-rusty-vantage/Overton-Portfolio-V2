// Measure the continuous library in the isolated production rehearsal: the walk in,
// the speaking portrait, a real page turn, a document held close and the cabinet film.
import { expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

function collectFrames() {
  const metrics = { drawing: false, draws: [], presentation: [] };
  window.estateSamples = metrics;
  function instrument(type, method) {
    if (!type?.prototype[method]) return;
    const original = type.prototype[method];
    type.prototype[method] = function (...args) {
      metrics.drawing = true;
      return original.apply(this, args);
    };
  }
  for (const name of [
    "drawElements",
    "drawArrays",
    "drawElementsInstanced",
    "drawArraysInstanced",
  ])
    instrument(window.WebGL2RenderingContext, name);
  instrument(window.GPUQueue, "submit");
  function tick(t) {
    metrics.presentation.push(t);
    if (metrics.drawing) metrics.draws.push(t);
    metrics.drawing = false;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function stats(intervals) {
  const sorted = [...intervals].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const at = (p) =>
    +sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)].toFixed(1);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return {
    samples: sorted.length,
    meanMs: +mean.toFixed(1),
    medianMs: at(0.5),
    p95Ms: at(0.95),
    averageFps: +(1000 / mean).toFixed(1),
  };
}
function intervals(times) {
  return times.slice(1).map((t, i) => t - times[i]);
}
async function take(page, duration) {
  return page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const m = window.estateSamples;
        m.draws = [];
        m.presentation = [];
        const started = performance.now();
        setTimeout(
          () =>
            resolve({ draws: [...m.draws], presentation: [...m.presentation], started, ended: performance.now() }),
          ms,
        );
      }),
    duration,
  );
}
async function measure(browser, base, device) {
  const mobile = device === "Emulated phone";
  const context = await browser.newContext({
    baseURL: base,
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1366, height: 860 },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "no-preference",
    ...(mobile
      ? {
          userAgent:
            "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36",
        }
      : {}),
  });
  await context.addInitScript(collectFrames);
  const page = await context.newPage();
  const trouble = [];
  page.on("pageerror", (e) => trouble.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") trouble.push("console: " + m.text().slice(0, 240));
  });
  const cdp = await context.newCDPSession(page);
  const traffic = new Map();
  cdp.on("Network.requestWillBeSent", (e) =>
    traffic.set(e.requestId, { url: e.request.url, bytes: 0, complete: false }),
  );
  cdp.on("Network.dataReceived", (e) => {
    const r = traffic.get(e.requestId);
    if (r) r.bytes += e.encodedDataLength || 0;
  });
  cdp.on("Network.loadingFinished", (e) => {
    const r = traffic.get(e.requestId);
    if (r) {
      r.bytes = e.encodedDataLength;
      r.complete = true;
    }
  });
  await cdp.send("Network.enable");
  const wire = () => [...traffic.values()].reduce((n, r) => n + r.bytes, 0);
  const measured = (sample) => ({
    draw: stats(intervals(sample.draws)),
    presentation: stats(intervals(sample.presentation)),
    // Interval averages alone omit an initial shader/upload stall before the first
    // RAF. Retain the complete wall-clock window and both boundary gaps as well.
    window: {
      durationMs: +(sample.ended - sample.started).toFixed(1),
      draws: sample.draws.length,
      presentations: sample.presentation.length,
      drawFps: +(sample.draws.length * 1000 / (sample.ended - sample.started)).toFixed(1),
      presentationFps: +(sample.presentation.length * 1000 / (sample.ended - sample.started)).toFixed(1),
      firstDrawAfterStartMs: sample.draws.length ? +Math.max(0, sample.draws[0] - sample.started).toFixed(1) : null,
      lastDrawBeforeEndMs: sample.draws.length ? +Math.max(0, sample.ended - sample.draws.at(-1)).toFixed(1) : null,
    },
  });
  try {
    await page.goto(process.env.ESTATE_PROFILE_PATH || "/library");
    await page
      .getByRole("heading", { name: "Travellers Rest", exact: true })
      .waitFor();
    await page.waitForLoadState("networkidle");
    const entranceBytes = wire();
    // Enter: the walk from the lawn to the library doorway, fully rendered.
    const entryStarted = performance.now();
    await page.getByRole("link", { name: "Enter the library" }).first().click();
    const canvas = page.locator("canvas[data-scene=ready]");
    await canvas.waitFor({ timeout: 60000 });
    const entryReadyMs = +(performance.now() - entryStarted).toFixed(1);
    const preparation = JSON.parse(await canvas.getAttribute("data-preparation") || "null");
    const walkIn = measured(await take(page, 5000));
    const backend = await canvas.getAttribute("data-backend");
    const tier = await canvas.getAttribute("data-tier");
    const guide = page.getByRole("region", { name: /the custodian/ });
    await guide.waitFor({ timeout: 30000 });
    const roomBytes = wire();
    // The portrait speaking in its frame, voice and mouth on the audio clock.
    await guide.getByRole("button", { name: "Hear his welcome" }).click();
    await page.waitForFunction(
      () => (document.querySelector(".tw-line")?.textContent ?? "").trim().length > 8,
    );
    const speaking = measured(await take(page, 5000));
    await guide.getByRole("button", { name: /Show me John/ }).click();
    const spine = page
      .getByRole("navigation", { name: /Within reach/ })
      .getByRole("button", { name: /Mission Control/ });
    // On a narrow screen the custodian covers the strip of things within reach.
    await guide.getByRole("button", { name: "Close the custodian" }).click();
    await spine.waitFor({ timeout: 30000 });
    await spine.click();
    await page.locator(".wb-reader[data-visible]").waitFor({ timeout: 30000 });
    await page.waitForLoadState("networkidle");
    const bookBytes = wire();
    const glbs = [...traffic.values()]
      .filter((r) => new URL(r.url).pathname.endsWith(".glb"))
      .map((r) => ({
        file: new URL(r.url).pathname.split("/").pop(),
        wireBytes: r.bytes,
      }));
    // Real leaf turns: the clock starts in the same turn of the event loop as the click.
    const drawing = [],
      display = [];
    const turns = [];
    const turnWindows = [];
    for (const label of ["Next page", "Next page", "Next page", "Previous page", "Previous page", "Next page"]) {
      const button = page.getByRole("button", { name: label });
      if (await button.isDisabled()) continue;
      const before = await page.locator(".wb-contents").innerText();
      const sample = await button.evaluate(
        (control, ms) =>
          new Promise((resolve) => {
            const m = window.estateSamples;
            m.draws = [];
            m.presentation = [];
            const started = performance.now();
            control.click();
            setTimeout(
              () =>
                resolve({
                  draws: [...m.draws],
                  presentation: [...m.presentation],
                  started, ended: performance.now(),
                }),
              ms,
            );
          }),
        1000,
      );
      drawing.push(...intervals(sample.draws));
      display.push(...intervals(sample.presentation));
      turnWindows.push(measured(sample).window);
      await expect(page.locator(".wb-contents")).not.toHaveText(before);
      turns.push(await page.locator(".wb-contents").innerText());
    }
    const hw = await page.evaluate(async () => {
      const g = document.createElement("canvas").getContext("webgl2"),
        ext = g?.getExtension("WEBGL_debug_renderer_info");
      return {
        webgl: ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
        devicePixelRatio,
      };
    });
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/#cabinet$/);
    // A document held close, magnified.
    await page.evaluate(() => {
      location.hash = "object/overton-letter";
    });
    const panel = page.getByRole("complementary", { name: /Examining/ });
    await panel.waitFor({ timeout: 30000 });
    await page
      .getByRole("button", { name: "Close the custodian" })
      .click({ timeout: 3000 })
      .catch(() => {});
    await page.waitForLoadState("networkidle");
    await panel.getByRole("button", { name: "Zoom in" }).click();
    await panel.getByRole("button", { name: "Zoom in" }).click();
    const document = measured(await take(page, 3000));
    const letterBytes = wire();
    await panel.getByRole("button", { name: /Return to/ }).click();
    // With touch emulation the tap is delivered a moment later: let the room settle
    // before asking for the next thing, as a visitor necessarily would.
    await expect(page).toHaveURL(/#desk$/);
    await expect(panel).toBeHidden();
    // The cabinet film on the screen in the room.
    await page.evaluate(() => {
      location.hash = "screen/film";
    });
    const screen = page.getByRole("region", { name: "The viewing folio" });
    await screen.getByRole("button", { name: "Play the recording" }).click();
    await page.waitForFunction(
      () => document.querySelector("video")?.currentTime > 0.6,
    );
    const quality = () =>
      page.locator("video").evaluate((v) => {
        const q = v.getVideoPlaybackQuality();
        return {
          decoded: q.totalVideoFrames,
          dropped: q.droppedVideoFrames,
          mediaTime: v.currentTime,
        };
      });
    const before = await quality();
    const film = await take(page, 3600);
    const after = await quality();
    return {
      device,
      backend,
      tier,
      hardware: hw,
      entranceBytes,
      roomBytes,
      bookBytes,
      letterBytes,
      glbs,
      entryReadyMs,
      preparation,
      walkIn,
      speaking,
      pageTurn: { draw: stats(drawing), presentation: stats(display), turns, windows: turnWindows },
      document,
      videoTexture: {
        ...measured(film),
        mediaSeconds: +(after.mediaTime - before.mediaTime).toFixed(2),
        decoded: after.decoded - before.decoded,
        dropped: after.dropped - before.dropped,
      },
    };
  } catch (error) {
    // Leave enough behind to see what the visitor would have seen.
    await page
      .screenshot({
        path:
          ".local-library/evidence/estate/profile-failure-" +
          (mobile ? "phone" : "desktop") +
          ".png",
      })
      .catch(() => {});
    console.log("Measurement stopped at", page.url(), trouble.slice(-6));
    throw error;
  } finally {
    await context.close();
  }
}
export async function profileEstate(browser, base) {
  const results = [];
  await mkdir(".local-library/evidence/estate", { recursive: true });
  for (const device of ["Desktop", "Emulated phone"]) {
    const row = await measure(browser, base, device);
    results.push(row);
    await writeFile(
      ".local-library/evidence/estate/performance-v2.json",
      JSON.stringify({ browser: browser.version(), edition: 2, results }, null, 2) + "\n",
    );
    console.log(
      "Measured",
      device,
      row.backend,
      row.tier,
      "entryReadyMs", row.entryReadyMs,
      "walk",
      row.walkIn.draw,
      "full walk window", row.walkIn.window,
      "speaking",
      row.speaking.draw,
      "turn",
      row.pageTurn.draw,
      "document",
      row.document.draw,
      "film",
      row.videoTexture.draw,
    );
  }
}
