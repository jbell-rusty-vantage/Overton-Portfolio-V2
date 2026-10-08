// Pure MDX parsing / image-reference rewriting for blog post ingestion.
// No database or Blob access here (see lib/post-ingest.ts), so it is easy to test.
import matter from "gray-matter";
import { slugify } from "./slug";

export const POST_DISPLAY_STATES = ["hidden", "unlisted", "published", "featured"] as const;
export type PostDisplay = (typeof POST_DISPLAY_STATES)[number];

export type ParsedPost = {
  /** Frontmatter as plain JSON (dates as ISO strings). */
  frontmatter: Record<string, unknown>;
  /** MDX body without frontmatter. */
  body: string;
  title: string;
  slug: string;
  excerpt: string | null;
  /** null = key absent (keep existing). */
  tags: string[] | null;
  seriesSlug: string | null;
  seriesTitle: string | null;
  /** null = key absent (keep existing links). */
  projectSlugs: string[] | null;
  /** null = key absent (keep existing / default hidden). */
  display: PostDisplay | null;
  publishedAt: Date | null;
  canonicalUrl: string | null;
  cover: string | null;
  readingMinutes: number;
};

const forbidden = () => {
  throw new Error("Only YAML/JSON frontmatter is supported");
};

/** gray-matter caches by content unless options are passed; we always pass them. */
function parseMatter(source: string) {
  return matter(source, { engines: { javascript: forbidden, js: forbidden, coffee: forbidden } });
}

const asString = (v: unknown): string | null => {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  return null;
};

const asList = (v: unknown): string[] | null => {
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return null;
};

const asDate = (v: unknown): Date | null => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export function countWords(body: string): number {
  const text = body
    .replace(/^\s*(import|export)\s.*$/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~[\]()!|-]/g, " ");
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function parsePostSource(source: string): ParsedPost {
  const file = parseMatter(source);
  const data = (file.data ?? {}) as Record<string, unknown>;
  const body = file.content;

  const heading = /^#\s+(.+?)\s*#*\s*$/m.exec(stripCode(body))?.[1]?.trim() ?? null;
  const title = asString(data.title) ?? heading;
  if (!title) throw new Error("The MDX needs a `title` in frontmatter or a `# Heading`.");

  const slug = slugify(asString(data.slug) ?? title);
  if (!slug) throw new Error("Could not derive a slug from the title.");

  let seriesSlug: string | null = null;
  let seriesTitle: string | null = null;
  if (data.series && typeof data.series === "object" && !Array.isArray(data.series)) {
    const s = data.series as Record<string, unknown>;
    seriesTitle = asString(s.title);
    seriesSlug = asString(s.slug) ? slugify(asString(s.slug)!) : seriesTitle ? slugify(seriesTitle) : null;
  } else if (asString(data.series)) {
    seriesSlug = slugify(asString(data.series)!);
    seriesTitle = asString(data.seriesTitle);
  }

  const displayRaw = asString(data.display)?.toLowerCase() ?? null;
  const display =
    displayRaw && (POST_DISPLAY_STATES as readonly string[]).includes(displayRaw) ? (displayRaw as PostDisplay) : null;
  if (displayRaw && !display) {
    throw new Error(`Unknown display "${displayRaw}" (use ${POST_DISPLAY_STATES.join(" | ")}).`);
  }

  return {
    frontmatter: JSON.parse(JSON.stringify(data)) as Record<string, unknown>,
    body,
    title,
    slug,
    excerpt: asString(data.excerpt) ?? asString(data.description) ?? asString(data.summary),
    tags: asList(data.tags),
    seriesSlug,
    seriesTitle,
    projectSlugs: asList(data.projects ?? data.project)?.map((s) => slugify(s)) ?? null,
    display,
    publishedAt: asDate(data.publishedAt ?? data.published_at ?? data.date),
    canonicalUrl: asString(data.canonicalUrl ?? data.canonical_url ?? data.canonical),
    cover: asString(data.cover ?? data.coverImage ?? data.image),
    readingMinutes: Math.max(1, Math.ceil(countWords(body) / 220)),
  };
}

// --- local image references --------------------------------------------------

