/* The made things on the grounds: gravel, brick edging, fences, the bench, the garden
   sign and the brick outbuilding. Each fills a shared mesh by material. */
import * as THREE from "three";
import type { Tier } from "../kit";
import { Mesher, tone, type RGB } from "./flora";
import { BENCH, DRIVE, OUTBUILDINGS, SHADE, SIGN, WALK, fences, gravel, hedges, edgings, type Box } from "./plan";
import type { ShadePainter } from "./surfaces";

const WHITE: RGB = [1, 1, 1];
const UPY = 0.014;

/** Flat gravel: the walk, the garden paths and the oval drive. Texture in metres. */
export function layGravel(m: Mesher) {
  const T = 1.7;
  const rect = ([x0, x1, z0, z1]: Box) => {
    const a = m.vertex(x0, UPY, z1, 0, 1, 0, x0 / T, z1 / T, WHITE),
      b = m.vertex(x1, UPY, z1, 0, 1, 0, x1 / T, z1 / T, WHITE),
      c = m.vertex(x1, UPY, z0, 0, 1, 0, x1 / T, z0 / T, WHITE),
      d = m.vertex(x0, UPY, z0, 0, 1, 0, x0 / T, z0 / T, WHITE);
    m.quad(a, b, c, d);
  };
  gravel.forEach(rect);
  const n = 72;
  let previous: [number, number] | null = null;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ox = DRIVE.cx + Math.sin(a) * DRIVE.rx,
      oz = DRIVE.cz + Math.cos(a) * DRIVE.rz,
      ix = DRIVE.cx + Math.sin(a) * DRIVE.irx,
      iz = DRIVE.cz + Math.cos(a) * DRIVE.irz;
    const o = m.vertex(ox, UPY, oz, 0, 1, 0, ox / T, oz / T, WHITE),
      inner = m.vertex(ix, UPY, iz, 0, 1, 0, ix / T, iz / T, WHITE);
    if (previous) m.quad(previous[0], o, inner, previous[1]);
    previous = [o, inner];
  }
}

/** A raised course of brick along a line of points. */
function course(m: Mesher, pts: [number, number][], width = 0.11, height = 0.05) {
  let run = 0;
  let previous: number[] | null = null;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    const [ax, az] = pts[Math.max(0, i - 1)],
      [bx, bz] = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, bz - az) || 1;
    const nx = (bz - az) / len,
      nz = -(bx - ax) / len;
    if (i) run += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    const u = run / 0.9;
    const hw = width / 2;
    const row = [
      m.vertex(x - nx * hw, 0, z - nz * hw, -nx, 0, -nz, u, 0, WHITE),
      m.vertex(x - nx * hw, height, z - nz * hw, 0, 1, 0, u, 0.06, WHITE),
      m.vertex(x + nx * hw, height, z + nz * hw, 0, 1, 0, u, 0.06 + width / 0.9, WHITE),
      m.vertex(x + nx * hw, 0, z + nz * hw, nx, 0, nz, u, 0.12 + width / 0.9, WHITE),
    ];
    if (previous) for (let k = 0; k < 3; k++) m.quad(previous[k], row[k], row[k + 1], previous[k + 1]);
    previous = row;
  }
}
export function layEdging(m: Mesher) {
  for (const side of [-1,1]) course(m,[[side*(WALK.half+.03),5.3],[side*(WALK.half+.03),WALK.z1-.2]]);
  for (const [rx, rz, open] of [
    [DRIVE.rx + 0.05, DRIVE.rz + 0.05, true],
    [DRIVE.irx - 0.05, DRIVE.irz - 0.05, false],
  ] as [number, number, boolean][]) {
    const n = 96;
    let line: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI;
      const x = DRIVE.cx + Math.sin(a) * rx,
        z = DRIVE.cz + Math.cos(a) * rz;
      // The outer course stops where the walk joins the drive.
      if (open && Math.abs(x) < WALK.half + 0.1 && z < DRIVE.cz) {
        if (line.length > 1) course(m, line);
        line = [];
        continue;
      }
      line.push([x, z]);
    }
    if (line.length > 1) course(m, line);
  }
}

