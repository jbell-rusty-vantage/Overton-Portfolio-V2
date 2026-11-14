"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@/components/library/Modal";
import ProjectReport from "@/components/library/ProjectReport";
import { reportNeighbors } from "@/lib/library/report";
import type { Volume } from "@/lib/library/model";
import type { EstateData, ExhibitMedia } from "@/lib/estate/model";
import { Icon } from "./Marks";
import { Plate } from "./Plate";
import { SoccerHighlights } from "./world/Folio";

const Projection = dynamic(() => import("./Projection"), { ssr: false });
function MediaPlayer({
  media,
  title,
  projector = false,
}: {
  media: ExhibitMedia;
  title: string;
  projector?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const track = useRef<HTMLTrackElement>(null);
  const [started, setStarted] = useState(false),
    [error, setError] = useState(false),
    [project, setProject] = useState(false),
    [caption, setCaption] = useState("");
  const [playing, setPlaying] = useState(false),
    [position, setPosition] = useState(0),
    [duration, setDuration] = useState(0);
  const [backend, setBackend] = useState<"webgl2" | "webgpu">("webgl2");
  const fallback = useCallback(() => setProject(false), []);
  useEffect(() => {
    const text = track.current?.track;
    if (!text) return;
    const update = () =>
      setCaption(
        text.activeCues?.length ? (text.activeCues[0] as VTTCue).text : "",
      );
    text.addEventListener("cuechange", update);
    return () => text.removeEventListener("cuechange", update);
  }, [media.track]);
  function play() {
    const v = video.current;
    if (!v) return;
    if (!started) {
      v.src = media.src;
      setStarted(true);
    }
    void v.play().catch(() => setError(true));
  }
  return (
    <div className="ea-movie">
      <div className="ea-player-frame">
        <video
          ref={video}
          aria-label={title}
          crossOrigin="anonymous"
          preload="none"
          poster={media.poster}
          playsInline
          controls={started && !project}
          className={project && started ? "projected" : ""}
          onError={() => setError(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        >
          {media.track && (
            <track
              ref={track}
              default
              kind="captions"
              label="English descriptions"
              srcLang="en"
              src={media.track}
            />
          )}
        </video>
        {project && started && (
          <>
            <Projection video={video} onFail={fallback} backend={backend} />
            {caption && <span className="ea-film-caption">{caption}</span>}
          </>
        )}
        {!started && !error && (
          <button className="ea-play" onClick={play}>
            <Icon name="play" size={20} />
            Play {projector ? "the film" : "recording"}
          </button>
        )}
      </div>
      {error && (
        <p role="status">
          The recording could not play.{" "}
          <a href={media.src}>Open the video file</a> or{" "}
          <button
            onClick={() => {
              setError(false);
              play();
            }}
          >
            try again
          </button>
          .
        </p>
      )}
      {projector && (
        <div className="ea-film-controls">
          <button
            className="ea-text-button"
            aria-pressed={project}
            onClick={() => setProject(!project)}
          >
            <Icon name={project ? "film" : "cube"} size={16} />
            {project ? "Use native player" : "Project onto screen"}
          </button>
          {project && (
            <select
              aria-label="Projection renderer"
              value={backend}
              onChange={(e) => setBackend(e.target.value as typeof backend)}
            >
              <option value="webgl2">WebGL 2</option>
              <option value="webgpu">WebGPU</option>
            </select>
          )}
          {project && started && (
            <>
              <button
                aria-label={playing ? "Pause film" : "Resume film"}
                onClick={() => (playing ? video.current?.pause() : play())}
              >
                <Icon name={playing ? "pause" : "play"} />
              </button>
              <input
                aria-label="Seek film"
                type="range"
                min="0"
                max={duration || 1}
                step=".05"
                value={position}
                onChange={(e) => {
                  if (video.current)
                    video.current.currentTime = Number(e.target.value);
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Cabinet({
  data,
  marked,
  remembered,
  remember,
}: {
  data: EstateData;
  marked: string | null;
  remembered: "main" | "side";
  remember: (s: "main" | "side") => void;
}) {
  const [query, setQuery] = useState(""),
    [active, setActive] = useState<Volume | null>(null),
    [drawer, setDrawer] = useState<"work" | "film" | null>(null);
  const p = data.program,
    desk = p?.desk;
  const feature = data.projects.find((v) => v.slug === desk?.project);
  const projects = data.projects.filter((v) =>
    [v.title, v.summary, ...v.tags]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const screen = desk?.[remembered] ? remembered : desk?.main ? "main" : "side";
  return (
    <section className="ea-wrap ea-section ea-cabinet">
      <div className="ea-cabinet-lead">
        <div>
          <p className="ea-overline">
            <span className="ea-rule" /> John Overton Bell · Present day
          </p>
          <h1 tabIndex={-1}>The family cabinet</h1>
          <p className="ea-lede">
            I build software for people working with agents, data and evidence.
            This is my desk. Open a project to see how it works.
          </p>
          <div className="ea-actions">
            {feature && desk && (desk.main || desk.side) && (
              <button
                className="ea-button dark"
                onClick={() => setDrawer("work")}
              >
                <Icon name="grid" size={16} />
                {feature.title} desk
              </button>
            )}
              <button
                className="ea-button outline"
                onClick={() => setDrawer("film")}
              >
                <Icon name="film" size={17} />
                Soccer highlights · All nine clips
              </button>
          </div>
        </div>
        <div className="ea-cabinet-art">
          <Plate
            name="cabinet"
            alt="Project books and a paper viewing folio on a walnut writing cabinet."
            priority
          />
        </div>
      </div>
      <div className="ea-section-heading">
        <div>
          <p className="ea-overline">Portfolio</p>
          <h2>Project volumes</h2>
        </div>
        {data.projects.length > 0 && (
          <label className="ea-search">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Find a project"
              aria-label="Find a project"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        )}
      </div>
      {projects.length ? (
        <div className="ea-project-grid">
          {projects.map((v) => (
            <button
              className="ea-project"
              key={v.slug}
              onClick={() => {
                setActive(v);
              }}
            >
              <div className="ea-jacket">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.cover ?? "/library/plate-" + v.plate + ".webp"}
                  loading="lazy"
                  alt=""
                />
              </div>
              <div>
                <span className="ea-overline">
                  {v.tags.slice(0, 2).join(" · ") || "Project"}
                </span>
                <h3>{v.title}</h3>
                <p>{v.summary}</p>
                <span className="ea-inline">
                  Read project <Icon name="arrow" size={15} />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="ea-empty">
          {query ? (
            <>
              <p>No project matches “{query}”.</p>
              <button className="ea-text-button" onClick={() => setQuery("")}>
                Clear search <Icon name="arrow" />
              </button>
            </>
          ) : (
            <>
              <p>
                {data.unavailable
                  ? "The project catalog is temporarily unavailable."
                  : "The project volumes are being prepared for publication."}
              </p>
              <a className="ea-text-button" href="/catalog">
                Open the text catalog <Icon name="arrow" />
              </a>
            </>
          )}
        </div>
      )}
      {marked && (
        <a className="ea-text-button ea-marked" href={marked}>
          <Icon name="back" />
          Return to the marked leaf
        </a>
      )}
      {active && <ProjectReport key={active.slug} volume={active} admin={data.admin} onClose={() => setActive(null)} neighbors={reportNeighbors(active, data.projects)} onProject={setActive} />}
      {drawer && (
        <Modal
          wide
          title={drawer === "work" ? "The viewing folio" : "Soccer highlights"}
          onClose={() => setDrawer(null)}
        >
          <div className="ea-project-reader ea-drawer">
            <p className="ea-overline">
              {drawer === "work" ? "The viewing folio" : "Soccer highlights"} ·
              John Overton
            </p>
            <h2>
              {drawer === "work" ? feature?.title : "The match collection"}
            </h2>
            {drawer === "work" && desk ? (
              <>
                <div className="ea-filters">
                  {desk.main && (
                    <button
                      aria-pressed={screen === "main"}
                      onClick={() => remember("main")}
                    >
                      Project recording
                    </button>
                  )}
                  {desk.side && (
                    <button
                      aria-pressed={screen === "side"}
                      onClick={() => remember("side")}
                    >
                      Case study
                    </button>
                  )}
                </div>
                {screen === "main" && desk.main ? (
                  <MediaPlayer
                    media={desk.main}
                    title="Mission Control project recording"
                  />
                ) : (
                  desk.side && (
                    <a href={desk.side.src} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Mission Control project case study"
                        src={desk.side.src}
                      />
                    </a>
                  )
                )}
              </>
            ) : (
              <SoccerHighlights />
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
