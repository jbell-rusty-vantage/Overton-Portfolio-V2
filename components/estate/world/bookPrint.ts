/* Reads a laid-out page back as print instructions. The browser has already decided
   every line break, so the paper texture drawn from these instructions carries the
   same words in the same places as the DOM page it stands in for while a leaf turns. */
import type { Op } from "./sheets";

let probe: CanvasRenderingContext2D | null = null;
const rise = new Map<string, number>();
/** Share of a text box's height that lies above the baseline, for a font. */
function ascent(font: string) {
  let share = rise.get(font);
  if (share === undefined) {
    probe ??= document.createElement("canvas").getContext("2d");
    share = 0.78;
    if (probe) {
      probe.font = font;
      const m = probe.measureText("Hg");
      const up = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent,
        down = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent;
      if (up + down > 0) share = up / (up + down);
    }
    rise.set(font, share);
  }
  return share;
}
const clear = (color: string) =>
  !color || color === "transparent" || /rgba\([^)]*,\s*0\)$/.test(color);

export function printOps(page: HTMLElement): Op[] {
  const origin = page.getBoundingClientRect();
  const ops: Op[] = [];
  const range = document.createRange();
  const rect = (r: DOMRect | { left: number; top: number; width: number; height: number }, color: string) => {
    if (r.width > 0 && r.height > 0)
      ops.push({ t: "rect", x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height, color });
  };
  const visit = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const box = el.getBoundingClientRect();
    if (!clear(cs.backgroundColor)) rect(box, cs.backgroundColor);
    const edge = (side: "Top" | "Right" | "Bottom" | "Left") => {
      const w = parseFloat(cs[("border" + side + "Width") as "borderTopWidth"]);
      const color = cs[("border" + side + "Color") as "borderTopColor"];
      if (!w || cs[("border" + side + "Style") as "borderTopStyle"] === "none" || clear(color)) return;
      if (side === "Top") rect({ left: box.left, top: box.top, width: box.width, height: w }, color);
      else if (side === "Bottom") rect({ left: box.left, top: box.bottom - w, width: box.width, height: w }, color);
      else if (side === "Left") rect({ left: box.left, top: box.top, width: w, height: box.height }, color);
      else rect({ left: box.right - w, top: box.top, width: w, height: box.height }, color);
    };
    edge("Top");
    edge("Right");
    edge("Bottom");
    edge("Left");
    if (el.dataset.media !== undefined) {
      ops.push({
        t: "image",
        x: box.left - origin.left,
        y: box.top - origin.top,
        w: box.width,
        h: box.height,
        url: el.dataset.media,
        video: el.dataset.video === "1" || undefined,
      });
      return;
    }
    const font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    const upper = cs.textTransform === "uppercase";
    const ls = parseFloat(cs.letterSpacing) || 0;
    const up = ascent(font);
    const word = (node: Text, start: number, end: number) => {
      range.setStart(node, start);
      range.setEnd(node, end);
      return range.getClientRects();
    };
    const put = (text: string, r: DOMRect) =>
      ops.push({
        t: "text",
        x: r.left - origin.left,
        y: r.top - origin.top + r.height * up,
        text: upper ? text.toUpperCase() : text,
        font,
        color: cs.color,
        ls: ls || undefined,
      });
    for (const node of el.childNodes) {
      if (node.nodeType === 1) visit(node as HTMLElement);
      else if (node.nodeType === 3) {
        const data = (node as Text).data;
        for (const m of data.matchAll(/\S+/g)) {
          const at = m.index ?? 0;
          const rects = word(node as Text, at, at + m[0].length);
          if (rects.length === 1) put(m[0], rects[0]);
          else if (rects.length > 1) {
            // A word broken across lines (a long address, a hyphen): place it by letter.
            let run = "",
              first: DOMRect | null = null;
            for (let i = 0; i < m[0].length; i++) {
              const r = word(node as Text, at + i, at + i + 1)[0];
              if (!r) continue;
              if (first && Math.abs(r.top - first.top) > 1) {
                put(run, first);
                run = "";
                first = null;
              }
              first ??= r;
              run += m[0][i];
            }
            if (first && run) put(run, first);
          }
        }
      }
    }
    if (cs.textDecorationLine.includes("underline"))
      for (const r of el.getClientRects())
        rect({ left: r.left, top: r.top + r.height * up + 2.2, width: r.width, height: 0.7 }, cs.color);
  };
  visit(page);
  return ops;
}
