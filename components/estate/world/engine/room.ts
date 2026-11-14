/* The southwest library, built at handling distance. Static joinery is merged by
   material. Everything a visitor can pick up is created elsewhere and only its resting
   place is defined here. Coordinates are the house model's own (metres, Y up, south +Z). */
import * as THREE from "three";
import {
  Batch,
  Tier,
  brick,
  facedBox,
  groundShade,
  lathe,
  leather,
  leaves,
  paint,
  paper,
  plaster,
  rug,
  seeded,
  slab,
  standard,
  timber,
} from "./kit";
import type { Kit } from "./props";

export const ROOM = {
  floor: 0.53,
  ceil: 3.72,
  west: -7.76,
  east: -1.605,
  north: -3.0,
  south: 2.86,
  dado: 1.20,
  rail: 1.26,
  windows: [-6.03, -3.55],
  windowHalf: 0.4725,
  sill: 1.37,
  head: 3.18,
  door: { z0: 0.27, z1: 1.18, top: 2.73 },
  table: { x0: -5.75, x1: -4.15, z0: 0.3, z1: 1.2, top: 1.34 },
  chest: { x0: -3.60, x1: -2.30, z0: -2.985, z1: -2.5, top: 1.42 },
  shelfFront: -7.4,
  cabinet: { z0: 1.33, z1: 2.92 },
  law: { z0: -2.92, z1: -1.33 },
  screen: { x: -7.37, y: 1.64, z: 2.53, w: 0.58, h: 0.47 },
} as const;

/** Pieces the Blender kit can supply (assets/travellers-rest/kit). When every node a
    piece needs is in the loaded kit, its code-built counterpart below is left out; when
    the kit is missing or incomplete the code-built piece stands, so the room is whole
    either way. */
const KIT_PIECES = {
  table: ["table.writing"],
  chair: ["chair.windsor"],
  candles: ["candlestick.mantel.north", "candlestick.mantel.south", "candlestick.table", "candlestick.chest"],
  desk: ["inkwell", "pounce.pot"],
  mantel: ["mantel"],
  hearth: ["andiron.north", "andiron.south", "hearth.log.a", "hearth.log.b", "hearth.log.c"],
  sashes: ["window.sash.west", "window.sash.east"],
  door: ["door.ell"],
  chest: ["chest"],
  bookcases: ["bookcase.law", "bookcase.family"],
  room: ["room.shell", "room.joinery"],
  study: ["desk.study"],
} as const;
type Piece = keyof typeof KIT_PIECES;
type Supplied = Record<Piece, boolean>;

export type Finishes = ReturnType<typeof finishes>;
export function finishes(tier: Tier) {
  const size = tier === "high" ? 1024 : 512;
  const named = <T extends THREE.Material>(name: string, m: T) => {
    m.name = name;
    return m;
  };
  const floor = timber("#8a6238", 11, size, { planks: 10, contrast: 1.15 });
  const walnut = timber("#6b4428", 23, 512, { contrast: 0.9 });
  const walnutDark = timber("#452a18", 29, 512, { contrast: 0.8 });
  return {
    floor: named(
      "Ash boards",
      standard({ map: floor, roughness: 0.58, bump: 0.6, env: 0.5 }),
    ),
    plaster: named(
      "Lime plaster",
      standard({
        map: plaster("#d8cbab", 3, size),
        roughness: 0.96,
        bump: 0.35,
      }),
    ),
    ceiling: named(
      "Ceiling plaster",
      standard({ map: plaster("#e9e2d0", 5, 512), roughness: 0.97 }),
    ),
    dado: named(
      "Painted dado",
      standard({ map: paint("#8c8d73", 7), roughness: 0.62, bump: 0.25 }),
    ),
    trim: named(
      "Painted joinery",
      standard({ map: paint("#ddd5bd", 9), roughness: 0.55, bump: 0.2 }),
    ),
    walnut: named(
      "Walnut",
      standard({ map: walnut, roughness: 0.46, bump: 0.3, env: 0.7 }),
    ),
    walnutDark: named(
      "Walnut, shaded",
      standard({ map: walnutDark, roughness: 0.5, bump: 0.3, env: 0.6 }),
    ),
    brass: named(
      "Old brass",
      standard({ color: "#c49a48", roughness: 0.3, metalness: 0.85, env: 2.6 }),
    ),
    gilt: named(
      "Time-darkened gilt",
      standard({ color: "#d2a850", roughness: 0.3, metalness: 0.92, env: 4.2 }),
    ),
    pewter: named(
      "Pewter",
      standard({ color: "#9a9b9c", roughness: 0.36, metalness: 0.8, env: 2.4 }),
    ),
    iron: named(
      "Wrought iron",
      standard({ color: "#1a1816", roughness: 0.7, metalness: 0.5 }),
    ),
    ebony: named(
      "Ebonized moulding",
      standard({ color: "#15100c", roughness: 0.4 }),
    ),
    brick: named(
      "Sooted firebrick",
      standard({ map: brick(13), color: "#6e6259", roughness: 1, bump: 1 }),
    ),
    stone: named(
      "Limestone hearth",
      standard({ map: plaster("#8b867a", 17, 256), roughness: 0.85, bump: 0.5 }),
    ),
    tallow: named(
      "Tallow",
      standard({
        color: "#efe3c4",
        roughness: 0.6,
        emissive: "#5a3a12",
        emissiveIntensity: 0.25,
      }),
    ),
    paper: named(
      "Laid paper",
      standard({ map: paper("#e9dcb8", 19), roughness: 0.9 }),
    ),
    leaves: named(
      "Leaf edges",
      standard({ map: leaves(21), roughness: 0.92 }),
    ),
    baize: named(
      "Writing leather",
      standard({ map: leather("#27382b", 31), roughness: 0.72, bump: 0.2 }),
    ),
    log: named(
      "Hearth logs",
      standard({ map: walnutDark, color: "#6a5a4c", roughness: 1 }),
    ),
    quill: named(
      "Quill",
      standard({ color: "#efe8d6", roughness: 0.7, side: THREE.DoubleSide }),
    ),
    modern: named(
      "Anodized aluminium",
      standard({ color: "#2a2c2e", roughness: 0.35, metalness: 0.8 }),
    ),
    calf: ["#5a2f1b", "#3e2415", "#6b3a1d", "#2c2f24", "#4a1c16", "#7a4a22"].map(
      (c, i) =>
        named(
          "Calf binding " + i,
          standard({
            map: leather(c, 40 + i),
            roughness: 0.55,
            bump: 0.25,
            env: 0.6,
          }),
        ),
    ),
  };
}

