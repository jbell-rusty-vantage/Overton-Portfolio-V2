# Authoring project reports

**November 13 writing edition:** six source-grounded studies now live in `content/showcases/`, applied by `applyShowcaseWritingDraft` only after admin authorization and only while the baseline summary/title/tags/status/section titles/blocks still match. Public projection does not apply them. See [delivery](SHOWCASES_AND_2D_DELIVERY.md) and [promotion handoff](FINAL_ORGANIZATION_AND_DEPLOYMENT.md). The earlier statements below about unchanged prose describe the artwork-only pass.

For stable custom section names, put a `Heading` first with `props: { "text": "Walkthrough: inspect a finding", "label": "section-title" }`. It names the leaf without becoming duplicate body text or changing `template_code`. A `Metric` with label `Status` supplies authored report status; `Role` supplies role. Use authored page mode to keep curated order. `node scripts/prepare-showcase-promotion.mjs` prepares a read-only package with these markers, baseline values and asset hashes. `npm run test:portfolio` validates content and the integrated private journey using the already-running office.

A project has one authorized `Volume`. Its poster, title, summary, page blocks and client label feed the book, cabinet, plain reading page and full-screen report. The report uses the same `ProjectReport` component in the world and at `/projects/<slug>` or `/books/<slug>`. Editing a separate report document is unnecessary.

## In the office

Use the existing local office at `http://127.0.0.1:3078/admin`. Edit the project title, summary, status, dates, client disclosure and links, then its book under **Library → Books & pages**. Each book page becomes a report section. Give pages useful titles and keep their stable page/template keys: citations and shared report links use `Leaf.key`, never page numbers or a heading-derived slug. Printed folios can change when content or screen size changes.

The office audits writes and keeps revisions. Visibility and activation still apply to the project and its book. A client alias and redaction policy must be set before publishing. A hidden report is not made public by guessing its URL. Preview only shows what its existing authorization permits.

The November 2026 artwork edition is **staged locally, not imported into the database**. `applyShowcaseDraft` changes exact old media addresses on volumes already authorized by its caller. It preserves prose, links, keys, visibility decisions and newer owner cover selections. The coordinator enables that edition only in the authorized local preview. An eventual office import is a separate owner-authorized operation.

## Blocks

| Office component | Report | Printed book |
| --- | --- | --- |
| Prose | Selectable paragraphs at a comfortable measure | Paragraphs split at word boundaries |
| Heading | Subheading inside its section | Kept with following text |
| Metric | Adjacent metrics form a designed group | Compact labeled values |
| Code | Horizontal scrolling, preserved whitespace | Monospaced print |
| Link | Named destination, external links open separately | Named source link |
| Image | Whole natural image, caption, enlarge action | Whole natural image with a small margin bleed |
| Video | Native controls, optional captions/transcript | Clean poster until play; native controls after play |

Use the existing blocks JSON editor for optional fields. The validator supports these without schema changes:

```json
{
  "component": "Image",
  "props": {
    "url": "/library/artwork/agentic-mission-control-architecture-v2.webp",
    "text": "The working parts of Mission Control.",
    "ownPage": true,
    "detail": "/library/artwork/agentic-mission-control-architecture.webp"
  }
}
```

`ownPage` reserves a printed page for the figure (a preceding section heading can share it). `detail` opens a more detailed original when enlarged, while the readable overview stays in the book/report. These fields apply only to Image. Image URLs must pass the existing approved-media policy.

```json
{
  "component": "Video",
  "props": {
    "url": "/library/recordings/agentic-mission-control-reel.mp4",
    "poster": "/library/artwork/agentic-mission-control-reel-poster-v2.webp",
    "text": "Inspecting the recorded research episode.",
    "captions": "/library/recordings/mission-control.vtt",
    "transcript": "https://example.com/mission-control/transcript"
  }
}
```

The caption/transcript paths above illustrate authoring; no transcript or caption file was invented or added. Omit these fields until a real file exists. Captions accept a safe bundled `.vtt` file or an approved public blob URL; transcripts require HTTPS. Video `poster`, `captions` and `transcript` do not apply to other block types. Captions are currently labeled English; other languages need a future language field before publication.

## Mission Control worked example

