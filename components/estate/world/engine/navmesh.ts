/* Where a visitor can stand and how to get from one spot to another. The visitor is a
   circle on the ground plane; walls, joinery and furniture are solids it slides along.
   The same solids give click-to-walk its routes (a lazily measured grid) and the small
   plan its outlines, so what is drawn, what blocks and what is routed round agree.
   Metres, south is +Z. The library comes from ROOM; the hall, stair, map table, door
   leaf and portico were measured from the packed shell. */
import { ROOM } from "./room";
import { groundHeight, groundsObstacles, groundsWalkable } from "./grounds";

export type Pt = { x: number; z: number };
export type Rect = { x0: number; x1: number; z0: number; z1: number; tall?: boolean };
export type Disc = { x: number; z: number; r: number; tall?: boolean };

/** Half the visitor's width: the closest the eye comes to anything solid. */
export const RADIUS = 0.28;
/** Eye above whatever is underfoot. */
export const EYE = 1.62;

const R = ROOM;
const HOUSE: Rect = { x0: -7.93, x1: 7.93, z0: -3.15, z1: 3.13 };
const HALL = { west: -1.35, east: 1.81, north: -3.05, south: 2.9 };
/** Clear opening of the south door and of the door between hall and library. */
const SOUTH_DOOR = { x0: -0.6, x1: 0.6 };
const LIBRARY_DOOR = { z0: R.door.z0 + 0.03, z1: R.door.z1 - 0.03 };
const PORCH: Rect = { x0: -1.62, x1: 1.62, z0: HOUSE.z1, z1: 5.6 };
/** Used until the grounds say where the lawn is. */
const DEFAULT_LAWN: Rect = { x0: -14, x1: 14, z0: 5.3, z1: 30 };

const rect = (x0: number, x1: number, z0: number, z1: number, tall = false): Rect => ({ x0, x1, z0, z1, tall });
const walls: Rect[] = [
  rect(HOUSE.x0, R.west, HOUSE.z0, HOUSE.z1, true),
  rect(HOUSE.x0, 1.75, HOUSE.z0, R.north, true),
  rect(HOUSE.x0, R.east, R.south, HOUSE.z1, true),
  rect(R.east, SOUTH_DOOR.x0, HALL.south, HOUSE.z1, true),
  rect(SOUTH_DOOR.x1, HOUSE.x1, HALL.south, HOUSE.z1, true),
  rect(R.east, HALL.west, HOUSE.z0, LIBRARY_DOOR.z0, true),
  rect(R.east, HALL.west, LIBRARY_DOOR.z1, HOUSE.z1, true),
  // The east rooms and the ell are not open to visitors.
  rect(HALL.east, HOUSE.x1, HOUSE.z0, HOUSE.z1, true),
  rect(-7.97, 3.27, -20.79, R.north, true),
  rect(-6.42, 0.93, -29.321, -20.79, true),
  rect(3.27, 7.93, -7.123, R.north, true),
];
const joinery: Rect[] = [
  // Law shelves, chimney breast with its mantel, family cabinet with its writing fall.
  rect(R.west, R.shelfFront + 0.06, R.law.z0 - 0.02, R.law.z1 + 0.02, true),
  rect(R.west, -7.54, -1.27, 1.27, true),
  rect(R.west, R.shelfFront + 0.23, R.cabinet.z0 - 0.02, R.south, true),
  // The stair against the hall's west wall and the open leaf of the south door.
  rect(HALL.west, -0.4, HALL.north, 0.08, true),
  rect(-0.65, -0.5, 1.9, HALL.south, true),
];
const furniture: Rect[] = [
  rect(R.table.x0, R.table.x1, R.table.z0, R.table.z1),
  rect(R.chest.x0, R.chest.x1, R.north, R.chest.z1 + 0.02),
  rect(0.99, HALL.east, -1.13, 0.33),
];
// The open drawers are low obstacles; quantizing to centimetres keeps the route grid
// stable while the motion eases to a stop. Closing releases the same floor space.
let drawerExtension = 0;
export function setDrawerExtension(extension: number) {
  const next = Math.round(Math.max(0, extension) * 100) / 100;
  if (next === drawerExtension) return;
  drawerExtension = next;
  furniture[1].z1 = R.chest.z1 + 0.02 + next;
  world = null;
}
const portico: Rect[] = [
  ...[-1.47, 1.47].flatMap((x) => [3.375, 4.72].map((z) => rect(x - 0.13, x + 0.13, z - 0.13, z + 0.13, true))),
  // The deck stands half a metre proud of the lawn at its sides.
  rect(-1.74, PORCH.x0, PORCH.z0, 4.6),
  rect(PORCH.x1, 1.74, PORCH.z0, 4.6),
];
const fixedDiscs: Disc[] = [
  // Windsor chair, and the newel at the foot of the stair.
  { x: -4.5, z: -0.12, r: 0.27 },
  { x: -0.4, z: 0.03, r: 0.09, tall: true },
];

