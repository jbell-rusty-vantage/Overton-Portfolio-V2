/** Stable public and authenticated paths; no data authorization belongs in this module. */
export const libraryPath = (admin = false) => admin ? "/admin/preview/library" : "/library";
export const portfolioPath = (admin = false) => admin ? "/admin/preview/portfolio" : "/";
export function isWorldFragment(hash: string) {
  return /^#(?:approach|walk|entry|library|portrait|desk|cabinet|reports|drawers|map|collection|landing|leaf-\d+)$/.test(hash)
    || /^#(?:book|report|object|screen)\/[a-z0-9-]+(?:\/[a-z0-9-]+){0,3}$/.test(hash);
}

import type { Volume, VolumeKind, ReadingScope } from "./types";
/** Input volumes must already be projected for this visitor. Never lookup hidden rows here. */
export function resolveLegacyArrival(query: URLSearchParams, hash: string, volumes: Volume[], placed: string[], admin = false) {
  const base = libraryPath(admin);
  if (isWorldFragment(hash)) return base + hash;
  const slug = query.get("book");
  if (slug) {
    const matches = volumes.filter(v => (v.slug === slug || v.projectSlug === slug) && (!query.has("kind") || v.kind === query.get("kind")));
    if (matches.length !== 1) return base;
    const volume = matches[0];
    if (!placed.includes(volume.slug)) return withinPreview(detailHref(volume), admin);
    const leaf = volume.pages.find(p => p.key === query.get("page"));
    return base + "#book/" + encodeURIComponent(volume.slug) + (leaf ? "/" + encodeURIComponent(leaf.key) : "");
  }
  const zone = query.get("zone") ?? "entrance";
  const destinations: Record<string, string> = { stacks: base + "#cabinet", periodicals: "/blog", "favorites-wing": "/favorites", "evolution-hall": "/evolution", "reading-room": "/catalog", "computer-station": base + "#screen/main" };
  if (admin && ["periodicals", "favorites-wing", "evolution-hall", "reading-room"].includes(zone)) return base + "?catalog=1";
  return destinations[zone] ?? base;
}

export function sceneHref(zone = "entrance", shelf?: string | null, book?: string, kind?: VolumeKind) {
  if (book && (!kind || kind === "Project")) return "/library#book/" + encodeURIComponent(book);
  return ({ stacks: "/library#cabinet", periodicals: "/blog", "favorites-wing": "/favorites", "evolution-hall": "/evolution", "reading-room": "/catalog", "computer-station": "/library#screen/main" } as Record<string, string>)[zone] ?? "/library";
}
export function detailHref(v: Volume) {
  return (
    "/" +
    {
      Project: "projects",
      Journal: "blog",
      Favorite: "favorites",
      Evolution: "evolution",
      Book: "books",
    }[v.kind] +
    "/" +
    encodeURIComponent(v.projectSlug ?? v.slug)
  );
}

export function withinPreview(path: string, admin: ReadingScope = false) {
  if (!admin) return path;
  if (admin === "samples") {
    if (path === "/projects" || path === "/") return "/samples?catalog=1";
    if (/^\/(projects|books|blog|favorites|evolution)\//.test(path)) return "/samples?read=" + encodeURIComponent(decodeURIComponent(path.split("/").at(-1)!));
    return "/samples" + path.replace(/^\/library/, "");
  }
  if (path === "/projects" || path === "/") return "/admin/preview/portfolio";
  if (/^\/(projects|books|blog|favorites|evolution)\//.test(path)) return "/admin/preview" + path;
  if (/^\/library(?:[?#]|$)/.test(path)) return "/admin/preview/library" + path.slice(8);
  if (path.startsWith("/?")) return "/admin/preview/library" + path.slice(1);
  return path;
}