type Wall = { axis: "x" | "z"; at: number; dir: 1 | -1 };
/** A box described on a wall: along the wall, up, and out from its face. */
function onWall(
  b: Batch,
  m: THREE.Material,
  w: Wall,
  a0: number,
  a1: number,
  y0: number,
  y1: number,
  d0: number,
  d1: number,
  tile = 1,
) {
  const p0 = w.at + w.dir * d0,
    p1 = w.at + w.dir * d1;
  if (w.axis === "x")
    b.span(m, a0, a1, y0, y1, Math.min(p0, p1), Math.max(p0, p1), tile);
  else b.span(m, Math.min(p0, p1), Math.max(p0, p1), y0, y1, a0, a1, tile);
}
function dado(b: Batch, f: Finishes, w: Wall, a0: number, a1: number) {
  const { floor, dado: top, rail } = ROOM;
  onWall(b, f.dado, w, a0, a1, floor, floor + 0.17, 0, 0.034);
  onWall(b, f.dado, w, a0, a1, floor + 0.17, floor + 0.2, 0, 0.022);
  onWall(b, f.dado, w, a0, a1, floor + 0.2, top, 0, 0.01);
  onWall(b, f.dado, w, a0, a1, top - 0.085, top, 0, 0.024);
  onWall(b, f.dado, w, a0, a1, floor + 0.2, floor + 0.28, 0, 0.024);
  onWall(b, f.trim, w, a0, a1, top, rail, 0, 0.05);
  onWall(b, f.trim, w, a0, a1, top - 0.018, top, 0, 0.034);
  onWall(b, f.trim, w, a0, a1, rail - 0.012, rail + 0.008, 0, 0.062);
}