type World = { rects: Rect[]; discs: Disc[]; regions: Rect[]; near: Map<number, Disc[]>; stamp: number };
let world: World | null = null;
/** Trees, hedges and fences come as a few hundred circles: they are sorted into
    two-metre squares, each holding the circles within NEAR of any point in it. */
const SQUARE = 2,
  NEAR = 1;
const none: Disc[] = [];
const square = (x: number, z: number) => Math.floor(x / SQUARE) * 4096 + Math.floor(z / SQUARE);
function stampOf() {
  let s = groundsObstacles.length * 31 + groundsWalkable.length * 7;
  for (const o of groundsObstacles) s += o.x * 3 + o.z * 5 + o.r * 11;
  for (const w of groundsWalkable) s += w[0] + w[1] * 3 + w[2] * 5 + w[3] * 7;
  return s;
}
/** Re-read the grounds if they have changed since the last look. Cheap; call per frame. */
export function refresh() {
  const stamp = stampOf();
  if (world && world.stamp === stamp) return world;
  const lawns = groundsWalkable.length
    ? groundsWalkable.map(([x0, x1, z0, z1]) => rect(Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)))
    : [DEFAULT_LAWN];
  const discs = [...fixedDiscs, ...groundsObstacles.map((o) => ({ x: o.x, z: o.z, r: o.r }))];
  const near = new Map<number, Disc[]>();
  for (const d of discs) {
    const reach = d.r + NEAR;
    for (let i = Math.floor((d.x - reach) / SQUARE); i <= Math.floor((d.x + reach) / SQUARE); i++)
      for (let k = Math.floor((d.z - reach) / SQUARE); k <= Math.floor((d.z + reach) / SQUARE); k++) {
        const key = i * 4096 + k;
        const list = near.get(key);
        if (list) list.push(d);
        else near.set(key, [d]);
      }
  }
  world = {
    rects: [...walls, ...joinery, ...furniture, ...portico],
    discs,
    regions: [HOUSE, PORCH, ...lawns],
    near,
    stamp,
  };
  grid = null;
  return world;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smooth = (v: number, a: number, b: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Height of what is underfoot: boards indoors, the deck and steps, then the ground. */
export function surface(x: number, z: number) {
  const sill = HOUSE.z1 - 0.12;
  if (x >= HOUSE.x0 && x <= HOUSE.x1 && z >= HOUSE.z0 && z <= sill) return R.floor;
  if (x >= -1.74 && x <= 1.74 && z > sill && z < 5.3) {
    const ground = groundHeight(x, 5.3);
    // Sill to deck, then three steps taken as one even ramp.
    const deck = R.floor + (0.46 - R.floor) * smooth(z, sill, HOUSE.z1 + 0.14);
    return deck + (ground - deck) * smooth(z, 4.4, 5.3);
  }
  return groundHeight(x, z);
}
export const eyeLevel = (x: number, z: number) => surface(x, z) + EYE;

function inRegion(w: World, x: number, z: number) {
  for (const b of w.regions) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) return true;
  return false;
}
/** Distance from a point to the nearest solid; negative inside one. Exact up to a
    metre; beyond that it may overstate, which nothing here minds. */
