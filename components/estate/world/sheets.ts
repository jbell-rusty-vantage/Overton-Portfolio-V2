/* One page of an opened volume. A page is described once, as a list of typeset pieces,
   and everything that shows it derives from that description: `sheetHtml` writes the
   markup that is both measured during pagination and shown as the readable DOM page,
   and the paper texture on a turning leaf is drawn from print instructions read back
   from that same laid-out markup (see bookPrint.ts). There is no second layout to
   drift out of step. */

export type Piece = { leaf: string } & (
  | { kind: "chapter"; text: string }
  | { kind: "heading"; text: string }
  /** `lead` is the length of a run-in term ("Capture. …") set in italics; `cont` marks
      the rest of a paragraph that began on the page before. */
  | { kind: "text"; text: string; item?: boolean; lead?: number; cont?: boolean }
  | { kind: "metrics"; items: { value: string; label: string }[] }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; url: string }
  | {
      kind: "figure";
      media: "image" | "video";
      url: string;
      poster?: string;
      text: string;
      /** Size on the page in page pixels, already at the picture's own proportions. */
      width: number;
      height: number;
      floated?: boolean;
      /** Its shape could not be learned in time: shown whole inside a usual frame. */
      loose?: boolean;
      ownPage?: boolean;
      captions?: string;
      transcript?: string;
      detail?: string;
    }
);
export type Front = {
  title: string;
  summary: string;
  tags: string[];
  cover?: string;
  /** Plate size on the page, from the cover's own proportions. */
  plate?: { width: number; height: number };
  client?: string;
  author: string;
  series: string;
  /** The ordinary reading page for the same volume. */
  detail?: string;
  /** How closely the title page is set: 0 as designed, 2 at its smallest. */
  tight?: 0 | 1 | 2;
};
export type Sheet = {
  /** Stable leaf key of the section at the top of the page. */
  leaf: string;
  leafTitle: string;
  /** 1-based position among the pages that leaf runs across. */
  part: number;
  parts: number;
  /** Folio number across the whole volume. */
  folio: number;
  side: "left" | "right";
  kind: "plate" | "title" | "contents" | "flow" | "end";
  pieces: Piece[];
  /** Every leaf with something on this page, in reading order. */
  leaves: string[];
  front?: Front;
  contents?: { key: string; title: string; folio: number }[];
  /** How to print this page on paper; filled in once the page has been laid out. */
  ops: Op[];
};
export type Op =
  | { t: "text"; x: number; y: number; text: string; font: string; color: string; ls?: number }
  | { t: "rect"; x: number; y: number; w: number; h: number; color: string }
  | { t: "image"; x: number; y: number; w: number; h: number; url: string; video?: boolean };
export type PageMetrics = {
  width: number;
  height: number;
  top: number;
  side: number;
  bottom: number;
  body: number;
  line: number;
};
export const desktopPage: PageMetrics = {
  width: 440,
  height: 627,
  top: 52,
  side: 40,
  bottom: 48,
  body: 18,
  line: 1.52,
};
export const phonePage: PageMetrics = {
  width: 340,
  height: 484,
  top: 40,
  side: 26,
  bottom: 36,
  body: 17,
  line: 1.5,
};
export const serif =
  '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
export const mono = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

const entities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => entities[c]);
/** Only ordinary web, mail and in-site addresses are ever written into a page. */
export const safeUrl = (url: string | undefined) =>
  url && /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url.trim()) ? url.trim() : null;

/** A figure that reads as a number is set large in a grid; a phrase is set as a row. */
export const isFigure = (value: string) =>
  value.length <= 9 && /^[~≈<>+\-$€£]?\d[\d.,:/×x]*\s?[%+kKmMbB×x]?[a-zA-Z]{0,3}$/.test(value.trim());

export type Markup = {
  /** Measuring and printing use sized stand-ins for pictures; nothing is fetched. */
  measure?: boolean;
  slug: string;
  volumeTitle: string;
  /** Rewrites in-site addresses (the office preview keeps the visitor inside it). */
  href: (url: string) => string;
  report?: boolean;
};