function architecture(b: Batch, f: Finishes, kit: Supplied) {
  const R = ROOM;
  // Floor, laid east to west, and the ceiling.
  b.span(f.floor, -7.8, -1.55, 0.45, R.floor, -3.02, 3.0, 1.5, "x");
  b.span(f.ceiling, -7.85, -1.49, R.ceil, R.ceil + 0.08, -3.1, 3.1, 2.4);
  const west: Wall = { axis: "z", at: R.west, dir: 1 },
    north: Wall = { axis: "x", at: R.north, dir: 1 },
    south: Wall = { axis: "x", at: R.south, dir: -1 },
    east: Wall = { axis: "z", at: R.east, dir: -1 };
  // Flush west wall: the chimney is outside. The segmental arch is 0.82 m high
  // at its crown, as read from HABS; no zero-thickness breast boxes.
  for (const [z0, z1] of [[-3.02, -0.595], [0.595, 3.0]])
    onWall(b, f.plaster, west, z0, z1, R.floor, R.ceil, -0.04, 0, 2.2);
  for (let i = 0; i < 24; i++) {
    const z0 = -0.595 + i * 1.19 / 24, z1 = z0 + 1.19 / 24;
    const crown = 1.18 + 0.17 * Math.sqrt(Math.max(0, 1 - ((z0 + z1) / 1.19) ** 2));
    b.span(f.plaster, R.west - 0.04, R.west, crown + 0.065, R.ceil, z0, z1, 2.2);
    b.span(f.stone, R.west - 0.035, R.west + 0.012, crown, crown + 0.065, z0, z1);
  }
  const breast = R.west;
  b.span(f.brick, R.west - 0.14, R.west - 0.12, R.floor, 1.4, -0.595, 0.595, 0.9);
  b.span(f.brick, R.west - 0.36, breast, R.floor, 1.18, -0.62, -0.595, 0.9, "y");
  b.span(f.brick, R.west - 0.36, breast, R.floor, 1.18, 0.595, 0.62, 0.9, "y");
  b.span(f.stone, breast - 0.02, -6.72, R.floor, R.floor + 0.035, -1.02, 1.02, 1);
  // Mantel: pilasters, frieze, bed mouldings and shelf.
  for (const s of kit.mantel ? [] : [-1, 1]) {
    const z0 = s < 0 ? -1.16 : 0.7,
      z1 = s < 0 ? -0.7 : 1.16;
    b.span(f.trim, breast, breast + 0.085, R.floor, 1.6, z0, z1, 1, "y");
    b.span(f.trim, breast, breast + 0.115, R.floor, R.floor + 0.2, z0 - 0.02, z1 + 0.02);
    b.span(f.trim, breast, breast + 0.105, 1.5, 1.6, z0 - 0.015, z1 + 0.015);
    for (let k = 0; k < 3; k++)
      b.span(
        f.trim,
        breast + 0.085,
        breast + 0.097,
        R.floor + 0.26,
        1.46,
        z0 + 0.1 + k * 0.1,
        z0 + 0.14 + k * 0.1,
        1,
        "y",
      );
  }
  if (!kit.mantel) {
    b.span(f.trim, breast, breast + 0.085, 1.6, 1.86, -1.16, 1.16);
    b.span(f.trim, breast, breast + 0.1, 1.66, 1.8, -0.5, 0.5);
    b.span(f.trim, breast, breast + 0.14, 1.86, 1.9, -1.2, 1.2);
    b.span(f.trim, breast, breast + 0.19, 1.9, 1.925, -1.23, 1.23);
    b.span(f.trim, breast, breast + 0.24, 1.925, 1.965, -1.27, 1.27);
  }
  // Slip around the firebox opening.
  b.span(f.stone, breast, breast + 0.012, R.floor, 1.18, -0.66, -0.595, 1, "y");
  b.span(f.stone, breast, breast + 0.012, R.floor, 1.18, 0.595, 0.66, 1, "y");
  // North wall with the six-panel door to the ell.
  onWall(b, f.plaster, north, R.west, R.east, R.floor, R.ceil, -0.04, 0, 2.2);
  const d0 = -5.65,
    d1 = -4.65,
    dt = 2.72;
  if (!kit.door) onWall(b, f.dado, north, d0, d1, R.floor, dt, 0, 0.022);
  for (const [x0, x1] of [
    [d0 - 0.11, d0],
    [d1, d1 + 0.11],
  ])
    onWall(b, f.trim, north, x0, x1, R.floor, dt + 0.11, 0, 0.05);
  onWall(b, f.trim, north, d0 - 0.11, d1 + 0.11, dt, dt + 0.11, 0, 0.05);
  onWall(b, f.trim, north, d0 - 0.14, d1 + 0.14, dt + 0.11, dt + 0.14, 0, 0.07);
  for (const [y0, y1] of kit.door
    ? []
    : [
        [0.7, 1.28],
        [1.42, 2.02],
        [2.16, 2.58],
      ])
    for (const [x0, x1] of [
      [d0 + 0.13, (d0 + d1) / 2 - 0.06],
      [(d0 + d1) / 2 + 0.06, d1 - 0.13],
    ])
      onWall(b, f.dado, north, x0, x1, y0, y1, 0.022, 0.036);
  if (!kit.door)
    b.add(
      new THREE.SphereGeometry(0.028, 14, 10),
      f.brass,
      [d1 - 0.1, 1.52, R.north + 0.07],
    );
  dado(b, f, north, R.west, d0 - 0.11);
  dado(b, f, north, d1 + 0.11, R.east);
  // West wall dado runs behind the bookcases; only the crown shows.
  // East wall: the hall partition is part of the shell, its library face is dressed here.
  dado(b, f, east, R.north, R.door.z0 - 0.11);
  dado(b, f, east, R.door.z1 + 0.11, R.south);
  for (const [z0, z1] of [
    [R.door.z0 - 0.11, R.door.z0],
    [R.door.z1, R.door.z1 + 0.11],
  ])
    onWall(b, f.trim, east, z0, z1, R.floor, R.door.top + 0.11, 0, 0.05);
  onWall(
    b,
    f.trim,
    east,
    R.door.z0 - 0.11,
    R.door.z1 + 0.11,
    R.door.top,
    R.door.top + 0.11,
    0,
    0.05,
  );
  onWall(
    b,
    f.trim,
    east,
    R.door.z0 - 0.14,
    R.door.z1 + 0.14,
    R.door.top + 0.11,
    R.door.top + 0.14,
    0,
    0.07,
  );
  // South wall: an inner leaf with two real openings so the sun can enter.
  const xs = R.windows.flatMap((c) => [c - R.windowHalf, c + R.windowHalf]);
  const edges = [R.west, ...xs, R.east];
  for (let i = 0; i < edges.length; i += 2)
    b.span(f.plaster, edges[i], edges[i + 1], R.sill, R.head, R.south, 3.0, 2.2);
  b.span(f.plaster, R.west, R.east, R.floor, R.sill, R.south, 3.0, 2.2);
  b.span(f.plaster, R.west, R.east, R.head, R.ceil, R.south, 3.0, 2.2);
  dado(b, f, south, R.west, R.east);
  for (const c of R.windows) {
    const x0 = c - R.windowHalf,
      x1 = c + R.windowHalf;
    for (const [a0, a1] of [
      [x0 - 0.1, x0],
      [x1, x1 + 0.1],
    ])
      onWall(b, f.trim, south, a0, a1, R.sill, R.head + 0.1, 0, 0.032);
    onWall(b, f.trim, south, x0 - 0.1, x1 + 0.1, R.head, R.head + 0.1, 0, 0.032);
    onWall(b, f.trim, south, x0 - 0.13, x1 + 0.13, R.head + 0.1, R.head + 0.13, 0, 0.05);
    onWall(b, f.trim, south, x0 - 0.13, x1 + 0.13, R.sill - 0.035, R.sill, -0.13, 0.075);
    // Reveals lined in painted wood.
    b.span(f.trim, x0, x0 + 0.012, R.sill, R.head, R.south, 2.99, 1, "y");
    b.span(f.trim, x1 - 0.012, x1, R.sill, R.head, R.south, 2.99, 1, "y");
    b.span(f.trim, x0, x1, R.head - 0.012, R.head, R.south, 2.99);
    // Six-over-six sash.
    const mid = R.sill + (R.head - R.sill) * 3 / 7;
    for (const [y0, y1, z] of kit.sashes
      ? []
      : [
          [R.sill, mid + 0.02, 2.945],
          [mid - 0.02, R.head, 2.97],
        ]) {
      b.span(f.trim, x0, x0 + 0.045, y0, y1, z - 0.018, z + 0.018, 1, "y");
      b.span(f.trim, x1 - 0.045, x1, y0, y1, z - 0.018, z + 0.018, 1, "y");
      b.span(f.trim, x0, x1, y0, y0 + 0.05, z - 0.018, z + 0.018);
      b.span(f.trim, x0, x1, y1 - 0.045, y1, z - 0.018, z + 0.018);
      for (let k = 1; k < 4; k++) {
        const x = x0 + ((x1 - x0) * k) / 4;
        b.span(f.trim, x - 0.009, x + 0.009, y0, y1, z - 0.012, z + 0.012, 1, "y");
      }
      const rows = y0 === R.sill ? 3 : 4;
      for (let row = 1; row < rows; row++) {
        const ym = y0 + (y1 - y0) * row / rows;
        b.span(f.trim, x0, x1, ym - 0.009, ym + 0.009, z - 0.012, z + 0.012);
      }
    }
  }
}

/** Open-fronted case against the west wall. Returns nothing: shelf heights are fixed
    by the caller so bindings and case agree. */