Keep the owner’s existing account of the problem, durable missions, workflow/provider boundaries and recorded research episode. Use the overview for the purpose and personal role; architecture for the components and their boundaries; evidence for the actual episode, its original source links, screenshots and film; and sources for the external destinations. Preserve the existing section keys when rearranging the writing.

The staged poster uses a coordinating clock and distinct stations. The simplified architecture image has four large labels taken from the authored account: **Mission manifest**, **Workflows**, **Provider lanes**, **Output contracts**. It is a reading map, not a claim to show every connection. Enlarging it reveals the existing detailed original. The selected film preview is a real recorded citation inspection at 6.42 seconds. The replacement case-study and episode pictures recover complete cards from the existing full-page captures.

The role in the report header comes from the existing `Role` or `My role` metric. Dates come from the project record. Status prefers an authored status tag (for example, “In development”) over the generic record status. Missing facts are omitted; the renderer does not invent them.

## Media specifications

- Posters: 4:5, typeset master 1440 × 1800, delivery 960 × 1200 WebP under approximately 150 KB. Keep important art/title within the middle 86% of the width. Exact office title, no small paragraph copy. Generated illustrations are concepts, never fabricated product screenshots or client likenesses.
- Screenshots: capture a complete section or deliberate complete component. End at a natural boundary. Keep a full original for enlarging when a readable overview needs less detail. Do not treat CSS `contain` as proof that the original capture is complete.
- Diagrams: prefer a few large parts. The staged diagrams use a 1200 px source width and at least 52 px lettering, approximately 13.26 px at a 306 px rendered width. Keep dense original diagrams available through `detail`.
- Film: preserve the original aspect ratio; choose an actual frame that shows useful behavior. Supply an accurate caption file and transcript when available. No autoplay.
- Enlarged figures retain natural pixels, scroll/pan and browser pinch zoom. Desktop Escape closes the figure and restores focus to its trigger.

## New-project checklist

1. Author the project and book together; confirm title, role, dates, client disclosure, visibility and activation.
2. Write one useful summary, then sections with stable keys. Keep evidence and limitations beside the relevant claim.
3. Register new media through the office with titles and meaningful alt/caption text. Use new filenames; retain originals.
4. Check the card, 3D cover, title page, plain report and overlay use the same projected poster/title/summary.
5. Read all book pages on desktop and phone. Check the source pictures themselves, then enlarge them. Test video playback, captions and source links.
6. Open a report from a later book page; close by its button, Escape and Back. Reload a report URL and verify the marked-page return. Check keyboard focus, reduced motion and direct hidden URLs.
7. Run the focused report tests and the all-book audit below before the coordinator’s complete release checks.

```powershell
npx tsx --test tests/reports.test.ts
npx playwright test tests/browser/reports.spec.ts
node scripts/audit-book-pages.mjs .local-library/showcase-review/final both "" http://127.0.0.1:3078/admin/library/preview
node scripts/contact-book-pages.mjs .local-library/showcase-review/final
```

The audit measures layout bounds, trailing empty space, actual image fit/cropping, missing media and known raster-text size. Unknown screenshot text size is reported as unknown, not a pass. It cannot prove a screenshot ends at a natural source boundary; read the contact sheets. The office is reused, never restarted for these checks. For checks that must not start the sample server, use `npx playwright test --config tests/reports.config.ts`; it reuses port 3078 directly.

The report’s prose/links are present in the server HTML. The existing office streaming Suspense wrapper nevertheless stays at “Opening the ledger…” with JavaScript disabled. No-JavaScript office usability is a known host limitation; it was tested and failed, not qualified by the server-rendering assertion. Physical phone pinch gestures and assistive-technology speech output also require manual device checks; keyboard focus containment and Escape were automated.

## Proposed writing edits for the owner

No owner prose was rewritten. These are suggested additions or consolidations, not proposed invented outcomes.

