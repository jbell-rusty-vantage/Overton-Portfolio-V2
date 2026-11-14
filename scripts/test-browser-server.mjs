// Disposable browser-suite database. Never imports environment files or connects
// to the owner's database; both Prisma URLs are replaced before Next starts.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readFile, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { randomBytes, randomUUID } from "node:crypto";
import { records, insertRecord } from "./estate-inventory.mjs";

const db = await PGlite.create();
const socket = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 0, maxConnections: 20 });
let child;
let closing = false;
async function close(code = 0) {
  if (closing) return;
  closing = true;
  if (child && child.exitCode === null) {
    if (process.platform === "win32") {
      await new Promise((resolve) => {
        const kill = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
        kill.on("exit", resolve);
      });
    } else child.kill("SIGTERM");
  }
  await socket.stop().catch(() => {});
  await db.close();
  process.exit(code);
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => void close());
try {
  const migrations = (await readdir("prisma/migrations", { withFileTypes: true }))
    .filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  for (const migration of migrations)
    await db.exec(await readFile(`prisma/migrations/${migration.name}/migration.sql`, "utf8"));

  const starters = JSON.parse(await readFile("assets/library/starters.json", "utf8"));
  const content = JSON.parse(await readFile("content/library/books.json", "utf8"));
  for (const starter of starters) {
    const source = content.books.find((book) => book.slug === starter.slug);
    if (!source) throw Error("Missing checked-in starter content: " + starter.slug);
    const cover = randomUUID();
    await db.query("insert into media_assets(id,kind,provider,url,title,alt,updated_at) values($1,'image','external',$2,$3,$4,now())",
      [cover, source.cover, source.title + " cover", source.media.find((item) => item.url === source.cover)?.alt ?? source.title]);
    await db.query("insert into projects(id,slug,title,tagline,summary,status,tags,cover_media_id,display,activation,updated_at) values($1,$2,$3,$4,$5,$6,$7,$8,'hidden','inactive',now())",
      [starter.projectId, source.slug, source.title, source.tagline, source.summary, source.status, source.tags, cover]);
    await db.query("insert into books(id,slug,title,subtitle,entity_type,entity_id,cover_media_id,page_mode,display,updated_at) values($1,$2,$3,$4,'project',$5,$6,'authored','hidden',now())",
      [starter.bookId, source.slug, source.title, source.tagline, starter.projectId, cover]);
    for (const page of source.pages)
      await db.query("insert into book_pages(id,book_id,position,template_code,blocks,updated_at) values($1,$2,$3,$4,$5,now())",
        [randomUUID(), starter.bookId, page.position, page.template, JSON.stringify(page.blocks)]);
    await db.query("insert into shelf_slots(id,shelf_id,position,entity_type,entity_id) select $1,id,$2,'book',$3 from shelves where slug=$4",
      [randomUUID(), source.position, starter.bookId, source.shelf]);
  }
  // Exact checked-in estate records retain their validated public media addresses.
  // The application's receipt maps the guided edition to local bytes in development.
  // Edition one supports the study; the development projection supplies the current
  // continuous world from the same checkout. All records remain hidden/inactive.
  for (const record of records) await insertRecord(db, record);
  await socket.start();
  const url = "postgresql://postgres@" + socket.getServerConn() + "/postgres";
  child = spawn(process.execPath, [createRequire(import.meta.url).resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3077"], {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development", DATABASE_URL: url, DATABASE_URL_UNPOOLED: url,
      LIBRARY_BROWSER_TEST: "1", LIBRARY_CONTENT_SOURCE: "database", LIBRARY_LOCAL_REVIEW: "loopback",
      LIBRARY_OFFICE_HOST: "", LIBRARY_OFFICE_TEST: "", DB_DEPLOY_SKIP: "1",
      PORTRAIT_SESSION_SECRET: randomBytes(32).toString("hex"), PORTRAIT_PAID_ENABLED: "0", PORTRAIT_API_KEY: "",
    },
  });
  child.on("error", (error) => { console.error(error); void close(1); });
  child.on("exit", (code) => void close(code ?? 0));
} catch (error) {
  console.error(error);
  await close(1);
}
