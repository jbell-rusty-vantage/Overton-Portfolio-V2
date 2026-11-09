import { z } from "zod";
import { bundledArtwork } from "./artwork";
export type Visibility = {
  display: string;
  deletedAt?: Date | null;
  publishedAt?: Date | null;
};
export function readable(
  row: Visibility,
  direct: boolean,
  preview = false,
  now = Date.now(),
) {
  if (row.deletedAt || (row.publishedAt && row.publishedAt.valueOf() > now))
    return false;
  return (
    preview ||
    row.display === "published" ||
    row.display === "featured" ||
    (direct && row.display === "unlisted")
  );
}
export function httpsUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function publicMedia(value: unknown) {
  const url = httpsUrl(value);
  return url &&
    new URL(url).hostname.endsWith(".public.blob.vercel-storage.com")
    ? url
    : undefined;
}
export const publicImage = (value: unknown) => bundledArtwork(value) ?? publicMedia(value);
const contentBlock = z
  .object({
    component: z.enum([
      "Prose",
      "Architecture",
      "Metric",
      "Timeline",
      "Code",
      "Link",
      "Image",
    ]),
    props: z
      .object({
        text: z.string().max(16000).optional(),
        code: z.string().max(16000).optional(),
        label: z.string().max(200).optional(),
        alt: z.string().max(1000).optional(),
        url: z.string().max(2048).optional(),
      })
      .strict(),
  })
  .strict();
export function blocksFrom(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 64).flatMap(
    (
      raw,
    ): {
      kind: "text" | "code" | "link" | "image";
      text: string;
      url?: string;
    }[] => {
      const parsed = contentBlock.safeParse(raw);
      if (!parsed.success) return [];
      const b = parsed.data;
      const text = b.props.text ?? b.props.code ?? b.props.label ?? b.props.alt;
      if (typeof text !== "string" || !text.trim() || text.length > 16000)
        return [];
      if (["Prose", "Architecture", "Metric", "Timeline"].includes(b.component))
        return [{ kind: "text", text }];
      if (b.component === "Code") return [{ kind: "code", text }];
      const url =
        b.component === "Image"
          ? publicImage(b.props.url)
          : httpsUrl(b.props.url);
      if (url && b.component === "Link") return [{ kind: "link", text, url }];
      if (url && b.component === "Image") return [{ kind: "image", text, url }];
      return [];
    },
  );
}
export const templateNames: Record<string, string> = {
  cover: "Title page",
  overview: "Overview",
  architecture: "Architecture",
  timeline: "Timeline",
  gallery: "Gallery",
  code: "Code",
  metrics: "Measurements",
  links: "Sources",
};

/** Render the prose and code of uploaded MDX without evaluating JSX, imports or frontmatter. */
export function safeManuscript(source: string) {
  const text = source
    .slice(0, 96000)
    .replace(/^---[^\n]*\n[\s\S]*?\n---[^\n]*\n/, "");
  const out: { kind: "code" | "text"; text: string }[] = [];
  for (const [index, chunk] of text.split(/^```[^\n]*$/m).entries()) {
    if (index % 2) {
      if (chunk.trim()) out.push({ kind: "code", text: chunk.trim() });
      continue;
    }
    const prose = chunk
      .split(/\r?\n/)
      .filter((line) => !/^\s*(import |export |<|[{}])/.test(line))
      .join("\n");
    for (const p of prose.split(/\n\s*\n/)) {
      const value = p.replace(/^#{1,6}\s+/gm, "").trim();
      if (value) out.push({ kind: "text", text: value });
    }
  }
  return out.slice(0, 64);
}
