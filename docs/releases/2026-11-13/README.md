# First-edition release execution

The release separates the 2D portfolio at `/`, Travellers Rest at `/library`, case studies at `/projects/[slug]`, and private management at `/admin`. Draft routes live under `/admin/preview`. Production deployment and final hosted receipts are recorded below after qualification; a Ready build alone does not establish completion.

## Scope and recovery baseline

Release branch: `codex/portfolio-production-release`, based on `be03ebd`. The preexisting working tree was preserved in `.local-library/release/starting-worktree.tar.gz`, SHA-256 `7b0bbac177d04718b5a462505193ec6050224ee3bf219892dc49117930b700b6`. Private database snapshots and content rollback baselines stay in the ignored `.local-library/release` directory. Authoring masters and review captures remain on disk and in that archive; they are excluded from deployment.

Exactly six studies are promoted: Vantage Movers, GoWipe, Overtech Digital Services, Mission Control, AI Engineer Platform, and Knowledge Services. Supporting projects remain hidden. Promotion retains stable page IDs, section keys, owner status/tags/activation, and client disclosure rules. The release importer refuses drift, records audits and revisions, and changes signal visibility without deleting signals.

Production database fingerprint: `5aac9ac8d136475635c9bb75`. Isolated Preview: `76580fb682a2e53c2877c3d5`. These are separate databases on the existing Neon endpoint, with independent content, sessions and portrait ledgers. Pooled/direct agreement is checked before migrations or imports. Routine builds refuse a nonempty schema without migration history; they cannot wipe it.

## Measured changes

The same workstation Chrome profile was used throughout. Phone widths are emulation on the same AMD GPU, not physical-phone qualification. Development cold LCP includes compilation and is not a valid speed comparison.

| Measurement | Before | After | Interpretation |
| --- | ---: | ---: | --- |
| Desktop portfolio CLS, same draft collection | 0.236 | 0 | Responsive derivatives reserve image dimensions. |
| Phone portfolio CLS | 0.286 | 0 | Layout shift eliminated in these lab runs. |
| Desktop loaded image pixels | 2,579,844 | 1,139,820 | 56% less decoded image area. |
| Phone loaded image pixels | 1,480,648 | 239,502 | 84% less decoded image area. |
| GoWipe report HTML, isolated production build | 51,801 B | 37,719 B | Adjacent full manuscripts no longer cross the client boundary. |
| Vantage report HTML | 50,579 B | 37,349 B | Same projection reduction. |
| GoWipe warm response median, three runs | 424 ms | 225 ms | Request-local raw query reuse removes the duplicate nine-query batch. |
| Vantage warm response median | 394 ms | 223 ms | No cross-request cache; withdrawal stays immediate. |

The captured entrance preserves a frame from the approved renderer and performs no WebGL draws or GLB fetch before entry. Cold click-to-ready can increase because work is no longer performed before consent; this is an explicit tradeoff, not a claimed startup speedup. The before/after exploratory entry samples are in `lab-before.json` and `lab-after.json`. Final production-mode frame results are recorded separately.

Resource qualification includes cancelled loading, actual WebGL context loss, ten same-document enter/read/report/exit cycles, and simulated hidden-state events. Active GPU object counts stayed exactly 126 textures, 669 buffers and 43 programs across all ten cycles; every exit left zero active contexts and no scene canvas. Report and hidden intervals had zero draws. Post-GC JavaScript heap moved from 10.8 MB to 12.7 MB across ten cycles; the modest upward heap trend has not fully plateaued, so no heap improvement or fully settled heap is claimed. See `lifecycle.json`.

The six-book audit covered 146 views and 191 rendered pages: zero blanks, overflow, clipped text, cropped/distorted images, missing images or toolbar collisions. Two embedded video pages are intentionally small (388×218 desktop, 306×172 phone); reports and the viewing folio provide larger playback. Geometry does not prove raster text readability: 44 images have no source-font metadata in this audit.

## Hosted and local proof

