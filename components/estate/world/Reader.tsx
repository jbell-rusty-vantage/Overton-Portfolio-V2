"use client";
/* The readable surface of an open volume. The two pages below are ordinary DOM —
   selectable text, working links, real pictures and video — and the engine registers
   each one to its sheet of paper with a projective transform. While a leaf turns, the
   same page is carried on the moving paper as a texture printed from the DOM's own
   layout, and the DOM steps aside.

   How the paper answers a hand:
   - a click or tap on the right page turns on, on the left page turns back (one page
     at a time: the left third turns back). Links, pictures and film keep their own
     behaviour; a drag across text selects it; a click on words waits a moment so a
     double-click can still pick a word;
   - the outer margin is the leaf's edge: dragged, the leaf follows the pointer and
     falls whichever way it was let go. On a touch screen any sideways drag does this;
   - the head and foot margins take hold of the book itself: dragged far enough, or
     flung, it goes back to its shelf; let go early, it settles back open. On a touch
     screen an up-or-down drag does the same. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { houseShelves } from "@/lib/estate/world";
import { detailHref, withinPreview } from "@/lib/library/paths";
import { type Volume } from "@/lib/library/types";
import { Icon } from "../Marks";
import type { Engine } from "./engine/engine";
import { drawSound, homeSound, leafDown, leafSound } from "./bookSound";
import { paginate } from "./paginate";
import { findSheet, sheetHtml, type Markup, type PageMetrics, type Sheet } from "./sheets";
import "./book.css";
import { FigureViewer } from "@/components/library/ProjectReport";

export type Mark = { leaf: string; part: number };
type Gesture = {
  id: number;
  x: number;
  y: number;
  side: "left" | "right";
  zone: string;
  /** On something with a behaviour of its own: a link, a picture, a film. */
  live: boolean;
  /** On a film, whose own controls are dragged. */
  film: boolean;
  touch: boolean;
  onText: boolean;
  selected: boolean;
  mode: "" | "native" | "leaf" | "book" | "none";
  dir: 1 | -1;
  /** Recent pointer speed along x, px per ms. */
  vx: number;
  lastX: number;
  lastT: number;
  t: number;
};

