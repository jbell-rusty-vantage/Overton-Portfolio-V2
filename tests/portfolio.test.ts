import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import baseline from "../assets/library/posters/content-inventory.json";
import { applyShowcaseWritingDraft, showcaseWriting } from "../lib/library/showcase-writing";
import { blocksFrom, templateNames } from "../lib/library/policy";
import { resolvePages } from "../lib/library/pages";
import { portfolioSelection } from "../lib/library/portfolio";
import type { Volume } from "../lib/library/model";

const originalVolumes: Volume[] = baseline.map((entry) => ({ slug: entry.slug, title: entry.title, summary: entry.summary ?? "", kind: "Project", tags: entry.tags, status: entry.tags.find((tag) => /^(live|in development|early stage|earlier work|launching)$/i.test(tag)) ?? entry.status, shelf: null, position: 1, plate: 0, pages: (entry.pages ?? []).map((page) => ({ key: page.template, title: templateNames[page.template], blocks: blocksFrom(page.blocks) })) }));
for (const volume of originalVolumes) {
  volume.status = volume.pages.flatMap((page) => page.blocks).find((block) => block.kind === "metric" && block.label === "Status")?.text ?? volume.status;
}

test("writing draft cannot add records and leaves changed owner content untouched", () => {
  assert.deepEqual(applyShowcaseWritingDraft([]), []);
  const original = originalVolumes.find((entry) => entry.slug === "gowipe")!;
  const changed = { ...original, pages: original.pages.map((page, index) => index ? page : { ...page, blocks: [{ kind: "text" as const, text: "New owner edit" }] }) };
  assert.equal(applyShowcaseWritingDraft([changed])[0], changed);
  const summaryChanged = { ...original, summary: "Owner revision" };
  assert.equal(applyShowcaseWritingDraft([summaryChanged])[0], summaryChanged);
  const statusChanged = { ...original, status: "Owner revised status" };
  assert.equal(applyShowcaseWritingDraft([statusChanged])[0], statusChanged);
  const tagsChanged = { ...original, tags: ["Owner tag"] };
  assert.equal(applyShowcaseWritingDraft([tagsChanged])[0], tagsChanged);
  assert.equal(portfolioSelection([]).selected.length, 0);
});

test("all six authored studies preserve section identities and validated local media", () => {
  const drafts = applyShowcaseWritingDraft(originalVolumes);
  assert.equal(showcaseWriting.length, 6);
  for (const study of showcaseWriting) {
    const original = originalVolumes.find((entry) => entry.slug === study.slug)!;
    const draft = drafts.find((entry) => entry.slug === study.slug)!;
    assert.equal(draft.summary, study.summary, study.slug + " applied");
    assert.deepEqual(draft.pages.map((page) => page.key).sort(), original.pages.map((page) => page.key).sort());
    assert.ok(draft.pages.some((page) => /Walkthrough/i.test(page.title)), study.slug);
    for (const page of study.pages) {
      assert.equal(blocksFrom(page.blocks).length, page.blocks.length, study.slug + "/" + page.key + " validates every block");
      for (const block of blocksFrom(page.blocks)) {
        for (const url of [block.url, block.poster]) if (url?.startsWith("/library/")) assert.ok(existsSync("public" + url), url);
      }
    }
  }
});

test("office section titles survive promotion without changing citation keys", () => {
  const pages = resolvePages("authored", [], [{ templateCode: "notes", position: 3, blocks: [{ component: "Heading", props: { text: "Walkthrough: inspect a claim", label: "section-title" } }, { component: "Prose", props: { text: "The evidence." } }] }]);
  assert.equal(pages[0].key, "notes");
  assert.equal(pages[0].title, "Walkthrough: inspect a claim");
  assert.deepEqual(pages[0].blocks, [{ kind: "text", text: "The evidence." }]);
});
