// Build the same edition for the guarded importer and the disposable release rehearsal.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const json = async (file) => JSON.parse(await readFile(file, "utf8"));
const book = await json("content/travellers-rest/companion.json");
// program.json describes the current (continuous) edition. The guided first edition is
// the same companion, scenes and cues without the world additions.
const continuous = await json("content/travellers-rest/program.json");
const program = {
  edition: 1,
  companion: continuous.companion,
  featuredFrom: null,
  featuredUntil: null,
  scenes: continuous.scenes,
  cues: continuous.cues,
};
const letters = await json("assets/travellers-rest/archive/letters.json");
const jackson = await json("assets/travellers-rest/archive/jackson-letter.json");
const scans = await json("assets/travellers-rest/archive/world-files.json");
const timeline = await json("public/travellers-rest/voice/timeline.json");
const archive = await json("assets/travellers-rest/archive/catalog.json");
const starter = (await json("assets/library/starters.json")).find(
  (s) => s.slug === "agentic-mission-control",
);
const actor = "travellers-rest-draft-import";
const store = "store_UWE1GjFmhAJkqBcg";
const checksum = (bytes) => createHash("sha256").update(bytes).digest("hex");
function id(key) {
  const h = checksum("travellers-rest/" + key);
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "5" + h.slice(13, 16),
    "8" + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}
const local = "/travellers-rest/";
const library = "/library/artwork/agentic-mission-control-";
const film = "/performances/wellington-mens-vs-royal-palm/free_kick_goal";
const survey =
  "Historic American Buildings Survey, TN-14. Jack E. Boucher, Library of Congress. https://www.loc.gov/item/tn0036/";
const illustration =
  "AI-assisted visual interpretation prepared for John Overton’s portfolio. Architectural evidence: HABS TN-14.";
const assets = [
  ...archive.plates
    .filter((p) => !p.referenceOnly)
    .map((p) => [
      p.id,
      local + "archive/" + p.id + ".webp",
      p.title,
      p.alt,
      p.credit + " " + p.source + " " + p.rights,
    ]),
  ...["approach", "entry", "library", "reports", "cabinet"].flatMap((n) =>
    ["", "-small"].map((s) => [
      "plate-" + n + s,
      local + "plates/" + n + s + ".webp",
      "Interpretive plate · " + n,
      "Interpretive " + n + " view",
      illustration,
    ]),
  ),
  [
    "south-front",
    local + "south-front.webp",
    "Survey of the south front",
    "Federal south elevation",
    survey,
  ],
  [
    "southwest-room",
    local + "southwest-room.webp",
    "Survey of the southwest room",
    "West wall of the library",
    survey,
  ],
  [
    "floor-plan",
    local + "survey-plan.webp",
    "First-floor plan",
    "Survey plan showing the library beside the hall",
    "HABS TN-14, printed page 8. https://www.loc.gov/item/tn0036/",
  ],
  [
    "hall-study",
    local + "hall-study.webp",
    "Center hall study",
    "Modeled entry and stair",
    "Original Blender/Cycles architectural interpretation.",
  ],
  [
    "world",
    local + "world.glb",
    "Travellers Rest · detailed",
    "South front, hall, library and custodian",
    "Original model, packed surfaces and photographic portrait rig. See the estate source credits.",
  ],
  [
    "world-low",
    local + "world-low.glb",
    "Travellers Rest · compact",
    "Compact version of the continuous house model",
    "Original Meshopt delivery of the same architectural source.",
  ],
  [
    "custodian",
    local + "custodian.mp4",
    "Judge Overton’s recognition",
    "Animated interpretation of Earl’s portrait",
    archive.plates[0].credit + " " + archive.plates[0].source,
  ],
  [
    "mission-reel",
    "/library/recordings/agentic-mission-control-reel.mp4",
    "Mission Control recording",
    "A research mission and its evidence",
    "Owner project recording.",
  ],
  [
    "mission-poster",
    library + "reel-poster.webp",
    "Mission Control poster",
    "Research mission interface",
    "Owner project recording still.",
  ],
  [
    "mission-study",
    library + "case-study.webp",
    "Mission Control case study",
    "Engineering case study for Mission Control",
    "Owner project exhibit.",
  ],
  [
    "mission-captions",
    local + "mission.vtt",
    "Mission Control captions",
    "English descriptions of the research mission",
    "Original timed visual descriptions.",
  ],
  [
    "royal-palm-reel",
    film + ".mp4",
    "Royal Palm reel",
    "Wellington’s free-kick winner",
    "John Overton, owner match film.",
  ],
  [
    "royal-palm-poster",
    film + ".jpg",
    "Royal Palm poster",
    "The pitch before the free kick",
    "John Overton, still from owner match film.",
  ],
  [
    "royal-palm-captions",
    local + "royal-palm.vtt",
    "Royal Palm captions",
    "English descriptions of the free kick",
    "Original timed visual descriptions.",
  ],
];
// Edition 2: the continuous world. Keys for document scans follow lib/estate/objects.ts.
const narration =
  "Newly written interpretive narration for this visit, spoken by a synthetic voice (" +
  timeline.voice.model +
  ", " +
  timeline.voice.voice +
  "). Not a historical quotation unless the cue names its manuscript.";
