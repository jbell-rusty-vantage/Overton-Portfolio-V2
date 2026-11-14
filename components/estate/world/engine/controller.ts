/* One camera for the whole visit, and the visitor's feet. Between the named stops the
   visitor walks freely: velocity with acceleration and damping, a smoothed view with a
   little inertia, and a body that slides along walls and furniture (navmesh.ts).
   Programmed travel to a stop, or to a point chosen on the floor, is routed round what
   stands in the way, eases through its turns and yields at once to the visitor's own
   input. Reading and inspection hold the visitor still. */
import * as THREE from "three";
import { Stairway, STAIR, type FloorLevel } from "./stairway";
import { places, type Place } from "@/lib/estate/world";
import { RADIUS, clearLine, eyeLevel, freeAt, moveBy, refresh, route, settle, sight, soften, surface, type Pt } from "./navmesh";

const v = (p: number[]) => new THREE.Vector3(p[0], p[1], p[2]);
const nodes = Object.fromEntries(
  (Object.keys(places) as Place[]).map((name) => [name, v(places[name].eye)]),
) as Record<Place, THREE.Vector3>;
// On a tall, narrow screen the same stops are taken from further back so the whole
// case, chest or portrait stays in view.
const stepBack: Partial<Record<Place, number>> = {
  cabinet: 1.5,
  reports: 1.45,
  portrait: 1.3,
  drawers: 1.18,
  screen: 1.35,
  map: 1.25,
};
/** The part of the house a stop belongs to: walking into it counts as arriving. */
const zone: Record<Place, (x: number, z: number) => boolean> = (() => {
  const library = (x: number, z: number) => x < -1.75 && z < 2.9;
  const hall = (x: number, z: number) => x > -1.35 && x < 1.5 && z < 2.9;
  return {
    approach: (_x, z) => z > 5.4,
    entry: hall,
    map: hall,
    library,
    portrait: library,
    desk: library,
    cabinet: library,
    reports: library,
    drawers: library,
    screen: library,
  };
})();

/** How movement feels. Speeds in m/s, rates per second, angles in radians. */
export const FEEL = {
  walk: 1.9,
  brisk: 3.4,
  fine: 0.55,
  /** Rate at which velocity closes on what is asked for, and at which it dies away. */
  gather: 8,
  coast: 6.5,
  fineGrip: 14,
  turn: 1.7,
  turnBrisk: 2.3,
  turnFine: 0.5,
  turnGather: 12,
  /** How quickly the view closes on where the hand has put it. */
  lookMouse: 26,
  lookTouch: 22,
  lookLock: 34,
  /** Radians per pixel before the visitor's own setting. */
  mouse: 0.0027,
  lock: 0.0021,
  /** A swipe across the whole screen turns this far. */
  swipe: 2.2,
  fling: 0.6,
  flingFade: 8,
  /** Metres per wheel notch, and how quickly the step is taken. */
  wheel: 0.42,
  wheelEase: 9,
  /** Programmed travel. */
  cruise: 2.5,
  cruiseMost: 3.4,
  accelerate: 3,
  brake: 2.8,
  gaze: 0.42,
  gazeMost: 2.6,
  bob: 0.011,
  stride: 1.45,
} as const;

