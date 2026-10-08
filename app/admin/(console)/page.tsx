import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, PageHeader, Stat, fmtDateTime } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const [repos, trackedRepos, shownRepos, sites, projects, media, posts, favorites, signals, recent, audits] =
    await Promise.all([
      db.repo.count({ where: { deletedAt: null } }),
      db.repo.count({ where: { deletedAt: null, activation: "tracking" } }),
      db.repo.count({ where: { deletedAt: null, display: { in: ["published", "featured"] } } }),
      db.deployment.count({ where: { deletedAt: null } }),
      db.project.count({ where: { deletedAt: null } }),
      db.mediaAsset.count({ where: { deletedAt: null } }),
      db.post.count({ where: { deletedAt: null } }),
      db.favorite.count({ where: { deletedAt: null } }),
      db.activityEvent.count(),
      db.activityEvent.findMany({ orderBy: { occurredAt: "desc" }, take: 8, include: { type: true } }),
      db.auditLog.findMany({ orderBy: { at: "desc" }, take: 8 }),
    ]);

  return (
    <>
      <PageHeader title={`Welcome back, ${admin.name.split(" ")[0]}`} description="The state of the library at a glance." />
      {sp.welcome ? (
        <div className="mb-6 rounded-lg border border-ok/50 bg-ok/10 p-4 text-sm">Password updated. The office is yours.</div>
      ) : null}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/admin/repos"><Stat label="GitHub repos" value={repos} hint={`${trackedRepos} tracked · ${shownRepos} shown`} /></Link>
        <Link href="/admin/sites"><Stat label="Live sites" value={sites} /></Link>
        <Link href="/admin/projects"><Stat label="Projects" value={projects} /></Link>
        <Link href="/admin/media"><Stat label="Media & artifacts" value={media} /></Link>
        <Link href="/admin/posts"><Stat label="Blog posts" value={posts} /></Link>
        <Link href="/admin/favorites"><Stat label="Favorites" value={favorites} /></Link>
        <Link href="/admin/events"><Stat label="Signals" value={signals} /></Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 font-serif text-xl">Latest signals</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">Nothing yet. Post a custom event or connect GitHub webhooks.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recent.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3">
                  <div>
                    <div>{e.title}</div>
                    <div className="text-xs text-muted">{e.type.label} · {fmtDateTime(e.occurredAt)}</div>
                  </div>
                  <Badge value={e.visibility} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2 className="mb-4 font-serif text-xl">Audit trail</h2>
          {audits.length === 0 ? (
            <p className="text-sm text-muted">No admin activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {audits.map((a) => (
                <li key={a.id} className="flex justify-between gap-3">
                  <span>
                    <span className="font-mono text-xs">{a.action}</span>{" "}
                    <span className="text-muted">{a.entityType ?? ""}</span>
                  </span>
                  <span className="text-xs text-muted">{fmtDateTime(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
