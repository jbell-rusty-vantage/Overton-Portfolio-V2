/* The plan of the grounds: where every tree, hedge, path, fence and person stands.
   Pure numbers, no DOM and no WebGL, so the camera controller (and the server, which
   imports this while rendering the page shell) can read the obstacle and walking
   contract before anything is drawn. Metres, Y up, south +Z, west −X. */
import { seeded, type Tier } from "../kit";

export type Box = [x0: number, x1: number, z0: number, z1: number];
export type Circle = { x: number; z: number; r: number };

/** Ground displacement of a shadow per metre of height: the sun is fixed in the
    south-south-west (light travels along 0.36, −0.56, −0.75). */
export const SHADE = { x: 0.36 / 0.56, z: -0.75 / 0.56 };
/** Unit vector from the ground towards the sun. */
export const TO_SUN = { x: -0.359, y: 0.558, z: 0.748 };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** The lawn is level around the house and garden, then rolls gently and falls away to
    the south, as the house stands on a rise. */
export function terrain(x: number, z: number) {
  // Keep the surveyed garden and outbuilding platforms level. The former scenic
  // roll began inside the newly corrected site and buried the remote buildings.
  const s = smooth(70, 110, Math.hypot(x, z - 8));
  if (!s) return 0;
  return (
    s *
    (-(z - 8) * 0.026 +
      1.1 * Math.sin(x * 0.05 + 1.3) * Math.cos(z * 0.043 + 0.4) +
      0.5 * Math.sin(x * 0.11 + z * 0.09))
  );
}
/** Height of the lawn under a point. The porch deck and its steps belong to the house
    and are the walking controller's to measure. */
export function heightAt(x: number, z: number) {
  return terrain(x, z);
}

// Survey grounds offsets are measured from the south threshold: add 3.12 to Z.
// Position tolerance is ±3 m; species and planting remain interpretation.
export const GARDEN = { x0: 25, x1: 38, z0: -19.88, z1: 6.62, hedge: 0.7, height: 0.85,
  leg: 1.1, gap: [-8.38, -6.38] as [number, number], bed: [26, 28, -15.5, 1.5] as Box };
export const WALK = { half: 0.9, z0: 5.25, z1: 15.12 };
export const DRIVE = { cx: 0, cz: 33.62, rx: 18, rz: 18.5, irx: 15, irz: 15.5 };
export type Hedge = { x0: number; x1: number; z0: number; z1: number; h: number };
export const hedges: Hedge[] = [];
export const edgings: Hedge[] = [];
export const beds: Box[] = [[26,28,-15.5,1.5], [35,37,-15.5,1.5]];
export const gravel: Box[] = [[-WALK.half,WALK.half,WALK.z0,WALK.z1], [18,19.5,-22,13], [19.5,29,-8.38,-6.38]];
// An oval lawn inside the east garden, with an opening on its west side.
for (let i=0;i<64;i++) {
 const a=i*Math.PI*2/64, b=(i+1)*Math.PI*2/64;
 const x=31.5+6*Math.cos(a), z=-6.63+12.7*Math.sin(a);
 const xx=31.5+6*Math.cos(b), zz=-6.63+12.7*Math.sin(b);
 if ((x+xx)/2<26.2 && (z+zz)/2>-8.7 && (z+zz)/2<-6.1) continue;
 hedges.push({x0:Math.min(x,xx)-.35,x1:Math.max(x,xx)+.35,z0:Math.min(z,zz)-.35,z1:Math.max(z,zz)+.35,h:.85});
}
// Bare lawn reaches the south weatherboards in the 2021 photograph.
export const foundation: Box[] = [];
export type Fence = { from: [number,number]; to: [number,number]; kind: "picket" | "board" };
export const fences: Fence[] = [
 {from:[-8,-1],to:[-11.2,-1],kind:"board"},
 {from:[-11.2,-1],to:[-24,-1],kind:"picket"},
 {from:[-20,70.12],to:[-2,70.12],kind:"picket"},
 {from:[2,70.12],to:[62,70.12],kind:"picket"},
];
export const OUTBUILDINGS = [
 {name:"Weaving House",x0:-25,x1:-19,z0:-44.38,z1:-37.38,eave:5.5,ridge:7.2},
 {name:"Smokehouse",x0:-8,x1:-2,z0:-48.88,z1:-42.88,eave:2.8,ridge:4.5},
 {name:"Law office — 1950s reconstruction",x0:33,x1:40.5,z0:59.62,z1:65.62,eave:3,ridge:4.9},
];
export const OUTBUILDING = OUTBUILDINGS[0];

