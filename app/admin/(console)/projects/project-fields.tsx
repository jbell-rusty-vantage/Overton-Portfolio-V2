import { ACTIVATION_STATES, DISPLAY_STATES, Field, Select } from "@/components/admin/ui";
import { PROJECT_STATUSES } from "./constants";

type ProjectLike = {
  title: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  status: string;
  stageCode: string | null;
  clientId: string | null;
  startedOn: Date | null;
  endedOn: Date | null;
  tags: string[];
  display: string;
  activation: string;
  featuredRank: number | null;
};

const ymd = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

/** The editable scalar fields of a project, shared by the create and edit forms. */
export function ProjectFields({
  project,
  stages,
  clients,
}: {
  project?: ProjectLike;
  stages: { code: string; label: string }[];
  clients: { id: string; name: string; publicAlias: string | null }[];
}) {
  return (
    <>
      <Field label="Title">
        <input name="title" required defaultValue={project?.title} className="input" />
      </Field>
      <Field label="Slug" hint={project ? undefined : "Optional — generated from the title."}>
        <input name="slug" defaultValue={project?.slug} placeholder="auto" className="input" />
      </Field>
      <Field label="Tagline">
        <input name="tagline" defaultValue={project?.tagline ?? ""} className="input" />
      </Field>
      <div className="md:col-span-3">
        <Field label="Summary">
          <textarea name="summary" rows={3} defaultValue={project?.summary ?? ""} className="input" />
        </Field>
      </div>
      <Field label="Status">
        <Select name="status" options={PROJECT_STATUSES} defaultValue={project?.status ?? "active"} />
      </Field>
      <Field label="Stage">
        <Select
          name="stageCode"
          defaultValue={project?.stageCode ?? ""}
          options={[{ value: "", label: "— none —" }, ...stages.map((s) => ({ value: s.code, label: s.label }))]}
        />
      </Field>
      <Field label="Client">
        <Select
          name="clientId"
          defaultValue={project?.clientId ?? ""}
          options={[
            { value: "", label: "— personal / none —" },
            ...clients.map((c) => ({ value: c.id, label: c.publicAlias ? `${c.name} (${c.publicAlias})` : c.name })),
          ]}
        />
      </Field>
      <Field label="Started on">
        <input name="startedOn" type="date" defaultValue={ymd(project?.startedOn)} className="input" />
      </Field>
      <Field label="Ended on">
        <input name="endedOn" type="date" defaultValue={ymd(project?.endedOn)} className="input" />
      </Field>
      <Field label="Tags" hint="Comma separated.">
        <input name="tags" defaultValue={project?.tags.join(", ") ?? ""} className="input" />
      </Field>
      <Field label="Display">
        <Select name="display" options={DISPLAY_STATES} defaultValue={project?.display ?? "hidden"} />
      </Field>
      <Field label="Activation">
        <Select name="activation" options={ACTIVATION_STATES} defaultValue={project?.activation ?? "tracking"} />
      </Field>
      <Field label="Featured rank" hint="Lower = earlier; blank = not ranked.">
        <input name="featuredRank" type="number" defaultValue={project?.featuredRank ?? ""} className="input" />
      </Field>
    </>
  );
}
