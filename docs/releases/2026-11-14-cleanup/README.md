# One-world cleanup — November 14, 2026

**Deployed and verified on main, November 14, 2026.**

[Live portfolio](https://overton-portfolio-v2.vercel.app) · [Travellers Rest](https://overton-portfolio-v2.vercel.app/library). Production source: `3bbe593aeb7ffd7494f6d31824e02bb7918b1b00`; deployment `dpl_CmGsgnCkjMSsWQBw9cjn1NRpALCg`. [Platform receipt](deployment.json) confirms main and the production alias. Later receipt/handoff changes are documentation only.

[Production HTTP checks](production-http.json) passed, followed by 12 live portfolio/report browser scenarios; the local-preview-only scenario is intentionally skipped in public mode. Both hall GLBs return 404. The production build applied no new migration. [Temporary preview bypass revocation](preview-protection.json) is verified: the token is absent and anonymous/revoked-token requests receive 302 protection redirects.

Preview: https://overton-portfolio-v2-jw8pvojj2-overtons-projects.vercel.app (`dpl_9nbGGbsM3xSVdjKNWyRKbWS1Y9cn`, runtime commit `e25fc3d`). Subsequent commits change documentation and audit input validation only.

[CI](https://github.com/jbell-rusty-vantage/Overton-Portfolio-V2/actions/runs/43560633740) passed at `fdd3fbd`: fresh Linux install, typecheck/lint, domain/safety/inventory/build, docs checks and 15 docs tests, isolated authoring, and portable browser checks.

## Scope and preservation

Retire only the old seven-room hall. Travellers Rest remains the portfolio world, including its existing assets, native books, prototype tools and React Three Fiber dependency. The portfolio, all six public case studies, accessible catalog/readers and private office remain. No schema, migration, published content, Blob asset or portrait budget was changed. Live voice remains disabled.

Removed the two hall GLBs (3,487,440 bundled bytes), hall-only rendering/styles and hall editing commands. This is package storage removed, not a homepage transfer saving. Legacy public/admin links translate through the authorized collection to current books, the cabinet, folio or HTML destinations. Retired commands are also rejected at the server boundary. Shared catalog, collection queries, transactional authoring, browser persistence and owned scene loading have explicit modules.

All 281 pre-existing untracked files match their recorded SHA-256 values. They remain locally in their original locations with exact local Git exclusions; no broad clean/reset was used. All 49 original Markdown files have recorded dispositions, and archived originals match their Git source bytes. Travellers Rest asset/content paths have no changes from a2f1daa. Parallel owner research remains local and separate.

## Qualification

Local typecheck, lint, production build, 81 domain tests and five release-safety tests passed. Both authenticated admin and local office workflows passed in disposable PGlite databases, including privacy, stale edits, authoring and atomic revisions/audits. The complete retained 51-scenario browser suite passed. Hosted portfolio/report tests passed 12 scenarios; one local-preview-only scenario is deliberately skipped in public mode. Portable checks cover no-JS reading, accessibility, preview isolation, legacy navigation and missing-WebGL fallback.

No actual owner database writes or new migration were needed. Preview deployed to the isolated portfolio_preview_20261113 database and reported no pending migrations. Production is a separate guarded target. The previous release's content and Blob withdrawal rehearsals remain historical evidence; this code-only cleanup did not repeat destructive media/content operations.

## Knowledge and documentation

Twenty-four registered concepts, sixteen module records, generated compact guides, source/test map, schema reference, runbooks and ADRs replace contradictory current instructions. Historical records remain outside current search. The portable local AI Engineer agent-docs v1.2 snapshot is pinned by file hashes in .agent-docs/bootstrap.json; no upstream commit is invented. Actual YAML parsing, private path/symlink rejection, duplicate/malformed metadata, drift, link/anchor checks and size caps are covered by 15 passing tests. A separate Git clone passed build/check and the full 15-test documentation suite without a sibling repository or node_modules dependency.

The frozen agent-authored retrieval fixture has 16 development and eight held-out cases. Initial registered-bundle search found 20/24; final search finds 24/24, including every safety-critical case and explicit no-answer cases. A held-out portfolio-hash miss was inspected and informed an alias clarification: the final result is a tuned regression result, not an untouched blind evaluation or evidence of better agent task completion. Labels were not changed. Exact timings and bounded context sizes are recorded in retrieval.json. Zero private-path matches are enforced by negative fixtures.

## Recovery and limitations

The previous production deployment is https://overton-portfolio-v2-q58a2z9ba-overtons-projects.vercel.app. Use the code rollback procedure in ../../operations/release.md, then recheck the public routes. Content restoration and asset withdrawal are separate operations and use the reviewed private baselines; never recreate those baselines to bypass owner-drift checks.

Physical phones, VR/headsets and native 3D performance on software renderers remain unqualified. Desktop and phone results here use workstation Chrome with an emulated phone viewport. The existing heap trend is reported separately from proven GPU-resource cleanup. No speed improvement is claimed merely from splitting modules or removing old hall package bytes.

## Measured runtime behavior

[Matched samples](performance.json) used Chrome 157.0.8103.52 on the same workstation, no throttling, five visits per viewport. Initial median desktop entry changed from 4.955 s to 5.620 s; emulated-phone entry from 4.298 s to 4.218 s. Median frame p95 was 17.1 ms on desktop and 17.2/17.3 ms on phone. [Alternating fresh-context follow-up](entry-comparison.json), three pairs, measured 7.439 s baseline versus 6.798 s candidate desktop medians. The initial difference did not reproduce in that comparison; network/cache/preparation variability prevents a speed claim. Desktop cold/warm LCP was 560/416 ms and phone 560/408 ms in the candidate sample, with zero CLS. Wire/script/image measurements are retained in the sample record; these are workstation observations, not field/Core Web Vitals certification.

[Ten-cycle lifecycle evidence](lifecycle.json) records stable active counts of 126 textures, 669 buffers and 43 programs; zero draws while report-paused or hidden; zero remaining contexts after every exit; successful entry cancellation and context-loss fallback; and no browser errors. Post-GC used heap rose from 10.68 MB to 12.71 MB over ten cycles. The heap trend remains unresolved; GPU cleanup is proven separately and is not a claim of zero retained heap. Before deliberate estate entry, every matched performance sample recorded zero draws.

## Book and visitor evidence

[Coverage](book-coverage.json) and [summary](book-summary.txt): all six books, desktop and emulated phone, 146 captured views / 191 page surfaces. Zero blanks, overflow, clipped text, cropped or unloaded pictures, folio collisions, or covered controls. Two video surfaces are informational flags. Forty-four raster-image surfaces have no calibrated embedded-text measurement; structural geometry checks do not certify their tiny text. [Desktop sample](book-desktop.png) and [phone sample](book-phone.png) were visually inspected. Full per-page captures remain in ignored local evidence.

[Hosted HTTP and authenticated preview](preview-http.json) passed all public routes, six report identities, hidden-record exclusion, old URL translation, removed hall 404s, office authentication, draft labels, immutable cache headers, video byte ranges and PDF delivery. The surface audit requires the private review engine probe; public routes deliberately do not expose that probe. An initial public-route audit failed that internal assertion; rerunning through authenticated preview passed without changing rendering.

Main integration CI also passed at production commit `3bbe593`: [run 43560929077](https://github.com/jbell-rusty-vantage/Overton-Portfolio-V2/actions/runs/43560929077), with [step receipt](ci.json). Final documentation build/check and all 15 documentation tests passed after the deployed-status handoff update.
