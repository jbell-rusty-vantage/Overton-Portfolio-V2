"use client";
import { useEffect, useRef, useState } from "react";
import type { EstateData } from "@/lib/estate/model";
import { Engine } from "./world/engine/engine";
import { desktopPage } from "./world/sheets";

/** The entrance's live first frame uses the same authorized shell and furniture.
 * Failure leaves the existing illustration visible; entry disposes this renderer. */
export default function EntranceLive({ data }: { data: EstateData }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const world = data.program?.world, program = data.program;
    if (!world || !program || !canvas.current) return;
    let disposed = false;
    const compact = innerWidth <= 700;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = new Engine({ canvas: canvas.current, tier: "low", reduced,
      scene: world.scenes.low, portrait: world.portrait, kit: world.kit?.low ?? null,
      volumes: data.projects.map(v => ({ slug: v.slug, title: v.title, shelf: v.shelf, position: v.position, leaves: v.pages.length, cover: v.cover })),
      companion: { slug: program.book.slug, title: program.book.title, shelf: null, position: 1, leaves: program.book.pages.length },
      objects: world.objects, metrics: desktopPage,
      events: { ready: () => {
        if (disposed) return;
        engine.controller.suspend(true);
        requestAnimationFrame(() => requestAnimationFrame(() => { if (!disposed) { setReady(true); if (reduced || compact) engine.pause(); } }));
      }, progress: () => {}, failed: () => {}, select: () => {}, hover: () => {}, travel: () => {}, arrive: () => {}, settled: () => {}, scan: () => {} },
    });
    engine.setRoute({ place: "approach", focus: null }, true);
    const visibility = () => { if (document.hidden) engine.pause(); else if (!reduced && !compact) { engine.resume(); engine.controller.suspend(true); } };
    document.addEventListener("visibilitychange", visibility);
    return () => { disposed = true; document.removeEventListener("visibilitychange", visibility); engine.dispose(); };
  }, [data]);
  return <canvas ref={canvas} className="ea-live-first-frame" data-ready={ready || undefined} aria-hidden="true" inert />;
}
