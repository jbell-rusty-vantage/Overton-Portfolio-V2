# Showcase first edition — November 13, 2026

The first edition is implemented in the local portfolio: a designed 2D entry, six substantial case studies, task walkthroughs, direct résumé access and shared reports/books. It is ready for editorial review. Publication, client disclosure and hosted qualification remain the next milestone; this session did not import content into PostgreSQL, publish books, commit, push or deploy.

Start the next session with [final organization and deployment readiness](FINAL_ORGANIZATION_AND_DEPLOYMENT.md). The [original assignment](SHOWCASES_AND_2D_NEXT.md) is retained as the scope record.

## Review the actual result

The existing local office is reused on port 3078. Its private view applies the new writing only after authorization. The public `/projects` uses the normal public collection; it currently offers the résumé while the selected books remain unpublished.

| Destination | Local review |
| --- | --- |
| Designed selected work | [First-edition preview](http://127.0.0.1:3078/admin/library/preview?portfolio=1) |
| Public entry and visibility | [Selected Work](http://127.0.0.1:3078/projects) |
| Accepted résumé | [Web résumé](http://127.0.0.1:3078/resume) · [PDF](http://127.0.0.1:3078/john-overton-bell-resume.pdf) |
| Vantage Movers | [Case study](http://127.0.0.1:3078/admin/library/preview?read=vantage-movers) |
| GoWipe | [Case study](http://127.0.0.1:3078/admin/library/preview?read=gowipe) |
| Overtech / Research Agent | [Case study](http://127.0.0.1:3078/admin/library/preview?read=overtech-digital-services) |
| Mission Control | [Case study](http://127.0.0.1:3078/admin/library/preview?read=agentic-mission-control) |
| AI Engineer Platform | [Case study](http://127.0.0.1:3078/admin/library/preview?read=ai-engineer-platform) |
| Knowledge Services companion | [Case study](http://127.0.0.1:3078/admin/library/preview?read=agent-knowledge-services) |
| Corresponding physical books | [Cabinet](http://127.0.0.1:3078/admin/library/preview#cabinet) |

## What changed

`/projects` is now an editorial entry with parchment, forest-green ink and serif typography, real product imagery, selected studies, further reading, contact and the optional estate visit. The front door exposes **Browse portfolio**. Résumé sits beside Selected Work; its entries add report links only when the normal public collection permits them. The accepted PDF/content were not rewritten.

The entry is a Server Component with a small client fragment/history helper. Neither it nor an inline report mounts the 3D scene. Back and the Selected Work return link restore the selected card, including when the collection streams in after navigation. The text catalog remains the lightweight scriptless route. The office preview and inline report expand to the full available width.

A compact **History of Travellers Rest** article follows the optional library entry. It carries the supplied account from Overton's legal career through emancipation in 1865 in plain text, with museum, William/Franklin record and National Archives links. Reading the complete ending requires no 3D entry.

Six studies in [content/showcases](../content/showcases/) replace vague capability lists with problem, role, decisions, a bounded task, sources and limits. Their existing slugs and section keys remain unchanged. New numbered reading maps show actual source boundaries. Five new screenshots show public quote steps and a guest commerce task; they contain no entered contact information or customer records. Generic scroll films and unreproduced Vantage dashboard pictures are omitted from the featured writing. The Mission Control film remains a clearly dated recording with adjacent written task guidance.

The writing is staged by [showcase-writing.ts](../lib/library/showcase-writing.ts), before the existing artwork remapper. It only transforms authorized admin volumes. Original summary, title, tags, status, section titles and blocks must still match the baseline. A changed owner record is left intact. Public views do not apply this writing overlay. The owner database is unchanged.

Office content now supports a `Heading` with `label: "section-title"` to name a section without changing its citation key. A `Metric` labeled `Status` supplies the authored report status. The promotion package preserves all roles and uses authored page mode to preserve reviewed order. These are JSON block/projection changes, with no schema migration.

## Evidence behind the five résumé groups

Observed November 13, 2026. Local source was inspected after its owning instructions/handoff. Source repositories were not edited. A remote HEAD is not a deployed binary identity.

| Study | Local evidence and task | Qualification and concrete limit |
| --- | --- | --- |
| Vantage | Clients `f28b496b`, main server `b926311e`, operations `5834a95b`, admin `f9929dff`. Both live sites reached blank contact fields using invented move details. Fresh 51 server + 2 main-site + 5 partner tests pass. | Public pre-submit navigation and synthetic service boundaries. No live lead submitted, CRM acceptance or booking/cancellation run. Sheet Sync precedes CRM and can block its handoff. Clients/server/admin remote HEADs differ; admin contains unrelated dirty work. |
| GoWipe | Live collection → facial wipes → 10-count, one-time purchase → matching guest cart. Final capture `2026-11-13T20:53:05Z`. Eleven event mappings found in delivered HTML; outgoing `page_view`, `view_item`, `scroll`, `add_to_cart`, `view_cart` observed. | No checkout or order, analytics destination ingestion or conversion lift claim. Theme checkout not located. John's engagement is 2021–early 2025; current store imagery does not attribute later changes to him. |
| Overtech | `Digital-Services-Business` at `e765ad1` with substantial changing working-copy content. TruDiagnostic archive hash `c49fa4620f4a208db05d18b566d6cf678c8bf1060bb393738bd3f19c4707585f`, captured November 9. Archive validation passed twice; 8 local workspace/media/auth tests pass. | Public studio still **Coming soon**; research endpoint **Ready** establishes health only. Deep Agents archive reader and newer private Eve workspace are separate systems. No new hosted research run. Private business cases and raw recorder data were excluded. |
| Mission Control | Runtime `809a0184`; separate web `307208d0`. Real November 9 Deep Agents GoalDirected run `46a07025-9d37-5d3b-9d8d-96fec5627975`: manifest → executor → verifier → both output obligations fulfilled → human review resolved → completed. Fresh 77 manifest tests pass. | Recorded bounded integration, not current hosted or general multi-provider qualification. $0.02699 is an upper cost estimate, not an invoice. Current Sprint OC W1 remains unreleased. Public runtime revision observed was `882b77da`, different from inspected local source. |
| AI Engineer + Knowledge Services | Service `ad84c4f8` matches observed remote. Dated November 5 Build 06 real disposable API/MCP/CLI integration; fresh 36 service unit tests pass. KS local `b548468d`: 19 exact-use/aggregation + 9 retrieval-boundary tests pass. | API/MCP/CLI fixture paths and deterministic claim rules, not a shipped student app or new ingestion-to-live-retrieval run. Student web `53f81944` remains disconnected. KS remote `0abcecf4` differs. Required graph expansion is explicitly unsupported; investor tools remain planned. |

### Retained source reports and reproducibility

The ignored [local evidence directory](../.local-library/showcase-2026/) retains `vantage-evidence.md`, `belllabs-evidence.md`, `overtech-gowipe-evidence.md`, `remaining-inventory.md`, scoped hashes/observations, raw captures and the live task scripts. These reports give exact checkout paths, source files, commands and test boundaries. They are authoring evidence, not public assets. `.firecrawl/` is ignored to keep raw public-site responses and incidental identifiers out of commits.

New deliverables: `content/showcases/{vantage,commerce-studio,belllabs}.json`; `public/library/artwork/*-architecture-v3.webp`; `vantage-main-{02,03}-v3.webp`, `vantage-landing-02-v3.webp`, `gowipe-selected-v3.webp`, `gowipe-cart-v3.webp`. Diagram source is [build-showcase-diagrams.mjs](../scripts/build-showcase-diagrams.mjs). Original approved posters and Mission Control footage remain reused assets.

## Full collection disposition

The implemented primary order follows the brief: **Vantage → GoWipe → Overtech → Mission Control → AI Engineer → Knowledge Services**. Knowledge Services is a technical companion to the AI Engineer résumé group. The next session can make the final editorial order without changing record identity.

| Existing book | First-edition disposition | Evidence / remaining proof |
| --- | --- | --- |
| The Library | Supporting project; separate primary navigation destination | This checkout, shared collection/report policy and current browser proof. Earlier 3D/portrait release limits remain in their handoffs. |
| AI Engineer World's Fair | Supporting reader, distinct from the student product | `agents_dashboard` `f35c7d9d`, static briefs and retained film. Refresh public talk→brief→source journey and clarify automated/non-reviewed research. |
| Biotech Knowledge Platform | Secondary technical depth; release held | `biotech-knowledge-services` `c55d07ac`, local schema v2.2.0 vs documented Fly v2.0.2; November 7 deploy hold. Needs an approved disposable intent→receipt/readback and later version-aligned hosted proof. |
| Biotech Research Ingestion | Historical / superseded | Canonical runtime retired and absent; retained presentations only. Needs original source or dated execution trace before a stronger current claim. |
| Human Upgrade Ingestion | Secondary historical data engineering | Worker `fe74dd8b`, infrastructure `1f3fc9ac`, both dirty. Needs sanitized single-episode/retry proof and cloud status before claiming current operation. |
| Vantage Lead Analytics | Appendix within Vantage, not a second flagship | Shared server/admin source. Needs synthetic metric examples with time windows/attribution and newly reproduced isolated dashboard media. Do not run production analytics under assumed test isolation. |
| Polymarket MCP | Defer primary placement | Source `0fe7b420`, dirty. “Paused” portfolio vs “active” README and differing live-action gate descriptions need resolution; no wallet or trading run performed. |
| Daryl Davis | Optional client archive, pending contribution/media review | Supplied footage and old captures, no theme checkout located. Prior booking source unavailable. Removal from the résumé is not a site-wide ban; nothing was deleted or hidden. |

These eight remain visible in the authorized draft's Further reading section. Their older prose is not newly qualified by this writing pass. Normal publication policy controls any public appearance.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed with no errors; the existing unused `_` warning in `scripts/build-library-content.mjs` remains.
- `npm run build:local` passed, with no migration execution.
- Portfolio content contracts pass: no inserted records, owner edits preserved, every block/media path validates, section identities survive promotion.
- All 79 repository contracts pass. `pdfinfo` confirms the accepted PDF remains two US-letter pages (612 × 792 points).
- Thirteen focused browser scenarios passed: six report/card journeys at desktop and 390px, keyboard skip/navigation, résumé/PDF response, hidden URLs, explicit media playback, all fourteen reports' natural images and layout, figure focus/Escape, warm-up, all six revised books returning to their marked page at both widths, and report return through Escape/Back/reload.
- Browser runs exposed and fixed streamed-fragment and browser-Back restoration bugs. Tests now address stable section keys instead of old headings/media that the new writing intentionally replaced.
- Screenshots are in `.local-library/showcase-2026/visuals/`; the browser result JSON is `.local-library/showcase-2026/browser-results.json`. Capture command: `node scripts/capture-portfolio.mjs`.
- The six-book at-rest audit passed across 191 rendered desktop/phone pages: no blank or sparse pages, clipped text, horizontal/vertical overflow, folio collisions, missing images or cropped figures. The final Knowledge Services label/caption refinement was separately rechecked across its 29 pages. See `.local-library/showcase-2026/books-final/index.html` and `ks-final/summary.txt`. The two video flags are informational. Screenshot raster text remains unmeasured in 44 image occurrences; use the report's enlargement for fine UI detail. Diagram main labels are at least about 12.6 page pixels at the measured phone sizes (Knowledge Services 13.2), separate from their smaller decorative stage numbers.

Phone results are browser emulation on this workstation, not physical-device qualification. New live-provider or hosted portfolio qualification was not performed. The office's existing no-JavaScript streaming limitation remains; `/catalog` is its scriptless alternative.

## Review package, not an import

Run `node scripts/prepare-showcase-promotion.mjs` to regenerate `.local-library/showcase-2026/promotion-plan.json`. It validates referenced local assets and records SHA-256 hashes, expected source content, six replacement page sets, authored page mode, role/status, and cover choices. It has no database client and performs no uploads or writes to external systems. The next session should review drift/disclosure and use the audited office path to promote the exact content. Do not seed the owner's database with test fixtures.
