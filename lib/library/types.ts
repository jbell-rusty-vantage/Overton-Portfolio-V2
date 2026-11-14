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
export type Collection = {
  // Database collections expose enabled categories and owner-edited shelf titles.
  shelfTitles?: Record<string, string>;
  source: "fixtures" | "database" | "review" | "unavailable";
  volumes: Volume[];
  zones: string[];
};
export type ReadingScope = boolean | "samples";