const worldAssets = [
  [
    "world-v2",
    local + "world-v2.glb",
    "Travellers Rest · continuous shell",
    "Exterior, entry hall and library shell for the continuous world",
    "Original model. The library interior, volumes, portrait and documents are live objects.",
  ],
  [
    "world-v2-low",
    local + "world-v2-low.glb",
    "Travellers Rest · continuous shell, compact",
    "Compact tier of the continuous shell",
    "Original Meshopt delivery of the same architectural source.",
  ],
  // The Blender-authored furniture kit, once it has been built and packed.
  ...(existsSync("public/travellers-rest/kit.glb") &&
  existsSync("public/travellers-rest/kit-low.glb")
    ? [
        [
          "kit",
          local + "kit.glb",
          "Travellers Rest · furniture kit",
          "Blender-authored furniture and fittings for the library",
          "Original models. See assets/travellers-rest/kit/README.md.",
        ],
        [
          "kit-low",
          local + "kit-low.glb",
          "Travellers Rest · furniture kit, compact",
          "Compact tier of the furniture kit",
          "Original models. See assets/travellers-rest/kit/README.md.",
        ],
      ]
    : []),
  [
    "voice-timeline",
    local + "voice/timeline.json",
    "Custodian · timeline",
    "Word, mouth and gaze timing for each voiced cue",
    narration,
  ],
  ...Object.values(timeline.cues).map((c) => [
    "voice-" + c.id,
    local + "voice/" + c.id + ".mp3",
    "Custodian · " + c.id,
    c.text,
    narration,
  ]),
  ...Object.entries(scans).flatMap(([object, rows]) => {
    const plate = archive.plates.find((p) => p.id === object);
    return rows.flatMap((row) =>
      ["full", "small"].map((size) => [
        "object-" + object + "-p" + row.page + (size === "small" ? "-small" : ""),
        row[size].url,
        plate.title +
          (rows.length > 1 ? " · page " + row.page : "") +
          (size === "small" ? " · room texture" : ""),
        plate.alt,
        plate.credit + " " + plate.source + " " + plate.rights,
      ]),
    );
  }),
  ...jackson.pages.flatMap(page => ["src", "small"].map(size => [
    "letter-" + jackson.id + "-p" + page.n + (size === "small" ? "-small" : ""),
    page[size], jackson.title + " · " + page.label, page.alt, jackson.credit + " " + jackson.rights,
  ])),
  ...letters.letters.flatMap((letter) =>
    letter.pages.flatMap((page) =>
      ["src", "small"].map((size) => [
        "letter-" + letter.id + "-p" + page.n + (size === "small" ? "-small" : ""),
        page[size],
        letter.title +
          ", " +
          letter.dateLabel +
          " · " +
          page.label +
          (size === "small" ? " · room texture" : ""),
        page.alt,
        letter.credit + " " + letter.item + " " + letters.rights.statement,
      ]),
    ),
  ),
];
const formats = {
  ".mp3": ["audio", "audio/mpeg"],
  ".json": ["document", "application/json"],
  ".webp": ["image", "image/webp"],
  ".jpg": ["image", "image/jpeg"],
  ".glb": ["model3d", "model/gltf-binary"],
  ".mp4": ["video", "video/mp4"],
  ".vtt": ["document", "text/vtt"],
};
const describe =
  (edition) =>
  async ([key, localUrl, title, alt, credit]) => {
    const buffer = await readFile("public" + localUrl);
    const hash = checksum(buffer);
    const ext = path.extname(localUrl);
    const [kind, mime] = formats[ext];
    const pathname =
      "travellers-rest/v" + edition + "/" + key + "-" + hash.slice(0, 20) + ext;
    return {
      edition,
      key,
      id: id("media/" + key + "/" + hash),
      localUrl,
      title,
      alt,
      credit,
      bytes: buffer.length,
      sha256: hash,
      kind,
      mime,
      pathname,
      url:
        "https://" +
        store.slice(6).toLowerCase() +
        ".public.blob.vercel-storage.com/" +
        pathname,
    };
  };
