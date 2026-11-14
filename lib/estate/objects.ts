/* The held collection as room objects. Catalogue text, credits and rights come from the
   curatorial files; image locations are resolved by the caller so the visitor route
   only ever receives approved delivery URLs. */
import catalog from "@/assets/travellers-rest/archive/catalog.json";
import letters from "@/assets/travellers-rest/archive/letters.json";
import scans from "@/assets/travellers-rest/archive/world-files.json";
import jackson from "@/assets/travellers-rest/archive/jackson-letter.json";
import type { ObjectPage, Place, RoomObject } from "./world";

/** Stable catalogue ID of the 1832 letter and the Library of Congress item behind it. */
export const featuredLetter = { id: "overton-letter", item: "maj012882" };

const placement: Record<
  string,
  { form: RoomObject["form"]; home: Place; rest: string; pages?: string[] }
> = {
  "tennessee-map": { form: "sheet", home: "map", rest: "table.map" },
  "election-invitation": {
    form: "sheet",
    home: "drawers",
    rest: "drawer.campaign",
  },
  "andrew-jackson": { form: "sheet", home: "entry", rest: "wall.jackson" },
  "murfree-leeper": {
    form: "sheet",
    home: "desk",
    rest: "desk.casebook",
    pages: ["Page 1 · 1 Tenn. 1", "Page 2 · the decision concluded"],
  },
};
const cards = ["first-residents", "william-franklin", "mary-overton"];

/** Every local delivery file an object needs, for the importer and the resolver. */
export function objectFiles() {
  const files: { key: string; url: string; title: string; credit: string }[] =
    [];
  for (const [id, rows] of Object.entries(scans)) {
    const plate = catalog.plates.find((p) => p.id === id)!;
    for (const row of rows)
      for (const size of ["full", "small"] as const)
        files.push({
          key:
            "object-" +
            id +
            "-p" +
            row.page +
            (size === "small" ? "-small" : ""),
          url: row[size].url,
          title:
            plate.title +
            (rows.length > 1 ? " · page " + row.page : "") +
            (size === "small" ? " · room texture" : ""),
          credit: plate.credit + " " + plate.source + " " + plate.rights,
        });
  }
  for (const letter of letters.letters)
    for (const page of letter.pages)
      for (const size of ["src", "small"] as const)
        files.push({
          key:
            "letter-" +
            letter.id +
            "-p" +
            page.n +
            (size === "small" ? "-small" : ""),
          url: page[size],
          title:
            letter.title +
            ", " +
            letter.dateLabel +
            " · " +
            page.label +
            (size === "small" ? " · room texture" : ""),
          credit:
            letter.credit + " " + letter.item + " " + letters.rights.statement,
        });
  for (const page of jackson.pages)
    for (const size of ["src", "small"] as const) files.push({
      key: "letter-" + jackson.id + "-p" + page.n + (size === "small" ? "-small" : ""),
      url: page[size], title: jackson.title + " · " + page.label,
      credit: jackson.credit + " " + jackson.rights,
    });
  return files;
}

