import { createHash } from "node:crypto";
import { config } from "dotenv";

/** Platform/process values win; local files only fill missing values. */
export function loadLocalEnvironment() {
  if (!process.env.VERCEL) {
    for (const path of [".env.local", ".env"]) config({ path, override: false, quiet: true });
  }
}

export function databaseTarget(raw) {
  const url = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw Error("Expected a PostgreSQL URL");
  url.hostname = url.hostname.replace(/-pooler\./, ".");
  const identity = `${url.hostname}:${url.port || "5432"}${url.pathname}`;
  return { url, identity, fingerprint: createHash("sha256").update(identity).digest("hex").slice(0, 24) };
}

export function validatedTarget(env = process.env, requireApproval = false) {
  const pooled = databaseTarget(env.DATABASE_URL);
  const direct = databaseTarget(env.DATABASE_URL_UNPOOLED || env.DATABASE_URL);
  if (pooled.fingerprint !== direct.fingerprint) throw Error("Pooled/direct database targets disagree");
  if ((requireApproval || env.RELEASE_DATABASE_FINGERPRINT) && env.RELEASE_DATABASE_FINGERPRINT !== direct.fingerprint)
    throw Error(`Target fingerprint must be explicitly selected: ${direct.fingerprint}`);
  return direct;
}

export async function assertMigrationHistory(client) {
  const { rows: [state] } = await client.query("select to_regclass('public._prisma_migrations') is not null as migrated, (select count(*)::int from pg_tables where schemaname='public') as tables");
  if (!state.migrated && state.tables > 0)
    throw Error("Existing public tables have no migration history. Refusing to alter this database. Back up and inspect it, then baseline it explicitly with Prisma migrate resolve, or select a new empty database. Routine builds never reset data.");
  return state;
}
