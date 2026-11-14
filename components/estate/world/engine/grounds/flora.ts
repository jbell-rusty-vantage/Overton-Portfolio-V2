/* Trees, hedges, shrubs and the small plants of the garden, grown from seeds into a few
   large merged meshes: one of bark, one or two of leaf cards, one of clipped foliage.
   Nothing here needs a canvas; it only fills vertex arrays. */
import * as THREE from "three";
import { seeded } from "../kit";
import { CELL, type Cell, type ShadePainter } from "./surfaces";
import { SHADE, TO_SUN, terrain, trunkRadius, type Hedge, type Tree } from "./plan";

export type RGB = [number, number, number];
/** Linear colour triple from a hex string. */
export const tone = (hex: string, gain = 1): RGB => {
  const c = new THREE.Color(hex);
  return [c.r * gain, c.g * gain, c.b * gain];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scale = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k];

/** Vertex arrays for one merged mesh. `wind` is how far a vertex may move in the air. */
export class Mesher {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  wind: number[] = [];
  idx: number[] = [];
  get triangles() {
    return this.idx.length / 3;
  }
  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number, c: RGB, w = 0) {
    this.pos.push(x, y, z);
    this.nor.push(nx, ny, nz);
    this.uv.push(u, v);
    this.col.push(c[0], c[1], c[2]);
    this.wind.push(w);
    return this.pos.length / 3 - 1;
  }
  quad(a: number, b: number, c: number, d: number) {
    this.idx.push(a, b, c, a, c, d);
  }
  build(withWind = true) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    if (withWind) g.setAttribute("aWind", new THREE.Float32BufferAttribute(this.wind, 1));
    g.setIndex(this.pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
  /** An axis-aligned box coloured per face group: sides darker toward the ground. */
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: RGB, tile = 1, lower = 1) {
    const f = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number, dx: number, dy: number, dz: number, nx: number, ny: number, nz: number, w: number, h: number) => {
      const lo = scale(c, lower);
      const a = this.vertex(ax, ay, az, nx, ny, nz, 0, 0, ay < (y0 + y1) / 2 ? lo : c);
      const b = this.vertex(bx, by, bz, nx, ny, nz, w / tile, 0, by < (y0 + y1) / 2 ? lo : c);
      const cc = this.vertex(cx, cy, cz, nx, ny, nz, w / tile, h / tile, cy < (y0 + y1) / 2 ? lo : c);
      const d = this.vertex(dx, dy, dz, nx, ny, nz, 0, h / tile, dy < (y0 + y1) / 2 ? lo : c);
      this.quad(a, b, cc, d);
    };
    const w = x1 - x0,
      h = y1 - y0,
      d = z1 - z0;
    f(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1, 0, 0, 1, w, h);
    f(x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0, 0, 0, -1, w, h);
    f(x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1, 1, 0, 0, d, h);
    f(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0, -1, 0, 0, d, h);
    f(x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0, 0, 1, 0, w, d);
  }
  /** A box turned about the vertical through (cx, cz); sizes are its own width, height, depth. */
  boxAt(cx: number, cy: number, cz: number, w: number, h: number, d: number, yaw: number, c: RGB, pitch = 0) {
    const start = this.pos.length / 3;
    this.box(-w / 2, w / 2, -h / 2, h / 2, -d / 2, d / 2, c);
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
    const v = new THREE.Vector3();
    for (let i = start; i < this.pos.length / 3; i++) {
      v.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]).applyMatrix4(m);
      this.pos[i * 3] = v.x + cx;
      this.pos[i * 3 + 1] = v.y + cy;
      this.pos[i * 3 + 2] = v.z + cz;
      v.set(this.nor[i * 3], this.nor[i * 3 + 1], this.nor[i * 3 + 2]).applyMatrix4(m);
      this.nor[i * 3] = v.x;
      this.nor[i * 3 + 1] = v.y;
      this.nor[i * 3 + 2] = v.z;
    }
  }
}