const guidedMedia = await Promise.all(assets.map(describe(1)));
const worldMedia = await Promise.all(worldAssets.map(describe(2)));
const media = [...guidedMedia, ...worldMedia];
const byKey = Object.fromEntries(media.map((m) => [m.key, m]));
const timestamp = new Date();
const records = [];
let editionNow = 1;
function add(table, entity, identity, values, unique = {}) {
  records.push({
    table,
    entity,
    identity,
    edition: editionNow,
    values: { id: identity, ...values },
    unique,
  });
}
const mediaRow = (m) =>
  add("media_assets", "media", m.id, {
    kind: m.kind,
    provider: "blob",
    url: m.url,
    blob_pathname: m.pathname,
    mime_type: m.mime,
    bytes: m.bytes,
    title: m.title,
    alt: m.alt,
    caption: m.credit,
    purpose: "travellers-rest/" + m.key,
    tags: ["travellers-rest"],
    checksum: m.sha256,
    updated_at: timestamp,
    ...(m.key === "mission-reel"
      ? { poster_media_id: byKey["mission-poster"].id }
      : m.key === "royal-palm-reel"
        ? { poster_media_id: byKey["royal-palm-poster"].id }
        : {}),
  });
for (const m of [...guidedMedia].sort(
  (a, b) => Number(a.kind === "video") - Number(b.kind === "video"),
))
  mediaRow(m);
for (const [slug, title, kind, anchor] of [
  ["approach", "The south front", "entrance", "camera.approach"],
  ["hall", "The entry hall", "entrance", "camera.entry"],
  ["library", "The southwest library", "reading_room", "camera.library"],
  ["cabinet", "The family cabinet", "computer_station", "screen.cabinet"],
]) {
  add(
    "library_zones",
    "library_zone",
    id("room/" + slug),
    {
      slug: "travellers-rest-" + slug,
      title,
      kind_code: kind,
      scene_node_name: anchor,
      display: "hidden",
    },
    { slug: "travellers-rest-" + slug },
  );
}
add(
  "shelves",
  "shelf",
  id("shelf"),
  {
    slug: "travellers-rest-writing-table",
    zone_id: id("room/library"),
    title: "The writing table",
    scene_node_name: "desk.writing",
    capacity: 2,
  },
  { slug: "travellers-rest-writing-table" },
);
const bookId = id("companion");
add(
  "books",
  "book",
  bookId,
  {
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    page_mode: "authored",
    display: "hidden",
    cover_media_id: byKey["plate-reports"].id,
    updated_at: timestamp,
  },
  { slug: book.slug },
);
for (const [i, leaf] of book.leaves.entries()) {
  const blocks = [
    { component: "Heading", props: { text: leaf.title } },
    ...leaf.paragraphs.map((text) => ({ component: "Prose", props: { text } })),
    ...leaf.sources.map(([text, url]) => ({
      component: "Link",
      props: { text, url },
    })),
  ];
  add(
    "book_pages",
    "book_page",
    id("page/" + leaf.key),
    {
      book_id: bookId,
      position: i + 1,
      template_code: leaf.key,
      blocks: JSON.stringify(blocks),
      updated_at: timestamp,
    },
    { book_id: bookId, position: i + 1 },
  );
}
add(
  "shelf_slots",
  null,
  id("placement"),
  {
    shelf_id: id("shelf"),
    position: 1,
    entity_type: "book",
    entity_id: bookId,
  },
  { shelf_id: id("shelf"), position: 1 },
);
for (const [tier, key] of [
  ["high", "world"],
  ["low", "world-low"],
]) {
  const slug = program.scenes[tier];
  add(
    "scene_assets",
    null,
    id("scene/" + tier),
    {
      slug,
      version: 1,
      media_id: byKey[key].id,
      is_active: false,
      notes:
        "Integrated house, edition 1. Twelve root anchors. Custodian recognition clip.",
    },
    { slug, version: 1 },
  );
}
const props = {
  ...program,
  media: Object.fromEntries(guidedMedia.map((m) => [m.key, m.id])),
};
add(
  "ui_layouts",
  "ui_layout",
  id("program"),
  {
    slug: "travellers-rest-visit",
    title: "Travellers Rest · house program",
    blocks: JSON.stringify([{ component: "HouseProgram", props }]),
    created_by: actor,
    updated_at: timestamp,
  },
  { slug: "travellers-rest-visit" },
);