// ── Trees ───────────────────────────────────────────────────────────────────────
export type Species = "magnolia" | "oak" | "hackberry" | "maple" | "poplar" | "cedar" | "dogwood";
export type Tree = {
  kind: Species;
  x: number;
  z: number;
  /** Height and crown radius in metres. */
  h: number;
  r: number;
  seed: number;
  /** 0 a tree the visitor walks under, 1 seen across the lawn, 2 distant. */
  detail: 0 | 1 | 2;
  /** Height at which foliage begins. */
  skirt?: number;
};
const near: Tree[] = [
  // The magnolias the record describes, at each end of the house and in the oval.
  { kind: "magnolia", x: -14, z: 7.12, h: 14.5, r: 6.5, seed: 11, detail: 0, skirt: 2.4 },
  { kind: "magnolia", x: 17, z: 7.12, h: 15.5, r: 8, seed: 12, detail: 0, skirt: 2.3 },
  { kind: "magnolia", x: 6, z: 34.62, h: 13.0, r: 4.5, seed: 13, detail: 0, skirt: 2.5 },
  // Shade trees over the garden, turning in autumn.
  { kind: "hackberry", x: -11.6, z: 13.2, h: 18.0, r: 8.0, seed: 21, detail: 0 },
  { kind: "maple", x: 11.6, z: 12.9, h: 15.5, r: 6.6, seed: 22, detail: 0 },
  { kind: "dogwood", x: -11.0, z: 8.4, h: 4.6, r: 2.7, seed: 31, detail: 0 },
  { kind: "dogwood", x: 11.2, z: 8.0, h: 4.2, r: 2.5, seed: 32, detail: 0 },
];
const middle: Tree[] = [
  { kind: "poplar", x: -13.5, z: -7.5, h: 24, r: 4.6, seed: 41, detail: 1 },
  { kind: "oak", x: 7.6, z: -12.5, h: 21, r: 8.5, seed: 42, detail: 1 },
  { kind: "hackberry", x: 15.5, z: -5.5, h: 17, r: 6.2, seed: 43, detail: 1 },
  { kind: "oak", x: -18, z: -19, h: 22, r: 8.2, seed: 44, detail: 1 },
  { kind: "cedar", x: -19.5, z: 1.6, h: 10, r: 2.6, seed: 45, detail: 1 },
  { kind: "cedar", x: -22.2, z: -4.2, h: 11.5, r: 2.9, seed: 46, detail: 1 },
  { kind: "cedar", x: 18.6, z: 0.8, h: 9.5, r: 2.5, seed: 47, detail: 1 },
  { kind: "cedar", x: 20.4, z: 8.6, h: 10.5, r: 2.7, seed: 48, detail: 1 },
  { kind: "maple", x: -15.6, z: 22.5, h: 15, r: 6.0, seed: 49, detail: 1 },
  { kind: "oak", x: 15.4, z: 25.0, h: 19, r: 8.0, seed: 50, detail: 1 },
  { kind: "magnolia", x: 8.6, z: 36.5, h: 13, r: 5.0, seed: 51, detail: 1, skirt: 2.2 },
  { kind: "oak", x: -8.5, z: 38.0, h: 20, r: 8.0, seed: 52, detail: 1 },
  { kind: "poplar", x: 11.5, z: -24, h: 25, r: 4.6, seed: 53, detail: 1 },
  { kind: "maple", x: -3.5, z: -37, h: 18, r: 6.5, seed: 54, detail: 1 },
];
/** Trees lining the long lawn to the south and closing the view round the house. */
function distant(count: number) {
  const rand = seeded(907);
  const kinds: Species[] = ["oak", "hackberry", "maple", "poplar", "cedar", "oak", "maple", "hackberry"];
  const out: Tree[] = [];
  let guard = 0;
  while (out.length < count && guard++ < 4000) {
    const lining = out.length < count * 0.45;
    let x: number, z: number;
    if (lining) {
      // Two rows down the edges of the south lawn.
      const side = out.length % 2 ? 1 : -1;
      x = side * (19 + rand() * 9);
      z = 30 + rand() * 34;
    } else {
      const a = rand() * Math.PI * 2,
        d = 30 + rand() * 26;
      x = Math.sin(a) * d;
      z = 8 + Math.cos(a) * d;
      // Keep the long lawn open down the middle.
      if (z > 20 && Math.abs(x) < 17) continue;
    }
    if (Math.hypot(x, z - 8) > 58) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 7)) continue;
    if (middle.some((t) => Math.hypot(t.x - x, t.z - z) < 8)) continue;
    const kind = kinds[Math.floor(rand() * kinds.length)];
    const h = kind === "cedar" ? 9 + rand() * 4 : kind === "poplar" ? 21 + rand() * 6 : 14 + rand() * 8;
    const r = kind === "cedar" ? 2.4 + rand() * 0.8 : kind === "poplar" ? 4 + rand() * 1.2 : 5.5 + rand() * 3;
    out.push({ kind, x, z, h, r, seed: 1000 + out.length, detail: 2 });
  }
  return out;
}
const far = distant(30);
export function treesFor(tier: Tier): Tree[] {
  return tier === "high"
    ? [...near, ...middle, ...far]
    : [...near, ...middle.filter((_, i) => i % 3 !== 2), ...far.filter((_, i) => i % 2 === 0)];
}
export const trunkRadius = (t: Tree) =>
  t.kind === "dogwood" ? 0.1 : t.kind === "cedar" ? 0.2 : 0.015 * t.h + 0.05;

