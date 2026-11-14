/* Break a volume into pages that fit the book. Every height is measured on the very
   markup the reader will show (sheetHtml), in a hidden copy of the page with the same
   stylesheet, so what fits here is exactly what fits on the paper.

   The rules a compositor would follow:
   - sections run on down the page; a short one is kept whole (moved to the next page
     if it will not fit under what is there), a long one starts a fresh page only when
     little of the current page is left;
   - a heading is never left at the foot of a page without the text it introduces;
   - a paragraph breaks at a line end with at least two lines on either side;
   - pictures are set at their own proportions (their sizes are read before layout);
     one that does not fit moves to the head of the next page and the text runs on;
   - measurements are grouped; the volume opens with a plate, a title page and a
     table of contents, and never closes on a blank page. */
import { type Block, type Volume } from "@/lib/library/types";
import { printOps } from "./bookPrint";
import {
  flowHtml,
  safeUrl,
  sheetHtml,
  type Front,
  type Markup,
  type PageMetrics,
  type Piece,
  type Sheet,
} from "./sheets";

type Size = { width: number; height: number };
const sizes = new Map<string, Size | null>();
const layouts = new WeakMap<Volume, Map<string, Sheet[]>>();
/** Natural size of a picture, learned once per address. */
function natural(url: string): Promise<Size | null> {
  if (sizes.has(url)) return Promise.resolve(sizes.get(url) ?? null);
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (size: Size | null, keep: boolean) => {
      if (done) return;
      done = true;
      if (keep) sizes.set(url, size);
      resolve(size);
    };
    img.onload = () =>
      finish(img.naturalWidth && img.naturalHeight ? { width: img.naturalWidth, height: img.naturalHeight } : null, true);
    img.onerror = () => finish(null, true);
    // A slow picture must not hold the book shut; it is laid out at a usual shape.
    setTimeout(() => finish(null, false), 2500);
    img.src = url;
  });
}

export type Layout = {
  /** One page at a time (a narrow screen): no pairing, so no closing page is needed. */
  single: boolean;
  author: string;
  series: string;
  detail?: string;
  markup: Markup;
};

