"use client";
import { useState } from "react";
import catalog from "@/assets/travellers-rest/archive/catalog.json";
import { base } from "@/lib/estate/model";
import { Icon } from "./Marks";

const groups = [
  { label: "All objects", ids: [] },
  {
    label: "People",
    ids: [
      "judge-overton",
      "andrew-jackson",
      "mary-overton",
      "william-franklin",
      "first-residents",
    ],
  },
  {
    label: "Law & politics",
    ids: [
      "overton-letter",
      "murfree-leeper",
      "election-invitation",
      "tennessee-map",
    ],
  },
  {
    label: "The house",
    ids: ["center-hall", "house-color", "south-elevation"],
  },
];
export default function Collection({
  examine,
  book,
}: {
  examine: (id: string) => void;
  book: string | null;
}) {
  const [filter, setFilter] = useState(0);
  const records = [...catalog.plates, ...catalog.references];
  const objects = filter
    ? records.filter((r) => groups[filter].ids.includes(r.id))
    : records;
  return (
    <section className="ea-wrap ea-section">
      <p className="ea-overline">
        <span className="ea-rule" /> The archive
      </p>
      <div className="ea-section-heading">
        <h1 tabIndex={-1}>The historical collection</h1>
        {book && (
          <a className="ea-button dark" href={book}>
            <Icon name="book" />
            Read the house book
          </a>
        )}
      </div>
      <p className="ea-lede">
        Follow the house through court reports, family portraits, political
        correspondence and records of the people who lived here.
      </p>
      <div className="ea-filters" aria-label="Filter historical records">
        {groups.map((g, i) => (
          <button
            key={g.label}
            onClick={() => setFilter(i)}
            aria-pressed={filter === i}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="ea-object-grid">
        {objects.map((r) => {
          const photo = "asset" in r && !r.referenceOnly;
          return (
            <button
              className="ea-object"
              key={r.id}
              onClick={() => examine(r.id)}
            >
              {photo ? (
                <div className={"ea-object-image object-" + r.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={base + "archive/" + r.id + ".webp"}
                    alt=""
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="ea-record-slip">
                  <Icon
                    name={r.id === "south-elevation" ? "map" : "file"}
                    size={33}
                  />
                  <span>Collection record</span>
                </div>
              )}
              <span className="ea-object-text">
                <small className="ea-overline">
                  {"date" in r ? r.date : "Museum documentation"}
                </small>
                <strong>{r.title}</strong>
                <Icon name="diagonal" size={16} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
