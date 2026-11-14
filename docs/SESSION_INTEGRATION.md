# Three-pathway integration · November 12, 2026

**November 13 correction:** “complete” in this record applies to the mock-backed visitor journey, not a finished LLM conversation. The existing paid provider selects source IDs and does not generate replies. The owner expected that capability to be ready to enable; the completion report overstated it. Follow [PORTRAIT_LIVE_NEXT.md](PORTRAIT_LIVE_NEXT.md) for the now-prioritized missing implementation and live qualification. This pass only added draft behavior/request preparation and truthful UI status; paid usage stays off.

The required result is a private visitor journey: entrance → library → project book → full-screen report → same marked page → portrait question → inspectable sources → authorized project destination → Back.

Owner decisions this session: retain the existing portico and the 3.19 m ceiling. Preserve existing uncommitted work. No commit, push, deployment, publication or import into the owner's database is authorized. Run migration tests only on disposable data; use `build:local`.

## Current qualification · November 13

The complete hidden-draft journey is implemented, integrated and locally qualified. A clean full browser run passed **52/52** before the last leaf optimization. The final broad run passed 51; one timing-sensitive gesture assertion was corrected to accept an already-landed reverse while still requiring the original marked page, then passed its focused rerun. All **52 scenarios** have passing evidence on the final runtime. The final production-mode rehearsal passed office/release/withdrawal policy, portrait authorization and desktop/phone-width journeys with no page errors. The continuous actual-office recording also passed. Remaining release decisions and qualification limits are listed below; earlier checkpoints are historical, not the current state.

| Outcome | Integrated behavior and observed evidence |
| --- | --- |
| A · Showcases | Fourteen staged posters and curated replacements; one shared full-screen/inline report; stable actual section IDs; report/Escape/reload/Back returns to the marked page; neighbor report closes to its own book. All fourteen desktop/phone reports passed. The staged page audit covers 232 views/307 pages with no measured defects or runtime errors; 100 raster text measurements remain unknown. |
| B · World | Survey-aligned room/grounds, Blender moving parts, optional 4096 px light bake, bounded reconstructed stair landing, live entrance, shared header, interruptible six-stop tour, daylight/season controls, opt-in atmosphere, physical reach and walk outside. Existing 34 voiced cues remain. Eight June 1829 Jackson scans/transcripts and verified NYPL retained-copy identity are documented in ARCHIVE_VERIFICATION.md. No unsupported upstairs rooms were invented. |
| C · Portrait | Mounted world/plain panel, authorized projected evidence, source inspection, requested real book/report navigation, Stop/Back and media cancellation. Dated private briefing cards and five labeled text-only interpretations. Server-side session/network/concurrency limits, atomic worst-case spend reservation, idempotency and fail-closed provider/storage paths. Default `portrait-extractive-mock-v1`, $0 provider cost; no live-model or dynamic-speech claim. |

Commands and evidence:
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:local`: passed. **64 contracts**, including **27 portrait**, three GPU-readiness and two backing-surface regressions. Lint has one pre-existing unused `_` warning in `scripts/build-library-content.mjs:73`, no errors. Logs: `.local-library/final-{typecheck,lint,contracts,build}.log`.
- `npm run test:browser`: **51 passed plus one timing assertion**, `.local-library/final-browser.log`; corrected `npm run test:browser -- --last-failed`: **1 passed**, `.local-library/final-browser-recheck.log`. This includes report pause/resume, landing/reload/Back, plain fallback, narration clock under reduced motion, tour interruption, phone controls and keyboard isolation.
- `npm run test:admin -- --profile-estate`: passed on disposable PGlite, `.local-library/final-admin-profile.log`. Journey/source/authorization evidence: `.local-library/evidence/integrated-journey/`. Desktop explicitly tests delayed authorized navigation then Stop, fourth-request quota and transport fallback; phone explicitly tests requested report and Back. Actual adapter/provider failures and concurrent last-dollar reservations are in the portrait contracts.
- Read-only `node --env-file=.env --env-file=.env.local scripts/seed-estate.mjs`: passed, **20 planned media records and two rebuilt shell pointers**, `.local-library/final-estate-plan.log`. No `--apply` was run.
- `node scripts/record-estate.mjs`: passed, no page errors; `.local-library/final-recording.log`. The **145.68-second silent screen recording** is [continuous-visit-integrated.mp4](travellers-rest-review/continuous-visit-integrated.mp4); original WebM remains `.local-library/evidence/estate/recording/continuous-visit.webm`. This is the actual authorized office with real project prose, not the isolated fixture. `docs/travellers-rest-review/visitor-proof.json` confirms Mission Control `#book/agentic-mission-control/architecture/3` survived report close, cited portrait guidance and Back. The tour/letters/film/walk outside continue in the same take. Stills include `world-full-report.png`, `world-portrait-sources.png`, `world-portrait-destination.png` and `world-returned-entrance.png`. Recording fixtures serve only exact hash-checked unpublished estate assets; no uploads or owner-data writes occur.

