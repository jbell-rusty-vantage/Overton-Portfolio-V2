/* The people on the grounds: present-day museum visitors and one guide. They are plain,
   well-proportioned model figures without faces, in ordinary clothes of today, drawn as
   a single skinned mesh so the whole company costs one draw call. Each has eleven bones
   and a small procedural life: a shift of weight, a turn of the head, a slow walk. */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Tier } from "../kit";
import { BENCH, heightAt, loopAt, standing, type Circle, type Person, type Role } from "./plan";

type Look = {
  height: number;
  /** Width of shoulders and hips against the average. */
  shoulders: number;
  hips: number;
  head?: number;
  skin: string;
  hair: string;
  style: "short" | "bun" | "long" | "curly" | "cap";
  top: string;
  /** Sleeve colour when it differs from the body of the garment (a vest). */
  sleeves?: string;
  hem?: boolean;
  bottom: string;
  shoes: string;
  extras?: ("lanyard" | "backpack" | "tote" | "book" | "phone")[];
  extra?: string;
};
const looks: Record<Role, Look> = {
  guide: { height: 1.66, shoulders: 0.95, hips: 1.04, skin: "#c99873", hair: "#7a6a5a", style: "short", top: "#3f5a44", sleeves: "#e6dcc4", bottom: "#2f3138", shoes: "#3a2c22", extras: ["lanyard"] },
  reader: { height: 1.76, shoulders: 1.04, hips: 1.0, skin: "#e0b596", hair: "#c9c6c0", style: "cap", top: "#a88a5e", hem: true, bottom: "#565a60", shoes: "#2a2622", extra: "#5a5246" },
  sitter: { height: 1.62, shoulders: 0.92, hips: 1.0, skin: "#e2bd9a", hair: "#1c1a1a", style: "long", top: "#2f7a78", hem: true, bottom: "#30384a", shoes: "#d8d2c6", extras: ["book"], extra: "#8a2f2a" },
  photographer: { height: 1.8, shoulders: 1.06, hips: 0.98, skin: "#b9835c", hair: "#2a211c", style: "short", top: "#c8662a", sleeves: "#7c8086", bottom: "#3c4658", shoes: "#5a4634", extras: ["phone"] },
  companion: { height: 1.6, shoulders: 0.94, hips: 1.08, skin: "#6e4a36", hair: "#dcd8d2", style: "curly", top: "#6a3a5c", hem: true, bottom: "#2c2a30", shoes: "#2a2422", extras: ["tote"], extra: "#c9b68a" },
  parent: { height: 1.68, shoulders: 0.93, hips: 1.05, skin: "#8a5e44", hair: "#1e1614", style: "bun", top: "#c99a2e", bottom: "#3a4a66", shoes: "#e0dcd2" },
  partner: { height: 1.83, shoulders: 1.08, hips: 0.98, skin: "#5a3c2c", hair: "#141110", style: "short", top: "#28405e", hem: true, bottom: "#9a8a6a", shoes: "#4a3a2c" },
  child: { height: 1.17, shoulders: 0.9, hips: 0.95, head: 1.22, skin: "#7a5440", hair: "#1a1412", style: "curly", top: "#b83a32", bottom: "#4a5a7a", shoes: "#f0f0ea", extras: ["backpack"], extra: "#3a8a6a" },
};

const BONES = 11;
const B = { hips: 0, chest: 1, head: 2, armL: 3, foreL: 4, armR: 5, foreR: 6, thighL: 7, shinL: 8, thighR: 9, shinR: 10 } as const;
type B = (typeof B)[keyof typeof B];
type Figure = {
  role: Role;
  k: number;
  bones: THREE.Bone[];
  anchor: THREE.Group;
  phase: number;
  /** Smoothed head turn toward the visitor. */
  turn: number;
  /** Walkers: distance behind the head of the family on the loop, and sideways offset. */
  lag: number;
  side: number;
  stride: number;
  obstacle: Circle;
};

/** A limb segment from `a` to `b`, rounded where it meets the next. */
function segment(a: THREE.Vector3, b: THREE.Vector3, ra: number, rb: number) {
  const dir = b.clone().sub(a),
    len = dir.length();
  const g = new THREE.LatheGeometry([new THREE.Vector2(ra * 0.5, -ra * 0.6), new THREE.Vector2(ra, 0), new THREE.Vector2(rb, len), new THREE.Vector2(rb * 0.5, len + rb * 0.6)], 7);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}
