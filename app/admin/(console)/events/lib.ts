import "server-only";
import type { DatePrecision, DisplayState, Prisma, SignalSource, SignalVisibility, TimelineNodeKind } from "@/lib/db";
import { str } from "@/lib/admin/form";
import { slugify } from "@/lib/slug";

export const SIGNAL_SOURCES = ["github", "vercel", "admin", "system", "agent"] as const satisfies readonly SignalSource[];
export const SIGNAL_VISIBILITIES = ["public", "private", "redacted"] as const satisfies readonly SignalVisibility[];
export const NODE_KINDS = [
  "milestone",
  "release",
  "progress",
  "reflection",
  "learning",
  "event",
] as const satisfies readonly TimelineNodeKind[];
export const PRECISIONS = ["day", "month", "year"] as const satisfies readonly DatePrecision[];
export const SCENE_EFFECTS = ["glow_shelf", "ring_bell", "open_book", "flash_screen"] as const;
export const EXPIRY_PRESETS = [
  { value: "none", label: "Never" },
  { value: "1", label: "In 1 day" },
  { value: "7", label: "In 7 days" },
  { value: "30", label: "In 30 days" },
  { value: "custom", label: "Custom (below)" },
] as const;

/** Parse a datetime-local value posted by <DateTimeInput> (local time + `<key>.tz` offset). */
export function localDateTime(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
  if (!m) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const tz = Number(str(fd, `${key}.tz`) ?? "0");
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
  return new Date(utc + (Number.isFinite(tz) ? tz : 0) * 60_000);
}

/** Published/featured rows get a first-published timestamp. */
export function publishedAtFor(display: DisplayState, current: Date | null = null): Date | null {
  if (current) return current;
  return display === "published" || display === "featured" ? new Date() : null;
}

/** A timeline_nodes slug derived from the title that is not taken yet. */
export async function uniqueNodeSlug(tx: Prisma.TransactionClient, title: string): Promise<string> {
  const base = slugify(title) || "moment";
  const taken = new Set(
    (await tx.timelineNode.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((n) => n.slug),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const s = `${base}-${i}`;
    if (!taken.has(s)) return s;
  }
}

/** Append a moment to the end of each timeline (position = max + 1); skips timelines it is already on. */
export async function appendToTimelines(tx: Prisma.TransactionClient, nodeId: string, timelineIds: string[]) {
  for (const timelineId of new Set(timelineIds)) {
    const exists = await tx.timelineMembership.findUnique({ where: { timelineId_nodeId: { timelineId, nodeId } } });
    if (exists) continue;
    const max = await tx.timelineMembership.aggregate({ where: { timelineId }, _max: { position: true } });
    await tx.timelineMembership.create({ data: { timelineId, nodeId, position: (max._max.position ?? 0) + 1 } });
  }
}
