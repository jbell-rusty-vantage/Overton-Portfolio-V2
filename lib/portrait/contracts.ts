export type NavigationIntent = { intentId: string; turnId: string; targetId: string; mode: "focus" | "book" | "report"; sectionId?: string; label: string };
export type SceneSnapshot = { place?: string; volumeId?: string; sectionId?: string; returnMarker?: string };
export type EvidenceRecord = {
  id: string; corpus: "history" | "project" | "briefing"; title: string; text: string;
  sourceUrlOrInternalRef: string; sourceLocator: string; sourcePublishedAt?: string; eventDate?: string;
  checkedAt: string; expiresAt?: string; entityId?: string; canonicalSlug?: string; aliases: string[];
  sourceRevision: string; contentHash: string; approvalState: "reviewed-draft" | "published";
  audience: "public" | "authenticated-preview"; redactionState: "projected";
  claimKind: "historical-fact" | "owner-approved" | "curated-project-draft" | "vendor-claim" | "forecast" | "web-search-result";
  targetId?: string; sectionId?: string;
};
export type Citation = Pick<EvidenceRecord, "id" | "title" | "text" | "sourceUrlOrInternalRef" | "sourceLocator" | "checkedAt" | "expiresAt" | "sourceRevision" | "claimKind">;
export type PortraitAnswer = { turnId: string; text: string; citations: Citation[]; navigation?: NavigationIntent; navigationProof?: string; navigationRequested: boolean; mode: "mock" | "live" | "fallback"; model: string; /** Server-sealed follow-up memory; opaque to the browser. */ context?: string; /** Server-only: passage IDs and volume:slug the reply drew on; sealed into context, stripped before sending. */ exposed?: string[]; /** Server-only tool trace for evaluation; stripped before sending. */ trace?: string[]; costUsd: number | null; firstTextMs: number; fullAnswerMs: number; resetAt?: string; notice?: string };
export type PortraitEvent = { type: "text"; text: string } | { type: "complete"; answer: PortraitAnswer };
export type NavigationAck = "success" | "cancelled" | "unavailable";
export const FALLBACK = "I do not have a reliable account of that among the materials John has placed here. I would rather leave the question open than furnish you with a confident invention.";
export const ALLOWANCE = "Our conversation has reached its allowance for now. The books remain open to you, and my recorded introductions are still at your service.";
export const DISCLOSURE = "An imagined conversation with Judge John Overton, informed by historical records and John's curated portfolio. Modern reflections are original interpretation, never historical quotations.";
