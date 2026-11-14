/* Painted surfaces for the grounds: lawn, gravel, brick, bark, one atlas of leaves and
   garden plants, the sky and the far tree line. All seeded, all made on a canvas when
   the grounds are built (never at module load). */
import * as THREE from "three";
import { seeded } from "../kit";

type Ctx = CanvasRenderingContext2D;
function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d", { willReadFrequently: false })!] as const;
}
function tile(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
const rgb = (r: number, g: number, b: number, a = 1) =>
  "rgba(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + "," + a + ")";

/** Coarse random texels scaled up: soft variation at one scale. */
function mottle(ctx: Ctx, size: number, rand: () => number, cell: number, alpha: number, dark: string, light: string) {
  const n = Math.max(2, Math.round(size / cell));
  const [c, cctx] = canvas(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const v = rand();
      cctx.fillStyle = v < 0.5 ? dark : light;
      cctx.globalAlpha = Math.abs(v - 0.5) * 2 * alpha;
      cctx.fillRect(x, y, 1, 1);
    }
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(c, 0, 0, size, size);
}

/** Mown lawn: short blades over a mottled base. One tile is about three metres. */
export function lawnTexture(seed: number, size = 512) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = "#5b7436";
  ctx.fillRect(0, 0, size, size);
  mottle(ctx, size, rand, 90, 0.22, "#3f5a26", "#8a9a4c");
  mottle(ctx, size, rand, 22, 0.16, "#34501f", "#9aa85a");
  for (let i = 0; i < size * 26; i++) {
    const x = rand() * size,
      y = rand() * size,
      len = 3 + rand() * 6,
      lean = (rand() - 0.5) * 3;
    const tone = rand();
    ctx.strokeStyle =
      tone < 0.5
        ? rgb(50 + rand() * 30, 84 + rand() * 30, 30 + rand() * 16, 0.5)
        : tone < 0.9
          ? rgb(112 + rand() * 40, 140 + rand() * 30, 60 + rand() * 20, 0.45)
          : rgb(176 + rand() * 30, 160 + rand() * 24, 96, 0.4);
    ctx.lineWidth = 0.7 + rand() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + lean, y - len);
    ctx.stroke();
  }
  return tile(c);
}
/** Blurred noise in two channels, used to vary the lawn across tens of metres. */
export function macroTexture(seed: number) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = "#808000";
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalCompositeOperation = "lighter";
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < 90; i++) {
      const x = rand() * 256,
        y = rand() * 256,
        r = 14 + rand() * 46;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const hue = pass ? "0,90,0" : "90,0,0";
      g.addColorStop(0, "rgba(" + hue + ",.5)");
      g.addColorStop(1, "rgba(" + hue + ",0)");
      ctx.fillStyle = g;
      // Wrap so the tile repeats without a seam.
      for (const dx of [-256, 0, 256])
        for (const dy of [-256, 0, 256]) {
          ctx.setTransform(1, 0, 0, 1, dx, dy);
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
    }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  for (let i = 0; i < 70; i++) {
    const x = rand() * 256,
      y = rand() * 256,
      r = 10 + rand() * 40;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(60,60,0,.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return tile(c, false);
}
/** Crushed stone, warm and a little red as on the drive today. */
export function gravelTexture(seed: number, size = 512) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = "#a8927a";
  ctx.fillRect(0, 0, size, size);
  mottle(ctx, size, rand, 120, 0.14, "#86705c", "#c4b094");
  for (let i = 0; i < size * 34; i++) {
    const x = rand() * size,
      y = rand() * size,
      r = 0.5 + rand() * 1.5,
      v = rand();
    ctx.fillStyle =
      v < 0.3
        ? rgb(122 + rand() * 24, 98 + rand() * 20, 80 + rand() * 18, 0.6)
        : v < 0.82
          ? rgb(170 + rand() * 30, 150 + rand() * 26, 124 + rand() * 24, 0.65)
          : rgb(204 + rand() * 24, 192 + rand() * 24, 172 + rand() * 24, 0.65);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + rand() * 0.4), rand() * 3, 0, 7);
    ctx.fill();
  }
  return tile(c);
}
/** Hand-made red brick in running bond: 0.9 m square, four bricks by twelve courses. */
export function brickTexture(seed: number, size = 512) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = "#b9ab93";
  ctx.fillRect(0, 0, size, size);
  const rows = 12,
    bh = size / rows,
    bw = size / 4;
  for (let r = 0; r < rows; r++)
    for (let i = -1; i < 5; i++) {
      const x = i * bw + (r % 2 ? bw / 2 : 0);
      const v = rand();
      ctx.fillStyle = rgb(128 + v * 44, 62 + v * 24 + rand() * 10, 46 + v * 16);
      ctx.fillRect(x + 2.5, r * bh + 2.5, bw - 5, bh - 5);
      if (rand() < 0.14) {
        ctx.fillStyle = "rgba(60,36,30,.5)";
        ctx.fillRect(x + 2.5, r * bh + 2.5, bw - 5, bh - 5);
      }
    }
  mottle(ctx, size, rand, 60, 0.18, "#3a2018", "#e0c0a0");
  mottle(ctx, size, rand, 3, 0.14, "#2a1810", "#f0d8c0");
  return tile(c);
}
/** Neutral furrowed bark; the species colour comes from the vertices. */
export function barkTexture(seed: number, size = 256) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size * 2);
  ctx.fillStyle = "#b4ada2";
  ctx.fillRect(0, 0, size, size * 2);
  mottle(ctx, size, rand, 40, 0.3, "#6a625a", "#e8e0d4");
  for (let i = 0; i < 260; i++) {
    const x = rand() * size;
    let y = rand() * size * 2;
    const dark = rand() < 0.6;
    ctx.strokeStyle = dark ? "rgba(52,44,38," + (0.2 + rand() * 0.35) + ")" : "rgba(240,232,216," + (0.1 + rand() * 0.2) + ")";
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x;
    const n = 3 + Math.floor(rand() * 5);
    for (let k = 0; k < n; k++) {
      px += (rand() - 0.5) * 7;
      y += 12 + rand() * 26;
      ctx.lineTo(px, y);
    }
    ctx.stroke();
  }
  return tile(c);
}
/** Clipped box and yew: a solid wall of small leaves, 0.9 m to the tile. */
export function hedgeTexture(seed: number, size = 512) {
  const rand = seeded(seed);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = "#35502a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 16; i++) {
    const x = rand() * size,
      y = rand() * size,
      r = 2.2 + rand() * 3.2,
      v = rand();
    ctx.fillStyle =
      v < 0.3
        ? rgb(40 + rand() * 20, 70 + rand() * 24, 34 + rand() * 12, 0.9)
        : v < 0.86
          ? rgb(84 + rand() * 34, 124 + rand() * 30, 58 + rand() * 18, 0.9)
          : rgb(150 + rand() * 30, 178 + rand() * 30, 92 + rand() * 20, 0.85);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.55, rand() * 3.2, 0, 7);
    ctx.fill();
  }
  return tile(c);
}