export function roomObjects(
  resolve: (localUrl: string) => string | undefined,
): RoomObject[] {
  const out: RoomObject[] = [];
  letters.letters.forEach((letter, index) => {
    const pages: ObjectPage[] = letter.pages.flatMap((p) => {
      const src = resolve(p.src);
      if (!src) return [];
      return [
        {
          src,
          small: resolve(p.small),
          width: p.srcWidth,
          height: p.srcHeight,
          label: p.label,
          alt: p.alt,
          kind: p.kind,
          confidence: p.confidence,
          transcript: p.transcript,
        },
      ];
    });
    if (!pages.length) return;
    const featured = index === 0;
    out.push({
      id: featured ? featuredLetter.id : letter.id,
      title: letter.title,
      date: letter.dateLabel,
      maker: letter.author,
      form: "sheet",
      home: featured ? "desk" : "drawers",
      rest: featured ? "desk.letter" : "drawer.correspondence",
      caption:
        letter.author +
        " to " +
        letter.recipient +
        (letter.place ? ", written from " + letter.place : "") +
        ". " +
        letter.pages.length +
        " digitized images.",
      summary: letter.summary,
      credit: letter.credit,
      rights: letters.rights.statement,
      rightsSource: letters.rights.source,
      links: [
        { label: "Library of Congress item record", url: letter.item },
        { label: "Complete digitized sequence", url: letter.resource },
        ...(letter.edition.url
          ? [{ label: "Published edition", url: letter.edition.url }]
          : []),
      ],
      pages,
      transcriptNote: [
        letter.edition.citation,
        letter.edition.note,
        letter.catalogNote,
      ]
        .filter(Boolean)
        .join(" "),
    });
  });
  for (const plate of catalog.plates) {
    const place = placement[plate.id];
    const rows = (scans as Record<string, (typeof scans)["tennessee-map"]>)[
      plate.id
    ];
    if (!place || !rows) continue;
    const pages: ObjectPage[] = rows.flatMap((row) => {
      const src = resolve(row.full.url);
      if (!src) return [];
      return [
        {
          src,
          small: resolve(row.small.url),
          width: row.full.pixels[0],
          height: row.full.pixels[1],
          label: place.pages?.[row.page - 1] ?? plate.title,
          alt: plate.alt,
        },
      ];
    });
    if (!pages.length) continue;
    out.push({
      id: plate.id,
      title: plate.title,
      date: plate.date,
      maker: plate.maker,
      form: place.form,
      home: place.home,
      rest: place.rest,
      caption: plate.caption,
      credit: plate.credit,
      rights: plate.rights,
      rightsSource: plate.rightsSource,
      links: [
        { label: "Collection record", url: plate.source },
        { label: "Context", url: plate.context },
      ],
      pages,
    });
  }
  for (const id of cards) {
    const ref = catalog.references.find((r) => r.id === id);
    if (!ref) continue;
    out.push({
      id,
      title: ref.title,
      date: "Museum record",
      maker: ref.location,
      form: "card",
      home: "desk",
      rest: "desk.records",
      caption: ref.caption,
      summary: ref.use,
      links: [
        {
          label: "related" in ref ? "William’s record" : "Museum record",
          url: ref.source,
        },
        ...("related" in ref && ref.related
          ? [{ label: "Franklin’s record", url: ref.related }]
          : []),
      ],
      pages: [],
    });
  }
  const jacksonPages: ObjectPage[] = jackson.pages.flatMap((page) => {
    const src = resolve(page.src);
    return src ? [{ src, small: resolve(page.small), width: page.width, height: page.height, label: page.label, alt: page.alt, transcript: page.transcript, confidence: page.confidence }] : [];
  });
  // Never present an incomplete letter as a complete sequence.
  if (jacksonPages.length === jackson.pages.length) out.push({
    id: jackson.id, title: jackson.title, date: jackson.date, maker: "Andrew Jackson",
    form: "sheet", home: "drawers", rest: "drawer.correspondence",
    caption: "Washington to Travellers Rest: six manuscript pages, the addressed outer panel and a later storage envelope.",
    summary: "Modern commentary: Jackson discusses Texas, the Bank of the United States, Eaton and his grief after Rachel Jackson’s death. The letter also argues for forcing Cherokee and Creek people west of the Mississippi; it records that policy rather than endorsing it.",
    credit: jackson.credit, rights: jackson.rights, rightsSource: jackson.rightsSource,
    transcriptNote: jackson.transcriptNote,
    links: [{ label: "Tennessee State Library & Archives record", url: jackson.item }, { label: "Complete digitized sequence", url: jackson.manifest }, { label: "Archive’s typed transcript (compare the manuscript readings)", url: jackson.transcriptSource }],
    pages: jacksonPages,
  });
  return out;
}
