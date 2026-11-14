# Staged project artwork · November 2026

This is a review edition, not an office/database import. The owner’s existing words and records remain intact. `staged-media.json` is the exact allowlist used by `lib/library/showcase-draft.ts` after its caller authorizes each volume. Do not apply it to an unfiltered collection.

- `contact-card.jpg` and `contact-board.jpg`: chosen and alternate for all fourteen projects.
- `concepts.json`: the one-sentence visual intention for each poster.
- `generation-prompts.json`: the built-in imagegen prompts and generated-source paths.
- `masters/`: 26 original generated images, two for each of thirteen projects.
- `typeset/`: both final 1440 × 1800 masters for each project, exact office titles.
- `film-frames/contact.jpg` and `frames.json`: candidate original-film frames and times.
- `section-captures/sources.json`: source routes and measured full-section bounds; failures are retained as evidence.
- `source-captures.jpg`, `source-review-large.jpg`, `full-source-review.jpg`, `replacement-captures.jpg`: working source-review boards. The replacement board predates the final six section recaptures; `staged-media.json` is authoritative.

The generated art is conceptual illustration, not a product screenshot. Native generated source sizes are recorded in the manifest (approximately 1122 × 1402); the 1440 × 1800 typeset masters are resampled compositions, not claims of native generation resolution. Chosen deliveries are all 960 × 1200 WebP, with a maximum measured size of 147,662 bytes.

Daryl Davis is the deliberate image-generation exception required by the brief. Both alternatives use only owner-supplied material. The chosen poster uses a real frame at 6.43 seconds from the supplied original homepage film; the alternate uses the supplied website capture. No likeness was synthesized. His live Shopify booking URL returned “This store is currently unavailable” during the final recapture, so that failure image is retained only here and is never mapped into the library.

Selected poster variants are A except GoWipe and Vantage Movers (B). The common title treatment unifies the set; imagery differs across source verification, clocks/workflow, learning, a research archive, biotech, gated ingestion, podcast transcripts, market access, the Library, studio services, lead attribution, moving journeys and wipes.

The staged manifest has fourteen posters and forty-one exact replacements: fourteen diagram overviews, twenty-one screenshot sections/details, and six video previews. Diagram replacements set `ownPage` and retain the original detailed diagram through `detail`. Every text label comes from the authored account; the simplified views deliberately do not invent a full topology.

Reproduction, using existing local sources:

```powershell
node scripts/showcase-inventory.mjs
python scripts/prepare-showcase-films.py
node scripts/capture-showcase-sections.mjs
python scripts/prepare-showcase-artwork.py
```

Inventory runs a read-only transaction. The other commands write staging/public asset files only. The image generator is not invoked by this reproduction script; original generations are preserved in `masters/`. The script sets exact titles and performs the requested natural-edge crops and diagram typesetting.

Films use original frames: Mission Control #2 (6.42 s), AI Engineer research library #1 (2.11 s), Daryl original homepage #2 (6.43 s), GoWipe #3 (9.82 s), Overtech #1 (2.11 s), Vantage Movers #1 (2.11 s). No loading-state image was selected.

Remaining media limitations: `daryl-davis-booking.webp` cannot be recaptured from the currently unavailable store. `overtech-digital-services-service-ai.webp` remains the old viewport capture because its documented source, `127.0.0.1:3055/services/ai`, refuses connections; no server was started. The Vantage dashboard captures (`vantage-movers-desk/activity`, `vantage-lead-analytics-team/rep/numbers/performance`) are retained: no reproducible authorized source route is recorded in the capture manifests. Some dashboard rows/panels continue below their viewport and their smallest raster text is unqualified. These need a complete owner-provided capture or a future authorized source session. Do not substitute fabricated interfaces. Public Vantage hero captures and the course-world image remain original and visually whole at their intended viewport.

The final at-rest book audit now uses `applyShowcaseDraft`: `.local-library/showcase-review/qualified-staged/index.html` contains all fourteen books at desktop and phone width, with no measurable page-layout/media faults. Earlier `pages/` and `reports/` screenshots show the prior artwork edition, and `final-staged/` is a diagnostic run interrupted by hot reload. The genuine source limitations above remain; a passing DOM-fit audit does not repair source pixels or qualify physical devices/turning-paper print. See `docs/PATHWAY_SHOWCASES.md` delivery record and `docs/PROJECT_REPORTS.md` for integration, authoring and editorial proposals.
