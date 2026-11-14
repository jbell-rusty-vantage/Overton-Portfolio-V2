// Test-only delivery fixture for unpublished content-addressed estate assets.
// The application still validates real GLB bytes and normal media URLs. Nothing is
// uploaded, and no runtime/public-policy exception is installed in application code.
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { media, checksum } from "./estate-inventory.mjs";

const inventory = new Map(media.map((item) => [item.url, item]));
const publicRoot = resolve("public") + sep;

async function fixture(url, range) {
  const item = inventory.get(url);
  if (!item) return null;
  const path = resolve("public" + item.localUrl);
  if (!path.startsWith(publicRoot)) throw Error("Fixture path escaped public assets");
  const bytes = await readFile(path);
  if (checksum(bytes) !== item.sha256) throw Error("Fixture asset changed during qualification: " + item.key);
  const headers = { "Content-Type": item.mime, "Accept-Ranges": "bytes", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" };
  const match = /^bytes=(\d+)-(\d*)$/.exec(range ?? "");
  if (match) {
    const start = Number(match[1]);
    const end = Math.min(bytes.length - 1, match[2] ? Number(match[2]) : bytes.length - 1);
    if (start > end || start >= bytes.length) return { status: 416, headers: { ...headers, "Content-Range": `bytes */${bytes.length}` }, body: Buffer.alloc(0) };
    headers["Content-Range"] = `bytes ${start}-${end}/${bytes.length}`;
    headers["Content-Length"] = String(end - start + 1);
    return { status: 206, headers, body: bytes.subarray(start, end + 1) };
  }
  headers["Content-Length"] = String(bytes.length);
  return { status: 200, headers, body: bytes };
}

// Activated only by the disposable-database harness's node --import argument.
if (process.env.ESTATE_TEST_MEDIA === "1") {
  const database = new URL(process.env.DATABASE_URL ?? "");
  if (database.hostname !== "127.0.0.1" || process.env.LIBRARY_OFFICE_TEST !== "1")
    throw Error("Estate media fixtures require the isolated loopback test database");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const range = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).get("range");
    const found = await fixture(url, range);
    if (!found) return originalFetch(input, init);
    return new Response(found.body, { status: found.status, headers: found.headers });
  };
}

/** Install on every newly created browser context, before navigating. */
export async function installEstateMedia(context) {
  await context.route("https://*.public.blob.vercel-storage.com/**", async (route) => {
    const found = await fixture(route.request().url(), route.request().headers().range);
    if (found) await route.fulfill(found);
    else await route.continue();
  });
}

/** The existing estate profiler creates its own pages and contexts. */
export function instrumentEstateBrowser(browser) {
  const newContext = browser.newContext.bind(browser);
  const newPage = browser.newPage.bind(browser);
  browser.newContext = async (...args) => {
    const context = await newContext(...args);
    await installEstateMedia(context);
    return context;
  };
  browser.newPage = async (...args) => {
    const page = await newPage(...args);
    await installEstateMedia(page.context());
    return page;
  };
}
