import "server-only";

// Minimal GitHub REST client for the admin repo sync. Uses GITHUB_TOKEN when
// set (higher rate limit + private repos of the token's own user); otherwise
// unauthenticated requests (public repos only, 60 req/h per IP).

const API = "https://api.github.com";
const PER_PAGE = 100;
const MAX_PAGES = 30; // 3,000 repos is plenty for one account

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  default_branch: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
  created_at: string | null;
  owner: { login: string };
};

export type GithubUser = {
  login: string;
  avatar_url: string | null;
  html_url: string | null;
  type: string; // "User" | "Organization"
};

export class GithubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GithubError";
  }
}

function headers(withToken = true): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "overton-portfolio",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token && withToken) h.Authorization = `Bearer ${token}`;
  return h;
}

async function gh<T>(path: string): Promise<T> {
  const call = (withToken: boolean) =>
    fetch(`${API}${path}`, { headers: headers(withToken), cache: "no-store", signal: AbortSignal.timeout(20_000) });
  let res = await call(true);
  // A bad/expired GITHUB_TOKEN shouldn't block public data: retry anonymously.
  if (res.status === 401 && process.env.GITHUB_TOKEN && path !== "/user") res = await call(false);
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string };
      detail = body.message ?? "";
    } catch {
      /* ignore */
    }
    const rateLeft = res.headers.get("x-ratelimit-remaining");
    const hint = rateLeft === "0" ? " (rate limit exhausted — set GITHUB_TOKEN)" : "";
    throw new GithubError(`GitHub ${res.status} for ${path}${detail ? `: ${detail}` : ""}${hint}`, res.status);
  }
  return (await res.json()) as T;
}

/** Page through a list endpoint (page param) until a short/empty page. */
async function paginate<T>(basePath: string): Promise<T[]> {
  const out: T[] = [];
  const sep = basePath.includes("?") ? "&" : "?";
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await gh<T[]>(`${basePath}${sep}per_page=${PER_PAGE}&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return out;
}

/** The login the GITHUB_TOKEN belongs to, or null when no (valid) token. */
async function tokenLogin(): Promise<string | null> {
  if (!process.env.GITHUB_TOKEN) return null;
  try {
    const me = await gh<GithubUser>("/user");
    return me.login;
  } catch {
    return null;
  }
}

export async function fetchGithubUser(login: string): Promise<GithubUser> {
  return gh<GithubUser>(`/users/${encodeURIComponent(login)}`);
}

/**
 * All repos owned by `login`.
 * - token belongs to `login`: /user/repos?affiliation=owner (includes private)
 * - organization: /orgs/{login}/repos?type=all (private too if the token is a member)
 * - otherwise: /users/{login}/repos (public only)
 */
export async function fetchGithubRepos(login: string, opts: { isOrg?: boolean } = {}): Promise<GithubRepo[]> {
  const me = await tokenLogin();
  let repos: GithubRepo[];
  if (me && me.toLowerCase() === login.toLowerCase()) {
    repos = await paginate<GithubRepo>("/user/repos?affiliation=owner&sort=pushed");
  } else if (opts.isOrg) {
    try {
      repos = await paginate<GithubRepo>(`/orgs/${encodeURIComponent(login)}/repos?type=all&sort=pushed`);
    } catch (e) {
      if (!(e instanceof GithubError) || e.status !== 404) throw e;
      repos = await paginate<GithubRepo>(`/users/${encodeURIComponent(login)}/repos?sort=pushed`);
    }
  } else {
    repos = await paginate<GithubRepo>(`/users/${encodeURIComponent(login)}/repos?sort=pushed`);
  }
  // /user/repos with affiliation=owner can still include repos of other owners
  // in edge cases (e.g. transferred); keep only this login's.
  const lower = login.toLowerCase();
  const seen = new Set<number>();
  return repos.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return r.owner?.login?.toLowerCase() === lower;
  });
}

/** Normalize "@login", "https://github.com/login" or "login" to "login". */
export function normalizeLogin(input: string): string {
  let v = input.trim();
  const m = v.match(/github\.com\/([^/?#]+)/i);
  if (m) v = m[1];
  return v.replace(/^@/, "").trim();
}
