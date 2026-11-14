/* The continuous visit, described as data: where a visitor can stand, what can be
   held, and how a location hash maps to one coherent room state. Shared by the
   renderer, the DOM reading surfaces, the tests and the release validation. */
import anchors from "@/assets/travellers-rest/anchors-v2.json";

export const anchor = anchors as Record<string, number[]>;

export type Place =
  | "approach"
  | "entry"
  | "library"
  | "portrait"
  | "desk"
  | "cabinet"
  | "reports"
  | "drawers"
  | "map"
  | "screen";
export const places: Record<
  Place,
  { title: string; note: string; eye: number[]; look: number[] }
> = {
  approach: {
    title: "The south front",
    note: "The walk to the portico.",
    eye: anchor["camera.approach"],
    look: [0, 2.6, 0],
  },
  entry: {
    title: "The entry hall",
    note: "The stair, the map table and the library door.",
    eye: anchor["camera.entry"],
    look: [0, 1.76, -2],
  },
  library: {
    title: "The judge’s library",
    note: "The southwest room, from its doorway.",
    eye: anchor["camera.library"],
    look: [-7.4, 2.25, 0.1],
  },
  portrait: {
    title: "The portrait",
    note: "Judge Overton above the mantel.",
    eye: anchor["camera.portrait"],
    look: [-7.69, 2.72, 0],
  },
  desk: {
    title: "The writing table",
    note: "The 1832 letter, the house book and the reports.",
    eye: anchor["camera.desk"],
    look: [-4.95, 1.36, 0.72],
  },
  cabinet: {
    title: "The family cabinet",
    note: "John’s project volumes, viewing folio and soccer highlights.",
    eye: anchor["camera.cabinet"],
    look: [-7.5, 1.86, 2.1],
  },
  reports: {
    title: "The law shelves",
    note: "The Tennessee Reports among the law books.",
    eye: anchor["camera.reports"],
    look: [-7.5, 1.8, -2.13],
  },
  drawers: {
    title: "The correspondence chest",
    note: "Letters and the 1828 invitation.",
    eye: anchor["camera.drawers"],
    look: [-2.95, 1.0, -2.5],
  },
  map: {
    title: "The map table",
    note: "Tennessee in 1795, in the entry hall.",
    eye: anchor["camera.map"],
    look: [1.49, 1.41, -0.38],
  },
  screen: {
    title: "The viewing folio",
    note: "Project recordings and the complete soccer collection.",
    eye: [-6.42, 1.7, 2.53],
    look: [-7.375, 1.64, 2.53],
  },
};
/** Stops a visitor can choose by name. The screen is reached by opening it. */
export const placeOrder: Place[] = (Object.keys(places) as Place[]).filter(
  (p) => p !== "screen",
);

export type Focus =
  | { kind: "book"; slug: string; leaf?: string; page?: number }
  | { kind: "object"; id: string; page?: number }
  | { kind: "screen"; slot: ScreenSlot; clip?: string }
  | null;
export type ScreenSlot = "main" | "side" | "film" | "soccer";
export type Route = { place: Place; focus: Focus; report?: { section: string }; landing?: true };

export const companionSlug = "travellers-rest-house-book";
const safe = (s: string) => /^[a-z0-9][a-z0-9-]{0,90}$/.test(s);

