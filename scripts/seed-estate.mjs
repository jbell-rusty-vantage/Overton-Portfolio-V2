// Verify the content-addressed delivery before linking it in a single transaction.
import pg from "pg";
import { loadLocalEnvironment, validatedTarget } from "./database-target.mjs";
import { head, put, BlobNotFoundError } from "@vercel/blob";
import { readFile, writeFile } from "node:fs/promises";
import {
  actor,
  media,
  records,
  starter,
  store,
  checksum,
  insertRecord,
  upgradeProgram,
  repointScenes,
} from "./estate-inventory.mjs";

const apply = process.argv.includes("--apply");
loadLocalEnvironment();
const target = validatedTarget(process.env, apply);
const dbUrl = target.url;
const planFile = `.local-library/release/estate-plan-${target.fingerprint}.json`;
async function stateHash() {
  const layout = await db.query("select to_jsonb(t) as row from ui_layouts t where slug='travellers-rest-visit'");
  const scenes = await db.query("select to_jsonb(t) as row from scene_assets t where slug like 'travellers-rest-%' order by id");
  return checksum(JSON.stringify([layout.rows, scenes.rows]));
}
const db = new pg.Client({
  connectionString: dbUrl.href,
  connectionTimeoutMillis: 10000,
});

async function diff() {
  const expected = await db.query(
    "select b.id from books b join projects p on p.id=b.entity_id where b.id=$1 and p.id=$2 and b.entity_type='project' and p.deleted_at is null",
    [starter.bookId, starter.projectId],
  );
  if (!expected.rowCount)
    throw Error(
      "Reconcile the selected Mission Control book and project before import.",
    );
  const pending = [];
  const logged = await db.query(
    "select entity_id from audit_log where actor=$1 and action='estate.seed'",
    [actor],
  );
  const imported = new Set(logged.rows.map((row) => row.entity_id));
  // An audited edition may have been edited, moved or withdrawn in the office.
  // A retry must preserve those decisions, including an intentionally removed leaf.
  for (const r of records) {
    if (imported.has(r.identity)) continue;
    const keys = Object.keys(r.unique);
    const where = keys.map((k, i) => k + "=$" + (i + 2)).join(" and ");
    const hit = await db.query(
      "select id from " +
        r.table +
        " where id=$1" +
        (where ? " or (" + where + ")" : ""),
      [r.identity, ...Object.values(r.unique)],
    );
    if (!hit.rowCount) {
      pending.push(r);
      continue;
    }
    throw Error("Unowned collision in " + r.table);
  }
  return pending;
}
async function publishBytes(m, token) {
  const options = { token };
  let remote;
  try {
    remote = await head(m.url, options);
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) throw error;
    try {
      await put(m.pathname, await readFile("public" + m.localUrl), {
        ...options,
        access: "public",
        contentType: m.mime,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
    } catch (uploadError) {
      // A parallel retry may create the same immutable pathname first.
      try {
        await head(m.url, options);
      } catch {
        throw uploadError;
      }
    }
    remote = await head(m.url, options);
  }
  if (
    remote.url !== m.url ||
    remote.size !== m.bytes ||
    remote.pathname !== m.pathname
  )
    throw Error("Blob metadata mismatch for " + m.key);
  const res = await fetch(remote.url);
  if (!res.ok || checksum(Buffer.from(await res.arrayBuffer())) !== m.sha256)
    throw Error("Blob verification failed for " + m.key);
}

await db.connect();
try {
  await db.query("begin isolation level repeatable read read only");
  const pending = await diff();
  const planned = await upgradeProgram(db, { dryRun: true });
  const scenes = await repointScenes(db, { dryRun: true });
  await db.query("commit");
  console.log(
    "Planned inserts:",
    pending.length,
    ". Existing curated rows are preserved.",
  );
  console.log(
    planned
      ? "House program: edition " +
          planned.from +
          " to " +
          planned.to +
          ", " +
          planned.mediaAdded +
          " media keys, " +
          planned.voicedCues +
          " voiced cues, " +
          planned.objects +
          " objects."
      : "House program: already the continuous edition.",
  );
  if (scenes.length)
    console.log("Scene versions to point at the rebuilt shell:", scenes.join(", "));
  console.table(
    Object.entries(Object.groupBy(pending, (r) => r.table)).map(
      ([table, rows]) => ({ table, inserts: rows.length }),
    ),
  );
  if (!apply) {
    const before = await stateHash();
    await writeFile(planFile, JSON.stringify({ fingerprint: target.fingerprint, before, pending: pending.map(r => ({ table: r.table, id: r.identity })), program: planned, scenes }, null, 2));
    console.log("Drift-checked plan:", planFile);
  }
  if (apply) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (
      !token ||
      process.env.BLOB_STORE_ID?.replace(/^store_/, "").toLowerCase() !==
        store.slice(6).toLowerCase()
    )
      throw Error("Set the portfolio store ID and read/write token.");
    // Token mode takes precedence over any other, potentially expired project session.
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.BLOB_STORE_ID;
    for (let i = 0; i < media.length; i += 4)
      await Promise.all(
        media.slice(i, i + 4).map((m) => publishBytes(m, token)),
      );
    console.log("Verified " + media.length + " delivery objects by SHA-256.");
    await db.query("begin");
    await db.query(
      "select pg_advisory_xact_lock(hashtext('travellers-rest-draft-v1'))",
    );
    const plan = JSON.parse(await readFile(planFile, "utf8"));
    const state = await stateHash();
    if (plan.fingerprint !== target.fingerprint || ![plan.before, plan.after].includes(state)) throw Error("Estate changed since the inspected plan; refusing to overwrite owner edits");
    const changes = await diff();
    for (const r of changes) await insertRecord(db, r);
    const upgraded = await upgradeProgram(db);
    // New media rows exist by now, so the scene versions can refer to them.
    const repointed = await repointScenes(db);
    if (repointed.length)
      console.log("Scene versions now use the rebuilt shell:", repointed.join(", "));
    const after = await stateHash();
    await db.query("commit");
    await writeFile(planFile, JSON.stringify({ ...plan, after, inserted: changes.map(r => ({ table: r.table, id: r.identity })), verifiedAssets: media.map(m => ({ key: m.key, url: m.url, sha256: m.sha256 })) }, null, 2));
    console.log(
      upgraded
        ? "House program upgraded to edition " +
            upgraded.to +
            " with an audit record and a revision."
        : "House program unchanged.",
    );
    await writeFile(
      "content/travellers-rest/blob-manifest.json",
      JSON.stringify(media, null, 2) + "\n",
    );
    console.log(
      "Committed " +
        changes.length +
        " new rows. No publication or scene activation.",
    );
  }
} catch (e) {
  await db.query("rollback").catch(() => {});
  throw e;
} finally {
  await db.end();
}
