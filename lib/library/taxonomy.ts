/** Stable collection identities. These are categories, not room geometry. */
export const zones = [
  {
    "slug": "entrance",
    "title": "Entrance hall"
  },
  {
    "slug": "stacks",
    "title": "Project stacks"
  },
  {
    "slug": "evolution-hall",
    "title": "Evolution hall"
  },
  {
    "slug": "periodicals",
    "title": "Periodicals"
  },
  {
    "slug": "favorites-wing",
    "title": "Favorites wing"
  },
  {
    "slug": "reading-room",
    "title": "Reading room"
  },
  {
    "slug": "computer-station",
    "title": "Computer station"
  }
];
export const shelves = [
  {
    "slug": "stacks-ai-agents",
    "title": "Agent systems",
    "zone": "stacks"
  },
  {
    "slug": "stacks-data-knowledge",
    "title": "Data & knowledge",
    "zone": "stacks"
  },
  {
    "slug": "stacks-web-apps",
    "title": "Web applications",
    "zone": "stacks"
  },
  {
    "slug": "stacks-client-work",
    "title": "Client work",
    "zone": "stacks"
  },
  {
    "slug": "evolution-timeline",
    "title": "Evolution timeline",
    "zone": "evolution-hall"
  },
  {
    "slug": "periodicals-blog",
    "title": "Journal",
    "zone": "periodicals"
  },
  {
    "slug": "favorites-books",
    "title": "Books",
    "zone": "favorites-wing"
  },
  {
    "slug": "favorites-tools",
    "title": "Tools",
    "zone": "favorites-wing"
  },
  {
    "slug": "favorites-longevity",
    "title": "Longevity",
    "zone": "favorites-wing"
  },
  {
    "slug": "reading-room-courses",
    "title": "Courses",
    "zone": "reading-room"
  },
  {
    "slug": "reading-room-articles",
    "title": "Articles & reports",
    "zone": "reading-room"
  }
];

import type { Collection, Volume } from "./types";
export function collectionShelves(data: Collection) {
  const titles = data.shelfTitles;
  return shelves.filter((s) => data.zones.includes(s.zone) && (!titles || Object.hasOwn(titles, s.slug)))
    .map((s) => ({ ...s, title: titles?.[s.slug] ?? s.title }));
}
export function matchesCatalog(volume: Volume, query: string, shelfTitle?: string) {
  const term = query.trim().toLowerCase();
  return [volume.title, volume.summary, ...volume.tags, shelfTitle ?? ""]
    .some((s) => s.toLowerCase().includes(term));
}
export function zoneFor(book: Volume) {
  return shelves.find((s) => s.slug === book.shelf)?.zone ?? "entrance";
}
