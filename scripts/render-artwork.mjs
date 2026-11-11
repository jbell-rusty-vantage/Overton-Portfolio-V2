// Renders book covers and architecture plates in the Library's engraved style.
// Usage: node scripts/render-artwork.mjs [content/artwork.json] [slug ...]
// Reads the spec, draws each piece in headless Chrome, and writes WebP files to public/library/artwork/.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const specPath = args[0]?.endsWith(".json") ? args.shift() : "content/artwork.json";
const only = args;
const spec = JSON.parse(await readFile(specPath, "utf8"));
const srcRoot = path.resolve("content/media-src");
const outDir = path.resolve("public/library/artwork");
await mkdir(outDir, { recursive: true });

const cloths = {
  green: "#1f4032",
  oxblood: "#74382a",
  navy: "#2a4056",
  ochre: "#75602e",
  plum: "#4a2f47",
  teal: "#1e4a4b",
  slate: "#2e3436",
  moss: "#3d4a26",
};
const GOLD = "#e3c98a";

// ---- Emblems: 400x400 line engravings. Each returns SVG markup drawn with the gilt stroke. ----
const P = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const f = (n) => n.toFixed(1);
const line = (a, b, w = 1.6) =>
  `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke-width="${w}"/>`;
const circle = (cx, cy, r, w = 1.6, fill = "none") =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" stroke-width="${w}" fill="${fill}"/>`;
const dot = (p, r = 4) => circle(p[0], p[1], r, 1.4, "CLOTH");
const ticks = (cx, cy, r1, r2, n, w = 1.2) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return line(P(cx, cy, r1, a), P(cx, cy, r2, a), w);
  }).join("");
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296), s / 4294967296);
}
const emblems = {
  // Mission control: orbits around a core, with stations on each orbit.
  orbits() {
    let s = circle(200, 200, 150) + ticks(200, 200, 150, 162, 48) + circle(200, 200, 22) + circle(200, 200, 9, 1.4, GOLD);
    [0, 60, 120].forEach((deg, i) => {
      s += `<ellipse cx="200" cy="200" rx="128" ry="52" stroke-width="1.5" fill="none" transform="rotate(${deg} 200 200)"/>`;
      const a = (deg * Math.PI) / 180;
      const t = 0.6 + i * 1.9;
      const x = 128 * Math.cos(t), y = 52 * Math.sin(t);
      s += dot([200 + x * Math.cos(a) - y * Math.sin(a), 200 + x * Math.sin(a) + y * Math.cos(a)], 6);
    });
    return s;
  },
  // Knowledge services: a connected lattice.
  lattice() {
    const r = rng(7);
    const pts = [[200, 200]];
    for (let i = 0; i < 6; i++) pts.push(P(200, 200, 70, (i / 6) * Math.PI * 2 + 0.3));
    for (let i = 0; i < 9; i++) pts.push(P(200, 200, 132 + r() * 8, (i / 9) * Math.PI * 2));
    let s = circle(200, 200, 158) + circle(200, 200, 164, 0.8);
    for (let i = 1; i <= 6; i++) {
      s += line(pts[0], pts[i]) + line(pts[i], pts[(i % 6) + 1]);
      s += line(pts[i], pts[7 + Math.round(((i - 1) * 9) / 6) % 9]) + line(pts[i], pts[7 + (Math.round(((i - 1) * 9) / 6) + 1) % 9]);
    }
    for (let i = 0; i < 9; i++) s += line(pts[7 + i], pts[7 + ((i + 1) % 9)], 1.2);
    return s + pts.map((p, i) => dot(p, i ? 5 : 8)).join("");
  },
  // Biotech: a double helix inside a ring.
  helix() {
    let a = "", b = "", rungs = "";
    for (let i = 0; i <= 80; i++) {
      const t = i / 80, y = 60 + t * 280, ph = t * Math.PI * 3.2;
      const x1 = 200 + 62 * Math.sin(ph), x2 = 200 - 62 * Math.sin(ph);
      a += (i ? "L" : "M") + f(x1) + " " + f(y);
      b += (i ? "L" : "M") + f(x2) + " " + f(y);
      if (i % 5 === 2 && Math.abs(Math.sin(ph)) > 0.25) rungs += line([x1, y], [x2, y], 1.1);
    }
    return circle(200, 200, 160) + ticks(200, 200, 160, 168, 36) + rungs +
      `<path d="${a}" stroke-width="2.2" fill="none"/><path d="${b}" stroke-width="2.2" fill="none"/>`;
  },
  // AI Engineer platform: a compass rose over rings (finding a route through a field).
  compass() {
    let s = circle(200, 200, 156) + circle(200, 200, 118, 1) + ticks(200, 200, 144, 156, 72, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2, long = i % 2 === 0 ? 138 : 84;
      const tip = P(200, 200, long, a), l = P(200, 200, 20, a - 0.6), r = P(200, 200, 20, a + 0.6);
      s += `<path d="M${f(l[0])} ${f(l[1])}L${f(tip[0])} ${f(tip[1])}L${f(r[0])} ${f(r[1])}" stroke-width="1.6" fill="none"/>` + line([200, 200], tip, 0.9);
    }
    return s + circle(200, 200, 20) + circle(200, 200, 6, 1.4, GOLD);
  },
  // World's Fair showcase: an observation wheel.
  wheel() {
    let s = circle(200, 190, 132) + circle(200, 190, 116, 1) + circle(200, 190, 14);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      s += line(P(200, 190, 14, a), P(200, 190, 132, a), 1.1);
      const c = P(200, 190, 146, a);
      s += `<rect x="${f(c[0] - 8)}" y="${f(c[1] - 7)}" width="16" height="14" rx="3" stroke-width="1.4" fill="CLOTH"/>`;
    }
    return s + line([200, 190], [140, 372], 2) + line([200, 190], [260, 372], 2) + line([112, 372], [288, 372], 2);
  },
  // Agentic SDLC: a segmented cycle with a checkpoint on each stage.
  cycle() {
    let s = circle(200, 200, 60, 1) + circle(200, 200, 6, 1.4, GOLD);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.09, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - 0.09;
      const p0 = P(200, 200, 138, a0), p1 = P(200, 200, 138, a1);
      s += `<path d="M${f(p0[0])} ${f(p0[1])}A138 138 0 0 1 ${f(p1[0])} ${f(p1[1])}" stroke-width="2.4" fill="none"/>`;
      const h1 = P(200, 200, 126, a1 - 0.1), h2 = P(200, 200, 151, a1 - 0.1);
      s += line(h1, p1, 2.2) + line(h2, p1, 2.2);
      s += dot(P(200, 200, 100, (a0 + a1) / 2), 6) + line(P(200, 200, 60, (a0 + a1) / 2), P(200, 200, 94, (a0 + a1) / 2), 1);
    }
    return s + circle(200, 200, 164, 0.8);
  },
  // Moving company: a route between two places over a survey grid.
  route() {
    let s = circle(200, 200, 160);
    for (let i = -3; i <= 3; i++) {
      const o = i * 40, h = Math.sqrt(160 * 160 - o * o);
      s += line([200 + o, 200 - h], [200 + o, 200 + h], 0.6) + line([200 - h, 200 + o], [200 + h, 200 + o], 0.6);
    }
    const a = [104, 268], b = [300, 128];
    s += `<path d="M${a[0]} ${a[1]}C150 150 240 250 ${b[0]} ${b[1]}" stroke-width="2.6" fill="none" stroke-dasharray="2 9" stroke-linecap="round"/>`;
    for (const [p, big] of [[a, false], [b, true]]) {
      const r = big ? 17 : 13;
      s += `<path d="M${p[0]} ${p[1]}c-${r} -${r * 1.5} -${r} -${r * 2.6} 0 -${r * 2.6}c${r} 0 ${r} ${r * 1.1} 0 ${r * 2.6}z" stroke-width="2" fill="CLOTH"/>` + circle(p[0], p[1] - r * 1.75, r * 0.34, 1.4, GOLD);
    }
    return s;
  },
  // Lead analytics: a funnel resolving into measured bars.
  funnel() {
    let s = circle(200, 200, 160) + ticks(200, 200, 160, 167, 60, 1);
    [[92, 330, 96], [118, 304, 136], [146, 276, 176], [172, 250, 216]].forEach(([x1, x2, y], i) => {
      s += line([x1, y], [x2, y], 2.2) + (i < 3 ? line([x1, y], [x1 + 26, y + 40], 1.2) + line([x2, y], [x2 - 26, y + 40], 1.2) : "");
    });
    s += line([211, 216], [211, 252], 1.2);
    [28, 46, 36, 62, 52].forEach((h, i) => {
      s += `<rect x="${130 + i * 30}" y="${312 - h}" width="18" height="${h}" stroke-width="1.5" fill="none"/>`;
    });
    return s + line([118, 312], [292, 312], 1.6);
  },
  // GoWipe: a droplet over ripples.
  droplet() {
    let s = circle(200, 200, 160);
    s += `<path d="M200 70C244 138 270 176 270 214a70 70 0 0 1 -140 0C130 176 156 138 200 70z" stroke-width="2.4" fill="none"/>`;
    s += `<path d="M168 214a34 34 0 0 0 30 34" stroke-width="1.6" fill="none"/>`;
    [0, 1, 2].forEach((i) => {
      s += `<path d="M${96 + i * 14} ${304 + i * 16}q26 -14 52 0t52 0t52 0t${52 - i * 28 > 0 ? 52 - i * 28 : 10} 0" stroke-width="1.4" fill="none"/>`;
    });
    return s;
  },
  // Daryl Davis: a stage microphone with sound carrying outward.
  microphone() {
    let s = circle(200, 200, 160);
    s += `<rect x="172" y="84" width="56" height="112" rx="28" stroke-width="2.4" fill="none"/>`;
    [112, 134, 156, 178].forEach((y) => (s += line([176, y], [224, y], 1)));
    s += `<path d="M148 168v14a52 52 0 0 0 104 0v-14" stroke-width="2.2" fill="none"/>` + line([200, 234], [200, 290], 2.2) + line([158, 290], [242, 290], 2.2);
    [[60, 0.55], [84, 0.5], [108, 0.45]].forEach(([r, span]) => {
      for (const dir of [0, Math.PI]) {
        const a0 = dir - span, a1 = dir + span, p0 = P(200, 150, r + 44, a0), p1 = P(200, 150, r + 44, a1);
        s += `<path d="M${f(p0[0])} ${f(p0[1])}A${r + 44} ${r + 44} 0 0 1 ${f(p1[0])} ${f(p1[1])}" stroke-width="1.3" fill="none"/>`;
      }
    });
    return s;
  },
  // Digital services studio: drafting dividers over a measured square.
  dividers() {
    let s = circle(200, 200, 160) + `<rect x="112" y="150" width="176" height="150" stroke-width="1.4" fill="none"/>`;
    for (let i = 1; i < 8; i++) s += line([112 + i * 22, 300], [112 + i * 22, i % 2 ? 290 : 284], 1);
    s += line([200, 66], [132, 300], 2.4) + line([200, 66], [268, 300], 2.4) + circle(200, 66, 9, 2, "CLOTH");
    s += `<path d="M162 196A64 64 0 0 0 238 196" stroke-width="1.4" fill="none"/>` + `<path d="M132 300A120 120 0 0 1 268 300" stroke-width="1.2" fill="none" stroke-dasharray="4 6"/>`;
    return s;
  },
  // The Library: an arched window over shelved volumes.
  arch() {
    let s = `<path d="M96 330V176a104 104 0 0 1 208 0V330z" stroke-width="2.4" fill="none"/>` +
      `<path d="M114 330V178a86 86 0 0 1 172 0V330" stroke-width="1" fill="none"/>`;
    for (let i = 1; i < 6; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      s += line([200, 178], P(200, 178, 86, a), 1);
    }
    s += line([114, 178], [286, 178], 1.4);
    [226, 278].forEach((y) => {
      s += line([114, y + 48], [286, y + 48], 1.6);
      const r = rng(y);
      let x = 122;
      while (x < 274) {
        const w = 9 + Math.floor(r() * 9), h = 26 + Math.floor(r() * 18);
        if (x + w > 280) break;
        s += `<rect x="${x}" y="${y + 48 - h}" width="${w}" height="${h}" stroke-width="1.2" fill="none"/>`;
        x += w + 2;
      }
    });
    return s;
  },
  // Markets research: candles under a trend.
  candles() {
    let s = circle(200, 200, 160);
    const r = rng(11);
    let y = 250;
    const pts = [];
    for (let i = 0; i < 9; i++) {
      const x = 96 + i * 26, d = (r() - 0.38) * 46, top = Math.min(y, y - d), h = Math.abs(d) + 6;
      s += line([x, top - 12], [x, top + h + 12], 1.1) + `<rect x="${x - 7}" y="${f(top)}" width="14" height="${f(h)}" stroke-width="1.5" fill="${d > 0 ? "CLOTH" : GOLD}"/>`;
      y -= d;
      pts.push([x, y - 34]);
    }
    return s + `<path d="${pts.map((p, i) => (i ? "L" : "M") + f(p[0]) + " " + f(p[1])).join("")}" stroke-width="1.6" fill="none" stroke-dasharray="3 5"/>`;
  },
  // Ephemeris / astronomy work: a wheel of twelve houses.
  zodiac() {
    let s = circle(200, 200, 160) + circle(200, 200, 126) + circle(200, 200, 58, 1) + ticks(200, 200, 126, 160, 12, 1.4) + ticks(200, 200, 150, 160, 72, 0.9);
    const r = rng(5);
    const pts = Array.from({ length: 7 }, () => P(200, 200, 40 + r() * 70, r() * Math.PI * 2));
    pts.forEach((p, i) => (s += dot(p, 4) + (i ? line(pts[i - 1], p, 0.8) : "")));
    return s;
  },
  // Staged research missions: a dependency graph released level by level.
  dag() {
    let s = circle(200, 200, 160);
    const levels = [[[200, 84]], [[130, 156], [270, 156]], [[96, 236], [200, 236], [304, 236]], [[200, 316]]];
    const link = (p, q) => line([p[0], p[1] + 13], [q[0], q[1] - 13], 1.3);
    s += link(levels[0][0], levels[1][0]) + link(levels[0][0], levels[1][1]);
    s += link(levels[1][0], levels[2][0]) + link(levels[1][0], levels[2][1]) + link(levels[1][1], levels[2][1]) + link(levels[1][1], levels[2][2]);
    levels[2].forEach((p) => (s += link(p, levels[3][0])));
    levels.flat().forEach((p, i) => (s += `<rect x="${p[0] - 22}" y="${p[1] - 13}" width="44" height="26" rx="5" stroke-width="${i === 0 || i === 6 ? 2.4 : 1.6}" fill="CLOTH"/>`));
    return s;
  },
  // Podcast archive ingestion: a mast broadcasting into ordered records.
  broadcast() {
    let s = circle(200, 200, 160) + line([200, 120], [168, 300], 2) + line([200, 120], [232, 300], 2) + circle(200, 112, 9, 2, GOLD);
    [150, 190, 230, 268].forEach((y, i) => (s += line([200 - 8 - i * 7.2, y], [200 + 8 + i * 7.2, y], 1.2)));
    [34, 58, 82].forEach((r) => {
      for (const side of [0, Math.PI]) {
        const p0 = P(200, 112, r, side - 0.75), p1 = P(200, 112, r, side + 0.75);
        s += `<path d="M${f(p0[0])} ${f(p0[1])}A${r} ${r} 0 0 1 ${f(p1[0])} ${f(p1[1])}" stroke-width="1.5" fill="none"/>`;
      }
    });
    return s + line([140, 300], [260, 300], 2);
  },
  // Trend research: rising series over a baseline grid.
  trend() {
    let s = circle(200, 200, 160);
    for (let i = 0; i < 5; i++) s += line([92, 120 + i * 42], [308, 120 + i * 42], 0.6);
    const mk = (seed, lift) => {
      const r = rng(seed);
      let y = 280;
      return Array.from({ length: 10 }, (_, i) => ((y -= r() * lift - lift * 0.22), [96 + i * 23, y]));
    };
    [[3, 30, 2.4], [9, 18, 1.3]].forEach(([seed, lift, w]) => {
      const pts = mk(seed, lift);
      s += `<path d="${pts.map((p, i) => (i ? "L" : "M") + f(p[0]) + " " + f(p[1])).join("")}" stroke-width="${w}" fill="none"/>` + dot(pts.at(-1), 5);
    });
    return s;
  },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const noise = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;mix-blend-mode:overlay;opacity:.55"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;

