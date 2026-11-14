# Project posters and content curation

**Owner's direction, November 12, 2026.** The covers on the project books are generic and he does not like them, in the 3D library and in the static view of his projects alike. He wants **completely new posters for every project**, made with image generation, and he wants the content inside the books curated and replaced where it is weak. This is part of [pathway A](PATHWAY_SHOWCASES.md). Nothing here is released until the owner approves it.

![The fourteen current covers: one emblem template in different colours](travellers-rest-review/covers-current.jpg)

## What is wrong with the current covers

All fourteen are one template: a line emblem, the title and a tagline on a flat colour. They say nothing about what each project is or looks like. A new poster should show the project itself, so that a visitor can tell Mission Control from GoWipe at shelf distance without reading.

## Where one cover image appears

One image per project is used everywhere, so it has to work in each of these places.

| Place | How it is shown | Code |
| --- | --- | --- |
| Front board of the 3D book | The whole poster, edge to edge, on a board of about 7:10. A 4:5 poster loses about six percent from each side. Nothing is printed over it. Changed in this session: before, a small square crop sat on generic leather. | `drawCover` in [volume.ts](../components/estate/world/engine/volume.ts) |
| Title page inside the open book | The whole image at its own shape, about 250 px wide on a desktop | [paginate.ts](../components/estate/world/paginate.ts), [sheets.ts](../components/estate/world/sheets.ts) |
| Project cards in the static cabinet | A small card, roughly 120 to 220 px wide | [Cabinet.tsx](../components/estate/Cabinet.tsx) |
| Reading page in the plain view | Beside the text | [Reading.tsx](../components/library/Reading.tsx) |
| Books in the older hall | On the jacket | [BookJacket.tsx](../components/library/BookJacket.tsx) |

A book with no cover falls back to tooled leather with the title in gold. The spine is drawn in code and already carries the title.

## Specification for a poster

- **Shape and size:** 4:5 portrait. Keep a master at 1440 × 1800 or larger; deliver WebP at 960 × 1200, under about 150 KB.
- **Safe area:** keep the title and anything that matters inside the middle 86 percent of the width and clear of the outer five percent on every side, because the 3D board trims the sides and shades its edges.
- **Legible small:** it must read at 120 px wide. One strong image and the project name; no paragraph text, no small labels.
- **The title is typeset, not generated.** Generate the picture without lettering, then set the project name (and at most one short line) over it with a script, so the spelling is exact and the type is consistent across the set. Use the names exactly as the office shows them.
- **A set, not fourteen strangers.** One type treatment, one position for the name, one way of handling the edge. The picture is what differs.
- **Truthful.** A poster may be an illustration of the project. It must not pass off an invented interface as a real screenshot, invent a client's logo, or invent the likeness of a real person. For client work use the client's real material only where the project already shows it publicly, and honour each project's `redaction_policy`, `public_alias` and `show_name` (the moving-company work in particular). For the Daryl Davis project use only imagery the owner supplies or approves.
- **Keep the workings out of `public/`.** Prompts, rejected drafts and masters go in `assets/library/posters/` (create it), never under `public/`.

## The fourteen projects

Read each project's summary and pages in the office before writing a concept; the slugs below are the artwork file prefixes and the `#book/<slug>` addresses.

`agentic-mission-control` · `agent-knowledge-services` · `ai-engineer-platform` · `ai-engineer-worldsfair-showcase` · `biotech-knowledge-platform` · `biotech-research-ingestion` · `human-upgrade-ingestion-pipeline` · `polymarket-mcp-server` · `the-library` · `overtech-digital-services` · `vantage-lead-analytics` · `vantage-movers` · `gowipe` · `daryl-davis`

## How to do it

1. For each project write one sentence: what a visitor should understand from the poster alone. Keep the fourteen sentences for the final report.
2. Generate two or three candidates per project. Typeset the names. Make one contact sheet of all candidates at card size and one at board size.
3. Choose the strongest for each project and carry on. Everything is a hidden draft and each poster is a new file beside the old one, so the choice is easy to change; the owner sees the chosen poster and the alternates together at the end.
4. Export each chosen poster to `public/library/artwork/<slug>-poster-v2.webp`. Use a new filename; never overwrite an existing file, because the media record and caches point at the old name.
5. In the office (`npm run admin:local`, port 3078): **Media & artifacts → Bundled artwork**, select the file, give it a title and alt text, register it. Then **Library → Books & pages → Cover artwork** for the book, and the cover on the project. The office audits and snapshots each change; do not write these rows by hand.
6. Look at every one in every place in the table above, on desktop and at phone width: `http://127.0.0.1:3078/admin/library/preview#book/<slug>` shows the board as the book comes off the shelf and the title page when it opens.
7. `npm run typecheck; npm run lint; npm test; npm run test:browser`.

The house book and the shelf names are not part of this; ask before changing them.

## Content to curate and replace inside the books

Seen in this session's review; the owner should point at the worst first.

| Problem | Where | What to do |
| --- | --- | --- |
| Screenshots that end in the middle of something | The captures themselves are viewport grabs that stop mid-headline or mid-row. Example: `gowipe-home.webp` ends through "MADE WITH GOOD SH*T"; `gowipe-collection.webp` ends through the second row of products. Check every `*-home`, `*-collection`, `*-product`, `*-talks`, `*-developers` and similar file in `public/library/artwork/`. | Capture again and crop on a natural edge of the page (the end of a section), or compose a deliberate detail. New filename, register, replace in the book's image block. |
| Film previews | The six `*-poster.webp` files. | Use a frame that shows the product in use, never a loading state. The page now shows a clean preview with one play mark; the browser's controls appear only after the visitor starts the film. |
| Diagrams that cannot be read on a page | Every `*-architecture.webp`: many small labels shrunk to a column about 350 px wide. | Redraw each with fewer, larger parts for the page, and keep the detailed version for the enlarged view. |
| Pages where the writing stops early | Short closing sections and sections that break badly across pages. | First fix what layout can (see [pathway A](PATHWAY_SHOWCASES.md), section 3); then edit the text itself where a section is too thin to stand. |
| Thin or repetitive text | Summaries that repeat the overview; measurement pages with a handful of numbers. | Propose edits to the owner as a list per project. These are his words about his work: change them only with his approval, through the office. |

## What was changed in this session for this work

- The 3D book now shows the whole poster as its front board (it was a square crop on leather).
- Words on a turning leaf are printed darker, so a page no longer looks washed out or smudged while it turns.
- Films on a page wait as a clean preview with a play mark instead of sitting under the browser's controls.
