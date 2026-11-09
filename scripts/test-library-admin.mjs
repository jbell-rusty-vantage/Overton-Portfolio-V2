// End-to-end persistence test in an in-process, disposable PostgreSQL-compatible
// engine. Never reads DATABASE_URL or connects to the portfolio database.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { chromium, expect } from "@playwright/test";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { copyFile, readFile, readdir, mkdir, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";

const db = await PGlite.create();
const socket = new PGLiteSocketServer({
  db,
  host: "127.0.0.1",
  port: 0,
  maxConnections: 20,
});
let app, browser, page;
const port = Number(process.env.LIBRARY_TEST_PORT || 3088);
const office = process.argv.includes("--office");
const base = "http://127.0.0.1:" + port;
const logs = [];
const artFile = "proof-" + randomUUID() + ".webp";
const artPath = "public/library/artwork/" + artFile;
try {
  await copyFile("public/library/plate-0.webp", artPath);
  const migrations = await readdir("prisma/migrations", {
    withFileTypes: true,
  });
  for (const d of migrations
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    await db.exec(
      await readFile("prisma/migrations/" + d.name + "/migration.sql", "utf8"),
    );
  }
  const pw = randomBytes(24).toString("hex"),
    salt = randomBytes(16);
  const hash = [
    "scrypt",
    "16384",
    "8",
    "1",
    salt.toString("base64"),
    scryptSync(pw, salt, 64).toString("base64"),
  ].join("$");
  await db.query(
    "update admin_users set email='fixture@example.test',password_hash=$1,must_change_password=false",
    [hash],
  );
  const project = randomUUID();
  await db.query(
    "insert into projects(id,slug,title,summary,display,activation,updated_at) values($1,'lab-fixture','Fixture project','Fixture-only source.','hidden','paused',now())",
    [project],
  );
  await socket.start();
  const url = "postgresql://postgres@" + socket.getServerConn() + "/postgres";
  app = spawn(
    process.execPath,
    [
      createRequire(import.meta.url).resolve("next/dist/bin/next"),
      office ? "dev" : "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: office ? "development" : "production",
        // Set the flag in BOTH modes to prove that production ignores it.
        LIBRARY_OFFICE_HOST: "127.0.0.1:" + port,
        LIBRARY_OFFICE_TEST: "1",
        DB_DEPLOY_SKIP: "1",
        DATABASE_URL: url,
        DATABASE_URL_UNPOOLED: url,
        LIBRARY_CONTENT_SOURCE: "database",
        LIBRARY_LOCAL_REVIEW: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const capture = (b) => {
    logs.push(b.toString().slice(0, 1000));
    if (logs.length > 20) logs.shift();
  };
  app.stdout.on("data", capture);
  app.stderr.on("data", capture);
  for (let i = 0; i < 80; i++) {
    if (app.exitCode !== null) throw Error("The isolated app failed to start.");
    if (
      await fetch(base + "/admin/login")
        .then((r) => r.ok)
        .catch(() => false)
    )
      break;
    await delay(250);
  }
  browser = await chromium.launch({
    channel: "chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const adminContext = await browser.newContext({
    baseURL: base,
    viewport: { width: 1366, height: 860 },
  });
  page = await adminContext.newPage();
  page.setDefaultTimeout(8000);
  await mkdir(".local-library/evidence", { recursive: true });
  if (office) {
    for (const headers of [{ origin: "https://other.test" }, { "x-forwarded-for": "203.0.113.1" }, { "sec-fetch-site": "cross-site" }]) {
      const denied = await fetch(base + "/admin", { headers, redirect: "manual" });
      if (!denied.headers.get("location")?.endsWith("/admin/login")) throw Error("Office accepted a non-local request");
    }
    await page.goto("/admin");
    await expect(page.getByText(/Local office · No login/)).toBeVisible();
    await page.goto("/admin/account");
    await expect(page.getByRole("heading", { name: "Local office" })).toBeVisible();
    await expect(page.getByLabel("Current password")).toHaveCount(0);
  } else {
    await page.goto("/admin/library");
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.getByLabel("Email").fill("fixture@example.test");
    await page.getByLabel("Password").fill(pw);
    await page.getByRole("button", { name: "Enter the office" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  }
  await page.goto("/admin/media");
  const register = page.locator("form").filter({ has: page.getByRole("button", { name: "Register artwork" }) });
  await register.getByLabel("Artwork file").selectOption(artFile);
  await register.getByLabel("Artwork title").fill("Workshop cover");
  await register.getByLabel("Alt text").fill("Engraved cloth binding");
  await register.getByRole("button").click();
  await expect(page.getByRole("heading", { name: "Workshop cover" })).toBeVisible();
  await page.goto("/admin/library");
  await page.getByText("Create a draft book", { exact: true }).click();
  const create = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Create hidden book" }) });
  await create
    .getByRole("combobox", { name: "Project", exact: true })
    .selectOption(project);
  await create.getByLabel("Title", { exact: true }).fill("Fixture volume");
  await create.getByLabel("Slug", { exact: true }).fill("fixture-volume");
  await create.getByLabel("Cover artwork").selectOption({ label: "Workshop cover" });
  await create.getByRole("button").click();
  await expect(create.getByRole("status")).toHaveText("Saved to the Library.");
  const book = (
    await db.query("select id from books where slug='fixture-volume'")
  ).rows[0];
  const record = page.locator("#volume-" + book.id);
  await record.locator(":scope > summary").click();
  const place = record
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Save placement" }) });
  await place
    .getByRole("combobox", { name: "Shelf", exact: true })
    .selectOption("stacks-ai-agents");
  await place.getByLabel("Position", { exact: false }).fill("4");
  await place.getByRole("button", { name: "Save placement" }).click();
  await expect(place.getByRole("status")).toHaveText("Saved to the Library.");
  await record.getByText("Add a page", { exact: true }).click();
  const pageForm = record.locator("form").filter({
    has: page.getByRole("button", { name: "Add page", exact: true }),
  });
  await pageForm
    .getByRole("combobox", { name: /^Page template/ })
    .selectOption("architecture");
  await pageForm
    .getByLabel("Text, label or alt text")
    .fill("Architecture from the test editor.");
  await pageForm.getByRole("button", { name: "Add page", exact: true }).click();
  await expect(pageForm.getByRole("status")).toHaveText(
    "Saved to the Library.",
  );
  await page.screenshot({ path: ".local-library/evidence/admin-editor.png" });
  const visitor = await browser.newPage({ baseURL: base });
  const shelf = page.locator("#shelves details").filter({ has: page.locator('input[value="stacks-ai-agents"]') }).filter({ has: page.getByRole("button", { name: "Rename shelf", includeHidden: true }) });
  await shelf.locator("summary").click();
  await shelf.getByLabel(/^Shelf title/).fill("Systems workshop");
  await shelf.getByRole("button", { name: "Rename shelf" }).click();
  await expect(shelf.getByRole("status")).toHaveText("Saved to the Library.");
  const shelfProof = (await db.query("select title,scene_node_name from shelves where slug='stacks-ai-agents'")).rows[0];
  if (shelfProof.title !== "Systems workshop" || shelfProof.scene_node_name !== "shelf_stacks_ai") throw Error("Rename changed the shelf identity");
  await visitor.goto("/catalog");
  await expect(visitor.getByText("Fixture volume")).toHaveCount(0);
  await page.goto("/admin/library/preview?read=fixture-volume");
  await expect(
    page.getByRole("heading", { name: "Fixture volume" }),
  ).toBeVisible();
  await expect(
    page.getByText("Architecture from the test editor."),
  ).toBeVisible();
  await page.screenshot({
    path: ".local-library/evidence/protected-preview.png",
  });
  await page.goto("/admin/projects/" + project);
  const projectForm = page
    .locator("form")
    .filter({ has: page.getByLabel("Tagline") });
  await projectForm
    .getByRole("combobox", { name: "Display", exact: true })
    .selectOption("published");
  await projectForm.getByRole("button", { name: /save/i }).click();
  await expect
    .poll(
      async () =>
        (await db.query("select display from projects where id=$1", [project]))
          .rows[0].display,
    )
    .toBe("published");
  await visitor.goto("/catalog");
  await expect(visitor.getByText("Fixture volume")).toHaveCount(0);
  await page.goto("/admin/library");
  await record.locator(":scope > summary").click();
  const edit = record
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Save presentation" }) });
  await edit
    .getByRole("combobox", { name: /^Book visibility/ })
    .selectOption("published");
  await edit.getByRole("button", { name: "Save presentation" }).click();
  await expect(edit.getByRole("status")).toHaveText("Saved to the Library.");
  await visitor.goto("/catalog");
  await expect(
    visitor.getByRole("heading", { name: "Fixture volume" }),
  ).toBeVisible();
  await visitor.goto("/projects/lab-fixture");
  await expect(visitor.locator('img[src="/library/artwork/' + artFile + '"]')).toBeVisible();
  await expect(
    visitor.getByText("Architecture from the test editor."),
  ).toBeVisible();
  await visitor.goto("/catalog?q=Systems+workshop");
  await expect(visitor.getByRole("heading", { name: "Fixture volume" })).toBeVisible();
  await visitor.goto("/?view=world&zone=stacks");
  await expect(visitor.locator('[data-pin="stacks-ai-agents"]')).toHaveAccessibleName("Systems workshop", { timeout: 40000 });
  await visitor.getByRole("button", { name: "Systems workshop", exact: true }).last().click();
  await expect(visitor.getByRole("heading", { name: "Systems workshop" })).toBeVisible();
  await expect(visitor.getByRole("button", { name: "Fixture volume", exact: true }).last()).toBeVisible();
  // Two forms carry the same version. The second writer must retain its input and report the conflict.
  const stale = await page.context().newPage();
  await stale.goto(base + "/admin/library");
  const staleRecord = stale.locator("#volume-" + book.id);
  await staleRecord.locator(":scope > summary").click();
  const staleForm = staleRecord
    .locator("form")
    .filter({ has: stale.getByRole("button", { name: "Save presentation" }) });
  await edit
    .getByRole("combobox", { name: /^Book visibility/ })
    .selectOption("hidden");
  await edit.getByRole("button", { name: "Save presentation" }).click();
  await expect(edit.getByRole("status")).toHaveText("Saved to the Library.");
  await staleForm.getByLabel("Title", { exact: true }).fill("Stale title");
  await staleForm.getByRole("button", { name: "Save presentation" }).click();
  await expect(staleForm.getByRole("status")).toContainText(
    "changed in another session",
  );
  await expect(staleForm.getByLabel("Title", { exact: true })).toHaveValue(
    "Stale title",
  );
  await visitor.goto("/catalog");
  await expect(visitor.getByText("Fixture volume")).toHaveCount(0);
  // Adversarial records only exist in this disposable engine.
  await db.exec(`insert into projects(id,slug,title,display,updated_at)
    values(gen_random_uuid(),'unlisted-case','Direct only','unlisted',now()),
          (gen_random_uuid(),'ambiguous-case','Ambiguous project','published',now());
    insert into projects(id,slug,title,display,published_at,updated_at) values
          (gen_random_uuid(),'scheduled-case','PRIVATE_FUTURE','published',now()+interval '1 day',now());
    insert into projects(id,slug,title,display,deleted_at,updated_at) values
          (gen_random_uuid(),'removed-case','PRIVATE_REMOVED','featured',now(),now());
    insert into books(id,slug,title,entity_type,entity_id,display,updated_at)
      select gen_random_uuid(),'wrapper-one','PRIVATE_WRAPPER','project',id,'hidden',now() from projects where slug='ambiguous-case';
    insert into books(id,slug,title,entity_type,entity_id,display,updated_at)
      select gen_random_uuid(),'wrapper-two','Ambiguous wrapper','project',id,'published',now() from projects where slug='ambiguous-case';
    insert into clients(id,slug,name,public_alias,show_name,notes,updated_at)
      values(gen_random_uuid(),'fixture-client','PRIVATE_NAME','Studio client',false,'PRIVATE_NOTES',now());
    insert into projects(id,slug,title,client_id,display,activation,updated_at)
      select gen_random_uuid(),'alias-case','Curated study',id,'published','inactive',now() from clients where slug='fixture-client';
    insert into repos(id,slug,full_name,name,is_private,redaction_policy,display,html_url,updated_at)
      values(gen_random_uuid(),'private-repo','PRIVATE_OWNER/PRIVATE_REPO','PRIVATE_REPO',true,'curated_only','published','https://secret.invalid',now());
    insert into project_repos(project_id,repo_id) select p.id,r.id from projects p,repos r where p.slug='alias-case' and r.slug='private-repo';
    insert into activity_events(id,occurred_at,source,type_code,project_id,repo_id,title,actor,payload,visibility)
      select gen_random_uuid(),now(),'github','github.push',p.id,r.id,'PRIVATE_EVENT','PRIVATE_ACTOR','{"secret":"PRIVATE_PAYLOAD"}','public'
      from projects p,repos r where p.slug='alias-case' and r.slug='private-repo';`);
  const publicShell = await (
    await fetch(base + "/?view=world&zone=computer-station")
  ).text();
  for (const forbidden of [
    "PRIVATE_",
    "secret.invalid",
    "Ambiguous project",
    "Ambiguous wrapper",
    "Direct only",
  ]) {
    if (publicShell.includes(forbidden))
      throw Error("Private field leaked: " + forbidden);
  }
  const alias = await (await fetch(base + "/projects/alias-case")).text();
  if (!alias.includes("Studio client") || alias.includes("PRIVATE_"))
    throw Error("Client alias projection failed");
  for (const slug of ["scheduled-case", "removed-case", "ambiguous-case"]) {
    if ((await fetch(base + "/catalog?volume=" + slug)).status !== 404)
      throw Error("Expected unavailable volume: " + slug);
  }
  const unlisted = await fetch(base + "/catalog?volume=unlisted-case");
  if (
    unlisted.status !== 200 ||
    !(await unlisted.text()).includes("Direct only")
  )
    throw Error("Unlisted direct read failed");
  console.log(
    "PASS: discovery, unlisted, scheduling, soft deletion, wrapper ambiguity, source redaction and client alias",
  );
  const proof = (
    await db.query(
      "select (select count(*) from revisions where entity_id=$1) as book_revisions,(select count(*) from audit_log where action like 'library.%') as library_audits,(select count(*) from shelf_slots where entity_id=$1 and position=4) as placements",
      [book.id],
    )
  ).rows[0];
  if (
    +proof.book_revisions !== 3 ||
    +proof.placements !== 1 ||
    +proof.library_audits !== 6
  )
    throw Error(
      "Unexpected revision, audit or placement count " + JSON.stringify(proof),
    );
  if (office) {
    const { rows } = await db.query("select (select count(*) from admin_sessions) as sessions, (select count(*) from audit_log where actor='local-office' and action like 'library.%') as attributed");
    if (+rows[0].sessions !== 0 || +rows[0].attributed !== 6) throw Error("Expected sessionless, attributed local edits");
  }
  console.log(
    "PASS:", office ? "local office" : "authenticated office", "create, place, author, rename, preview, publish, hide, stale edit and atomic records in isolated PGlite",
    proof,
  );
} catch (e) {
  console.error("Isolated integration failure", e.message);
  if (page && page.url().includes("/admin/library"))
    console.error((await page.getByRole("main").ariaSnapshot()).slice(0, 2600));
  console.error(
    logs
      .join("")
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[isolated connection]")
      .slice(-2500),
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (app && app.exitCode === null) {
    const exited = once(app, "exit");
    app.kill();
    await Promise.race([exited, delay(3000)]);
  }
  await socket.stop().catch(() => {});
  await db.close();
  await unlink(artPath).catch(() => {});
}
