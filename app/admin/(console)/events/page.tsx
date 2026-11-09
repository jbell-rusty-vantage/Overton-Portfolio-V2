import { officePage } from "@/components/admin/office-page";
import type { Metadata } from "next";
import Link from "next/link";
import { db, type Prisma, type SignalSource, type SignalVisibility } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, Empty, PageHeader, Select, fmtDateTime } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { expireSignal, promoteSignal, setSignalVisibility } from "./actions";
import { EXPIRY_PRESETS, SCENE_EFFECTS, SIGNAL_SOURCES, SIGNAL_VISIBILITIES } from "./lib";
import { PostEventForm } from "./post-event-form";

export const metadata: Metadata = { title: "Events & signals" };

const PAGE_SIZE = 50;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

async function EventsPage({ searchParams }: PageProps<"/admin/events">) {
  await requireAdmin();
  const sp = await searchParams;
  const filters = {
    source: one(sp.source),
    type: one(sp.type),
    visibility: one(sp.visibility),
    project: one(sp.project),
  };
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);

  const where: Prisma.ActivityEventWhereInput = {
    ...((SIGNAL_SOURCES as readonly string[]).includes(filters.source ?? "")
      ? { source: filters.source as SignalSource }
      : {}),
    ...(filters.type ? { typeCode: filters.type } : {}),
    ...((SIGNAL_VISIBILITIES as readonly string[]).includes(filters.visibility ?? "")
      ? { visibility: filters.visibility as SignalVisibility }
      : {}),
    ...(filters.project === "none" ? { projectId: null } : filters.project ? { projectId: filters.project } : {}),
  };

  const [types, projects, stages, total, signals] = await Promise.all([
    db.signalType.findMany({ orderBy: { sortOrder: "asc" } }),
    db.project.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.stage.findMany({ orderBy: { sortOrder: "asc" }, select: { code: true, label: true } }),
    db.activityEvent.count({ where }),
    db.activityEvent.findMany({
      where,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        type: { select: { label: true } },
        project: { select: { title: true } },
        repo: { select: { fullName: true } },
        deployment: { select: { title: true } },
        _count: { select: { nodes: true } },
      },
    }),
  ]);
  const now = new Date();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.title }));
  const stageOptions = [{ value: "", label: "— no stage —" }, ...stages.map((s) => ({ value: s.code, label: s.label }))];

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/admin/events?${s}` : "/admin/events";
  };

  return (
    <>
      <PageHeader
        title="Events & signals"
        description="Signals are the raw activity stream (GitHub, Vercel, system, agents and your own posts). Promote the ones that matter into moments on the timelines."
        actions={
          <Link href="/admin/events/moments" className="btn-ghost">
            Moments →
          </Link>
        }
      />

      <details className="card mb-8">
        <summary className="cursor-pointer font-serif text-lg">Post a custom event</summary>
        <PostEventForm
          types={types.filter((t) => t.source === "admin").map((t) => ({ value: t.code, label: t.label }))}
          projects={projectOptions}
          expiryPresets={EXPIRY_PRESETS}
          sceneEffects={SCENE_EFFECTS}
        />
      </details>

      <form className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="label">Source</span>
          <Select
            name="source"
            defaultValue={filters.source ?? ""}
            options={[{ value: "", label: "All sources" }, ...SIGNAL_SOURCES.map((s) => ({ value: s, label: s }))]}
          />
        </label>
        <label className="block">
          <span className="label">Type</span>
          <Select
            name="type"
            defaultValue={filters.type ?? ""}
            options={[{ value: "", label: "All types" }, ...types.map((t) => ({ value: t.code, label: t.label }))]}
          />
        </label>
        <label className="block">
          <span className="label">Visibility</span>
          <Select
            name="visibility"
            defaultValue={filters.visibility ?? ""}
            options={[{ value: "", label: "Any" }, ...SIGNAL_VISIBILITIES.map((v) => ({ value: v, label: v }))]}
          />
        </label>
        <label className="block">
          <span className="label">Project</span>
          <Select
            name="project"
            defaultValue={filters.project ?? ""}
            options={[{ value: "", label: "All projects" }, { value: "none", label: "— no project —" }, ...projectOptions]}
          />
        </label>
        <button type="submit" className="btn-ghost">
          Filter
        </button>
        <Link href="/admin/events" className="text-sm text-muted underline">
          Clear
        </Link>
      </form>

      <p className="mb-3 text-xs text-muted">
        Signals are append-only. The only changes allowed are visibility and expiry; everything else is history. {total} signal
        {total === 1 ? "" : "s"} match.
      </p>

      {signals.length === 0 ? (
        <Empty>No signals match these filters.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-line bg-panel text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Signal</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Visibility</th>
                <th className="px-3 py-2 font-medium">Project / repo</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => {
                const expired = s.expiresAt !== null && s.expiresAt <= now;
                return (
                  <tr key={s.id} className={`border-b border-line align-top last:border-0 ${expired ? "opacity-60" : ""}`}>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">
                      {fmtDateTime(s.occurredAt)}
                      {s.expiresAt ? (
                        <span className={`mt-1 block ${expired ? "text-danger" : ""}`}>
                          {expired ? "expired" : "expires"} {fmtDateTime(s.expiresAt)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-muted">{s.type.label}</div>
                      <div className="font-medium">
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">
                            {s.title}
                          </a>
                        ) : (
                          s.title
                        )}
                      </div>
                      {s.summary ? <div className="mt-0.5 line-clamp-2 text-xs text-muted">{s.summary}</div> : null}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {s.sceneEffect ? <Badge>{s.sceneEffect}</Badge> : null}
                        {s.backfilled ? <Badge>backfilled</Badge> : null}
                        {s._count.nodes ? <Badge value="featured">in {s._count.nodes} moment{s._count.nodes === 1 ? "" : "s"}</Badge> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">{s.source}</td>
                    <td className="px-3 py-3">
                      <Badge value={s.visibility} />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {s.project?.title ?? "—"}
                      {s.repo ? <span className="block font-mono">{s.repo.fullName}</span> : null}
                      {s.deployment ? <span className="block">{s.deployment.title}</span> : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-start gap-2">
                        <form action={setSignalVisibility} className="flex gap-1">
                          <input type="hidden" name="id" value={s.id} />
                          <Select
                            name="visibility"
                            options={SIGNAL_VISIBILITIES}
                            defaultValue={s.visibility}
                            className="input w-auto py-1 text-xs"
                          />
                          <SubmitButton className="btn-ghost py-1 text-xs" pendingText="…">
                            Set
                          </SubmitButton>
                        </form>
                        {expired ? null : (
                          <form action={expireSignal}>
                            <input type="hidden" name="id" value={s.id} />
                            <SubmitButton className="btn-ghost py-1 text-xs" pendingText="…" confirm={`Expire “${s.title}” now?`}>
                              Expire now
                            </SubmitButton>
                          </form>
                        )}
                        <details className="w-full">
                          <summary className="cursor-pointer text-xs text-accent">Promote to moment</summary>
                          <form action={promoteSignal} className="mt-2 flex flex-wrap gap-1">
                            <input type="hidden" name="id" value={s.id} />
                            <Select name="stageCode" options={stageOptions} className="input w-auto py-1 text-xs" />
                            <SubmitButton className="btn py-1 text-xs" pendingText="Promoting…">
                              Promote
                            </SubmitButton>
                          </form>
                          <p className="mt-1 text-[11px] text-muted">Creates a hidden draft on the global (and project) timeline.</p>
                        </details>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn-ghost">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="btn-ghost">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}

export default officePage(EventsPage);