// Edition 2 rows: new delivery media and the second version of both scene tiers. The
// house program itself is an existing, possibly owner-edited row, so it is upgraded in
// place by upgradeProgram() with its own audit record and revision.
editionNow = 2;
for (const m of worldMedia) mediaRow(m);
for (const [tier, key] of [
  ["high", "world-v2"],
  ["low", "world-v2-low"],
]) {
  const slug = program.scenes[tier];
  add(
    "scene_assets",
    null,
    id("scene/" + tier + "/2"),
    {
      slug,
      version: 2,
      media_id: byKey[key].id,
      is_active: false,
      notes:
        "Continuous world, edition 2. Architectural shell with 24 root anchors. The library interior, volumes, portrait and documents are live objects.",
    },
    { slug, version: 2 },
  );
}
/** The continuous program derived from whatever the house program holds now. Dates,
    cue edits and any placements the owner has made are carried over. */
export function continuousProps(current) {
  return {
    edition: 2,
    companion: current.companion,
    featuredFrom: current.featuredFrom ?? null,
    featuredUntil: current.featuredUntil ?? null,
    scenes: current.scenes,
    cues: current.cues,
    media: {
      ...current.media,
      ...Object.fromEntries(worldMedia.map((m) => [m.key, m.id])),
    },
    portrait: continuous.portrait,
    ...(worldMedia.some((m) => m.key === "kit")
      ? { kit: { high: "kit", low: "kit-low" } }
      : {}),
    voice: {
      timeline: "voice-timeline",
      cues: Object.keys(timeline.cues).map((cue) => ({
        id: cue,
        audio: "voice-" + cue,
      })),
    },
    objects: [
      { id: jackson.id, pages: jackson.pages.map(page => ({ full: "letter-" + jackson.id + "-p" + page.n, small: "letter-" + jackson.id + "-p" + page.n + "-small" })) },
      ...letters.letters.map((letter, i) => ({
        id: i === 0 ? "overton-letter" : letter.id,
        pages: letter.pages.map((p) => ({
          full: "letter-" + letter.id + "-p" + p.n,
          small: "letter-" + letter.id + "-p" + p.n + "-small",
        })),
      })),
      ...Object.entries(scans).map(([object, rows]) => ({
        id: object,
        pages: rows.map((row) => ({
          full: "object-" + object + "-p" + row.page,
          small: "object-" + object + "-p" + row.page + "-small",
        })),
      })),
    ],
    placements: current.placements ?? continuous.placements,
  };
}
/** Upgrade the stored house program to the continuous edition, once, with an audit
    record and a revision. Returns what changed, or null when it is already current. */
