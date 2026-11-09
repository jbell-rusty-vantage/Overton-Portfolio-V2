import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import manifest from "../assets/library/manifest.json" with { type: "json" };

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120);
const link = z
  .object({
    label: z.string().min(1).max(120),
    url: z.url().refine((s) => {
      const u = new URL(s);
      return u.protocol === "https:" && !u.username && !u.password;
    }, "Use an HTTPS URL without credentials."),
  })
  .strict();
const record = z
  .object({
    importKey: slug,
    slug,
    title: z.string().trim().min(1).max(180),
    summary: z.string().max(4000).optional(),
    sourcePages: z.array(z.number().int().positive()).max(64),
    uncertain: z.array(z.string().max(300)).max(30).default([]),
    display: z.literal("hidden").default("hidden"),
    tags: z.array(z.string().max(80)).max(20).default([]),
    links: z.array(link).max(12).default([]),
    placement: z
      .object({
        shelf: z.enum(manifest.shelves.map((s) => s.slug)),
        position: z.number().int().min(1).max(24),
      })
      .strict()
      .optional(),
  })
  .strict();
export function reviewBundle(input) {
  const b = z
    .object({
      schemaVersion: z.literal(1),
      projects: z.array(record).min(1).max(30),
    })
    .strict()
    .parse(input);
  for (const [field, keys] of [
    ["import key", b.projects.map((p) => p.importKey)],
    ["slug", b.projects.map((p) => p.slug)],
    [
      "slot",
      b.projects
        .filter((p) => p.placement)
        .map((p) => p.placement.shelf + ":" + p.placement.position),
    ],
  ]) {
    if (new Set(keys).size !== keys.length)
      throw Error("Duplicate " + field + " in draft bundle");
  }
  return b.projects.map((p) => ({
    key: p.importKey,
    slug: p.slug,
    title: p.title,
    display: "hidden",
    sourcePages: p.sourcePages.join(","),
    shelf: p.placement?.shelf ?? "unplaced",
    slot: p.placement?.position ?? null,
    uncertain: p.uncertain.length,
  }));
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (!process.argv[2])
      throw Error("Usage: npm run draft:review -- path/to/bundle.json");
    const bytes = await readFile(process.argv[2]);
    if (bytes.length > 512000) throw Error("Draft bundle exceeds 500 KiB");
    console.table(reviewBundle(JSON.parse(bytes.toString("utf8"))));
    console.log("Offline dry run only. No database lookup or writes.");
  } catch (e) {
    console.error(
      e instanceof z.ZodError
        ? e.issues.map((i) => i.path.join(".") + " " + i.message).join("\n")
        : e.message,
    );
    process.exitCode = 1;
  }
}