const E = 0.014;
/** One textured card. `u` and `v` are the unit directions of its width and height; the
    normal is given separately so a whole crown can be shaded as one soft volume. */
export function card(m: Mesher, cx: number, cy: number, cz: number, u: THREE.Vector3, v: THREE.Vector3, w: number, h: number, n: THREE.Vector3, cell: Cell, c: RGB, windLow: number, windHigh: number, flip = false, cTop: RGB = c) {
  const [gx, gy] = CELL[cell];
  let u0 = (gx + E) / 4,
    u1 = (gx + 1 - E) / 4;
  if (flip) [u0, u1] = [u1, u0];
  const vt = (gy + E) / 4,
    vb = (gy + 1 - E) / 4;
  const hx = (u.x * w) / 2,
    hy = (u.y * w) / 2,
    hz = (u.z * w) / 2,
    kx = (v.x * h) / 2,
    ky = (v.y * h) / 2,
    kz = (v.z * h) / 2;
  const a = m.vertex(cx - hx - kx, cy - hy - ky, cz - hz - kz, n.x, n.y, n.z, u0, vb, c, windLow);
  const b = m.vertex(cx + hx - kx, cy + hy - ky, cz + hz - kz, n.x, n.y, n.z, u1, vb, c, windLow);
  const cc = m.vertex(cx + hx + kx, cy + hy + ky, cz + hz + kz, n.x, n.y, n.z, u1, vt, cTop, windHigh);
  const d = m.vertex(cx - hx + kx, cy - hy + ky, cz - hz + kz, n.x, n.y, n.z, u0, vt, cTop, windHigh);
  m.quad(a, b, cc, d);
}
const UP = new THREE.Vector3(0, 1, 0);
const tmpU = new THREE.Vector3(),
  tmpV = new THREE.Vector3(),
  tmpN = new THREE.Vector3();
/** Two crossed upright cards rooted at a point on the ground: a tuft, a clump of flowers. */
export function tuft(m: Mesher, x: number, y: number, z: number, w: number, h: number, yaw: number, cell: Cell, c: RGB, sway: number, cards = 2) {
  for (let i = 0; i < cards; i++) {
    const a = yaw + (i * Math.PI) / cards;
    tmpU.set(Math.cos(a), 0, Math.sin(a));
    card(m, x, y + h / 2, z, tmpU, UP, w, h, UP, cell, scale(c, 0.78), 0, sway, i % 2 === 1, c);
  }
}
/** A card lying on the ground: fallen leaves, ground cover. */
export function flat(m: Mesher, x: number, y: number, z: number, size: number, yaw: number, cell: Cell, c: RGB) {
  tmpU.set(Math.cos(yaw), 0, Math.sin(yaw));
  tmpV.set(-Math.sin(yaw), 0, Math.cos(yaw));
  card(m, x, y, z, tmpU, tmpV, size, size, UP, cell, c, 0, 0);
}

/** A tapering tube along a polyline, with bark coordinates in metres. */
function tube(m: Mesher, pts: THREE.Vector3[], radii: number[], segs: number, c: RGB | RGB[]) {
  const tangent = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    binormal = new THREE.Vector3(),
    q = new THREE.Vector3();
  tangent.subVectors(pts[1], pts[0]).normalize();
  normal.set(1, 0, 0);
  if (Math.abs(tangent.x) > 0.9) normal.set(0, 0, 1);
  normal.sub(q.copy(tangent).multiplyScalar(normal.dot(tangent))).normalize();
  let length = 0;
  let previous = -1;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(pts.length - 1, i + 1)];
    tangent.subVectors(b, a).normalize();
    normal.sub(q.copy(tangent).multiplyScalar(normal.dot(tangent))).normalize();
    binormal.crossVectors(tangent, normal);
    if (i) length += pts[i].distanceTo(pts[i - 1]);
    const col = Array.isArray(c[0]) ? (c as RGB[])[i] : (c as RGB);
    const first = m.pos.length / 3;
    const around = Math.max(1, Math.round((radii[0] * 2 * Math.PI) / 0.7));
    for (let j = 0; j <= segs; j++) {
      const t = (j / segs) * Math.PI * 2,
        cs = Math.cos(t),
        sn = Math.sin(t);
      const nx = normal.x * cs + binormal.x * sn,
        ny = normal.y * cs + binormal.y * sn,
        nz = normal.z * cs + binormal.z * sn;
      m.vertex(pts[i].x + nx * radii[i], pts[i].y + ny * radii[i], pts[i].z + nz * radii[i], nx, ny, nz, (j / segs) * around, length / 1.4, col);
    }
    if (previous >= 0) for (let j = 0; j < segs; j++) m.quad(previous + j, previous + j + 1, first + j + 1, first + j);
    previous = first;
  }
}

