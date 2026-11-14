import { z } from "zod";

const key = z.string().regex(/^[a-z][a-z0-9-]{0,80}$/);
const cue = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("spread"),
    page: z.number().int().positive(),
    object: key,
    label: z.string().max(160),
  }),
  z.object({
    kind: z.literal("screen"),
    slot: z.enum(["main", "side"]),
    project: key,
    media: key,
    poster: key.optional(),
    track: key.optional(),
  }),
  z.object({
    kind: z.literal("clip"),
    id: z.literal("free-kick-winner"),
    media: key,
    poster: key,
    track: key,
  }),
]);
const shared = {
  companion: z.literal("travellers-rest-house-book"),
  featuredFrom: z.iso.datetime().nullable(),
  featuredUntil: z.iso.datetime().nullable(),
  scenes: z.object({
    high: z.literal("travellers-rest-house"),
    low: z.literal("travellers-rest-house-low"),
  }),
  cues: z.array(cue).max(64),
  media: z.record(key, z.uuid()),
};
/** Edition 1: the guided visit with illustrated rooms and an optional 3D walk. */
const guided = z.object({ edition: z.literal(1), ...shared });
/** Edition 2: the continuous world. Adds the custodian's voiced cues, the objects that
    can be lifted and inspected, and physical placements scoped to this house. */
const continuous = z.object({
  edition: z.literal(2),
  ...shared,
  /** Media key of the archival portrait still the custodian is registered to. */
  portrait: key,
  /** Media keys of the Blender-authored furniture kit, one per model tier. Optional:
      without it the room uses the pieces it builds in code. */
  kit: z.object({ high: key, low: key }).optional(),
  voice: z.object({
    /** Media key of the JSON timeline: words, mouth and gaze per cue. */
    timeline: key,
    cues: z.array(z.object({ id: key, audio: key })).max(96),
  }),
  objects: z
    .array(
      z.object({
        /** Catalogue ID of a held object. */
        id: key,
        pages: z
          .array(z.object({ full: key, small: key.optional() }))
          .max(12),
      }),
    )
    .max(32),
  /** Overrides for where a project volume stands in the family cabinet. A volume
      without an entry keeps the shelf and position it has in the collection. */
  placements: z
    .array(
      z.object({
        book: key,
        shelf: key,
        position: z.number().int().positive().max(64),
      }),
    )
    .max(64),
});
export const layoutSchema = z.tuple([
  z.object({
    component: z.literal("HouseProgram"),
    props: z.discriminatedUnion("edition", [guided, continuous]),
  }),
]);
export type HouseProgram = z.infer<typeof layoutSchema>[0]["props"];
export const editions = [1, 2] as const;
export const roomAnchors = [
  { slug: "travellers-rest-approach", node: "camera.approach" },
  { slug: "travellers-rest-hall", node: "camera.entry" },
  { slug: "travellers-rest-library", node: "camera.library" },
  { slug: "travellers-rest-cabinet", node: "screen.cabinet" },
];
