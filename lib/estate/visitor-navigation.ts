import { type Volume } from "../library/types";
import { resolveReportSection } from "../library/report";
import type { NavigationIntent } from "../portrait/contracts";
import { companionSlug, type Route } from "./world";

/** Recheck the client destination against the collection actually mounted here.
 * The server separately consumes a signed, freshly authorized single-use intent. */
export function portraitRoute(intent: NavigationIntent, volumes: Volume[]): Route | null {
  const volume = volumes.find(item => item.slug === intent.targetId);
  if (!volume || !["book", "report", "focus"].includes(intent.mode)) return null;
  const section = resolveReportSection(volume, intent.sectionId);
  if (!section) return null;
  return {
    place: volume.slug === companionSlug ? "desk" : "cabinet",
    focus: { kind: "book", slug: volume.slug, leaf: intent.sectionId },
    ...(intent.mode === "report" ? { report: { section: section.id } } : {}),
  };
}