function ellipsoid(x: number, y: number, z: number, rx: number, ry: number, rz: number, w = 9, h = 6, theta = Math.PI, tilt = 0) {
  const g = new THREE.SphereGeometry(1, w, h, 0, Math.PI * 2, 0, theta);
  if (tilt) g.rotateX(tilt);
  g.scale(rx, ry, rz);
  g.computeVertexNormals();
  g.translate(x, y, z);
  return g;
}
/** A lathed body with an oval section: rows of [height, half-width, half-depth]. */
function body(rows: [number, number, number][]) {
  const g = new THREE.LatheGeometry(
    rows.map(([y, rx]) => new THREE.Vector2(rx, y)),
    10,
  );
  // Put the lathe's seam down the back.
  g.rotateY(Math.PI);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // Find the depth ratio for this height.
    let ratio = rows[0][2] / rows[0][1];
    for (const [ry, rx, rz] of rows) if (Math.abs(ry - y) < 1e-5) ratio = rz / rx;
    p.setZ(i, p.getZ(i) * ratio);
  }
  g.computeVertexNormals();
  return g;
}
function crate(x: number, y: number, z: number, w: number, h: number, d: number, pitch = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (pitch) g.rotateX(pitch);
  g.translate(x, y, z);
  return g;
}

/** Build every figure in its standing bind pose at the origin, tagged with its bones. */
function sculpt(look: Look, role: Role, first: number) {
  const k = look.height,
    sh = look.shoulders,
    hp = look.hips,
    hd = look.head ?? 1;
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, bone: B, colour: string) => {
    const geo = g.index ? g.toNonIndexed() : g;
    const n = geo.attributes.position.count;
    const c = new THREE.Color(colour);
    const colours = new Float32Array(n * 3),
      index = new Uint16Array(n * 4),
      weight = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      colours.set([c.r, c.g, c.b], i * 3);
      index[i * 4] = first + bone;
      weight[i * 4] = 1;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    geo.setAttribute("skinIndex", new THREE.BufferAttribute(index, 4));
    geo.setAttribute("skinWeight", new THREE.BufferAttribute(weight, 4));
    geo.deleteAttribute("uv");
    parts.push(geo);
    if (geo !== g) g.dispose();
  };
  const v = (x: number, y: number, z = 0) => new THREE.Vector3(x * k, y * k, z * k);
  const sleeve = look.sleeves ?? look.top;
  // Hips and legs.
  add(body([[0.49, 0.06 * hp, 0.05], [0.53, 0.094 * hp, 0.07], [0.6, 0.086 * hp, 0.064], [0.63, 0.07, 0.05]].map(([y, a, b]) => [y * k, a * k, b * k] as [number, number, number])), B.hips, look.bottom);
  for (const s of [1, -1]) {
    const x = 0.052 * hp * s;
    add(segment(v(x, 0.52), v(x, 0.285), 0.057 * k * hp, 0.042 * k), s > 0 ? B.thighL : B.thighR, look.bottom);
    add(segment(v(x, 0.285), v(x, 0.05), 0.041 * k, 0.027 * k), s > 0 ? B.shinL : B.shinR, look.bottom);
    add(ellipsoid(x * k, 0.03 * k, 0.034 * k, 0.036 * k, 0.03 * k, 0.078 * k, 7, 5), s > 0 ? B.shinL : B.shinR, look.shoes);
  }
  // Trunk: the garment, with a longer hem for coats and jackets.
  const rows: [number, number, number][] = [
    [0.6, 0.088 * hp, 0.066],
    [0.68, 0.09, 0.066],
    [0.76, 0.104 * sh, 0.072],
    [0.815, 0.1 * sh, 0.064],
    [0.848, 0.05, 0.044],
    [0.862, 0.03, 0.03],
  ];
  if (look.hem) rows.unshift([0.5, 0.102 * hp, 0.078], [0.55, 0.1 * hp, 0.076]);
  else rows.unshift([0.565, 0.092 * hp, 0.07]);
  add(body(rows.map(([y, a, b]) => [y * k, a * k, b * k] as [number, number, number])), B.chest, look.top);
  add(segment(v(0, 0.85), v(0, 0.89), 0.027 * k, 0.026 * k), B.chest, look.skin);
  // Head and hair.
  const hy = 0.868 + 0.068 * hd;
  add(ellipsoid(0, hy * k, 0.006 * k, 0.057 * k * hd, 0.068 * k * hd, 0.064 * k * hd, 10, 7), B.head, look.skin);
  const hair = look.style === "cap" ? (look.extra ?? look.hair) : look.hair;
  const big = look.style === "curly" ? 1.16 : 1.07;
  add(ellipsoid(0, (hy + 0.004) * k, -0.004 * k, 0.057 * k * hd * big, 0.068 * k * hd * big, 0.066 * k * hd * big, 10, 5, 1.72, -0.42), B.head, hair);
  if (look.style === "bun") add(ellipsoid(0, (hy + 0.045) * k, -0.058 * k, 0.03 * k, 0.03 * k, 0.03 * k, 7, 5), B.head, look.hair);
  if (look.style === "long") add(ellipsoid(0, (hy - 0.06) * k, -0.05 * k, 0.056 * k, 0.1 * k, 0.03 * k, 8, 5), B.head, look.hair);
  if (look.style === "cap") {
    add(ellipsoid(0, (hy + 0.03) * k, 0.062 * k, 0.048 * k, 0.008 * k, 0.04 * k, 7, 4), B.head, hair);
    // Grey hair showing under the cap at the back.
    add(ellipsoid(0, (hy - 0.022) * k, -0.03 * k, 0.056 * k, 0.03 * k, 0.045 * k, 8, 4), B.head, look.hair);
  }
  // Arms.
  for (const s of [1, -1]) {
    const sx = 0.11 * sh * s;
    add(segment(v(sx, 0.815), v(sx + 0.012 * s, 0.63), 0.037 * k, 0.03 * k), s > 0 ? B.armL : B.armR, sleeve);
    add(segment(v(sx + 0.012 * s, 0.63), v(sx + 0.02 * s, 0.475), 0.029 * k, 0.023 * k), s > 0 ? B.foreL : B.foreR, sleeve);
    add(ellipsoid((sx + 0.021 * s) * k, 0.44 * k, 0.004 * k, 0.02 * k, 0.034 * k, 0.027 * k, 6, 4), s > 0 ? B.foreL : B.foreR, look.skin);
  }
  for (const extra of look.extras ?? []) {
    if (extra === "lanyard") {
      add(crate(0, 0.705 * k, 0.071 * k, 0.05 * k, 0.062 * k, 0.006 * k), B.chest, "#f4f0e6");
      for (const s of [1, -1]) add(crate(0.022 * s * k, 0.785 * k, 0.066 * k, 0.008 * k, 0.11 * k, 0.005 * k, -0.06), B.chest, "#1f3a5a");
    }
    if (extra === "backpack") add(ellipsoid(0, 0.72 * k, -0.105 * k, 0.085 * k, 0.11 * k, 0.05 * k, 8, 5), B.chest, look.extra ?? "#3a8a6a");
    if (extra === "tote") {
      add(crate(-0.135 * hp * k, 0.52 * k, 0.0, 0.03 * k, 0.17 * k, 0.2 * k), B.chest, look.extra ?? "#c9b68a");
      add(crate(-0.128 * k, 0.7 * k, 0.0, 0.008 * k, 0.24 * k, 0.02 * k), B.chest, look.extra ?? "#c9b68a");
    }
    if (extra === "book") {
      add(crate(0, 0.685 * k, 0.262 * k, 0.26, 0.022, 0.18, -0.85), B.chest, look.extra ?? "#8a2f2a");
      add(crate(0, 0.69 * k, 0.266 * k, 0.24, 0.012, 0.165, -0.85), B.chest, "#f1ead8");
    }
    if (extra === "phone") add(crate(-0.11 * sh * k - 0.02 * k + 0.045, 0.425 * k, 0.012 * k, 0.15, 0.012, 0.075), B.foreR, "#16181c");
  }
  if (role === "guide") add(crate(0.052 * k, 0.775 * k, 0.07 * k, 0.03 * k, 0.012 * k, 0.004 * k), B.chest, "#e6dcc4");
  return parts;
}