The first isolated hosted preview is `dpl_hAkz3wkN7mE5FZCAy8mB36GHt2dQ`. Anonymous tests verified all six reports, figures, film controls, selected-card return, résumé/PDF, and report-to-marked-page return at desktop and phone widths. Follow-up fixes cover native-dialog Tab focus, legacy same-document hashes, sample-book links and relative compatibility redirects. Authenticated Preview login and the six-study draft portfolio pass separately from platform protection.

The broad disposable browser suite passed 52 checks initially; three compatibility/assertion corrections then passed individually. The final combined report records their results without counting the original failures as passes. Unit contracts: 81 passing. Build-safety/immutable-upload regressions: four passing. Full build and type checks passed; final lint is zero-warning.

The isolated office exercises create/place/author/rename/publish/hide/stale edits, audit/revision atomicity, unlisted direct access, scheduled/deleted/ambiguous wrappers, private repository redaction and client aliases. The supported owner password change was completed and verified; its temporary recovery credential was removed.

## Portrait and spending

Live text uses `openai/gpt-6-luna` with exact configured price/version and application reservations capped at $0.05 per turn, $1 per UTC day and $5 per UTC month. A dedicated project-scoped gateway key has a $1 daily budget; the project has a $5 monthly budget. The conservative shared remote network allowance remains 30 turns/day. Unresolved reservations are retained.

Hosted anonymous tests cover cited published content, hidden-content exclusion, duplicate replay, withdrawal, synthetic ledger exhaustion in the isolated database, and real provider rejection in a separate deployment with an intentionally invalid credential. That failure deployment is not eligible for production.

Live voice is disabled. [Vercel documents gateway budgets as request-admission soft caps](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets): a crossing request can finish. They are not a verified hard bound for a browser-owned realtime socket. Authored narration remains available. Re-enabling voice requires a verified server/provider termination and spending bound; do not raise existing caps for qualification.

## Rollback and withdrawal

Code rollback candidate: `dpl_B5TBxkcUFsr4v4RUNrypPyBkUZCa`. Verify it remains Ready, then use `vercel rollback dpl_B5TBxkcUFsr4v4RUNrypPyBkUZCa --scope overtons-projects`. Rollback changes code/aliases; it does not undo database publication.

For content withdrawal, set `RELEASE_DATABASE_FINGERPRINT` to the intended recorded target and run `node scripts/release-content.mjs --withdraw`. The command needs the exact matching private release receipt and the reviewed promotion plan. It refuses intervening owner edits. Verify zero selected studies, absent direct reports and sitemap entries, and no portrait citations from withdrawn projects. `--publish` republishes that same edition; `--restore` restores original writing, page order/IDs, covers and visibility. Never replace a private baseline with a fresh plan to bypass drift.

Withdrawal/republication was exercised against the hosted isolated database. Full content restore was compared with every baseline field except automatic update timestamps, then promoted again. An additional isolated page caused a deliberate refusal; removing only that fixture restored an idempotent retry. This leaves production owner data untouched during rehearsal.

Public media needs a separate withdrawal. Hidden books do not revoke static or Blob URLs. Remove bundled derivatives from a new deployment and remove the exact Blob objects named in the asset receipt when authorized, then verify direct URLs. Immutable bytes already downloaded or cached cannot be recalled. Preserve masters and receipts; never overwrite an immutable pathname with replacement bytes.

## Reproduction

Use Node 24.18.0 and `npm ci`. Runtime deployment consumes checked-in derivatives and imported JSON; it does not regenerate source artwork. Regeneration additionally requires Blender, Python, FFmpeg/ffprobe and the relevant packer sources. `sharp` is pinned as a direct development dependency.

Run `npm run release:check`, `npm run test:browser`, `npm run test:admin -- --profile-estate`, and `npm run test:office`. Focused public/preview tests accept `RELEASE_BASE_URL`, `RELEASE_STORAGE_STATE` and `RELEASE_PUBLIC=1`. Keep platform bypass cookies separate from application login, and revoke temporary platform bypass after verification. Do not run paid portrait qualification against an unverified database.