function coverHtml(c) {
  const cloth = cloths[c.cloth] ?? c.cloth;
  if (!emblems[c.emblem]) throw Error("Unknown emblem " + c.emblem);
  const art = emblems[c.emblem]().replaceAll("CLOTH", cloth);
  const corner = (t) => `<svg viewBox="0 0 60 60" style="position:absolute;width:60px;height:60px;${t}"><path d="M2 58V20H20V2H58" fill="none" stroke="${GOLD}" stroke-width="2"/></svg>`;
  const size = c.title.length > 22 ? 62 : c.title.length > 15 ? 74 : 88;
  return `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}body{width:960px;height:1200px;position:relative;background:${cloth};overflow:hidden;color:${GOLD};font-family:"Palatino Linotype","Book Antiqua",Georgia,serif}
  .shade{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,rgba(255,255,255,.07),rgba(0,0,0,.26) 100%)}
  .f1{position:absolute;inset:44px;border:2px solid ${GOLD};opacity:.9}.f2{position:absolute;inset:56px;border:1px solid ${GOLD};opacity:.75}
  .rule{position:absolute;left:50%;transform:translateX(-50%);width:210px;height:1px;background:${GOLD};opacity:.8}
  .rule:after{content:"";position:absolute;left:50%;top:-5px;width:10px;height:10px;background:${GOLD};transform:translateX(-50%) rotate(45deg)}
  .kicker{position:absolute;top:150px;width:100%;text-align:center;font:500 19px/1 "Cascadia Mono",Consolas,monospace;letter-spacing:.42em;text-transform:uppercase;opacity:.86;text-indent:.42em}
  .art{position:absolute;left:50%;top:216px;width:520px;height:520px;transform:translateX(-50%)}
  h1{position:absolute;top:790px;left:110px;right:110px;margin:0;text-align:center;font-weight:400;font-size:${size}px;line-height:1.06;letter-spacing:.01em;text-shadow:0 1px 0 rgba(0,0,0,.35)}
  p{position:absolute;bottom:128px;left:150px;right:150px;margin:0;text-align:center;font-style:italic;font-size:27px;line-height:1.3;opacity:.9}
  </style><div class="shade"></div>${noise}<div class="f1"></div><div class="f2"></div>
  ${corner("left:70px;top:70px")}${corner("right:70px;top:70px;transform:scaleX(-1)")}${corner("left:70px;bottom:70px;transform:scaleY(-1)")}${corner("right:70px;bottom:70px;transform:scale(-1)")}
  <div class="rule" style="top:122px"></div><div class="kicker">${esc(c.kicker ?? "")}</div>
  <svg class="art" viewBox="0 0 400 400" fill="none" stroke="${GOLD}" stroke-linecap="round" stroke-linejoin="round">${art}</svg>
  <h1>${esc(c.title)}</h1><p>${esc(c.subtitle ?? "")}</p><div class="rule" style="bottom:98px"></div>`;
}