function skeleton(look: Look) {
  const k = look.height,
    sh = look.shoulders,
    hp = look.hips;
  const bones = Array.from({ length: BONES }, () => new THREE.Bone());
  const at = (b: B, parent: B | null, x: number, y: number) => {
    bones[b].position.set(x * k, y * k, 0);
    if (parent !== null) bones[parent].add(bones[b]);
  };
  at(B.hips, null, 0, 0.53);
  at(B.chest, B.hips, 0, 0.07);
  at(B.head, B.chest, 0, 0.268);
  at(B.armL, B.chest, 0.11 * sh, 0.215);
  at(B.foreL, B.armL, 0.012, -0.185);
  at(B.armR, B.chest, -0.11 * sh, 0.215);
  at(B.foreR, B.armR, -0.012, -0.185);
  at(B.thighL, B.hips, 0.052 * hp, -0.01);
  at(B.shinL, B.thighL, 0, -0.235);
  at(B.thighR, B.hips, -0.052 * hp, -0.01);
  at(B.shinR, B.thighR, 0, -0.235);
  return bones;
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const SPEED = 0.5;

export function buildPeople(tier: Tier, reduced: boolean, shadeAt: (x: number, z: number) => number, shadeTexture: THREE.Texture, material: THREE.Material) {
  const cast: (Person & { lag?: number; side?: number })[] = [
    ...standing.filter((p) => tier === "high" || p.role === "guide" || p.role === "reader"),
    // The family: a parent with the child by the hand on the bed side, and a partner
    // a pace behind.
    { role: "parent", x: 0, z: 0, yaw: 0, lag: 0, side: -0.4 },
    { role: "child", x: 0, z: 0, yaw: 0, lag: 0, side: 0.44 },
    { role: "partner", x: 0, z: 0, yaw: 0, lag: 1.35, side: -0.1 },
  ];
  const parts: THREE.BufferGeometry[] = [];
  const allBones: THREE.Bone[] = [];
  const figures: Figure[] = [];
  const group = new THREE.Group();
  group.name = "People";
  cast.forEach((p, i) => {
    const look = looks[p.role];
    parts.push(...sculpt(look, p.role, i * BONES));
    const bones = skeleton(look);
    const anchor = new THREE.Group();
    anchor.add(bones[B.hips]);
    allBones.push(...bones);
    figures.push({
      role: p.role,
      k: look.height,
      bones,
      anchor,
      phase: i * 1.7,
      turn: 0,
      lag: p.lag ?? 0,
      side: p.side ?? 0,
      stride: p.role === "child" ? 0.72 : 1.02,
      obstacle: { x: p.x, z: p.z, r: p.role === "sitter" ? 0.5 : 0.45 },
    });
    anchor.position.set(p.x, heightAt(p.x, p.z), p.z);
    anchor.rotation.y = p.yaw;
  });
  const geometry = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = "People · figures";
  // Bind with every figure at the origin, then send each to its place.
  const places = figures.map((f) => [f.anchor.position.clone(), f.anchor.rotation.y] as const);
  figures.forEach((f) => {
    f.anchor.position.set(0, 0, 0);
    f.anchor.rotation.y = 0;
    mesh.add(f.anchor);
  });
  mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(allBones));
  figures.forEach((f, i) => {
    f.anchor.position.copy(places[i][0]);
    f.anchor.rotation.y = places[i][1];
  });
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 10), 22);
  mesh.castShadow = mesh.receiveShadow = false;
  group.add(mesh);

  // Painted shadows. Those who stand or sit have theirs in the ground's shade map; each
  // walker carries a small quad: long in open sun, a pool underfoot in the shade of a
  // tree. (Plain meshes, not instances: rewriting an instance buffer every frame makes
  // the graphics driver wait for the previous frame.)
  const plane = new THREE.PlaneGeometry(1, 1);
  plane.rotateX(-Math.PI / 2);
  plane.translate(0, 0, -0.5);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadeTexture, color: "#10141c", transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false });
  const walkers = figures.filter((f) => f.lag || f.side);
  // The plane's far end is −Z; turn it to lie along the direction shadows fall.
  const fall = Math.atan2(-0.643, 1.339);
  const shadows = walkers.map((f) => {
    const mesh = new THREE.Mesh(plane, shadowMaterial);
    mesh.name = "People · painted shadow · " + f.role;
    mesh.rotation.y = fall;
    mesh.renderOrder = 2;
    group.add(mesh);
    return mesh;
  });
  const shadow = (mesh: THREE.Mesh, f: Figure) => {
    const x = f.anchor.position.x,
      z = f.anchor.position.z;
    const open = 1 - Math.min(1, shadeAt(x, z) * 1.6);
    mesh.scale.set(0.5 + 0.1 * (1 - open), 1, f.k * 1.45 * open + 0.55 * (1 - open));
    // Start a little behind the feet so the pool sits under the figure.
    mesh.position.set(x - 0.643 * 0.14, f.anchor.position.y + 0.045, z + 1.339 * 0.14);
  };

  let travelled = 3.2;
  let pace = 1;
  let time = 0;
  const pose = (f: Figure, t: number, camera: THREE.Vector3 | null, dt: number) => {
    const b = f.bones,
      k = f.k,
      ph = f.phase;
    const r = (bone: B, x: number, y: number, z: number) => b[bone].rotation.set(x, y, z);
    const breathe = Math.sin(t * 0.9 + ph) * 0.006;
    const shift = Math.sin(t * 0.23 + ph) * 0.022;
    // Notice a visitor who comes near and is in front; otherwise look about slowly.
    let want = Math.sin(t * 0.19 + ph) * 0.3 + Math.sin(t * 0.07 + ph * 2) * 0.18;
    if (camera) {
      const dx = camera.x - f.anchor.position.x,
        dz = camera.z - f.anchor.position.z,
        d = Math.hypot(dx, dz),
        rel = wrap(Math.atan2(dx, dz) - f.anchor.rotation.y);
      const near = f.role === "guide" ? 11 : 4.5;
      if (d < near && Math.abs(rel) < 1.9) want = THREE.MathUtils.clamp(rel, -1.05, 1.05);
    }
    f.turn += (want - f.turn) * Math.min(1, dt * 1.6);
    const turn = f.turn;
    b[B.hips].position.y = 0.53 * k;
    r(B.hips, 0, 0, shift * 0.5);
    switch (f.role) {
      case "guide":
        r(B.chest, 0.02 + breathe, turn * 0.22, -shift * 0.5);
        r(B.head, 0.02, turn * 0.7, 0);
        r(B.armL, -0.2, 0, 0.05);
        r(B.armR, -0.2, 0, -0.05);
        r(B.foreL, -0.95, 0, -0.62);
        r(B.foreR, -0.95, 0, 0.62);
        break;
      case "reader": {
        // Reading the sign, with now and then a look up at the house.
        const up = THREE.MathUtils.smoothstep(Math.sin(t * 0.16 + ph), 0.72, 0.95);
        r(B.chest, 0.07 - up * 0.05 + breathe, turn * 0.1 * up, -shift * 0.5);
        r(B.head, 0.42 - up * 0.52, turn * 0.5 * up, 0);
        r(B.armL, 0.14, 0, 0.06);
        r(B.armR, 0.14, 0, -0.06);
        r(B.foreL, -0.4, 0, -0.3);
        r(B.foreR, -0.4, 0, 0.3);
        break;
      }
      case "sitter": {
        const up = THREE.MathUtils.smoothstep(Math.sin(t * 0.13 + ph), 0.6, 0.9);
        b[B.hips].position.y = 0.31 * k;
        r(B.hips, 0, 0, 0);
        r(B.chest, 0.06 + breathe - up * 0.08, turn * 0.15 * up, 0);
        r(B.head, 0.46 - up * 0.5, turn * 0.6 * up, 0);
        r(B.armL, -0.52, 0, 0.1);
        r(B.armR, -0.52, 0, -0.1);
        r(B.foreL, -1.22, 0, -0.42);
        r(B.foreR, -1.22, 0, 0.42);
        r(B.thighL, -1.5, 0, 0.07);
        r(B.thighR, -1.5, 0, -0.07);
        r(B.shinL, 1.42, 0, 0);
        r(B.shinR, 1.3, 0, 0);
        return;
      }
      case "photographer": {
        // Raises the phone to frame the house, lowers it, tries again.
        const raise = THREE.MathUtils.smoothstep(Math.sin(t * 0.21 + ph), -0.5, 0.1);
        r(B.chest, -0.03 + breathe, 0, -shift * 0.4);
        r(B.head, -0.1 * raise + 0.12 * (1 - raise), turn * 0.3 * (1 - raise), 0);
        r(B.armL, -0.25 - 0.85 * raise, 0, -0.1 - 0.2 * raise);
        r(B.armR, -0.25 - 0.85 * raise, 0, 0.1 + 0.2 * raise);
        r(B.foreL, -0.9 - 0.35 * raise, 0, -0.5);
        r(B.foreR, -0.9 - 0.35 * raise, 0, 0.5);
        break;
      }
      case "companion":
        r(B.chest, -0.02 + breathe, turn * 0.2, -shift * 0.5);
        r(B.head, -0.16, turn * 0.6, 0);
        r(B.armL, 0.04, 0, 0.07);
        r(B.armR, 0.1, 0, -0.07);
        r(B.foreL, -0.18, 0, 0);
        r(B.foreR, -0.3, 0, 0.2);
        break;
      default: {
        // Walking. One stride is two steps; the knee bends as the leg swings through.
        const a = ((travelled - f.lag) / f.stride) * Math.PI * 2 + (f.role === "partner" ? 1.1 : 0);
        const A = 0.33 * pace;
        const swing = Math.sin(a);
        b[B.hips].position.y = (0.53 - 0.016 * swing * swing * pace) * k;
        r(B.hips, 0, swing * 0.05 * pace, 0);
        r(B.thighL, -A * swing, 0, 0);
        r(B.thighR, A * swing, 0, 0);
        r(B.shinL, 0.08 + 0.6 * pace * Math.max(0, Math.cos(a)) ** 1.5, 0, 0);
        r(B.shinR, 0.08 + 0.6 * pace * Math.max(0, -Math.cos(a)) ** 1.5, 0, 0);
        r(B.chest, 0.03 + breathe, -swing * 0.04 * pace + turn * 0.12, 0);
        if (f.role === "parent") {
          // Looks down to the child now and then; the left hand holds the child's.
          const down = THREE.MathUtils.smoothstep(Math.sin(t * 0.17 + 1), 0.3, 0.8);
          r(B.head, 0.05 + 0.2 * down, 0.5 * down + turn * 0.5 * (1 - down), 0);
          r(B.armL, 0, 0, 0.36);
          r(B.foreL, -0.05, 0, 0);
          r(B.armR, -0.24 * swing * pace, 0, -0.05);
          r(B.foreR, -0.22, 0, 0);
        } else if (f.role === "child") {
          const curious = Math.sin(t * 0.31 + 2) * 0.5;
          r(B.head, -0.08, curious + turn * 0.4, 0);
          r(B.armR, -0.1, 0, -1.2);
          r(B.foreR, -0.1, 0, 0);
          r(B.armL, 0.3 * swing * pace, 0, 0.08);
          r(B.foreL, -0.25, 0, 0);
        } else {
          r(B.head, 0, turn * 0.6, 0);
          r(B.armL, 0.24 * swing * pace, 0, 0.05);
          r(B.armR, -0.24 * swing * pace, 0, -0.05);
          r(B.foreL, -0.2 - 0.1 * Math.max(0, -swing), 0, 0);
          r(B.foreR, -0.2 - 0.1 * Math.max(0, swing), 0, 0);
        }
        return;
      }
    }
    r(B.thighL, 0, 0, 0.025);
    r(B.thighR, 0, 0, -0.025);
    r(B.shinL, 0, 0, 0);
    r(B.shinR, 0, 0, 0);
  };
  const place = () => {
    walkers.forEach((f, i) => {
      const at = loopAt(travelled - f.lag);
      const x = at.x + Math.cos(at.yaw) * f.side,
        z = at.z - Math.sin(at.yaw) * f.side;
      f.anchor.position.set(x, heightAt(x, z), z);
      f.anchor.rotation.y = at.yaw;
      shadow(shadows[i], f);
    });
  };
  const sitter = figures.find((f) => f.role === "sitter");
  if (sitter) sitter.anchor.position.set(BENCH.x + Math.sin(BENCH.yaw) * 0.02, heightAt(BENCH.x, BENCH.z), BENCH.z + Math.cos(BENCH.yaw) * 0.02);
  place();
  figures.forEach((f) => pose(f, 0, null, 1));

  return {
    group,
    // Only the people who stay put are obstacles; the family gives way instead.
    obstacles: figures.filter((f) => !walkers.includes(f)).map((f) => f.obstacle),
    triangles: geometry.attributes.position.count / 3,
    update(dt: number, camera: THREE.Vector3) {
      if (reduced) return false;
      time += dt;
      // The family gives way: it slows to a stop if the visitor stands in its path.
      const head = loopAt(travelled + 1.1);
      const blocked = Math.hypot(camera.x - head.x, camera.z - head.z) < 1.9 || walkers.some((f) => Math.hypot(camera.x - f.anchor.position.x, camera.z - f.anchor.position.z) < 1.1);
      pace += ((blocked ? 0 : 1) - pace) * Math.min(1, dt * 2);
      travelled += SPEED * pace * dt;
      place();
      for (const f of figures) pose(f, time, camera, dt);
      return true;
    },
    dispose() {
      geometry.dispose();
      plane.dispose();
      shadowMaterial.dispose();
      mesh.skeleton.dispose();
    },
  };
}