| Project | Proposed next editorial pass |
| --- | --- |
| Mission Control | Consolidate the summary/overview repetition; explain one recorded mission from admission to reviewed artifact, with an explicit limit on what that evidence proves. |
| Knowledge Services | Walk one source through capture, quote verification, admission and retrieval; keep the relationship to Mission Control in one concise section. |
| AI Engineer Platform | Separate the current working platform from planned learning environments; describe one complete learner task and the evidence available for it. |
| AI Engineer World’s Fair showcase | Use one talk to explain the transcript-to-brief stages and the limits of machine-generated research; avoid repeating catalog totals in multiple sections. |
| Biotech Knowledge Platform | Give one validated intent and its receipt, then explain what the transaction guarantees and what still requires human judgment. |
| Biotech Research Ingestion | Show one plan approval and the resulting workflow; distinguish implemented stages from planned ones. |
| Human Upgrade Ingestion | Add one episode example with provenance, transcript storage and retry behavior; contextualize the existing counts. |
| Polymarket MCP Server | Explain one read workflow and one gated action, with authorization and rate-limit boundaries; state current deployment/use evidence. |
| The Library | Tell one visitor journey and one office publishing journey; link the scene to its content and privacy rules without repeating the architecture list. |
| Overtech Digital Services | Pick one concrete inquiry-to-conversation journey and explain the owner dashboard’s role; shorten repeated service listings. |
| Vantage Lead Analytics | Define each metric’s time window and attribution rule; use a redacted worked example and distinguish reporting from causal claims. |
| Vantage Movers | Walk one permitted lead from quote through CRM and booking/cancellation; consolidate repeated system lists and confirm disclosure choices. |
| GoWipe | Explain one merchandising decision and its event trail; add dated, supported outcomes only if the owner has evidence. |
| Daryl Davis | Explain how speaking, music and book visitors reach the correct action; distinguish the owner’s work from supplied client material. |

## Integration contract

`lib/library/report.ts` exports pure `reportSections`, `resolveReportSection`, `reportSectionId` and `reportNeighbors`. Only actual `Leaf.key` values resolve; an invalid explicit section returns null. Portrait citations should resolve through these helpers after receiving the authorized `Volume`.

`ProjectReport` accepts `volume`, optional `admin`/`source`, `section`, `onSectionChange`, `onClose`, `neighbors`, `onProject`. Providing `onClose` opens a full-screen native dialog; omitting it renders the same report inline. Native dialog handles focus containment and Escape. The caller owns route history, authorization and world/audio suspension.

Inline “Open book” links retain the supported host route: authenticated office reports use `/admin/library/preview#book/<slug>`; public and sample reports use `sceneHref` (wrapped by `withinPreview` for samples). A public project may be published without an estate program, so its book link cannot assume the continuous house exists. World-mounted reports use the caller's existing book/report callbacks.

`Reader` adds optional `onReport(section)` and `suspended`. Keep the same mounted Reader and volume identity while the report covers it; `suspended` makes it inert and stops its gesture/keyboard handling without resetting the current pages. Store the stable leaf/part return marker in the report route, separate from the report section. Closing restores that book route. Direct report arrivals must hold the corresponding book first. `engine.volume`, `engine.setInk`, turn/hold and `paintSheet` contracts are unchanged.

The coordinator owns `#report/<slug>/<section>`, Back/reload/shared-link behavior, the World mount, renderer/audio pause, and cross-project transitions. Pass neighbors from the already-authorized projects collection. In the office inline reader pass `volumes={data.volumes}` so previous/next links have the same authorization scope.

`prepaginateVolumes(volumes, metrics, layoutFor)` is exported from `paginate.ts`. Warm the cabinet’s projected volumes with exactly Reader’s metrics/layout (single-page mode, author, series, detail link and `markup.report: true`), after fonts are ready. Retain stable Volume object identities; the cache is a WeakMap keyed by volume plus layout. Return its cleanup from the mount effect. Scheduling does no engine or database work.

Cleanup cancels future books immediately and keeps an in-flight measurement surface attached until its current work finishes. A delayed-image browser regression covers selecting another book during this wait. The final staged-art at-rest audit and all-page contact-sheet index are linked in the final qualification section of [the pathway delivery](PATHWAY_SHOWCASES.md).

The default Playwright suite starts `scripts/test-browser-server.mjs` on loopback3077. It applies migrations to in-memory PGlite, seeds the exact two starter IDs with the checked-in authored book pages and hidden estate records, and overrides both database URLs before launching Next in `.next-browser`. It refuses to reuse another server. These records are disposable and retain inactive ingestion/hidden display states; no owner's database is read or written by the harness. The explicitly addressed all-fourteen `reports.spec.ts` and `visitor.spec.ts` checks still require the existing authorized office3078 and only read it.
