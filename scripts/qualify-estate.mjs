// Run only against the disposable database created by test-library-admin.mjs.
import { expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  records,
  insertRecord,
  starter,
  upgradeProgram,
} from "./estate-inventory.mjs";
import { profileEstate } from "./profile-estate.mjs";
import { qualifyVisitorJourney } from "./qualify-visitor-journey.mjs";

export async function qualifyEstate({ db, page, browser, base, profile }) {
  for (const row of records) await insertRecord(db, row);
  // The rehearsal runs the same in-place upgrade as the guarded importer.
  const change = await upgradeProgram(db);
  expect(change?.to).toBe(2);
  expect(await upgradeProgram(db)).toBeNull();
  const openLeaf = (target) =>
    target.locator(".wb-page").filter({ hasText: "Before the house" }).first();
  const screensBefore = (
    await db.query(
      "select slot,mode,config,media_id,deployment_id from computer_screens order by slot",
    )
  ).rows;
  const publicPage = await browser.newPage({ baseURL: base });
  // Released, the first leaf is read from the physical house book in the 3D library.
  // Withdrawn, the same link falls back to the plain page that says so.
  async function seeLeaf(available) {
    await publicPage.goto("/#leaf-1");
    await publicPage.reload();
    if (available) await expect(openLeaf(publicPage)).toBeVisible({ timeout: 60000 });
    else
      await expect(
        publicPage.getByRole("heading", { name: "This leaf is unavailable" }),
      ).toBeVisible();
  }
  const within = (name) =>
    publicPage
      .getByRole("navigation", { name: /Within reach/ })
      .getByRole("button", { name });
  async function save(release, start = "", end = "") {
    await page.goto("/admin/library");
    const form = page.locator("#travellers-rest form");
    await form.getByLabel("House visit").selectOption(release);
    await form.getByLabel(/Featured visit starts/).fill(start);
    await form.getByLabel(/Featured visit ends/).fill(end);
    await form.getByRole("button", { name: "Save house program" }).click();
    await expect(form.getByRole("status")).toHaveText("Saved to the Library.");
  }
  try {
    await page.goto("/admin/library/preview#leaf-1");
    await expect(openLeaf(page)).toBeVisible({ timeout: 60000 });
    await seeLeaf(false);
    expect(
      (await fetch(base + "/catalog?volume=travellers-rest-house-book")).status,
    ).toBe(404);
    await save("publish", "2099-01-01T00:00");
    await seeLeaf(false);
    await save("publish", "", "2001-01-01T00:00");
    await seeLeaf(false);
    await save("publish");
    await seeLeaf(true);
    expect(
      (await fetch(base + "/catalog?volume=travellers-rest-house-book")).status,
    ).toBe(200);
    await publicPage.goto("/#cabinet");
    await publicPage.reload();
    await expect(within("The viewing folio")).toBeVisible({ timeout: 60000 });
    await expect(within(/Mission Control/)).toHaveCount(0);
    // Publish an isolated project and wrapper to verify its independent gate.
    await db.query(
      "insert into projects(id,slug,title,summary,display,updated_at) values($1,$2,$3,$4,'published',now()) on conflict (id) do update set display='published'",
      [starter.projectId, starter.slug, starter.title, starter.summary],
    );
    await db.query(
      "insert into books(id,slug,title,entity_type,entity_id,display,updated_at) values($1,$2,$3,'project',$4,'published',now()) on conflict (id) do update set display='published'",
      [starter.bookId, starter.slug, starter.title, starter.projectId],
    );
    // Rehearse the actual checked-in draft pages, rather than a summary-only book.
    // All writes remain in this disposable database; no owner content is published.
    const draft = JSON.parse(await readFile("content/library/books.json", "utf8")).books.find(book => book.slug === starter.slug);
    const staged = JSON.parse(await readFile("assets/library/posters/staged-media.json", "utf8"));
    const replacements = new Map(staged.replacements.map(item => [item.from, item]));
    const cover = staged.posters.find(item => item.slug === starter.slug)?.url ?? draft.cover;
    const asset = await db.query("INSERT INTO media_assets(id,kind,url,title,updated_at) VALUES(gen_random_uuid(),'image',$1,'Isolated rehearsal cover',now()) RETURNING id", [cover]);
    await db.query("UPDATE books SET page_mode='authored',cover_media_id=$1 WHERE id=$2", [asset.rows[0].id, starter.bookId]);
    for (const leaf of draft.pages) {
      const blocks = leaf.blocks.map(block => {
        const p = { ...block.props };
        if (block.component === "Image" && replacements.has(p.url)) {
          const replacement = replacements.get(p.url);
          if (replacement.ownPage) { p.detail = p.url; p.ownPage = true; }
          p.url = replacement.to;
        }
        if (block.component === "Video" && replacements.has(p.poster)) p.poster = replacements.get(p.poster).to;
        return { ...block, props: p };
      });
      await db.query("INSERT INTO book_pages(id,book_id,position,template_code,blocks,updated_at) VALUES(gen_random_uuid(),$1,$2,$3,$4::jsonb,now())", [starter.bookId,leaf.position,leaf.template,JSON.stringify(blocks)]);
    }
    await publicPage.reload();
    await expect(within(/Mission Control/)).toBeVisible({ timeout: 60000 });
    // Measure one active visit. A second animated fixture window competes for
    // the same GPU in headless Chrome and is not part of the visitor workload.
    await publicPage.goto("about:blank");
    if (profile) await profileEstate(browser, base);
    await qualifyVisitorJourney({ db, page, browser, base });
    await db.query("update projects set display='hidden' where id=$1", [
      starter.projectId,
    ]);
    await publicPage.goto("/#cabinet");
    await expect(within("The viewing folio")).toBeVisible({ timeout: 60000 });
    await expect(within(/Mission Control/)).toHaveCount(0);
    // A link to the withdrawn volume resolves to the cabinet and says why.
    await publicPage.goto("/#book/agentic-mission-control/overview");
    await publicPage.reload();
    await expect(
      publicPage.getByRole("status").filter({ hasText: "not on the shelves" }),
    ).toBeVisible({ timeout: 60000 });
    await expect(publicPage).toHaveURL(/#cabinet$/);
    expect(
      (await fetch(base + "/catalog?volume=agentic-mission-control")).status,
    ).toBe(404);
    await save("draft");
    await seeLeaf(false);
    expect(
      (await fetch(base + "/catalog?volume=travellers-rest-house-book")).status,
    ).toBe(404);
    expect(
      Number(
        (
          await db.query(
            "select count(*) as n from scene_assets where slug like 'travellers-rest-%' and is_active",
          )
        ).rows[0].n,
      ),
    ).toBe(0);
    expect(
      (
        await db.query(
          "select slot,mode,config,media_id,deployment_id from computer_screens order by slot",
        )
      ).rows,
    ).toEqual(screensBefore);
    console.log(
      "PASS: continuous edition upgraded in place, hidden draft, authentic release action with edition 2 scene validation, publication window, public reading from the physical house book, independent project visibility on the cabinet shelves, withdrawn-volume link, withdrawal and unchanged global screens in isolated PGlite.",
    );
  } finally {
    await publicPage.close();
  }
}