// ── Furniture and people ────────────────────────────────────────────────────────
/** The bench under the oval magnolia, facing the house. */
export const BENCH = { x: 4, z: 36.6, yaw: Math.atan2(-4, -31.6) };
/** The interpretive sign in the east parterre, read from the path north of the bed. */
export const SIGN = { x: 28, z: -7.4, yaw: Math.PI };

export type Role = "guide" | "reader" | "sitter" | "photographer" | "companion" | "parent" | "partner" | "child";
export type Person = { role: Role; x: number; z: number; yaw: number };
/** Where the people who stand or sit are. The walking family is described by its loop. */
export const standing: Person[] = [
  // The guide waits on the grass east of the steps, clear of the door and the walk.
  { role: "guide", x: 2.5, z: 5.0, yaw: Math.atan2(-1.4, 6.5) },
  { role: "reader", x: 28, z: -8.3, yaw: 0 },
  { role: "sitter", x: BENCH.x, z: BENCH.z, yaw: BENCH.yaw },
  { role: "photographer", x: 3.4, z: 16.2, yaw: Math.atan2(-3.4, -12.2) },
  { role: "companion", x: 4.3, z: 15.9, yaw: Math.atan2(-4.6, -11.2) },
];
/** The family strolls round the bed of the west parterre: a rounded rectangle, walked
    anticlockwise seen from above, well clear of the central walk. */
