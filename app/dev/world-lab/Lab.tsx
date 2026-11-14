"use client";
// Renderer fixture: the room with stand-in volumes and no database. Used for visual
// iteration and for frame-time profiling of the engine by itself.
import { useEffect, useRef } from "react";
import { Engine } from "@/components/estate/world/engine/engine";
import { localKit } from "@/components/estate/world/engine/props";
import { desktopPage, phonePage } from "@/components/estate/world/sheets";
import { parseRoute, type Place } from "@/lib/estate/world";

export default function Lab() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const small = innerWidth < 700;
    const shelves = ["stacks-ai-agents", "stacks-data-knowledge", "stacks-web-apps", "stacks-client-work"];
    const counts = [4, 5, 2, 3];
    const names = ["Mission Control", "AI Engineer Platform", "Polymarket MCP Server", "Biotech Research Ingestion", "Knowledge Services", "AI Engineer Research Library", "Biotech Knowledge Platform", "Lead Analytics", "Podcast Ingestion Pipeline", "The Library", "Overtech Digital Services", "Vantage Movers", "GoWipe", "Daryl Davis"];
    let n = 0;
    const volumes = shelves.flatMap((shelf, s) =>
      Array.from({ length: counts[s] }, (_, i) => ({ slug: "v" + n, title: names[n++], shelf, position: i + 1, leaves: 5 })),
    );
    const engine = new Engine({
      canvas: ref.current!,
      tier: small ? "low" : "high",
      reduced: new URLSearchParams(location.search).has("still"),
      scene: "/travellers-rest/world-v2" + (small ? "-low" : "") + ".glb",
      portrait: "/travellers-rest/archive/judge-overton.webp",
      kit: localKit(small ? "low" : "high"),
      volumes,
      companion: { slug: "travellers-rest-house-book", title: "The house book", shelf: null, position: 1, leaves: 4 },
      objects: [],
      metrics: small ? phonePage : desktopPage,
      events: { ready() {}, progress() {}, failed() {}, select(t) { if (t.kind === "place") location.hash = t.place; if (t.kind === "book") location.hash = "book/" + t.slug; }, hover() {}, arrive() {}, travel() {}, settled() {}, scan() {} },
    });
    engine.single = small;
    const go = () => {
      const route = parseRoute(location.hash, (f) => (f.kind === "book" ? (f.slug.startsWith("v") ? "cabinet" : "desk") : "desk") as Place) ?? { place: "library" as Place, focus: null };
      engine.setRoute(route, new URLSearchParams(location.search).has("instant"));
    };
    go();
    addEventListener("hashchange", go);
    (window as unknown as { engine: Engine }).engine = engine;
    return () => {
      removeEventListener("hashchange", go);
      engine.dispose();
    };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <canvas ref={ref} tabIndex={0} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