function media(p: Extract<Piece, { kind: "figure" }>, m: Markup) {
  const size = "width:" + p.width + "px;height:" + p.height + "px" + (p.loose ? ";object-fit:contain" : "");
  const picture = safeUrl(p.media === "image" ? p.url : p.poster);
  if (m.measure)
    return (
      '<span class="wb-media" style="' +
      size +
      '" data-media="' +
      esc(picture ?? "") +
      '"' +
      (p.media === "video" ? ' data-video="1"' : "") +
      "></span>"
    );
  const url = safeUrl(p.url);
  if (!url) return '<span class="wb-media" style="' + size + '"></span>';
  if (p.media === "video")
    return (
      '<video class="wb-media" style="' +
      size +
      '" src="' +
      esc(url) +
      '"' +
      (picture ? ' poster="' + esc(picture) + '"' : "") +
      // No browser controls until the visitor starts the film: they would cover the
      // lower third of the preview. The play mark is drawn by the figure.
      ' muted playsinline preload="' +
      (picture ? "none" : "metadata") +
      '" aria-label="' +
      esc(p.text) +
      '">' + (safeUrl(p.captions) ? '<track kind="captions" label="English" srclang="en" default src="' + esc(safeUrl(p.captions)!) + '">' : '') + '</video>'
    );
  return (
    '<img class="wb-media" style="' +
    size +
    '" src="' +
    esc(url) +
    '" alt="' +
    esc(p.text) +
    '" width="' +
    Math.round(p.width) +
    '" height="' +
    Math.round(p.height) +
    '" decoding="async" draggable="false" data-zoom data-zoom-url="' + esc(safeUrl(p.detail) ?? url) + '" tabindex="0" role="button" aria-label="Enlarge: ' +
    esc(p.text || "picture") +
    '">'
  );
}

/** Markup for a run of pieces. Consecutive list lines share one list. */
export function flowHtml(pieces: Piece[], m: Markup, textWidth: number): string {
  let out = "";
  for (const p of pieces) {
    if (p.kind === "chapter")
      out +=
        '<h2 class="wb-chapter" data-leaf="' + esc(p.leaf) + '">' + esc(p.text) + '</h2><i class="wb-rule"></i>';
    else if (p.kind === "heading") out += '<h3 class="wb-h">' + esc(p.text) + "</h3>";
    else if (p.kind === "text") {
      const lead = p.lead ?? 0;
      out +=
        '<p class="' +
        (p.item ? "wb-item" : "wb-p") +
        (p.cont ? " wb-cont" : "") +
        '">' +
        (lead ? '<em class="wb-lead">' + esc(p.text.slice(0, lead)) + "</em>" : "") +
        esc(p.text.slice(lead)) +
        "</p>";
    } else if (p.kind === "metrics") {
      out += '<dl class="wb-metrics">';
      for (const it of p.items)
        out += isFigure(it.value)
          ? '<div class="wb-metric"><dd>' + esc(it.value) + "</dd><dt>" + esc(it.label) + "</dt></div>"
          : '<div class="wb-fact"><dt>' + esc(it.label) + "</dt><dd>" + esc(it.value) + "</dd></div>";
      out += "</dl>";
    } else if (p.kind === "code") out += '<pre class="wb-code">' + esc(p.text) + "</pre>";
    else if (p.kind === "link") {
      const url = safeUrl(p.url);
      const inside = url?.startsWith("/");
      out += url
        ? '<p class="wb-link"><a href="' +
          esc(inside ? m.href(url) : url) +
          '"' +
          (inside ? "" : ' target="_blank" rel="noreferrer"') +
          ">" +
          esc(p.text) +
          '<span class="wb-arrow"> ↗</span></a></p>'
        : '<p class="wb-p">' + esc(p.text) + "</p>";
    } else {
      // Centred on the text block; a wide plate may reach a little into the margins.
      const shift = (textWidth - p.width) / 2;
      out +=
        '<figure class="wb-figure' +
        (p.media === "video" ? " wb-video" : "") +
        '" style="margin-left:' +
        shift.toFixed(2) +
        "px;width:" +
        p.width +
        'px">' +
        media(p, m) +
        (p.text ? "<figcaption>" + esc(p.text) + "</figcaption>" : "") +
        "</figure>";
    }
  }
  return out;
}