/** White pickets on two rails between posts, or a close-boarded screen. */
export function raiseFences(m: Mesher, tier: Tier, shade: ShadePainter) {
  const white = tone("#e9e4d6"),
    grey = tone("#b9b4a6");
  const spacing = tier === "high" ? 0.135 : 0.2;
  for (const f of fences) {
    const dx = f.to[0] - f.from[0],
      dz = f.to[1] - f.from[1],
      len = Math.hypot(dx, dz),
      ux = dx / len,
      uz = dz / len,
      yaw = Math.atan2(ux, uz) - Math.PI / 2;
    const height = f.kind === "picket" ? 1.05 : 1.65;
    const posts = Math.max(1, Math.round(len / 2.4));
    for (let i = 0; i <= posts; i++) {
      const x = f.from[0] + (dx * i) / posts,
        z = f.from[1] + (dz * i) / posts;
      m.boxAt(x, (height + 0.12) / 2, z, 0.1, height + 0.12, 0.1, yaw, white);
    }
    for (const y of f.kind === "picket" ? [0.3, 0.82] : [0.35, 1.3])
      m.boxAt(f.from[0] + dx / 2 - uz * 0.035, y, f.from[1] + dz / 2 + ux * 0.035, len, 0.085, 0.04, yaw, white);
    const n = Math.floor(len / (f.kind === "picket" ? spacing : 0.155));
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n,
        x = f.from[0] + dx * k + uz * 0.015,
        z = f.from[1] + dz * k - ux * 0.015;
      if (f.kind === "board") {
        m.boxAt(x, height / 2 + 0.04, z, 0.148, height, 0.02, yaw, i % 3 ? white : grey);
        continue;
      }
      // A picket: a slat with a pointed head, drawn as front, back and edges.
      const w = 0.07,
        t = 0.02,
        h = height,
        c = Math.cos(yaw),
        s = Math.sin(yaw);
      const at = (lx: number, y: number, lz: number, nx: number, ny: number, nz: number) => m.vertex(x + lx * c + lz * s, y + 0.05, z - lx * s + lz * c, nx * c + nz * s, ny, -nx * s + nz * c, 0, 0, white);
      for (const side of [1, -1]) {
        const z0 = (side * t) / 2;
        const p = [at(-w / 2, 0, z0, 0, 0, side), at(w / 2, 0, z0, 0, 0, side), at(w / 2, h - 0.07, z0, 0, 0, side), at(0, h, z0, 0, 0, side), at(-w / 2, h - 0.07, z0, 0, 0, side)];
        if (side > 0) m.idx.push(p[0], p[1], p[2], p[0], p[2], p[4], p[4], p[2], p[3]);
        else m.idx.push(p[1], p[0], p[2], p[2], p[0], p[4], p[2], p[4], p[3]);
      }
      for (const side of [1, -1]) {
        const a = at((side * w) / 2, 0, t / 2, side, 0, 0),
          b = at((side * w) / 2, 0, -t / 2, side, 0, 0),
          cc = at((side * w) / 2, h - 0.07, -t / 2, side, 0, 0),
          d = at((side * w) / 2, h - 0.07, t / 2, side, 0, 0);
        if (side > 0) m.quad(a, b, cc, d);
        else m.quad(b, a, d, cc);
      }
    }
    const sx = SHADE.x * height,
      sz = SHADE.z * height;
    shade.shape([[f.from[0], f.from[1]], [f.to[0], f.to[1]], [f.to[0] + sx, f.to[1] + sz], [f.from[0] + sx, f.from[1] + sz]], f.kind === "picket" ? 0.34 : 0.8, 0.08);
  }
}

/** A slatted garden bench with iron ends. The seat is 0.41 m high. */
export function setBench(m: Mesher, shade: ShadePainter) {
  const { x, z, yaw } = BENCH;
  const green = tone("#2c3d31"),
    iron = tone("#1c1e1c");
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const at = (lx: number, lz: number): [number, number] => [x + lx * c + lz * s, z - lx * s + lz * c];
  for (const lz of [-0.13, 0.0, 0.13, 0.26]) {
    const [bx, bz] = at(0, lz);
    m.boxAt(bx, 0.395, bz, 1.62, 0.03, 0.105, yaw, green);
  }
  for (const [y, lz, pitch] of [[0.6, -0.215, -0.16], [0.76, -0.24, -0.16]] as const) {
    const [bx, bz] = at(0, lz);
    m.boxAt(bx, y, bz, 1.62, 0.11, 0.028, yaw, green, pitch);
  }
  for (const lx of [-0.76, 0.76]) {
    for (const lz of [-0.2, 0.28]) {
      const [bx, bz] = at(lx, lz);
      m.boxAt(bx, lz < 0 ? 0.42 : 0.3, bz, 0.045, lz < 0 ? 0.84 : 0.6, 0.045, yaw, iron);
    }
    const [ax, az] = at(lx, 0.04);
    m.boxAt(ax, 0.6, az, 0.05, 0.03, 0.54, yaw, iron);
    m.boxAt(ax, 0.37, az, 0.04, 0.03, 0.5, yaw, iron);
  }
  const far = at(-0.85, 0),
    near = at(0.85, 0);
  shade.shape([far, near, [near[0] + SHADE.x * 0.6, near[1] + SHADE.z * 0.6], [far[0] + SHADE.x * 0.6, far[1] + SHADE.z * 0.6]], 0.6, 0.1);
}

