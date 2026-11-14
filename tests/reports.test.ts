import test from "node:test";
import assert from "node:assert/strict";
import { reportNeighbors, reportSectionId, reportSections, resolveReportSection } from "../lib/library/report";
import { blocksFrom } from "../lib/library/policy";
import { type Volume } from "../lib/library/types";
import { applyShowcaseDraft } from "../lib/library/showcase-draft";
const volume: Volume = { slug: "test", title: "Test", summary: "", kind: "Project", shelf: null, position: 1, plate: 0, tags: [], pages: [{ key: "notes-7", title: "Page 7", blocks: [{ kind: "heading", text: "A durable title" }] }, { key: "overview", title: "Overview", blocks: [] }] };
test("report citations remain attached to leaf keys when headings change", () => {
  assert.equal(reportSections(volume)[0].id, "notes-7");
  assert.equal(reportSections(volume)[0].title, "A durable title");
  assert.equal(resolveReportSection(volume, "invented"), null);
  assert.equal(resolveReportSection(volume)?.id, "notes-7");
  assert.equal(reportSectionId("notes/é"), "report-section-notes%2F%C3%A9");
  assert.equal(reportSections({ pages: [...volume.pages, volume.pages[0]] }).length, 2);
});
test("adjacent reports are drawn only from the supplied authorized projection", () => {
  assert.deepEqual(reportNeighbors(volume, []), {});
  const other = { ...volume, slug: "other" };
  assert.equal(reportNeighbors(volume, [volume, other]).next, other);
  assert.equal(reportNeighbors(other, [volume, other]).previous, volume);
});
test("dedicated figures, captions and transcripts survive validated block projection", () => {
  assert.deepEqual(blocksFrom([{ component: "Image", props: { text: "Architecture", url: "/library/artwork/diagram.webp", ownPage: true } }]), [{ kind: "image", text: "Architecture", url: "/library/artwork/diagram.webp", ownPage: true }]);
  const video = blocksFrom([{ component: "Video", props: { text: "Walkthrough", url: "/library/recordings/demo.mp4", captions: "/library/recordings/demo.vtt", transcript: "https://example.com/transcript" } }])[0];
  assert.equal(video.captions, "/library/recordings/demo.vtt");
  assert.equal(video.transcript, "https://example.com/transcript");
  assert.equal(blocksFrom([{ component: "Prose", props: { text: "No", ownPage: true } }]).length, 0);
  const unsafe = blocksFrom([{ component: "Video", props: { text: "Walkthrough", url: "/library/recordings/demo.mp4", captions: "https://evil.invalid/x.vtt", transcript: "javascript:alert(1)" } }])[0];
  assert.equal(unsafe.captions, undefined);
  assert.equal(unsafe.transcript, undefined);
});
test("draft artwork only remaps known media on authorized volumes and preserves author words", () => {
  assert.deepEqual(applyShowcaseDraft([]), []);
  const original: Volume = { ...volume, slug: "gowipe", cover: "/library/artwork/gowipe-cover.webp", pages: [{ key: "overview", title: "Owner heading", blocks: [{ kind: "text", text: "The owner's exact words." }, { kind: "image", text: "The owner's exact caption.", url: "/library/artwork/gowipe-architecture.webp" }, { kind: "link", text: "Source", url: "https://example.com" }] }] };
  const draft = applyShowcaseDraft([original])[0];
  assert.equal(draft.cover, "/library/artwork/gowipe-poster-v2.webp");
  assert.equal(draft.pages[0].blocks[1].ownPage, true);
  assert.equal(draft.pages[0].blocks[1].url, "/library/artwork/gowipe-architecture-v2.webp");
  assert.deepEqual(draft.pages[0].blocks.map((block) => block.text), original.pages[0].blocks.map((block) => block.text));
  assert.equal(draft.pages[0].blocks[2].url, "https://example.com");
  assert.equal(original.cover, "/library/artwork/gowipe-cover.webp");
  assert.equal(applyShowcaseDraft([{ ...original, cover: "/library/artwork/owner-new-art.webp" }])[0].cover, "/library/artwork/owner-new-art.webp");
});