/** The whole page: running head, content and folio. */
export function sheetHtml(sheet: Sheet, m: Markup, metrics: PageMetrics): string {
  const textWidth = metrics.width - metrics.side * 2;
  const f = sheet.front;
  let body = "";
  let head = true,
    folio = true;
  if (sheet.kind === "plate" && f) {
    head = folio = false;
    const cover = safeUrl(f.cover);
    if (cover && f.plate) {
      const size = "width:" + f.plate.width + "px;height:" + f.plate.height + "px";
      body =
        '<figure class="wb-plate">' +
        (m.measure
          ? '<span class="wb-media" style="' + size + '" data-media="' + esc(cover) + '"></span>'
          : '<img class="wb-media" style="' +
            size +
            '" src="' +
            esc(cover) +
            '" alt="Cover plate for ' +
            esc(f.title) +
            '" decoding="async" draggable="false" data-zoom tabindex="0" role="button" aria-label="Enlarge the cover plate">') +
        "<figcaption>" +
        esc(f.series) +
        "</figcaption></figure>";
    } else
      body =
        '<div class="wb-halftitle"><span class="wb-orn"><i></i><b></b><i></i></span><p>' +
        esc(f.title) +
        "</p><span>" +
        esc(f.series) +
        "</span></div>";
  } else if (sheet.kind === "title" && f) {
    head = folio = false;
    body =
      '<div class="wb-titlepage" data-tight="' + (f.tight ?? 0) + '"><div class="wb-titlehead">' +
      (f.tags.length ? '<span class="wb-tags">' + esc(f.tags.slice(0, 3).join("  ·  ")) + "</span>" : "") +
      '<h1 class="wb-title">' +
      esc(f.title) +
      '</h1><i class="wb-rule"></i><p class="wb-summary">' +
      esc(f.summary) +
      "</p>" +
      (f.client ? '<p class="wb-client">Client · ' + esc(f.client) + "</p>" : "") +
      '</div><div class="wb-imprint"><span class="wb-author">' +
      esc(f.author) +
      '</span><span class="wb-series">' +
      esc(f.series) +
      "</span>" + (m.report ? '<button type="button" class="wb-report-link" data-report>Open full report ↗</button>' : "") + "</div></div>";
  } else if (sheet.kind === "contents") {
    head = false;
    body =
      '<div class="wb-flow wb-contentspage">' +
      (sheet.part === 3 ? '<h2 class="wb-chapter">Contents</h2><i class="wb-rule"></i>' : "") +
      '<ol class="wb-toc">' +
      (sheet.contents ?? [])
        .map(
          (c) =>
            '<li><a href="#book/' +
            esc(m.slug) +
            "/" +
            esc(c.key) +
            '" data-goto="' +
            esc(c.key) +
            '"><span class="wb-toc-t">' +
            esc(c.title) +
            '</span><i class="wb-toc-dots"></i><span class="wb-toc-n">' +
            c.folio +
            "</span></a></li>",
        )
        .join("") +
      "</ol></div>";
  } else if (sheet.kind === "end" && f) {
    head = false;
    const detail = safeUrl(f.detail);
    body =
      '<div class="wb-end"><span class="wb-orn"><i></i><b></b><i></i></span><p class="wb-end-title">' +
      esc(f.title) +
      '</p><p class="wb-end-note">' +
      esc(f.series) +
      " · " +
      esc(f.author) +
      "</p>" +
      (detail
        ? '<p class="wb-link"><a href="' +
          esc(m.href(detail)) +
          '"' + (m.report ? ' data-report' : '') + '>' + (m.report ? 'Open full report' : 'Full reading page') + '<span class="wb-arrow"> ↗</span></a></p>'
        : "") +
      "</div>";
  } else {
    // A page that opens a section carries no running head above the section's name.
    head = sheet.pieces[0]?.kind !== "chapter";
    body = '<div class="wb-flow">' + flowHtml(sheet.pieces, m, textWidth) + "</div>";
  }
  return (
    '<div class="wb-sheet" data-kind="' +
    sheet.kind +
    '">' +
    (head
      ? '<span class="wb-running ' +
        sheet.side +
        '">' +
        esc(sheet.side === "left" ? m.volumeTitle : sheet.leafTitle) +
        "</span>"
      : "") +
    body +
    (folio ? '<span class="wb-folio">' + sheet.folio + "</span>" : "") +
    // Where the paper can be taken hold of: the outer margin lifts the leaf, the head
    // and foot margins move the whole book.
    (m.measure
      ? ""
      : '<i class="wb-grip top" data-zone="book"></i><i class="wb-grip bottom" data-zone="book"></i><i class="wb-edge" data-zone="leaf"></i><i class="wb-edge back" data-zone="leaf-back"></i>') +
    "</div>"
  );
}

