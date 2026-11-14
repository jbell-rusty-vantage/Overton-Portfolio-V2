# Books and viewing folio · November 13, 2026

The owner's book-first correction is implemented and integrated in the local draft. All fourteen project books have larger, opaque native reading surfaces; page ranges reach the actual last page; the modern computer has been replaced by a Blender paper folio; and a separate Soccer highlights collection presents all nine existing clips. This pass did not publish, deploy, import media, migrate the owner's database, commit or push.

## What changed for the visitor

- A fresh pickup from the shelf or directory starts on page 1, even when a later page is saved. Only **Return to my place** deliberately resumes that bookmark; explicit page links, reloads and returning from a full report retain their position. The owner's follow-up exposed a missed reopening case: Mission Control's saved page 17 was being supplied to every selection. The browser regression reproduced that exact result before the selection handler was corrected.
- Desktop spreads say **Pages 1–2 of N**, **Pages 3–4 of N**, through **Pages N−1–N of N · End**. Phone pages count one at a time. Rapid repeated turns cannot skip an unfinished spread; reversing a leaf still works.
- Resting text and media sit on opaque paper in the browser's native 2D compositor. The book is held square to the eye and fills more of the view. Body text is 18 px before screen scaling on desktop, 17 px on phone. The moving 3D leaf still carries the printed page during a turn.
- The engine and DOM now share updated page metrics after viewport changes. A request to remove printed ink during a turn is retained until landing. Unmounting invalidates outstanding turn completions. These changes remove known opportunities for stale printed surfaces to compete with native content. The owner's exact intermittent GPU artifact was not independently reproduced before editing; the resulting readable-surface invariant was verified throughout the animated audit.
- Images still open at full size, book videos play inline with native controls, and **Full report** opens the complete project report and returns to the marked page. Overtech's embedded recording was played and visually inspected with the adjacent image remaining visible.
- A walnut stand with layered rag paper and brass clips replaces both the monitor and laptop. Its printed index opens **The viewing folio**, with project recording, case study and **Soccer highlights · 9 clips** collections. A paper-and-wood fallback also replaces the computer when the Blender kit is unavailable. The cabinet's loading and plain-view pictures were refreshed from the current room.
- Soccer clips are grouped by match, with thumbnails, notes, previous/next, a large native player and full screen. Selection has its own URL, survives reload, and works with Back/Forward. Only one player is mounted. Switching or leaving stops playback. The legacy `#screen/film` link selects the free kick inside the full collection. The plain cabinet uses the same complete catalog.

## Proof

| Requirement | Current evidence |
| --- | --- |
| Fresh pickups begin at page 1 | Follow-up regression first reproduced Mission Control reopening at page 17. Desktop and emulated-phone tests now pass for shelving/reopening and a persisted bookmark followed by reload/directory selection. A separate test confirms explicit **Return to my place** still resumes; the office report-return check also passes. |
| Complete, ordered books | Animated audit of all 14 real draft volumes at 1366 × 860 and 390 × 844; 255 views / 334 physical pages; every folio visited once in order; final range includes final number |
| Readable content remains present | Every audited settled view has native ink active and opaque paper; zero blank pages, overflowing/clipped prose, missing images, cropped/distorted media or covered toolbar buttons; no browser errors |
| Handling and resizing | Nine book browser tests pass: measured layout, animated clicks/reversal, drag turn/cancel, selection/link/enlarge, carrying/return, reload/deep links, phone taps/swipes, rapid input/final page, desktop↔phone resize |
| Complete report experience | Five report checks pass, including all 14 reports at both widths, full figures, linked sections, cabinet warm-up and book↔report↔same page through Escape/history/reload |
| All soccer videos | Desktop and emulated-phone tests play all nine H.264 clips, check decoded dimensions and advancing time, single-player isolation, selected URL, Back/Forward, reload and return to cabinet. The actual plain cabinet was also opened, its nine choices counted and its free kick played. |
| Large media/native controls | Project recording browser check passes; legacy free-kick/fullscreen test passes; keyboard controls in the folio do not move the camera |
| Blender replacement | Editable `.blend` saved/reopened; detailed and compact GLBs validate with 0 errors/0 warnings; all six kit contracts pass; visual checks in Blender and live room, including `?kit=off` fallback |
| Build quality | Typecheck passes; ESLint has no errors (three unrelated existing warnings in content-builder/portrait tests); changed-file lint is clean; 68 contract tests pass; final migration-free `npm run build:local` passes |

The page audit records one short prose page (21% fill) and flags video pages for inspection. It does not measure the smallest raster text in 100 screenshot/cover placements; those remain previews with full-size image/report access. These are not blank/clipped-page failures. Phone checks are browser emulation, not a physical-device qualification. There is no deployment or production-release claim.

Raw audit: [coverage](travellers-rest-review/book-folio/coverage.json), [desktop page measurements](travellers-rest-review/book-folio/report-desktop.json), [phone page measurements](travellers-rest-review/book-folio/report-phone.json), [summary](travellers-rest-review/book-folio/summary.txt). Every spread screenshot remains in `.local-library/books/animated-reading/`.

Selected visual evidence: [last Knowledge Services pages](travellers-rest-review/book-folio/knowledge-last-pages.png), [Overtech media pages](travellers-rest-review/book-folio/overtech-media-pages.png), [integrated cabinet](travellers-rest-review/book-folio/cabinet.png), [soccer desktop](travellers-rest-review/book-folio/soccer-desktop.png), [soccer phone](travellers-rest-review/book-folio/soccer-phone.png), [code fallback](travellers-rest-review/book-folio/folio-code-fallback.png), [Blender asset](travellers-rest-review/kit/viewing-folio.png).

## Reproduce and maintain

```powershell
npm run test:books
npx playwright test tests/browser/folio.spec.ts
npx playwright test tests/browser/estate.spec.ts -g 'viewing folio'
npx playwright test --config tests/reports.config.ts
$env:BOOK_AUDIT_MOTION='animate'
node scripts/audit-book-pages.mjs .local-library/books/animated-reading both
npm test
npm run typecheck
npm run lint
npm run build:local
```

The book and folio browser suites use disposable data on port 3077. The report suite and complete page audit read the existing authorized office on port 3078 without modifying its records. Windows browser tooling uses the installed Program Files Chrome or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Book code: `Reader.tsx`, `book.css`, `sheets.ts`, `engine/volume.ts`, `engine/engine.ts`. Folio code: `Folio.tsx`, `folio.css`, `World.tsx`, plain `Cabinet.tsx`, and `lib/estate/world.ts` route parsing. Clip metadata remains in `lib/performances.ts`; all nine MP4/poster pairs already existed under `public/performances/`. The older single-film program cue is retained for tour/legacy compatibility; it no longer limits the visible collection. Asset source and rebuild instructions are in [the kit README](../assets/travellers-rest/kit/README.md).
