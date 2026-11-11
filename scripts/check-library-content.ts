// Confirms every authored block in content/library/books.json survives the reader's allowlist unchanged in count.
import { readFileSync } from "node:fs";
import { blocksFrom } from "../lib/library/policy";
const spec = JSON.parse(readFileSync("content/library/books.json", "utf8"));
let bad = 0;
for (const b of spec.books)
  for (const p of b.pages) {
    const kept = blocksFrom(p.blocks);
    if (kept.length !== p.blocks.length) {
      bad++;
      console.log("DROPPED", b.slug, p.template, p.blocks.length - kept.length);
    }
  }
console.log(bad ? bad + " pages lose blocks" : "All " + spec.books.reduce((n: number, b: { pages: unknown[] }) => n + b.pages.length, 0) + " pages pass the reader's block rules");
process.exitCode = bad ? 1 : 0;