export async function paginate(
  volume: Volume,
  metrics: PageMetrics,
  host: HTMLElement,
  layout: Layout,
): Promise<Sheet[]> {
  const cacheKey = JSON.stringify([metrics, layout.single, layout.author, layout.series, layout.detail, !!layout.markup.report]);
  const cached = layouts.get(volume)?.get(cacheKey);
  if (cached) return cached;
  const measure: Markup = { ...layout.markup, measure: true };
  const limit = metrics.height - metrics.top - metrics.bottom;
  const textWidth = metrics.width - metrics.side * 2;
  // A plate may reach a little way into the side margins.
  const plateWidth = textWidth + Math.round(metrics.side * 0.7);

  // 1. Learn the shape of every picture before anything is measured.
  const wanted = new Set<string>();
  const cover = safeUrl(volume.cover);
  if (cover) wanted.add(cover);
  for (const leaf of volume.pages)
    for (const b of leaf.blocks) {
      const u = safeUrl(b.kind === "image" ? b.url : b.kind === "video" ? b.poster : undefined);
      if (u) wanted.add(u);
    }
  await Promise.all([document.fonts.ready, ...[...wanted].map(natural)]);
  if (!host.isConnected) return [];
  const shape = (url: string | undefined, fallback: number) => {
    const s = url ? sizes.get(url) : null;
    return s ? s.width / s.height : fallback;
  };

  // 2. Turn the projected blocks into typeset pieces.
  const titles = new Map<string, string>();
  const pieces: Piece[] = [];
  for (const leaf of volume.pages) {
    // An authored leaf names itself in its first heading; a heading that only repeats
    // the leaf's name is not set twice.
    const same = (b: Block) => b.kind === "heading" && b.text.trim().toLowerCase() === leaf.title.trim().toLowerCase();
    const named = leaf.title.startsWith("Page ")
      ? leaf.blocks.find((b) => b.kind === "heading")
      : leaf.blocks.find(same);
    const title = named && leaf.title.startsWith("Page ") ? named.text : leaf.title;
    titles.set(leaf.key, title);
    const at = { leaf: leaf.key };
    pieces.push({ ...at, kind: "chapter", text: title });
    for (const b of leaf.blocks) {
      if (b === named || !(b.text || b.url)) continue;
      const last = pieces[pieces.length - 1];
      if (b.kind === "heading") pieces.push({ ...at, kind: "heading", text: b.text });
      else if (b.kind === "metric") {
        const item = { value: b.text, label: b.label ?? "" };
        if (last.kind === "metrics" && last.leaf === leaf.key) last.items.push(item);
        else pieces.push({ ...at, kind: "metrics", items: [item] });
      } else if (b.kind === "code") pieces.push({ ...at, kind: "code", text: b.text.replace(/\s+$/, "") });
      else if (b.kind === "link" && b.url) pieces.push({ ...at, kind: "link", text: b.text, url: b.url });
      else if ((b.kind === "image" || b.kind === "video") && b.url) {
        const picture = safeUrl(b.kind === "image" ? b.url : b.poster) ?? undefined;
        const ratio = shape(picture, 16 / 9);
        // As wide as the plate measure allows, never taller than leaves room for a caption.
        const tallest = limit - 64;
        const width = Math.round(Math.min(plateWidth, tallest * ratio));
        pieces.push({
          ...at,
          kind: "figure",
          media: b.kind,
          url: b.url,
          poster: b.poster,
          captions: b.captions,
          transcript: b.transcript,
          ownPage: b.ownPage,
          detail: b.detail,
          text: b.text,
          width,
          height: Math.round(width / ratio),
          loose: (b.kind === "image" && !(picture && sizes.get(picture))) || undefined,
        });
      } else {
        // Lines of one block are a list; "Term. Explanation" lines get a run-in term.
        const lines = b.text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
        const lead = lines.map((l) => /^([A-Z0-9][^.:!?]{1,40}[.:])\s+\S/.exec(l)?.[1].length ?? 0);
        const list = lines.length > 1;
        const terms = list && lead.every(Boolean);
        lines.forEach((text, i) =>
          pieces.push({ ...at, kind: "text", text, item: list || undefined, lead: terms ? lead[i] : undefined }),
        );
      }
    }
  }

  // 3. Fill pages.
  host.innerHTML = '<div class="wb-sheet"><div class="wb-flow"></div></div>';
  const flow = host.querySelector<HTMLElement>(".wb-flow")!;
  /** Lays the pieces out and returns the depth they reach (the last trailing margin
      does not count: nothing follows it on the page). */
  const depth = (list: Piece[]) => {
    flow.innerHTML = flowHtml(list, measure, textWidth);
    const last = flow.lastElementChild as HTMLElement | null;
    return last ? last.offsetTop + last.offsetHeight : 0;
  };
  const fits = (list: Piece[]) => depth(list) <= limit + 0.5;
  const lineCount = () => {
    const el = flow.lastElementChild as HTMLElement;
    const lh = parseFloat(getComputedStyle(el).lineHeight) || metrics.body * metrics.line;
    const pad = parseFloat(getComputedStyle(el).paddingTop) + parseFloat(getComputedStyle(el).paddingBottom);
    return Math.round((el.offsetHeight - pad) / lh);
  };
  /** Largest n in [0, max] for which ok(n) holds, given ok is monotone. */
  const most = (max: number, ok: (n: number) => boolean) => {
    let lo = 0,
      hi = max;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (ok(mid)) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  type Text = Extract<Piece, { kind: "text" }>;
  type Code = Extract<Piece, { kind: "code" }>;
  /** Break a paragraph at a line end. `loose` gives up the two-line rule when the
      paragraph would otherwise never fit. */
  const splitText = (page: Piece[], p: Text, loose: boolean): [Text, Text] | null => {
    const words = p.text.split(/(?<=\s)/);
    const head = (n: number): Text => ({ ...p, text: words.slice(0, n).join("").trimEnd() });
    depth([p]);
    const total = lineCount();
    let n = most(words.length - 1, (k) => k === 0 || fits([...page, head(k)]));
    if (n === 0) return null;
    fits([...page, head(n)]);
    let lines = lineCount();
    const min = loose ? 1 : 2;
    if (total - lines < min) {
      // Leave company for the last line: give up one line here.
      const want = lines - (min - (total - lines));
      if (want < min) return null;
      n = most(n, (k) => {
        if (k === 0) return true;
        depth([head(k)]);
        return lineCount() <= want;
      });
      lines = want;
    }
    if (n === 0 || lines < min) return null;
    const lead = Math.min(p.lead ?? 0, head(n).text.length);
    return [
      { ...head(n), lead: lead || undefined },
      { ...p, text: words.slice(n).join("").trim(), lead: undefined, cont: true },
    ];
  };
  const splitCode = (page: Piece[], p: Code, loose: boolean): [Code, Code] | null => {
    const rows = p.text.split("\n");
    const min = loose ? 1 : 3;
    const n = most(rows.length - min, (k) => k === 0 || fits([...page, { ...p, text: rows.slice(0, k).join("\n") }]));
    if (n < min) return null;
    return [
      { ...p, text: rows.slice(0, n).join("\n") },
      { ...p, text: rows.slice(n).join("\n") },
    ];
  };

  const pages: Piece[][] = [];
  let page: Piece[] = [];
  let waiting: Piece[] = [];
  const queue = [...pieces];
  const close = () => {
    // A heading goes with what it introduces.
    const carried: Piece[] = [];
    while (page.length > 1 && ["heading", "chapter"].includes(page[page.length - 1].kind)) carried.unshift(page.pop()!);
    if (page.length) pages.push(page);
    page = [];
    // The section heading must precede its deferred figure, not follow it.
    queue.unshift(...carried, ...waiting);
    waiting = [];
  };
  let guard = 0;
  while ((queue.length || waiting.length) && guard++ < 20000) {
    if (!queue.length) {
      // The text ran out with a picture still waiting: it opens the next page.
      close();
      continue;
    }
    const p = queue.shift()!;
    if (p.kind === "figure" && p.ownPage && page.some((piece) => piece.kind !== "chapter" && piece.kind !== "heading")) {
      queue.unshift(p);
      close();
      continue;
    }
    if (page.some((piece) => piece.kind === "figure" && piece.ownPage)) {
      queue.unshift(p);
      close();
      continue;
    }
    // A picture waiting for the next page goes before any new heading or picture.
    if (waiting.length && p.kind !== "text") {
      queue.unshift(p);
      close();
      continue;
    }
    const alone = page.every((q) => q.kind === "heading" || q.kind === "chapter");
    if (p.kind === "chapter" && page.length) {
      // A short section (under half a page) is kept in one piece: here if all of it
      // fits under what is already on the page, otherwise at the head of the next. A
      // longer one starts here and runs over, unless little of the page is left.
      const rest = queue.findIndex((q) => q.kind === "chapter");
      const section = [p, ...queue.slice(0, rest < 0 ? queue.length : rest)];
      const short = depth(section) <= limit * 0.32;
      // Let a longer section use the remaining paper whenever its heading and two
      // lines fit. The former 60% rule stranded large empty tails across the book.
      if (short && !fits([...page, ...section])) {
        queue.unshift(p);
        close();
        continue;
      }
    }
    if (fits([...page, p])) {
      page.push(p);
      continue;
    }
    if (p.kind === "text" || p.kind === "code") {
      const cut = p.kind === "text" ? splitText(page, p, alone) : splitCode(page, p, alone);
      if (cut) {
        page.push(cut[0]);
        queue.unshift(cut[1]);
        close();
        continue;
      }
    } else if (p.kind === "metrics" && alone && p.items.length > 2) {
      // A group of measurements stays together unless it is longer than a page.
      const n = most(p.items.length - 1, (k) => k === 0 || fits([...page, { ...p, items: p.items.slice(0, k) }]));
      if (n >= 1) {
        page.push({ ...p, items: p.items.slice(0, n) });
        queue.unshift({ ...p, items: p.items.slice(n) });
        close();
        continue;
      }
    } else if (p.kind === "figure") {
      // A little smaller and it stays where it belongs; under a bare heading it is
      // set as small as it must be.
      let smaller = p;
      for (let i = 0; i < 5; i++) {
        // A narrower picture can turn its caption onto another line: measure again.
        const over = depth([...page, smaller]) - limit;
        if (over <= 0.5) break;
        const h = Math.max(60, Math.floor(smaller.height - over - 1));
        smaller = { ...p, height: h, width: Math.round((p.width * h) / p.height) };
      }
      if (alone || (smaller.height >= p.height * 0.72 && fits([...page, smaller]))) {
        page.push(smaller);
        continue;
      }
      const next = queue[0];
      if (!p.floated && !waiting.length && next?.kind === "text") {
        // The picture goes to the head of the next page and the text runs on here.
        waiting.push({ ...p, floated: true });
        continue;
      }
    }
    if (alone) {
      // It will never fit better than on a page of its own: let it stand.
      page.push(p);
      close();
    } else {
      queue.unshift(p);
      close();
    }
  }
  if (page.length) pages.push(page);

  // A closing source link should not occupy a nearly empty leaf by itself. Pull
  // the whole tail back if it fits; otherwise share the preceding page's final
  // pieces without changing their order or stranding a heading.
  for (let i = pages.length - 1; i > 0; i--) {
    const tail = pages[i], previous = pages[i - 1];
    if (depth(tail) >= limit * .3 || [...tail, ...previous].some((p) => p.kind === "figure" && p.ownPage)) continue;
    if (fits([...previous, ...tail])) {
      pages.splice(i - 1, 2, [...previous, ...tail]);
      continue;
    }
    while (depth(tail) < limit * .3 && previous.length > 1) {
      // A full measurement grid often leaves only its source link on the final
      // leaf. Share its final row, preserving each value once and in order,
      // instead of moving the entire group and stranding the earlier prose.
      const last = previous[previous.length - 1];
      if (last.kind === "metrics" && last.items.length > 2) {
        const row = last.items.length % 2 || 2;
        const retained = { ...last, items: last.items.slice(0, -row) };
        const continued = { ...last, items: last.items.slice(-row) };
        if (depth([...previous.slice(0, -1), retained]) >= limit * .3 && fits([continued, ...tail])) {
          previous[previous.length - 1] = retained;
          tail.unshift(continued);
          continue;
        }
      }
      let take = 1;
      while (previous.length > take && ["heading", "chapter"].includes(previous[previous.length - take - 1].kind)) take++;
      const moving = previous.slice(-take), remaining = previous.slice(0, -take);
      if (!remaining.length || moving.some((p) => p.kind === "figure") || depth(remaining) < limit * .3 || !fits([...moving, ...tail])) break;
      previous.splice(-take);
      tail.unshift(...moving);
    }
  }

  // 4. Front matter, contents and the closing page.
  const coverShape = shape(cover ?? undefined, 0);
  let plate: Front["plate"];
  if (cover && coverShape) {
    const width = Math.min(textWidth, Math.round((limit - 44) * coverShape));
    plate = { width, height: Math.round(width / coverShape) };
  }
  const front: Front = {
    title: volume.title,
    summary: volume.summary,
    tags: volume.tags,
    cover: plate ? (cover ?? undefined) : undefined,
    plate,
    client: volume.clientLabel,
    author: layout.author,
    series: layout.series,
    detail: layout.detail,
  };
  const blank = { parts: 0, folio: 0, side: "right" as const, pieces: [], leaves: ["front"], ops: [], front };
  const sheets: Sheet[] = [
    { ...blank, leaf: "front", leafTitle: volume.title, part: 1, kind: "plate" },
    { ...blank, leaf: "front", leafTitle: volume.title, part: 2, kind: "title" },
  ];
  // The title page is set in one of three sizes, the largest in which the whole
  // summary stands above the imprint; a summary longer than that gives up sentences.
  const titleFits = () => {
    host.innerHTML = sheetHtml(sheets[1], measure, metrics);
    const head = host.querySelector<HTMLElement>(".wb-titlehead")!;
    return head.scrollHeight <= head.clientHeight + 0.5;
  };
  for (const tight of [0, 1, 2] as const) {
    front.tight = tight;
    if (titleFits()) break;
  }
  const sentences = volume.summary.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) ?? [volume.summary];
  while (sentences.length > 1 && !titleFits()) {
    sentences.pop();
    front.summary = sentences.join("").trim();
  }
  // The contents are measured too: a long volume's list runs onto a second page.
  const entries = volume.pages.map((l) => ({ key: l.key, title: titles.get(l.key) ?? l.title, folio: 0 }));
  const contentsFits = (list: typeof entries, first: boolean) => {
    const probe: Sheet = { ...blank, leaf: "front", leafTitle: "Contents", part: first ? 3 : 4, kind: "contents", contents: list };
    host.innerHTML = sheetHtml(probe, measure, metrics);
    const last = host.querySelector<HTMLElement>(".wb-toc")!;
    return last.offsetTop + last.offsetHeight <= limit + 0.5;
  };
  const groups: (typeof entries)[] = [];
  for (let from = 0; from < entries.length; ) {
    const n = Math.max(1, most(entries.length - from, (k) => k === 0 || contentsFits(entries.slice(from, from + k), !groups.length)));
    groups.push(entries.slice(from, from + n));
    from += n;
  }
  if (!groups.length) groups.push([]);
  groups.forEach((list, i) =>
    sheets.push({ ...blank, leaf: "front", leafTitle: "Contents", part: 3 + i, kind: "contents", contents: list }),
  );
  const run = new Map<string, number>();
  for (const list of pages) {
    const leaves = [...new Set(list.map((p) => p.leaf))];
    const leaf = list[0].leaf;
    for (const key of leaves) run.set(key, (run.get(key) ?? 0) + 1);
    sheets.push({
      ...blank,
      front: undefined,
      leaf,
      leafTitle: titles.get(leaf) ?? "",
      part: run.get(leaf)!,
      kind: "flow",
      pieces: list,
      leaves,
    });
  }
  if (!layout.single && sheets.length % 2)
    sheets.push({ ...blank, leaf: "end", leafTitle: volume.title, part: 1, leaves: ["end"], kind: "end" });
  sheets.forEach((s, i) => {
    s.folio = i + 1;
    s.side = layout.single || i % 2 ? "right" : "left";
    s.parts = s.leaf === "front" ? 2 + groups.length : s.leaf === "end" ? 1 : (run.get(s.leaf) ?? 1);
  });
  for (const e of entries) e.folio = sheets.find((s) => s.kind === "flow" && s.pieces.some((p) => p.kind === "chapter" && p.leaf === e.key))?.folio ?? 0;

  // 5. Read each finished page back as print instructions for the paper.
  for (const s of sheets) {
    host.innerHTML = sheetHtml(s, measure, metrics);
    s.ops = printOps(host);
  }
  host.innerHTML = "";
  const cachedLayouts = layouts.get(volume) ?? new Map<string, Sheet[]>();
  cachedLayouts.set(cacheKey, sheets);
  layouts.set(volume, cachedLayouts);
  return sheets;
}

