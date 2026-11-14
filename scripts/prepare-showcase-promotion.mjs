// Builds a review package only. No database client, credentials, upload or mutation.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const read = async (file) => JSON.parse(await readFile(file, "utf8"));
const studies = (await Promise.all(["vantage", "commerce-studio", "belllabs"].map((name) => read(`content/showcases/${name}.json`)))).flat();
const baseline = await read("assets/library/posters/content-inventory.json");
const media = await read("assets/library/posters/staged-media.json");
const entries = [];
for (const study of studies) {
  const source = baseline.find((entry) => entry.slug === study.slug);
  if (!source) throw Error("Missing baseline: " + study.slug);
  const role = study.role ?? source.pages.flatMap((page) => page.blocks).find((block) => block.component === "Metric" && /^(my )?role$/i.test(block.props.label ?? ""))?.props.text;
  const pages = study.pages.map((page, index) => {
    const original = source.pages.find((entry) => entry.template === page.key);
    if (!original) throw Error("New section key needs review: " + page.key);
    return { position: index + 1, template: page.key, blocks: [{ component: "Heading", props: { text: page.title, label: "section-title" } }, ...(index === 0 ? [...(role ? [{ component: "Metric", props: { label: "Role", text: role } }] : []), { component: "Metric", props: { label: "Status", text: study.status } }] : []), ...page.blocks] };
  });
  const cover = media.posters.find((poster) => poster.slug === study.slug)?.url;
  const urls = [...new Set([cover, ...study.pages.flatMap((page) => page.blocks.flatMap((block) => [block.props.url, block.props.poster, block.props.detail, block.props.captions]))].filter((url) => url?.startsWith("/library/")))];
  const assets = [];
  for (const url of urls) {
    const bytes = await readFile("public" + url);
    assets.push({ url, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
  }
  entries.push({ slug: study.slug, expectedSummary: source.summary, expectedPages: source.pages, expectedTags: source.tags, expectedStatus: source.status, summary: study.summary, statusLabel: study.status, role, pageMode: "authored", cover, pages, assets });
}
await mkdir(".local-library/showcase-2026", { recursive: true });
await writeFile(".local-library/showcase-2026/promotion-plan.json", JSON.stringify({ mode: "review-only", observed: "2026-11-13", instructions: "Review source changes and client disclosure. Import through audited office writes with revisions. Do not change activation/display until separately publishing. Section-title headings preserve stable leaf keys.", entries }, null, 2) + "\n");
console.log(`Prepared ${entries.length} studies with verified local asset hashes. No database writes.`);
