// Shared option lists for the repos and projects admin sections.
// (Kept out of actions.ts: "use server" modules may only export async functions.)

export const ACCOUNT_KINDS = ["personal", "client", "org"] as const;
export const REDACTION_POLICIES = ["none", "messages_hidden", "counts_only", "curated_only"] as const;
export const REPO_ROLES = ["frontend", "api", "infra", "agent", "data", "docs", "other"] as const;
export const REPO_STATE_FILTERS = ["all", "tracked", "shown", "hidden"] as const;
export type RepoStateFilter = (typeof REPO_STATE_FILTERS)[number];
