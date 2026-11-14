// Read-only authoring inventory. No SQL writes, imports, uploads or credentials in output.
import pg from "pg";
import { mkdir, writeFile } from "node:fs/promises";
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("BEGIN READ ONLY");
  const { rows } = await db.query(`select b.slug, b.title, p.summary, p.tags,
    p.status, p.started_on, p.ended_on, p.body_blocks,
    (select json_agg(json_build_object('template',bp.template_code,'position',bp.position,'blocks',bp.blocks) order by bp.position) from book_pages bp where bp.book_id=b.id) as pages
    from books b join projects p on b.entity_id=p.id and b.entity_type='project'
    where p.deleted_at is null order by p.sort_order,p.title`);
  await mkdir("assets/library/posters", { recursive: true });
  await writeFile("assets/library/posters/content-inventory.json", JSON.stringify(rows, null, 2) + "\n");
  console.log(`Read ${rows.length} project books; saved local authoring inventory.`);
  await db.query("ROLLBACK");
} finally { await db.end(); }