function bookcase(
  b: Batch,
  f: Finishes,
  z0: number,
  z1: number,
  shelves: number[],
  options: { desk?: boolean; divider?: number; nicheTop?: number } = {},
) {
  const R = ROOM,
    back = R.west,
    front = R.shelfFront,
    w = f.walnut;
  const lower = options.desk ? front + 0.2 : front + 0.03;
  b.span(f.walnutDark, back, back + 0.018, R.floor, 2.74, z0, z1, 0.6, "y");
  for (const z of [z0, z1 - 0.036])
    b.span(w, back, front, 1.27, 2.74, z, z + 0.036, 0.6, "y");
  for (const z of [z0, z1 - 0.036])
    b.span(w, back, lower, R.floor, 1.27, z, z + 0.036, 0.6, "y");
  b.span(w, back, lower + 0.012, R.floor, R.floor + 0.1, z0, z1, 0.6);
  // Cupboard doors below the waist.
  const mid = (z0 + z1) / 2;
  for (const [a0, a1] of [
    [z0 + 0.036, mid - 0.004],
    [mid + 0.004, z1 - 0.036],
  ]) {
    b.span(w, lower - 0.022, lower, R.floor + 0.1, 1.23, a0, a1, 0.6, "y");
    b.span(f.walnutDark, lower, lower + 0.008, R.floor + 0.19, 1.14, a0 + 0.08, a1 - 0.08, 0.6, "y");
  }
  for (const s of [-1, 1])
    b.add(new THREE.SphereGeometry(0.016, 12, 8), f.brass, [
      lower + 0.02,
      0.92,
      mid + s * 0.045,
    ]);
  // Waist board; on the family cabinet it is a writing fall.
  b.span(w, back, lower + 0.03, 1.23, 1.27, z0 - 0.012, z1 + 0.012, 0.6, "z");
  for (const y of shelves) {
    const a1 = options.divider && y < (options.nicheTop ?? 0) ? options.divider : z1 - 0.036;
    b.span(w, back, front - 0.012, y - 0.024, y, z0 + 0.036, a1, 0.6, "z");
    b.span(f.walnutDark, front - 0.012, front, y - 0.03, y + 0.004, z0 + 0.036, a1, 0.6, "z");
  }
  if (options.divider)
    b.span(
      w,
      back,
      front - 0.012,
      1.27,
      options.nicheTop!,
      options.divider,
      options.divider + 0.024,
      0.6,
      "y",
    );
  // Cornice.
  b.span(w, back, front + 0.018, 2.7, 2.74, z0 - 0.012, z1 + 0.012, 0.6, "z");
  b.span(w, back, front + 0.045, 2.74, 2.775, z0 - 0.04, z1 + 0.04, 0.6, "z");
  b.span(f.walnutDark, back, front + 0.07, 2.775, 2.8, z0 - 0.065, z1 + 0.065, 0.6, "z");
  // Face frame.
  for (const z of [z0, z1 - 0.05])
    b.span(w, front - 0.012, front + 0.006, 1.27, 2.7, z, z + 0.05, 0.6, "y");
}

function furniture(b: Batch, f: Finishes, kit: Supplied) {
  if (!kit.table) writingTable(b, f);
  const chairGroup = kit.chair ? null : windsorChair(f);
  if (!kit.chest) chestOfDrawers(b, f);
  return chairGroup;
}

function writingTable(b: Batch, f: Finishes) {
  const R = ROOM,
    T = R.table;
  // Writing table.
  b.span(f.walnut, T.x0, T.x1, T.top - 0.036, T.top, T.z0, T.z1, 0.7, "x");
  b.span(f.walnutDark, T.x0 + 0.02, T.x1 - 0.02, T.top - 0.044, T.top - 0.036, T.z0 + 0.02, T.z1 - 0.02, 0.7, "x");
  b.span(f.walnut, T.x0 + 0.07, T.x1 - 0.07, T.top - 0.15, T.top - 0.044, T.z0 + 0.07, T.z0 + 0.092, 0.7, "x");
  b.span(f.walnut, T.x0 + 0.07, T.x1 - 0.07, T.top - 0.15, T.top - 0.044, T.z1 - 0.092, T.z1 - 0.07, 0.7, "x");
  b.span(f.walnut, T.x0 + 0.07, T.x0 + 0.092, T.top - 0.15, T.top - 0.044, T.z0 + 0.07, T.z1 - 0.07, 0.7, "z");
  b.span(f.walnut, T.x1 - 0.092, T.x1 - 0.07, T.top - 0.15, T.top - 0.044, T.z0 + 0.07, T.z1 - 0.07, 0.7, "z");
  for (const x of [T.x0 + 0.085, T.x1 - 0.085])
    for (const z of [T.z0 + 0.085, T.z1 - 0.085]) {
      const leg = new THREE.CylinderGeometry(0.021, 0.034, T.top - 0.04 - R.floor, 4, 1);
      leg.rotateY(Math.PI / 4);
      b.add(leg, f.walnut, [x, (T.top - 0.04 + R.floor) / 2, z]);
    }
  // Drawer front and pull facing the visitor.
  b.span(f.walnutDark, -5.3, -4.6, T.top - 0.135, T.top - 0.058, T.z1 - 0.07, T.z1 - 0.062, 0.7, "x");
  b.add(new THREE.SphereGeometry(0.014, 10, 8), f.brass, [-4.95, T.top - 0.096, T.z1 - 0.05]);
  // Tooled leather writing surface with a gilt line.
  b.span(f.baize, T.x0 + 0.17, T.x1 - 0.17, T.top, T.top + 0.0015, T.z0 + 0.13, T.z1 - 0.13, 0.5);
  for (const [x0, x1, z0, z1] of [
    [T.x0 + 0.19, T.x1 - 0.19, T.z0 + 0.15, T.z0 + 0.154],
    [T.x0 + 0.19, T.x1 - 0.19, T.z1 - 0.154, T.z1 - 0.15],
    [T.x0 + 0.19, T.x0 + 0.194, T.z0 + 0.15, T.z1 - 0.15],
    [T.x1 - 0.194, T.x1 - 0.19, T.z0 + 0.15, T.z1 - 0.15],
  ])
    b.span(f.gilt, x0, x1, T.top + 0.0015, T.top + 0.0022, z0, z1);
}

