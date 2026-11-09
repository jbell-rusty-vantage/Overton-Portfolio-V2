"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/repos", label: "GitHub repos" },
  { href: "/admin/sites", label: "Live sites" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/library", label: "Library" },
  { href: "/admin/media", label: "Media & artifacts" },
  { href: "/admin/posts", label: "Blog posts" },
  { href: "/admin/events", label: "Events & signals" },
  { href: "/admin/favorites", label: "Favorites" },
  { href: "/admin/account", label: "Account" },
];

/** Rendered with no active state while the pathname streams in (Cache Components prerender). */
export function AdminNavFallback() {
  return <NavList pathname={null} />;
}

export function AdminNav() {
  return <NavList pathname={usePathname()} />;
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
      {items.map((it) => {
        const active = pathname !== null && (it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
              active ? "bg-accent text-accent-ink" : "text-muted hover:text-foreground"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
