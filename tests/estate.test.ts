import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateEstate } from "../lib/library/scene-contract";
import { layoutSchema } from "../lib/estate/program";
import { objectFiles, roomObjects } from "../lib/estate/objects";
import {
  captionLines,
  formatRoute,
  parseRoute,
  type Cue,
  type Focus,
  type Place,
} from "../lib/estate/world";
import narration from "../content/travellers-rest/narration.json";
import { ROOM } from "../components/estate/world/engine/room";
import { freeAt, route as groundRoute, setDrawerExtension } from "../components/estate/world/engine/navmesh";
import { GARDEN, DRIVE, foundation } from "../components/estate/world/engine/grounds/plan";
import { anchor, places } from "../lib/estate/world";
import { continuousProps, media } from "../scripts/estate-inventory.mjs";

const home = (f: NonNullable<Focus>): Place =>
  f.kind === "book" ? "cabinet" : f.kind === "object" ? "desk" : "screen";

test("survey corrections preserve the owner's ceiling and continuous walking route", () => {
  assert.ok(Math.abs(ROOM.ceil - ROOM.floor - 3.19)<1e-9);
  assert.deepEqual(ROOM.door, {z0:.27,z1:1.18,top:2.73});
  assert.deepEqual(ROOM.windows, [-6.03,-3.55]);
  assert.equal(ROOM.windowHalf*2,.945);
  assert.equal(anchor["camera.drawers"][0],-2.95);
  for (const [name,place] of Object.entries(places)) {
    assert.ok(freeAt(place.eye[0],place.eye[2]),name+" has no clear standing space");
    assert.ok(groundRoute({x:place.eye[0],z:place.eye[2]},{x:.38,z:2.66}),name+" has no route to the south door");
  }
  assert.equal(GARDEN.x0,25);
  assert.ok(Math.abs(DRIVE.cz-DRIVE.rz-15.12)<1e-9); // 12 m from threshold.
  assert.equal(foundation.length,0);
});

test("opening a chest drawer reserves floor space and closing releases it", () => {
  setDrawerExtension(0);
  assert.ok(freeAt(-2.95,-2.1));
  setDrawerExtension(.52);
  assert.equal(freeAt(-2.95,-2.1),false);
  setDrawerExtension(0);
  assert.ok(freeAt(-2.95,-2.1));
});

test("Jackson's return letter is complete or absent with bounded reading transcription and explicit doubts", () => {
  const letter=roomObjects((url)=>url).find((o)=>o.id==="jackson-overton-1829-06-08")!;
  assert.equal(letter.pages.length,8);
  assert.match(letter.credit!,/Courtesy Tennessee State Library/);
  assert.match(letter.transcriptNote!,/Not a critical edition/);
  for (const page of letter.pages) { assert.ok(page.transcript?.length); for (const row of page.transcript!) assert.ok(row.y0 >= 0 && row.y1 <= 1 && row.y0 < row.y1); }
  assert.ok(letter.pages.some(page => page.transcript?.some(row => /\[[^\]]+\?\]/.test(row.text))));
  assert.match(letter.pages[7].label,/not part of/);
  assert.equal(roomObjects((url)=>url.includes("jackson-overton-1829-06-08/p03")?undefined:url).some((o)=>o.id===letter.id),false);
});

test("both editions of the house model keep their own anchor contracts", async () => {
  for (const [file, edition] of [
    ["world.glb", 1],
    ["world-low.glb", 1],
    ["world-v2.glb", 2],
    ["world-v2-low.glb", 2],
  ] as const)
    validateEstate(await readFile("public/travellers-rest/" + file), edition);
  // The continuous shell has no custodian clip and the guided model lacks the new stops.
  const guided = await readFile("public/travellers-rest/world.glb");
  const shell = await readFile("public/travellers-rest/world-v2.glb");
  assert.throws(() => validateEstate(guided, 2));
  assert.throws(() => validateEstate(shell, 1));
});

