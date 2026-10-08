import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, DISPLAY_STATES, Empty, Field, PageHeader, Select, fmtDate } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { createMoment, deleteMoment, quickUpdateMoment, updateMoment } from "../actions";
import { DateTimeInput } from "../datetime-input";
import { NODE_KINDS, PRECISIONS } from "../lib";

export const metadata: Metadata = { title: "Moments" };

const IMPORTANCE = ["1", "2", "3", "4", "5"] as const;

export default async function MomentsPage() {
  await requireAdmin();
  const [nodes, stages, projects, timelines] = await Promise.all([
    db.timelineNode.findMany({
      where: { deletedAt: null },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        stage: { select: { label: true } },
        project: { select: { title: true } },
        memberships: { include: { timeline: { select: { id: true, title: true } } } },
        _count: { select: { signals: true } },
      },
    }),
    db.stage.findMany({ orderBy: { sortOrder: "asc" }, select: { code: true, label: true } }),
    db.project.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.timeline.findMany({ orderBy: [{ kind: "asc" }, { title: "asc" }], select: { id: true, slug: true, title: true, kind: true } }),
  ]);

  const stageOptions = [{ value: "", label: "— no stage —" }, ...stages.map((s) => ({ value: s.code, label: s.label }))];
  const projectOptions = [{ value: "", label: "— none —" }, ...projects.map((p) => ({ value: p.id, label: p.title }))];

  return (
    <>
      <PageHeader
        title="Moments"
        description="Curated story points on the timelines. Promote signals from Events & signals, or write moments by hand (pre-GitHub history for the evolution timeline)."
        actions={
          <Link href="/admin/events" className="btn-ghost">
            ← Signals
          </Link>
        }
      />

      <details className="card mb-8" open={nodes.length === 0}>
        <summary className="cursor-pointer font-serif text-lg">Write a moment</summary>
        <form action={createMoment} className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Field label="Title"><input name="title" required className="input" /></Field>
          </div>
          <Field label="Occurred at"><DateTimeInput name="occurredAt" required defaultNow /></Field>
          <div className="md:col-span-3">
            <Field label="Summary"><textarea name="summary" rows={2} className="input" /></Field>
          </div>
          <Field label="Date precision" hint="Month/year for history you can't date exactly.">
            <Select name="precision" options={PRECISIONS} defaultValue="day" />
          </Field>
          <Field label="Kind"><Select name="kind" options={NODE_KINDS} defaultValue="milestone" /></Field>
          <Field label="Stage"><Select name="stageCode" options={stageOptions} /></Field>
          <Field label="Project"><Select name="projectId" options={projectOptions} /></Field>
          <Field label="Importance (1–5)"><Select name="importance" options={IMPORTANCE} defaultValue="3" /></Field>
          <Field label="Display"><Select name="display" options={DISPLAY_STATES} defaultValue="hidden" /></Field>
          <fieldset className="md:col-span-3">
            <span className="label">Add to timelines</span>
            <div className="flex flex-wrap gap-4">
              {timelines.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="timelineIds" value={t.id} defaultChecked={t.slug === "global"} />
                  {t.title} <span className="text-xs text-muted">({t.kind})</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-3"><SubmitButton>Create moment</SubmitButton></div>
        </form>
      </details>

      {nodes.length === 0 ? (
        <Empty>No moments yet. Promote a signal or write one above.</Empty>
      ) : (
        <div className="space-y-3">
          {nodes.map((n) => {
            const onTimelines = new Set(n.memberships.map((m) => m.timelineId));
            return (
              <div key={n.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">
                    {fmtDate(n.occurredAt)}
                    {n.precision !== "day" ? ` (${n.precision})` : ""}
                  </span>
                  <h2 className="font-serif text-lg">{n.title}</h2>
                  <Badge value={n.display} />
                  <Badge>{n.kind}</Badge>
                  {n.stage ? <Badge>{n.stage.label}</Badge> : null}
                  {n._count.signals ? <Badge>{n._count.signals} signal{n._count.signals === 1 ? "" : "s"}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {n.project ? `${n.project.title} · ` : ""}
                  {n.memberships.length ? `On: ${n.memberships.map((m) => m.timeline.title).join(", ")}` : "Not on any timeline"}
                </p>
                {n.summary ? <p className="mt-2 text-sm">{n.summary}</p> : null}

                <form action={quickUpdateMoment} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={n.id} />
                  <label className="block">
                    <span className="label">Display</span>
                    <Select name="display" options={DISPLAY_STATES} defaultValue={n.display} className="input w-auto py-1 text-xs" />
                  </label>
                  <label className="block">
                    <span className="label">Stage</span>
                    <Select name="stageCode" options={stageOptions} defaultValue={n.stageCode ?? ""} className="input w-auto py-1 text-xs" />
                  </label>
                  <label className="block">
                    <span className="label">Importance</span>
                    <Select name="importance" options={IMPORTANCE} defaultValue={String(n.importance)} className="input w-auto py-1 text-xs" />
                  </label>
                  <SubmitButton className="btn-ghost py-1 text-xs">Save</SubmitButton>
                </form>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-muted">Edit everything</summary>
                  <form action={updateMoment} className="mt-4 grid gap-4 md:grid-cols-3">
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="syncTimelines" value="1" />
                    <div className="md:col-span-2">
                      <Field label="Title"><input name="title" defaultValue={n.title} required className="input" /></Field>
                    </div>
                    <Field label="Occurred at"><DateTimeInput name="occurredAt" iso={n.occurredAt.toISOString()} required /></Field>
                    <div className="md:col-span-3">
                      <Field label="Summary"><textarea name="summary" rows={2} defaultValue={n.summary ?? ""} className="input" /></Field>
                    </div>
                    <Field label="Date precision"><Select name="precision" options={PRECISIONS} defaultValue={n.precision} /></Field>
                    <Field label="Kind"><Select name="kind" options={NODE_KINDS} defaultValue={n.kind} /></Field>
                    <Field label="Stage"><Select name="stageCode" options={stageOptions} defaultValue={n.stageCode ?? ""} /></Field>
                    <Field label="Project"><Select name="projectId" options={projectOptions} defaultValue={n.projectId ?? ""} /></Field>
                    <Field label="Importance (1–5)"><Select name="importance" options={IMPORTANCE} defaultValue={String(n.importance)} /></Field>
                    <Field label="Display"><Select name="display" options={DISPLAY_STATES} defaultValue={n.display} /></Field>
                    <fieldset className="md:col-span-3">
                      <span className="label">Timelines</span>
                      <div className="flex flex-wrap gap-4">
                        {timelines.map((t) => (
                          <label key={t.id} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="timelineIds" value={t.id} defaultChecked={onTimelines.has(t.id)} />
                            {t.title}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div className="flex gap-2 md:col-span-3"><SubmitButton>Save moment</SubmitButton></div>
                  </form>
                  <form action={deleteMoment} className="mt-3">
                    <input type="hidden" name="id" value={n.id} />
                    <SubmitButton className="btn-danger" confirm={`Remove “${n.title}”?`}>Remove moment</SubmitButton>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