export default function Reader({
  volume,
  engine,
  metrics,
  single,
  settled,
  start,
  admin,
  shelfName,
  sound = false,
  onMark,
  onClose,
  onReport,
  suspended = false,
}: {
  volume: Volume;
  engine: Engine;
  metrics: PageMetrics;
  single: boolean;
  /** The book has arrived open in the visitor's hands. */
  settled: boolean;
  start: Mark | null;
  admin: boolean;
  shelfName: string;
  /** The visitor has chosen sound on: paper and boards may be heard. */
  sound?: boolean;
  onMark: (mark: Mark) => void;
  onClose: () => void;
  onReport?: (section: string) => void;
  /** Keep the laid-out book and its marker beneath a report. */
  suspended?: boolean;
}) {
  const measure = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const region = useRef<HTMLDivElement>(null);
  const [sheets, setSheets] = useState<Sheet[] | null>(null);
  const [spread, setSpread] = useState(0);
  const [turning, setTurning] = useState(false);
  const [contents, setContents] = useState(false);
  const [zoom, setZoom] = useState<{ url: string; text: string } | null>(null);
  const [hold, setHold] = useState<"" | "leaf" | "book" | "armed">("");
  const per = single ? 1 : 2;
  const startRef = useRef(start);
  /** The spread the visitor has asked for; `spread` follows once the leaf has landed. */
  const want = useRef(0);
  /** A leaf in the air between two spreads. */
  const flight = useRef<{ a: number; b: number } | null>(null);
  const serial = useRef(0);
  const slug = volume.slug;
  const audible = useRef(sound);
  useEffect(() => {
    audible.current = sound;
  }, [sound]);
  // The book is heard leaving its shelf and, when it is put back, reaching it.
  useEffect(() => {
    if (audible.current) drawSound();
    return () => {
      if (audible.current) homeSound(0.9);
    };
  }, []);

  const canReport = !!onReport;
  const markup: Markup = useMemo(
    () => ({ slug, volumeTitle: volume.title, href: (url: string) => withinPreview(url, admin), report: canReport }),
    [slug, volume.title, admin, canReport],
  );
  // Lay the volume out for this page size, once its pictures' shapes are known.
  useEffect(() => {
    let live = true;
    const host = measure.current;
    if (!host) return;
    const project = volume.kind === "Project";
    void paginate(volume, metrics, host, {
      single,
      author: project ? "John Overton Bell" : "Travellers Rest",
      series:
        houseShelves.find((s) => s.shelf === volume.shelf)?.title ??
        (project ? "Portfolio" : "A visitor’s companion"),
      detail: detailHref(volume),
      markup,
    }).then((pages) => {
      if (!live || !pages.length) return;
      const at = Math.max(0, Math.floor(Math.max(0, findSheet(pages, startRef.current)) / per));
      want.current = at;
      setSheets(pages);
      setSpread(at);
    });
    return () => {
      live = false;
    };
  }, [volume, metrics, per, single, markup]);
  const spreads = sheets ? Math.ceil(sheets.length / per) : 0;
  const pair = useCallback(
    (index: number) => {
      if (!sheets) return { left: null, right: null };
      return single
        ? { left: null, right: sheets[index] ?? null }
        : { left: sheets[index * 2] ?? null, right: sheets[index * 2 + 1] ?? null };
    },
    [sheets, single],
  );
  const fraction = useCallback((index: number) => (spreads > 1 ? index / (spreads - 1) : 0), [spreads]);
  const shown = useMemo(() => pair(spread), [pair, spread]);
  const current = shown.left ?? shown.right;
  const html = useMemo(
    () => ({
      left: shown.left ? sheetHtml(shown.left, markup, metrics) : "",
      right: shown.right ? sheetHtml(shown.right, markup, metrics) : "",
    }),
    [shown, markup, metrics],
  );

  useLayoutEffect(() => {
    engine.setPageMetrics(slug, metrics);
    engine.attachPages(left.current, right.current);
    return () => {
      // Invalidate whichever completion is pending now, not the serial at mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      serial.current++;
      engine.volume(slug)?.snapTurn();
      engine.attachPages(null, null);
    };
  }, [engine, slug, metrics]);
  // A book taken hold of in the room itself (in flight, or by its boards) goes back
  // the same way the bar's control sends it.
  useEffect(() => {
    engine.onPutBack(onClose);
    return () => engine.onPutBack(null);
  }, [engine, onClose]);
  // The paper always carries the spread that is open.
  useEffect(() => {
    if (!sheets || flight.current) return;
    const p = pair(spread);
    engine.setSpread(slug, p.left, p.right, fraction(spread));
  }, [sheets, spread, engine, slug, pair, fraction]);
  // Record the place: a stable leaf key plus the position inside a long leaf.
  useEffect(() => {
    if (!current) return;
    onMark({ leaf: current.leaf, part: current.part });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report once per page change
  }, [current?.leaf, current?.part]);

  /** Start a leaf from the place asked for to the one beside it; `held` leaves it in
      the visitor's fingers. Returns false when there is no such leaf. */
  const lift = useCallback(
    (dir: 1 | -1, held: boolean) => {
      const from = want.current,
        next = from + dir;
      if (!sheets || flight.current || next < 0 || next >= spreads) return false;
      const id = ++serial.current;
      const p = pair(next);
      flight.current = { a: from, b: next };
      if (!held) want.current = next;
      setTurning(true);
      if (audible.current && settled) leafSound();
      const landed = (turned: boolean) => {
        if (audible.current && !turned) leafDown();
        if (serial.current !== id) return;
        flight.current = null;
        want.current = turned ? next : from;
        setSpread(want.current);
        setTurning(false);
      };
      void (held
        ? engine.grabLeaf(slug, dir, p.left, p.right, fraction(next))
        : engine.turn(slug, dir, p.left, p.right, fraction(next))
      ).then(landed);
      return true;
    },
    [sheets, spreads, pair, fraction, engine, slug, settled],
  );
  const go = useCallback(
    (to: number) => {
      if (!sheets) return;
      const next = Math.max(0, Math.min(spreads - 1, to));
      const from = want.current;
      if (next === from) return;
      const air = flight.current;
      // Asked for the page it just left while the leaf is still in the air: the same
      // leaf comes back.
      if (air && (next === air.a || next === air.b) && engine.volume(slug)?.reverseTurn()) {
        want.current = next;
        return;
      }
      // Repeated clicks/key repeat cannot skip a spread that has not landed yet.
      if (air) return;
      if (Math.abs(next - from) === 1 && settled) {
        lift(next > from ? 1 : -1, false);
        return;
      }
      engine.volume(slug)?.snapTurn();
      serial.current++;
      flight.current = null;
      want.current = next;
      const p = pair(next);
      engine.setSpread(slug, p.left, p.right, fraction(next));
      setSpread(next);
      setTurning(false);
    },
    [sheets, spreads, pair, fraction, settled, engine, slug, lift],
  );
  const goLeaf = useCallback(
    (leaf: string) => {
      if (!sheets) return;
      const at = findSheet(sheets, { leaf, part: 1 });
      if (at >= 0) go(Math.floor(at / per));
    },
    [sheets, go, per],
  );
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (suspended) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLVideoElement) return;
      if (zoom) {
        if (e.key === "Escape") setZoom(null);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(want.current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(want.current - 1);
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(spreads - 1);
      else if (e.key === "Escape") {
        if (contents) setContents(false);
        else onClose();
      } else if ((e.key === "Enter" || e.key === " ") && e.target instanceof HTMLImageElement && e.target.dataset.zoom !== undefined) {
        e.preventDefault();
        setZoom({ url: e.target.dataset.zoomUrl || e.target.currentSrc || e.target.src, text: e.target.alt });
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [go, spreads, onClose, contents, zoom, suspended]);
  // Move focus to the reading surface when the book arrives.
  useEffect(() => {
    if (settled && !suspended) region.current?.focus({ preventScroll: true });
  }, [settled, suspended]);
  const visible = settled && !turning && !!sheets && !suspended;
  // Real text replaces printed text as soon as the paper is still.
  useLayoutEffect(() => {
    engine.setInk(slug, !visible);
    return () => engine.setInk(slug, true);
  }, [visible, engine, slug]);

  // Hands on the paper. Everything a gesture needs is read through this ref, so the
  // listeners are bound once.
  const live = useRef({ go, lift, single, onClose, goLeaf, onReport, current, suspended });
  useEffect(() => {
    live.current = { go, lift, single, onClose, goLeaf, onReport, current, suspended };
  });
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    let g: Gesture | null = null;
    let pending = 0;
    const range = document.createRange();
    const picked = () => !!window.getSelection()?.toString();
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      g = null;
    };
    function down(e: PointerEvent) {
      if (live.current.suspended) return;
      // A second press cancels a turn that was waiting to see if this is a double-click.
      window.clearTimeout(pending);
      if (g || e.button !== 0) return;
      const target = e.target as HTMLElement;
      const page = target.closest<HTMLElement>(".wb-page");
      if (!page) return;
      const zone = target.closest<HTMLElement>("[data-zone]")?.dataset.zone ?? "";
      let onText = false;
      const words = zone ? null : target.closest<HTMLElement>("p, h1, h2, h3, pre, figcaption, dd, dt, li");
      if (words) {
        range.selectNodeContents(words);
        for (const r of range.getClientRects())
          if (e.clientX >= r.left - 2 && e.clientX <= r.right + 2 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2) onText = true;
      }
      g = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        side: page.classList.contains("left") ? "left" : "right",
        zone,
        live: !!target.closest("a, button, video, [data-zoom]"),
        film: !!target.closest("video"),
        touch: e.pointerType !== "mouse",
        onText,
        selected: picked(),
        mode: "",
        dir: 1,
        vx: 0,
        lastX: e.clientX,
        lastT: e.timeStamp,
        t: 0,
      };
      // The margins are handles, not text: no selection starts there.
      if (zone) e.preventDefault();
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
    }
    function move(e: PointerEvent) {
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x,
        dy = e.clientY - g.y;
      if (e.timeStamp > g.lastT) {
        g.vx = g.vx * 0.5 + ((e.clientX - g.lastX) / (e.timeStamp - g.lastT)) * 0.5;
        g.lastX = e.clientX;
        g.lastT = e.timeStamp;
      }
      if (!g.mode) {
        if (Math.hypot(dx, dy) < 7) return;
        const across = Math.abs(dx) > Math.abs(dy) * 1.15;
        // Under a mouse a link or picture keeps its own drag; under a finger a swipe
        // across one still turns the leaf (only a film's controls are left alone).
        if (g.live && (!g.touch || g.film)) g.mode = "native";
        else if (g.zone === "leaf") {
          g.mode = "leaf";
          g.dir = g.side === "right" ? 1 : -1;
        } else if (g.zone === "leaf-back") {
          g.mode = "leaf";
          g.dir = -1;
        } else if (g.zone === "book") g.mode = "book";
        else if (g.touch && !picked()) {
          g.mode = across ? "leaf" : "book";
          g.dir = dx < 0 ? 1 : -1;
        } else g.mode = "native";
        if (g.mode === "leaf") {
          if (live.current.lift(g.dir, true)) setHold("leaf");
          else g.mode = "none";
        } else if (g.mode === "book") {
          if (engine.grabBook(g.x, g.y)) setHold("book");
          else g.mode = "none";
        }
      }
      if (g.mode === "leaf") g.t = engine.scrubLeaf(slug, g.dir, g.x, g.y, e.clientX, e.clientY);
      else if (g.mode === "book") setHold(engine.dragBook(e.clientX, e.clientY) ? "armed" : "book");
    }
    function up(e: PointerEvent) {
      if (!g || e.pointerId !== g.id) return;
      const was = g;
      end();
      if (was.mode === "leaf") {
        // Let go past the middle, or flicked the way it was going: it falls over.
        const flick = Math.abs(was.vx) > 0.45 ? Math.sign(-was.vx) === was.dir : null;
        engine.dropLeaf(slug, flick ?? was.t > 0.36);
        setHold("");
        return;
      }
      if (was.mode === "book") {
        const result = engine.releaseBook();
        setHold("");
        if (result === "return") live.current.onClose();
        return;
      }
      if (was.mode || was.live || was.selected || picked()) return;
      // A plain click on paper turns the leaf.
      const now = live.current;
      let dir: 1 | -1 = was.side === "right" ? 1 : -1;
      if (was.zone === "leaf-back") dir = -1;
      else if (now.single && !was.zone) {
        const box = (e.target as HTMLElement).closest(".wb-page")?.getBoundingClientRect();
        if (box && e.clientX < box.left + box.width * 0.3) dir = -1;
      }
      const turn = () => live.current.go(want.current + dir);
      if (was.onText && !was.touch) pending = window.setTimeout(turn, 240);
      else turn();
    }
    function cancel(e: PointerEvent) {
      if (!g || e.pointerId !== g.id) return;
      const was = g;
      end();
      if (was.mode === "leaf") engine.dropLeaf(slug, false);
      if (was.mode === "book") engine.releaseBook(true);
      setHold("");
    }
    function click(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-report]")) {
        e.preventDefault();
        live.current.onReport?.(volume.pages.some((page) => page.key === live.current.current?.leaf) ? live.current.current!.leaf : volume.pages[0]?.key ?? "overview");
        return;
      }
      const jump = target.closest<HTMLElement>("a[data-goto]");
      if (jump) {
        e.preventDefault();
        live.current.goLeaf(jump.dataset.goto!);
        return;
      }
      const film = target.closest<HTMLVideoElement>("video.wb-media");
      if (film && !film.controls) {
        // First touch starts the film and brings the browser's controls with it.
        film.controls = true;
        film.closest(".wb-figure")?.setAttribute("data-playing", "");
        void film.play().catch(() => {});
        return;
      }
      const picture = target.closest<HTMLImageElement>("img[data-zoom]");
      if (picture) setZoom({ url: picture.dataset.zoomUrl || picture.currentSrc || picture.src, text: picture.alt });
    }
    el.addEventListener("pointerdown", down);
    el.addEventListener("click", click);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("click", click);
      window.clearTimeout(pending);
      end();
    };
  }, [engine, slug, volume.pages]);

  const leaves = useMemo(() => {
    if (!sheets) return [];
    const out: { key: string; title: string; index: number }[] = [];
    sheets.forEach((s, index) => {
      if (s.kind === "title") out.push({ key: "front", title: "Title page", index });
      else if (s.kind === "contents" && s.part === 3) out.push({ key: "contents", title: "Contents", index });
      else
        for (const p of s.pieces)
          if (p.kind === "chapter") out.push({ key: p.leaf, title: p.text, index });
    });
    return out;
  }, [sheets]);
  const open = useMemo(
    () => new Set([...(shown.left?.leaves ?? []), ...(shown.right?.leaves ?? [])]),
    [shown],
  );
  const name = (s: Sheet) =>
    s.kind === "plate" || s.kind === "title" ? "Title page" : s.kind === "contents" ? "Contents" : s.kind === "end" ? "The end" : s.leafTitle;
  const position = current ? name(shown.right && shown.right.kind === "flow" ? shown.right : current) : "";

  return (
    <div
      className="wb-reader"
      data-volume={slug}
      inert={suspended}
      aria-hidden={suspended || undefined}
      data-visible={visible || undefined}
      data-single={single || undefined}
      data-turning={turning || undefined}
      data-first-page={current?.folio}
      data-last-page={(shown.right ?? shown.left)?.folio}
      data-total-pages={sheets?.length}
      data-hold={hold || undefined}
      style={
        {
          "--wb-w": metrics.width + "px",
          "--wb-h": metrics.height + "px",
          "--wb-top": metrics.top + "px",
          "--wb-side": metrics.side + "px",
          "--wb-bottom": metrics.bottom + "px",
          "--wb-body": metrics.body + "px",
          "--wb-line": metrics.line,
        } as React.CSSProperties
      }
    >
      <div
        ref={region}
        className="wb-pages"
        role="region"
        tabIndex={-1}
        aria-label={volume.title + (position ? ", " + position : "")}
      >
        <article
          ref={left}
          className="wb-page left"
          aria-hidden={single || undefined}
          dangerouslySetInnerHTML={{ __html: html.left }}
        />
        <article ref={right} className="wb-page right" dangerouslySetInnerHTML={{ __html: html.right }} />
      </div>
      <div ref={measure} className="wb-page wb-measure" aria-hidden="true" />
      {(hold === "book" || hold === "armed") && (
        <p className="wb-hint" role="status">
          {hold === "armed" ? "Let go to put it back" : "Carry it toward its shelf to put it back"}
        </p>
      )}
      {zoom && <FigureViewer {...zoom} close={() => setZoom(null)} />}
      <div className="tw-bar wb-bar" role="toolbar" aria-label={"Reading " + volume.title}>
        <button
          className="tw-icon"
          aria-label="Previous page"
          disabled={turning || spread === 0 || !sheets}
          onClick={() => go(want.current - 1)}
        >
          <Icon name="back" />
        </button>
        <div className="wb-where">
          <button
            className="wb-contents"
            aria-expanded={contents}
            aria-haspopup="menu"
            onClick={() => setContents(!contents)}
          >
            <strong>{volume.title}</strong>
            <span aria-live="polite">
              {sheets
                ? (single ? "Page " : "Pages ") + (current?.folio ?? 1) +
                  (single || !shown.right ? "" : "–" + shown.right.folio) + " of " + sheets.length +
                  (spread === spreads - 1 ? " · End" : "")
                : "Laying out the pages…"}
            </span>
          </button>
          {contents && (
            <div className="wb-menu" role="menu">
              {leaves.map((l) => (
                <button
                  key={l.key}
                  role="menuitem"
                  aria-current={
                    (l.key === "front" ? current?.kind === "title" || current?.kind === "plate" : l.key === "contents" ? current?.kind === "contents" : open.has(l.key))
                      ? "true"
                      : undefined
                  }
                  onClick={() => {
                    setContents(false);
                    go(Math.floor(l.index / per));
                  }}
                >
                  {l.title}
                </button>
              ))}
              {onReport ? <button role="menuitem" onClick={() => { setContents(false); onReport(volume.pages.some((page) => page.key === current?.leaf) ? current!.leaf : volume.pages[0]?.key ?? "overview"); }}>Open full report <Icon name="diagonal" size={13} /></button> : <a role="menuitem" href={withinPreview(detailHref(volume), admin)}>
                Full reading page <Icon name="diagonal" size={13} />
              </a>}
            </div>
          )}
        </div>
        <button
          className="tw-icon"
          aria-label="Next page"
          disabled={turning || !sheets || spread >= spreads - 1}
          onClick={() => go(want.current + 1)}
        >
          <Icon name="arrow" />
        </button>
        {onReport && <button className="tw-pill wb-report-action" aria-label="Open full report" onClick={() => onReport(volume.pages.some((page) => page.key === current?.leaf) ? current!.leaf : volume.pages[0]?.key ?? "overview")}><Icon name="diagonal" size={15} /><span>Full report</span></button>}
        <button className="tw-pill" data-armed={hold === "armed" || undefined} onClick={onClose}>
          <Icon name="close" size={15} />
          <span>{shelfName}</span>
        </button>
      </div>
    </div>
  );
}