export async function upgradeProgram(db, { dryRun = false } = {}) {
  const found = await db.query(
    "select id, blocks from ui_layouts where slug='travellers-rest-visit'" +
      (dryRun ? "" : " for update"),
  );
  if (!found.rowCount) throw Error("The house program has not been seeded.");
  const row = found.rows[0];
  const blocks =
    typeof row.blocks === "string" ? JSON.parse(row.blocks) : row.blocks;
  const current = blocks[0].props;
  const next = continuousProps(current);
  // PostgreSQL stores jsonb with its own key order: compare content, not spelling.
  const canonical = (value) =>
    JSON.stringify(value, (_, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)))
        : v,
    );
  if (canonical(current) === canonical(next)) return null;
  const change = {
    from: current.edition,
    to: 2,
    mediaAdded: Object.keys(next.media).filter((k) => !(k in current.media))
      .length,
    voicedCues: next.voice.cues.length,
    objects: next.objects.length,
  };
  if (dryRun) return change;
  // A released visit must be withdrawn before its edition changes underneath it.
  const live = await db.query(
    "select (select count(*) from scene_assets where slug = any($1) and is_active) + (select count(*) from library_zones where slug like 'travellers-rest-%' and display in ('published','featured')) as n",
    [Object.values(current.scenes)],
  );
  if (Number(live.rows[0].n) && current.edition !== 2)
    throw Error("Withdraw the published visit before changing its edition.");
  await db.query(
    "update ui_layouts set blocks=$1, updated_at=now() where id=$2",
    [JSON.stringify([{ component: "HouseProgram", props: next }]), row.id],
  );
  await db.query(
    "insert into audit_log(id,actor,action,entity_type,entity_id,detail) values(gen_random_uuid(),$1,'estate.program.edition','ui_layout',$2,$3)",
    [actor, row.id, JSON.stringify(change)],
  );
  await db.query(
    "insert into revisions(id,entity_type,entity_id,version,author,message,snapshot) select gen_random_uuid(),'ui_layout',$1,coalesce((select max(version) from revisions where entity_type='ui_layout' and entity_id=$1),0)+1,$2,'Travellers Rest continuous edition',to_jsonb(t) from ui_layouts t where id=$1",
    [row.id, actor],
  );
  return change;
}

/** When the shell has been rebuilt, point the stored edition 2 scene versions at the
    new delivery files. Only while the visit is withdrawn: a released scene is never
    changed underneath its visitors. Returns the tiers that changed. */
export async function repointScenes(db, { dryRun = false } = {}) {
  const changed = [];
  for (const [tier, key] of [
    ["high", "world-v2"],
    ["low", "world-v2-low"],
  ]) {
    const slug = program.scenes[tier];
    const found = await db.query(
      "select id, media_id, is_active from scene_assets where slug=$1 and version=2",
      [slug],
    );
    if (!found.rowCount || found.rows[0].media_id === byKey[key].id) continue;
    if (found.rows[0].is_active)
      throw Error("Withdraw the published visit before replacing its scene.");
    changed.push(tier);
    if (dryRun) continue;
    await db.query("update scene_assets set media_id=$1 where id=$2", [
      byKey[key].id,
      found.rows[0].id,
    ]);
    await db.query(
      "insert into audit_log(id,actor,action,entity_type,entity_id,detail) values(gen_random_uuid(),$1,'estate.scene.media',null,$2,$3)",
      [
        actor,
        found.rows[0].id,
        JSON.stringify({ slug, version: 2, from: found.rows[0].media_id, to: byKey[key].id }),
      ],
    );
  }
  return changed;
}

export async function insertRecord(db, r) {
  const keys = Object.keys(r.values);
  await db.query(
    "insert into " +
      r.table +
      " (" +
      keys.join(",") +
      ") values (" +
      keys.map((_, i) => "$" + (i + 1)).join(",") +
      ")",
    Object.values(r.values),
  );
  await db.query(
    "insert into audit_log(id,actor,action,entity_type,entity_id,detail) values(gen_random_uuid(),$1,'estate.seed',$2,$3,$4)",
    [
      actor,
      r.entity,
      r.identity,
      JSON.stringify({ table: r.table, edition: r.edition ?? 1 }),
    ],
  );
  if (r.entity)
    await db.query(
      "insert into revisions(id,entity_type,entity_id,version,author,message,snapshot) select gen_random_uuid(),$1,$2,1,$3,'Travellers Rest draft edition',to_jsonb(t) from " +
        r.table +
        " t where id=$2",
      [r.entity, r.identity, actor],
    );
}

export { actor, media, records, starter, store, checksum };