/** A hash that belongs to the world. `null` leaves the entrance or a legacy page. */
export function parseRoute(
  hash: string,
  home: (focus: NonNullable<Focus>) => Place,
  leaves: string[] = [],
): Route | null {
  const [head, a, b, c, d] = hash.replace(/^#/, "").split("/");
  if (head === "walk") return { place: "approach", focus: null };
  if (head === "landing") return { place: "entry", focus: null, landing: true };
  if (head === "collection") return { place: "desk", focus: null };
  if (placeOrder.includes(head as Place) && head !== "approach")
    return { place: head as Place, focus: null };
  const legacy = /^leaf-(\d+)$/.exec(head);
  if (legacy) {
    const focus: Focus = {
      kind: "book",
      slug: companionSlug,
      leaf: leaves[Number(legacy[1]) - 1],
    };
    return { place: home(focus), focus };
  }
  if (head === "report" && a && safe(a) && (!b || safe(b)) && (!c || safe(c))) {
    const page = Number(d);
    const focus: Focus = { kind: "book", slug: a,
      leaf: c && (c !== "front" || page > 1) ? c : undefined,
      page: Number.isInteger(page) && page > 1 ? page : undefined };
    return { place: home(focus), focus, report: { section: b || "overview" } };
  }
  if (head === "book" && a && safe(a)) {
    const page = Number(c);
    const focus: Focus = {
      kind: "book",
      slug: a,
      leaf: b && safe(b) ? b : undefined,
      page: Number.isInteger(page) && page > 0 ? page : undefined,
    };
    return { place: home(focus), focus };
  }
  if (head === "object" && a && safe(a)) {
    const page = Number(b);
    const focus: Focus = {
      kind: "object",
      id: a,
      page: Number.isInteger(page) && page > 0 ? page : undefined,
    };
    return { place: home(focus), focus };
  }
  if (head === "screen")
    return {
      place: "screen",
      focus: {
        kind: "screen",
        slot: a === "side" || a === "film" || a === "soccer" ? a : "main",
        ...(b && safe(b) ? { clip: b } : {}),
      },
    };
  return null;
}
export function formatRoute(route: Route) {
  const f = route.focus;
  if (route.landing && !f) return "#landing";
  if (!f) return "#" + (route.place === "approach" ? "walk" : route.place);
  if (f.kind === "book" && route.report)
    return "#report/" + f.slug + "/" + route.report.section + "/" + (f.leaf || "front") + "/" + (f.page || 1);
  if (f.kind === "book")
    return (
      "#book/" +
      f.slug +
      (f.leaf ? "/" + f.leaf + (f.page && f.page > 1 ? "/" + f.page : "") : "")
    );
  if (f.kind === "object")
    return "#object/" + f.id + (f.page && f.page > 1 ? "/" + f.page : "");
  return "#screen/" + f.slot + (f.clip ? "/" + f.clip : "");
}

/** Things a visitor can lift and inspect. Images are optional: museum records whose
    reuse terms are unresolved stay as source-linked cards. */
export type ObjectPage = {
  src?: string;
  small?: string;
  width?: number;
  height?: number;
  label: string;
  alt: string;
  kind?: string;
  confidence?: string;
  transcript?: { y0: number; y1: number; text: string }[];
};
export type RoomObject = {
  id: string;
  title: string;
  date: string;
  maker: string;
  form: "sheet" | "card" | "volume";
  home: Place;
  rest: string;
  caption: string;
  summary?: string;
  credit?: string;
  rights?: string;
  rightsSource?: string;
  links: { label: string; url: string }[];
  pages: ObjectPage[];
  transcriptNote?: string;
};

/** Timed cue data for the custodian's voice. Playback time is the only clock. */
export type CueId = string;
export type Cue = {
  id: CueId;
  text: string;
  /** Seconds. Zero for a cue that has not been voiced. */
  duration: number;
  /** [start, end, word] in seconds. */
  words: [number, number, string][];
  /** Jaw opening and lip spread, one digit 0–9 per 1/30 s. */
  open: string;
  wide: string;
  /** Where the sitter's gaze goes: [seconds, target]. */
  gaze: [number, string][];
};
export type Voice = {
  cues: Record<CueId, Cue & { audio?: string }>;
  note: string;
};
export const projectCue = (slug: string) => "project-" + slug;
export const objectCue = (id: string) => "object-" + id;

export function captionLines(cue: Cue, max = 64) {
  const lines: { start: number; end: number; text: string }[] = [];
  let current: (typeof lines)[number] | null = null;
  for (const [start, end, word] of cue.words) {
    if (
      !current ||
      current.text.length + word.length + 1 > max ||
      /[.!?]$/.test(current.text)
    ) {
      current = { start, end, text: word };
      lines.push(current);
    } else {
      current.text += " " + word;
      current.end = end;
    }
  }
  if (!lines.length && cue.text)
    lines.push({ start: 0, end: Math.max(cue.duration, 1), text: cue.text });
  return lines;
}

/** Where each project volume stands in this house. Shelf names come from the
    collection; the placement itself is scoped to the family cabinet. */
export type HouseSlot = { shelf: string; title: string; row: number };
export const houseShelves: HouseSlot[] = [
  { shelf: "stacks-ai-agents", title: "AI & Agent Systems", row: 0 },
  { shelf: "stacks-data-knowledge", title: "Data & Knowledge Graphs", row: 0 },
  { shelf: "stacks-web-apps", title: "Web Applications", row: 1 },
  { shelf: "stacks-client-work", title: "Client Work", row: 1 },
];
export const cabinetCapacity = 22;