export const LOOP = { x0: 29, x1: 34, z0: -14, z1: 0, corner: 0.5 };
export const loopLength = () => {
  const { x0, x1, z0, z1, corner: c } = LOOP;
  return 2 * (x1 - x0 - 2 * c) + 2 * (z1 - z0 - 2 * c) + 2 * Math.PI * c;
};
/** Point and heading on the family's loop at distance `s` along it. */
export function loopAt(s: number): { x: number; z: number; yaw: number } {
  const { x0, x1, z0, z1, corner: c } = LOOP;
  const a = x1 - x0 - 2 * c,
    b = z1 - z0 - 2 * c,
    q = (Math.PI / 2) * c;
  const total = 2 * a + 2 * b + 4 * q;
  let d = ((s % total) + total) % total;
  // Start on the north leg heading west, so the group first shows its faces to the walk.
  const arc = (cx: number, cz: number, start: number, t: number) => {
    const ang = start + (t / q) * (Math.PI / 2);
    return { x: cx + Math.sin(ang) * c, z: cz + Math.cos(ang) * c, yaw: ang + Math.PI / 2 };
  };
  if (d < a) return { x: x1 - c - d, z: z0, yaw: -Math.PI / 2 };
  d -= a;
  if (d < q) return arc(x0 + c, z0 + c, Math.PI, d);
  d -= q;
  if (d < b) return { x: x0, z: z0 + c + d, yaw: 0 };
  d -= b;
  if (d < q) return arc(x0 + c, z1 - c, -Math.PI / 2, d);
  d -= q;
  if (d < a) return { x: x0 + c + d, z: z1, yaw: Math.PI / 2 };
  d -= a;
  if (d < q) return arc(x1 - c, z1 - c, 0, d);
  d -= q;
  if (d < b) return { x: x1, z: z1 - c - d, yaw: Math.PI };
  d -= b;
  return arc(x1 - c, z0 + c, Math.PI / 2, d);
}

// ── The contract with the walking controller ────────────────────────────────────
/** Where a visitor may walk outdoors. The house itself is left out; the porch is the
    controller's own. */
export const walkable: Box[] = [
 [-1.9,1.9,4.85,5.5], [-24,45,5.3,65],
 [-24,-8.6,-51,5.3], [8.6,45,-51,5.3], [-24,45,-51,-30],
 [-7.7,-1.9,3.3,5.3],[1.9,7.7,3.3,5.3],
];
export function obstaclesFor(tier: Tier): Circle[] {
  const out: Circle[] = [];
  for (const t of treesFor(tier)) out.push({ x: t.x, z: t.z, r: trunkRadius(t) + 0.4 });
  const along = (x0: number, x1: number, z0: number, z1: number, pad: number) => {
    const w = x1 - x0,
      d = z1 - z0,
      r = Math.min(w, d) / 2 + pad,
      n = Math.max(1, Math.ceil(Math.max(w, d) / (r * 1.3)));
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      out.push(
        w >= d
          ? { x: x0 + r - pad + t * (w - 2 * (r - pad)), z: (z0 + z1) / 2, r }
          : { x: (x0 + x1) / 2, z: z0 + r - pad + t * (d - 2 * (r - pad)), r },
      );
    }
  };
  for (const h of hedges) along(h.x0, h.x1, h.z0, h.z1, 0.2);
  for (const [x0,x1,z0,z1] of beds) along(x0,x1,z0,z1,0.15);
  for (const b of foundation) along(b[0], b[1], b[2], b[3], 0.15);
  for (const f of fences) {
    const len = Math.hypot(f.to[0] - f.from[0], f.to[1] - f.from[1]);
    const n = Math.ceil(len / 0.7);
    for (let i = 0; i <= n; i++)
      out.push({
        x: f.from[0] + ((f.to[0] - f.from[0]) * i) / n,
        z: f.from[1] + ((f.to[1] - f.from[1]) * i) / n,
        r: 0.4,
      });
  }
  for (const o of OUTBUILDINGS) along(o.x0,o.x1,o.z0,o.z1,0.3);
  // The bench is two circles; the sign one.
  const bx = Math.cos(BENCH.yaw) * 0.55,
    bz = -Math.sin(BENCH.yaw) * 0.55;
  out.push({ x: BENCH.x + bx, z: BENCH.z + bz, r: 0.6 }, { x: BENCH.x - bx, z: BENCH.z - bz, r: 0.6 });
  out.push({ x: SIGN.x, z: SIGN.z, r: 0.45 });
  return out;
}