export function clearance(x: number, z: number) {
  const w = world ?? refresh();
  let best = Infinity;
  for (const s of w.rects) {
    const dx = Math.max(s.x0 - x, 0, x - s.x1),
      dz = Math.max(s.z0 - z, 0, z - s.z1);
    const d = dx || dz ? Math.hypot(dx, dz) : -Math.min(x - s.x0, s.x1 - x, z - s.z0, s.z1 - z);
    if (d < best) best = d;
  }
  for (const c of w.near.get(square(x, z)) ?? none) {
    const d = Math.hypot(x - c.x, z - c.z) - c.r;
    if (d < best) best = d;
  }
  return best;
}
/** May a visitor of this radius stand here? */
export function freeAt(x: number, z: number, r = RADIUS) {
  const w = world ?? refresh();
  return inRegion(w, x, z) && clearance(x, z) >= r - 1e-4;
}

/** Push a point out of anything it overlaps and back onto walkable ground. Returns
    false when no legal spot is found nearby; the point is then not to be trusted. */
export function settle(p: Pt, r = RADIUS) {
  const w = world ?? refresh();
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (const s of w.rects) {
      const cx = clamp(p.x, s.x0, s.x1),
        cz = clamp(p.z, s.z0, s.z1);
      const dx = p.x - cx,
        dz = p.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r - 1e-9) continue;
      if (d2 > 1e-12) {
        // Outside but too close: away from the nearest point, which rounds every corner.
        const d = Math.sqrt(d2),
          k = (r - d) / d;
        p.x += dx * k;
        p.z += dz * k;
      } else {
        const west = p.x - s.x0,
          east = s.x1 - p.x,
          north = p.z - s.z0,
          south = s.z1 - p.z;
        const m = Math.min(west, east, north, south);
        if (m === west) p.x = s.x0 - r;
        else if (m === east) p.x = s.x1 + r;
        else if (m === north) p.z = s.z0 - r;
        else p.z = s.z1 + r;
      }
      moved = true;
    }
    for (const c of w.near.get(square(p.x, p.z)) ?? none) {
      const dx = p.x - c.x,
        dz = p.z - c.z;
      const d = Math.hypot(dx, dz),
        reach = c.r + r;
      if (d >= reach - 1e-6) continue;
      if (d > 1e-6) {
        p.x = c.x + (dx / d) * reach;
        p.z = c.z + (dz / d) * reach;
      } else p.x = c.x + reach;
      moved = true;
    }
    if (!inRegion(w, p.x, p.z)) {
      let best = Infinity,
        bx = p.x,
        bz = p.z;
      for (const b of w.regions) {
        const qx = clamp(p.x, b.x0, b.x1),
          qz = clamp(p.z, b.z0, b.z1);
        const d = (qx - p.x) ** 2 + (qz - p.z) ** 2;
        if (d < best) {
          best = d;
          bx = qx;
          bz = qz;
        }
      }
      p.x = bx;
      p.z = bz;
      moved = true;
    }
    if (!moved) return true;
  }
  return freeAt(p.x, p.z, r - 0.002);
}

/** Move a standing visitor by (dx, dz), sliding along whatever is met. Taken in short
    steps so nothing thin can be stepped through. Returns the place reached. */
export function moveBy(from: Pt, dx: number, dz: number, r = RADIUS): Pt {
  const length = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(length / 0.08));
  const cur = { x: from.x, z: from.z };
  const next = { x: 0, z: 0 };
  for (let i = 0; i < steps; i++) {
    next.x = cur.x + dx / steps;
    next.z = cur.z + dz / steps;
    if (!settle(next, r)) break;
    // A push that would carry further than the step itself is a wedge: stay put.
    if (Math.hypot(next.x - cur.x, next.z - cur.z) > length / steps + r) break;
    cur.x = next.x;
    cur.z = next.z;
  }
  return cur;
}

