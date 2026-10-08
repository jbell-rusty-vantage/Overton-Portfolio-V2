import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav, AdminNavFallback } from "@/components/admin/nav";
import { logout } from "../actions";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

// Static chrome renders in the shell; each page reads the session (requireAdmin)
// and the database behind this Suspense boundary (Cache Components).
export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
      <aside className="md:w-56 md:shrink-0">
        <Link href="/" className="mb-4 block">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">The Library</span>
          <span className="block font-serif text-xl">Librarian&apos;s office</span>
        </Link>
        <Suspense fallback={<AdminNavFallback />}>
          <AdminNav />
        </Suspense>
        <form action={logout} className="mt-6 hidden md:block">
          <button className="text-xs text-muted hover:text-foreground">Sign out</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1">
        <Suspense fallback={<div className="animate-pulse text-sm text-muted">Opening the ledger…</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
