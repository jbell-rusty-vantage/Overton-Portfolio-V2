import baseline from "@/assets/library/posters/content-inventory.json";
import belllabs from "@/content/showcases/belllabs.json";
import commerce from "@/content/showcases/commerce-studio.json";
import vantage from "@/content/showcases/vantage.json";
import { blocksFrom, templateNames } from "./policy";
import type { Volume } from "./model";

export const showcaseWriting = [...vantage, ...commerce, ...belllabs];

/** Curator-only writing preview. Never grants access or adds a record. A changed
 * source is left intact so an office edit cannot be silently covered by a draft.
 * Call before the artwork remapper, against the authorized original projection.
 */
export function applyShowcaseWritingDraft(volumes: Volume[]): Volume[] {
  return volumes.map((volume) => {
    const draft = showcaseWriting.find((entry) => entry.slug === volume.slug);
    const original = baseline.find((entry) => entry.slug === volume.slug);
    if (!draft || !original || volume.kind !== "Project" || volume.summary !== original.summary || volume.title !== original.title) return volume;
    const originalStatus = (original.pages ?? []).flatMap((page) => blocksFrom(page.blocks)).find((block) => block.kind === "metric" && block.label === "Status")?.text ?? original.tags.find((tag) => /^(live|in development|early stage|earlier work|launching)$/i.test(tag)) ?? original.status;
    if (volume.status !== originalStatus || JSON.stringify(volume.tags) !== JSON.stringify(original.tags)) return volume;
    const originalPages = original.pages ?? [];
    if (originalPages.some((page) => {
      const current = volume.pages.find((leaf) => leaf.key === page.template);
      return !current || current.title !== (templateNames[page.template] ?? "Page " + page.position) || JSON.stringify(current.blocks) !== JSON.stringify(blocksFrom(page.blocks));
    })) return volume;
    // Stable leaf identities are shared by bookmarks, reports and citations.
    if (draft.pages.some((page) => !volume.pages.some((leaf) => leaf.key === page.key))) return volume;
    return {
      ...volume,
      summary: draft.summary,
      status: draft.status,
      ...("role" in draft && typeof draft.role === "string" ? { role: draft.role } : {}),
      pages: [
        ...draft.pages.map((page) => ({ key: page.key, title: page.title, blocks: blocksFrom(page.blocks) })),
        ...volume.pages.filter((page) => !draft.pages.some((entry) => entry.key === page.key)),
      ],
    };
  });
}
