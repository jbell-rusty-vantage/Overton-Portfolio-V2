// Explicitly scoped to the verified Library endpoint. Default invocation only reads.
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";

const records = JSON.parse(
  await readFile(new URL("../assets/library/starters.json", import.meta.url)),
);
const url = new URL(process.env.DATABASE_URL);
const endpoint = url.hostname.split(".")[0].replace(/-pooler$/, "");
if (endpoint !== "ep-noisy-frost-advb430b" || url.pathname !== "/neondb")
  throw Error("Unexpected Library target");
const apply = process.argv.includes("--apply");
const slugs = process.argv.slice(2).filter((s) => !s.startsWith("--"));
if (!slugs.length || slugs.some((s) => !records.some((r) => r.slug === s)))
  throw Error("Specify verified starter slug(s)");
const db = new pg.Client({
  connectionString: url.href,
  connectionTimeoutMillis: 10000,
});
const actor = "library-starter-import";
async function seed(r) {
  const params = [r.projectId, r.slug];
  const existing = await db.query(
    "select id from projects where id=$1 or slug=$2",
    params,
  );
  if (existing.rowCount) {
    const proof = await db.query(
      "select 1 from audit_log where entity_id=$1 and action='library.seed' and detail->>'githubId'=$2",
      [r.projectId, r.githubId],
    );
    if (
      existing.rowCount === 1 &&
      existing.rows[0].id === r.projectId &&
      proof.rowCount
    ) {
      console.log(r.slug, "unchanged (manual edits preserved)");
      return;
    }
    throw Error("Conflicting project: " + r.slug);
  }
  const shelf = (
    await db.query("select id,capacity from shelves where slug=$1", [r.shelf])
  ).rows[0];
  const occupied = await db.query(
    "select position from shelf_slots where shelf_id=$1",
    [shelf?.id],
  );
  const slot = Array.from(
    { length: shelf?.capacity ?? 0 },
    (_, i) => i + 1,
  ).find((p) => !occupied.rows.some((s) => s.position === p));
  const repoCollision = await db.query(
    "select 1 from repos where github_id=$1 or full_name=$2 or slug=$3",
    [r.githubId, r.repo, r.slug],
  );
  const bookCollision = await db.query(
    "select 1 from books where slug=$1 or id=$2 or (entity_type='project' and entity_id=$3)",
    [r.slug, r.bookId, r.projectId],
  );
  if (!slot || repoCollision.rowCount || bookCollision.rowCount)
    throw Error("Conflicting repository, book or shelf: " + r.slug);
  console.log(
    apply ? "Insert" : "Would insert",
    r.slug,
    "hidden/inactive project + hidden repo + primary link + hidden hybrid book + architecture page;",
    r.shelf,
    "slot",
    slot,
  );
  if (!apply) return;
  const repoId = randomUUID();
  const pageId = randomUUID();
  await db.query(
    "insert into repos(id,slug,github_id,full_name,name,html_url,default_branch,updated_at) values ($1,$2,$3,$4,$2,$5,'main',now())",
    [repoId, r.slug, r.githubId, r.repo, "https://github.com/" + r.repo],
  );
  await db.query(
    "insert into projects(id,slug,title,summary,tags,activation,display,updated_at) values ($1,$2,$3,$4,$5,'inactive','hidden',now())",
    [r.projectId, r.slug, r.title, r.summary, r.tags],
  );
  await db.query(
    "insert into project_repos(project_id,repo_id,role,is_primary) values ($1,$2,'other',true)",
    [r.projectId, repoId],
  );
  await db.query(
    "insert into books(id,slug,entity_type,entity_id,title,page_mode,display,updated_at) values ($1,$2,'project',$3,$4,'hybrid','hidden',now())",
    [r.bookId, r.slug, r.projectId, r.title],
  );
  await db.query(
    "insert into book_pages(id,book_id,position,template_code,blocks,updated_at) values ($1,$2,1,'architecture',$3,now())",
    [
      pageId,
      r.bookId,
      JSON.stringify([{ component: "Prose", props: { text: r.architecture } }]),
    ],
  );
  const slotId = randomUUID();
  await db.query(
    "insert into shelf_slots(id,shelf_id,position,entity_type,entity_id) values ($1,$2,$3,'book',$4)",
    [slotId, shelf.id, slot, r.bookId],
  );
  const provenance = JSON.stringify({
    githubId: r.githubId,
    repository: r.repo,
    revision: r.revision,
    shelf: r.shelf,
    position: slot,
    primaryRepoId: repoId,
    slotId,
  });
  for (const [table, type, id] of [
    ["projects", "project", r.projectId],
    ["books", "book", r.bookId],
    ["book_pages", "book_page", pageId],
    ["repos", "repo", repoId],
  ]) {
    await db.query(
      "insert into audit_log(id,actor,action,entity_type,entity_id,detail) values($1,$2,'library.seed',$3,$4,$5)",
      [randomUUID(), actor, type, id, provenance],
    );
    await db.query(
      "insert into revisions(id,entity_type,entity_id,version,author,snapshot) select $1,$2,$3,1,$4,to_jsonb(t) from " +
        table +
        " t where t.id=$3",
      [randomUUID(), type, id, actor],
    );
  }
}
try {
  await db.connect();
  await db.query(
    apply ? "begin isolation level serializable" : "begin read only",
  );
  if (apply) await db.query("select pg_advisory_xact_lock(81005214)");
  const migrations = await db.query(
    "select migration_name from _prisma_migrations where finished_at is not null and rolled_back_at is null",
  );
  const expected = [
    "20261008000000_init",
    "20261008000050_comments_views_functions",
    "20261008000100_seed_reference_data",
  ];
  if (
    !expected.every((name) =>
      migrations.rows.some((r) => r.migration_name === name),
    )
  )
    throw Error("Incomplete Library schema");
  for (const record of records.filter((r) => slugs.includes(r.slug)))
    await seed(record);
  await db.query("commit");
} catch (error) {
  await db.query("rollback").catch(() => {});
  console.error("Seed aborted:", error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
