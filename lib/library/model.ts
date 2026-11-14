import manifest from "@/assets/library/manifest.json";

export const { zones, shelves, screens: screenAnchors } = manifest;
export type Zone = (typeof zones)[number];
export type Shelf = (typeof shelves)[number];
export type VolumeKind =
  "Project" | "Journal" | "Favorite" | "Evolution" | "Book";
export type Block = {
  kind: "text" | "heading" | "metric" | "code" | "link" | "image" | "video";
  /** Name of a measurement; its value is in text. */
  label?: string;
  text: string;
  url?: string;
  /** Still frame shown before a video plays. */
  poster?: string;
  /** Optional authored WebVTT captions and transcript, validated before projection. */
  captions?: string;
  transcript?: string;
  /** Keep a detailed image on a page of its own in the physical book. */
  ownPage?: boolean;
  /** Optional full-detail image opened from a simplified reading figure. */
  detail?: string;
};
export type Leaf = { key: string; title: string; blocks: Block[] };
export type Volume = {
  slug: string;
  projectSlug?: string;
  clientLabel?: string;
  indexable?: boolean;
  title: string;
  summary: string;
  kind: VolumeKind;
  tags: string[];
  shelf: string | null;
  position: number;
  plate: number;
  pages: Leaf[];
  cover?: string;
  featured?: boolean;
  /** Authored project metadata only; absent values are never invented by the report. */
  status?: string;
  role?: string;
  startedOn?: string;
  endedOn?: string;
};
export type Screen = {
  slot: string;
  mode: string;
  title: string;
  lines: string[];
  url?: string;
};
export type CameraPreset = { eye: number[]; target: number[] };
export type Collection = {
  // Database collections list only shelves that match enabled scene anchors.
  shelfTitles?: Record<string, string>;
  cameras?: Record<string, CameraPreset>;
  source: "fixtures" | "database" | "review" | "unavailable";
  volumes: Volume[];
  zones: string[];
  screens: Screen[];
  sceneUrl: string;
};
export function collectionShelves(data: Collection) {
  const titles = data.shelfTitles;
  return shelves.filter((s) => data.zones.includes(s.zone) && (!titles || Object.hasOwn(titles, s.slug)))
    .map((s) => ({ ...s, title: titles?.[s.slug] ?? s.title }));
}
export function matchesCatalog(volume: Volume, query: string, shelfTitle?: string) {
  const term = query.trim().toLowerCase();
  return [volume.title, volume.summary, ...volume.tags, shelfTitle ?? ""]
    .some((s) => s.toLowerCase().includes(term));
}
export function zoneFor(book: Volume) {
  return shelves.find((s) => s.slug === book.shelf)?.zone ?? "entrance";
}
export function sceneHref(
  zone = "entrance",
  shelf?: string | null,
  book?: string,
  kind?: VolumeKind,
) {
  const q = new URLSearchParams({ view: "world", zone });
  if (shelf) q.set("shelf", shelf);
  if (book) q.set("book", book);
  if (kind) q.set("kind", kind);
  return "/library?" + q;
}
export function detailHref(v: Volume) {
  return (
    "/" +
    {
      Project: "projects",
      Journal: "blog",
      Favorite: "favorites",
      Evolution: "evolution",
      Book: "books",
    }[v.kind] +
    "/" +
    encodeURIComponent(v.projectSlug ?? v.slug)
  );
}

export type ReadingScope = boolean | "samples";
export function withinPreview(path: string, admin: ReadingScope = false) {
  if (!admin) return path;
  if (admin === "samples") {
    if (path === "/projects" || path === "/") return "/samples?catalog=1";
    if (/^\/(projects|books|blog|favorites|evolution)\//.test(path)) return "/samples?read=" + encodeURIComponent(decodeURIComponent(path.split("/").at(-1)!));
    return "/samples" + path.replace(/^\/library/, "");
  }
  if (path === "/projects" || path === "/") return "/admin/preview/portfolio";
  if (/^\/(projects|books|blog|favorites|evolution)\//.test(path)) return "/admin/preview" + path;
  if (/^\/library(?:[?#]|$)/.test(path)) return "/admin/preview/library" + path.slice(8);
  if (path.startsWith("/?")) return "/admin/preview/library" + path.slice(1);
  return path;
}
