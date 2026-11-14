import { type ReadingScope, type Volume } from "./types";
import { withinPreview } from "./paths";

/** An editorial order, never a source of records or authorization. */
export const firstEdition = ["vantage-movers", "gowipe", "overtech-digital-services", "agentic-mission-control", "ai-engineer-platform", "agent-knowledge-services"];

export function portfolioSelection(volumes: Volume[]) {
  const projects = volumes.filter((v) => v.kind === "Project");
  const selected = firstEdition.flatMap((slug) => {
    const volume = projects.find((v) => v.slug === slug || v.projectSlug === slug);
    return volume ? [volume] : [];
  });
  return { selected, other: projects.filter((v) => !selected.includes(v)) };
}

export function portfolioHref(admin: ReadingScope = false, slug?: string) {
  const base = admin === true ? "/admin/preview/portfolio" : withinPreview("/", admin);
  return base + (slug ? "#work-" + encodeURIComponent(slug) : "#selected-work");
}

/** Real product captures take precedence over explanatory diagrams and posters. */
export function projectPicture(volume: Volume) {
  const picture = volume.pages.flatMap((page) => page.blocks).find((block) => block.kind === "image" && block.url && !/architecture|poster|course-world/.test(block.url));
  return picture ? { url: picture.url!, caption: picture.text } : { url: volume.cover, caption: "Project artwork · " + volume.title };
}
