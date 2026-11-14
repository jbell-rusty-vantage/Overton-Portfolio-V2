"use client";
/* The visitor's own means of moving: an analog thumb-stick where there is no keyboard,
   mouse-look with the pointer captured where there is a mouse, and a small plan of the
   ground floor that shows where the visitor stands and offers every stop as a control.
   The camera itself lives in engine/controller.ts; this file only draws and listens. */
import { useEffect, useRef, useState } from "react";
import { placeOrder, places, type Place } from "@/lib/estate/world";
import { Icon } from "../Marks";
import type { Engine } from "./engine/engine";
import { plan } from "./engine/navmesh";
import "./controls.css";

const V = plan.view;
const W = V.x1 - V.x0,
  H = V.z1 - V.z0;
const REACH = 44;

function saved(key: string, fallback: boolean) {
  try {
    const v = localStorage.getItem("overton-estate:" + key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}
/** Where a stop sits on the plan. The south front is beyond its edge, so it is shown
    at the foot of the walk. */
function spot(place: Place) {
  const [x, , z] = places[place].eye;
  return {
    left: ((Math.min(V.x1 - 0.5, Math.max(V.x0 + 0.5, x)) - V.x0) / W) * 100 + "%",
    top: ((Math.min(V.z1 - 0.45, Math.max(V.z0 + 0.45, z)) - V.z0) / H) * 100 + "%",
  };
}

function Stick({ engine }: { engine: Engine }) {
  const knob = useRef<HTMLSpanElement>(null);
  const touch = useRef<{ id: number; x: number; y: number } | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => () => engine.controller.setStick(0, 0), [engine]);
  function steer(x: number, y: number) {
    const t = touch.current;
    if (!t) return;
    let dx = x - t.x,
      dy = y - t.y;
    const r = Math.hypot(dx, dy);
    if (r > REACH) {
      dx *= REACH / r;
      dy *= REACH / r;
    }
    if (knob.current) knob.current.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
    // A small dead zone, then a curve that leaves the middle of the travel for slow,
    // exact walking and the rim for a full stride.
    const n = Math.min(1, r / REACH);
    const push = n < 0.12 ? 0 : ((n - 0.12) / 0.88) ** 1.5;
    engine.controller.setStick(r ? (dx / Math.min(r, REACH)) * push : 0, r ? (-dy / Math.min(r, REACH)) * push : 0);
  }
  function release() {
    touch.current = null;
    if (knob.current) knob.current.style.transform = "";
    engine.controller.setStick(0, 0);
    setActive(false);
  }
  return (
    <div
      className="tn-stick"
      data-active={active || undefined}
      aria-hidden="true"
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        touch.current = { id: e.pointerId, x: r.left + r.width / 2, y: r.top + r.height / 2 };
        setActive(true);
        steer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => touch.current?.id === e.pointerId && steer(e.clientX, e.clientY)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="tn-knob" ref={knob} />
    </div>
  );
}

export default function Controls({
  engine,
  place,
  level = "ground",
  onPlace,
}: {
  engine: Engine;
  /** The stop the address names. */
  place: Place;
  level?: "ground" | "stairs" | "landing";
  onPlace: (place: Place) => void;
}) {
  const [open, setOpen] = useState(() => saved("plan", typeof window !== "undefined" && window.innerWidth > 700));
  const [locked, setLocked] = useState(false);
  const [note, setNote] = useState("");
  const you = useRef<SVGGElement>(null);
  useEffect(
    () =>
      engine.controller.watch((w) => {
        setLocked(w.locked);
        const g = you.current;
        if (!g) return;
        // Beyond the edge of the plan the mark waits at the edge, still showing heading.
        const x = Math.min(V.x1 - 0.3, Math.max(V.x0 + 0.3, w.x)),
          z = Math.min(V.z1 - 0.3, Math.max(V.z0 + 0.3, w.z));
        g.setAttribute("transform", "translate(" + x.toFixed(2) + " " + z.toFixed(2) + ") rotate(" + ((-w.yaw * 180) / Math.PI).toFixed(1) + ")");
        g.toggleAttribute("data-beyond", x !== w.x || z !== w.z);
      }),
    [engine, open, level],
  );
  function toggle() {
    try {
      localStorage.setItem("overton-estate:plan", open ? "0" : "1");
    } catch {}
    setOpen(!open);
  }
  return (
    <>
      <div className="tn-tools">
        {level === "ground" && <button className="tw-pill tn-tool" aria-expanded={open} aria-controls="tn-plan" onClick={toggle}>
          <Icon name="map" size={15} />
          <span>Plan</span>
        </button>}
        <button
          className="tw-pill tn-tool tn-mouse"
          aria-pressed={locked}
          title="Steer with the mouse (M). Escape releases it."
          aria-keyshortcuts="M"
          onClick={() => (locked ? engine.controller.unlock() : engine.controller.lock())}
        >
          <Icon name="eye" size={15} />
          <span>Mouse look</span>
        </button>
      </div>
      {open && level === "ground" && (
        <nav className="tn-plan" id="tn-plan" aria-label="Plan of the ground floor">
          <div className="tn-sheet">
            <svg
              viewBox={V.x0 + " " + V.z0 + " " + W + " " + H}
              role="img"
              aria-label="The library on the west, the entry hall and stair, and the portico to the south. Select the floor to walk there."
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                engine.controller.walk(V.x0 + ((e.clientX - r.left) / r.width) * W, V.z0 + ((e.clientY - r.top) / r.height) * H);
              }}
            >
              <rect className="tn-porch" x={plan.porch.x0} y={plan.porch.z0} width={plan.porch.x1 - plan.porch.x0} height={plan.porch.z1 - plan.porch.z0} />
              {[4.55, 4.95].map((z) => (
                <line key={z} className="tn-step" x1={plan.porch.x0} x2={plan.porch.x1} y1={z} y2={z} />
              ))}
              {plan.rooms.map((r, i) => (
                <rect key={i} className="tn-room" x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} />
              ))}
              {plan.doors.map((r, i) => (
                <rect key={i} className="tn-door" x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} />
              ))}
              {plan.solids.map((r, i) => (
                <rect key={i} className="tn-solid" x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} />
              ))}
              {plan.discs.map((c, i) => (
                <circle key={i} className="tn-solid" cx={c.x} cy={c.z} r={c.r} />
              ))}
              <g ref={you} className="tn-you">
                <path className="tn-cone" d="M0 0 L-0.95 -1.7 A1.95 1.95 0 0 1 0.95 -1.7 Z" />
                <circle r="0.3" />
                <path className="tn-nose" d="M0 -0.62 L0.26 -0.2 L-0.26 -0.2 Z" />
              </g>
            </svg>
            {placeOrder.map((p) => (
              <button
                key={p}
                className="tn-stop"
                style={spot(p)}
                aria-label={"Go to " + places[p].title.replace(/^The /, "the ")}
                aria-current={p === place ? "location" : undefined}
                onClick={() => onPlace(p)}
                onFocus={() => setNote(places[p].title)}
                onBlur={() => setNote("")}
                onPointerEnter={() => setNote(places[p].title)}
                onPointerLeave={() => setNote("")}
              />
            ))}
          </div>
          <p className="tn-note">{note || places[place].title}</p>
        </nav>
      )}
      <Stick engine={engine} />
      {locked && (
        <>
          <span className="tn-cross" aria-hidden="true" />
          <p className="tn-locked" role="status">
            Mouse look is on. Click to select what is in the middle of the view; press Escape to release the pointer.
          </p>
        </>
      )}
    </>
  );
}

