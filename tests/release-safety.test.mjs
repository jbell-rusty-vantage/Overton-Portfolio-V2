import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { assertMigrationHistory, databaseTarget, validatedTarget } from "../scripts/database-target.mjs";
import { blobIdentity, publishImmutable } from "../scripts/immutable-blob.mjs";

test("legacy schema refusal preserves rows on disposable PostgreSQL", async () => {
  const db = await PGlite.create();
  try {
    await db.exec("create table owner_work(id int primary key, note text); insert into owner_work values(1,'preserve me')");
    await assert.rejects(assertMigrationHistory(db), /Refusing to alter/);
    assert.equal((await db.query("select note from owner_work")).rows[0].note, "preserve me");
  } finally { await db.close(); }
});

test("target contract checks direct/pooled agreement and explicit fingerprint", () => {
  const url = "postgresql://user:password@ep-example-pooler.example/preview";
  assert.equal(databaseTarget(url).fingerprint, databaseTarget(url.replace("-pooler", "")).fingerprint);
  assert.throws(() => validatedTarget({ DATABASE_URL: url, DATABASE_URL_UNPOOLED: url.replace("preview", "production") }), /disagree/);
  assert.throws(() => validatedTarget({ DATABASE_URL: url }, true), /explicitly selected/);
});

test("same-size different media has a different immutable identity", () => {
  assert.notEqual(blobIdentity("film.mp4", Buffer.from("aaaa")).pathname, blobIdentity("film.mp4", Buffer.from("bbbb")).pathname);
});

test("interrupted upload retries by identity and rejects hash mismatch", async () => {
  const objects = new Map(); let puts = 0, corrupt = false;
  const sdk = {
    async head(key) { const p = key.replace("https://blob.test/", ""); if (!objects.has(p)) throw Object.assign(Error("missing"), { code: "blob_not_found" }); return { url: "https://blob.test/" + p, pathname: p, size: objects.get(p).length }; },
    async put(p, bytes) { puts++; objects.set(p, bytes); throw Error("response interrupted after commit"); },
  };
  const read = async url => new Response(corrupt ? Buffer.from("xxxx") : objects.get(url.replace("https://blob.test/", "")));
  const bytes = Buffer.from("film");
  const one = await publishImmutable("film.mp4", bytes, { sdk, read });
  const two = await publishImmutable("film.mp4", bytes, { sdk, read });
  assert.equal(one.url, two.url); assert.equal(puts, 1);
  corrupt = true;
  await assert.rejects(publishImmutable("film.mp4", bytes, { sdk, read }), /checksum mismatch/);
});
