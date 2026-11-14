// Release backup and isolated Preview creation. Never resets an existing database.
import pg from "pg";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
import { loadLocalEnvironment, validatedTarget, databaseTarget } from "./database-target.mjs";

loadLocalEnvironment();
const target = validatedTarget();
const source = new pg.Client({ connectionString: target.url.href });
await source.connect();
await mkdir(".local-library/release", { recursive: true });
try {
  if (process.argv.includes("--snapshot")) {
    await source.query("begin isolation level repeatable read read only");
    const { rows: tables } = await source.query("select tablename from pg_tables where schemaname='public' order by tablename");
    const snapshot = { fingerprint: target.fingerprint, at: new Date().toISOString(), tables: {} };
    for (const { tablename } of tables) snapshot.tables[tablename] = (await source.query(`select to_jsonb(t) as row from public."${tablename}" t`)).rows.map(r => r.row);
    await source.query("commit");
    const file = `.local-library/release/database-before-${target.fingerprint}.json`;
    try { await writeFile(file, JSON.stringify(snapshot), { flag: "wx" }); } catch (e) { if (e.code !== "EEXIST") throw e; }
    console.log(JSON.stringify({ fingerprint: target.fingerprint, backup: file, projects: snapshot.tables.projects?.map(p => ({ slug: p.slug, display: p.display, activation: p.activation })), adminPasswordChangeRequired: snapshot.tables.admin_users?.some(a => a.must_change_password) }, null, 2));
  }
  if (process.argv.includes("--create-preview")) {
    const database = "portfolio_preview_20261113";
    const exists = await source.query("select 1 from pg_database where datname=$1", [database]);
    if (exists.rowCount) throw Error("Preview database already exists; refusing to overwrite it");
    await source.query(`create database "${database}"`);
    const previewUrl = new URL(target.url); previewUrl.pathname = "/" + database;
    const preview = new pg.Client({ connectionString: previewUrl.href });
    await preview.connect();
    try {
      const migrations = (await readdir("prisma/migrations", { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name).sort();
      // Prisma owns history; invoke its actual deploy against only the new empty target.
      const { spawnSync } = await import("node:child_process");
      const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: previewUrl.href, DATABASE_URL_UNPOOLED: previewUrl.href }, encoding: "utf8" });
      if (migration.status) throw Error("Isolated preview migration failed: " + migration.stderr.replaceAll(previewUrl.href, "[database]"));
      const snapshot = JSON.parse(await readFile(`.local-library/release/database-before-${target.fingerprint}.json`, "utf8"));
      // Copy the owner's content but never sessions, passwords, usage, or visitor data.
      const excluded = new Set(["_prisma_migrations", "admin_users", "admin_sessions", "portrait_ledger", "analytics_events", "agent_sessions", "agent_messages", "agent_tool_calls"]);
      const tables = Object.keys(snapshot.tables).filter(t => !excluded.has(t));
      const { rows: dependencies } = await preview.query("select conrelid::regclass::text as child, confrelid::regclass::text as parent from pg_constraint where contype='f' and connamespace='public'::regnamespace");
      const ordered = [], waiting = new Set(tables);
      while (waiting.size) {
        const batch = [...waiting].filter(t => dependencies.filter(d => d.child === t && d.parent !== t).every(d => !waiting.has(d.parent)));
        if (!batch.length) throw Error("Cyclic content dependencies need explicit import ordering");
        for (const t of batch) { ordered.push(t); waiting.delete(t); }
      }
      await preview.query("begin");
      // Only this newly-created preview is cleared of migration reference rows before the snapshot copy.
      for (const table of [...ordered].reverse()) await preview.query(`delete from "${table}"`);
      for (const table of ordered) for (const row of snapshot.tables[table]) {
        await preview.query(`insert into "${table}" select * from jsonb_populate_record(null::"${table}",$1::jsonb)`, [JSON.stringify(row)]);
      }
      const password = randomBytes(24).toString("base64url"), salt = randomBytes(16);
      const hash = ["scrypt", 16384, 8, 1, salt.toString("base64"), scryptSync(password, salt, 64).toString("base64")].join("$");
      await preview.query("update admin_users set email='release-preview@example.test',password_hash=$1,must_change_password=false", [hash]);
      await preview.query("commit");
      const fingerprint = databaseTarget(previewUrl.href).fingerprint;
      await writeFile(".local-library/release/preview.env", `DATABASE_URL=${JSON.stringify(previewUrl.href)}\nDATABASE_URL_UNPOOLED=${JSON.stringify(previewUrl.href)}\nRELEASE_DATABASE_FINGERPRINT=${fingerprint}\n`);
      await writeFile(".local-library/release/preview-login.json", JSON.stringify({ email: "release-preview@example.test", password }));
      await writeFile(".local-library/release/isolation.json", JSON.stringify({ production: target.fingerprint, preview: fingerprint, database, migrations, isolation: "Separate PostgreSQL databases on the existing Neon endpoint; independent content, sessions and portrait ledger." }, null, 2));
      console.log(JSON.stringify({ created: database, production: target.fingerprint, preview: fingerprint, copiedContentTables: ordered.length, migrations }));
    } finally { await preview.end(); }
  }
} finally { await source.end(); }
