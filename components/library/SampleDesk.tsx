"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Experience from "./Experience";
import { FullReader } from "./Reading";
import { shelves, type Collection } from "@/lib/library/model";
import {
  type SampleDraft,
  validateEdits,
  applyEdits,
} from "@/lib/library/sample-edits";

const storageKey = "overton-library-sample-drafts-v1";
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("sample-edit", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("sample-edit", cb);
  };
}
function read() {
  try {
    return localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "[]";
  }
}
export default function SampleDesk({
  base,
  initialQuery,
  editor = false,
}: {
  base: Collection;
  initialQuery: string;
  editor?: boolean;
}) {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  let entries: SampleDraft[] = [];
  let invalid = false;
  try {
    entries = validateEdits(JSON.parse(raw), base);
  } catch {
    invalid = true;
  }
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(base.volumes[0]?.slug ?? "");
  const [importText, setImportText] = useState("");
  const data = applyEdits(base, entries);
  const options = [
    ...base.volumes,
    ...entries.filter((d) => !base.volumes.some((v) => v.slug === d.slug)),
  ];
  const original = base.volumes.find((v) => v.slug === selected);
  const draft = entries.find((d) => d.slug === selected);
  const params = new URLSearchParams(initialQuery);
  if (!editor) {
    const v = data.volumes.find((v) => v.slug === params.get("read"));
    if (params.has("read"))
      return v ? (
        <FullReader v={v} source="fixtures" admin="samples" />
      ) : (
        <main className="library catalog-page">
          <h1>Volume unavailable</h1>
          <Link href="/samples?catalog=1">Sample catalog</Link>
        </main>
      );
    return (
      <Experience
        data={data}
        initialQuery={initialQuery}
        catalog={params.get("catalog") === "1"}
        admin="samples"
      />
    );
  }
  function save(value: unknown) {
    try {
      const checked = validateEdits(value, base);
      localStorage.setItem(storageKey, JSON.stringify(checked));
      window.dispatchEvent(new Event("sample-edit"));
      setStatus("Saved in this browser.");
    } catch (e) {
      setStatus(
        e instanceof Error && !e.message.startsWith("[")
          ? e.message
          : "Check the draft fields and shelf position.",
      );
    }
  }
  return (
    <main className="library catalog-page sandbox">
      <span className="eyebrow">Local sample collection</span>
      <h1>Placement desk</h1>
      <p>
        Local demo only. Changes are saved in this browser and never written to
        Neon.
      </p>
      <Link className="text-link" href="/samples">
        Preview the sample library →
      </Link>
      {invalid && (
        <p>
          Stored sample data could not be read. Import a valid backup or reset
          the desk.
        </p>
      )}
      <label>
        Volume
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setStatus("");
          }}
        >
          {options.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.title}
            </option>
          ))}
          <option value="">New sample volume</option>
        </select>
      </label>
      <form
        key={selected + ":" + raw}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const slug = String(fd.get("slug"));
          const row = {
            slug,
            title: fd.get("title"),
            summary: fd.get("summary"),
            notes: fd.get("notes"),
            shelf: fd.get("shelf"),
            position: Number(fd.get("position")),
            visible: fd.get("visible") === "on",
          };
          save([...entries.filter((d) => d.slug !== slug), row]);
        }}
      >
        <label>
          Slug
          <input
            name="slug"
            pattern="demo-[a-z0-9-]+"
            required
            readOnly={!!selected}
            defaultValue={selected || "demo-"}
          />
        </label>
        <label>
          Title
          <input
            name="title"
            required
            defaultValue={draft?.title ?? original?.title}
          />
        </label>
        <label>
          Summary
          <textarea
            name="summary"
            required
            defaultValue={draft?.summary ?? original?.summary}
          />
        </label>
        <label>
          Second page
          <textarea
            name="notes"
            defaultValue={draft?.notes ?? original?.pages[1]?.blocks[0]?.text}
          />
        </label>
        <div className="desk-fields">
          <label>
            Shelf
            <select
              name="shelf"
              defaultValue={draft?.shelf ?? original?.shelf ?? shelves[0].slug}
            >
              {shelves.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Slot
            <input
              type="number"
              name="position"
              min={1}
              max={24}
              required
              defaultValue={draft?.position ?? original?.position ?? 3}
            />
          </label>
        </div>
        <label className="setting">
          <input
            type="checkbox"
            name="visible"
            defaultChecked={draft ? draft.visible : !!original}
          />{" "}
          Visible in sample library
        </label>
        <button className="folio-button">Save sample volume</button>
      </form>
      <p role="status">{status}</p>
      <details>
        <summary>Export, import or reset samples</summary>
        <label>
          Draft backup
          <textarea
            aria-label="Draft backup"
            value={importText || raw}
            onChange={(e) => setImportText(e.target.value)}
          />
        </label>
        <button
          className="folio-button"
          onClick={() => {
            try {
              save(JSON.parse(importText || raw));
            } catch {
              setStatus("Invalid backup JSON.");
            }
          }}
        >
          Import backup
        </button>{" "}
        <button
          className="folio-button"
          onClick={() => {
            save([]);
            setImportText("");
          }}
        >
          Reset sample changes
        </button>
      </details>
    </main>
  );
}