function windsorChair(f: Finishes) {
  const R = ROOM;
  // Windsor chair on the north side, turned a little from the table.
  const chair = new Batch();
  const seat = new THREE.CylinderGeometry(0.235, 0.225, 0.04, 28);
  seat.scale(1, 1, 0.92);
  chair.add(seat, f.walnut, [0, 0.455, 0]);
  for (const [x, z] of [
    [-0.17, -0.15],
    [0.17, -0.15],
    [-0.19, 0.16],
    [0.19, 0.16],
  ]) {
    const leg = new THREE.CylinderGeometry(0.014, 0.02, 0.46, 8);
    chair.add(leg, f.walnut, [x * 1.12, 0.225, z * 1.12], [z * 0.5, 0, -x * 0.55]);
  }
  for (let i = 0; i < 7; i++) {
    const a = -0.95 + (i / 6) * 1.9;
    const rod = new THREE.CylinderGeometry(0.007, 0.009, 0.5 + Math.cos(a) * 0.09, 6);
    chair.add(
      rod,
      f.walnut,
      [Math.sin(a) * 0.2, 0.72 + Math.cos(a) * 0.04, -0.17 - Math.cos(a) * 0.045],
      [-0.2, 0, -Math.sin(a) * 0.12],
    );
  }
  const bow = new THREE.TorusGeometry(0.235, 0.014, 8, 26, Math.PI);
  bow.scale(1, 1.75, 1);
  chair.add(bow, f.walnut, [0, 0.58, -0.215], [-0.2, 0, 0]);
  const arm = new THREE.TorusGeometry(0.23, 0.012, 6, 20, Math.PI * 1.15);
  arm.rotateX(Math.PI / 2);
  arm.rotateY(-Math.PI * 0.575 + Math.PI);
  chair.add(arm, f.walnut, [0, 0.67, -0.03]);
  const chairGroup = chair.build("Windsor chair");
  chairGroup.position.set(-4.5, R.floor, -0.12);
  chairGroup.rotation.y = 0.32;
  return chairGroup;
}

function chestOfDrawers(b: Batch, f: Finishes) {
  const R = ROOM;
  // Chest of drawers on the north wall; its two upper drawers are live objects.
  const C = R.chest;
  b.span(f.walnut, C.x0, C.x1, C.top - 0.03, C.top, C.z0, C.z1 + 0.02, 0.7, "x");
  for (const x of [C.x0, C.x1 - 0.03])
    b.span(f.walnut, x, x + 0.03, R.floor + 0.08, C.top - 0.03, C.z0, C.z1, 0.7, "y");
  b.span(f.walnutDark, C.x0 + 0.03, C.x1 - 0.03, R.floor + 0.08, C.top - 0.03, C.z0, C.z0 + 0.015, 0.7);
  b.span(f.walnut, C.x0 + 0.03, C.x1 - 0.03, R.floor + 0.08, R.floor + 0.11, C.z0, C.z1, 0.7, "x");
  for (const y of [0.87, 1.125])
    b.span(f.walnut, C.x0 + 0.03, C.x1 - 0.03, y - 0.012, y + 0.012, C.z0, C.z1, 0.7, "x");
  // Fixed bottom drawer and bracket feet.
  b.span(f.walnut, C.x0 + 0.04, C.x1 - 0.04, R.floor + 0.12, 0.85, C.z1 - 0.02, C.z1, 0.7, "x");
  for (const s of [-0.38, 0.38])
    b.add(new THREE.SphereGeometry(0.017, 10, 8), f.brass, [(C.x0 + C.x1) / 2 + s, 0.74, C.z1 + 0.014]);
  for (const x of [C.x0, C.x1 - 0.09])
    b.span(f.walnutDark, x, x + 0.09, R.floor, R.floor + 0.08, C.z1 - 0.09, C.z1, 0.7);
  for (const x of [C.x0, C.x1 - 0.09])
    b.span(f.walnutDark, x, x + 0.09, R.floor, R.floor + 0.08, C.z0, C.z0 + 0.09, 0.7);
}

function candlestick(b: Batch, f: Finishes, x: number, y: number, z: number, h = 0.2) {
  const stick = lathe([
    [0, 0],
    [0.05, 0],
    [0.052, 0.012],
    [0.022, 0.03],
    [0.012, 0.06],
    [0.019, 0.085],
    [0.011, 0.11],
    [0.011, 0.19],
    [0.024, 0.2],
    [0.026, 0.215],
    [0.012, 0.218],
    [0, 0.218],
  ]);
  b.add(stick, f.brass, [x, y, z]);
  b.add(new THREE.CylinderGeometry(0.0095, 0.0105, h, 10), f.tallow, [x, y + 0.218 + h / 2, z]);
  b.add(new THREE.CylinderGeometry(0.0012, 0.0012, 0.012, 4), f.iron, [x, y + 0.224 + h, z]);
  return new THREE.Vector3(x, y + 0.245 + h, z);
}