const MOVE = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
const HELD = new Set([...MOVE, "KeyC", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight"]);
const legacy: Record<string, string> = { w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD", q: "KeyQ", e: "KeyE", c: "KeyC", arrowup: "ArrowUp", arrowdown: "ArrowDown", arrowleft: "ArrowLeft", arrowright: "ArrowRight", shift: "ShiftLeft", control: "ControlLeft" };
/** Things that use the same keys for themselves: fields, tabs, menus and the lists
    that scroll with the arrows. Anything else may opt out with data-walk="off". */
const OWN_KEYS = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="tablist"], [role="menu"], [role="listbox"], [role="slider"], .tw-scroll, .tw-help, .tw-screen, [data-walk="off"]';

const EYE_HEIGHT = STAIR.eye;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = THREE.MathUtils.clamp;
const smoothstep = THREE.MathUtils.smoothstep;
const approach = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
/** Critically damped follow with a speed limit: eases out of rest and into its goal. */
function follow(current: number, goal: number, speed: number, time: number, most: number, dt: number): [number, number] {
  const omega = 2 / time,
    x = omega * dt,
    decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = clamp(current - goal, -most * time, most * time);
  const temp = (speed + omega * change) * dt;
  return [current - change + (change + temp) * decay, (speed - omega * temp) * decay];
}

type Kind = "mouse" | "touch" | "lock";
type Travel = {
  spatial: boolean;
  kind: "go" | "walk" | "restore";
  /** Null when only the view turns. */
  curve: THREE.Curve<THREE.Vector3> | null;
  length: number;
  s: number;
  speed: number;
  top: number;
  accelerate: number;
  brake: number;
  to: THREE.Vector3;
  /** Eye above its usual level at either end, blended out along the way. */
  lift0: number;
  lift1: number;
  /** What the stop is for; null keeps the walker's own line of sight. */
  look: THREE.Vector3 | null;
  /** False once the visitor has taken the view for themselves. */
  gaze: boolean;
  follow: number;
  yaw0: number;
  heading: number;
  yawSpeed: number;
  pitchSpeed: number;
  quick: boolean;
  rest: number;
};
export type Watch = { level: FloorLevel; x: number; z: number; yaw: number; locked: boolean; travelling: boolean; outdoors: boolean };

/** A ring on the floor: where a walk will end, or where a click would take you. */
class Marker {
  readonly mesh: THREE.Mesh;
  private material = new THREE.MeshBasicMaterial({ color: "#f3d28d", transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  private level = 0;
  private goal = 0;
  private age = 0;
  private bold = false;
  constructor(private scene: THREE.Scene) {
    const ring = new THREE.RingGeometry(0.15, 0.185, 44);
    ring.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(ring, this.material);
    this.mesh.name = "Walk marker";
    this.mesh.visible = false;
    this.mesh.renderOrder = 4;
    scene.add(this.mesh);
  }
  get shown() {
    return this.mesh.visible && this.goal > 0 ? (this.bold ? "target" : "preview") : "";
  }
  show(x: number, z: number, bold: boolean) {
    this.mesh.position.set(x, surface(x, z) + 0.022, z);
    if (bold && !this.bold) this.age = 0;
    this.bold = bold;
    this.goal = bold ? 0.85 : 0.3;
    this.mesh.visible = true;
  }
  hide(preview = false) {
    if (preview && this.bold) return;
    this.goal = 0;
    this.bold = false;
  }
  update(dt: number, still: boolean) {
    if (!this.mesh.visible) return false;
    this.age += dt;
    this.level = still ? this.goal : this.level + (this.goal - this.level) * approach(this.goal ? 14 : 7, dt);
    if (Math.abs(this.level - this.goal) < 0.01) this.level = this.goal;
    this.material.opacity = this.level;
    // A target arrives a little wide and draws in to where the visitor will stand.
    const s = this.bold && !still ? 1 + 0.7 * Math.exp(-this.age * 7) : 1;
    this.mesh.scale.set(s, 1, s);
    if (!this.level && !this.goal) {
      this.mesh.visible = false;
      return true;
    }
    return this.level !== this.goal || s > 1.004;
  }
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

export class Controller {
  private stairway = new Stairway();
  get level() { return this.stairway.level; }
  place: Place = "approach";
  /** True while a programmed move is running. */
  travelling = false;
  /** Mouse-look with the pointer captured. Escape releases it. */
  locked = false;
  private holding = false;
  private suspended = false;
  suspend(value: boolean) {
    this.suspended = value;
    this.keys.clear();
    this.stick = { x: 0, y: 0 };
    this.pad = { x: 0, y: 0 };
    if (value) this.unlock();
  }
  private yaw = 0;
  private pitch = 0;
  /** Where the hand has put the view; the camera closes on it. */
  private yawTo = 0;
  private pitchTo = 0;
  private lookRate: number = FEEL.lookMouse;
  private fling: { yaw: number; pitch: number } | null = null;
  private swing = { yaw: 0, pitch: 0, at: 0 };
  private velocity = { x: 0, z: 0 };
  private spin = 0;
  private glide = 0;
  private eyeY = 0;
  private bob = { phase: 0, amount: 0 };
  /** The visitor has left the stop on their own feet: the eye keeps to walking height. */
  private roaming = false;
  /** A stop was asked for and the visitor has not yet got there. */
  private pending = false;
  /** That stop is in another part of the house from where it was asked for. */
  private elsewhere = false;
  private travel: Travel | null = null;
  private keys = new Set<string>();
  private stick = { x: 0, y: 0 };
  private pad = { x: 0, y: 0 };
  private drag: { id: number; x: number; y: number; moved: number; kind: Kind } | null = null;
  private fingers = new Map<number, { x: number; y: number }>();
  private spread = 0;
  private marker: Marker | null = null;
  private markerAge = 0;
  private frames = 0;
  private previewed = "";
  private watchers = new Set<(w: Watch) => void>();
  private told = "";
  private disposers: (() => void)[] = [];
  /** The visitor's own look speed, 0.4–2.5. */
  gain = 1;
  onArrive: (place: Place) => void = () => {};
  /** A programmed move has started or ended. */
  onTravel: (active: boolean) => void = () => {};
  onMove: () => void = () => {};
  /** Set by a drag so a click on release is not read as a selection. */
  dragged = false;

  /** Reading and inspection hold the visitor still. */
  get held() {
    return this.holding;
  }
  set held(value: boolean) {
    if (value === this.holding) return;
    this.holding = value;
    this.keys.clear();
    this.fling = null;
    this.velocity.x = this.velocity.z = this.spin = this.glide = 0;
    this.yawTo = this.yaw;
    this.pitchTo = this.pitch;
    this.marker?.hide();
    // The pages and panels need the pointer back.
    if (value) this.unlock();
  }

  /** Stand further back at each stop for a narrow view, or return to the usual spot. */
  setNarrow(narrow: boolean) {
    for (const [name, k] of Object.entries(stepBack) as [Place, number][]) {
      const look = v(places[name].look),
        eyeAt = v(places[name].eye);
      const back = eyeAt.clone().sub(look);
      back.y = 0;
      nodes[name].copy(eyeAt).addScaledVector(back, narrow ? k - 1 : 0);
    }
  }
  constructor(
    readonly camera: THREE.PerspectiveCamera,
    private dom: HTMLElement,
    private reduced: boolean,
    scene?: THREE.Scene,
  ) {
    if (scene) this.marker = new Marker(scene);
    try {
      const saved = Number(localStorage.getItem("overton-estate:look"));
      if (saved >= 0.4 && saved <= 2.5) this.gain = saved;
    } catch {}
    this.snap("approach");
    const on = <K extends keyof HTMLElementEventMap>(
      target: HTMLElement | Window | Document,
      type: K | "pointerlockchange" | "pointerlockerror",
      fn: (e: HTMLElementEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, fn as EventListener, options);
      this.disposers.push(() => target.removeEventListener(type, fn as EventListener, options));
    };
    on(dom, "pointerdown", (e) => {
      this.fling = null;
      if (e.pointerType === "touch") {
        this.fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.fingers.size === 2) {
          const [p, q] = [...this.fingers.values()];
          this.spread = Math.hypot(p.x - q.x, p.y - q.y);
          // Two fingers steer; neither is a selection.
          this.dragged = true;
          return;
        }
      }
      if (e.button !== 0) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, kind: e.pointerType === "touch" ? "touch" : "mouse" };
      this.dragged = false;
    });
    on(window, "pointermove", (e) => {
      if (this.locked) {
        if (e.pointerType !== "touch") this.look(e.movementX, e.movementY, "lock", e.timeStamp);
        return;
      }
      const finger = this.fingers.get(e.pointerId);
      const pinching = !!finger && this.fingers.size === 2;
      if (finger) {
        finger.x = e.clientX;
        finger.y = e.clientY;
      }
      if (pinching) {
        // Spreading two fingers steps forward, closing them steps back. A held
        // document keeps the same gesture for its own magnification.
        const [p, q] = [...this.fingers.values()];
        const now = Math.hypot(p.x - q.x, p.y - q.y);
        if (!this.holding && this.spread > 0) this.step((now - this.spread) * 0.011);
        this.spread = now;
      }
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x,
        dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      if (pinching) return;
      d.moved += Math.abs(dx) + Math.abs(dy);
      if (d.moved > (d.kind === "touch" ? 10 : 6)) this.dragged = true;
      if (!this.dragged || (this.travelling && this.holding)) return;
      this.look(dx, dy, d.kind, e.timeStamp);
    });
    const release = (e: PointerEvent) => {
      if (this.fingers.delete(e.pointerId)) this.spread = 0;
      if (this.drag?.id !== e.pointerId) return;
      // Let go while still turning: the view carries on a little and settles.
      const s = this.swing;
      if (this.dragged && !this.reduced && !this.holding && e.timeStamp - s.at < 110 && Math.hypot(s.yaw, s.pitch) > 0.6)
        this.fling = { yaw: clamp(s.yaw, -3.5, 3.5) * FEEL.fling, pitch: clamp(s.pitch, -2, 2) * FEEL.fling };
      this.drag = null;
    };
    on(window, "pointerup", release);
    on(window, "pointercancel", release);
    on(dom, "wheel", (e) => {
      // A held document magnifies with the wheel (engine.ts); ctrl+wheel is the browser's.
      if (this.holding || e.ctrlKey) return;
      e.preventDefault();
      const notches = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaY / 100;
      this.step(-clamp(notches, -3, 3) * FEEL.wheel);
    }, { passive: false });
    // Walking keys work wherever focus rests, except in a field or a panel that uses
    // the same keys itself.
    on(window, "keydown", (e) => {
      const code = e.code || legacy[e.key.toLowerCase()] || "";
      // Browsers release a captured pointer on Escape themselves; where the key
      // reaches the page instead, do the same.
      if ((code === "Escape" || e.key === "Escape") && this.locked) return this.unlock();
      if ((!HELD.has(code) && code !== "KeyM") || e.altKey || e.metaKey) return;
      if (!this.dom.isConnected || this.holding || this.suspended) return;
      const target = e.target as Element | null;
      if (target?.closest?.(OWN_KEYS)) return;
      if (code === "KeyM") {
        // Mouse-look on and off without reaching for its button.
        if (!e.ctrlKey && !e.repeat) (this.locked ? this.unlock : this.lock).call(this);
        return;
      }
      // Ctrl is the fine-step modifier for the arrows only; Ctrl+letter is the browser's.
      if (e.ctrlKey && code.startsWith("Key")) return;
      this.keys.add(code);
      if (!MOVE.has(code)) return;
      e.preventDefault();
      this.takeOver();
      this.onMove();
    });
    on(window, "keyup", (e) => {
      const code = e.code || legacy[e.key.toLowerCase()] || "";
      this.keys.delete(code);
      // Shift changes what a letter reports: release its plain spelling too.
      if (legacy[e.key.toLowerCase()]) this.keys.delete(legacy[e.key.toLowerCase()]);
    });
    on(window, "blur", () => this.keys.clear());
    on(document, "pointerlockchange", () => {
      this.locked = document.pointerLockElement === this.dom;
      this.drag = null;
      this.dragged = false;
      this.fling = null;
      this.tell(true);
      this.onMove();
    });
  }
  dispose() {
    this.unlock();
    this.disposers.forEach((d) => d());
    this.marker?.dispose();
    this.watchers.clear();
  }

  /** Follow the visitor for the plan and the controls. Returns the unsubscribe. */
  watch(fn: (w: Watch) => void) {
    this.watchers.add(fn);
    fn(this.snapshot());
    return () => {
      this.watchers.delete(fn);
    };
  }
  private snapshot(): Watch {
    const p = this.camera.position;
    return { level: this.level, x: p.x, z: p.z, yaw: this.yaw, locked: this.locked, travelling: this.travelling, outdoors: p.z > 3.13 };
  }
  private tell(force = false) {
    if (!this.watchers.size) return;
    const w = this.snapshot();
    const key = w.x.toFixed(2) + w.z.toFixed(2) + w.yaw.toFixed(2) + +w.locked + +w.travelling;
    if (!force && key === this.told) return;
    this.told = key;
    this.watchers.forEach((fn) => fn(w));
  }

  /** Capture the pointer for mouse-look. Must follow a press or a click. */
  lock() {
    if (this.holding || this.locked) return;
    try {
      const asked = this.dom.requestPointerLock() as unknown as Promise<void> | undefined;
      asked?.catch?.(() => {});
    } catch {}
  }
  unlock() {
    if (typeof document !== "undefined" && document.pointerLockElement === this.dom) document.exitPointerLock();
  }
  /** Where a press points: the middle of the view while the pointer is captured. */
  aimPoint(e: { clientX: number; clientY: number }) {
    if (!this.locked) return { x: e.clientX, y: e.clientY };
    const r = this.dom.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  setLookSpeed(gain: number) {
    this.gain = clamp(gain, 0.4, 2.5);
    try {
      localStorage.setItem("overton-estate:look", String(this.gain));
    } catch {}
  }
  /** Analog walking from the thumb-stick: x to the right, y forward, each −1…1. */
  setStick(x: number, y: number) {
    this.stick.x = clamp(x, -1, 1);
    this.stick.y = clamp(y, -1, 1);
    if (x || y) {
      this.takeOver();
      this.onMove();
    }
  }
  /** Turn-and-walk buttons: x turns left, y walks back. Kept for simple pads. */
  setPad(x: number, y: number) {
    this.pad.x = x;
    this.pad.y = y;
    if (x || y) {
      this.takeOver();
      this.onMove();
    }
  }
  /** A measured step forward (or back), eased; several add up. */
  step(metres: number) {
    if (this.holding || !metres) return;
    this.takeOver();
    this.glide = clamp(this.glide + metres, -2.5, 2.5);
    this.onMove();
  }

  private sensitivity(kind: Kind) {
    const base =
      kind === "touch" ? clamp(FEEL.swipe / Math.max(320, this.dom.clientWidth), 0.0028, 0.0068) : kind === "lock" ? FEEL.lock : FEEL.mouse;
    return base * (this.camera.fov / 56) * this.gain * (this.holding ? 0.3 : 1);
  }
  private pitchLimits(): [number, number] {
    return this.holding ? [-0.32, 0.12] : [-1.3, 1.1];
  }
  private look(dx: number, dy: number, kind: Kind, stamp: number) {
    if (!dx && !dy) return;
    // Turning the view is not pointing at the floor.
    if (this.previewed) this.preview(null);
    const k = this.sensitivity(kind);
    const [low, high] = this.pitchLimits();
    const t = this.travel;
    if (t?.gaze) {
      // The walk goes on; the view is now the visitor's.
      t.gaze = false;
      this.yawTo = this.yaw;
      this.pitchTo = this.pitch;
    }
    this.yawTo -= dx * k;
    this.pitchTo = clamp(this.pitchTo - dy * k, low, high);
    this.lookRate = this.reduced ? 60 : kind === "touch" ? FEEL.lookTouch : kind === "lock" ? FEEL.lookLock : FEEL.lookMouse;
    const s = this.swing;
    const dt = Math.max(0.004, (stamp - s.at) / 1000);
    if (dt < 0.2) {
      s.yaw += ((-dx * k) / dt - s.yaw) * 0.5;
      s.pitch += ((-dy * k) / dt - s.pitch) * 0.5;
    } else s.yaw = s.pitch = 0;
    s.at = stamp;
    this.onMove();
  }
  private apply() {
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }
  private aim(target: THREE.Vector3) {
    const d = target.clone().sub(this.camera.position);
    this.yaw = this.yawTo = Math.atan2(-d.x, -d.z);
    this.pitch = this.pitchTo = Math.atan2(d.y, Math.hypot(d.x, d.z));
    this.apply();
  }
  private still() {
    this.velocity.x = this.velocity.z = this.spin = this.glide = 0;
    this.fling = null;
    this.bob.amount = 0;
  }
  snap(place: Place) {
    this.stairway.reset();
    const was = this.travelling;
    this.camera.position.copy(nodes[place]);
    this.eyeY = nodes[place].y;
    this.aim(v(places[place].look));
    this.place = place;
    this.travel = null;
    this.travelling = false;
    this.roaming = this.pending = false;
    this.still();
    this.marker?.hide();
    if (was) this.onTravel(false);
    this.tell(true);
  }
  /** Current pose, for restoring the view after an object is put back. */
  pose() {
    return {
      position: this.camera.position.clone(),
      yaw: this.yaw,
      pitch: this.pitch,
    };
  }
  restore(p: ReturnType<Controller["pose"]>, instant = false) {
    if (instant || this.reduced) {
      this.camera.position.copy(p.position);
      this.stairway.reconcile(p.position);
      this.eyeY = p.position.y;
      this.yaw = this.yawTo = p.yaw;
      this.pitch = this.pitchTo = p.pitch;
      this.still();
      this.apply();
      this.onMove();
      return;
    }
    const target = p.position
      .clone()
      .add(new THREE.Vector3(0, 0, -3).applyEuler(new THREE.Euler(p.pitch, p.yaw, 0, "YXZ")));
    this.begin("restore", p.position.clone(), target, 0.7);
  }

  /** Lay a path to a point and start along it. `seconds` asks for a short, timed move. */
  private begin(kind: Travel["kind"], to: THREE.Vector3, look: THREE.Vector3 | null, seconds?: number, spatialPoints?: THREE.Vector3[]) {
    const from = this.camera.position.clone();
    if (!spatialPoints && this.stairway.active) {
      const foot=STAIR.foot;
      const ground=soften(route(foot,{x:to.x,z:to.z}) ?? [foot,{x:to.x,z:to.z}]);
      spatialPoints=[...this.stairway.descend(from),...ground.slice(1).map(p=>new THREE.Vector3(p.x,eyeLevel(p.x,p.z),p.z))];
      spatialPoints[spatialPoints.length-1]=to.clone();
    }
    const a: Pt = { x: from.x, z: from.z },
      b: Pt = { x: to.x, z: to.z };
    const span = Math.hypot(b.x - a.x, b.z - a.z);
    let curve: THREE.Curve<THREE.Vector3> | null = null;
    if (spatialPoints) {
      const path = new THREE.CurvePath<THREE.Vector3>();
      for(let i=1;i<spatialPoints.length;i++) if(spatialPoints[i].distanceTo(spatialPoints[i-1])>.0001) path.add(new THREE.LineCurve3(spatialPoints[i-1],spatialPoints[i]));
      if(path.curves.length) curve=path;
    } else if (span > 0.004) {
      // Straight when nothing is in the way, otherwise round it.
      const line = span < 6 && clearLine(a, b, RADIUS - 0.01) ? [a, b] : soften(route(a, b) ?? [a, b]);
      const points = line.map((p) => new THREE.Vector3(p.x, 0, p.z));
      curve = points.length > 2 ? new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5) : new THREE.LineCurve3(points[0], points[1]);
      curve.arcLengthDivisions = Math.min(1500, Math.max(60, Math.ceil(span * 40)));
    }
    const length = curve ? curve.getLength() : 0;
    // Carry whatever pace the visitor already has into the walk.
    const carried = this.travel?.curve ? this.travel.speed : Math.hypot(this.velocity.x, this.velocity.z);
    const timed = seconds !== undefined;
    const top = timed ? Math.max(0.3, (1.5 * length) / seconds) : clamp(length / 7, FEEL.cruise, FEEL.cruiseMost);
    const rate = timed ? Math.max(1.2, (4.5 * length) / (seconds * seconds)) : 0;
    this.travel = {
      spatial: !!spatialPoints,
      kind,
      curve,
      length,
      s: 0,
      speed: Math.min(carried, top),
      top,
      accelerate: timed ? rate : FEEL.accelerate,
      brake: timed ? rate : FEEL.brake,
      to,
      lift0: from.y - eyeLevel(from.x, from.z),
      lift1: to.y - eyeLevel(to.x, to.z),
      look,
      gaze: true,
      // Across the house the eye follows the way; within a room it stays on what the
      // stop is for. A walk to a spot on the floor turns to face its way only if long.
      follow: look ? smoothstep(length, 3.5, 9) : 0.85 * smoothstep(length, 1.2, 3.6),
      yaw0: this.yaw,
      heading: this.yaw,
      yawSpeed: 0,
      pitchSpeed: 0,
      quick: timed,
      rest: 0,
    };
    this.still();
    this.yawTo = this.yaw;
    this.pitchTo = this.pitch;
    if (!this.travelling) {
      this.travelling = true;
      this.onTravel(true);
    }
    this.tell(true);
  }
  /** Only the recorded stair and a bounded reconstructed landing are accessible. */
  visitLanding(instant = false) {
    if (this.holding) return false;
    const to=new THREE.Vector3(STAIR.landing.x,STAIR.upper+STAIR.eye,STAIR.landing.z);
    const look=new THREE.Vector3(-.7,3.4,-1.0);
    this.pending=this.elsewhere=false;
    if(instant||this.reduced){this.cancelTravel();this.camera.position.copy(to);this.eyeY=to.y;this.stairway.reconcile(to);this.aim(look);this.tell(true);this.onMove();return true;}
    let points:THREE.Vector3[];
    if(this.stairway.active) points=this.stairway.level==="landing"?[this.camera.position.clone(),to]:this.stairway.ascend(this.camera.position);
    else {
      const from={x:this.camera.position.x,z:this.camera.position.z},foot=STAIR.foot;
      const line=soften(route(from,foot)??[from,foot]);
      points=[this.camera.position.clone(),...line.slice(1).map(p=>new THREE.Vector3(p.x,eyeLevel(p.x,p.z),p.z)),...this.stairway.ascend()];
    }
    this.begin("walk",to,look,undefined,points);this.onMove();return true;
  }
  go(place: Place, instant = false) {
    if (instant || this.reduced) {
      this.snap(place);
      this.onArrive(place);
      this.onMove();
      return;
    }
    const look = v(places[place].look);
    if (place === this.place && !this.travel) {
      // Re-centre on the stop if the visitor has wandered or looked away.
      const here = this.camera.position.distanceTo(nodes[place]) < 0.02;
      const facing = this.camera.getWorldDirection(new THREE.Vector3()).angleTo(look.clone().sub(nodes[place])) < 0.02;
      if (here && facing) {
        this.pending = false;
        this.onArrive(place);
        return;
      }
      const near = this.camera.position.distanceTo(nodes[place]) < 1.2;
      this.owe(place);
      this.begin("go", nodes[place].clone(), look, near ? 0.8 : undefined);
      this.onMove();
      return;
    }
    this.place = place;
    this.owe(place);
    this.begin("go", nodes[place].clone(), look);
    this.onMove();
  }
  /** Where a ray from the eye meets ground a visitor could stand on, or null. Walls,
      cases and the stair stop the ray; a table or a chair is seen over and walked up to. */
  floorTarget(ray: THREE.Ray) {
    if (ray.direction.y > -0.02) return null;
    const eye = ray.origin;
    if(this.stairway.active){
      const t=(STAIR.upper-eye.y)/ray.direction.y;
      if(t<=0||t>16)return null;
      const p={x:eye.x+ray.direction.x*t,z:eye.z+ray.direction.z*t};
      return this.stairway.level==="landing"&&this.stairway.landingTarget(p)?new THREE.Vector3(p.x,STAIR.upper,p.z):null;
    }
    let height = surface(eye.x, eye.z);
    let x = 0,
      z = 0;
    // The boards, the deck and the lawn lie at different heights: close in on the hit.
    for (let i = 0; i < 3; i++) {
      const t = (height - eye.y) / ray.direction.y;
      if (t <= 0 || t > 16) return null;
      x = eye.x + ray.direction.x * t;
      z = eye.z + ray.direction.z * t;
      height = surface(x, z);
    }
    if (!sight(eye.x, eye.z, x, z)) return null;
    const p = { x, z };
    if (!settle(p) || Math.hypot(p.x - x, p.z - z) > 0.9) return null;
    return new THREE.Vector3(p.x, surface(p.x, p.z), p.z);
  }
  /** Show where a press on the floor would take the visitor, or clear it. */
  preview(point: THREE.Vector3 | null) {
    // A walk under way keeps its own mark.
    if (!this.marker || this.marker.shown === "target") return;
    const show = !!point && !this.holding && !this.locked;
    const key = show ? point.x.toFixed(2) + "," + point.z.toFixed(2) : "";
    if (key === this.previewed) return;
    this.previewed = key;
    if (show) this.marker.show(point.x, point.z, false);
    else this.marker.hide(true);
    this.onMove();
  }
  /** Walk to a point on the floor by a way that goes round what stands between. */
  walk(x: number, z: number) {
    if (this.holding) return false;
    if(this.stairway.active){
      if(this.stairway.level!=="landing"||!this.stairway.landingTarget({x,z}))return false;
      const to=new THREE.Vector3(x,STAIR.upper+STAIR.eye,z);
      this.begin("walk",to,null,undefined,[this.camera.position.clone(),to]);this.onMove();return true;
    }
    const p = { x, z };
    if (!settle(p) || Math.hypot(p.x - x, p.z - z) > 0.9) return false;
    const here = this.camera.position;
    const distance = Math.hypot(p.x - here.x, p.z - here.z);
    if (distance < 0.15) return false;
    if (distance > 0.9 && !clearLine({ x: here.x, z: here.z }, p, RADIUS - 0.01) && !route({ x: here.x, z: here.z }, p)) return false;
    const to = new THREE.Vector3(p.x, eyeLevel(p.x, p.z), p.z);
    if (this.reduced) {
      // No flight: stand there, looking the way you were.
      here.copy(to);
      this.eyeY = to.y;
      this.roaming = true;
      this.still();
      this.marker?.show(p.x, p.z, true);
      this.markerAge = 0.7;
      this.arrivedNear();
      this.onMove();
      return true;
    }
    this.begin("walk", to, null);
    this.marker?.show(p.x, p.z, true);
    this.previewed = "";
    this.onMove();
    return true;
  }
  skip() {
    const t = this.travel;
    if (!t) return;
    this.camera.position.copy(t.to);
    if(t.spatial)this.stairway.reconcile(t.to);
    if (t.look) this.aim(t.look);
    this.finish();
  }
  /** Cancel a programmed journey at this exact pose. No arrival or place change. */
  cancelTravel() {
    const was = this.travelling;
    this.travel = null;
    this.travelling = false;
    this.pending = this.elsewhere = false;
    this.roaming = false;
    this.keys.clear();
    this.stick = { x: 0, y: 0 };
    this.pad = { x: 0, y: 0 };
    this.drag = null;
    this.fingers.clear();
    this.swing = { yaw: 0, pitch: 0, at: 0 };
    this.still();
    this.yawTo = this.yaw;
    this.pitchTo = this.pitch;
    this.eyeY = this.camera.position.y;
    this.marker?.hide();
    this.previewed = "";
    if (was) this.onTravel(false);
    this.tell(true);
  }
  /** The visitor's own input ends a programmed move where it stands. */
  private takeOver() {
    const t = this.travel;
    if (!t || this.holding) return;
    if (t.curve && t.speed > 0.05 && t.s < t.length) {
      // Keep the pace: the walk hands over without a jolt and coasts down.
      const tangent = t.curve.getTangentAt(clamp(t.s / t.length, 0, 1));
      this.velocity.x = tangent.x * t.speed;
      this.velocity.z = tangent.z * t.speed;
    }
    this.travel = null;
    this.travelling = false;
    this.roaming = true;
    this.eyeY = this.camera.position.y;
    this.yawTo = this.yaw;
    this.pitchTo = this.pitch;
    this.marker?.hide();
    this.onTravel(false);
    this.tell(true);
  }
  private finish() {
    const t = this.travel!;
    this.travel = null;
    this.travelling = false;
    this.still();
    this.yawTo = this.yaw;
    this.pitchTo = this.pitch;
    this.eyeY = this.camera.position.y;
    this.marker?.hide();
    this.onTravel(false);
    if (t.kind === "walk") {
      this.roaming = true;
      this.arrivedNear();
    } else {
      this.roaming = t.kind === "restore" && this.camera.position.distanceTo(nodes[this.place]) > 0.05;
      this.pending = false;
      this.onArrive(this.place);
    }
    this.onMove();
    this.tell(true);
  }
  private owe(place: Place) {
    const p = this.camera.position;
    this.pending = true;
    this.elsewhere = !zone[place](p.x, p.z);
  }
  /** A visitor who walks up to the stop they were bound for, or into its part of the
      house from another, has arrived. */
  private arrivedNear() {
    if (!this.pending) return;
    const p = this.camera.position,
      n = nodes[this.place];
    if (Math.hypot(p.x - n.x, p.z - n.z) > 1.3 && !(this.elsewhere && zone[this.place](p.x, p.z))) return;
    this.pending = false;
    this.onArrive(this.place);
  }

  /** Returns true while the view is changing and frames are needed. */
  update(dt: number) {
    if (this.suspended) return false;
    // Standard gamepads: left stick walks, right stick looks. A dead zone prevents
    // a resting controller from interrupting a programmed walk.
    const gamepad = typeof navigator !== "undefined" ? navigator.getGamepads?.().find((p) => p?.connected && p.mapping === "standard") : null;
    const axis = (value = 0) => Math.abs(value) < 0.16 ? 0 : Math.sign(value) * (Math.abs(value) - 0.16) / 0.84;
    const gx = axis(gamepad?.axes[0]), gy = axis(gamepad?.axes[1]);
    const lookX = axis(gamepad?.axes[2]), lookY = axis(gamepad?.axes[3]);
    const gamepadInput = !this.holding && !document.activeElement?.closest(OWN_KEYS) && (gx || gy || lookX || lookY);
    if (gamepadInput) {
      this.takeOver();
      this.yawTo -= lookX * 1.65 * dt;
      this.pitchTo -= lookY * 1.3 * dt;
    }
    // The grounds are laid out once the house has loaded: look again now and then.
    if (this.frames++ % 30 === 0) refresh();
    let active = this.marker?.update(dt, this.reduced) ?? false;
    if (this.markerAge > 0 && (this.markerAge -= dt) <= 0) this.marker?.hide();
    if (this.travel) {
      this.advance(this.travel, dt);
      this.tell();
      return true;
    }
    if (this.holding) {
      if (this.easeLook(dt)) active = true;
      return active;
    }
    const k = this.keys;
    const has = (...codes: string[]) => codes.some((c) => k.has(c));
    let forward = (has("KeyW", "ArrowUp") ? 1 : 0) - (has("KeyS", "ArrowDown") ? 1 : 0);
    let strafe = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
    const turn = (has("ArrowLeft", "KeyQ") ? 1 : 0) - (has("ArrowRight", "KeyE") ? 1 : 0) + this.pad.x;
    const fine = has("KeyC", "ControlLeft", "ControlRight"),
      brisk = !fine && has("ShiftLeft", "ShiftRight");
    const keyed = forward || strafe;
    // The stick is analog: a light push is a slow walk.
    forward += this.stick.y - this.pad.y;
    strafe += this.stick.x;
    if (gamepadInput) { forward -= gy; strafe += gx; }
    const push = Math.hypot(forward, strafe);
    if (push > 1) {
      forward /= push;
      strafe /= push;
    }
    const most = fine ? FEEL.fine : brisk ? FEEL.brisk : keyed ? FEEL.walk : FEEL.walk * 1.2;
    const sin = Math.sin(this.yaw),
      cos = Math.cos(this.yaw);
    const wantX = (-sin * forward + cos * strafe) * most,
      wantZ = (-cos * forward - sin * strafe) * most;
    const vel = this.velocity;
    const grip = approach(fine ? FEEL.fineGrip : push ? FEEL.gather : FEEL.coast, dt);
    vel.x += (wantX - vel.x) * grip;
    vel.z += (wantZ - vel.z) * grip;
    if (!push && Math.hypot(vel.x, vel.z) < 0.012) vel.x = vel.z = 0;
    const wantSpin = turn * (fine ? FEEL.turnFine : brisk ? FEEL.turnBrisk : FEEL.turn);
    this.spin += (wantSpin - this.spin) * approach(FEEL.turnGather, dt);
    if (!turn && Math.abs(this.spin) < 0.004) this.spin = 0;
    if (this.spin) {
      this.yawTo += this.spin * dt;
      active = true;
    }
    if (this.easeLook(dt)) active = true;
    // A wheel notch or a pinch is a measured step, eased out.
    let stride = 0;
    if (this.glide) {
      stride = Math.abs(this.glide) < 0.004 || this.reduced ? this.glide : this.glide * approach(FEEL.wheelEase, dt);
      this.glide -= stride;
    }
    const p = this.camera.position;
    const dx = vel.x * dt - sin * stride,
      dz = vel.z * dt - cos * stride;
    let pace = 0;
    if (dx || dz) {
      const at = this.stairway.move({x:p.x,z:p.z},dx,dz) ?? moveBy({ x: p.x, z: p.z }, dx, dz);
      const mx = at.x - p.x,
        mz = at.z - p.z;
      // What the wall took away is gone: no pressing into it, no sticking to it.
      const lostX = dx - mx,
        lostZ = dz - mz;
      const lost = Math.hypot(lostX, lostZ);
      if (lost > 1e-5) {
        const into = (vel.x * lostX + vel.z * lostZ) / lost;
        if (into > 0) {
          vel.x -= (lostX / lost) * into;
          vel.z -= (lostZ / lost) * into;
        }
      }
      if (stride && Math.hypot(mx, mz) < Math.abs(stride) * 0.2) this.glide = 0;
      pace = dt > 0 ? Math.hypot(mx, mz) / dt : 0;
      p.x = at.x;
      p.z = at.z;
      this.roaming = true;
      active = true;
    }
    if (this.roaming) {
      // The eye keeps its height above the boards, the steps and the lawn.
      const level = this.stairway.active ? this.stairway.height(p)+EYE_HEIGHT : eyeLevel(p.x, p.z);
      if (Math.abs(this.eyeY - level) > 0.0005) {
        this.eyeY += (level - this.eyeY) * approach(7, dt);
        active = true;
      } else this.eyeY = level;
      // A slight rise and fall with each stride; none for visitors who ask for stillness.
      const b = this.bob;
      const want = this.reduced ? 0 : FEEL.bob * Math.min(1.5, pace / FEEL.walk);
      b.amount += (want - b.amount) * approach(6, dt);
      if (b.amount < 0.0002) b.amount = 0;
      b.phase += ((pace * dt) / FEEL.stride) * Math.PI * 2;
      p.y = this.eyeY + Math.sin(b.phase) * b.amount;
      if (b.amount) active = true;
      this.arrivedNear();
    }
    if (active) {
      this.onMove();
      this.tell();
    }
    return active;
  }
  /** Close the view on where the hand has put it; carry a released swing a little on. */
  private easeLook(dt: number) {
    const [low, high] = this.pitchLimits();
    const f = this.fling;
    if (f) {
      this.yawTo += f.yaw * dt;
      this.pitchTo = clamp(this.pitchTo + f.pitch * dt, low, high);
      const fade = Math.exp(-FEEL.flingFade * dt);
      f.yaw *= fade;
      f.pitch *= fade;
      if (Math.hypot(f.yaw, f.pitch) < 0.03) this.fling = null;
    }
    this.pitchTo = clamp(this.pitchTo, low - 0.0001, high + 0.0001);
    const dy = this.yawTo - this.yaw,
      dp = this.pitchTo - this.pitch;
    if (!dy && !dp) return !!this.fling;
    if (Math.abs(dy) < 0.0002 && Math.abs(dp) < 0.0002) {
      this.yaw = this.yawTo;
      this.pitch = this.pitchTo;
    } else {
      const a = approach(this.lookRate, dt);
      this.yaw += dy * a;
      this.pitch += dp * a;
    }
    this.apply();
    return true;
  }
  /** One frame of a programmed move: pace, place, eye height and where to look. */
  private advance(t: Travel, dt: number) {
    const p = this.camera.position;
    const moving = !!t.curve && t.s < t.length;
    if (t.curve && moving) {
      const left = t.length - t.s;
      // Ease off for the bend ahead, and brake so the walk ends at rest.
      const ahead = t.curve.getTangentAt(Math.min(1, (t.s + 0.9) / t.length));
      const bend = t.curve.getTangentAt(t.s / t.length).angleTo(ahead);
      const allowed = Math.min((t.spatial && this.stairway.active ? Math.min(t.top, 1.05) : t.top) * clamp(1 - bend * 0.5, 0.45, 1), Math.sqrt(2 * t.brake * left) + 0.05);
      t.speed = allowed > t.speed ? Math.min(allowed, t.speed + t.accelerate * dt) : Math.max(allowed, t.speed - t.brake * 1.6 * dt);
      t.speed = Math.min(t.speed, Math.sqrt(2 * t.brake * left) + 0.05);
      t.s = Math.min(t.length, t.s + t.speed * dt);
      if (t.length - t.s < 0.002) t.s = t.length;
      const at = t.curve.getPointAt(t.s / t.length);
      // A stop's own eye height is left and taken up gradually, the more so the more
      // it differs from walking height.
      const leave = Math.min(t.length / 2, Math.max(1.2, Math.abs(t.lift0) * 7)),
        take = Math.min(t.length / 2, Math.max(1.2, Math.abs(t.lift1) * 7));
      p.set(
        at.x,
        t.spatial ? at.y : eyeLevel(at.x, at.z) + t.lift0 * (1 - smoothstep(t.s, 0, leave)) + t.lift1 * smoothstep(t.s, t.length - take, t.length),
        at.z,
      );
      if (t.s >= t.length) {
        p.copy(t.to);
        t.speed = 0;
      }
    } else p.copy(t.to);
    if(t.spatial)this.stairway.reconcile(p);
    const left = t.length - t.s;
    if (t.gaze) {
      let yawGoal = this.yaw,
        pitchGoal = this.pitch;
      let endYaw = this.yaw,
        endPitch = this.pitch;
      if (t.look) {
        const d = t.look.clone().sub(p);
        endYaw = Math.atan2(-d.x, -d.z);
        endPitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      }
      if (t.curve && left > 0.05 && t.length > 0.9) {
        // Look where the walk is going, a little further on at speed, and turn to
        // what the stop is for as it comes near.
        if (left > 0.5) {
          const lead = clamp(0.8 + t.speed * 0.45, 0.8, 2);
          const on = t.curve.getPointAt(Math.min(1, (t.s + lead) / t.length));
          if (Math.hypot(on.x - p.x, on.z - p.z) > 0.2) t.heading = Math.atan2(-(on.x - p.x), -(on.z - p.z));
        }
        if (t.look) {
          const way = endYaw + wrap(t.heading - endYaw) * t.follow;
          const settle = 1 - smoothstep(left, 0.35, clamp(t.length * 0.55, 0.9, 3.4));
          yawGoal = way + wrap(endYaw - way) * settle;
          pitchGoal = endPitch * (1 - 0.7 * t.follow * (1 - settle));
        } else yawGoal = t.yaw0 + wrap(t.heading - t.yaw0) * t.follow;
      } else if (t.look) {
        yawGoal = endYaw;
        pitchGoal = endPitch;
      } else if (t.curve && t.length > 0.9) yawGoal = t.yaw0 + wrap(t.heading - t.yaw0) * t.follow;
      const time = t.quick || !moving ? 0.24 : FEEL.gaze;
      [this.yaw, t.yawSpeed] = follow(this.yaw, this.yaw + wrap(yawGoal - this.yaw), t.yawSpeed, time, FEEL.gazeMost, dt);
      [this.pitch, t.pitchSpeed] = follow(this.pitch, pitchGoal, t.pitchSpeed, time * 1.15, FEEL.gazeMost, dt);
      this.yawTo = this.yaw;
      this.pitchTo = this.pitch;
      this.apply();
      if (!moving) {
        t.rest += dt;
        const off = Math.abs(wrap(yawGoal - this.yaw)) + Math.abs(pitchGoal - this.pitch);
        if (!t.look || off < 0.004 || t.rest > 1.4) {
          if (t.look) this.aim(t.look);
          this.finish();
        }
      }
    } else {
      this.easeLook(dt);
      if (!moving) this.finish();
    }
    this.onMove();
  }

  /** Numbers for scripted checks and tuning. */
  debug() {
    const t = this.travel;
    return {
      yaw: this.yaw,
      pitch: this.pitch,
      yawTo: this.yawTo,
      pitchTo: this.pitchTo,
      speed: t ? t.speed : Math.hypot(this.velocity.x, this.velocity.z),
      spin: this.spin,
      glide: this.glide,
      /** Nothing is moving: not the visitor, not the view. */
      resting: !t && !this.fling && !this.spin && !this.glide && !this.velocity.x && !this.velocity.z && this.yaw === this.yawTo && this.pitch === this.pitchTo,
      roaming: this.roaming,
      pending: this.pending,
      locked: this.locked,
      keys: [...this.keys],
      stick: { ...this.stick },
      marker: this.marker?.shown ?? "",
      travel: t ? { kind: t.kind, length: t.length, s: t.s, gaze: t.gaze } : null,
      feel: FEEL,
    };
  }
  /** The ground as the controller sees it, for scripted checks. */
  readonly ground = { freeAt, route, surface, eyeLevel, radius: RADIUS, node: (place: Place) => nodes[place].clone() };
}
