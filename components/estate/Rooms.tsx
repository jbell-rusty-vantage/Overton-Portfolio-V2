"use client";
import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { base, type EstateProgram, type Room } from "@/lib/estate/model";
import type { Leaf } from "@/lib/library/model";
import { Icon } from "./Marks";
import { Plate } from "./Plate";
import { useReducedMotion } from "./Portrait";

const Walk = dynamic(() => import("./Walk"), {
  ssr: false,
  loading: () => (
    <p className="ea-stage-fallback">Opening the three-dimensional house…</p>
  ),
});
const roomData = {
  approach: {
    title: "The south front",
    sub: "The approach",
    text: "Follow the short walk to the portico. The five-bay façade belongs to the enlarged house recorded in the 1970 survey.",
    image: "approach",
    next: "entry",
    action: "Enter the house",
  },
  entry: {
    title: "The entry hall",
    sub: "Across the threshold",
    text: "With the south door behind you, the stair rises ahead. Turn left into the southwest room, labeled Library on the survey plan. The 1795 map on the table shows a region on the eve of statehood.",
    image: "entry",
    next: "library",
    action: "Step into the library",
  },
  library: {
    title: "The judge’s library",
    sub: "The southwest room",
    text: "Look above the west mantel for Judge Overton. The two volumes beside his quills are the Tennessee Reports. Their counterparts wait on the writing table.",
    image: "library",
    next: "desk",
    action: "Approach the writing table",
  },
  desk: {
    title: "The writing table",
    sub: "Inside the library",
    text: "Look closely at the first case in the reports, or open the visitor’s companion. Its final leaf leads from this room to my present-day work.",
    image: "reports",
    next: "leaf-1",
    action: "Open the house book",
  },
} as const;
function subscribeWidth(cb: () => void) {
  const m = matchMedia("(max-width: 700px)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
export default function Rooms({
  room,
  program,
  walk,
  setWalk,
  awake,
  meet,
  read,
  examine,
  map,
  leaf,
}: {
  room: Room;
  program: EstateProgram | null;
  walk: boolean;
  setWalk: (v: boolean) => void;
  awake: boolean;
  meet: () => void;
  read: () => void;
  examine: (id: string) => void;
  map: () => void;
  leaf?: Leaf;
}) {
  const data = roomData[room];
  const [reference, setReference] = useState<Room | null>(null);
  const [skip, setSkip] = useState(0);
  const [backend, setBackend] = useState<"webgl2" | "webgpu">("webgl2");
  const small = useSyncExternalStore(
    subscribeWidth,
    () => matchMedia("(max-width: 700px)").matches,
    () => true,
  );
  const reduced = useReducedMotion();
  const model = walk && program?.scenes;
  const isReference = reference === room && !model;
  const href = room === "approach" ? "#walk" : "#" + room;
  return (
    <section
      className="ea-room ea-wrap"
      inert={!!leaf || undefined}
      aria-hidden={!!leaf || undefined}
    >
      <div className="ea-room-heading">
        <div>
          <p className="ea-overline">
            <span className="ea-rule" />
            {data.sub}
          </p>
          <h1 tabIndex={-1}>{data.title}</h1>
        </div>
        <div className="ea-view-options">
          <button
            aria-pressed={!model && !isReference}
            onClick={() => {
              setReference(null);
              setWalk(false);
            }}
          >
            <Icon name="image" size={16} />
            Room view
          </button>
          <button
            aria-pressed={isReference}
            onClick={() => {
              setWalk(false);
              setReference(room);
            }}
          >
            <Icon name="file" size={16} />
            Survey
          </button>
          {program?.scenes && (
            <button
              aria-pressed={!!model}
              onClick={() => {
                setReference(null);
                setWalk(true);
              }}
            >
              <Icon name="cube" size={16} />
              Walk in 3D
            </button>
          )}
        </div>
      </div>
      <div
        className={
          "ea-stage ea-stage-" +
          room +
          (model ? " is-model" : "") +
          (isReference ? " is-survey" : "")
        }
      >
        {model ? (
          <Walk
            key={backend}
            room={room}
            url={small ? model.low : model.high}
            awake={awake}
            instant={reduced}
            skip={skip}
            meet={meet}
            read={read}
            examine={examine}
            leaf={leaf}
            backend={backend}
          />
        ) : isReference ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="ea-survey-photo"
              alt={"Archival reference for " + data.title}
              src={
                base +
                {
                  approach: "south-front.webp",
                  entry: "archive/center-hall.webp",
                  library: "southwest-room.webp",
                  desk: "archive/murfree-leeper.webp",
                }[room]
              }
            />
          </>
        ) : room === "library" ? (
          <div className="ea-room-plate">
            <Plate
              name="library"
              alt="The interpreted southwest room with Earl’s portrait in its frame above the mantel."
              priority
            />
            <button
              className="ea-inset-portrait"
              aria-label="Examine the framed archival portrait"
              onClick={() => examine("judge-overton")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={base + "archive/judge-overton.webp"} alt="" />
            </button>
          </div>
        ) : (
          <Plate
            name={data.image}
            alt={"Interpretive view of " + data.title.toLowerCase()}
            priority
          />
        )}
        {!isReference && !model && room === "library" && (
          <>
            <button className="ea-pin portrait-pin" onClick={meet}>
              <b>+</b>Meet Judge Overton
            </button>
            <button
              className={"ea-pin book-pin" + (awake ? " lit" : "")}
              onClick={() => examine("murfree-leeper")}
            >
              <b>+</b>Tennessee Reports
            </button>
          </>
        )}
        {!isReference && !model && room === "entry" && (
          <button
            className="ea-pin map-pin"
            onClick={() => examine("tennessee-map")}
          >
            <b>+</b>The 1795 map
          </button>
        )}
        {model && (
          <>
            <button
              className="ea-travel-skip"
              onClick={() => setSkip((v) => v + 1)}
            >
              Skip travel <Icon name="arrow" size={14} />
            </button>
            <select
              className="ea-render-choice"
              aria-label="Walk renderer"
              value={backend}
              onChange={(e) => setBackend(e.target.value as typeof backend)}
            >
              <option value="webgl2">WebGL 2</option>
              <option value="webgpu">WebGPU</option>
            </select>
          </>
        )}
        <span className="ea-stage-credit">
          {model
            ? "Integrated architectural model"
            : isReference
              ? room === "desk"
                ? "Harvard Law School Library · Printed facsimile"
                : "Jack E. Boucher · HABS TN-14"
              : "Interpretive room view"}
        </span>
      </div>
      <div className="ea-room-dock">
        <div>
          <h2>{data.sub}</h2>
          <p>{data.text}</p>
        </div>
        <div className="ea-dock-actions">
          {room === "library" && (
            <button className="ea-button dark" onClick={meet}>
              Meet Judge Overton
              <Icon name="arrow" />
            </button>
          )}
          {room === "desk" ? (
            <button className="ea-button dark" onClick={read}>
              {program ? "Open the house book" : "Open the reports"}
              <Icon name="book" />
            </button>
          ) : (
            <a
              className={
                "ea-button " + (room === "library" ? "outline" : "dark")
              }
              href={"#" + data.next}
            >
              {data.action}
              <Icon name="arrow" />
            </a>
          )}
          {room === "library" && program && (
            <button className="ea-text-button" onClick={read}>
              Open the house book <Icon name="book" size={16} />
            </button>
          )}
          {room === "desk" && (
            <button
              className="ea-text-button"
              onClick={() => examine("overton-letter")}
            >
              Overton’s 1832 letter <Icon name="diagonal" size={15} />
            </button>
          )}
        </div>
      </div>
      <nav className="ea-room-links" aria-label="Room directory">
        <button onClick={map}>
          <Icon name="map" size={16} />
          Estate map
        </button>
        {(["approach", "entry", "library", "desk"] as const).map((r) => (
          <a
            href={r === "approach" ? "#walk" : "#" + r}
            aria-current={
              href === (r === "approach" ? "#walk" : "#" + r)
                ? "step"
                : undefined
            }
            key={r}
          >
            {roomData[r].title}
          </a>
        ))}
      </nav>
    </section>
  );
}
