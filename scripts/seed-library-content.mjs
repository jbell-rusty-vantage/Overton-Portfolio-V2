// Seeds the Library's project volumes from content/library/books.json.
//   node --env-file=.env scripts/seed-library-content.mjs            read-only plan
//   node --env-file=.env scripts/seed-library-content.mjs --apply    write (everything stays hidden)
//   node --env-file=.env scripts/seed-library-content.mjs --publish  release projects, books, repos and sites
//   node --env-file=.env scripts/seed-library-content.mjs --withdraw hide them again
// Idempotent by slug: a volume whose content hash is unchanged is skipped. Existing rows keep their ids.
// Every write is audited and snapshotted; publication emits one public signal per project.
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";

const spec = JSON.parse(await readFile(new URL("../content/library/books.json", import.meta.url)));
const url = new URL(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);
const endpoint = url.hostname.split(".")[0].replace(/-pooler$/, "");
if (endpoint !== "ep-noisy-frost-advb430b" || url.pathname !== "/neondb") throw Error("Unexpected Library target");
const flag = (name) => process.argv.includes("--" + name);
const mode = flag("publish") ? "publish" : flag("withdraw") ? "withdraw" : flag("apply") ? "apply" : "plan";
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const actor = "library-content-seed";
const db = new pg.Client({ connectionString: url.href, connectionTimeoutMillis: 15000 });
const one = async (sql, params = []) => (await db.query(sql, params)).rows[0];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const log = (...a) => console.log(...a);

const skillCategory = (name) => {
  const n = name.toLowerCase();
  if (/^(python|typescript|javascript|sql|html|css|liquid)$/.test(n)) return "language";
  if (/mcp|agent|langchain|langgraph|ai gateway|cursor/.test(n)) return "ai";
  if (/postgres|mongo|neo4j|pgvector|prisma|drizzle|supabase|neon|graphql|sheets|analytics|google ads/.test(n)) return "data";
  if (/next|react|tailwind|three|shopify|blender|browser ext/.test(n)) return "frontend";
  if (/aws|vercel|docker|cloud run|temporal|github actions/.test(n)) return "infra";
  if (/playwright|vitest|zod|openapi|seo|oauth/.test(n)) return "practice";
  return "backend";
};

async function record(type, table, id, action, detail) {
  await db.query("insert into audit_log(id,actor,action,entity_type,entity_id,detail) values($1,$2,$3,$4,$5,$6)", [randomUUID(), actor, action, type, id, JSON.stringify(detail)]);
  await db.query(
    `insert into revisions(id,entity_type,entity_id,version,author,message,snapshot)
     select $1,$2::entity_type,$3::uuid,coalesce((select max(version) from revisions where entity_type=$2::entity_type and entity_id=$3::uuid),0)+1,$4,$5,to_jsonb(t) from ${table} t where t.id=$3::uuid`,
    [randomUUID(), type, id, actor, action],
  );
}

async function upsertMedia(m) {
  const found = await one("select id from media_assets where url=$1 and deleted_at is null", [m.url]);
  const id = found?.id ?? randomUUID();
  const values = [id, m.kind, m.url.startsWith("/") ? "external" : "blob", m.url, m.blobPathname ?? null, m.mimeType ?? (m.kind === "image" ? "image/webp" : null), m.bytes ?? null, m.width ?? null, m.height ?? null, m.durationS ?? null, m.title, m.alt, "library-volume"];
  if (found)
    await db.query("update media_assets set kind=$2,provider=$3,blob_pathname=$5,mime_type=$6,bytes=$7,width=$8,height=$9,duration_s=$10,title=$11,alt=$12,purpose=$13,updated_at=now() where id=$1 and url=$4", values);
  else
    await db.query("insert into media_assets(id,kind,provider,url,blob_pathname,mime_type,bytes,width,height,duration_s,title,alt,purpose,updated_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())", values);
  return id;
}

