"use client";

import { useEffect, useRef, useState } from "react";
import { games } from "@/lib/performances";
import type { ExhibitMedia } from "@/lib/estate/model";
import type { ScreenSlot } from "@/lib/estate/world";
import { Icon } from "../Marks";
import "./folio.css";

export const highlights = games.flatMap(game => game.clips.map(clip => ({
  ...clip, key: game.slug + "--" + clip.id, game: game.title, gameSlug: game.slug,
})));
export type FolioSlots = Partial<Record<ScreenSlot, { label: string; media: ExhibitMedia; still?: boolean }>>;

function Recording({ media, title, onPlay }: { media: ExhibitMedia; title: string; onPlay?: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = video.current;
    return () => { element?.pause(); };
  }, []);
  return <div className="folio-recording">
    <video ref={video} src={media.src} poster={media.poster} controls playsInline preload="none"
      aria-label={title} onError={() => setFailed(true)}
      onPlay={() => { setPlaying(true); onPlay?.(); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}>
      {media.track && <track kind="captions" src={media.track} srcLang="en" label="English descriptions" default />}
    </video>
    <div className="folio-playback">
      <button onClick={() => {
        if (playing) video.current?.pause();
        else void video.current?.play().catch(() => setFailed(true));
      }}><Icon name={playing ? "pause" : "play"} size={16} />{playing ? "Pause the recording" : "Play the recording"}</button>
      <button onClick={() => { void video.current?.requestFullscreen?.().catch(() => {}); }}>Full screen <Icon name="diagonal" size={15} /></button>
      <a href={media.src} target="_blank" rel="noreferrer">Open in the browser’s own player ↗</a>
    </div>
    {failed && <p role="status">This recording could not load. <button onClick={() => { setFailed(false); video.current?.load(); }}>Try again</button> or open it in the browser’s player.</p>}
  </div>;
}

/** The same complete, authored match catalog serves the room and plain fallback. */
export function SoccerHighlights({ clipId, onClip, onPlay }: { clipId?: string; onClip?: (id: string) => void; onPlay?: () => void }) {
  const [local, setLocal] = useState(highlights[0].key);
  const selected = highlights.find(clip => clip.key === (clipId ?? local)) ?? highlights[0];
  const index = highlights.indexOf(selected);
  const choose = (id: string) => onClip ? onClip(id) : setLocal(id);
  return <div className="folio-highlights">
    <div className="folio-feature">
      <p className="folio-over">{selected.game} · Clip {index + 1} of {highlights.length}</p>
      <h2>{selected.title}</h2>
      <Recording key={selected.key} media={{ src: selected.src, poster: selected.poster }} title={selected.game + " · " + selected.title} onPlay={onPlay} />
      <p className="folio-note">{selected.note}</p>
      <div className="folio-sequence">
        <button disabled={index === 0} onClick={() => choose(highlights[index - 1].key)}>← Previous clip</button>
        <span aria-live="polite">{index + 1} / {highlights.length}</span>
        <button disabled={index === highlights.length - 1} onClick={() => choose(highlights[index + 1].key)}>Next clip →</button>
      </div>
    </div>
    <nav className="folio-clips" aria-label="All soccer highlights">
      {games.map(game => <section key={game.slug}>
        <h3>{game.title}</h3>
        <p>{game.clips.length} {game.clips.length === 1 ? "clip" : "clips"}{game.number ? " · John wears #" + game.number : ""}</p>
        <div>{highlights.filter(clip => clip.gameSlug === game.slug).map(clip => <button key={clip.key}
          aria-pressed={selected.key === clip.key} onClick={() => choose(clip.key)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={clip.poster} alt="" loading="lazy" />
          <span>{clip.title}<small>{clip.kind}{clip.at ? " · " + clip.at : ""}</small></span>
        </button>)}</div>
      </section>)}
    </nav>
  </div>;
}

export default function Folio({ slots, slot, clipId, onSelect, onClose, onPlay }: {
  slots: FolioSlots; slot: ScreenSlot; clipId?: string;
  onSelect: (slot: ScreenSlot, clip?: string) => void; onClose: () => void; onPlay: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const soccer = slot === "soccer" || slot === "film";
  const item = slots[slot];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !document.fullscreenElement) onClose(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  const legacy = slot === "film" ? highlights.find(clip => clip.id === "free-kick-winner")?.key : undefined;
  return <section className="viewing-folio" aria-label="The viewing folio" data-walk="off">
    <header>
      <div><p className="folio-over">From the family cabinet</p><h1 ref={heading} tabIndex={-1}>{soccer ? "Soccer highlights" : "The viewing folio"}</h1></div>
      <button onClick={onClose}><Icon name="close" size={16} />Return to the cabinet</button>
    </header>
    <nav className="folio-tabs" aria-label="Folio collections">
      {(["main", "side"] as const).filter(key => slots[key]).map(key => <button key={key} aria-current={slot === key ? "page" : undefined} onClick={() => onSelect(key)}>{slots[key]!.label}</button>)}
      <button aria-current={soccer ? "page" : undefined} onClick={() => onSelect("soccer")}>Soccer highlights · {highlights.length} clips</button>
    </nav>
    {soccer ? <SoccerHighlights clipId={clipId ?? legacy} onClip={id => onSelect("soccer", id)} onPlay={onPlay} /> : item ?
      <div className="folio-work"><h2>{item.label}</h2>{item.still ? <a href={item.media.src} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.media.src} alt={item.label} />Open the case study at full size ↗
      </a> : <Recording key={item.media.src} media={item.media} title={item.label} onPlay={onPlay} />}</div> :
      <p className="folio-empty">A work recording has not been selected. Open Soccer highlights to watch the match collection.</p>}
  </section>;
}
