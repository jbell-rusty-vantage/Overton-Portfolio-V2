import staged from "@/assets/library/posters/staged-media.json";
import type { Volume } from "./model";

/** Presentation-only draft edition, applied AFTER authorization by its caller.
 * Never fetches a record, changes words/links, adds a volume, or writes to the DB.
 * An owner cover that has changed since staging is preserved.
 */
export function applyShowcaseDraft(volumes: Volume[]): Volume[] {
  const posters = new Map(staged.posters.map((poster) => [poster.slug, poster]));
  const replacements = new Map(staged.replacements.map((replacement) => [replacement.from, replacement]));
  return volumes.map((volume) => {
    const poster = posters.get(volume.slug);
    const cover = poster && volume.cover === `/library/artwork/${volume.slug}-cover.webp` ? poster.url : volume.cover;
    return {
      ...volume,
      cover,
      pages: volume.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) => {
          if (block.kind !== "image" && block.kind !== "video") return block;
          const picture = block.url && block.kind === "image" ? replacements.get(block.url) : undefined;
          const preview = block.poster && block.kind === "video" ? replacements.get(block.poster) : undefined;
          return {
            ...block,
            ...(picture ? { url: picture.to, ...("ownPage" in picture && picture.ownPage ? { ownPage: true, detail: block.url } : {}) } : {}),
            ...(preview ? { poster: preview.to } : {}),
          };
        }),
      })),
    };
  });
}