/** Rows of calf-bound law books: one instanced mesh per binding colour. */
function lawBooks(f: Finishes, rows: { y: number; z0: number; z1: number }[], skip: (z: number, row: number) => boolean) {
  const rand = seeded(101);
  const group = new THREE.Group();
  group.name = "Law library";
  const spines = f.calf.map((m, i) => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const src = (m.map as THREE.CanvasTexture).image as HTMLCanvasElement;
    ctx.drawImage(src, 0, 0, 64, 256);
    const r = seeded(300 + i);
    for (const y of [22, 62, 150, 196, 236]) {
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(0, y - 3, 64, 2);
      ctx.fillStyle = "rgba(214,170,90,.75)";
      ctx.fillRect(0, y, 64, 1.5);
      ctx.fillStyle = "rgba(255,230,170,.12)";
      ctx.fillRect(0, y - 6, 64, 3);
    }
    ctx.fillStyle = i % 2 ? "#3a0f0c" : "#14110d";
    ctx.fillRect(5, 70, 54, 34);
    ctx.fillStyle = "rgba(222,180,98,.85)";
    for (let k = 0; k < 3; k++) ctx.fillRect(12 + r() * 6, 77 + k * 8, 28 + r() * 12, 2.2);
    ctx.fillRect(22, 122, 20, 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const s = m.clone();
    s.map = t;
    s.bumpMap = null;
    return s;
  });
  const placed: { m: THREE.Matrix4; c: number }[] = [];
  const o = new THREE.Object3D();
  rows.forEach((row, ri) => {
    let z = row.z1;
    while (z > row.z0 + 0.03) {
      const t = 0.03 + rand() * 0.038,
        h = 0.2 + rand() * 0.1,
        d = 0.17 + rand() * 0.07;
      const lean = rand() < 0.06 ? (rand() - 0.5) * 0.24 : 0;
      z -= t + 0.0015 + Math.abs(lean) * 0.12;
      if (z < row.z0) break;
      if (skip(z, ri)) continue;
      if (rand() < 0.035) {
        z -= 0.05 + rand() * 0.08;
        continue;
      }
      o.position.set(ROOM.shelfFront - 0.02 - d / 2 - rand() * 0.015, row.y + h / 2, z + t / 2);
      o.rotation.set(lean, 0, 0);
      o.scale.set(d, h, t);
      o.updateMatrix();
      placed.push({ m: o.matrix.clone(), c: Math.floor(rand() * f.calf.length) });
    }
  });
  // Three passes per binding colour: leather, the spine, and the leaves seen from above.
  const box = facedBox(1, 1, 1, [0], [2]);
  f.calf.forEach((m, i) => {
    const mine = placed.filter((p) => p.c === i);
    if (!mine.length) return;
    const mesh = new THREE.InstancedMesh(box, [m, spines[i], f.leaves], mine.length);
    mine.forEach((p, k) => mesh.setMatrixAt(k, p.m));
    mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });
  return group;
}

