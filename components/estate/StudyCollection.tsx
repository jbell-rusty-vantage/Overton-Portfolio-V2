"use client";
import { useState } from "react";
import catalog from "@/assets/travellers-rest/archive/catalog.json";
import Modal from "@/components/library/Modal";

export default function StudyCollection({
  initial,
  close,
}: {
  initial: string;
  close: () => void;
}) {
  const [selection, choose] = useState(initial);
  const plate = catalog.plates.find((item) => item.id === selection);
  const reference = catalog.references.find((item) => item.id === selection);
  const item = plate ?? reference;
  if (!item) return null;

  return (
    <Modal title="From the collections" wide onClose={close}>
      <div className="tr-archive">
        <label className="tr-small" htmlFor="tr-archive-index">
          From the collections
        </label>
        <select
          id="tr-archive-index"
          value={selection}
          onChange={(e) => choose(e.target.value)}
        >
          <optgroup label="Portraits, documents and architecture">
            {catalog.plates.map((record) => (
              <option key={record.id} value={record.id}>
                {record.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Museum records">
            {catalog.references.map((record) => (
              <option key={record.id} value={record.id}>
                {record.title}
              </option>
            ))}
          </optgroup>
        </select>
        <article
          className={plate && !plate.referenceOnly ? "tr-archive-object" : ""}
        >
          {plate && !plate.referenceOnly && (
            <a
              className="tr-archive-image"
              href={"/travellers-rest/archive/" + plate.id + ".webp"}
              target="_blank"
              rel="noreferrer"
              aria-label={"Enlarge " + plate.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- archival facsimile opens at its delivery resolution */}
              <img
                src={"/travellers-rest/archive/" + plate.id + ".webp"}
                alt={plate.alt}
              />
            </a>
          )}
          <div className="tr-archive-label" aria-live="polite">
            <h2>{item.title}</h2>
            {plate && (
              <p className="tr-small">
                {plate.maker} · {plate.date}
              </p>
            )}
            <p className="tr-archive-caption">{item.caption}</p>
            <a href={item.source} target="_blank" rel="noreferrer">
              {reference?.related
                ? "William’s record"
                : "Open the collection record"}{" "}
              ↗
            </a>
            {plate?.id === "judge-overton" && (
              <a href={plate.context} target="_blank" rel="noreferrer">
                The museum’s painting and Earl’s logbook ↗
              </a>
            )}
            {reference?.related && (
              <a href={reference.related} target="_blank" rel="noreferrer">
                Franklin’s record ↗
              </a>
            )}
            {plate && (
              <details key={plate.id}>
                <summary>Credit and image terms</summary>
                <p>{plate.credit}</p>
                <p>{plate.rights}</p>
                <a href={plate.rightsSource} target="_blank" rel="noreferrer">
                  Read the terms ↗
                </a>
              </details>
            )}
          </div>
        </article>
      </div>
    </Modal>
  );
}