async function seed(b, ids) {
  const hash = createHash("sha256").update(JSON.stringify(b)).digest("hex").slice(0, 16);
  let project = await one("select id from projects where slug=$1", [b.slug]);
  if (project) {
    const same = await one("select 1 from audit_log where entity_id=$1 and action='library.content.seed' and detail->>'hash'=$2", [project.id, hash]);
    if (same) return log("  unchanged", b.slug);
  }
  const shelf = await one("select id,capacity from shelves where slug=$1", [b.shelf]);
  if (!shelf) throw Error("Unknown shelf " + b.shelf);
  log(mode === "plan" ? "  would write" : "  writing", b.slug, "→", b.shelf, "position", b.position, `(${b.pages.length} pages, ${b.media.length} media, ${b.repos.length} repos)`);
  if (mode === "plan") return;

  const projectId = project?.id ?? randomUUID();
  const clientId = b.client ? ids.clients[b.client] : null;
  const fields = [projectId, b.slug, b.title, b.tagline, b.summary, b.status, b.startedOn ?? null, b.endedOn ?? null, clientId, b.tags, b.featuredRank ?? null, b.position];
  if (project)
    await db.query("update projects set title=$3,tagline=$4,summary=$5,status=$6::project_status,started_on=$7,ended_on=$8,client_id=$9,tags=$10,featured_rank=$11,sort_order=$12,updated_at=now() where id=$1 and slug=$2", fields);
  else
    await db.query("insert into projects(id,slug,title,tagline,summary,status,started_on,ended_on,client_id,tags,featured_rank,sort_order,activation,display,updated_at) values($1,$2,$3,$4,$5,$6::project_status,$7,$8,$9,$10,$11,$12,'inactive','hidden',now())", fields);

  // Repositories
  for (const r of b.repos) {
    const g = spec.github[r.fullName];
    if (!g) throw Error("No GitHub facts for " + r.fullName);
    let repo = await one("select id from repos where github_id=$1 or full_name=$2", [g.id, g.full_name]);
    const rv = [g.id, g.full_name, g.name, g.description, g.html_url, g.homepage || null, g.private, g.fork, g.archived, g.default_branch, g.language, g.topics ?? [], g.stargazers_count, g.forks_count, g.pushed_at, g.created_at, ids.account];
    if (repo)
      await db.query("update repos set github_id=$2,full_name=$3,name=$4,description=$5,html_url=$6,homepage_url=$7,is_private=$8,is_fork=$9,is_archived=$10,default_branch=$11,primary_language=$12,topics=$13,stars=$14,forks=$15,pushed_at=$16,github_created_at=$17,github_account_id=$18,last_synced_at=now(),updated_at=now() where id=$1", [repo.id, ...rv]);
    else {
      repo = { id: randomUUID() };
      const taken = await one("select 1 from repos where slug=$1", [slugify(g.name)]);
      await db.query("insert into repos(id,slug,github_id,full_name,name,description,html_url,homepage_url,is_private,is_fork,is_archived,default_branch,primary_language,topics,stars,forks,pushed_at,github_created_at,github_account_id,last_synced_at,updated_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,now(),now())", [repo.id, taken ? slugify(g.full_name) : slugify(g.name), ...rv]);
      await record("repo", "repos", repo.id, "library.content.seed", { slug: b.slug, repository: g.full_name });
    }
    await db.query("insert into project_repos(project_id,repo_id,role,is_primary) values($1,$2,$3,$4) on conflict(project_id,repo_id) do update set role=excluded.role,is_primary=excluded.is_primary", [projectId, repo.id, r.role ?? "other", !!r.primary]);
  }

  // Live sites
  for (const d of b.deployments) {
    let dep = await one("select id from deployments where slug=$1 or url=$2", [d.slug, d.url]);
    if (dep) await db.query("update deployments set title=$2,url=$3,provider=$4,updated_at=now() where id=$1", [dep.id, d.title, d.url, d.provider ?? (d.url.includes("vercel.app") ? "vercel" : "other")]);
    else {
      dep = { id: randomUUID() };
      await db.query("insert into deployments(id,slug,title,url,provider,activation,display,updated_at) values($1,$2,$3,$4,$5,'inactive','hidden',now())", [dep.id, d.slug, d.title, d.url, d.provider ?? (d.url.includes("vercel.app") ? "vercel" : "other")]);
      await record("deployment", "deployments", dep.id, "library.content.seed", { slug: b.slug, url: d.url });
    }
    await db.query("insert into project_deployments(project_id,deployment_id,role,is_primary) values($1,$2,'app',$3) on conflict(project_id,deployment_id) do update set is_primary=excluded.is_primary", [projectId, dep.id, !!d.primary]);
  }

  // Skills
  await db.query("delete from project_skills where project_id=$1", [projectId]);
  for (const name of b.skills) {
    const slug = slugify(name);
    const skill = (await one("select id from skills where slug=$1", [slug])) ?? { id: randomUUID(), fresh: true };
    if (skill.fresh) await db.query("insert into skills(id,slug,name,category_code) values($1,$2,$3,$4)", [skill.id, slug, name, skillCategory(name)]);
    await db.query("insert into project_skills(project_id,skill_id) values($1,$2) on conflict do nothing", [projectId, skill.id]);
  }

  // Media
  await db.query("delete from media_links where entity_type='project' and entity_id=$1", [projectId]);
  let coverId = null;
  const byUrl = {};
  for (const [i, m] of b.media.entries()) {
    const id = (byUrl[m.url] = await upsertMedia(m));
    if (m.role === "cover") coverId = id;
    await db.query("insert into media_links(id,media_id,entity_type,entity_id,role_code,position,caption) values($1,$2,'project',$3,$4,$5,$6) on conflict(media_id,entity_type,entity_id,role_code) do update set position=excluded.position,caption=excluded.caption", [randomUUID(), id, projectId, m.role, i, m.alt]);
  }
  for (const m of b.media.filter((x) => x.poster && byUrl[x.poster]))
    await db.query("update media_assets set poster_media_id=$2 where id=$1", [byUrl[m.url], byUrl[m.poster]]);
  await db.query("update projects set cover_media_id=$2 where id=$1", [projectId, coverId]);

  // Book, pages and shelf position
  let book = await one("select id from books where entity_type='project' and entity_id=$1 order by created_at limit 1", [projectId]);
  const bookTitle = b.bookTitle ?? b.title;
  if (book) await db.query("update books set title=$2,subtitle=$3,cover_media_id=$4,page_mode='hybrid',updated_at=now() where id=$1", [book.id, bookTitle, b.tagline, coverId]);
  else {
    book = { id: randomUUID() };
    await db.query("insert into books(id,slug,entity_type,entity_id,title,subtitle,cover_media_id,page_mode,display,updated_at) values($1,$2,'project',$3,$4,$5,$6,'hybrid','hidden',now())", [book.id, b.slug, projectId, bookTitle, b.tagline, coverId]);
  }
  for (const old of (await db.query("select id from book_pages where book_id=$1", [book.id])).rows) {
    await record("book_page", "book_pages", old.id, "library.content.replace", { slug: b.slug });
    await db.query("delete from book_pages where id=$1", [old.id]);
  }
  for (const page of b.pages) {
    const id = randomUUID();
    await db.query("insert into book_pages(id,book_id,position,template_code,blocks,updated_at) values($1,$2,$3,$4,$5,now())", [id, book.id, page.position, page.template, JSON.stringify(page.blocks)]);
  }
  const slot = await one("select id,shelf_id,position from shelf_slots where entity_type='book' and entity_id=$1", [book.id]);
  if (!slot || slot.shelf_id !== shelf.id || slot.position !== b.position) {
    const holder = await one("select entity_id from shelf_slots where shelf_id=$1 and position=$2", [shelf.id, b.position]);
    if (holder && holder.entity_id !== book.id) throw Error(`Shelf position taken: ${b.shelf} #${b.position}`);
    if (b.position > shelf.capacity) throw Error("Beyond shelf capacity: " + b.slug);
    if (slot) await db.query("update shelf_slots set shelf_id=$2,position=$3 where id=$1", [slot.id, shelf.id, b.position]);
    else await db.query("insert into shelf_slots(id,shelf_id,position,entity_type,entity_id) values($1,$2,$3,'book',$4)", [randomUUID(), shelf.id, b.position, book.id]);
  }
  await record("project", "projects", projectId, "library.content.seed", { slug: b.slug, hash, shelf: b.shelf, position: b.position, pages: b.pages.length, media: b.media.length });
  await record("book", "books", book.id, "library.content.seed", { slug: b.slug, hash });
}