// ── The plant atlas ─────────────────────────────────────────────────────────────
/** Cells of the 4 × 4 atlas, as [column, row] from the top left. Leaves of trees and
    hedges are painted in near-neutral greys so the vertex colour gives the species and
    the season; garden plants and fallen leaves carry their own colour. */
export const CELL = {
  broadA: [0, 0],
  broadB: [1, 0],
  magnolia: [2, 0],
  cedar: [3, 0],
  fine: [0, 1],
  palmate: [1, 1],
  grass: [2, 1],
  meadow: [3, 1],
  mum: [0, 2],
  aster: [1, 2],
  anemone: [2, 2],
  sedum: [3, 2],
  hosta: [0, 3],
  litter: [1, 3],
  cover: [2, 3],
  fern: [3, 3],
} as const;
export type Cell = keyof typeof CELL;

function leaf(ctx: Ctx, x: number, y: number, len: number, wide: number, angle: number, fill: string, rib: string | null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, -len / 2);
  ctx.quadraticCurveTo(wide, 0, 0, len / 2);
  ctx.quadraticCurveTo(-wide, 0, 0, -len / 2);
  ctx.fill();
  if (rib) {
    ctx.strokeStyle = rib;
    ctx.lineWidth = Math.max(0.6, len * 0.03);
    ctx.beginPath();
    ctx.moveTo(0, -len / 2);
    ctx.lineTo(0, len / 2);
    ctx.stroke();
  }
  ctx.restore();
}
const grey = (rand: () => number, lo: number, hi: number, warm = 0) => {
  const v = lo + rand() * (hi - lo);
  return rgb(v + warm, v, v - warm * 0.6);
};
function clump(ctx: Ctx, s: number, rand: () => number, count: number, len: [number, number], ratio: number, spread = 0.4) {
  // Dark leaves first, light ones on top, so the clump has depth.
  const items = Array.from({ length: count }, () => {
    const a = rand() * Math.PI * 2,
      d = Math.sqrt(rand()) * s * spread;
    return { x: s / 2 + Math.cos(a) * d * 1.05, y: s / 2 + Math.sin(a) * d, tone: rand(), a: rand() * Math.PI * 2, l: (len[0] + rand() * (len[1] - len[0])) * s };
  }).sort((p, q) => p.tone - q.tone);
  for (const it of items) {
    const v = 96 + it.tone * 150;
    const warm = (rand() - 0.4) * 14;
    leaf(ctx, it.x, it.y, it.l, it.l * ratio, it.a, rgb(v + warm, v, v - warm), rgb(v * 0.72, v * 0.74, v * 0.7, 0.7));
  }
}
function blades(ctx: Ctx, s: number, rand: () => number, count: number, tall: number, colour: () => string, heads = false) {
  for (let i = 0; i < count; i++) {
    const x0 = s / 2 + (rand() - 0.5) * s * 0.34,
      lean = (rand() - 0.5) * s * 0.62,
      h = s * tall * (0.5 + rand() * 0.5);
    ctx.strokeStyle = colour();
    ctx.lineWidth = s * (0.012 + rand() * 0.014);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, s);
    ctx.quadraticCurveTo(x0 + lean * 0.2, s - h * 0.6, x0 + lean, s - h);
    ctx.stroke();
    if (heads && rand() < 0.4) {
      ctx.fillStyle = rgb(196 + rand() * 30, 170 + rand() * 30, 110 + rand() * 30);
      ctx.beginPath();
      ctx.ellipse(x0 + lean, s - h, s * 0.012, s * 0.045, lean / s, 0, 7);
      ctx.fill();
    }
  }
}
function flowers(ctx: Ctx, s: number, rand: () => number, petals: string[], heart: string | null, size: number, count: number) {
  // Foliage from the base, then heads carried at the top.
  for (let i = 0; i < 34; i++) {
    const a = -Math.PI / 2 + (rand() - 0.5) * 1.5,
      d = s * (0.1 + rand() * 0.32);
    leaf(ctx, s / 2 + Math.cos(a) * d * 0.9, s * 0.96 + Math.sin(a) * d, s * (0.12 + rand() * 0.08), s * 0.035, a + Math.PI / 2 + (rand() - 0.5) * 0.6, rgb(44 + rand() * 34, 84 + rand() * 40, 36 + rand() * 20), null);
  }
  for (let i = 0; i < count; i++) {
    const x = s * (0.14 + rand() * 0.72),
      y = s * (0.1 + rand() * 0.5),
      r = s * size * (0.7 + rand() * 0.5);
    ctx.strokeStyle = rgb(52, 92, 40, 0.9);
    ctx.lineWidth = s * 0.008;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(s / 2 + (x - s / 2) * 0.5, s * 0.92);
    ctx.stroke();
    const col = petals[Math.floor(rand() * petals.length)];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + rand() * 0.3;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55, r * 0.26, a, 0, 7);
      ctx.fill();
    }
    if (heart) {
      ctx.fillStyle = heart;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.3, 0, 7);
      ctx.fill();
    }
  }
}
/** The atlas as raw pixels. Transparent texels are given the average colour of their
    cell so filtering and mip-maps do not put a dark fringe round every leaf. */
