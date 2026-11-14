// Exact six-study promotion. Plan, promote, publish and withdraw are separate audited operations.
import pg from "pg";
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { loadLocalEnvironment, validatedTarget } from "./database-target.mjs";
loadLocalEnvironment();
const command = process.argv.find(a => ["--plan", "--promote", "--publish", "--withdraw", "--restore"].includes(a)) || "--plan";
const target = validatedTarget(process.env, command !== "--plan");
const db = new pg.Client({ connectionString: target.url.href });
const plan = JSON.parse(await readFile(".local-library/showcase-2026/promotion-plan.json", "utf8"));
const actor = "portfolio-release-2026-11-13";
const file = `.local-library/release/content-${target.fingerprint}.private.json`;
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const hash = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonical(value)).digest("hex");
const planHash = hash(plan.entries);
const slugs = plan.entries.map(e => e.slug);
if (slugs.length !== 6 || new Set(slugs).size !== 6) throw Error("Expected exactly six reviewed studies");
await db.connect();
async function state() {
  const q = async (sql, args = []) => (await db.query(sql, args)).rows;
  return {
    projects: await q("select * from projects where slug=any($1) order by slug", [slugs]),
    books: await q("select * from books where slug=any($1) or slug='travellers-rest-house-book' order by slug", [slugs]),
    pages: await q("select p.* from book_pages p join books b on b.id=p.book_id where b.slug=any($1) order by b.slug,p.position", [slugs]),
    scenes: await q("select * from scene_assets where slug=any($1) order by slug,version", [["travellers-rest-house", "travellers-rest-house-low"]]),
    zones: await q("select * from library_zones where slug=any($1) order by slug", [["travellers-rest-approach", "travellers-rest-hall", "travellers-rest-library", "travellers-rest-cabinet"]]),
    layout: await q("select * from ui_layouts where slug='travellers-rest-visit'"),
  };
}
async function audit(action, type, id, detail = {}) {
  await db.query("insert into audit_log(id,actor,action,entity_type,entity_id,detail) values(gen_random_uuid(),$1,$2,$3,$4,$5)", [actor, action, type, id, JSON.stringify({ release: planHash, ...detail })]);
}
async function snapshot(type, id, value, message) {
  await db.query("insert into revisions(id,entity_type,entity_id,version,author,message,snapshot) values(gen_random_uuid(),$1,$2,(select coalesce(max(version),0)+1 from revisions where entity_type=$1 and entity_id=$2),$3,$4,$5)", [type, id, actor, message, JSON.stringify(value)]);
}
async function emitSignal(project, visible) {
  const key = `project_published:${project.id}`;
  const existing = await db.query("select id,visibility from activity_events where dedupe_key=$1", [key]);
  if (!existing.rowCount && visible) {
    await db.query("insert into activity_events(id,occurred_at,source,type_code,title,project_id,visibility,actor,payload,dedupe_key) values(gen_random_uuid(),now(),'system','system.project_published',$1,$2,'public',$3,$4,$5)", ["Project published: " + project.title, project.id, actor, JSON.stringify({ release: planHash }), key]);
    await audit("release.signal", "project", project.id, { dedupeKey: key });
  } else if (existing.rowCount && existing.rows[0].visibility !== (visible ? "public" : "private")) {
    await db.query("update activity_events set visibility=$1 where id=$2", [visible ? "public" : "private", existing.rows[0].id]);
    await audit("release.signal.visibility", "activity_event", existing.rows[0].id, { visible });
  }
}
function compareSource(current, entry) {
  const p = current.projects.find(p => p.slug === entry.slug), b = current.books.find(b => b.slug === entry.slug);
  if (!p || !b || b.entity_type !== "project" || b.entity_id !== p.id || p.deleted_at) throw Error("Missing or mismatched source: " + entry.slug);
  const pages = current.pages.filter(page => page.book_id === b.id).map(page => ({ template: page.template_code, position: page.position, blocks: page.blocks }));
  for (const [name, actual, expected] of [["summary", p.summary, entry.expectedSummary], ["status", p.status, entry.expectedStatus], ["tags", p.tags, entry.expectedTags], ["pages", pages, entry.expectedPages]]) {
    if (canonical(actual) !== canonical(expected)) throw Error(`Owner source drift in ${entry.slug}: ${name}`);
  }
}
async function register(asset, slug) {
  const bytes = await readFile("public" + asset.url);
  if (hash(bytes) !== asset.sha256) throw Error("Asset drift: " + asset.url);
  const existing = await db.query("select * from media_assets where url=$1 and deleted_at is null", [asset.url]);
  if (existing.rowCount) {
    if (existing.rows[0].checksum && existing.rows[0].checksum !== asset.sha256) throw Error("Registered media drift: " + asset.url);
    return existing.rows[0].id;
  }
  const image = /\.(webp|png|jpg|jpeg)$/.test(asset.url), meta = image ? await sharp(bytes).metadata() : {};
  const id = randomUUID();
  const mime = image ? "image/" + (/\.webp$/.test(asset.url) ? "webp" : /\.png$/.test(asset.url) ? "png" : "jpeg") : asset.url.endsWith(".mp4") ? "video/mp4" : "text/vtt";
  const row = await db.query("insert into media_assets(id,kind,provider,url,mime_type,bytes,width,height,title,alt,caption,purpose,checksum,updated_at) values($1,$2,'external',$3,$4,$5,$6,$7,$8,$8,$9,'reviewed-showcase',$10,now()) returning *", [id, image ? "image" : mime === "video/mp4" ? "video" : "document", asset.url, mime, asset.bytes, meta.width || null, meta.height || null, slug + " · " + asset.url.split("/").at(-1), "Owner-reviewed first-edition showcase asset; source/provenance in the release inventory.", asset.sha256]);
  await audit("release.media.register", "media", id, { url: asset.url, sha256: asset.sha256 });
  await snapshot("media", id, row.rows[0], "Reviewed showcase asset");
  return id;
}
try {
  await db.query(command === "--plan" ? "begin isolation level repeatable read read only" : "begin");
  if (command !== "--plan") await db.query("select pg_advisory_xact_lock(hashtext('portfolio-release-2026-11-13'))");
  if (command !== "--plan") {
    await db.query("select id from projects where slug=any($1) order by id for update", [slugs]);
    await db.query("select id from books where slug=any($1) or slug='travellers-rest-house-book' order by id for update", [slugs]);
    await db.query("select p.id from book_pages p join books b on b.id=p.book_id where b.slug=any($1) order by p.id for update of p", [slugs]);
    await db.query("select id from scene_assets where slug like 'travellers-rest-%' order by id for update");
    await db.query("select id from library_zones where slug like 'travellers-rest-%' order by id for update");
    await db.query("select id from ui_layouts where slug='travellers-rest-visit' for update");
  }
  const before = await state();
  let receipt = await readFile(file, "utf8").then(JSON.parse).catch(e => { if (e.code === "ENOENT") return null; throw e; });
  if (command === "--plan") {
    for (const entry of plan.entries) compareSource(before, entry);
    if (receipt) throw Error("Release receipt already exists; refusing to replace its rollback baseline");
    receipt = { fingerprint: target.fingerprint, planHash, baseline: before, afterHash: hash(before), history: [] };
  } else {
    if (!receipt || receipt.fingerprint !== target.fingerprint || receipt.planHash !== planHash) throw Error("Missing reviewed plan for this exact database and writing edition");
    if (receipt.afterHash !== hash(before)) throw Error("Database changed since the last release receipt; reconcile owner edits before proceeding");
    if (receipt.history.at(-1)?.command === command) {
      await db.query("rollback"); console.log("Idempotent retry: exact recorded edition is unchanged."); process.exitCode = 0;
    } else {
      if (command === "--promote") {
        for (const entry of plan.entries) {
          compareSource(before, entry);
          const p = before.projects.find(p => p.slug === entry.slug), b = before.books.find(b => b.slug === entry.slug);
          const media = new Map();
          for (const asset of entry.assets) media.set(asset.url, await register(asset, entry.slug));
          // Preserve a cover changed by the owner since the original staged art.
          for (const currentId of [p.cover_media_id, b.cover_media_id].filter(Boolean)) {
            const current = (await db.query("select url from media_assets where id=$1", [currentId])).rows[0];
            if (current && current.url !== `/library/artwork/${entry.slug}-cover.webp` && current.url !== entry.cover) throw Error("Owner cover drift: " + entry.slug);
          }
          const cover = media.get(entry.cover);
          await db.query("update projects set summary=$1,cover_media_id=$2 where id=$3", [entry.summary, cover, p.id]);
          await audit("release.project.writing", "project", p.id);
          await db.query("update books set page_mode='authored',cover_media_id=$1 where id=$2", [cover, b.id]);
          await audit("release.book.writing", "book", b.id);
          await db.query("update book_pages set position=-position where book_id=$1", [b.id]);
          for (const page of entry.pages) {
            const original = before.pages.find(p => p.book_id === b.id && p.template_code === page.template);
            if (!original) throw Error("Stable section disappeared: " + page.template);
            const updated = await db.query("update book_pages set position=$1,blocks=$2 where id=$3 returning *", [page.position, JSON.stringify(page.blocks), original.id]);
            await audit("release.page.writing", "book_page", original.id, { book: b.slug, section: page.template });
            await snapshot("book_page", original.id, updated.rows[0], "First-edition study");
          }
        }
      } else if (["--publish", "--withdraw"].includes(command)) {
        if (!receipt.history.some(h => h.command === "--promote")) throw Error("Promote reviewed writing before publication");
        const visible = command === "--publish", display = visible ? "published" : "hidden";
        if (visible) {
          const program = before.layout[0]?.blocks?.[0]?.props;
          if (program?.edition !== 2 || !program.kit || before.scenes.filter(s => s.version === 2).length !== 2 || before.zones.length !== 4) throw Error("Estate import is incomplete");
        }
        for (const p of before.projects) {
          await db.query("update projects set display=$1,published_at=case when $2 then coalesce(published_at,now()) else published_at end where id=$3", [display, visible, p.id]);
          await audit("release.project.visibility", "project", p.id, { display });
          await emitSignal(p, visible);
        }
        for (const b of before.books) { await db.query("update books set display=$1 where id=$2", [display, b.id]); await audit("release.book.visibility", "book", b.id, { display }); }
        for (const scene of before.scenes) { await db.query("update scene_assets set is_active=$1 where id=$2", [visible && scene.version === 2, scene.id]); await audit("release.scene.visibility", null, scene.id, { active: visible && scene.version === 2 }); }
        for (const zone of before.zones) { await db.query("update library_zones set display=$1 where id=$2", [display, zone.id]); await audit("release.room.visibility", "library_zone", zone.id, { display }); }
      } else if (command === "--restore") {
        // Restore only the fields this release owns. Refuse any intervening edit above.
        for (const p of receipt.baseline.projects) { await db.query("update projects set summary=$1,cover_media_id=$2,display=$3,published_at=$4 where id=$5", [p.summary, p.cover_media_id, p.display, p.published_at, p.id]); await audit("release.project.restore", "project", p.id); await emitSignal(p, false); }
        for (const b of receipt.baseline.books) { await db.query("update books set page_mode=$1,cover_media_id=$2,display=$3 where id=$4", [b.page_mode, b.cover_media_id, b.display, b.id]); await audit("release.book.restore", "book", b.id); }
        for (const b of receipt.baseline.books.filter(b => slugs.includes(b.slug))) await db.query("update book_pages set position=-abs(position) where book_id=$1", [b.id]);
        for (const p of receipt.baseline.pages) { await db.query("update book_pages set position=$1,blocks=$2 where id=$3", [p.position, JSON.stringify(p.blocks), p.id]); await audit("release.page.restore", "book_page", p.id); await snapshot("book_page", p.id, p, "Restore pre-release writing"); }
        for (const scene of receipt.baseline.scenes) { await db.query("update scene_assets set is_active=$1 where id=$2", [scene.is_active, scene.id]); await audit("release.scene.restore", null, scene.id); }
        for (const zone of receipt.baseline.zones) { await db.query("update library_zones set display=$1 where id=$2", [zone.display, zone.id]); await audit("release.room.restore", "library_zone", zone.id); }
      }
      const after = await state();
      for (const p of after.projects) await snapshot("project", p.id, p, command);
      for (const b of after.books) await snapshot("book", b.id, { ...b, pages: after.pages.filter(p => p.book_id === b.id) }, command);
      for (const zone of after.zones) if (command !== "--promote") await snapshot("library_zone", zone.id, zone, command);
      receipt.afterHash = hash(after);
      receipt.history.push({ command, at: new Date().toISOString(), beforeHash: hash(before), afterHash: receipt.afterHash, state: after });
    }
  }
  await db.query("commit");
  await writeFile(file, JSON.stringify(receipt, null, 2));
  const revisions = (await db.query("select entity_type,entity_id,max(version)::int as version from revisions where author=$1 group by entity_type,entity_id order by entity_type,entity_id", [actor])).rows;
  const summary = { fingerprint: target.fingerprint, planHash, stateHash: receipt.afterHash, slugs, command, operations: receipt.history.map(({ command, at, afterHash }) => ({ command, at, afterHash })), revisions };
  await writeFile(`.local-library/release/content-${target.fingerprint}.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, revisions: revisions.length }));
} catch (e) { await db.query("rollback"); throw e; }
finally { await db.end(); }