Final production-mode portrait observations: `portrait-extractive-mock-v1`, **$0 provider cost**; desktop browser first/full text **0.14/0.14 s**, phone-width **0.09/0.09 s**; server selection/composition **12 ms / 6 ms** respectively. NDJSON delivers the completed validated answer; these are not live-token streaming or live-model latency claims. Actual adapter contracts use replaced fetch, and real budget concurrency uses disposable SQL transactions. Live provider quality/billing and hosted PostgreSQL remain unqualified.

Production profiling now measures one active 3D visit: the unrelated public-fixture canvas is navigated to blank during sampling, then restored for withdrawal assertions. The profiler retains interval distributions, full wall-clock windows, boundary gaps and entry-ready/preparation time. Prior data remain in `performance-before-readiness.json` and `performance-readiness-background-fixture.json`; no baseline is silently overwritten. These are WebGL2 measurements on this workstation's AMD Radeon GPU, not WebGPU or physical-phone evidence.

Final production frame measurements: Chrome 157.0.8103.52, AMD Radeon (0x15E7), D3D11/WebGL2. Desktop 1366×860/high; phone is 390×844/low emulation on the same GPU. Source: `.local-library/evidence/estate/performance-v2.json`; the intermediate pre-leaf result is retained as `performance-before-leaf-residency.json`.

| Scenario | Desktop | Emulated phone |
| --- | --- | --- |
| Entry click → ready | 5.81 s | 5.53 s |
| Walk in | 60.0 fps | 60.0 fps |
| Portrait speaking | 58.6 fps | 59.8 fps |
| Six real Mission Control page turns | 59.4 fps | 60.0 fps |
| Document inspection | 60.0 fps | 60.0 fps |
| Film playback | 60.0 fps | 60.0 fps |

Desktop p95 frame time was 16.8 ms in all five scenarios. The full 5.002-second walk window had 300 draws, first draw after 7.6 ms and final gap 14.3 ms: the earlier cold stall is removed rather than excluded from the mean. These are observed samples, **not a guarantee of locked 60 fps**; speaking and turns remain slightly below the numerical target in this run. First-use page-render CPU cost fell from 107.1 ms to at most 10.4 ms in the separate focused trace, with unchanged paper resolution. The optional baked-light renderer and physical hardware remain separately unqualified.

Release qualifications still outside this session: owner review of reports, posters, narration/voice and uncertain transcripts; authorized asset import and additive ledger migration; deployment/release; configured live model, explicit prices/caps and bounded live evaluation; hosted PostgreSQL concurrency/billing confirmation; physical phone/gamepad checks. AI/Harvey/access cards were checked November 12 and expire November 20 UTC; infrastructure cards expire December 13 UTC. Refresh before release. Missing restoration drawings, three unavailable source-image routes and the office's no-JavaScript streaming fallback remain documented limits. No archive contact, account change or production spending configuration was performed.

## Ownership and interfaces

