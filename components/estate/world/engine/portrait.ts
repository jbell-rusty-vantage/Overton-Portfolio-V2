/* The custodian. Earl's likeness stays the actual archival photograph at every pose:
   a dense mesh registered to the sitter's features is moved a few millimetres, the way
   a relief would be. Nothing is repainted. The only added surface is the dark interior
   revealed between the lips when he speaks.
   Feature positions are measured on the TeVA photograph (u to the right, v down). */
import * as THREE from "three";
import { anchor, type Cue } from "@/lib/estate/world";
import type { Finishes } from "./room";
import { Batch } from "./kit";

const SIZE = { w: 0.848, h: 1.064 };
const eyes = [
  { u: 0.468, v: 0.288, lid: 0.279, brow: 0.262 },
  { u: 0.553, v: 0.297, lid: 0.288, brow: 0.272 },
];
const mouth = { u0: 0.452, u1: 0.55, v: 0.3925, uc: 0.503 };
const head = { u: 0.47, v: 0.31 };
const gauss = (d: number, s: number) => Math.exp(-(d * d) / (s * s));
const smooth = THREE.MathUtils.smoothstep;

function axis(dense: [number, number], fine: number, coarse: number) {
  const out: number[] = [];
  let t = 0;
  while (t < 1) {
    out.push(t);
    t += t >= dense[0] - 1e-6 && t < dense[1] ? fine : Math.min(coarse, t < dense[0] ? dense[0] - t : 1);
    t = Math.round(t * 1e5) / 1e5;
  }
  out.push(1);
  return out;
}

export type Pose = {
  gazeX: number;
  gazeY: number;
  turn: number;
  nod: number;
  blink: number;
  jaw: number;
  wide: number;
  brow: number;
  breath: number;
};
const still: Pose = { gazeX: 0, gazeY: 0, turn: 0, nod: 0, blink: 0, jaw: 0, wide: 0, brow: 0, breath: 0 };

export class Portrait {
  readonly ready: Promise<void>;
  readonly group = new THREE.Group();
  readonly hit: THREE.Mesh;
  private disposed = false;
  private geometry = new THREE.BufferGeometry();
  private base: Float32Array;
  private uvs: Float32Array;
  private weights: Record<string, Float32Array>;
  private lower: Uint8Array;
  private pose: Pose = { ...still };
  private goal: Pose = { ...still };
  private nextBlink = 2.5;
  private blinkAt = -1;
  private clock = 0;
  private material: THREE.MeshStandardMaterial;
  /** The visitor has entered the room: eyes and head may answer. */
  awake = false;
  /** Performance to follow: a cue and the playback clock that owns the time. */
  speech: { cue: Cue; time: () => number; playing: () => boolean } | null = null;
  /** Live conversation: the current loudness (0..1) of the portrait's generated voice. */
  live: (() => number) | null = null;
  /** Unit direction from the sitter toward whatever he is pointing out. */
  private attention = new THREE.Vector3(1, 0, 0);
  private centre = new THREE.Vector3(...(anchor["portrait.judge"] as [number, number, number]));

