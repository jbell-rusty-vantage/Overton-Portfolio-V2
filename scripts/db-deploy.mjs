#!/usr/bin/env node
// Runs during `npm run build` (i.e. on every Vercel build) and locally via `npm run db:deploy`.
//
// 1. Resolves a DIRECT (non-pooled) Postgres URL — Prisma Migrate needs session-level
//    advisory locks, which Neon's PgBouncer pooler (host contains "-pooler") does not provide.
// 2. Refuses existing schemas without migration history; builds never reset data.
// 3. Runs `prisma migrate deploy`.
//
// Skips gracefully (exit 0) when no database URL is configured, so builds without a DB still work.
// Set DB_DEPLOY_SKIP=1 to skip entirely (e.g. for a build that must not touch the database).
import { spawnSync } from "node:child_process";
import pg from "pg";
import { loadLocalEnvironment, validatedTarget, assertMigrationHistory } from "./database-target.mjs";

const log = (...a) => console.log("[db-deploy]", ...a);

loadLocalEnvironment();

if (process.env.DB_DEPLOY_SKIP === "1") {
  log("DB_DEPLOY_SKIP=1 — skipping migrations.");
  process.exit(0);
}

const raw = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!raw) {
  log("No DATABASE_URL configured — skipping migrations.");
  process.exit(0);
}

const target = validatedTarget(process.env, !!process.env.VERCEL);
log(`Target fingerprint: ${target.fingerprint}`);
const directUrl = target.url.href;

const client = new pg.Client({ connectionString: directUrl });
await client.connect();
try {
  const state = await assertMigrationHistory(client);
  log(`public schema: ${state.tables} tables; migration history: ${state.migrated}`);
} finally {
  await client.end();
}

const res = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: directUrl, DATABASE_URL_UNPOOLED: directUrl },
});
if (res.status !== 0) {
  log("prisma migrate deploy failed.");
  process.exit(res.status ?? 1);
}
log("Migrations up to date.");
