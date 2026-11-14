import { chromium, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

const base = process.env.RELEASE_BASE_URL || "http://localhost:3086";
const label = process.env.RELEASE_LABEL || "local-preview";
const headers = process.env.RELEASE_BYPASS ? { "x-vercel-protection-bypass": process.env.RELEASE_BYPASS } : {};
const browser = await chromium.launch({ channel: "chrome" });
const result = { base, at: new Date().toISOString(), routes: [], headers: {} };
try {
  const context = await browser.newContext({ baseURL: base });
  if (process.env.RELEASE_BYPASS) await context.request.get("/", { headers: { ...headers, "x-vercel-set-bypass-cookie": "true" } });
  const page = await context.newPage();
  for (const path of ["/", "/library", "/projects/gowipe", "/resume", "/catalog", "/performances", "/robots.txt", "/sitemap.xml"]) {
    const r = await context.request.get(path);
    expect(r.status(), path).toBe(200);
    result.routes.push({ path, status: r.status(), bytes: (await r.body()).length });
  }
  for (const path of ["/admin", "/admin/preview/library", "/admin/preview/projects/gowipe"]) {
    const r = await context.request.get(path, { maxRedirects: 0 });
    expect(r.status(), path).toBeGreaterThanOrEqual(300);
    expect(r.headers().location).toContain("/admin/login");
  }
  for (const slug of ["biotech-knowledge-platform", "daryl-davis", "the-library"]) {
    const r = await context.request.get("/projects/" + slug);
    expect(await r.text()).not.toContain(`data-report="${slug}"`);
  }
  const sitemap = await (await context.request.get("/sitemap.xml")).text();
  expect(sitemap).not.toMatch(/admin|biotech-knowledge-platform|daryl-davis/);
  for (const path of ["/dev/world-lab", "/samples"]) {
    const r = await context.request.get(path);
    expect(r.status(), path).toBe(404);
  }
  await page.goto("/projects#work-gowipe");
  await expect(page).toHaveURL(new RegExp("/#work-gowipe$"));
  await expect(page.locator("#work-gowipe")).toBeInViewport();
  await page.goto("/#book/gowipe/architecture/3");
  await expect(page).toHaveURL(/\/library#book\/gowipe\/architecture\/3$/);
  await page.goto("/?view=world&zone=stacks&shelf=stacks-ai-agents");
  await expect(page).toHaveURL(/\/library\?view=world&zone=stacks&shelf=stacks-ai-agents$/);
  await page.goto("/");
  await expect(page.locator(".pf-project")).toHaveCount(6);
  await page.screenshot({ path: `.local-library/release/${label}-portfolio.png`, fullPage: true });
  const inventory = JSON.parse(await readFile("content/library/entrance-delivery.json", "utf8"));
  const candidate = JSON.stringify(inventory).match(/\/media\/[a-f0-9]{64}\/[^" ]+/)?.[0];
  const immutable = await context.request.get(candidate);
  result.headers.immutable = immutable.headers();
  if (base.startsWith("https:")) expect(immutable.headers()["cache-control"]).toContain("immutable");
  const video = await context.request.get("/performances/wellington-mens-vs-royal-palm/free_kick_goal.mp4", { headers: { Range: "bytes=0-1023" } });
  expect(video.status()).toBe(206); expect((await video.body()).length).toBe(1024);
  result.headers.video = video.headers();
  const pdf = await context.request.get("/john-overton-bell-resume.pdf");
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect(pdf.headers()["cache-control"] ?? "").not.toContain("immutable");
  if (base.startsWith("https:")) expect((await context.request.get("/free-kick-goal.mp4")).status()).toBe(404);
  result.visitor = "passed";
  if (process.argv.includes("--preview-login")) {
    const credentials = JSON.parse(await readFile(".local-library/release/preview-login.json", "utf8"));
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(credentials.email); await page.getByLabel("Password").fill(credentials.password);
    await page.getByRole("button", { name: "Enter the office" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    for (const path of ["/admin/media", "/admin/library", "/admin/preview/portfolio", "/admin/preview/projects/gowipe"]) {
      const r = await page.goto(path); expect(r.status()).toBe(200);
      if (path.includes("/preview/")) await expect(page.locator(".preview-label")).toContainText("Private draft preview");
    }
    await page.goto("/admin/library/preview?read=gowipe#report-section-architecture");
    await expect(page).toHaveURL(/\/admin\/preview\/projects\/gowipe#report-section-architecture$/);
    await context.storageState({ path: `.local-library/release/${label}-storage.json` });
    result.authenticatedPreview = "passed";
  }
  console.log(JSON.stringify(result));
} finally {
  await writeFile(`.local-library/release/http-${label}.json`, JSON.stringify(result, null, 2));
  await browser.close();
}
