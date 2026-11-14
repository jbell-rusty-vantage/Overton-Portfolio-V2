"use client";
import Link from "next/link";
import { useState } from "react";
import { Mark } from "./Marks";
import { SourceNote, VolumeCard } from "./Reading";
import { collectionShelves, matchesCatalog } from "@/lib/library/taxonomy";
import { withinPreview } from "@/lib/library/paths";
import { type Volume, type Collection, type ReadingScope } from "@/lib/library/types";
export default function Catalog({
  data,
  startKind = "All",
  admin = false,
}: {
  data: Collection;
  startKind?: string;
  admin?: ReadingScope;
}) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState(startKind);
  const shelves = collectionShelves(data);
  const titleFor = (v: Volume) => shelves.find((s) => s.slug === v.shelf)?.title;
  const matches = data.volumes.filter(
    (v) =>
      (kind === "All" || v.kind === kind) &&
      matchesCatalog(v, search, titleFor(v)),
  );
  return (
    <main className="library catalog-page"><nav aria-label="Library navigation"><Link href={withinPreview("/", admin)}>Portfolio</Link>{" · "}<Link href={withinPreview("/library", admin)}>Travellers Rest</Link>{" · "}<Link href="/resume">Résumé</Link></nav>
      <span className="eyebrow">The collection</span>
      <h1>Library catalog</h1>
      <div className="catalog-input">
        <Mark name="search" />
        <input
          type="search"
          aria-label="Search the catalog"
          placeholder="Search titles, subjects, or shelves"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="filters">
        {["All", "Project", "Journal", "Evolution", "Favorite", "Book"].map(
          (k) => (
            <button
              key={k}
              aria-pressed={k === kind}
              onClick={() => setKind(k)}
            >
              {k === "All"
                ? "All volumes"
                : k === "Journal"
                  ? "Journal"
                  : k + "s"}
            </button>
          ),
        )}
      </div>
      <div className="catalog-status">
        <span aria-live="polite">
          {matches.length} {matches.length === 1 ? "volume" : "volumes"}
        </span>
        <SourceNote source={data.source} />
      </div>
      <div className="card-grid">
        {matches.map((v) => (
          <VolumeCard key={v.kind + "/" + v.slug} v={v} admin={admin} shelfTitle={titleFor(v)} catalog />
        ))}
      </div>
      {!matches.length && (
        <p className="empty">
          {data.source === "unavailable"
            ? "The collection could not be loaded. Reload to try again."
            : search
              ? "No volumes match this search."
              : "There are no volumes in this section yet."}
        </p>
      )}
    </main>
  );
}