/** Is the straight line between two points clear of everything that stands taller
    than a visitor? Low furniture can be seen over, so it does not count. */
export function sight(ax: number, az: number, bx: number, bz: number) {
  const w = world ?? refresh();
  const dx = bx - ax,
    dz = bz - az;
  for (const s of w.rects) {
    if (!s.tall) continue;
    let t0 = 0,
      t1 = 1;
    let hit = true;
    for (const [o, d, lo, hi] of [
      [ax, dx, s.x0, s.x1],
      [az, dz, s.z0, s.z1],
    ]) {
      if (Math.abs(d) < 1e-9) {
        if (o < lo || o > hi) hit = false;
      } else {
        const a = (lo - o) / d,
          b = (hi - o) / d;
        t0 = Math.max(t0, Math.min(a, b));
        t1 = Math.min(t1, Math.max(a, b));
      }
    }
    if (hit && t0 <= t1) return false;
  }
  const l2 = dx * dx + dz * dz || 1e-9;
  for (const c of w.discs) {
    if (!c.tall) continue;
    const t = clamp(((c.x - ax) * dx + (c.z - az) * dz) / l2, 0, 1);
    if (Math.hypot(ax + dx * t - c.x, az + dz * t - c.z) < c.r) return false;
  }
  return true;
}
/** Can a visitor walk the straight line between two points without touching anything? */
export function clearLine(a: Pt, b: Pt, r = RADIUS) {
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(length / 0.06));
  for (let i = 0; i <= n; i++) if (!freeAt(a.x + ((b.x - a.x) * i) / n, a.z + ((b.z - a.z) * i) / n, r)) return false;
  return true;
}

/* Routes. Clearance is measured cell by cell only where a search actually looks, and
   kept until the grounds change. */
const CELL = 0.1;
/** Routes keep this far from things where the house allows it. */
const COMFORT = 0.5;
type Grid = {
  x0: number;
  z0: number;
  nx: number;
  nz: number;
  clear: Float32Array;
  cost: Float32Array;
  from: Int32Array;
  seen: Uint32Array;
  done: Uint32Array;
  query: number;
};
let grid: Grid | null = null;
function ensureGrid() {
  const w = refresh();
  if (grid) return grid;
  let x0 = Infinity,
    x1 = -Infinity,
    z0 = Infinity,
    z1 = -Infinity;
  for (const b of w.regions) {
    x0 = Math.min(x0, b.x0);
    x1 = Math.max(x1, b.x1);
    z0 = Math.min(z0, b.z0);
    z1 = Math.max(z1, b.z1);
  }
  // The ell and the east rooms are closed: no need to search north of the house.
  z0 = Math.max(z0, Math.min(HOUSE.z0, ...w.regions.slice(2).map((b) => b.z0)));
  const nx = Math.min(700, Math.ceil((x1 - x0) / CELL) + 1),
    nz = Math.min(900, Math.ceil((z1 - z0) / CELL) + 1);
  const n = nx * nz;
  grid = {
    x0,
    z0,
    nx,
    nz,
    clear: new Float32Array(n).fill(NaN),
    cost: new Float32Array(n),
    from: new Int32Array(n),
    seen: new Uint32Array(n),
    done: new Uint32Array(n),
    query: 0,
  };
  return grid;
}
function cellClear(g: Grid, i: number, k: number) {
  if (i < 0 || k < 0 || i >= g.nx || k >= g.nz) return -1;
  const at = k * g.nx + i;
  let c = g.clear[at];
  if (c !== c) {
    const x = g.x0 + i * CELL,
      z = g.z0 + k * CELL;
    c = inRegion(world!, x, z) ? clearance(x, z) : -1;
    g.clear[at] = c;
  }
  return c;
}
const clearAt = (g: Grid, x: number, z: number) => cellClear(g, Math.round((x - g.x0) / CELL), Math.round((z - g.z0) / CELL));
function nearestCell(g: Grid, p: Pt, need: number) {
  const ci = Math.round((p.x - g.x0) / CELL),
    ck = Math.round((p.z - g.z0) / CELL);
  let best = -1,
    bestD = Infinity;
  for (let ring = 0; ring <= 10 && best < 0; ring++)
    for (let dk = -ring; dk <= ring; dk++)
      for (let di = -ring; di <= ring; di++) {
        if (Math.max(Math.abs(di), Math.abs(dk)) !== ring) continue;
        const i = ci + di,
          k = ck + dk;
        if (cellClear(g, i, k) < need) continue;
        const d = (g.x0 + i * CELL - p.x) ** 2 + (g.z0 + k * CELL - p.z) ** 2;
        if (d < bestD) {
          bestD = d;
          best = k * g.nx + i;
        }
      }
  return best;
}