- A owns the reader, project projections, reports and posters. `lib/library/report.ts` exports section enumeration and resolution using stable `Leaf.key` values. `ProjectReport` is shared by plain pages and the world overlay. `Reader` receives optional `onReport(section)` and `suspended` props.
- B owns the world, engine, routes, house assets and movement until its handoff. Existing volume, ink, page-turn and holding calls remain compatible.
- C owns isolated portrait modules, API, panel, evidence and tests. It returns validated destination intents; it cannot issue camera coordinates or arbitrary navigation URLs.
- The coordinator integrates world/report routes, portrait mounting and media cancellation, schema/migrations, dependencies and package scripts after the worker handoffs. Only the three original workers may be reused; no additional agents.

## Integration acceptance

1. A report route resolves an authorized book and a real report section. Reader remains mounted with its return marker. Close, Escape, Back, reload and direct entry preserve a coherent book state. Invalid/withdrawn destinations fail safely.
2. Rendering rests while the report covers the world, resumes on close, and does not strand a directly linked book before it settles. Report and portrait keyboard events do not turn the book or move the camera.
3. Portrait audience is derived server-side. Preview flags and aliases cannot expose hidden content; unlisted evidence requires authorized direct context. Prior history, citations and actions are revalidated after withdrawal.
4. Explicit requested guidance executes one validated action through the existing history layer. Suggestions require a button. Stop, a newer turn and duplicate intents prevent delayed navigation. Acknowledgment describes actual success.
5. Opening the panel, reports or other media coordinates with the custodian. Text remains available with sound off, reduced motion and failed 3D.
6. Paid calls fail closed without explicit prices, caps and shared durable accounting. Concurrent reservations, idempotency, provider failure, missing usage, disconnect and storage outage are tested. Deterministic mock demonstration is labeled separately from live qualification.
7. Historical records, project evidence, dated vendor claims and creative interpretation remain distinguishable. Briefing expiry is visible. No visitor-triggered open-ended research.

## Required final verification

Run on the integrated tree: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:local`, `npm run test:browser`, `npm run test:admin -- --profile-estate`, plus portrait authorization/retrieval/navigation/provider/concurrent-ledger checks. Run the estate import plan without `--apply`; record the walkthrough. Capture desktop and narrow-screen journeys, quota exhaustion and provider failure. Record command results and evidence paths in the final handoff; do not equate mock tests or phone emulation with live or physical-device qualification.

This file records the integration contract, not completed verification. Results will be added after the merged-tree checks.

The isolated production rehearsal uses `scripts/test-estate-media.mjs` for unpublished delivery assets. It intercepts only exact inventory URLs, verifies each local SHA-256 and serves the real bytes (including byte ranges). Server interception requires the disposable loopback database and the test harness flag; browser interception is installed only by the harness. Application visibility and scene-validation policy are unchanged. This qualifies local delivery bytes and release logic, not Blob upload or production CDN availability.

The prepared cross-pathway checks are `scripts/qualify-visitor-journey.mjs` (desktop and phone-width book/report/reload/return, cited answer, requested navigation and Back) and `scripts/qualify-visitor-access.mjs` (production-mode public/preview separation, direct unlisted scope, withdrawal, expired login and quotas). They are syntax-checked; they have not run against the integrated UI yet.

Route integration design: preserve the engine's existing book `Focus`, adding optional report metadata to `Route`. Encode a report's actual section plus its underlying book marker in the fragment. A normal report close uses Back when the prior entry is that marked book; direct-link and cross-project report closes replace the overlay with its underlying book. Browser Back remains the actual prior destination. Ignore reader marker writes while the report is open. A directly linked report lets the underlying book settle before pausing the engine. These are planned behaviors until the final route/UI tests pass.

## Coordinator checkpoint before final capture

Implemented and development-browser checked: report route carries section plus underlying leaf/part; Escape, close, reload and Back restore front-matter pages too. Mounted portrait answers, source inspection, requested Knowledge Services book and Back passed without page errors. The CSS-module export was incompatible with the existing all-CSS Turbopack rule; prefixed global portrait CSS now renders correctly at 1366 and 390 px. Live entrance and six-stop authored tour pause/resume/next/manual interruption passed. Shared header, plain report/portrait fallback and atmosphere UI are implemented. Fifty-one contracts passed before the four new environment checks were added to the runner. Full production-mode qualification is still pending.

A completed the all14 page audit. B finished and visually checked the 4096 px bake and bounded stair/landing. The coordinator integrated `#landing`, actual floor-level naming, the reconstruction label, ground-plan suppression upstairs and return downstairs. The same A worker is now correcting the disposable browser fixture and running the broad suite; no new workers were created.