type Out = { bark: Mesher; leaves: Mesher; shade: ShadePainter | null; keepOut: (x: number, y: number, z: number, pad: number) => boolean };
type Palette = { bark: RGB; leaf: RGB; turn: RGB[]; turning: number; cell: Cell[]; gain: number };
const G = 1.75; // The atlas is painted mid-grey; this brings a leaf colour back to itself.
const palettes: Record<Tree["kind"], Palette> = {
  magnolia: { bark: tone("#a8a296"), leaf: tone("#27421f", G), turn: [tone("#3a5a26", G)], turning: 0.25, cell: ["magnolia"], gain: 1 },
  oak: { bark: tone("#8a7c6c"), leaf: tone("#4f6a26", G), turn: [tone("#8a6a2c", G), tone("#9a5a2a", G)], turning: 0.45, cell: ["broadA", "broadB"], gain: 1 },
  hackberry: { bark: tone("#aaa496"), leaf: tone("#6c8228", G), turn: [tone("#c2a02c", G), tone("#d8b83a", G)], turning: 0.62, cell: ["broadA", "broadB"], gain: 1 },
  maple: { bark: tone("#978a7a"), leaf: tone("#8a8a2a", G), turn: [tone("#d27a22", G), tone("#bf4a24", G), tone("#d8a02c", G)], turning: 0.8, cell: ["palmate", "broadB"], gain: 1 },
  poplar: { bark: tone("#a09a8c"), leaf: tone("#7c922c", G), turn: [tone("#d8b430", G), tone("#e2c444", G)], turning: 0.7, cell: ["broadB", "broadA"], gain: 1 },
  cedar: { bark: tone("#9a7660"), leaf: tone("#2c4434", G), turn: [tone("#3a5236", G)], turning: 0.3, cell: ["cedar"], gain: 1 },
  dogwood: { bark: tone("#7a6e62"), leaf: tone("#8a3a2a", G), turn: [tone("#a8362a", G), tone("#7a4a2a", G), tone("#6a6a2a", G)], turning: 0.7, cell: ["broadB", "palmate"], gain: 1 },
};
const HAZE = tone("#9fb4a8", G * 0.5);
/** Cheap smooth 3D variation so neighbouring leaves turn colour together. */
const drift = (x: number, y: number, z: number, s: number) => 0.5 + 0.25 * Math.sin(x * 0.61 + s) * Math.cos(z * 0.53 - s * 1.7) + 0.25 * Math.sin(y * 0.8 + x * 0.3 + s * 0.6);