/** The interpretive sign: a sloped panel on two posts. Returns where its face goes. */
export function setSign(m: Mesher, shade: ShadePainter) {
  const { x, z, yaw } = SIGN;
  const post = tone("#3a342c"),
    frame = tone("#2c3d31");
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  for (const lx of [-0.3, 0.3]) m.boxAt(x + lx * c, 0.43, z - lx * s, 0.05, 0.86, 0.05, yaw, post);
  const tilt = -0.62;
  m.boxAt(x + Math.sin(yaw) * 0.02, 0.9, z + Math.cos(yaw) * 0.02, 0.78, 0.02, 0.5, yaw, frame, tilt + Math.PI / 2);
  shade.blob(x + SHADE.x * 0.5, z + SHADE.z * 0.5, 0.5, 0.5);
  const face = new THREE.PlaneGeometry(0.72, 0.44);
  const matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tilt + Math.PI / 2 - Math.PI / 2, yaw, 0, "YXZ"));
  face.applyMatrix4(matrix);
  const out = new THREE.Vector3(0, 0, 1).applyMatrix4(matrix);
  face.translate(x + Math.sin(yaw) * 0.02 + out.x * 0.013, 0.9 + out.y * 0.013, z + Math.cos(yaw) * 0.02 + out.z * 0.013);
  return face;
}

/** The brick outbuilding: four walls, a gable to the south, a shingle roof. Brick goes
    to one mesher and paint to another. */
