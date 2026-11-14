/* Shared construction kit for the live library: seeded surfaces, world-scaled
   boxes and material batches. Everything here is deterministic so the room is
   identical on every visit and in every measurement. */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Tier = "high" | "low";

export function seeded(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hex = (c: THREE.Color) => "#" + c.getHexString();
function shade(color: string, amount: number) {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return hex(
    c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amount, 0, 1)),
  );
}
function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}
/** Soft value noise: random texels stretched over the surface at several scales. */
function mottle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rand: () => number,
  layers: [cell: number, alpha: number][],
  dark = "#000",
  light = "#fff",
) {
  for (const [cell, alpha] of layers) {
    const cw = Math.max(2, Math.round(w / cell)),
      ch = Math.max(2, Math.round(h / cell));
    const [n, nctx] = canvas(cw, ch);
    const data = nctx.createImageData(cw, ch);
    const d = new THREE.Color(dark),
      l = new THREE.Color(light);
    for (let i = 0; i < cw * ch; i++) {
      const v = rand();
      const c = v < 0.5 ? d : l;
      data.data[i * 4] = c.r * 255;
      data.data[i * 4 + 1] = c.g * 255;
      data.data[i * 4 + 2] = c.b * 255;
      data.data[i * 4 + 3] = Math.abs(v - 0.5) * 2 * 255 * alpha;
    }
    nctx.putImageData(data, 0, 0);
    ctx.imageSmoothingEnabled = cell > 1.5;
    ctx.drawImage(n, 0, 0, w, h);
  }
}
function finish(c: HTMLCanvasElement, repeat = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
/** Straight-grained timber. Grain runs along U. */
export function timber(
  base: string,
  seed: number,
  size = 512,
  options: { planks?: number; contrast?: number; gloss?: boolean } = {},
) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  const planks = options.planks ?? 1;
  const contrast = options.contrast ?? 1;
  const ph = size / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph;
    const tone = (rand() - 0.5) * 0.09 * contrast;
    ctx.fillStyle = shade(base, tone);
    ctx.fillRect(0, y0, size, ph);
    // Long annual-ring streaks with a slow waver.
    const streaks = Math.round(ph * 0.9);
    for (let i = 0; i < streaks; i++) {
      const y = y0 + rand() * ph;
      const dark = rand() < 0.62;
      ctx.strokeStyle = dark
        ? "rgba(40,20,8," + (0.03 + rand() * 0.1) * contrast + ")"
        : "rgba(255,225,170," + (0.02 + rand() * 0.06) * contrast + ")";
      ctx.lineWidth = 0.5 + rand() * 1.6;
      ctx.beginPath();
      const wave = (rand() - 0.5) * 5,
        phase = rand() * 6;
      for (let x = 0; x <= size; x += size / 8)
        ctx.lineTo(x, y + Math.sin(x / (size / 3) + phase) * wave);
      ctx.stroke();
    }
    // A cathedral figure or a knot now and then.
    if (rand() < 0.45) {
      const kx = rand() * size,
        ky = y0 + ph * (0.3 + rand() * 0.4);
      for (let r = 1; r < 7; r++) {
        ctx.strokeStyle = "rgba(45,22,8," + 0.1 * contrast + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(kx, ky, r * 9, r * 1.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (planks > 1) {
      // Butt joints and the dark seam between boards.
      ctx.fillStyle = "rgba(15,8,3,.55)";
      ctx.fillRect(0, y0, size, 1.6);
      const joints = 1 + Math.floor(rand() * 2);
      for (let j = 0; j < joints; j++)
        ctx.fillRect(rand() * size, y0, 1.6, ph);
      // Worn, paler board centres from two centuries of traffic.
      const g = ctx.createLinearGradient(0, y0, 0, y0 + ph);
      g.addColorStop(0, "rgba(0,0,0,.12)");
      g.addColorStop(0.18, "rgba(255,240,210,.035)");
      g.addColorStop(0.82, "rgba(255,240,210,.035)");
      g.addColorStop(1, "rgba(0,0,0,.14)");
      ctx.fillStyle = g;
      ctx.fillRect(0, y0, size, ph);
    }
  }
  mottle(ctx, size, size, rand, [
    [90, 0.07],
    [3, 0.05],
  ]);
  return finish(c);
}
export function plaster(base: string, seed: number, size = 512) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  mottle(
    ctx,
    size,
    size,
    rand,
    [
      [170, 0.028],
      [60, 0.03],
      [14, 0.03],
      [2, 0.035],
    ],
    "#6b5a3c",
    "#fff6e0",
  );
  // Trowel sweeps.
  for (let i = 0; i < 46; i++) {
    ctx.strokeStyle =
      rand() < 0.5 ? "rgba(255,248,230,.03)" : "rgba(90,70,40,.025)";
    ctx.lineWidth = 6 + rand() * 26;
    ctx.beginPath();
    const x = rand() * size,
      y = rand() * size,
      a = rand() * Math.PI;
    ctx.ellipse(x, y, 40 + rand() * 120, 20 + rand() * 60, a, 0, 1.2 + rand());
    ctx.stroke();
  }
  return finish(c);
}
/** Brushed paint over joinery: faint strokes along U. */
export function paint(base: string, seed: number, size = 256) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 1.4; i++) {
    ctx.strokeStyle =
      rand() < 0.5
        ? "rgba(255,255,240," + rand() * 0.05 + ")"
        : "rgba(40,36,20," + rand() * 0.06 + ")";
    ctx.lineWidth = 0.6 + rand() * 1.4;
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (rand() - 0.5) * 3);
    ctx.stroke();
  }
  mottle(ctx, size, size, rand, [[70, 0.06]]);
  return finish(c);
}
export function leather(base: string, seed: number, size = 256) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  mottle(
    ctx,
    size,
    size,
    rand,
    [
      [50, 0.1],
      [9, 0.08],
      [1.5, 0.12],
    ],
    "#120803",
    "#d9a878",
  );
  for (let i = 0; i < 60; i++) {
    // Scuffs.
    ctx.strokeStyle = "rgba(230,190,140," + rand() * 0.07 + ")";
    ctx.lineWidth = 0.5 + rand();
    ctx.beginPath();
    const x = rand() * size,
      y = rand() * size;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 30);
    ctx.stroke();
  }
  return finish(c);
}
export function paper(base: string, seed: number, size = 256) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  mottle(
    ctx,
    size,
    size,
    rand,
    [
      [120, 0.1],
      [30, 0.06],
      [1.2, 0.05],
    ],
    "#8a6a3a",
    "#fffaf0",
  );
  // Laid lines of handmade paper.
  ctx.strokeStyle = "rgba(120,95,55,.05)";
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(size, y + 0.5);
    ctx.stroke();
  }
  return finish(c);
}
/** The fore-edge of a text block: hundreds of leaves seen edge-on. */
export function leaves(seed: number) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(64, 256);
  ctx.fillStyle = "#d9c9a0";
  ctx.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y++) {
    ctx.fillStyle =
      "rgba(" +
      (rand() < 0.5 ? "70,50,25," : "255,245,215,") +
      rand() * 0.28 +
      ")";
    ctx.fillRect(0, y, 64, 1);
  }
  return finish(c);
}
export function brick(seed: number, size = 512) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = "#1c1611";
  ctx.fillRect(0, 0, size, size);
  const rows = 12,
    bh = size / rows,
    bw = size / 5;
  for (let r = 0; r < rows; r++)
    for (let i = -1; i < 6; i++) {
      const x = i * bw + (r % 2 ? bw / 2 : 0);
      const soot = 0.25 + rand() * 0.2 - (r / rows) * 0.1;
      ctx.fillStyle = shade("#5a3324", -soot + (rand() - 0.5) * 0.06);
      ctx.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
    }
  mottle(
    ctx,
    size,
    size,
    rand,
    [
      [40, 0.3],
      [4, 0.2],
    ],
    "#000",
    "#6b5647",
  );
  return finish(c);
}
/** Flat-woven hearth rug with a madder field, flax borders and lozenges. */
export function rug(seed: number) {
  const rand = seeded(seed);
  const w = 1024,
    h = 1024;
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = "#5e2a1c";
  ctx.fillRect(0, 0, w, h);
  const border = (inset: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  };
  border(26, 30, "#2c1a12");
  border(52, 8, "#b0844a");
  border(84, 34, "#3d4a3a");
  border(116, 6, "#b0844a");
  border(138, 3, "#c9a56b");
  // Guard border of small diamonds.
  ctx.fillStyle = "#b9905a";
  for (let i = 0; i < 26; i++) {
    const t = 84 + ((w - 168) * (i + 0.5)) / 26;
    for (const [x, y] of [
      [t, 84],
      [t, h - 84],
      [84, t],
      [w - 84, t],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 7, y);
      ctx.fill();
    }
  }
  // Field: offset rows of lozenges and a central medallion.
  for (let r = 0; r < 9; r++)
    for (let k = 0; k < 7; k++) {
      const x = 205 + k * 102 + (r % 2 ? 51 : 0),
        y = 205 + r * 77;
      if (x > w - 190) continue;
      ctx.fillStyle = (r + k) % 3 ? "#a8763e" : "#32423a";
      ctx.beginPath();
      ctx.moveTo(x, y - 22);
      ctx.lineTo(x + 15, y);
      ctx.lineTo(x, y + 22);
      ctx.lineTo(x - 15, y);
      ctx.fill();
      ctx.fillStyle = "#e0c08a";
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  ctx.strokeStyle = "#c9a56b";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 150, 210, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#3a2018";
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 140, 200, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b0844a";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      w / 2 + Math.cos(a) * 80,
      h / 2 + Math.sin(a) * 120,
      26,
      9,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  // Weave: fine warp and weft lines, then wear.
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.07;
  for (let x = 0; x < w; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  mottle(
    ctx,
    w,
    h,
    rand,
    [
      [260, 0.2],
      [50, 0.1],
      [2, 0.1],
    ],
    "#1a0d08",
    "#e7c9a1",
  );
  return finish(c, false);
}
/** Grey-scale copy for bump and roughness variation. */
export function relief(source: THREE.Texture, strength = 1) {
  const img = source.image as HTMLCanvasElement;
  const [c, ctx] = canvas(img.width, img.height);
  ctx.filter = "grayscale(1) contrast(" + (1 + strength) + ")";
  ctx.drawImage(img, 0, 0);
  const t = finish(c, source.wrapS === THREE.RepeatWrapping, false);
  t.repeat.copy(source.repeat);
  return t;
}

type Finish = {
  color?: string;
  map?: THREE.Texture;
  roughness?: number;
  metalness?: number;
  bump?: number;
  emissive?: string;
  emissiveIntensity?: number;
  env?: number;
  side?: THREE.Side;
};
export function standard(f: Finish) {
  const m = new THREE.MeshStandardMaterial({
    color: f.map ? "#ffffff" : (f.color ?? "#ffffff"),
    roughness: f.roughness ?? 0.8,
    metalness: f.metalness ?? 0,
    side: f.side ?? THREE.FrontSide,
  });
  if (f.map) m.map = f.map;
  if (f.map && f.color) m.color.set(f.color);
  if (f.map && f.bump) {
    m.bumpMap = relief(f.map, 0.6);
    m.bumpScale = f.bump;
  }
  if (f.emissive) {
    m.emissive.set(f.emissive);
    m.emissiveIntensity = f.emissiveIntensity ?? 1;
  }
  if (f.env !== undefined) m.envMapIntensity = f.env;
  return m;
}

/** Box with UVs measured in metres, so one timber or plaster tile reads at one scale
    everywhere. `grain` chooses which box axis the U direction follows on each face. */
export function slab(
  w: number,
  h: number,
  d: number,
  tile = 1,
  grain: "x" | "y" | "z" | "long" = "long",
  centre: [number, number, number] = [0, 0, 0],
) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const pos = g.attributes.position as THREE.BufferAttribute;
  // Face order: +x -x +y -y +z -z, with the two box axes each face spans.
  const faces: [0 | 1 | 2, 0 | 1 | 2][] = [
    [2, 1],
    [2, 1],
    [0, 2],
    [0, 2],
    [0, 1],
    [0, 1],
  ];
  const long = w >= h && w >= d ? 0 : h >= d ? 1 : 2;
  const along = grain === "long" ? long : { x: 0, y: 1, z: 2 }[grain];
  faces.forEach(([ua, va], f) => {
    const swap = va === along;
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      // Texture coordinates are the piece's own position in the room, so a surface
      // built from several pieces carries one continuous finish.
      const p = [pos.getX(k), pos.getY(k), pos.getZ(k)];
      const u = (p[ua] + centre[ua]) / tile,
        v = (p[va] + centre[va]) / tile;
      uv.setXY(k, swap ? v : u, swap ? u : v);
    }
  });
  return g;
}