Root correction tracking after A release:
- Implemented: Estate onHash subscribes to tw-route as well as hashchange, so switching to plain view uses the current book/report marker.
- Implemented: cross-project report close replaces with its underlying target book; only a report opened directly from that same book closes with Back. Browser verification pending.
- Implemented: voice start pauses DOM video; unknown cues stop stale narration.
- Implemented: reduced-motion narration retains its audio/silent reading clock while showing full text and keeping the portrait still, preserving pause/resume and completion timing. Browser verification pending.
- Implemented: B's #landing route/API, including same-place descent and repeat destination handling. Ascent/descent/reload/Back browser proof is part of the broad suite.
- Run all required final commands, production fixture journey/auth tests, read-only import plan and extended record-estate walkthrough; update HANDOFF and briefs only with observed results.

Final A audit: all14 desktop + all14 phone, 232 views/307 pages, no runtime errors or measured defects. 100 raster text measurements remain unknown; this is not an OCR claim. The known diagram minimum is 16.81 px desktop / 13.26 px phone. Evidence: `.local-library/showcase-review/qualified-staged/index.html`, summary.txt and coverage.json. A’s delayed-image warm-up regression passed after cleanup refinement.

Qualification finding: an added catalog `activation != inactive` predicate contradicted the documented independent ingestion/display switches and existing policy tests. Removed that predicate; publication, date, deletion, wrapper ambiguity, client redaction and authenticated draft gates remain enforced. The initial full browser run stopped after its two starter books were incorrectly absent. Browser test setup is being moved to disposable PGlite fixtures; the owner database's inactive/hidden states remain unchanged. The production admin rehearsal retains its inactive-but-published client-alias case to verify the intended contract at the actual catalog boundary.

Latest non-browser checks: TypeScript passes; `npm test` passes all 58 contracts; full lint passes with only the existing unused `_` warning in `scripts/build-library-content.mjs`; production `build:local` passes. A later Controls subscription dependency change must be included in the final build. The read-only estate plan passes with 20 media inserts and two shell pointers; no apply was run. Production journey, final performance and continuous recording remain pending at this checkpoint.

## Production rehearsal checkpoint · November 13

The full isolated `test:admin -- --profile-estate` run passed: authenticated office writes/audit/revisions, discovery and direct unlisted rules, scheduled/removed content, client alias/redaction, house release windows and withdrawal, and unchanged unrelated screens. Portrait HTTP proof passed forged preview/citations, hidden discovery, direct unlisted scope, withdrawn source/context/navigation, expired login and quota. These were disposable PGlite writes, never owner-data changes.

Both desktop and phone-width journeys passed entrance → actual Mission Control pages → report → reload → same front-matter part → cited Knowledge Services answer → requested book → Back. Desktop additionally passed Stop with an authorized navigation response deliberately delayed, fourth-request quota, and a transport-failure fallback with authored reflections. There were no page errors. Evidence: `.local-library/evidence/integrated-journey/{results.json,authorization.json}` and PNGs. Model `portrait-extractive-mock-v1`, provider cost $0; browser first/full text 0.14/0.14 s desktop and 0.15/0.15 s phone in this run (server selection/composition 11 ms). This is an extractive deterministic mock, not live-model qualification.

Performance is not yet accepted: desktop speaking/film 60 fps, document 59, actual page turns 56; emulated phone 59.4–60. Desktop entry had a large cold stall. Interval-only statistics omitted its initial gap; the profiler now also records the full window, boundary gaps and entry-ready duration. Original data is preserved as `performance-before-readiness.json`. The same B worker is correcting startup readiness; final production rerun, clean full browser run and recording remain. The writing/deskilling acceptance case was added as explicitly labeled open interpretation; all **59** contracts pass.