/** The body of the “How to move” panel, kept beside the controls it describes. */
export function MoveHelp({ engine }: { engine: Engine | null }) {
  const [speed, setSpeed] = useState(() => engine?.controller.gain ?? 1);
  return (
    <>
      <ul>
        <li>Drag to look around; the view eases to rest. With a mouse, Mouse look (or M) steers without holding a button, and Escape releases it. A standard gamepad’s left stick walks and its right stick looks; either stick takes over a programmed walk.</li>
        <li>W A S D or the arrow keys walk and turn, Q and E turn. Hold Shift to walk briskly, C (or Ctrl with the arrows) for fine steps. The wheel steps forward and back.</li>
        <li>Select the floor to walk there: a ring marks where you will stand and the way goes round the furniture. Any walking key takes over at once.</li>
        <li>On a touch screen the thumb-stick walks, a drag anywhere else looks, and spreading two fingers steps forward.</li>
        <li>The plan shows where you are and which way you face. Choose a stop on it, or a spot on its floor.</li>
        <li>Select a spine, a letter or the portrait, or choose it under Within reach.</li>
        <li>With a book open: select a page to turn it (right page forward, left page back), drag its outer margin to turn the leaf by hand, or use the arrow keys. Drag the top or bottom margin toward the shelf, or press Escape, to put it back.</li>
        <li>With a document held: scroll or pinch to magnify, drag to move it.</li>
      </ul>
      <label className="tn-speed">
        <span>Look speed</span>
        <input
          type="range"
          min={0.4}
          max={2.5}
          step={0.1}
          value={speed}
          aria-valuetext={Math.round(speed * 100) + " percent"}
          onChange={(e) => {
            const value = Number(e.target.value);
            setSpeed(value);
            engine?.controller.setLookSpeed(value);
          }}
        />
        <output>{Math.round(speed * 100)}%</output>
      </label>
    </>
  );
}