/** True for paths that point at a file next to the MDX (not URLs, site-absolute paths or anchors). */
export function isLocalRef(ref: string): boolean {
  const r = ref.trim();
  if (!r) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(r)) return false; // http:, https:, data:, mailto:, blob:
  if (r.startsWith("//") || r.startsWith("/") || r.startsWith("#") || r.startsWith("{")) return false;
  return true;
}

/** "./img/a%20b.png?x" -> "a b.png" */
export function refBasename(ref: string): string {
  const clean = ref.split(/[?#]/)[0];
  const base = clean.split(/[\\/]/).pop() ?? clean;
  try {
    return decodeURIComponent(base);
  } catch {
    return base;
  }
}

// ![alt](path "title") or ![alt](<path with spaces>)
const MD_IMAGE = /(!\[[^\]]*\]\(\s*)(<[^>]+>|[^)\s]+)((?:\s+(?:"[^"]*"|'[^']*'))?\s*\))/g;
// src="..." / src='...' / src={"..."} / src={'...'} (JSX/HTML)
const JSX_SRC = /(\bsrc\s*=\s*\{?\s*)(["'])([^"'\n]+)\2(\s*\}?)/g;
// [id]: ./path  (reference-style definitions)
const MD_REF_DEF = /^(\s{0,3}\[[^\]]+\]:\s*)(<[^>]+>|\S+)/gm;

/** Split into [text, code, text, code, ...] so fenced code blocks are left untouched. */
function splitFences(src: string): { text: string; code: boolean }[] {
  const out: { text: string; code: boolean }[] = [];
  const lines = src.split(/(?<=\n)/); // keep line endings
  let buf = "";
  let fence: { ch: string; len: number } | null = null;
  const flush = (code: boolean) => {
    if (buf) out.push({ text: buf, code });
    buf = "";
  };
  for (const line of lines) {
    if (!fence) {
      const open = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (open) {
        flush(false);
        fence = { ch: open[1][0], len: open[1].length };
      }
      buf += line;
    } else {
      buf += line;
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*\r?\n?$/.exec(line);
      if (close && close[1][0] === fence.ch && close[1].length >= fence.len) {
        flush(true);
        fence = null;
      }
    }
  }
  flush(fence !== null);
  return out;
}

function stripCode(src: string): string {
  return splitFences(src)
    .filter((p) => !p.code)
    .map((p) => p.text)
    .join("\n");
}

const unwrap = (p: string) => (p.startsWith("<") && p.endsWith(">") ? p.slice(1, -1) : p);

/** Unique local image references in document order (as written, e.g. "./diagram.png"). */
export function findLocalImageRefs(mdx: string): string[] {
  const found = new Set<string>();
  for (const part of splitFences(mdx)) {
    if (part.code) continue;
    for (const m of part.text.matchAll(MD_IMAGE)) {
      const ref = unwrap(m[2]);
      if (isLocalRef(ref)) found.add(ref);
    }
    for (const m of part.text.matchAll(JSX_SRC)) {
      if (isLocalRef(m[3])) found.add(m[3]);
    }
    for (const m of part.text.matchAll(MD_REF_DEF)) {
      const ref = unwrap(m[2]);
      if (isLocalRef(ref) && /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(ref.split(/[?#]/)[0])) found.add(ref);
    }
  }
  return [...found];
}

/** Replace local references (keys exactly as returned by findLocalImageRefs) with URLs. */
export function rewriteLocalRefs(mdx: string, map: Map<string, string>): string {
  if (map.size === 0) return mdx;
  return splitFences(mdx)
    .map((part) => {
      if (part.code) return part.text;
      return part.text
        .replace(MD_IMAGE, (all, pre: string, path: string, post: string) => {
          const url = map.get(unwrap(path));
          return url ? `${pre}${path.startsWith("<") ? `<${url}>` : url}${post}` : all;
        })
        .replace(JSX_SRC, (all, pre: string, q: string, path: string, post: string) => {
          const url = map.get(path);
          return url ? `${pre}${q}${url}${q}${post}` : all;
        })
        .replace(MD_REF_DEF, (all, pre: string, path: string) => {
          const url = map.get(unwrap(path));
          return url ? `${pre}${url}` : all;
        });
    })
    .join("");
}
