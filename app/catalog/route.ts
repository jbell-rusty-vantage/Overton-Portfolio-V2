import { getCollection } from "@/lib/library/catalog";
import { collectionShelves, matchesCatalog, type Block } from "@/lib/library/model";
import { publicImage, publicVideo } from "@/lib/library/policy";

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function content(b: Block) {
  if (b.kind === "link" && b.url?.startsWith("/projects/"))
    return (
      '<p><a href="/catalog?volume=' +
      encodeURIComponent(b.url.slice(10)) +
      '">' +
      escape(b.text) +
      "</a></p>"
    );
  if (b.kind === "link" && b.url)
    return (
      '<p><a href="' +
      escape(b.url) +
      '" rel="noreferrer">' +
      escape(b.text) +
      "</a></p>"
    );
  if (b.kind === "image" && publicImage(b.url))
    return (
      '<figure><img src="' +
      escape(b.url!) +
      '" alt="' +
      escape(b.text) +
      '"></figure>'
    );
  if (b.kind === "video" && publicVideo(b.url))
    return (
      '<p><a href="' +
      escape(b.url!) +
      '" rel="noreferrer">Watch: ' +
      escape(b.text) +
      "</a></p>"
    );
  if (b.kind === "heading") return "<h3>" + escape(b.text) + "</h3>";
  if (b.kind === "metric")
    return "<p><strong>" + escape(b.text) + "</strong> " + escape(b.label ?? "") + "</p>";
  if (b.kind === "code")
    return "<pre><code>" + escape(b.text) + "</code></pre>";
  return "<p>" + escape(b.text) + "</p>";
}
// A complete, non-streamed HTML document for browsers without JavaScript.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const slug = query.get("volume") ?? "";
  const search = (query.get("q") ?? "").trim().slice(0, 160);
  const collection = await getCollection(slug ? { direct: slug } : {});
  const volume = collection.volumes.find(
    (v) => v.slug === slug || v.projectSlug === slug,
  );
  const label =
    collection.source === "fixtures"
      ? "Sample collection · Demonstration content"
      : collection.source === "review"
        ? "Local draft preview"
        : "";
  let status = 200;
  let body = "";
  if (collection.source === "unavailable") {
    status = 503;
    body = "<h1>Collection unavailable</h1><p>Reload to try again.</p>";
  } else if (slug && !volume) {
    status = 404;
    body = "<h1>Volume unavailable</h1>";
  } else if (volume) {
    body =
      "<article><small>" +
      escape(volume.kind) +
      "</small><h1>" +
      escape(volume.title) +
      "</h1>" +
      volume.pages
        .map(
          (p) =>
            "<section><h2>" +
            escape(p.title) +
            "</h2>" +
            p.blocks.map(content).join("") +
            "</section>",
        )
        .join("") +
      "</article>";
  } else {
    const shelves = collectionShelves(collection);
    const rows = collection.volumes.filter((v) =>
      matchesCatalog(v, search, shelves.find((s) => s.slug === v.shelf)?.title));
    body =
      '<h1>Library catalog</h1><form action="/catalog"><label>Find a volume <input name="q" value="' +
      escape(search) +
      '"></label> <button>Search</button></form>' +
      (rows.length
        ? rows
            .map(
              (v) =>
                '<article class="card"><a class="volume-card" href="/catalog?volume=' +
                encodeURIComponent(v.slug) +
                '"><h2>' +
                escape(v.title) +
                "</h2></a><p>" +
                escape(v.summary) +
                "</p></article>",
            )
            .join("")
        : "<p>No matching volumes.</p>");
  }
  const html =
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' +
    escape(volume?.title ?? "Catalog") +
    ' · The Library</title><style>html{color:#27392d;background:#f5f1e7;font:18px/1.65 Georgia,serif}body{max-width:45rem;margin:auto;padding:2rem 1.2rem}nav{display:flex;gap:1.4rem;border-bottom:1px solid #bcb79d;padding-bottom:1rem}a{color:#294e38}h1{font-size:2.6rem;line-height:1.1}h2{font-size:1.55rem}p,pre{white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%}.card{border-top:1px solid #c2bba6;margin:1rem 0}input,button{font:inherit;max-width:100%}small{color:#555e4e}</style><nav><a href="/">The Library</a><a href="/catalog">Text catalog</a></nav><main>' +
    body +
    "</main><small>" +
    escape(label) +
    "</small></html>";
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "content-security-policy":
        "default-src 'none'; img-src 'self' https:; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}