type Crown = { cx: number; cy: number; cz: number; rx: number; ry: number };
function leafCard(out: Out, t: Tree, P: Palette, rand: () => number, x: number, y: number, z: number, size: number, crown: Crown, ground: number) {
  if (out.keepOut(x, y, z, size * 0.45)) return;
  // Outward from the crown's heart, for volume shading.
  tmpN.set((x - crown.cx) / crown.rx, (y - crown.cy) / crown.ry, (z - crown.cz) / crown.rx);
  const depth = Math.min(1, tmpN.length());
  tmpN.normalize();
  const facing = new THREE.Vector3(tmpN.x + (rand() - 0.5) * 1.5, tmpN.y * 0.7 + 0.25 + (rand() - 0.5) * 1.2, tmpN.z + (rand() - 0.5) * 1.5).normalize();
  tmpU.crossVectors(facing, UP);
  if (tmpU.lengthSq() < 0.01) tmpU.set(1, 0, 0);
  tmpU.normalize();
  tmpV.crossVectors(tmpU, facing).normalize();
  const spin = rand() * Math.PI * 2;
  const u = tmpU.clone().multiplyScalar(Math.cos(spin)).addScaledVector(tmpV, Math.sin(spin));
  const v = new THREE.Vector3().crossVectors(facing, u);
  const n = new THREE.Vector3(tmpN.x * 0.85 + facing.x * 0.2, tmpN.y * 0.85 + 0.42 + facing.y * 0.2, tmpN.z * 0.85 + facing.z * 0.2).normalize();
  // Colour: species green drifting to its autumn tones, darker in the crown's depth
  // and on the side away from the sun, hazed with distance.
  const turned = P.turning * 1.5 * drift(x, y, z, t.seed) + (rand() - 0.5) * 0.35 + (y - crown.cy) / crown.ry * 0.12;
  let c = P.leaf;
  if (turned > 0.5) c = mix(P.leaf, P.turn[Math.floor(rand() * P.turn.length)], Math.min(1, (turned - 0.5) * 2.4));
  const sun = tmpN.x * TO_SUN.x + tmpN.y * TO_SUN.y + tmpN.z * TO_SUN.z;
  const lit = (0.5 + 0.5 * depth) * (0.74 + 0.26 * Math.max(0, sun)) * (0.86 + rand() * 0.28);
  c = scale(c, lit);
  const away = Math.hypot(x, z - 8);
  if (away > 26) c = mix(c, HAZE, Math.min(0.32, (away - 26) / 90));
  const w = 0.35 + 0.65 * depth;
  card(out.leaves, x, y, z, u, v, size, size, n, P.cell[Math.floor(rand() * P.cell.length)], c, w * (0.7 + rand() * 0.6), w * (0.7 + rand() * 0.6), rand() < 0.5);
  if (out.shade && t.detail < 2) out.shade.blob(x + SHADE.x * (y - ground), z + SHADE.z * (y - ground), size * 0.5, t.kind === "magnolia" || t.kind === "cedar" ? 0.5 : 0.34);
}

/** A limb as a bent polyline from `from` toward `to`, lifting or drooping on the way. */
function limb(rand: () => number, from: THREE.Vector3, to: THREE.Vector3, steps: number, lift: number, wander: number) {
  const pts = [from.clone()];
  const span = from.distanceTo(to);
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const p = from.clone().lerp(to, k);
    p.y += Math.sin(k * Math.PI) * lift * span;
    if (i < steps) p.add(new THREE.Vector3((rand() - 0.5) * wander, (rand() - 0.5) * wander * 0.6, (rand() - 0.5) * wander));
    pts.push(p);
  }
  return pts;
}
const taper = (n: number, r0: number, r1: number) => Array.from({ length: n }, (_, i) => r0 + (r1 - r0) * Math.pow(i / (n - 1), 0.8));

/** Oak, hackberry, maple, dogwood: a trunk that forks into spreading limbs under a
    rounded crown. */
