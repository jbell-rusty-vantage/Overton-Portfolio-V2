"use client";
import { useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/estate/world";
import type { Speech } from "./voice";

const stops: { place: Place; cue: string; title: string }[] = [
  { place: "library", cue: "room", title: "The library" },
  { place: "entry", cue: "object-first-residents", title: "Before the house" },
  { place: "entry", cue: "object-william-franklin", title: "Enslaved people at Travellers Rest" },
  { place: "desk", cue: "letters", title: "The writing table" },
  { place: "reports", cue: "object-murfree-leeper", title: "The law reports" },
  { place: "cabinet", cue: "projects", title: "John’s projects" },
];
export default function GuidedTour({ available, arrived, travelling, speech, go, speak, begin, stop, pause, resume }: {
  available: boolean; arrived: Place | null; travelling: boolean; speech: Speech | null;
  go: (place: Place) => void; speak: (cue: string) => void; begin: () => void;
  stop: () => void; pause: () => void; resume: () => void;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState("");
  const spoken = useRef(-1);
  const callbacks = useRef({ go, speak, begin, stop, pause, resume });
  useEffect(() => { callbacks.current = { go, speak, begin, stop, pause, resume }; });
  const active = index !== null;
  const current = index === null ? null : stops[index];
  useEffect(() => {
    if (index === null) return;
    spoken.current = -1;
    callbacks.current.go(stops[index].place);
  }, [index]);
  useEffect(() => {
    if (index === null || paused || travelling || arrived !== stops[index].place || spoken.current === index) return;
    spoken.current = index;
    callbacks.current.speak(stops[index].cue);
  }, [index, arrived, travelling, paused]);
  useEffect(() => {
    if (index === null || paused || spoken.current !== index || speech?.id !== stops[index].cue || speech.status !== "done") return;
    const timer = window.setTimeout(() => {
      if (index < stops.length - 1) setIndex(index + 1);
      else { setIndex(null); setNotice("The tour is complete. Choose a project to open."); callbacks.current.stop(); }
    }, 700);
    return () => clearTimeout(timer);
  }, [index, paused, speech]);
  useEffect(() => {
    if (!active) return;
    const interrupt = (event: Event) => {
      if (!(event instanceof KeyboardEvent) && (event.target as Element | null)?.closest?.("[data-guided-tour]")) return;
      if (event instanceof KeyboardEvent && !["Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) return;
      callbacks.current.stop(); setIndex(null); setPaused(false); setNotice("Tour stopped. Explore at your own pace.");
    };
    document.addEventListener("pointerdown", interrupt, true);
    document.addEventListener("keydown", interrupt, true);
    window.addEventListener("hashchange", interrupt);
    return () => {
      document.removeEventListener("pointerdown", interrupt, true);
      document.removeEventListener("keydown", interrupt, true);
      window.removeEventListener("hashchange", interrupt);
    };
  }, [active]);
  // Tour go uses history state rather than a native hash event; visitor links cancel.
  if (!available && !active) return null;
  return <aside className="tw-guided-tour" data-guided-tour aria-label="Guided visit">
    {!active ? <button className="tw-pill" onClick={() => { callbacks.current.begin(); setNotice(""); setPaused(false); setIndex(0); }}>Let the custodian lead a tour</button> : <>
      <p>{index! + 1} / {stops.length} · {current!.title}{paused ? " · Paused" : travelling ? " · Walking" : ""}</p>
      <div><button className="tw-pill" onClick={() => { if (paused) callbacks.current.resume(); else callbacks.current.pause(); setPaused(!paused); }}>{paused ? "Resume tour" : "Pause tour"}</button>
        {index! < stops.length - 1 && <button className="tw-pill" onClick={() => { callbacks.current.stop(); setPaused(false); setIndex(index! + 1); }}>Next tour stop</button>}
        <button className="tw-pill" onClick={() => { callbacks.current.stop(); setIndex(null); setPaused(false); setNotice("Tour stopped. Explore at your own pace."); }}>Stop tour</button></div>
    </>}
    {notice && <p role="status">{notice}</p>}
  </aside>;
}