/** A walkable polyline from a to b that goes round furniture and through doorways, or
    null when b cannot be reached. Both ends are included as given. */
export function route(a: Pt, b: Pt, r = RADIUS): Pt[] | null {
  const g = ensureGrid();
  const need = r + 0.02;
  const start = nearestCell(g, a, need),
    goal = nearestCell(g, b, need);
  if (start < 0 || goal < 0) return null;
  const q = ++g.query;
  const gx = goal % g.nx,
    gz = (goal / g.nx) | 0;
  // Binary heap of [priority, cell].
  const heapF: number[] = [],
    heapC: number[] = [];
  const push = (f: number, c: number) => {
    let i = heapF.length;
    heapF.push(f);
    heapC.push(c);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapF[p] <= f) break;
      heapF[i] = heapF[p];
      heapC[i] = heapC[p];
      i = p;
    }
    heapF[i] = f;
    heapC[i] = c;
  };
  const pop = () => {
    const top = heapC[0];
    const f = heapF.pop()!,
      c = heapC.pop()!;
    const n = heapF.length;
    if (n) {
      let i = 0;
      for (;;) {
        let child = 2 * i + 1;
        if (child >= n) break;
        if (child + 1 < n && heapF[child + 1] < heapF[child]) child++;
        if (heapF[child] >= f) break;
        heapF[i] = heapF[child];
        heapC[i] = heapC[child];
        i = child;
      }
      heapF[i] = f;
      heapC[i] = c;
    }
    return top;
  };
  const heuristic = (i: number, k: number) => {
    const dx = Math.abs(i - gx),
      dz = Math.abs(k - gz);
    return (Math.max(dx, dz) + 0.4142 * Math.min(dx, dz)) * CELL;
  };
  g.seen[start] = q;
  g.cost[start] = 0;
  g.from[start] = -1;
  push(heuristic(start % g.nx, (start / g.nx) | 0), start);
  let found = false;
  while (heapF.length) {
    const cur = pop();
    if (g.done[cur] === q) continue;
    g.done[cur] = q;
    if (cur === goal) {
      found = true;
      break;
    }
    const ci = cur % g.nx,
      ck = (cur / g.nx) | 0;
    for (let dk = -1; dk <= 1; dk++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dk) continue;
        const i = ci + di,
          k = ck + dk;
        const c = cellClear(g, i, k);
        if (c < need) continue;
        // No cutting across the corner of something solid.
        if (di && dk && (cellClear(g, ci + di, ck) < need || cellClear(g, ci, ck + dk) < need)) continue;
        const next = k * g.nx + i;
        if (g.done[next] === q) continue;
        const tight = c >= COMFORT + 0.12 ? 0 : (COMFORT + 0.12 - c) / (COMFORT + 0.12 - need);
        const cost = g.cost[cur] + (di && dk ? 1.4142 : 1) * CELL * (1 + 3 * tight * tight);
        if (g.seen[next] === q && g.cost[next] <= cost) continue;
        g.seen[next] = q;
        g.cost[next] = cost;
        g.from[next] = cur;
        push(cost + heuristic(i, k), next);
      }
  }
  if (!found) return null;
  const cells: number[] = [];
  for (let c = goal; c >= 0; c = g.from[c]) cells.push(c);
  cells.reverse();
  const raw: Pt[] = cells.map((c) => ({ x: g.x0 + (c % g.nx) * CELL, z: g.z0 + ((c / g.nx) | 0) * CELL }));
  const room = cells.map((c) => g.clear[c]);
  raw[0] = { x: a.x, z: a.z };
  if (raw.length > 1) raw[raw.length - 1] = { x: b.x, z: b.z };
  else raw.push({ x: b.x, z: b.z });
  room.length = raw.length;
  room[0] = Math.max(need, Math.min(room[0] ?? need, clearance(a.x, a.z)));
  room[raw.length - 1] = Math.max(need, Math.min(room[raw.length - 1] ?? need, clearance(b.x, b.z)));
  // Pull the path taut, never passing closer to anything than the searched path did
  // (or than is comfortable, where there is room to spare).
  const open = (p: Pt, s: Pt, least: number) => {
    const length = Math.hypot(s.x - p.x, s.z - p.z);
    const n = Math.max(1, Math.ceil(length / 0.05));
    for (let i = 1; i < n; i++) {
      const x = p.x + ((s.x - p.x) * i) / n,
        z = p.z + ((s.z - p.z) * i) / n;
      // The remembered cell first; the exact distance only where it is close.
      if (clearAt(g, x, z) < least + CELL && (!inRegion(world!, x, z) || clearance(x, z) < least)) return false;
    }
    return true;
  };
  const out: Pt[] = [raw[0]];
  let i = 0;
  while (i < raw.length - 1) {
    let j = i + 1,
      least = Math.min(room[i], room[j]),
      best = j;
    while (j + 1 < raw.length) {
      j++;
      least = Math.min(least, room[j]);
      if (open(raw[i], raw[j], Math.max(r + 0.005, Math.min(COMFORT, least) - 0.015))) best = j;
      else if (j - best > 14) break;
    }
    out.push(raw[best]);
    i = best;
  }
  return out;
}

