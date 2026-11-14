"use client";
/* Close inspection of an object that is being held. The object itself stays in the
   room, in front of the visitor; this panel carries what belongs beside it: the page
   sequence, zoom, the checked transcription and the archival record. */
import { useEffect, useRef, useState } from "react";
import type { RoomObject } from "@/lib/estate/world";
import { Icon } from "../Marks";
import type { Engine } from "./engine/engine";

/** Bracketed readings are the transcriber's doubts: keep them visible as such. */
function Passage({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\[.*\]$/.test(p) ? (
          <span key={i} className="ti-doubt" title="Uncertain reading">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}
export default function Inspector({
  object,
  engine,
  page,
  settled,
  missing,
  returnLabel,
  onPage,
  onClose,
}: {
  object: RoomObject;
  engine: Engine;
  page: number;
  settled: boolean;
  /** Pages whose scan failed to load. */
  missing: number[];
  returnLabel: string;
  onPage: (page: number) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"about" | "transcript">("about");
  // Magnification and the marked line belong to one scan; another scan starts afresh.
  const [view, setLocal] = useState<{ page: number; zoom: number; marked: number | null }>({
    page,
    zoom: 1,
    marked: null,
  });
  const { zoom, marked } = view.page === page ? view : { zoom: 1, marked: null };
  const setZoom = (z: number) => setLocal({ page, zoom: z, marked });
  const setMarked = (m: number | null, z = zoom) => setLocal({ page, zoom: z, marked: m });
  const heading = useRef<HTMLHeadingElement>(null);
  const pages = object.pages;
  const current = pages[page];
  const transcript = current?.transcript ?? [];
  const anyTranscript = pages.some((p) => p.transcript?.length);
  useEffect(() => {
    if (settled) heading.current?.focus({ preventScroll: true });
  }, [settled]);
  useEffect(() => {
    engine.highlight(object.id, null);
    engine.setView(object.id, { zoom: 1, x: 0, y: 0 });
  }, [page, object.id, engine]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.target instanceof HTMLElement && e.target.closest("button, a, [role=tab]")) return;
      if (e.key === "ArrowRight" && page < pages.length - 1) onPage(page + 1);
      if (e.key === "ArrowLeft" && page > 0) onPage(page - 1);
      if (e.key === "+" || e.key === "=") scale(1.3);
      if (e.key === "-") scale(1 / 1.3);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scale reads the live view from the engine
  }, [page, pages.length, onClose, onPage]);
  function scale(k: number) {
    const view = engine.artifact(object.id)?.view ?? { zoom: 1, x: 0, y: 0 };
    const next = Math.max(1, Math.min(5, view.zoom * k));
    engine.setView(object.id, { ...view, zoom: next });
    setZoom(next);
  }
  function fit() {
    engine.setView(object.id, { zoom: 1, x: 0, y: 0 });
    setZoom(1);
  }
  function mark(i: number) {
    const t = transcript[i];
    const on = marked === i ? null : i;
    engine.highlight(object.id, on === null ? null : { y0: t.y0, y1: t.y1 });
    if (on === null) {
      setMarked(null);
      return;
    }
    // Bring the passage to the middle of the view at a readable size.
    const z = Math.max(engine.artifact(object.id)?.view.zoom ?? 1, 1.8);
    engine.setView(object.id, { zoom: z, x: 0, y: (t.y0 + t.y1) / 2 - 0.5 });
    setMarked(on, z);
  }
  const failed = missing.includes(page);
  return (
    <aside className="ti" aria-label={"Examining " + object.title}>
      <header>
        <p className="tw-over">
          {object.form === "card" ? "Museum record" : "From the collection"} · {object.date}
        </p>
        <h2 ref={heading} tabIndex={-1}>
          {object.title}
        </h2>
        <p className="ti-maker">{object.maker}</p>
      </header>
      {pages.length > 0 && (
        <div className="ti-tools">
          {pages.length > 1 && (
            <div className="ti-pages" role="group" aria-label="Scans in this record">
              <button
                className="tw-icon"
                aria-label="Previous scan"
                disabled={page === 0}
                onClick={() => onPage(page - 1)}
              >
                <Icon name="back" size={16} />
              </button>
              <span aria-live="polite">
                Scan {page + 1} of {pages.length}
              </span>
              <button
                className="tw-icon"
                aria-label="Next scan"
                disabled={page >= pages.length - 1}
                onClick={() => onPage(page + 1)}
              >
                <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
          <div className="ti-zoom" role="group" aria-label="Magnification">
            <button className="tw-icon" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => scale(1 / 1.4)}>
              −
            </button>
            <button className="tw-chip" onClick={fit} title="Fit the whole sheet">
              {Math.round(zoom * 100)}% · Fit
            </button>
            <button className="tw-icon" aria-label="Zoom in" disabled={zoom >= 5} onClick={() => scale(1.4)}>
              +
            </button>
          </div>
        </div>
      )}
      {current && <p className="ti-label">{current.label}</p>}
      {failed && (
        <p className="ti-error" role="status">
          This scan could not be loaded. The object is still in your hands, and
          the complete record is available from its source.{" "}
          {object.links[0] && (
            <a href={object.links[0].url} target="_blank" rel="noreferrer">
              {object.links[0].label} ↗
            </a>
          )}
        </p>
      )}
      {anyTranscript && (
        <div className="ti-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "about"} onClick={() => setTab("about")}>
            About
          </button>
          <button role="tab" aria-selected={tab === "transcript"} onClick={() => setTab("transcript")}>
            Transcription
          </button>
        </div>
      )}
      <div className="ti-body" role={anyTranscript ? "tabpanel" : undefined}>
        {tab === "transcript" && anyTranscript ? (
          <>
            {transcript.length ? (
              <>
                <p className="ti-note">
                  Manuscript transcription · reading confidence {current.confidence}. Select a
                  line to find it on the page. Bracketed words are uncertain.
                </p>
                <ol className="ti-lines">
                  {transcript.map((t, i) => (
                    <li key={i}>
                      <button aria-pressed={marked === i} onClick={() => mark(i)}>
                        <Passage text={t.text} />
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="ti-note">
                {current.kind === "blank"
                  ? "This side of the sheet is blank."
                  : "This scan has not been transcribed. Read it from the manuscript."}
              </p>
            )}
            {object.transcriptNote && (
              <details className="ti-details">
                <summary>How this text was checked</summary>
                <p>{object.transcriptNote}</p>
              </details>
            )}
          </>
        ) : (
          <>
            <p>{object.caption}</p>
            {object.summary && object.form !== "card" && (
              <p className="ti-commentary">{object.summary}</p>
            )}
            {current?.alt && <p className="ti-alt">{current.alt}</p>}
            <div className="ti-links">
              {object.links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                  {l.label} <Icon name="diagonal" size={13} />
                </a>
              ))}
            </div>
            {object.credit && (
              <details className="ti-details">
                <summary>Credit and image terms</summary>
                <p>{object.credit}</p>
                <p>{object.rights}</p>
                {object.rightsSource && (
                  <a href={object.rightsSource} target="_blank" rel="noreferrer">
                    Read the terms ↗
                  </a>
                )}
              </details>
            )}
            {object.form === "card" && (
              <p className="ti-note">
                The museum holds the image for this record. It is linked here
                while reuse terms are unresolved.
              </p>
            )}
          </>
        )}
      </div>
      <footer>
        <button className="tw-pill solid" onClick={onClose}>
          <Icon name="back" size={15} />
          {returnLabel}
        </button>
      </footer>
    </aside>
  );
}