/** Schedule one book per idle slice after arriving at the cabinet. Returns cleanup.
 * The caller supplies the same Layout as Reader, including report=true, so opening
 * a book reuses its measured pages. No engine or database work happens here. */
export function prepaginateVolumes(volumes: Volume[], metrics: PageMetrics, layoutFor: (volume: Volume) => Layout) {
  let cancelled = false;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const host = document.createElement("div");
  host.className = "wb-page wb-measure";
  host.setAttribute("aria-hidden", "true");
  Object.entries({ w: metrics.width + "px", h: metrics.height + "px", top: metrics.top + "px", side: metrics.side + "px", bottom: metrics.bottom + "px", body: metrics.body + "px", line: String(metrics.line) }).forEach(([key, value]) => host.style.setProperty("--wb-" + key, value));
  document.body.append(host);
  let at = 0;
  const next = async () => {
    if (cancelled || at >= volumes.length) { host.remove(); return; }
    const volume = volumes[at++];
    running = true;
    try {
      await paginate(volume, metrics, host, layoutFor(volume));
    } catch {
      // Warm-up is optional; Reader will retry on its own connected surface.
      cancelled = true;
    } finally {
      running = false;
      if (cancelled || at >= volumes.length) host.remove();
      else timer = setTimeout(() => { void next(); }, 80);
    }
  };
  timer = setTimeout(() => { void next(); }, 200);
  // Stop future books immediately, but keep this surface attached until the
  // current image/font wait and synchronous measurements have both finished.
  return () => { cancelled = true; clearTimeout(timer); if (!running) host.remove(); };
}