function broadleaf(t: Tree, out: Out, quality: number) {
  const rand = seeded(t.seed);
  const P = palettes[t.kind];
  const ground = terrain(t.x, t.z);
  const R = trunkRadius(t);
  const small = t.kind === "dogwood";
  const fork = t.h * (small ? 0.26 : t.kind === "oak" ? 0.24 : 0.3);
  const ry = (t.h - fork) * (small ? 0.46 : 0.54);
  const crown: Crown = { cx: t.x, cy: ground + t.h - ry, cz: t.z, rx: t.r, ry };
  const lean = new THREE.Vector3((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5);
  const top = new THREE.Vector3(t.x + lean.x, ground + fork, t.z + lean.z);
  // On the compact tier the wood is drawn with fewer sides and no twigs.
  const fine = quality >= 1;
  const segs = t.detail === 0 ? (fine ? 9 : 6) : t.detail === 1 ? (fine ? 6 : 5) : 5;
  // Trunk with a flare at the root.
  const trunk = [new THREE.Vector3(t.x, ground - 0.15, t.z), new THREE.Vector3(t.x, ground + 0.5, t.z), new THREE.Vector3(t.x + lean.x * 0.4, ground + fork * 0.55, t.z + lean.z * 0.4), top];
  tube(out.bark, trunk, [R * 1.7, R * 1.08, R * 0.92, R * 0.8], segs, [scale(P.bark, 0.6), scale(P.bark, 0.85), P.bark, P.bark]);
  if (out.shade) {
    const sx = SHADE.x * fork,
      sz = SHADE.z * fork;
    out.shade.shape([[t.x - R, t.z], [t.x + R, t.z], [top.x + sx + R * 0.8, top.z + sz], [top.x + sx - R * 0.8, top.z + sz]], 0.55, 0.1);
  }
  const tips: { p: THREE.Vector3; size: number }[] = [];
  const shell = (az: number, el: number, k: number) => new THREE.Vector3(crown.cx + Math.cos(el) * Math.sin(az) * crown.rx * k, crown.cy + Math.sin(el) * crown.ry * k, crown.cz + Math.cos(el) * Math.cos(az) * crown.rx * k);
  const limbs = t.detail === 2 ? 3 : small ? 4 : 5;
  const offset = rand() * 7;
  for (let i = 0; i < limbs; i++) {
    const az = offset + (i / limbs) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const el = i === 0 && !small ? 1.25 : -0.1 + rand() * 0.75;
    const end = shell(az, el, 0.62);
    const pts = limb(rand, top, end, t.detail === 0 ? 5 : 3, 0.12, t.detail === 0 ? 0.5 : 0.2);
    const radii = taper(pts.length, R * 0.56, R * 0.2);
    tube(out.bark, pts, radii, Math.max(fine ? 4 : 3, segs - 3), scale(P.bark, 0.9));
    if (t.detail === 2) {
      tips.push({ p: end, size: 1 });
      continue;
    }
    const boughs = t.detail === 0 ? (fine ? 4 : 3) : 2;
    for (let b = 0; b < boughs; b++) {
      const at = Math.min(pts.length - 1, 1 + Math.floor(((b + 1) / boughs) * (pts.length - 1.01)));
      const bend = shell(az + (rand() - 0.5) * 1.5, el + (rand() - 0.4) * 0.9, 0.9 + rand() * 0.08);
      const bp = limb(rand, pts[at], bend, 3, 0.06, 0.3);
      tube(out.bark, bp, taper(bp.length, radii[at] * 0.62, 0.035), fine ? 4 : 3, scale(P.bark, 0.82));
      tips.push({ p: bend, size: 1 }, { p: bp[2], size: 0.9 });
      if (t.detail === 0 && fine)
        for (let w = 0; w < 2; w++) {
          const twig = shell(az + (rand() - 0.5) * 2.2, el + (rand() - 0.5) * 1.2, 0.96);
          const from = bp[1 + w];
          const tp = [from.clone(), from.clone().lerp(twig, 0.55).add(new THREE.Vector3(0, 0.25, 0)), twig];
          tube(out.bark, tp, [0.05, 0.035, 0.015], 3, scale(P.bark, 0.75));
          tips.push({ p: twig, size: 0.9 });
        }
    }
  }
  // Leaves: clusters at every tip, then a filled shell so the crown reads as a mass.
  const base = small ? 0.85 : t.detail === 0 ? 1.45 : t.detail === 1 ? 2.1 : 0.44 * t.r;
  for (const tip of tips) {
    const n = t.detail === 2 ? 3 : Math.round((t.detail === 0 ? 8 : 4) * quality);
    for (let k = 0; k < n; k++) {
      const s = base * tip.size * (0.75 + rand() * 0.5);
      leafCard(out, t, P, rand, tip.p.x + (rand() - 0.5) * s * 1.7, tip.p.y + (rand() - 0.5) * s * 1.2, tip.p.z + (rand() - 0.5) * s * 1.7, s, crown, ground);
    }
  }
  const area = 4 * Math.PI * crown.rx * (crown.rx + 2 * crown.ry) / 3;
  const fill = Math.round(((t.detail === 2 ? 0.6 : t.detail === 0 ? 1.7 : 1.3) * area * quality) / (base * base));
  for (let k = 0; k < fill; k++) {
    const az = rand() * Math.PI * 2,
      el = Math.asin(-0.42 + rand() * 1.42),
      r = t.detail === 2 ? 0.8 + rand() * 0.2 : 0.6 + Math.pow(rand(), 0.6) * 0.4;
    const p = shell(az, el, r);
    const s = base * (0.8 + rand() * 0.5);
    leafCard(out, t, P, rand, p.x, p.y, p.z, s, crown, ground);
  }
}

/** Magnolia, tulip poplar, red cedar: one leader with whorls of side branches, the
    species told apart by where the crown starts and how its width runs with height. */
function leader(t: Tree, out: Out, quality: number) {
  const rand = seeded(t.seed);
  const P = palettes[t.kind];
  const ground = terrain(t.x, t.z);
  const R = trunkRadius(t);
  const start = t.kind === "magnolia" ? (t.skirt ?? 2.2) : t.kind === "cedar" ? 0.9 : t.h * 0.42;
  const profile = (k: number) =>
    t.kind === "magnolia"
      ? k < 0.26
        ? 0.78 + 0.22 * (k / 0.26)
        : Math.sqrt(Math.max(0.03, 1 - ((k - 0.26) / 0.76) ** 2))
      : t.kind === "cedar"
        ? Math.pow(1 - k, 0.8) * (0.85 + 0.15 * Math.sin(k * 9)) + 0.04
        : Math.sqrt(Math.max(0.04, 1 - ((k - 0.48) / 0.54) ** 2));
  const crown: Crown = { cx: t.x, cy: ground + (start + t.h) / 2, cz: t.z, rx: t.r, ry: (t.h - start) / 2 };
  const segs = t.detail === 0 && quality >= 1 ? 8 : 5;
  const sway = new THREE.Vector3((rand() - 0.5) * 0.4, 0, (rand() - 0.5) * 0.4);
  const spine = (y: number) => new THREE.Vector3(t.x + sway.x * Math.sin((y / t.h) * 2.4), ground + y, t.z + sway.z * Math.sin((y / t.h) * 2.4));
  const stem = [-0.15, 0.5, start, (start + t.h) / 2, t.h * 0.97].map(spine);
  tube(out.bark, stem, [R * 1.6, R * 1.05, R * 0.9, R * 0.5, 0.03], segs, [scale(P.bark, 0.6), scale(P.bark, 0.85), P.bark, P.bark, P.bark]);
  if (out.shade) {
    const sx = SHADE.x * start,
      sz = SHADE.z * start;
    out.shade.shape([[t.x - R, t.z], [t.x + R, t.z], [t.x + sx + R, t.z + sz], [t.x + sx - R, t.z + sz]], 0.55, 0.1);
  }
  const lift = t.kind === "poplar" ? 0.55 : t.kind === "cedar" ? 0.2 : 0.18;
  if (t.detail === 2) {
    // Distant: a few big cards on the crown's surface.
    const n = Math.round(30 * quality);
    for (let i = 0; i < n; i++) {
      const k = rand(),
        az = rand() * 7,
        y = start + k * (t.h - start),
        d = t.r * profile(k) * (0.55 + rand() * 0.4),
        s = t.r * (t.kind === "cedar" ? 0.9 : 0.62);
      leafCard(out, t, P, rand, t.x + Math.sin(az) * d, ground + y, t.z + Math.cos(az) * d, s, crown, ground);
    }
    return;
  }
  const step = t.kind === "cedar" ? 1.0 : t.detail === 0 ? 0.95 : 1.45;
  const size = t.kind === "cedar" ? 1.15 : t.detail === 0 ? 1.3 : 2.0;
  let whorl = rand() * 7;
  for (let y = start; y < t.h * 0.96; y += step * (0.85 + rand() * 0.3)) {
    const k = (y - start) / (t.h - start);
    const reach = t.r * profile(k);
    const count = t.detail === 0 ? 5 : 4;
    whorl += 0.9;
    for (let b = 0; b < count; b++) {
      const az = whorl + (b / count) * Math.PI * 2 + (rand() - 0.5) * 0.5;
      const len = reach * (0.82 + rand() * 0.25);
      const from = spine(y);
      const to = new THREE.Vector3(from.x + Math.sin(az) * len, from.y + len * lift * (1 - k * 0.5) - (t.kind === "magnolia" ? len * 0.1 : 0), from.z + Math.cos(az) * len);
      if (t.kind !== "cedar" && len > 1.2) {
        const pts = limb(rand, from, to, 3, 0.1, 0.15);
        tube(out.bark, pts, taper(pts.length, Math.max(0.035, R * 0.42 * (1 - k * 0.8)), 0.02), t.detail === 0 && quality >= 1 ? 4 : 3, scale(P.bark, 0.8));
      }
      // Leaves crowd the outer part of each branch.
      const clusters = Math.max(1, Math.round((len * 0.85) / (size * 0.55)));
      for (let c = 0; c < clusters; c++) {
        const along = 1 - (c / clusters) * 0.85;
        const n = Math.max(1, Math.round((t.detail === 0 ? 3 : 2.2) * quality));
        for (let j = 0; j < n; j++) {
          const s = size * (0.75 + rand() * 0.55);
          leafCard(out, t, P, rand, from.x + (to.x - from.x) * along + (rand() - 0.5) * s * 0.9, from.y + (to.y - from.y) * along + (rand() - 0.5) * s * 0.7, from.z + (to.z - from.z) * along + (rand() - 0.5) * s * 0.9, s, crown, ground);
        }
      }
    }
  }
  // Crown the leader.
  for (let j = 0; j < 4; j++) leafCard(out, t, P, rand, t.x + (rand() - 0.5) * 0.6, ground + t.h - 0.3 - rand() * 0.6, t.z + (rand() - 0.5) * 0.6, size * 0.8, crown, ground);
}

export function growTree(t: Tree, out: Out, quality: number) {
  // The magnolias by the house keep all their leaves on the compact tier too: thinned
  // further, their whorled branches show through.
  if (t.kind === "magnolia" && t.detail === 0) leader(t, out, 1);
  else if (t.kind === "magnolia" || t.kind === "cedar" || t.kind === "poplar") leader(t, out, quality);
  else broadleaf(t, out, quality);
}

// ── Clipped hedges and shrubs ───────────────────────────────────────────────────
const hash = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
};
const HEDGE = 0.9;
/** A clipped hedge: a box with softened top edges and a slightly uneven surface. */
export function hedgeBox(m: Mesher, h: Hedge, c: RGB) {
  const bevel = Math.min(0.09, (h.x1 - h.x0) * 0.2);
  const rough = (x: number, y: number, z: number) => (hash(Math.round(x * 20), Math.round(y * 20), Math.round(z * 20)) - 0.5) * 0.035;
  const strip = (ax: number, az: number, bx: number, bz: number, nx: number, nz: number) => {
    // One side, from the ground up to the bevel and over it.
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / 0.32));
    const rows: [number, number, number, RGB][] = [
      [0, 0, 0, scale(c, 0.55)],
      [h.h * 0.5, 0, 0, scale(c, 0.85)],
      [h.h - bevel, 0, 0, c],
      [h.h, -bevel, 0.6, scale(c, 1.08)],
    ];
    let previous: number[] = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n,
        x = ax + (bx - ax) * k,
        z = az + (bz - az) * k;
      const column = rows.map(([y, inset, up, col]) => {
        const d = (y > 0 ? rough(x, y, z) : 0) + inset;
        const l = Math.hypot(1 - up, up) || 1;
        // The top row draws in at the corners too, to meet the top face.
        const along = inset && (i === 0 || i === n) ? (i === 0 ? -inset : inset) / len : 0;
        const ex = (bx - ax) * along,
          ez = (bz - az) * along;
        return m.vertex(x + ex + nx * d, y + (y >= h.h ? rough(x, 9, z) : 0), z + ez + nz * d, (nx * (1 - up)) / l, up / l, (nz * (1 - up)) / l, (k * len) / HEDGE, y / HEDGE, col);
      });
      if (i) for (let r = 0; r < rows.length - 1; r++) m.quad(previous[r], column[r], column[r + 1], previous[r + 1]);
      previous = column;
    }
  };
  strip(h.x0, h.z1, h.x1, h.z1, 0, 1);
  strip(h.x1, h.z1, h.x1, h.z0, 1, 0);
  strip(h.x1, h.z0, h.x0, h.z0, 0, -1);
  strip(h.x0, h.z0, h.x0, h.z1, -1, 0);
  // Top.
  const nx = Math.max(1, Math.round((h.x1 - h.x0) / 0.32)),
    nz = Math.max(1, Math.round((h.z1 - h.z0) / 0.32));
  const top = scale(c, 1.08);
  const grid: number[] = [];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      let x = h.x0 + ((h.x1 - h.x0) * i) / nx,
        z = h.z0 + ((h.z1 - h.z0) * j) / nz;
      if (i === 0) x += bevel;
      if (i === nx) x -= bevel;
      if (j === 0) z += bevel;
      if (j === nz) z -= bevel;
      const edge = i === 0 || j === 0 || i === nx || j === nz;
      grid.push(m.vertex(x, h.h + (edge ? rough(x, 9, z) : rough(x, 5, z) + 0.01), z, 0, 1, 0, x / HEDGE, z / HEDGE, top));
    }
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      m.quad(grid[a], grid[a + nx + 1], grid[a + nx + 2], grid[a + 1]);
    }
}
/** A rounded shrub: a lumpy ball sitting on the ground. */
export function shrub(m: Mesher, x: number, y: number, z: number, r: number, ry: number, c: RGB, detail: number, seed: number) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position as THREE.BufferAttribute;
  const base = m.pos.length / 3;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i),
      py = p.getY(i),
      pz = p.getZ(i);
    const lump = 1 + (hash(Math.round(px * 3) + seed, Math.round(py * 3), Math.round(pz * 3)) - 0.5) * 0.16;
    const yy = Math.max(-0.35, py);
    const k = 0.5 + 0.5 * yy;
    m.vertex(x + px * r * lump, y + (yy + 0.35) * ry * lump, z + pz * r * lump, px, py * 0.8 + 0.2, pz, ((Math.atan2(px, pz) / Math.PI) * r * 3) / HEDGE, ((yy + 0.35) * ry) / HEDGE, scale(c, 0.58 + 0.52 * k));
  }
  for (let i = 0; i < p.count; i += 3) m.idx.push(base + i, base + i + 1, base + i + 2);
  g.dispose();
}