test("a location hash and a room state convert both ways without loss", () => {
  const routes = [
    { place: "library", focus: null },
    { place: "approach", focus: null },
    { place: "cabinet", focus: { kind: "book", slug: "agentic-mission-control" } },
    {
      place: "cabinet",
      focus: { kind: "book", slug: "the-library", leaf: "architecture", page: 2 },
    },
    { place: "desk", focus: { kind: "object", id: "overton-letter", page: 3 } },
    { place: "screen", focus: { kind: "screen", slot: "film" } },
    { place: "screen", focus: { kind: "screen", slot: "soccer", clip: "2026-09-06-gun-club-vs-brazil--goal-2" } },
  ] as const;
  for (const route of routes)
    assert.deepEqual(
      JSON.parse(JSON.stringify(parseRoute(formatRoute(route), home))),
      route,
    );
  // The entrance and anything unrecognised stay outside the world.
  for (const hash of ["", "#approach", "#book/..%2Fsecret", "#object/<script>"])
    assert.equal(parseRoute(hash, home), null);
  // Links from the guided edition still resolve.
  assert.deepEqual(parseRoute("#collection", home), { place: "desk", focus: null });
  assert.deepEqual(parseRoute("#leaf-2", home, ["first-residents", "household"]), {
    place: "cabinet",
    focus: { kind: "book", slug: "travellers-rest-house-book", leaf: "household" },
  });
});

test("the continuous program parses, and every key it names has a delivery file", () => {
  const guided = {
    edition: 1,
    companion: "travellers-rest-house-book",
    featuredFrom: null,
    featuredUntil: "2027-01-01T00:00:00.000Z",
    scenes: { high: "travellers-rest-house", low: "travellers-rest-house-low" },
    cues: [],
    media: {},
  };
  assert.equal(layoutSchema.safeParse([{ component: "HouseProgram", props: guided }]).success, true);
  const next = continuousProps(guided);
  const parsed = layoutSchema.parse([{ component: "HouseProgram", props: next }])[0].props;
  assert.equal(parsed.edition, 2);
  // Owner scheduling survives the upgrade.
  assert.equal(parsed.featuredUntil, guided.featuredUntil);
  if (parsed.edition !== 2) return;
  const keys = new Set(media.map((m: { key: string }) => m.key));
  const named = [
    parsed.portrait,
    parsed.voice.timeline,
    ...parsed.voice.cues.map((c) => c.audio),
    ...parsed.objects.flatMap((o) => o.pages.flatMap((p) => [p.full, p.small ?? p.full])),
  ];
  for (const key of named) {
    assert.ok(keys.has(key), "no delivery file for " + key);
    if (key !== parsed.portrait) assert.match(parsed.media[key], /^[0-9a-f-]{36}$/);
  }
  // Every authored cue is voiced, and nothing is voiced that was not authored.
  assert.deepEqual(
    parsed.voice.cues.map((c) => c.id).sort(),
    narration.cues.map((c) => c.id).sort(),
  );
  assert.throws(() =>
    layoutSchema.parse([{ component: "HouseProgram", props: { ...next, edition: 3 } }]),
  );
});

test("room objects resolve only through approved media and keep their sources", () => {
  const files = objectFiles();
  const importer = new Set(media.map((m: { key: string }) => m.key));
  for (const f of files) assert.ok(importer.has(f.key), "importer does not carry " + f.key);
  const all = roomObjects((url) => url);
  const letter = all.find((o) => o.id === "overton-letter")!;
  assert.equal(letter.pages.length, 4);
  assert.ok(letter.pages[0].transcript!.some((t) => t.text.includes("No man living")));
  assert.match(letter.links[0].url, /^https:\/\/www\.loc\.gov\/item\/maj012882\/$/);
  for (const o of all) {
    assert.ok(o.links.length > 0, o.id + " has no source link");
    if (o.form !== "card") assert.ok(o.credit && o.rights, o.id + " has no credit");
  }
  // A scan that is not approved drops out; a document with no scans is not placed.
  const partial = roomObjects((url) => (url.includes("maj012882/p02") ? undefined : url));
  assert.equal(partial.find((o) => o.id === "overton-letter")!.pages.length, 3);
  const none = roomObjects(() => undefined);
  assert.deepEqual(
    none.map((o) => o.form),
    none.map(() => "card"),
  );
});

test("captions follow word times and never outrun the cue", async () => {
  const timeline = JSON.parse(
    await readFile("public/travellers-rest/voice/timeline.json", "utf8"),
  ) as { cues: Record<string, Cue> };
  for (const cue of Object.values(timeline.cues)) {
    const lines = captionLines(cue);
    assert.equal(lines.map((l) => l.text).join(" "), cue.text);
    for (let i = 1; i < lines.length; i++)
      assert.ok(lines[i].start >= lines[i - 1].start, cue.id + " captions out of order");
    assert.ok(lines.at(-1)!.end <= cue.duration + 0.05, cue.id + " overruns its audio");
    // One mouth sample per thirtieth of a second of audio.
    assert.ok(Math.abs(cue.open.length - cue.duration * 30) <= 3, cue.id + " mouth track length");
    assert.match(cue.open, /^[0-9]+$/);
  }
});