/** Round the corners of a route so the walk bends instead of pivoting. */
export function soften(points: Pt[], r = RADIUS): Pt[] {
  if (points.length < 3) return points;
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1],
      b = points[i],
      c = points[i + 1];
    const la = Math.hypot(a.x - b.x, a.z - b.z),
      lc = Math.hypot(c.x - b.x, c.z - b.z);
    const d = Math.min(0.5, la * 0.42, lc * 0.42);
    if (d < 0.08) {
      out.push(b);
      continue;
    }
    const p = { x: b.x + ((a.x - b.x) / la) * d, z: b.z + ((a.z - b.z) / la) * d };
    const s = { x: b.x + ((c.x - b.x) / lc) * d, z: b.z + ((c.z - b.z) / lc) * d };
    if (clearance((p.x + s.x) / 2, (p.z + s.z) / 2) < r + 0.04) out.push(b);
    else out.push(p, s);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** The ground floor as the small plan draws it: the same solids the visitor meets. */
export const plan = {
  view: { x0: -8.25, x1: 2.05, z0: -3.45, z1: 5.75 },
  rooms: [
    { x0: R.west, x1: R.east, z0: R.north, z1: R.south },
    { x0: HALL.west, x1: HALL.east, z0: HALL.north, z1: HALL.south },
  ] as Rect[],
  doors: [
    { x0: R.east - 0.02, x1: HALL.west + 0.02, z0: LIBRARY_DOOR.z0, z1: LIBRARY_DOOR.z1 },
    { x0: -0.5, x1: SOUTH_DOOR.x1, z0: HALL.south - 0.02, z1: HOUSE.z1 + 0.02 },
  ] as Rect[],
  porch: { x0: PORCH.x0, x1: PORCH.x1, z0: PORCH.z0, z1: 5.3 } as Rect,
  solids: [...joinery, ...furniture, ...portico.slice(0, 4)] as Rect[],
  discs: fixedDiscs,
};