async function release(b, show) {
  const project = await one("select id,display from projects where slug=$1", [b.slug]);
  if (!project) return log("  not seeded", b.slug);
  const state = show ? (b.publishAs ?? "published") : "hidden";
  log(`  ${b.slug}: ${project.display} → ${state}`);
  await db.query("update projects set display=$2::display_state,published_at=case when $3 then coalesce(published_at,now()) else published_at end,updated_at=now() where id=$1", [project.id, state, show]);
  await db.query("update books set display=$2::display_state,updated_at=now() where entity_type='project' and entity_id=$1", [project.id, show ? (state === "featured" ? "featured" : "published") : "hidden"]);
  // Only public repositories and working sites are ever released.
  await db.query("update repos set display=$2::display_state,updated_at=now() where is_private=false and id in (select repo_id from project_repos where project_id=$1)", [project.id, show ? "published" : "hidden"]);
  await db.query("update deployments set display=$2::display_state,updated_at=now() where id in (select deployment_id from project_deployments where project_id=$1)", [project.id, show ? "published" : "hidden"]);
  await record("project", "projects", project.id, show ? "library.content.publish" : "library.content.withdraw", { slug: b.slug, display: state });
  if (show)
    await db.query(
      "insert into activity_events(id,occurred_at,source,type_code,project_id,actor,title,visibility,dedupe_key,payload) values($1,now(),'system','system.project_published',$2,$3,$4,'public',$5,$6) on conflict(dedupe_key) do nothing",
      [randomUUID(), project.id, actor, "Added to the collection: " + b.title, "library:published:" + b.slug, JSON.stringify({ slug: b.slug })],
    );
}