/** The page that holds a place: the exact page, or the page a section runs onto. */
export function findSheet(sheets: Sheet[], mark: { leaf: string; part: number } | null) {
  if (!mark) return -1;
  const part = Math.max(1, mark.part || 1);
  const exact = sheets.findIndex((s) => s.leaf === mark.leaf && s.part === part);
  if (exact >= 0) return exact;
  const run = sheets.map((s, i) => (s.leaves.includes(mark.leaf) ? i : -1)).filter((i) => i >= 0);
  return run.length ? run[Math.min(part, run.length) - 1] : -1;
}

/** Paper tone only: foxing toward the edges and the shadow of the gutter. */
function paper(ctx: CanvasRenderingContext2D, W: number, H: number, side: "left" | "right") {
  ctx.fillStyle = "#f1e7cc";
  ctx.fillRect(0, 0, W, H);
  const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.78);
  edge.addColorStop(0, "rgba(120,90,40,0)");
  edge.addColorStop(1, "rgba(120,90,40,.16)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);
  const gutter = ctx.createLinearGradient(side === "left" ? W : 0, 0, side === "left" ? W - 54 : 54, 0);
  gutter.addColorStop(0, "rgba(40,25,8,.34)");
  gutter.addColorStop(0.35, "rgba(40,25,8,.09)");
  gutter.addColorStop(1, "rgba(40,25,8,0)");
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, W, H);
}

/** Ink for lit paper. The room's light and tone curve lift dark tones, so words printed
    in their screen colour read grey on a turning leaf; they are printed deeper to land
    where the DOM page shows them. */
const inks = new Map<string, string>();
function ink(color: string) {
  let deep = inks.get(color);
  if (deep === undefined) {
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/.exec(color);
    deep = m
      ? "rgba(" + [m[1], m[2], m[3]].map((v) => Math.round(+v * 0.42)).join(",") + "," + (m[4] ?? 1) + ")"
      : color;
    inks.set(color, deep);
  }
  return deep;
}

/** Prints the page on paper at any resolution from its print instructions. `images`
    supplies decoded pictures when they are ready; a missing picture leaves a toned
    plate of the right size, so nothing moves when it arrives. */
export function paintSheet(
  ctx: CanvasRenderingContext2D,
  pixels: number,
  metrics: PageMetrics,
  sheet: Sheet | null,
  side: "left" | "right",
  images?: (url: string) => CanvasImageSource | null,
) {
  const s = pixels / metrics.width;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  paper(ctx, metrics.width, metrics.height, side);
  if (!sheet) return;
  const spaced = ctx as unknown as { letterSpacing?: string };
  let font = "";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  for (const op of sheet.ops) {
    if (op.t === "rect") {
      ctx.fillStyle = op.color;
      ctx.fillRect(op.x, op.y, op.w, op.h);
    } else if (op.t === "text") {
      if (font !== op.font) ctx.font = font = op.font;
      if ("letterSpacing" in ctx) spaced.letterSpacing = (op.ls ?? 0) + "px";
      ctx.fillStyle = ink(op.color);
      ctx.fillText(op.text, op.x, op.y);
    } else {
      const img = op.url && images ? images(op.url) : null;
      if (img) ctx.drawImage(img, op.x, op.y, op.w, op.h);
      else {
        ctx.fillStyle = op.video ? "rgba(46,36,22,.82)" : "rgba(70,52,24,.12)";
        ctx.fillRect(op.x, op.y, op.w, op.h);
      }
      if (op.video) {
        // The play mark of a film that waits on the page.
        const r = Math.min(op.w, op.h) * 0.11,
          cx = op.x + op.w / 2,
          cy = op.y + op.h / 2;
        ctx.fillStyle = "rgba(20,14,6,.55)";
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f1e7cc";
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.6, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx - r * 0.6, cy + r);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  if ("letterSpacing" in ctx) spaced.letterSpacing = "0px";
}