export function plantAtlas(seed: number, size: number) {
  const rand = seeded(seed);
  const s = size / 4;
  const [, ctx] = canvas(size, size);
  const cell = (name: Cell, draw: () => void) => {
    const [cx, cy] = CELL[name];
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx * s + 1, cy * s + 1, s - 2, s - 2);
    ctx.clip();
    ctx.translate(cx * s, cy * s);
    draw();
    ctx.restore();
  };
  cell("broadA", () => clump(ctx, s, rand, 130, [0.1, 0.16], 0.34, 0.44));
  cell("broadB", () => clump(ctx, s, rand, 96, [0.12, 0.19], 0.3, 0.43));
  cell("magnolia", () => {
    // Big leathery leaves; a few show the rust-brown felt of their undersides.
    const n = 30;
    const items = Array.from({ length: n }, () => ({ a: rand() * 7, d: Math.sqrt(rand()) * s * 0.36, tone: rand(), r: rand() * 7 })).sort((p, q) => p.tone - q.tone);
    for (const it of items) {
      const under = rand() < 0.16;
      const v = 104 + it.tone * 140;
      const l = s * (0.22 + rand() * 0.1);
      const x = s / 2 + Math.cos(it.a) * it.d,
        y = s / 2 + Math.sin(it.a) * it.d;
      leaf(ctx, x, y, l, l * 0.36, it.r, under ? rgb(v + 34, v - 4, v - 44) : rgb(v - 6, v, v - 8), rgb(v * 0.7, v * 0.72, v * 0.66, 0.8));
      if (!under) {
        // Gloss along one half of the blade.
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(it.r);
        ctx.fillStyle = "rgba(255,255,255,.2)";
        ctx.beginPath();
        ctx.ellipse(l * 0.06, 0, l * 0.05, l * 0.34, 0, 0, 7);
        ctx.fill();
        ctx.restore();
      }
    }
  });
  cell("cedar", () => {
    for (let i = 0; i < 46; i++) {
      const a = rand() * 7,
        d = Math.sqrt(rand()) * s * 0.3;
      let x = s / 2 + Math.cos(a) * d,
        y = s / 2 + Math.sin(a) * d;
      const dir = a + (rand() - 0.5) * 1.2;
      ctx.lineCap = "round";
      for (let k = 0; k < 7; k++) {
        const nx = x + Math.cos(dir) * s * 0.03,
          ny = y + Math.sin(dir) * s * 0.03;
        ctx.strokeStyle = grey(rand, 110, 236);
        ctx.lineWidth = s * 0.022;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        for (const side of [-1, 1]) {
          ctx.lineWidth = s * 0.014;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx + Math.cos(dir + side * 0.9) * s * 0.03, ny + Math.sin(dir + side * 0.9) * s * 0.03);
          ctx.stroke();
        }
        x = nx;
        y = ny;
      }
    }
  });
  cell("fine", () => clump(ctx, s, rand, 230, [0.045, 0.075], 0.42, 0.43));
  cell("palmate", () => {
    const items = Array.from({ length: 54 }, () => ({ a: rand() * 7, d: Math.sqrt(rand()) * s * 0.39, tone: rand() })).sort((p, q) => p.tone - q.tone);
    for (const it of items) {
      const x = s / 2 + Math.cos(it.a) * it.d,
        y = s / 2 + Math.sin(it.a) * it.d,
        r = s * (0.07 + rand() * 0.035),
        rot = rand() * 7;
      const v = 100 + it.tone * 146;
      ctx.fillStyle = rgb(v + 4, v, v - 6);
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = rot + (k / 10) * Math.PI * 2,
          rr = k % 2 ? r * 0.42 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.fill();
    }
  });
  cell("grass", () => blades(ctx, s, rand, 60, 0.92, () => rgb(70 + rand() * 60, 110 + rand() * 50, 44 + rand() * 30)));
  cell("meadow", () => blades(ctx, s, rand, 54, 0.98, () => (rand() < 0.45 ? rgb(170 + rand() * 40, 156 + rand() * 30, 90 + rand() * 30) : rgb(92 + rand() * 50, 122 + rand() * 40, 52 + rand() * 24)), true));
  cell("mum", () => flowers(ctx, s, rand, ["#e0a228", "#c8701e", "#f0c648", "#a84a1c"], "#7a4a12", 0.06, 16));
  cell("aster", () => flowers(ctx, s, rand, ["#7d68c8", "#9a84dc", "#6a58b4"], "#e8c040", 0.048, 20));
  cell("anemone", () => flowers(ctx, s, rand, ["#f6f1e6", "#f3e3e6", "#fffaf0"], "#c8b040", 0.055, 14));
  cell("sedum", () => flowers(ctx, s, rand, ["#b85a72", "#cc7088", "#9a4862"], null, 0.062, 13));
  cell("hosta", () => {
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (rand() - 0.5) * 2.5,
        d = s * (0.16 + rand() * 0.24),
        v = rand();
      leaf(ctx, s / 2 + Math.cos(a) * d, s * 0.9 + Math.sin(a) * d, s * (0.26 + rand() * 0.1), s * 0.085, a + Math.PI / 2, rgb(52 + v * 50, 96 + v * 50, 50 + v * 24), rgb(180, 200, 150, 0.35));
    }
  });
  cell("litter", () => {
    const tones = ["#c9962e", "#b9742a", "#a5522a", "#8a5a30", "#d6b040", "#7a4a2a", "#b8402c"];
    for (let i = 0; i < 24; i++)
      leaf(ctx, s * (0.08 + rand() * 0.84), s * (0.08 + rand() * 0.84), s * (0.06 + rand() * 0.035), s * 0.022, rand() * 7, tones[Math.floor(rand() * tones.length)], "rgba(60,30,10,.4)");
  });
  cell("cover", () => {
    for (let i = 0; i < 300; i++) {
      const a = rand() * 7,
        d = Math.sqrt(rand()) * s * 0.45,
        v = rand();
      leaf(ctx, s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, s * (0.05 + rand() * 0.03), s * 0.018, rand() * 7, rgb(34 + v * 50, 70 + v * 56, 34 + v * 24), null);
    }
  });
  cell("fern", () => {
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI / 2 + (rand() - 0.5) * 2.2,
        l = s * (0.5 + rand() * 0.34);
      for (let k = 2; k < 22; k++) {
        const t = k / 22,
          bend = a + (a + Math.PI / 2) * t * 0.6,
          x = s / 2 + Math.cos(bend) * l * t,
          y = s * 0.97 + Math.sin(bend) * l * t,
          w = s * 0.085 * (1 - t * 0.8);
        for (const side of [-1, 1])
          leaf(ctx, x + Math.cos(bend + (side * Math.PI) / 2) * w * 0.5, y + Math.sin(bend + (side * Math.PI) / 2) * w * 0.5, w, w * 0.2, bend + (side * Math.PI) / 2 + Math.PI / 2, rgb(60 + rand() * 40, 110 + rand() * 40, 50 + rand() * 20), null);
      }
    }
  });
  const image = ctx.getImageData(0, 0, size, size);
  const d = image.data;
  for (let cy = 0; cy < 4; cy++)
    for (let cx = 0; cx < 4; cx++) {
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      for (let y = cy * s; y < (cy + 1) * s; y += 2)
        for (let x = cx * s; x < (cx + 1) * s; x += 2) {
          const i = (y * size + x) * 4;
          if (d[i + 3] > 200) {
            r += d[i];
            g += d[i + 1];
            b += d[i + 2];
            n++;
          }
        }
      if (!n) continue;
      r /= n;
      g /= n;
      b /= n;
      for (let y = cy * s; y < (cy + 1) * s; y++)
        for (let x = cx * s; x < (cx + 1) * s; x++) {
          const i = (y * size + x) * 4,
            a = d[i + 3] / 255;
          if (a < 1) {
            // Un-blend the antialiased edge towards the cell's own colour.
            d[i] = d[i] * a + r * (1 - a);
            d[i + 1] = d[i + 1] * a + g * (1 - a);
            d[i + 2] = d[i + 2] * a + b * (1 - a);
          }
        }
    }
  const t = new THREE.DataTexture(new Uint8Array(d.buffer), size, size, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/** Late-afternoon sky for a dome: columns run round the horizon starting due north,
    rows from the zenith (top) to a little below the horizon. The sun stands in the
    south-south-west, about a third of the way up. */
export function skyTexture(seed: number, width: number) {
  const rand = seeded(seed);
  const w = width,
    h = width / 4;
  const [c, ctx] = canvas(w, h);
  const horizon = h * (0.5 / 0.56);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#4f82c0");
  g.addColorStop(0.36, "#7fa9d6");
  g.addColorStop(0.66, "#b4cde2");
  g.addColorStop(0.84, "#e6dfc8");
  g.addColorStop(horizon / h, "#f3dfb4");
  g.addColorStop(1, "#c9c6a4");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const sunU = 0.4287,
    sunY = horizon * (1 - 34 / 90);
  const wrapped = (draw: (dx: number) => void) => {
    for (const dx of [-w, 0, w]) draw(dx);
  };
  // Warmth spreading from the sun's quarter of the sky.
  wrapped((dx) => {
    const x = sunU * w + dx;
    const glow = ctx.createRadialGradient(x, sunY, 0, x, sunY, w * 0.2);
    glow.addColorStop(0, "rgba(255,244,214,.95)");
    glow.addColorStop(0.08, "rgba(255,236,196,.6)");
    glow.addColorStop(0.4, "rgba(255,226,180,.22)");
    glow.addColorStop(1, "rgba(255,226,180,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - w * 0.2, 0, w * 0.4, h);
  });
  // Fair-weather cloud: flat-bottomed heaps, smaller and closer-packed toward the horizon.
  const [cl, cctx] = canvas(w, h);
  cctx.filter = "blur(" + Math.max(2, w / 340) + "px)";
  for (let i = 0; i < 46; i++) {
    const t = Math.pow(rand(), 0.7);
    const y = horizon * (0.18 + t * 0.74),
      scale = 1.5 - t * 1.15,
      x = rand() * w,
      puffs = 5 + Math.floor(rand() * 8),
      span = w * 0.035 * scale * (0.7 + rand());
    const toward = 1 - Math.min(1, Math.abs(((x / w - sunU + 1.5) % 1) - 0.5) * 2.4);
    for (let k = 0; k < puffs; k++) {
      const px = x + (rand() - 0.5) * span * 2,
        r = w * 0.011 * scale * (0.6 + rand() * 0.9),
        py = y - rand() * r * 0.9;
      wrapped((dx) => {
        // Shaded base, then the lit crown.
        cctx.fillStyle = rgb(206 - toward * 10, 204, 208, 0.5);
        cctx.beginPath();
        cctx.ellipse(px + dx, py + r * 0.3, r * 1.3, r * 0.5, 0, 0, 7);
        cctx.fill();
        cctx.fillStyle = rgb(255, 250 - (1 - toward) * 6, 240 - (1 - toward) * 4, 0.82);
        cctx.beginPath();
        cctx.ellipse(px + dx, py, r * 1.15, r * 0.62, 0, 0, 7);
        cctx.fill();
      });
    }
  }
  // High thin streaks.
  cctx.filter = "blur(" + Math.max(3, w / 220) + "px)";
  for (let i = 0; i < 14; i++) {
    const x = rand() * w,
      y = horizon * (0.05 + rand() * 0.3),
      len = w * (0.03 + rand() * 0.05);
    wrapped((dx) => {
      cctx.fillStyle = "rgba(255,252,246,.2)";
      cctx.beginPath();
      cctx.ellipse(x + dx, y, len, h * 0.012, -0.08, 0, 7);
      cctx.fill();
    });
  }
  ctx.globalAlpha = 0.9;
  ctx.drawImage(cl, 0, 0);
  ctx.globalAlpha = 1;
  // Haze lying on the horizon.
  const haze = ctx.createLinearGradient(0, horizon - h * 0.16, 0, horizon + 2);
  haze.addColorStop(0, "rgba(240,226,190,0)");
  haze.addColorStop(1, "rgba(240,226,190,.75)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizon - h * 0.16, w, h * 0.16 + 2);
  ctx.fillStyle = "#b8bb96";
  ctx.fillRect(0, horizon + 2, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Far woods as a painted band: two rows of crowns, the upper half of the image for the
    farther, hazier row. Each crown is built from small dabs, lighter toward its top. */
export function treelineTexture(seed: number, width = 2048) {
  const rand = seeded(seed);
  const w = width,
    h = width / 4;
  const [c, ctx] = canvas(w, h);
  const row = (top: number, height: number, haze: number, crowns: number) => {
    const y0 = top + height;
    const hazed = (col: number[], light: number) => {
      const to = [188, 200, 196];
      return rgb(col[0] * light + (to[0] - col[0] * light) * haze, col[1] * light + (to[1] - col[1] * light) * haze, col[2] * light + (to[2] - col[2] * light) * haze);
    };
    for (let layer = 0; layer < 3; layer++) {
      const depth = layer / 2;
      for (let i = 0; i < crowns; i++) {
        const x = rand() * w,
          r = height * (0.1 + rand() * 0.1),
          cy = y0 - height * (0.3 + rand() * 0.34) * (1 - depth * 0.3);
        const kind = rand();
        const col = kind < 0.66 ? [74 + rand() * 26, 104 + rand() * 24, 58 + rand() * 16] : kind < 0.8 ? [150 + rand() * 24, 134 + rand() * 18, 66] : kind < 0.9 ? [156 + rand() * 20, 104 + rand() * 18, 62] : [48, 72, 56];
        const dabs = Array.from({ length: 46 }, () => {
          const a = rand() * 7,
            d = Math.sqrt(rand()) * r;
          return [Math.cos(a) * d * 1.1, Math.sin(a) * d * 0.9, r * (0.16 + rand() * 0.2), rand()];
        }).sort((p, q) => q[1] - p[1]);
        for (const dx of [-w, 0, w]) {
          if (x + dx < -r * 2 || x + dx > w + r * 2) continue;
          // The mass of the crown and the wood beneath it, then the leaves.
          ctx.fillStyle = hazed(col, 0.62);
          ctx.beginPath();
          ctx.ellipse(x + dx, cy, r * 1.05, r * 0.9, 0, 0, 7);
          ctx.fill();
          ctx.fillRect(x + dx - r * 0.8, cy, r * 1.6, y0 - cy);
          for (const [px, py, pr, v] of dabs) {
            const lift = 0.66 + 0.5 * (0.5 - py / (r * 1.8)) + (v - 0.5) * 0.24;
            ctx.fillStyle = hazed(col, lift);
            ctx.beginPath();
            ctx.ellipse(x + dx + px, cy + py, pr, pr * 0.75, 0, 0, 7);
            ctx.fill();
          }
        }
      }
    }
    // Shadow under the edge of the wood.
    const g = ctx.createLinearGradient(0, y0 - height * 0.24, 0, y0);
    g.addColorStop(0, "rgba(34,48,38,0)");
    g.addColorStop(1, "rgba(34,48,38," + (0.42 - haze * 0.3) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, y0 - height * 0.24, w, height * 0.24);
  };
  row(0, h / 2 - 2, 0.56, 150);
  row(h / 2 + 2, h / 2 - 2, 0.34, 120);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Collects every painted shadow on the ground into one texture: white is full shade.
    Tree crowns are stamped leaf-clump by leaf-clump, so their edges come out dappled. */
export class ShadePainter {
  readonly canvas: HTMLCanvasElement;
  private ctx: Ctx;
  private stamp: HTMLCanvasElement;
  readonly rect: { x0: number; z0: number; size: number };
  private k: number;
  constructor(readonly size: number, rect: { x0: number; z0: number; size: number }) {
    const [c, ctx] = canvas(size, size);
    this.canvas = c;
    this.ctx = ctx;
    this.rect = rect;
    this.k = size / rect.size;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    const [s, sctx] = canvas(64, 64);
    const g = sctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);
    this.stamp = s;
  }
  private px(x: number) {
    return (x - this.rect.x0) * this.k;
  }
  private pz(z: number) {
    return (z - this.rect.z0) * this.k;
  }
  /** A soft round shadow on the ground at (x, z). */
  blob(x: number, z: number, radius: number, strength: number) {
    const r = radius * this.k;
    const cx = this.px(x),
      cz = this.pz(z);
    if (cx < -r || cz < -r || cx > this.size + r || cz > this.size + r) return;
    this.ctx.globalAlpha = strength;
    this.ctx.drawImage(this.stamp, cx - r, cz - r, r * 2, r * 2);
    this.ctx.globalAlpha = 1;
  }
  /** The shadow of something upright standing at (x, z): a soft streak lying the way
      shadows fall, `length` long. */
  streak(x: number, z: number, length: number, width: number, strength: number, sx: number, sz: number) {
    const { ctx, k } = this;
    ctx.save();
    ctx.translate(this.px(x), this.pz(z));
    ctx.rotate(Math.atan2(sz, sx));
    ctx.globalAlpha = strength;
    ctx.drawImage(this.stamp, -length * 0.12 * k, (-width / 2) * k, length * 1.12 * k, width * k);
    ctx.drawImage(this.stamp, -0.3 * k, -0.3 * k, 0.6 * k, 0.6 * k);
    ctx.restore();
  }
  /** A filled outline, slightly softened: hedges, walls, fences, trunks. */
  shape(points: [number, number][], strength: number, blur = 0.12) {
    const { ctx } = this;
    ctx.save();
    ctx.filter = "blur(" + Math.max(0.5, blur * this.k) + "px)";
    ctx.fillStyle = "rgba(255,255,255," + strength + ")";
    ctx.beginPath();
    points.forEach(([x, z], i) => (i ? ctx.lineTo(this.px(x), this.pz(z)) : ctx.moveTo(this.px(x), this.pz(z))));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  /** Keep the border clear so clamped sampling beyond the map reads as open sun. */
  finish() {
    const { ctx, size } = this;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(this.canvas);
    t.flipY = false;
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = 4;
    return t;
  }
  /** Shade at a point, read from the finished canvas (0 open sun … 1 full shade). */
  field() {
    const n = 256;
    const [, ctx] = canvas(n, n);
    ctx.drawImage(this.canvas, 0, 0, n, n);
    const d = ctx.getImageData(0, 0, n, n).data;
    const { rect } = this;
    return (x: number, z: number) => {
      const u = Math.floor(((x - rect.x0) / rect.size) * n),
        v = Math.floor(((z - rect.z0) / rect.size) * n);
      if (u < 0 || v < 0 || u >= n || v >= n) return 0;
      return d[(v * n + u) * 4] / 255;
    };
  }
}

/** The long soft shadow a standing person throws: dense at the feet, fading out. */
export function personShadeTexture() {
  const [c, ctx] = canvas(64, 128);
  const g = ctx.createLinearGradient(0, 128, 0, 0);
  g.addColorStop(0, "rgba(255,255,255,.95)");
  g.addColorStop(0.5, "rgba(255,255,255,.6)");
  g.addColorStop(1, "rgba(255,255,255,.2)");
  ctx.fillStyle = g;
  ctx.filter = "blur(5px)";
  ctx.beginPath();
  ctx.ellipse(32, 64, 15, 52, 0, 0, 7);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** The face of the garden sign: a title band and lines of text too small to read. */
export function signTexture() {
  const [c, ctx] = canvas(256, 160);
  ctx.fillStyle = "#efe7d2";
  ctx.fillRect(0, 0, 256, 160);
  ctx.fillStyle = "#3e5238";
  ctx.fillRect(0, 0, 256, 34);
  ctx.fillStyle = "#f3ecd8";
  ctx.font = "600 17px Georgia, serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Travellers Rest · 1799", 12, 18);
  ctx.fillStyle = "#b9a98a";
  ctx.fillRect(14, 46, 88, 62);
  ctx.fillStyle = "#6b6252";
  for (let i = 0; i < 9; i++) ctx.fillRect(114, 48 + i * 11, 100 + ((i * 37) % 26), 3);
  for (let i = 0; i < 3; i++) ctx.fillRect(14, 120 + i * 11, 190 + ((i * 53) % 40), 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
