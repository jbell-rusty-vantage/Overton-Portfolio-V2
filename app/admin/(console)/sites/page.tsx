import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { ACTIVATION_STATES, Badge, DISPLAY_STATES, Empty, Field, PageHeader, Select, fmtDateTime } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { checkSite, createSite, deleteSite, updateSite } from "./actions";

export const metadata: Metadata = { title: "Live sites" };

export default async function SitesPage() {
  await requireAdmin();
  const [sites, projects] = await Promise.all([
    db.deployment.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { projects: { include: { project: { select: { title: true } } } } },
    }),
    db.project.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Live sites"
        description="Deployed projects that can appear on the library's computer station. Health checks also detect whether a site allows iframes."
      />

      <details className="card mb-8" open={sites.length === 0}>
        <summary className="cursor-pointer font-serif text-lg">Add a live site</summary>
        <form action={createSite} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Title"><input name="title" required className="input" /></Field>
          <Field label="URL"><input name="url" type="url" required placeholder="https://…" className="input" /></Field>
          <Field label="Description"><input name="description" className="input" /></Field>
          <Field label="Project">
            <Select name="projectId" options={[{ value: "", label: "— none —" }, ...projects.map((p) => ({ value: p.id, label: p.title }))]} />
          </Field>
          <Field label="Provider"><Select name="provider" options={["vercel", "netlify", "aws", "other"]} /></Field>
          <Field label="Vercel project id (optional)"><input name="vercelProjectId" className="input" /></Field>
          <Field label="Display"><Select name="display" options={DISPLAY_STATES} defaultValue="hidden" /></Field>
          <Field label="Activation"><Select name="activation" options={ACTIVATION_STATES} defaultValue="tracking" /></Field>
          <div className="md:col-span-2"><SubmitButton>Add site</SubmitButton></div>
        </form>
      </details>

      {sites.length === 0 ? (
        <Empty>No live sites yet. Add the deployed projects you want on the computer station.</Empty>
      ) : (
        <div className="space-y-4">
          {sites.map((s) => (
            <div key={s.id} className="card">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-xl">{s.title}</h2>
                <Badge value={s.display} />
                <Badge value={s.activation} />
                {s.lastStatusOk === null ? null : (
                  <Badge value={s.lastStatusOk ? "published" : "redacted"}>
                    {s.lastStatusOk ? `up · ${s.lastStatusCode} · ${s.lastLatencyMs}ms` : `down · ${s.lastStatusCode ?? "no response"}`}
                  </Badge>
                )}
                <Badge>{s.iframeAllowed ? "iframe ok" : "no iframe"}</Badge>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
                  {s.url}
                </a>
                <span className="text-xs text-muted">checked {fmtDateTime(s.lastCheckedAt)}</span>
              </div>
              {s.projects.length ? (
                <p className="mb-3 text-xs text-muted">Projects: {s.projects.map((p) => p.project.title).join(", ")}</p>
              ) : null}
              <details>
                <summary className="cursor-pointer text-sm text-muted">Edit</summary>
                <form action={updateSite} className="mt-4 grid gap-4 md:grid-cols-3">
                  <input type="hidden" name="id" value={s.id} />
                  <Field label="Title"><input name="title" defaultValue={s.title} className="input" /></Field>
                  <Field label="URL"><input name="url" defaultValue={s.url} className="input" /></Field>
                  <Field label="Health check URL"><input name="healthCheckUrl" defaultValue={s.healthCheckUrl ?? ""} className="input" /></Field>
                  <Field label="Description"><input name="description" defaultValue={s.description ?? ""} className="input" /></Field>
                  <Field label="Provider"><Select name="provider" options={["vercel", "netlify", "aws", "other"]} defaultValue={s.provider} /></Field>
                  <Field label="Vercel project id"><input name="vercelProjectId" defaultValue={s.vercelProjectId ?? ""} className="input" /></Field>
                  <Field label="Display"><Select name="display" options={DISPLAY_STATES} defaultValue={s.display} /></Field>
                  <Field label="Activation"><Select name="activation" options={ACTIVATION_STATES} defaultValue={s.activation} /></Field>
                  <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={s.sortOrder} className="input" /></Field>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="iframeAllowed" defaultChecked={s.iframeAllowed} /> Allow iframe embed
                  </label>
                  <div className="flex gap-2 md:col-span-3">
                    <SubmitButton>Save</SubmitButton>
                  </div>
                </form>
              </details>
              <div className="mt-4 flex gap-2">
                <form action={checkSite}>
                  <input type="hidden" name="id" value={s.id} />
                  <SubmitButton className="btn-ghost" pendingText="Checking…">Run health check</SubmitButton>
                </form>
                <form action={deleteSite}>
                  <input type="hidden" name="id" value={s.id} />
                  <SubmitButton className="btn-danger" confirm={`Remove ${s.title}?`}>Remove</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