export type Flame = { at: THREE.Vector3; scale: number };
export function buildLibrary(tier: Tier, kit: Kit | null = null) {
  const f = finishes(tier);
  const supplied = Object.fromEntries(
    (Object.keys(KIT_PIECES) as Piece[]).map((piece) => [
      piece,
      !!kit && kit.has(...KIT_PIECES[piece]) && (piece !== "candles" || kit.has(...KIT_PIECES.candles.map((name) => name + ".flame"))),
    ]),
  ) as Supplied;
  const root = new THREE.Group();
  root.name = "Southwest library";
  const b = new Batch();
  supplied.room = supplied.room && supplied.mantel && supplied.door && supplied.sashes;
  if (!supplied.room) architecture(b, f, supplied);
  const R = ROOM;
  // Law shelves north of the hearth, family cabinet to the south.
  const lawShelves = [1.63, 1.99, 2.35];
  if (!supplied.bookcases) bookcase(b, f, R.law.z0, R.law.z1, lawShelves);
  const divider = 2.185,
    nicheTop = 1.97;
  const projectShelves = [1.6, nicheTop, 2.33];
  if (!supplied.bookcases) bookcase(b, f, R.cabinet.z0, R.cabinet.z1, projectShelves, { desk: true, divider, nicheTop });
  const chair = furniture(b, f, supplied);
  // Hearth furniture.
  for (const [z, r, x, y] of supplied.hearth ? [] : ([
    [-0.02, 0.07, -7.56, 0.66],
    [0.05, 0.06, -7.42, 0.65],
    [0.0, 0.055, -7.5, 0.76],
  ] as const)) {
    const log = new THREE.CylinderGeometry(r, r * 0.92, 0.86, 9);
    log.rotateX(Math.PI / 2);
    b.add(log, f.log, [x, y, z], [0, (z - 0.02) * 2.4, 0]);
  }
  for (const z of supplied.hearth ? [] : [-0.36, 0.36]) {
    b.span(f.iron, -7.6, -7.2, 0.6, 0.618, z - 0.012, z + 0.012);
    b.span(f.iron, -7.24, -7.215, R.floor + 0.03, 0.82, z - 0.013, z + 0.013);
    b.add(lathe([[0, 0], [0.03, 0.01], [0.012, 0.05], [0.034, 0.09], [0.03, 0.13], [0, 0.15]]), f.brass, [-7.228, 0.82, z]);
  }
  const flames: Flame[] = [{ at: new THREE.Vector3(-7.5, 0.84, 0.01), scale: 1 }];
  // A kit candlestick carries an empty at its wick; the flame is lit there.
  const candle = (name: (typeof KIT_PIECES.candles)[number], x: number, y: number, z: number, h?: number) =>
    (supplied.candles && kit?.point(name + ".flame")) || candlestick(b, f, x, y, z, h);
  flames.push({ at: candle("candlestick.mantel.north", -7.35, 1.965, -0.98), scale: 0.13 });
  flames.push({ at: candle("candlestick.mantel.south", -7.35, 1.965, 0.98), scale: 0.13 });
  flames.push({ at: candle("candlestick.table", -5.58, R.table.top, 0.47, 0.15), scale: 0.13 });
  // Desk furniture that stays put: inkwell, quills, sander, blotter.
  if (!supplied.desk) b.add(lathe([[0, 0], [0.05, 0], [0.055, 0.02], [0.04, 0.055], [0.022, 0.07], [0.026, 0.078], [0.016, 0.08], [0, 0.06]]), f.pewter, [-4.38, R.table.top, 1.02]);
  for (const [a, tilt] of supplied.desk
    ? []
    : [
        [0.5, 0.42],
        [-0.4, 0.3],
      ]) {
    const shaft = new THREE.CylinderGeometry(0.0016, 0.003, 0.3, 5);
    shaft.translate(0, 0.15, 0);
    b.add(shaft, f.quill, [-4.38, R.table.top + 0.06, 1.02], [tilt, a, 0]);
    const vane = new THREE.PlaneGeometry(0.026, 0.2, 1, 6);
    const p = vane.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setX(i, p.getX(i) * (1 - (Math.abs(y) / 0.105) ** 2) + 0.006 * Math.sin(y * 9));
    }
    vane.translate(0, 0.21, 0);
    b.add(vane, f.quill, [-4.38, R.table.top + 0.06, 1.02], [tilt, a, 0]);
  }
  if (!supplied.desk) b.add(lathe([[0, 0], [0.026, 0], [0.03, 0.045], [0.022, 0.06], [0, 0.062]]), f.walnutDark, [-4.52, R.table.top, 1.07]);
  // Objects on the chest and the cabinet's top shelf.
  flames.push({ at: candle("candlestick.chest", -3.45, R.chest.top, -2.76, 0.17), scale: 0.13 });
  if (!supplied.study) {
  b.span(f.calf[1], -2.70, -2.45, R.chest.top, R.chest.top + 0.05, -2.9, -2.72);
  b.span(f.calf[4], -2.69, -2.47, R.chest.top + 0.05, R.chest.top + 0.092, -2.89, -2.73);
  b.span(f.leaves, -2.685, -2.48, R.chest.top + 0.006, R.chest.top + 0.044, -2.724, -2.72);
  // A walnut folio rest with loose laid-paper sheets. This fallback follows the
  // Blender stand, so a missing kit never restores the contemporary computer.
  const S = R.screen;
  b.span(f.walnut, S.x - 0.10, S.x - 0.032, 1.31, 1.95, 2.205, 2.855);
  b.span(f.walnutDark, S.x - 0.20, S.x + 0.12, 1.27, 1.31, 2.205, 2.855);
  b.span(f.walnut, S.x - 0.03, S.x + 0.04, 1.33, 1.36, 2.205, 2.855);
  for (let i = 0; i < 3; i++) {
    const inset = i * 0.006;
    b.span(f.paper, S.x - 0.029 + i * 0.006, S.x - 0.025 + i * 0.006,
      S.y - 0.275 + inset, S.y + 0.275 - inset, S.z - 0.32 + inset, S.z + 0.32 - inset);
  }
  }
  const fixed = b.build("Library joinery");
  root.add(fixed);
  if (chair) root.add(chair);
  // Blender-authored pieces, merged by finish like the joinery around them.
  const pieces = (Object.keys(KIT_PIECES) as Piece[]).filter((piece) => supplied[piece]).flatMap((piece) => [...KIT_PIECES[piece]]);
  if (kit && pieces.length) root.add(kit.merged(pieces, f));
  // Daylight in the sashes: bright, unshadowed and not itself a shadow caster.
  const glassMaterial = new THREE.MeshStandardMaterial({ color: "#c5d8d1", transparent: true, opacity: 0.08, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  for (const c of R.windows) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(R.windowHalf * 2, R.head - R.sill), glassMaterial);
    pane.position.set(c, (R.sill + R.head) / 2, 2.982);
    pane.rotation.y = Math.PI;
    pane.name = "Daylit sash";
    root.add(pane);
  }
  // Rug.
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 3.75),
    standard({ map: rug(57), roughness: 0.98 }),
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(-5.0, R.floor + 0.006, 0.12);
  carpet.receiveShadow = true;
  carpet.name = "Hearth rug";
  root.add(carpet);
  // Painted contact shadows.
  const shade = new THREE.MeshBasicMaterial({
    map: groundShade(),
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
    toneMapped: false,
  });
  const contact = (x: number, z: number, w: number, d: number, y = R.floor + 0.009, o = 1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), o === 1 ? shade : Object.assign(shade.clone(), { opacity: 0.55 * o }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.renderOrder = 2;
    root.add(m);
  };
  contact(-4.95, 0.75, 2.3, 1.6);
  contact(-4.5, -0.12, 0.8, 0.8, R.floor + 0.01, 0.8);
  contact(-4.5, -2.7, 1.9, 0.9);
  contact(-7.5, -2.12, 1.1, 2.1);
  contact(-7.45, 2.12, 1.2, 2.1);
  // Where surfaces meet, light is occluded. These painted gradients stand in for an
  // occlusion pass: darkest at the junction, gone within half a metre.
  const fade = document.createElement("canvas");
  fade.width = 4;
  fade.height = 64;
  const fctx = fade.getContext("2d")!;
  const fg = fctx.createLinearGradient(0, 0, 0, 64);
  fg.addColorStop(0, "rgba(22,14,6,.5)");
  fg.addColorStop(0.35, "rgba(22,14,6,.2)");
  fg.addColorStop(1, "rgba(22,14,6,0)");
  fctx.fillStyle = fg;
  fctx.fillRect(0, 0, 4, 64);
  const occlusion = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(fade),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const edges: number[] = [],
    edgeUv: number[] = [],
    edgeIndex: number[] = [];
  /** A quad dark along a→b (the junction) fading to c→d. */
  const junction = (a: number[], b2: number[], c: number[], d: number[]) => {
    const n = edges.length / 3;
    edges.push(...a, ...b2, ...c, ...d);
    edgeUv.push(0, 1, 1, 1, 1, 0, 0, 0);
    edgeIndex.push(n, n + 1, n + 2, n, n + 2, n + 3);
  };
  const y0 = R.floor + 0.012,
    y1 = R.ceil - 0.006,
    reach = 0.5;
  const W0 = R.west + 0.006,
    E0 = R.east - 0.006,
    N0 = R.north + 0.006,
    S0 = R.south - 0.006;
  // Floor against the north, south and east walls.
  junction([W0, y0, N0 + 0.04], [E0, y0, N0 + 0.04], [E0, y0, N0 + reach], [W0, y0, N0 + reach]);
  junction([W0, y0, S0 - 0.04], [E0, y0, S0 - 0.04], [E0, y0, S0 - reach], [W0, y0, S0 - reach]);
  junction([E0 - 0.04, y0, N0], [E0 - 0.04, y0, S0], [E0 - reach, y0, S0], [E0 - reach, y0, N0]);
  // Ceiling against all four walls.
  junction([W0, y1, N0], [E0, y1, N0], [E0, y1, N0 + reach], [W0, y1, N0 + reach]);
  junction([W0, y1, S0], [E0, y1, S0], [E0, y1, S0 - reach], [W0, y1, S0 - reach]);
  junction([E0, y1, N0], [E0, y1, S0], [E0 - reach, y1, S0], [E0 - reach, y1, N0]);
  junction([W0, y1, N0], [W0, y1, S0], [W0 + reach, y1, S0], [W0 + reach, y1, N0]);
  // Soft contact at the actual ceiling junction; the surveyed room has no crown
  // and no projecting chimney breast to justify the former floating shadow strips.
  const top = R.ceil - 0.008,
    drop = R.ceil - 0.75;
  junction([W0, top, N0], [E0, top, N0], [E0, drop, N0], [W0, drop, N0]);
  junction([W0, top, S0], [E0, top, S0], [E0, drop, S0], [W0, drop, S0]);
  junction([E0, top, N0], [E0, top, S0], [E0, drop, S0], [E0, drop, N0]);
  junction([W0, top, N0], [W0, top, S0], [W0, drop, S0], [W0, drop, N0]);
  // The corners of the room, floor to ceiling.
  for (const [x, z, dx, dz] of [
    [W0, N0, 1, 0],
    [W0, N0, 0, 1],
    [E0, N0, -1, 0],
    [E0, N0, 0, 1],
    [W0, S0, 1, 0],
    [W0, S0, 0, -1],
    [E0, S0, -1, 0],
    [E0, S0, 0, -1],
  ])
    junction([x, R.rail + 0.02, z], [x, top, z], [x + dx * 0.4, top, z + dz * 0.4], [x + dx * 0.4, R.rail + 0.02, z + dz * 0.4]);
  const occluded = new THREE.BufferGeometry();
  occluded.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  occluded.setAttribute("uv", new THREE.Float32BufferAttribute(edgeUv, 2));
  occluded.setIndex(edgeIndex);
  const junctions = new THREE.Mesh(occluded, occlusion);
  junctions.renderOrder = 1;
  junctions.name = "Painted occlusion";
  root.add(junctions);
  // The law library. Two places are left open for the Tennessee Reports.
  const rows = [1.27, ...lawShelves].map((y) => ({ y, z0: R.law.z0 + 0.04, z1: R.law.z1 - 0.045 }));
  root.add(lawBooks(f, rows, (z, row) => row === 1 && z > -2.26 && z < -2.0));
  // Decorative volumes above the project shelves.
  root.add(
    lawBooks(
      f,
      [{ y: projectShelves[2], z0: R.cabinet.z0 + 0.04, z1: R.cabinet.z1 - 0.3 }],
      () => false,
    ),
  );
  return { root, finishes: f, flames, shelves: { law: lawShelves, projects: projectShelves, divider }, kit: pieces };
}

