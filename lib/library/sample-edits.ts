import { z } from "zod";
import { shelves, type Collection } from "./model";
export const draftSchema = z
  .object({
    slug: z
      .string()
      .regex(/^demo-[a-z0-9-]+$/)
      .max(100),
    title: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(4000),
    notes: z.string().max(12000),
    shelf: z.enum(shelves.map((s) => s.slug) as [string, ...string[]]),
    position: z.number().int().min(1).max(24),
    visible: z.boolean(),
  })
  .strict();
export type SampleDraft = z.infer<typeof draftSchema>;
export function validateEdits(raw: unknown, base: Collection): SampleDraft[] {
  const entries = z.array(draftSchema).max(100).parse(raw);
  if (new Set(entries.map((d) => d.slug)).size !== entries.length)
    throw Error("Duplicate volume slug.");
  const merged = [
    ...base.volumes.filter((v) => !entries.some((d) => d.slug === v.slug)),
    ...entries,
  ];
  const used = new Set<string>();
  for (const d of merged) {
    const key = d.shelf + ":" + d.position;
    if (used.has(key)) throw Error("The destination shelf slot is occupied.");
    used.add(key);
  }
  return entries;
}
export function applyEdits(
  base: Collection,
  entries: SampleDraft[],
): Collection {
  const edited = entries
    .filter((d) => d.visible)
    .map((d) => {
      const original = base.volumes.find((v) => v.slug === d.slug);
      return {
        slug: d.slug,
        title: d.title,
        summary: d.summary,
        kind: original?.kind ?? ("Project" as const),
        tags: original?.tags ?? ["Sample project"],
        shelf: d.shelf,
        position: d.position,
        plate: shelves.findIndex((s) => s.slug === d.shelf) % 4,
        pages: [
          {
            key: "overview",
            title: "Overview",
            blocks: [{ kind: "text" as const, text: d.summary }],
          },
          ...(d.notes
            ? [
                {
                  key: "architecture",
                  title: "Notes",
                  blocks: [{ kind: "text" as const, text: d.notes }],
                },
              ]
            : []),
        ],
      };
    });
  return {
    ...base,
    volumes: [
      ...base.volumes.filter((v) => !entries.some((d) => d.slug === v.slug)),
      ...edited,
    ],
  };
}