// Architecture plate: columns of components read left to right, like an engraved figure in a reference book.
function diagramHtml(d) {
  const cols = d.columns
    .map(
      (col, i) => `<section><h3><i>${String(i + 1).padStart(2, "0")}</i>${esc(col.label)}</h3>${col.nodes
        .map((n) => `<div class="node${n.accent ? " accent" : ""}"><b>${esc(n.name)}</b>${n.note ? `<span>${esc(n.note)}</span>` : ""}</div>`)
        .join("")}</section>${i < d.columns.length - 1 ? '<div class="arrow"><svg viewBox="0 0 40 24"><path d="M0 12H34M24 3l11 9-11 9" fill="none" stroke="#8a6f35" stroke-width="2"/></svg></div>' : ""}`,
    )
    .join("");
  return `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}body{width:1600px;box-sizing:border-box;padding:54px 60px 46px;background:#f5f1e7;color:#242e26;font-family:"Segoe UI",Arial,sans-serif;position:relative;overflow:hidden;display:flex;flex-direction:column}
  body:before{content:"";position:absolute;inset:18px;border:1px solid #cdbf9a;pointer-events:none}
  header{display:flex;align-items:baseline;gap:22px;border-bottom:1px solid #cdbf9a;padding-bottom:18px;margin-bottom:26px}
  header small{font:600 13px/1 "Cascadia Mono",Consolas,monospace;letter-spacing:.3em;text-transform:uppercase;color:#8a6f35}
  h1{margin:0;font:400 44px/1.1 "Palatino Linotype","Book Antiqua",Georgia,serif}
  header em{margin-left:auto;font:italic 20px/1.2 "Palatino Linotype",Georgia,serif;color:#595e52;max-width:560px;text-align:right}
  main{display:flex;align-items:flex-start;gap:0}
  section{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px}
  h3{margin:0 0 6px;font:600 13px/1.3 "Cascadia Mono",Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#3a4a3d;min-height:34px}
  h3 i{font-style:normal;color:#b08d45;margin-right:10px}
  .node{background:#fffdf6;border:1px solid #bdb394;border-left:4px solid #2f4a39;padding:13px 15px 14px;border-radius:2px;box-shadow:0 1px 0 rgba(36,46,38,.08)}
  .node.accent{background:#243a2d;border-color:#243a2d;border-left-color:#cead72;color:#f5f1e7}
  .node b{display:block;font:600 19px/1.22 "Palatino Linotype","Book Antiqua",Georgia,serif}
  .node span{display:block;margin-top:5px;font-size:14.5px;line-height:1.35;color:#595e52}
  .node.accent span{color:#d9d3bf}
  .arrow{width:52px;flex:none;display:flex;justify-content:center;padding-top:74px}.arrow svg{width:36px}
  footer{margin-top:34px;padding-top:14px;border-top:1px solid #cdbf9a;display:flex;justify-content:space-between;font:13px/1.4 "Cascadia Mono",Consolas,monospace;color:#595e52}
  </style><header><small>Plate · Architecture</small><h1>${esc(d.title)}</h1><em>${esc(d.caption ?? "")}</em></header><main>${cols}</main>
  <footer><span>${esc(d.footer ?? "")}</span><span>The Library · John Overton Bell</span></footer>`;
}

const browser = await chromium.launch({ channel: "chrome" });
async function render(html, width, height, slug, name, outWidth, fit = false) {
  const dir = path.join(srcRoot, slug);
  await mkdir(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html);
  if (fit) {
    // Plates take the height of their content.
    const h = await page.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height));
    await page.setViewportSize({ width, height: h });
  } else {
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (overflow > 2) console.warn("OVERFLOW", slug, name, overflow + "px");
  }
  const png = path.join(dir, name + ".png");
  await page.screenshot({ path: png });
  await ctx.close();
  const out = path.join(outDir, `${slug}-${name}.webp`);
  execFileSync("magick", [png, "-resize", String(outWidth), "-quality", "86", out]);
  console.log("wrote", path.relative(process.cwd(), out));
}
for (const c of spec.covers ?? []) {
  if (only.length && !only.includes(c.slug)) continue;
  await render(coverHtml(c), 960, 1200, c.slug, "cover", 960);
}
for (const d of spec.diagrams ?? []) {
  if (only.length && !only.includes(d.slug)) continue;
  await render(diagramHtml(d), 1600, 700, d.slug, d.name ?? "architecture", 1600, true);
}
await browser.close();
