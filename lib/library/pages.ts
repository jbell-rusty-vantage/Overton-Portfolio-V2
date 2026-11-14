import { blocksFrom, templateNames } from "./policy";
import type { Leaf } from "./model";
type PageRow = {
  templateCode: string | null;
  position: number;
  blocks: unknown;
};
export function resolvePages(
  mode: string | undefined,
  generated: Leaf[],
  rows: PageRow[],
): Leaf[] {
  if (!mode || mode === "generated") return generated;
  const seen = new Set<string>();
  const authored = rows.flatMap((p) => {
    const blocks = blocksFrom(p.blocks);
    if (!blocks.length) return [];
    const template = p.templateCode || "page-" + p.position;
    const key = seen.has(template) ? template + "-" + p.position : template;
    seen.add(template);
    return [
      {
        key,
        template,
        title: blocks.find((block) => block.kind === "heading" && block.label === "section-title")?.text ?? templateNames[template] ?? "Page " + p.position,
        blocks: blocks.filter((block) => block.label !== "section-title"),
      },
    ];
  });
  if (mode === "authored") return authored;
  const combined = [
    ...generated.map((p) => authored.find((a) => a.key === p.key) ?? p),
    ...authored.filter((a) => !generated.some((g) => g.key === a.key)),
  ];
  const rank = (p: Leaf) => {
    const kind = authored.find((a) => a.key === p.key)?.template ?? p.key;
    const index = Object.keys(templateNames).indexOf(kind);
    return index < 0 ? 99 : index;
  };
  return combined.sort((a, b) => rank(a) - rank(b));
}
