import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readable,
  blocksFrom,
  safeManuscript,
  publicMedia,
  publicImage,
} from "../lib/library/policy";
import { resolvePages } from "../lib/library/pages";
import { sampleCollection } from "../lib/library/fixtures";
import { validateEdits } from "../lib/library/sample-edits";
import { reviewBundle } from "../scripts/review-library-draft.mjs";
import { type Leaf } from "../lib/library/types";

test("publication, ingestion and time are independent", () => {
  const time = Date.UTC(2026, 10, 8);
  for (const activation of ["tracking", "inactive", "paused"]) {
    for (const [display, list, direct] of [
      ["hidden", false, false],
      ["unlisted", false, true],
      ["published", true, true],
      ["featured", true, true],
    ] as const) {
      const row = { activation, display };
      assert.equal(readable(row, false, false, time), list);
      assert.equal(readable(row, true, false, time), direct);
      assert.equal(
        readable({ ...row, deletedAt: new Date(time) }, true, true, time),
        false,
      );
      assert.equal(
        readable(
          { ...row, publishedAt: new Date(time + 1) },
          true,
          false,
          time,
        ),
        false,
      );
    }
  }
});
test("rich blocks return only supported browser-safe fields", () => {
  assert.equal(publicImage("/library/artwork/my-cover.webp"), "/library/artwork/my-cover.webp");
  for (const value of ["/library/artwork/../secret.png", "//host/image.png", "/library/artwork/x.svg", "/library/artwork/%2e%2e.png"]) {
    assert.equal(publicImage(value), undefined);
  }
  const blocks = [
    { component: "Unknown", props: { text: "PRIVATE_SENTINEL" } },
    { component: "Link", props: { text: "link", url: "javascript:alert(1)" } },
    {
      component: "Image",
      props: { text: "image", url: "https://private.example/secret" },
    },
    {
      component: "Video",
      props: { text: "video", url: "https://private.example/clip.mp4" },
    },
    {
      component: "Video",
      props: {
        text: "walkthrough",
        url: "https://abc.public.blob.vercel-storage.com/clip.mp4",
        poster: "/library/artwork/clip-poster.webp",
      },
    },
    {
      component: "Prose",
      props: { text: "PRIVATE_SENTINEL", poster: "/library/artwork/x.webp" },
    },
    { component: "Video", props: { text: "bundled", url: "/library/recordings/site-tour.mp4" } },
    { component: "Video", props: { text: "escape", url: "/library/recordings/../secret.mp4" } },
    { component: "Code", props: { text: "<script>example</script>" } },
    { component: "Prose", props: { text: "long".repeat(6000) } },
    {
      component: "Link",
      props: { text: "source", url: "https://example.com" },
    },
  ];
  assert.deepEqual(blocksFrom(blocks), [
    {
      kind: "video",
      text: "walkthrough",
      url: "https://abc.public.blob.vercel-storage.com/clip.mp4",
      poster: "/library/artwork/clip-poster.webp",
    },
    { kind: "video", text: "bundled", url: "/library/recordings/site-tour.mp4" },
    { kind: "code", text: "<script>example</script>" },
    { kind: "link", text: "source", url: "https://example.com/" },
  ]);
  assert.equal(
    publicMedia("https://public.blob.vercel-storage.com.evil.test/image"),
    undefined,
  );
  assert.equal(
    blocksFrom(Array(100).fill({ component: "Prose", props: { text: "a" } }))
      .length,
    64,
  );
  assert.deepEqual(
    safeManuscript(
      "---\ntoken: PRIVATE_SENTINEL\n---\nimport Widget from 'private'\n\n# Public title\n\n<Widget/>",
    ),
    [{ kind: "text", text: "Public title" }],
  );
});
test("hybrid replacement, duplicate authored templates and generated order", () => {
  const generated: Leaf[] = [
    {
      key: "overview",
      title: "Overview",
      blocks: [{ kind: "text", text: "generated" }],
    },
    { key: "links", title: "Sources", blocks: [] },
  ];
  const row = (position: number, templateCode: string) => ({
    position,
    templateCode,
    blocks: [{ component: "Prose", props: { text: "page " + position } }],
  });
  const rows = [row(1, "architecture"), row(2, "overview"), row(3, "overview")];
  assert.deepEqual(resolvePages("generated", generated, rows), generated);
  assert.deepEqual(
    resolvePages("authored", generated, rows).map((p) => p.key),
    ["architecture", "overview", "overview-3"],
  );
  const hybrid = resolvePages("hybrid", generated, rows);
  assert.deepEqual(
    hybrid.map((p) => p.key),
    ["overview", "overview-3", "architecture", "links"],
  );
  assert.equal(hybrid[0].blocks[0].text, "page 2");
});

test("shelf positions, sandbox imports and draft bundles reject collisions", () => {
  const base = sampleCollection();
  assert.equal(base.volumes.filter((v) => v.kind === "Project").length, 8);
  const entry = {
    slug: "demo-extra",
    title: "Example",
    summary: "Sample",
    notes: "",
    visible: false,
    shelf: "stacks-ai-agents",
    position: 3,
  };
  assert.equal(validateEdits([entry], base).length, 1);
  assert.throws(() => validateEdits([{ ...entry, position: 2 }], base));
  assert.throws(() => validateEdits([{ ...entry, position: 25 }], base));
  const project = {
    importKey: "source-one",
    slug: "example",
    title: "Example",
    sourcePages: [1],
    placement: { shelf: "stacks-ai-agents", position: 3 },
  };
  const bundle = { schemaVersion: 1, projects: [project] };
  assert.equal(reviewBundle(bundle)[0].display, "hidden");
  for (const projects of [
    [project, project],
    [{ ...project, display: "published" }],
    [{ ...project, links: [{ label: "bad", url: "file:///secret" }] }],
    [{ ...project, overwrite: true }],
  ]) {
    assert.throws(() => reviewBundle({ ...bundle, projects }));
  }
});