/** Finishes for the pieces of the hall and exterior that remain in the packed shell. */
function lawn() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#5c6b33";
  ctx.fillRect(0, 0, 512, 512);
  const rand = seeded(91);
  for (let i = 0; i < 9000; i++) {
    const g = 70 + rand() * 70;
    ctx.strokeStyle = "rgba(" + (g * 0.72).toFixed(0) + "," + g.toFixed(0) + "," + (g * 0.34).toFixed(0) + ",.5)";
    ctx.lineWidth = 1;
    const x = rand() * 512,
      y = rand() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 3, y - 2 - rand() * 5);
    ctx.stroke();
  }
  // Leaf shadow from the oaks the survey photographs show on the south lawn.
  ctx.filter = "blur(14px)";
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = "rgba(20,30,10,.34)";
    ctx.beginPath();
    ctx.arc(rand() * 512, rand() * 512, 20 + rand() * 46, 0, 7);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(7, 10);
  t.anisotropy = 8;
  return t;
}
export function sky() {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#7fa2c4");
  g.addColorStop(0.45, "#c3d3da");
  g.addColorStop(0.62, "#f0e2c0");
  g.addColorStop(0.7, "#8f9a66");
  g.addColorStop(1, "#59682f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function dressShell(shell: THREE.Object3D, f: Finishes) {
  const hallBoards = timber("#8a6238", 61, 512, { planks: 8, contrast: 1.1 });
  shell.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const m = mesh.material as THREE.MeshStandardMaterial;
    const name = m.name;
    mesh.receiveShadow = true;
    // The exterior envelope would otherwise block the low sun at the library windows.
    mesh.castShadow = /stair|baluster|newel|handrail|Map table|door|Walnut/i.test(name + mesh.name);
    if (/Walnut/.test(name)) {
      m.map = f.walnut.map;
      m.color.set("#ffffff");
      m.roughness = 0.5;
    } else if (/Limewashed plaster|Lime plaster/.test(name)) {
      m.map = (f.plaster as THREE.MeshStandardMaterial).map;
      m.color.set("#ffffff");
      m.roughness = 0.96;
    } else if (/Painted skirting/.test(name)) {
      m.color.set("#8c8d73");
      m.roughness = 0.62;
    } else if (/Ash plank/.test(name)) {
      // The hall floor's own coordinates span the whole floor once: lay boards down
      // its length at the same scale as the library.
      m.map = hallBoards;
      hallBoards.center.set(0.5, 0.5);
      hallBoards.rotation = Math.PI / 2;
      hallBoards.repeat.set(6.15 / 1.3, 3.27 / 1.3);
      m.color.set("#ffffff");
      m.roughness = 0.6;
    } else if (/Survey base/.test(name)) {
      m.map = lawn();
      m.color.set("#ffffff");
      m.roughness = 1;
    } else if (/Porch joinery|Painted joinery/.test(name)) {
      m.color.set("#e2dac4");
      m.roughness = 0.6;
    }
    m.needsUpdate = true;
  });
}
export { slab };