/** Collects static pieces by material and merges each set into one draw call. */
export class Batch {
  private sets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private m = new THREE.Matrix4();
  add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number] = [0, 0, 0],
    rotation?: [number, number, number],
  ) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    this.m.makeRotationFromEuler(
      new THREE.Euler(...(rotation ?? [0, 0, 0]), "YXZ"),
    );
    this.m.setPosition(...position);
    g.applyMatrix4(this.m);
    for (const name of Object.keys(g.attributes))
      if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
    const list = this.sets.get(material) ?? [];
    list.push(g);
    this.sets.set(material, list);
  }
  /** Box given by its extents: the natural way to describe joinery. */
  span(
    material: THREE.Material,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    z0: number,
    z1: number,
    tile = 1,
    grain: "x" | "y" | "z" | "long" = "long",
  ) {
    const centre: [number, number, number] = [
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      (z0 + z1) / 2,
    ];
    this.add(
      slab(
        Math.abs(x1 - x0),
        Math.abs(y1 - y0),
        Math.abs(z1 - z0),
        tile,
        grain,
        centre,
      ),
      material,
      centre,
    );
  }
  build(name: string, shadows = true) {
    const group = new THREE.Group();
    group.name = name;
    for (const [material, list] of this.sets) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), material);
      mesh.castShadow = mesh.receiveShadow = shadows;
      mesh.name = name + " · " + (material.name || "surface");
      list.forEach((g) => g.dispose());
      group.add(mesh);
    }
    this.sets.clear();
    return group;
  }
}