export function raiseOutbuilding(brick: Mesher, plain: Mesher, shade: ShadePainter) {
  for (const o of OUTBUILDINGS) {
  const T = 0.9;
  const roof = tone("#4b4a47"),
    trim = tone("#e6e0d0"),
    glass = tone("#20262a"),
    door = tone("#3c4a3a");
  brick.box(o.x0, o.x1, 0, o.eave, o.z0, o.z1, WHITE, T, 0.8);
  const mid = (o.x0 + o.x1) / 2;
  for (const [z, n] of [[o.z1, 1], [o.z0, -1]] as const) {
    const a = brick.vertex(o.x0, o.eave, z, 0, 0, n, o.x0 / T, o.eave / T, WHITE),
      b = brick.vertex(o.x1, o.eave, z, 0, 0, n, o.x1 / T, o.eave / T, WHITE),
      c = brick.vertex(mid, o.ridge, z, 0, 0, n, mid / T, o.ridge / T, WHITE);
    if (n > 0) brick.idx.push(a, b, c);
    else brick.idx.push(b, a, c);
  }
  // Roof slopes with an overhang, as two thin slabs.
  const over = 0.32,
    run = mid - o.x0 + over,
    rise = o.ridge - o.eave,
    slope = Math.atan2(rise, mid - o.x0),
    length = Math.hypot(run, (rise * run) / (mid - o.x0));
  for (const s of [1, -1]) {
    const cx = mid - (s * run) / 2,
      cy = o.ridge - ((rise * run) / (mid - o.x0)) / 2 + 0.05;
    const start = plain.pos.length / 3;
    plain.box(-length / 2, length / 2, -0.04, 0.04, o.z0 - over, o.z1 + over, roof);
    const m = new THREE.Matrix4().makeRotationZ(s * slope).setPosition(cx, cy, 0);
    const v = new THREE.Vector3();
    for (let i = start; i < plain.pos.length / 3; i++) {
      v.set(plain.pos[i * 3], plain.pos[i * 3 + 1], plain.pos[i * 3 + 2]).applyMatrix4(m);
      plain.pos.splice(i * 3, 3, v.x, v.y, v.z);
      v.set(plain.nor[i * 3], plain.nor[i * 3 + 1], plain.nor[i * 3 + 2]).transformDirection(m);
      plain.nor.splice(i * 3, 3, v.x, v.y, v.z);
    }
  }
  // Each structure follows its own recorded elevation, rather than repeating a
  // generic cabin. Positions and unmeasured opening sizes remain approximate.
  const stone = tone("#99917f"), dark = tone("#3a3028");
  plain.box(o.x0-.04,o.x1+.04,0,.28,o.z0-.04,o.z1+.04,stone);
  const front = (side: "south" | "east" | "west", a0:number,a1:number,y0:number,y1:number,d0:number,d1:number,c:RGB) => {
    if (side === "south") plain.box(a0,a1,y0,y1,o.z1+d0,o.z1+d1,c);
    else if (side === "east") plain.box(o.x1+d0,o.x1+d1,y0,y1,a0,a1,c);
    else plain.box(o.x0-d1,o.x0-d0,y0,y1,a0,a1,c);
  };
  const opening = (side:"south"|"east"|"west",centre:number,sill:number,w:number,h:number,rows:number) => {
    front(side,centre-w/2-.07,centre+w/2+.07,sill-.06,sill+h+.08,.005,.06,trim);
    front(side,centre-w/2,centre+w/2,sill,sill+h,.061,.073,glass);
    for(let i=1;i<3;i++)front(side,centre-w/2+i*w/3-.012,centre-w/2+i*w/3+.012,sill,sill+h,.073,.083,trim);
    for(let i=1;i<rows*2;i++)front(side,centre-w/2,centre+w/2,sill+i*h/(rows*2)-.012,sill+i*h/(rows*2)+.012,.073,.083,trim);
    front(side,centre-w/2-.1,centre+w/2+.1,sill-.09,sill-.045,0,.13,stone);
  };
  const doorway = (side:"south"|"east"|"west",centre:number) => {
    front(side,centre-.57,centre+.57,.28,2.38,0,.055,trim);
    front(side,centre-.49,centre+.49,.28,2.30,.056,.069,door);
    // A planked door, with an iron strap and latch.
    for(let i=1;i<7;i++)front(side,centre-.49+i*.14,centre-.487+i*.14,.3,2.28,.069,.071,dark);
    for(const y of [.63,1.91])front(side,centre-.45,centre+.29,y,y+.035,.071,.076,dark);
  };
  const porch = (side:"south"|"west",centre:number,width:number,posts:number) => {
    const depth=1.5,top=2.62;
    front(side,centre-width/2,centre+width/2,.15,.3,.0,depth,stone);
    front(side,centre-width/2-.1,centre+width/2+.1,top,top+.10,-.06,depth+.15,roof);
    for(let i=0;i<posts;i++){
      const a=centre-width/2+.1+(width-.2)*i/(posts-1);
      front(side,a-.055,a+.055,.3,top,depth-.12,depth-.01,trim);
    }
    front(side,centre-.8,centre+.8,.0,.15,depth,depth+.32,stone);
  };
  if(o.name === "Smokehouse") {
    doorway("south",mid);
    // The small east ventilation opening and deep gable eaves are visible in TN-14-11.
    front("east",(o.z0+o.z1)/2-.35,(o.z0+o.z1)/2+.35,1.1,1.6,0,.025,dark);
    front("east",(o.z0+o.z1)/2-.4,(o.z0+o.z1)/2+.4,1.05,1.12,0,.08,stone);
  } else if(o.name === "Weaving House") {
    doorway("south",mid+.62);porch("south",mid+.25,3.5,2);
    opening("south",mid+.62,3.5,.8,1.15,2);
    opening("east",(o.z0+o.z1)/2,3.5,.8,1.15,2);
    brick.box(o.x0-.42,o.x0+.28,.28,o.ridge+.48,o.z0+1.0,o.z0+2.1,WHITE,T,.8);
    plain.box(o.x0-.47,o.x0+.33,o.ridge+.4,o.ridge+.54,o.z0+.95,o.z0+2.15,stone);
  } else {
    const centre=(o.z0+o.z1)/2;
    doorway("west",centre);
    opening("west",centre-1.82,.84,.96,1.50,3);
    opening("west",centre+1.82,.84,.96,1.50,3);
    porch("west",centre,(o.z1-o.z0)*.75,4);
  }
  const h = (o.eave + o.ridge) / 2,
    sx = SHADE.x * h,
    sz = SHADE.z * h;
  shade.shape([[o.x0, o.z1], [o.x1, o.z1], [o.x1 + sx, o.z1 + sz], [o.x1 + sx, o.z0 + sz], [o.x0 + sx, o.z0 + sz], [o.x0, o.z0]], 0.85, 0.3);
}

}

/** Shadows of the hedges and of the house itself. */
export function shadeHedges(shade: ShadePainter) {
  for (const h of [...hedges, ...edgings]) {
    const sx = SHADE.x * h.h,
      sz = SHADE.z * h.h;
    shade.shape([[h.x0, h.z1], [h.x1, h.z1], [h.x1 + sx, h.z1 + sz], [h.x1 + sx, h.z0 + sz], [h.x0 + sx, h.z0 + sz], [h.x0, h.z0]], 0.7, 0.07);
  }
  for (const [x0, x1, z0, z1, h] of [
    [-7.92, 7.92, -3.1, 3.1, 7.6],
    [-7.97, 1.65, -29, -3.1, 6.8],
  ]) {
    const sx = SHADE.x * h,
      sz = SHADE.z * h;
    shade.shape([[x0, z1], [x1, z1], [x1 + sx, z1 + sz], [x1 + sx, z0 + sz], [x0 + sx, z0 + sz], [x0, z0]], 0.85, 0.5);
  }
}
