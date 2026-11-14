import { type Leaf, type Volume } from "./types";

/** A report section is the existing authored leaf, never a heading-derived slug. */
export type ReportSection = { id: string; title: string; page: Leaf };
export function reportSections(volume: Pick<Volume, "pages">): ReportSection[] {
  const seen = new Set<string>();
  return volume.pages.flatMap((page) => {
    if (!page.key || seen.has(page.key)) return [];
    seen.add(page.key);
    const heading = page.blocks.find((block) => block.kind === "heading");
    return [{ id: page.key, title: page.title.startsWith("Page ") && heading ? heading.text : page.title, page }];
  });
}

/** Invalid explicit sections are rejected, not silently redirected to unrelated evidence. */
export function resolveReportSection(volume: Pick<Volume, "pages">, id?: string | null) {
  const sections = reportSections(volume);
  return id ? sections.find((section) => section.id === id) ?? null : sections[0] ?? null;
}

export const reportSectionId = (key: string) => "report-section-" + encodeURIComponent(key);

/** Only already-authorized collection members can become adjacent project links. */
export function reportNeighbors(volume: Volume, volumes: Volume[]) {
  const projects = volumes.filter((entry) => entry.kind === "Project");
  const index = projects.findIndex((entry) => entry.slug === volume.slug);
  return index < 0 ? {} : { previous: projects[index - 1], next: projects[index + 1] };
}

/** Standalone reports link to neighbors; their full manuscripts stay on the server. */
export function reportLinkNeighbors(volume: Volume, volumes: Volume[]) {
  const { previous, next } = reportNeighbors(volume, volumes);
  const link = (neighbor?: Volume) => neighbor && { ...neighbor, pages: [] };
  return { previous: link(previous), next: link(next) };
}
