#!/usr/bin/env node
// Runs during `npm run build` (i.e. on every Vercel build) and locally via `npm run db:deploy`.
//
// 1. Resolves a DIRECT (non-pooled) Postgres URL — Prisma Migrate needs session-level
//    advisory locks, which Neon's PgBouncer pooler (host contains "-pooler") does not provide.
// 2. ONE-TIME LEGACY WIPE: if the database has tables but no `_prisma_migrations` table, it is
//    the old (pre-library) portfolio schema created with `prisma db push`. Everything in the
//    `public` schema is dropped so the new migrations can apply cleanly. Once migrations have
//    run, `_prisma_migrations` exists and this step never fires again.
//    Opt out with DB_DEPLOY_SKIP_LEGACY_WIPE=1.
// 3. Runs `prisma migrate deploy`.
//
// Skips gracefully (exit 0) when no database URL is configured, so builds without a DB still work.
// Set DB_DEPLOY_SKIP=1 to skip entirely (e.g. for a build that must not touch the database).
import { spawnSync } from "node:child_process";
import pg from "pg";

const log = (...a) => console.log("[db-deploy]", ...a);

// Locally, pick up .env.local / .env (on Vercel the env is already populated).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file absent — fine
  }
}

if (process.env.DB_DEPLOY_SKIP === "1") {
  log("DB_DEPLOY_SKIP=1 — skipping migrations.");
  process.exit(0);
}

const raw = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!raw) {
  log("No DATABASE_URL configured — skipping migrations.");
  process.exit(0);
}

const url = new URL(raw);
if (url.hostname.includes("-pooler.")) {
  url.hostname = url.hostname.replace("-pooler.", ".");
  log("Using direct (non-pooled) Neon host for migrations.");
}
// Never print credentials: host + database name only.
log(`Target: ${url.hostname}${url.pathname}`);
const directUrl = url.toString();

const client = new pg.Client({ connectionString: directUrl });
await client.connect();
try {
  const { rows: mig } = await client.query(
    "select to_regclass('public._prisma_migrations') is not null as has_migrations",
  );
  const { rows: tables } = await client.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename",
  );
  const hasMigrations = mig[0].has_migrations;
  log(`public schema: ${tables.length} tables; prisma migrations table: ${hasMigrations ? "yes" : "no"}`);

  if (!hasMigrations && tables.length > 0) {
    if (process.env.DB_DEPLOY_SKIP_LEGACY_WIPE === "1") {
      throw new Error("Legacy tables present but DB_DEPLOY_SKIP_LEGACY_WIPE=1 — refusing to continue.");
    }
    log(`LEGACY WIPE: dropping ${tables.length} legacy tables: ${tables.map((t) => t.tablename).join(", ")}`);
    await client.query(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN SELECT viewname FROM pg_views WHERE schemaname = 'public' LOOP
          EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', r.viewname);
        END LOOP;
        FOR r IN SELECT matviewname FROM pg_matviews WHERE schemaname = 'public' LOOP
          EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', r.matviewname);
        END LOOP;
        FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
          EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
        END LOOP;
        FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
          EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', r.sequence_name);
        END LOOP;
        FOR r IN
          SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public' AND t.typtype = 'e'
        LOOP
          EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
        END LOOP;
      END $$;
    `);
    log("Legacy wipe complete.");
  }
} finally {
  await client.end();
}

const res = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: directUrl, DATABASE_URL_UNPOOLED: directUrl },
});
if (res.status !== 0) {
  log("prisma migrate deploy failed.");
  process.exit(res.status ?? 1);
}
log("Migrations up to date.");