  constructor(url: string, f: Finishes, private redraw: () => void) {
    const us = axis([0.36, 0.64], 0.005, 0.045);
    // A doubled row on the lip line lets the mouth part.
    const vs = axis([0.23, 0.48], 0.005, 0.045);
    const seam = vs.findIndex((v) => v >= mouth.v);
    vs.splice(seam, vs[seam] === mouth.v ? 1 : 0, mouth.v, mouth.v);
    const cols = us.length,
      rows = vs.length;
    const n = cols * rows;
    this.base = new Float32Array(n * 3);
    this.uvs = new Float32Array(n * 2);
    this.lower = new Uint8Array(n);
    const names = ["gaze", "head", "depth", "lidL", "lidR", "jaw", "lens", "lip", "corner", "browW", "chest"];
    this.weights = Object.fromEntries(names.map((k) => [k, new Float32Array(n)]));
    const W = this.weights;
    const index: number[] = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i,
          u = us[i],
          v = vs[j];
        // The picture plane: +u runs north (−Z), v runs down.
        this.base[k * 3] = 0;
        this.base[k * 3 + 1] = (0.5 - v) * SIZE.h;
        this.base[k * 3 + 2] = -(u - 0.5) * SIZE.w;
        this.uvs[k * 2] = u;
        this.uvs[k * 2 + 1] = 1 - v;
        const below = j > seam;
        this.lower[k] = below ? 1 : 0;
        W.gaze[k] = Math.max(
          gauss(u - eyes[0].u, 0.012) * gauss(v - eyes[0].v, 0.0085),
          gauss(u - eyes[1].u, 0.011) * gauss(v - eyes[1].v, 0.008),
        );
        const hw = gauss(u - head.u, 0.15) * gauss(v - head.v, 0.175);
        W.head[k] = hw;
        W.depth[k] = hw * (0.45 + 0.75 * gauss(u - 0.525, 0.07) * gauss(v - 0.34, 0.085));
        // Upper lids: fixed at the brow, closing fully at the lash line.
        eyes.forEach((e, n2) => {
          const across = gauss(u - e.u, 0.027);
          const down = v <= e.lid ? smooth(v, e.brow, e.lid) : 1 - smooth(v, e.lid, e.lid + 0.014);
          W[n2 ? "lidR" : "lidL"][k] = across * down;
        });
        W.browW[k] = Math.max(
          gauss(u - eyes[0].u, 0.05) * gauss(v - eyes[0].brow, 0.018),
          gauss(u - eyes[1].u, 0.04) * gauss(v - eyes[1].brow, 0.018),
        );
        // The opening is a lens between the corners of the mouth.
        const m = THREE.MathUtils.clamp((u - mouth.u0) / (mouth.u1 - mouth.u0), 0, 1);
        const lens = Math.sin(Math.PI * m) ** 0.8 * (u > mouth.u0 && u < mouth.u1 ? 1 : 0);
        const chin = gauss(u - mouth.uc, 0.085);
        if (below) {
          const drop = smooth(v, mouth.v, mouth.v + 0.022);
          W.jaw[k] = THREE.MathUtils.lerp(lens, chin, drop) * (1 - smooth(v, 0.43, 0.475));
        } else W.lip[k] = lens * (1 - smooth(mouth.v - v, 0, 0.016));
        W.lens[k] = lens;
        W.corner[k] =
          (gauss(u - mouth.u0, 0.022) - gauss(u - mouth.u1, 0.022)) * gauss(v - mouth.v, 0.02);
        W.chest[k] = smooth(v, 0.5, 0.92);
        if (i && j && j !== seam + 1) index.push(k - cols - 1, k - 1, k - cols, k - cols, k - 1, k);
      }
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.base.slice(), 3));
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setIndex(index);
    this.geometry.computeVertexNormals();
    let ready!: () => void;
    this.ready = new Promise<void>(resolve => { ready = resolve; });
    const texture = new THREE.TextureLoader().load(url, (loaded) => { if (this.disposed) loaded.dispose(); else this.redraw(); ready(); }, undefined, ready);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    this.material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      emissive: "#ffffff",
      emissiveMap: texture,
      emissiveIntensity: 0.34,
      side: THREE.DoubleSide,
    });
    const canvas = new THREE.Mesh(this.geometry, this.material);
    canvas.rotation.y = 0;
    canvas.name = "Overton · registered likeness";
    // Between the lips: one strip joining the doubled row, almost black.
    const strip: number[] = [];
    for (let i = 1; i < cols; i++) {
      const a = seam * cols + i,
        b = (seam + 1) * cols + i;
      strip.push(a - 1, b - 1, a, a, b - 1, b);
    }
    const inner = new THREE.BufferGeometry();
    inner.setAttribute("position", this.geometry.attributes.position);
    inner.setIndex(strip);
    const dark = new THREE.Mesh(inner, new THREE.MeshBasicMaterial({ color: "#1a120e", side: THREE.DoubleSide }));
    dark.position.x = -0.0006;
    // Gilt frame with an ebonized sight edge.
    const moulding = new Batch();
    const rail = (w: number, h: number, d: number, y: number, z: number, m: THREE.Material, x = 0) =>
      moulding.add(new THREE.BoxGeometry(d, h, w), m, [x + d / 2 - 0.03, y, z]);
    const { w, h } = SIZE;
    for (const s of [-1, 1]) {
      rail(0.075, h + 0.15, 0.05, 0, s * (w / 2 + 0.0375), f.gilt);
      rail(w + 0.15, 0.075, 0.05, s * (h / 2 + 0.0375), 0, f.gilt);
      rail(0.03, h + 0.21, 0.065, 0, s * (w / 2 + 0.09), f.gilt, 0.004);
      rail(w + 0.21, 0.03, 0.065, s * (h / 2 + 0.09), 0, f.gilt, 0.004);
      rail(0.012, h + 0.012, 0.036, 0, s * (w / 2 + 0.003), f.ebony);
      rail(w + 0.012, 0.012, 0.036, s * (h / 2 + 0.003), 0, f.ebony);
    }
    const frame = moulding.build("Gilt frame");
    const backing = new THREE.Mesh(new THREE.BoxGeometry(0.02, h + 0.1, w + 0.1), f.ebony);
    backing.position.x = -0.022;
    this.hit = new THREE.Mesh(new THREE.BoxGeometry(0.1, h + 0.2, w + 0.2), new THREE.MeshBasicMaterial({ visible: false }));
    this.group.add(backing, dark, canvas, frame, this.hit);
    this.group.position.copy(this.centre);
    this.group.name = "Portrait of Judge Overton";
  }
  /** Direct the sitter's attention to a point in the room, or back to the visitor. */
  attend(point: THREE.Vector3 | null) {
    if (point) this.attention.copy(point).sub(this.centre).normalize();
    else this.attention.set(0, 0, 0);
  }
  private deform() {
    const p = this.pose;
    const pos = this.geometry.attributes.position as THREE.BufferAttribute;
    const a = pos.array as Float32Array;
    const W = this.weights;
    const { w, h } = SIZE;
    for (let k = 0; k < a.length / 3; k++) {
      // Displacements in picture units: du to the right, dv down.
      let du = p.gazeX * 0.0062 * W.gaze[k] + p.turn * 0.013 * W.depth[k] + p.wide * 0.0045 * W.corner[k];
      let dv =
        p.gazeY * 0.004 * W.gaze[k] +
        p.nod * 0.008 * W.head[k] +
        p.blink * ((eyes[0].v + 0.004 - eyes[0].lid) * W.lidL[k] + (eyes[1].v + 0.004 - eyes[1].lid) * W.lidR[k]) -
        p.brow * 0.005 * W.browW[k] -
        p.breath * 0.0016 * W.chest[k];
      dv += this.lower[k] ? p.jaw * 0.0125 * W.jaw[k] : -p.jaw * 0.0034 * W.lip[k];
      du += this.lower[k] ? p.turn * 0.002 * W.jaw[k] : 0;
      a[k * 3] = this.base[k * 3] + p.turn * 0.006 * W.depth[k];
      a[k * 3 + 1] = this.base[k * 3 + 1] - dv * h;
      a[k * 3 + 2] = this.base[k * 3 + 2] - du * w;
    }
    pos.needsUpdate = true;
  }
  /** Returns true while the likeness is moving. */
  update(dt: number, camera: THREE.Vector3, reduced: boolean) {
    if (reduced) {
      const moved = Object.values(this.pose).some((v) => v !== 0);
      if (moved) {
        this.pose = { ...still };
        this.deform();
      }
      return false;
    }
    this.clock += dt;
    const g = this.goal;
    Object.assign(g, still);
    const speech = this.speech;
    const active = this.awake || !!speech || !!this.live;
    if (active) {
      // Find the visitor: eyes first, the head a little after.
      const to = camera.clone().sub(this.centre);
      const side = THREE.MathUtils.clamp(-to.z / Math.max(1.2, to.x), -1, 1);
      const rise = THREE.MathUtils.clamp((to.y + 0.3) / Math.max(1.5, to.x), -1, 1);
      let gx = -0.55 + side * 0.9,
        gy = 0.25 - rise * 0.5,
        turn = side * 0.5 - 0.12;
      if (this.attention.lengthSq() > 0) {
        const a = this.attention;
        gx = THREE.MathUtils.clamp(-a.z * 1.6, -1, 1);
        gy = THREE.MathUtils.clamp(-a.y * 1.4, -1, 1);
        turn = THREE.MathUtils.clamp(-a.z * 0.9, -1, 1);
      }
      g.gazeX = THREE.MathUtils.clamp(gx, -1, 1);
      g.gazeY = gy;
      g.turn = turn + Math.sin(this.clock * 0.43) * 0.06;
      g.nod = Math.sin(this.clock * 0.31 + 1) * 0.12;
      g.breath = Math.sin(this.clock * 1.25);
      // Blinks: irregular, quick down, slower up.
      if (this.clock > this.nextBlink) {
        this.blinkAt = this.clock;
        this.nextBlink = this.clock + 2.6 + ((this.clock * 7.3) % 3.4);
      }
      const b = this.clock - this.blinkAt;
      g.blink = this.blinkAt >= 0 && b < 0.26 ? (b < 0.08 ? b / 0.08 : 1 - (b - 0.08) / 0.18) : 0;
    }
    if (speech && speech.cue.open.length) {
      const t = speech.time();
      const f = t * 30;
      const i = Math.floor(f),
        frac = f - i;
      const sample = (s: string, n: number) => (n >= 0 && n < s.length ? (s.charCodeAt(n) - 48) / 9 : 0);
      if (speech.playing()) {
        g.jaw = THREE.MathUtils.lerp(sample(speech.cue.open, i), sample(speech.cue.open, i + 1), frac);
        const wd = THREE.MathUtils.lerp(sample(speech.cue.wide, i), sample(speech.cue.wide, i + 1), frac);
        g.wide = (wd - 0.5) * 2;
        g.brow = Math.max(0, g.jaw - 0.55) * 0.9;
        g.nod += g.jaw * 0.22;
      }
    }
    if (this.live) {
      const level = this.live();
      g.jaw = level;
      g.wide = Math.sin(this.clock * 7.1) * 0.25 * level;
      g.brow = Math.max(0, level - 0.55) * 0.9;
      g.nod += level * 0.22;
    }
    let moved = false;
    const rate: Record<keyof Pose, number> = { gazeX: 9, gazeY: 9, turn: 2.6, nod: 3, blink: 60, jaw: 34, wide: 20, brow: 8, breath: 6 };
    for (const k of Object.keys(g) as (keyof Pose)[]) {
      const next = THREE.MathUtils.damp(this.pose[k], g[k], rate[k], dt);
      if (Math.abs(next - this.pose[k]) > 0.0004) moved = true;
      this.pose[k] = Math.abs(next - g[k]) < 0.0004 ? g[k] : next;
    }
    if (moved) this.deform();
    return active || moved;
  }
  dispose() {
    this.disposed = true;
    this.geometry.dispose();
    this.material.map?.dispose();
    this.material.dispose();
  }
}
