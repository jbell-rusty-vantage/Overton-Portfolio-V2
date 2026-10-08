// Option lists / types for the projects admin section.
// (Kept out of actions.ts: "use server" modules may only export async functions.)

export const PROJECT_STATUSES = ["idea", "active", "shipped", "paused", "archived"] as const;

export type BodyBlocksState = { ok: boolean; error: string | null; savedAt: number | null };