/** A box drawn in as few passes as possible: the listed faces (+x −x +y −y +z −z) use
    material 1 (and optionally material 2), every other face material 0. */
export function facedBox(
  w: number,
  h: number,
  d: number,
  special: number[],
  third: number[] = [],
) {
  const g = new THREE.BoxGeometry(w, h, d);
  const index = g.index!.array;
  const order = [
    ...[0, 1, 2, 3, 4, 5].filter(
      (f) => !special.includes(f) && !third.includes(f),
    ),
    ...special,
    ...third,
  ];
  const out: number[] = [];
  for (const f of order) for (let i = 0; i < 6; i++) out.push(index[f * 6 + i]);
  g.setIndex(out);
  g.clearGroups();
  const plain = (6 - special.length - third.length) * 6;
  g.addGroup(0, plain, 0);
  g.addGroup(plain, special.length * 6, 1);
  if (third.length) g.addGroup(plain + special.length * 6, third.length * 6, 2);
  return g;
}

export function lathe(
  profile: [radius: number, height: number][],
  segments = 20,
) {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}

/** A soft contact shadow painted under furniture, cheaper than any occlusion pass. */
export function groundShade() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,.72)");
  g.addColorStop(0.55, "rgba(0,0,0,.3)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return finish(c, false, false);
}
export const easeInOut = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