try {
  await db.connect();
  await db.query(mode === "plan" ? "begin read only" : "begin isolation level serializable");
  if (mode !== "plan") await db.query("select pg_advisory_xact_lock(81005215)");
  const books = spec.books.filter((b) => !only.length || only.includes(b.slug));
  log(`${mode}: ${books.length} volumes on ${endpoint}`);
  if (mode === "publish" || mode === "withdraw") for (const b of books) await release(b, mode === "publish");
  else {
    const ids = { clients: {}, account: null };
    if (mode === "apply") {
      const acct = (await one("select id from github_accounts where login=$1", ["jbell-rusty-vantage"])) ?? { id: randomUUID(), fresh: true };
      if (acct.fresh) await db.query("insert into github_accounts(id,login,label,kind,html_url,updated_at) values($1,$2,$3,'personal',$4,now())", [acct.id, "jbell-rusty-vantage", "John Overton Bell", "https://github.com/jbell-rusty-vantage"]);
      ids.account = acct.id;
      for (const c of spec.clients) {
        const row = (await one("select id from clients where slug=$1", [c.slug])) ?? { id: randomUUID(), fresh: true };
        if (row.fresh) {
          await db.query("insert into clients(id,slug,name,show_name,updated_at) values($1,$2,$3,$4,now())", [row.id, c.slug, c.name, c.showName]);
          await record("client", "clients", row.id, "library.content.seed", { slug: c.slug });
        } else await db.query("update clients set name=$2,show_name=$3,updated_at=now() where id=$1", [row.id, c.name, c.showName]);
        ids.clients[c.slug] = row.id;
      }
    }
    for (const b of books) await seed(b, ids);
  }
  await db.query("commit");
  log(mode === "plan" ? "Nothing written (plan only)." : "Done.");
} catch (error) {
  await db.query("rollback").catch(() => {});
  console.error("Aborted, nothing written:", error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
