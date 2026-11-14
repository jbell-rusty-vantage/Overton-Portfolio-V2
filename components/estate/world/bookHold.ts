/* A hand on the book. While it is dragged the volume follows the pointer and closes a
   little; let go far enough toward its shelf (or flung) it goes back, otherwise it
   settles open again. The book's pose stays a pure function of its `progress` and of
   where the hand is: this class only moves those two inputs. */
import * as THREE from "three";
import { CARRY, type Hand, type Volume3D } from "./engine/volume";

export type Release = "tap" | "stay" | "return";

export class BookHold {
  /** How far the book sits from its place in the hand, in CSS pixels on screen. */
  private offset = new THREE.Vector2();
  private grab: {
    book: Volume3D;
    x0: number;
    y0: number;
    x: number;
    y: number;
    from: number;
    loose: boolean;
    /** Unit direction on screen from the grab toward the volume's own slot. */
    home: THREE.Vector2 | null;
    /** Where that slot is on screen, when it is in view. */
    slot: THREE.Vector2 | null;
    vx: number;
    vy: number;
    t: number;
  } | null = null;
  armed = false;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private size: () => { w: number; h: number },
  ) {}
  /** The book has left the reading position under the visitor's hand. */
  get loose() {
    return !!this.grab?.loose;
  }
  get active() {
    return !!this.grab;
  }
  begin(book: Volume3D, x: number, y: number) {
    const { w, h } = this.size();
    const slot = book.spec.rest.position.clone().project(this.camera);
    const home =
      slot.z < 1
        ? new THREE.Vector2(((slot.x + 1) / 2) * w - x, ((1 - slot.y) / 2) * h - y)
        : null;
    this.grab = {
      book,
      x0: x,
      y0: y,
      x,
      y,
      from: book.progress,
      loose: false,
      slot: home ? new THREE.Vector2(x + home.x, y + home.y) : null,
      home: home && home.length() > 24 ? home.normalize() : null,
      vx: 0,
      vy: 0,
      t: performance.now(),
    };
    this.armed = false;
  }
  /** Follow the pointer. Returns true once letting go would send the book back. */
  move(x: number, y: number) {
    const g = this.grab;
    if (!g) return false;
    const now = performance.now();
    const dt = Math.max(1, now - g.t);
    g.vx = g.vx * 0.5 + ((x - g.x) / dt) * 0.5;
    g.vy = g.vy * 0.5 + ((y - g.y) / dt) * 0.5;
    g.x = x;
    g.y = y;
    g.t = now;
    const dx = x - g.x0,
      dy = y - g.y0,
      far = Math.hypot(dx, dy);
    if (!g.loose && far < 7) return false;
    g.loose = true;
    const { w, h } = this.size();
    const reach = Math.min(w, h);
    this.offset.set(dx, dy);
    // The further it is carried, the more it closes; it never reopens under the hand.
    const pull = THREE.MathUtils.smoothstep(far / (reach * 0.5), 0, 1);
    g.book.hold(g.from - (g.from - Math.min(g.from, CARRY + 0.02)) * pull);
    const toward = g.home ? dx * g.home.x + dy * g.home.y : far * 0.6;
    // Far enough toward the shelf, far enough in any direction, or brought to the
    // slot itself (a book caught as it left has only a little way to go).
    const atSlot = !!g.slot && far > 20 && Math.hypot(x - g.slot.x, y - g.slot.y) < reach * 0.09;
    this.armed = toward > reach * 0.14 || far > reach * 0.3 || atSlot;
    return this.armed;
  }
  /** Let go. `abandon` (a cancelled touch) never sends the book away. */
  end(abandon = false): Release {
    const g = this.grab;
    this.grab = null;
    if (!g) return "stay";
    if (!g.loose) return "tap";
    const speed = Math.hypot(g.vx, g.vy);
    const flung = speed > 0.9 && Math.hypot(g.x - g.x0, g.y - g.y0) > 36 && performance.now() - g.t < 90;
    const away = !abandon && (this.armed || flung);
    this.armed = false;
    // Staying: it rises back to the reading position along the same path.
    if (!away) g.book.target = 1;
    return away ? "return" : "stay";
  }
  /** Shift the hand by the drag and ease it home when nothing holds the book. */
  apply(hand: Hand, dt: number, reduced: boolean) {
    const o = this.offset;
    let moving = false;
    if (!this.grab && (o.x || o.y)) {
      if (reduced) o.set(0, 0);
      else {
        o.x = THREE.MathUtils.damp(o.x, 0, 9, dt);
        o.y = THREE.MathUtils.damp(o.y, 0, 9, dt);
        if (Math.abs(o.x) + Math.abs(o.y) < 0.4) o.set(0, 0);
      }
      moving = true;
    }
    if (o.x || o.y) {
      const { h } = this.size();
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      const depth = hand.position.clone().sub(this.camera.position).dot(forward);
      const perPixel = (2 * depth * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) / h;
      hand.position
        .add(new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).multiplyScalar(o.x * perPixel))
        .add(new THREE.Vector3(0, -1, 0).applyQuaternion(this.camera.quaternion).multiplyScalar(o.y * perPixel));
    }
    return moving || !!this.grab?.loose;
  }
}
