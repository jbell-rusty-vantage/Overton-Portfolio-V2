"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { Field, Select } from "@/components/admin/ui";
import { DateTimeInput } from "./datetime-input";
import { postEvent, type PostEventState } from "./actions";

type Option = { value: string; label: string };

export function PostEventForm({
  types,
  projects,
  expiryPresets,
  sceneEffects,
}: {
  types: Option[];
  projects: Option[];
  expiryPresets: readonly Option[];
  sceneEffects: readonly string[];
}) {
  const [state, action, pending] = useActionState<PostEventState, FormData>(postEvent, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Submit manually so a validation error does not wipe the form (React resets
  // forms after `action={...}` submissions); reset only after a success.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="mt-5 grid gap-4 md:grid-cols-2"
    >
      <Field label="Type">
        <Select name="typeCode" options={types} />
      </Field>
      <Field label="Title">
        <input name="title" required className="input" placeholder="Now building: the library's reading room" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Summary">
          <textarea name="summary" rows={2} className="input" />
        </Field>
      </div>
      <Field label="URL">
        <input name="url" type="url" placeholder="https://…" className="input" />
      </Field>
      <Field label="Project">
        <Select name="projectId" options={[{ value: "", label: "— none —" }, ...projects]} />
      </Field>
      <Field label="Visibility">
        <Select name="visibility" options={["public", "private"]} defaultValue="public" />
      </Field>
      <Field label="Occurred at" hint="Defaults to now (your local time).">
        <DateTimeInput name="occurredAt" defaultNow />
      </Field>
      <Field label="Expires" hint="Expired signals drop out of the public live feed.">
        <Select name="expiresIn" options={[...expiryPresets]} defaultValue="none" />
      </Field>
      <Field label="Custom expiry" hint="Used only when “Custom” is selected.">
        <DateTimeInput name="expiresAt" />
      </Field>
      <Field label="Scene effect" hint="Optional named effect for the 3D library.">
        <input name="sceneEffect" list="scene-effects" className="input" placeholder="e.g. ring_bell" />
        <datalist id="scene-effects">
          {sceneEffects.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </Field>
      <div className="md:col-span-2">
        <Field label="Payload (JSON object, optional)">
          <textarea name="payload" rows={3} className="input font-mono" placeholder='{"progress": 0.4}' />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Posting…" : "Post event"}
        </button>
        {state.error ? <span className="text-sm text-danger">{state.error}</span> : null}
        {state.ok ? <span className="text-sm text-ok">{state.ok}</span> : null}
      </div>
    </form>
  );
}
