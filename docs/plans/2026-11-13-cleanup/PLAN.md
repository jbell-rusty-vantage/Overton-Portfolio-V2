# One world, maintainable code, searchable knowledge

**Execution scope correction:** The owner clarified that only the old pre-Travellers-Rest library is to be removed. Preserve all Travellers Rest code and assets, including older prototype tools. Renderer consolidation and removing React Three Fiber are superseded by that instruction.

**Status: completed and deployed on main, November 14, 2026.** [Execution evidence](../../releases/2026-11-14-cleanup/README.md). The sections below retain the original November 13 planning observations; statements about work not yet performed describe that historical planning pass.

The owner now wants the old seven-room hall completely removed, with John Overton's Travellers Rest as the only world. The immediate deliverable is exploration and this complete plan. Application changes, deletion, migration and deployment have not been performed in this planning pass.

The outcome of implementation is one understandable application: the designed portfolio, case studies, accessible catalog/readers, private office, and the existing Travellers Rest experience. Its current behavior and maintenance procedures will have one documented home, reachable through a short AGENTS.md and searchable OKF concepts. Future worlds and immersive VR remain a later product direction.

## 1. Baseline and findings

Inspected branch: `codex/portfolio-production-release`, HEAD `a2f1daa5782b0bf147a9b4f69e55ea5055d5a0c3`. The deployed application is `bbe9eba`; later commits contain tooling and evidence. The [release record](../../releases/2026-11-13/README.md) remains the authority for that deployment and its measured results.

Inventory: 49 tracked Markdown files, 760,461 bytes; 35 documents directly under `docs/`; HANDOFF.md is 29,613 bytes. Root AGENTS.md is already only 2,807 bytes. The problem is contradictory navigation and accumulated history, not simply the size of AGENTS.md. The source inventory covers 80 app, 76 component, 51 library, 61 script and 23 test files with JS/TS/CSS extensions; Python and `.mts` tools are additional. All 281 preexisting untracked source/capture/master files remain untouched.

This is targeted source, dependency, test and documentation inspection, not a new security audit or rerun of the release qualification. See [inspection evidence](inspection.json) and the [complete document disposition](document-disposition.json).

| Finding | Evidence | Consequence for the cleanup |
| --- | --- | --- |
| Old hall remains selectable on public and authenticated routes | `app/library/page.tsx:27`, `app/admin/preview/library/page.tsx:10`, `components/library/Experience.tsx:237` | Replace routing before deleting the hall; remove it from previews and samples too. |
| The hall wrapper also owns the interactive catalog, navigation and reader overlays | `Experience.tsx`, `components/library/Routes.tsx`, `SampleDesk.tsx` | Extract retained catalog/reader behavior first. Deleting `components/library/` wholesale would break the new world and reports. |
| Logical collection data is coupled to hall geometry | `lib/library/model.ts:1`, `catalog.ts:392–419`, admin library actions | Preserve stable shelf IDs, placement, titles and visibility; separate taxonomy from camera/node contracts before retiring hall state. |
| Ordinary readers still generate hall links | `Reading.tsx:173`, `model.ts:77`, report sample links | Replace shared link builders and visible links, not just the entrance route. |
| React Three Fiber has other consumers | `components/estate/Walk.tsx`, `app/dev/travellers-rest/HouseModel.tsx` | Removing the hall alone does not make the dependency removable. Retire or replace those prototype paths deliberately. |
| Current docs contain obsolete operational advice | README and ARCHITECTURE describe a legacy wipe; MIGRATION_STATUS describes three migrations and 52 models | Rewrite current guidance from source: there are four migrations and 53 Prisma models, including PortraitLedger. Archive the earlier assertions. |
| Current runtime orchestration has broad responsibilities | engine.ts 1,446 lines; World.tsx 942; controller.ts 1,083; admin library actions 698; catalog.ts 626 | Extract coherent responsibilities behind existing interfaces. Line count alone is not a reason to split algorithms. |
| Inventory checks overwrite dated evidence | `scripts/release-asset-inventory.mjs` writes `docs/releases/2026-11-13/assets.json` | Separate routine validation output from explicit immutable release snapshots. |
| There is usable local OKF tooling, but its intended successor is not built | AI Engineer agent-docs v1.2; agentic-sdlc README says CLI slice S1 is absent | Reuse a pinned portable implementation; do not depend on a planned service or a sibling checkout. |
| VR is not implemented | No WebXR/session/renderer.xr integration found in app components or domain libraries | Document future seams accurately; do not label the current engine VR-ready. |

Static import inspection found no completely unreferenced component in the inspected component tree. This is a removal and ownership exercise, not evidence for indiscriminate dead-file deletion.

## 2. Remove the hall without removing the collection

The new owner instruction supersedes the earlier requirement to preserve the old renderer. Preserve useful destinations and content identities through translation; the old geometry and room behavior will no longer execute.

### URL contract

`/` stays the 2D portfolio; `/library` stays Travellers Rest; reports stay `/projects/[slug]`; management and drafts remain authenticated under `/admin` and `/admin/preview/*`.

Implement one compatibility resolver, shared by root arrival, `/library`, authenticated legacy preview arrival and link helpers. Validate a requested volume against the appropriate public/admin projection. Keep fragment handling in the browser: the server cannot see fragments. Prefer a valid current-world fragment when a URL contains both that fragment and retired query parameters. Normalize once with replacement semantics so Back does not bounce through a redirect loop.

| Existing destination | New destination/behavior |
| --- | --- |
| `/?view=world&zone=entrance`, `/library?view=world&zone=entrance` | `/library` entrance, followed by the normal entry action into Travellers Rest. |
| Old `stacks` destination, with or without a shelf | `/library#cabinet`; retain shelf identities in the collection, not as nonexistent room coordinates. |
| A published, placed project book with `book=<slug>&page=<leaf-key>` | `/library#book/<slug>/<leaf-key>` after validating the leaf. Invalid leaf returns to that book's beginning; do not invent a page mapping. |
| A valid current `#book/...`, `#report/...`, `#object/...`, `#screen/...`, or room fragment | Preserve the existing fragment, report section, leaf and page exactly. |
| An old book link for content not placed in Travellers Rest | Its existing authorized HTML reader/catalog destination. Do not pretend a native binding exists. |
| `periodicals`, `favorites-wing`, `evolution-hall`, `reading-room` | Existing `/blog`, `/favorites`, `/evolution`, `/catalog` respectively. These remain content destinations, not additional worlds. |
| `computer-station` | Current Travellers Rest viewing folio, `/library#screen/main`; old screen configuration stays preserved as historical data. |
| Unknown retired zone/shelf or invalid input | Safe `/library` entrance, without private-data disclosure or an external redirect. |
| Legacy admin preview queries | Corresponding authenticated preview destination; authorization precedes lookup, persistent draft label remains. |
| `/samples` | Development-only text sample desk; no hall, no production exposure. Preserve fixture edits and reload behavior. |
| `/#selected-work`, `/#work-*`, `/projects#work-*` | Existing portfolio behavior unchanged. |

Add explicit coverage for query-plus-hash precedence, browser Back/Forward, reload, percent-encoding, invalid leaf keys, ambiguous slugs, unpublished records and disabled JavaScript. Without JavaScript, retain accessible reader/catalog links even when automatic hash translation is unavailable.

### Removal order

1. Extract `Catalog` from Experience into `components/library/Catalog.tsx`, with a small shared catalog shell. Keep Reading, ProjectReport, Modal, Marks and shared styles used by the estate. Replace the sample desk's dependency on Experience with this retained UI.
2. Separate `Volume`, `Leaf`, `Block` and collection types from the Blender manifest. Create a scene-independent collection taxonomy using the existing stable IDs and labels. Preserve database IDs, shelf positions, owner-edited titles, public/hidden/unlisted behavior and direct-reader semantics. Camera matrices, hall node names and hall GLB URLs cease to define collection eligibility.
3. Migrate links and routes according to the table. Offer “Open in library” only when a volume is actually present in the estate; other content retains its HTML reader.
4. Remove `components/library/World.tsx`, `BookJacket.tsx`, `ShelfPlaque.tsx`, the retired portions of Experience, hall-only CSS, fixtures and GLB tests. Replace relevant behavior tests before deleting their old implementation assertions.
5. Remove hall-specific admin controls/actions: uploaded hall versions, hall camera editor and retired computer-screen editor. Retain shared authoring, collection placement and Travellers Rest scene validation. Reject retired commands at the server boundary as well as removing buttons. Preserve underlying owner records; do not drop tables or edit applied migrations.
6. Stop querying `library-hall`, hall cameras and old computer-screen feeds in ordinary portfolio reads once inbound consumers are gone. Audit whether any activity projection is still needed before removing its query. Keep request-local reuse and immediate publication/withdrawal behavior.
7. Remove the two hall GLBs from current delivery and retire their pack/build entrypoints. They total **3,487,440 bytes**; this is package storage removed, not an equivalent improvement to homepage transfer. Retain source masters and exact recovery history outside deployment. Shared covers/posters under `public/library` remain.
8. **Superseded by the owner’s execution clarification:** preserve Travellers Rest `Walk.tsx`, `HouseModel.tsx`, the prototype harness and `@react-three/fiber`. Only the pre-Travellers-Rest hall is retired.

No schema deletion is needed. Old scene/screen records may remain inactive historical records; retaining data is not retaining executable hall code. Do not simply hide all old zones: current catalog eligibility is tied to those rows. Do not delete old Blob objects without an exact exclusive-reference inventory; removing public UI is not media withdrawal. The current build must stop serving its bundled hall files, but existing rollback deployments and downloaded immutable bytes are historical copies.

## 3. Clean code around explicit responsibilities

Keep the current Next App Router structure. Avoid a bulk rename to `src/`, a package monorepo or a new world/plugin framework. The bundled Next 16 project-structure guide was consulted; implementation must read the specific auth/cache/routing guides when touching those features.

| Boundary | Proposed organization and scope | Proof required |
| --- | --- | --- |
| Public route adapters | Thin `app` pages/handlers call shared path and data services; one legacy URL translator | Route table, direct links, canonical metadata, no-JS catalog, privacy checks. |
| Collection domain | `lib/library/types.ts`, `taxonomy.ts`, `paths.ts`; catalog query/projection responsibilities separated into reviewed modules | Same published IDs/order/sections; hidden/unlisted/scheduled/alias/wrapper tests. Temporary re-exports are removed before completion. |
| Public reading | Catalog UI, FullReader, reports and figures remain shared across portfolio, world and drafts | Accessibility, figure focus/Escape, media controls, report return and all six studies. |
| Authoring | Extract server-only library validation and transactional use cases from the large action/page files; preserve thin authenticated actions | Auth on every entry, stale-edit refusal, atomic audit/revision/signal writes, owner edits. |
| Travellers Rest React orchestration | Extract visit/navigation state, bookmark persistence and renderer session lifecycle from World.tsx into cohesive hooks/modules | One renderer per visit; exact existing storage keys/history semantics; no duplicate effects/listeners. |
| Native engine | Keep Engine as the facade; extract scene loading/composition and interaction-target ownership where interfaces are clear | Existing ResourceOwner ownership, cancellation/late-load disposal, context loss, pause/resume and native book tests. |
| Book mechanics | Keep pagination, sheet metrics, Volume3D, BookHold and leaf-turn geometry stable initially | Refactor only for an identified responsibility problem, then repeat page/gesture audits. No visual redesign hidden in cleanup. |
| Styles | Separate shared reader/catalog styles from retired hall selectors; keep estate design tokens and layout | Representative desktop/phone screenshots; no selector deletion based only on a text search. |
| Portrait | Retain existing server/provider/security/ledger boundaries; remove duplicate helpers only with behavioral evidence | No budget, privacy or voice-policy change; live voice still disabled. |
| Tooling | Group documented command ownership into assets, authoring, release, qualification and local development; preserve working command names | No cwd-sensitive path breakage; explicit targets for writes; no obsolete starter seed presented as the main workflow. |

Keep imports from production code out of `app/dev`; enforce the existing shared StudyCollection boundary. Document tooling that legitimately invokes Blender/Python/FFmpeg separately from runtime dependencies. Archive retired one-off seeds and hall packers with their provenance; do not advertise their old hard-coded database target as a supported release path.

Change inventory to validate by default and write temporary output under `.local-library`. An explicit release ID/output command creates a new release snapshot. Never overwrite a prior release receipt during lint/build/CI. Register tests that reject accidental historical-receipt changes.

## 4. OKF and documentation design

Use **OKF 0.2**, verified against the [official specification](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md). It provides Markdown concepts with YAML metadata and links. Search, trust enforcement and this repository's review policy remain separate concerns; a formatting pass does not prove a claim or a deployment.

### Canonical layout

```text
AGENTS.md                     short rules, current goal pointer, generated task routes
CLAUDE.md                     @AGENTS.md adapter
README.md                     current product, live/local entrypoints, safe quick start
HANDOFF.md                    current state/next action only; historical narrative archived
.agent-docs/                  pinned portable generator, registry, modules, provenance
knowledge/                    flat, registered OKF concept bundle
  index.md                    generated progressive-disclosure index
  <concept>.md                authored explanations with source/test links
docs/
  README.md                   human documentation entrypoint and status conventions
  adr/                        accepted/proposed decisions, one decision per file
  operations/                 detailed runbooks linked from concepts
  reference/                  generated schema and long reference material
  agents/CODE-MAP.md           generated source/interface/invariant/test map
  archive/                    retired plans, historical handoffs, retired hall references
  releases/                   immutable dated evidence; retain existing paths
  plans/                      proposed work, clearly distinct from current behavior
tests/docs/                   repository-specific navigation and retrieval fixtures
```

The first bundle has 24 concepts, below the inspected generator's 40-concept limit:

| Task family | Concept filenames under `knowledge/` |
| --- | --- |
| Understand/change the app | `system-overview`, `route-compatibility`, `security-and-privacy` |
| Author and publish | `collection-publication`, `report-authoring`, `admin-and-drafts`, `content-promotion` |
| Database and environment | `database-contract`, `integrations-and-environments`, `local-development` |
| Maintain the world | `estate-program`, `world-runtime`, `navigation-and-bookmarks`, `book-rendering`, `folio-and-media` |
| Curate its content | `historical-evidence`, `asset-pipeline`, `authoring-tools` |
| Operate the portrait | `portrait-text`, `portrait-voice` |
| Qualify and recover | `testing-and-performance`, `release-and-recovery` |
| Maintain knowledge/future intent | `documentation-system`, `future-worlds` |

Concepts explain responsibility, behavior, invariants, failure modes, source locations and relevant tests. Put long procedures/reference tables in their one owning runbook/reference file and link them. Do not repeat the same operational instructions in README, HANDOFF, concept and release report.

Seed the reviewed module registry from these ownership boundaries. These are navigation records, not a proposal to create 15 packages:

| Module ID | Current source anchors | Representative proof anchors |
| --- | --- | --- |
| `public-routes` | `app/page.tsx`, `app/library/page.tsx`, `lib/library/paths.ts` | `tests/release-paths.test.ts`, `tests/browser/navigation.spec.ts` |
| `portfolio-reports` | `components/portfolio/Portfolio.tsx`, `components/library/ProjectReport.tsx`, `lib/library/report.ts` | `tests/portfolio.test.ts`, `tests/browser/reports.spec.ts` |
| `collection` | `lib/library/model.ts`, `catalog.ts`, `policy.ts`, `pages.ts` | `tests/library.test.ts`, `scripts/test-library-admin.mjs` |
| `identity-office` | `lib/auth/session.ts`, `local-office.ts`, `components/admin/office-page.tsx` | `scripts/test-library-admin.mjs`, `scripts/qualify-visitor-access.mjs` |
| `authoring` | `app/admin/(console)/*/actions.ts`, `lib/admin/audit.ts`, `lib/mdx-ingest.ts` | `scripts/test-library-admin.mjs` |
| `database` | `prisma/schema.prisma`, `prisma/sql/objects.sql`, `scripts/db-deploy.mjs` | `tests/release-safety.test.mjs`, isolated migration rehearsal |
| `estate-program` | `lib/estate/catalog.ts`, `program.ts`, `world.ts`, `objects.ts` | `tests/estate.test.ts`, `tests/journey.test.ts` |
| `estate-session` | `components/estate/Estate.tsx`, `world/World.tsx`, `lib/estate/visitor-navigation.ts` | `tests/browser/navigation.spec.ts`, `tests/browser/visitor.spec.ts` |
| `estate-engine` | `world/engine/engine.ts`, `controller.ts`, `resources.ts`, `readiness.ts` under `components/estate/` | `tests/readiness.test.ts`, `tests/world-environment.test.ts`, lifecycle profiler |
| `native-books` | `components/estate/world/Reader.tsx`, `paginate.ts`, `sheets.ts`, `engine/volume.ts` | `tests/leaf-surfaces.test.ts`, `tests/browser/books.spec.ts`, page audit |
| `exhibits-media` | `components/estate/world/Inspector.tsx`, `Folio.tsx`, `lib/performances.ts` | `tests/browser/folio.spec.ts`, `scripts/test-estate-media.mjs` |
| `portrait` | `lib/portrait/server.ts`, `agent.ts`, `ledger.ts`, `components/portrait/PortraitPanel.tsx` | `tests/portrait.test.ts`, bounded portrait qualification scripts |
| `asset-authoring` | `scripts/pack-kit.mjs`, `pack-estate.mjs`, `immutable-blob.mjs`, current asset manifests | `tests/kit.test.ts`, `tests/release-safety.test.mjs`, inventory |
| `release-operations` | `scripts/release-content.mjs`, `database-target.mjs`, release verification scripts | drift/restore rehearsals, hosted HTTP/browser qualification |
| `documentation` | proposed `.agent-docs` registries/tooling and `knowledge/` | proposed `tests/docs/` fixtures, isolated-clone proof |

Expand wildcard descriptions to exact inspected entrypoints when creating `modules.json`; never store wildcard paths as if they were source files. Cross-links between modules describe real dependencies and data ownership, not speculative future architecture.

Example local profile, not an implemented document or human-review attestation:

```yaml
---
type: Architecture Concept
title: Travellers Rest navigation and bookmarks
description: Routes, history and saved reading positions for the current estate.
tags: [world, navigation, bookmarks, reports]
aliases: [return to book, resume reading, marked page]
questions:
  - How does a report return to the same book page?
implementation_status: implemented
decision_status: reference
validation_status: source-and-tests-inspected
owner: estate-navigation
sources:
  - id: routes
    resource: ../lib/estate/world.ts
    title: Route parser and serializer
  - id: journeys
    resource: ../tests/browser/navigation.spec.ts
    title: Visitor navigation tests
---
```

`type` is the format minimum; this repository additionally requires title, description, tags, owner and evidence links. Keep acceptance status in the registry consistent with document metadata. Use explicit implementation/validation fields for local descriptions. Do not misuse OKF lifecycle fields as an “accepted architecture” flag, fabricate `verified`, or mark agent-authored text human-reviewed. Stable source IDs support claim attribution. Use a bundle-root version declaration when supported by the generator; otherwise record the target in its generated index text as the current tool does.

### Compact AGENTS.md

Keep the Next-generated warning block verbatim and preserve `CLAUDE.md` as an adapter. Add a generated task index and a small set of durable rules: auth/DAL, Suspense, Prisma import/migrations, audited writes, public visibility/redaction, asset integrity, world/book invariants, safe targets and relevant checks. Detailed recipes belong in concepts/runbooks.

Target root AGENTS.md at **6 KiB or less**, hard cap 8 KiB including the Next block; nested guides at 3 KiB target with the same hard cap. Root already occupies 2.8 KiB, so this is an information-density and discovery improvement, not a promised reduction in that single file's bytes. Keep HANDOFF at 4 KiB or less. Add focused generated guides for `app`, `components`, `lib`, `scripts` and `tests` only where they supply distinct ownership information; do not repeat every parent rule. No AGENTS.md inside the OKF bundle.

### Tool choice and provenance

Adopt the inspected AI Engineer agent-docs v1.2 portable generator (`cli.mjs`, `semantic-maps.mjs`, `knowledge.mjs`, vendored YAML parser/licenses and required support files). It provides explicit registration, bounded file reads, deterministic generation, search, context packets and freshness checks without a provider, database or network at runtime.

The canonical source is currently an uncommitted local tool directory, so do not invent an upstream commit pin. Record the exact canonical file hashes in the bootstrap receipt and commit the resulting portable copy here. The existing Knowledge Services copy at `b548468` executes search successfully; its CLI/search code matches canonical after newline normalization, but its code-map cap was locally raised to 160 KiB. Use the canonical 128 KiB cap and prove this repository's isolated generation. Do not patch sibling tools or enroll this repo in a BellLabs workspace build as part of adoption.

The newer agentic-sdlc repository declares a future successor, but its CLI is absent in the inspected checkout. Do not install placeholder commands or wait for that unrelated project. A later switch requires equivalent metadata, search, validation and portability behavior; it must replace, not stack on, this toolchain.

The pinned tool includes its own upstream retrieval fixtures. Keep those as tool tests; add separate Overton fixtures and never report the upstream fixture benchmark as evidence for this corpus. If generator changes become necessary, change the canonical source with focused tests and vendor a reviewed new snapshot rather than diverging silently.

## 5. Search that is useful and measured

Provide these repository-local npm commands around the actual portable CLI:

```text
npm run docs:build
npm run docs:check
npm run docs:search -- --query "return to book" --limit 5
npm run docs:search -- --query "portrait budget" --tag portrait --format json
npm run docs:context -- --query "withdraw a project" --limit 2 --format json
npm run docs:test
```

Default search reads the current registered concept bundle, ranks metadata/headings/body and returns file paths, line snippets, status and matched terms. Context adds bounded sections plus source/test references and freshness information. It is local lexical retrieval, with curated aliases/questions for the owner's vocabulary; no vector database or paid model is needed. Plain Markdown and `rg` remain usable without the generator. Archives/releases are explicitly separate searches, for example `rg -n -i "rollback" docs/archive docs/releases`, and never outrank current operational guidance by default.

Search is an internal maintenance capability, not a new public `/docs` route and not an addition to portrait retrieval. Exclude `.local-library`, `.env*`, `.vercel`, private content, caches, databases, recovery credentials and runtime logs. Use explicit registered allowlists; the current generic tool's denylist alone does **not** cover every Overton-private path. Add a repo-profile guard and negative fixtures before invoking it. Source evidence should reference small code/tests/manifests, not large media or private snapshots. No automatic crawl of authoring masters, artifacts or sibling repositories.

A local browser search UI is optional follow-up if the CLI/index prove awkward for the owner; it is not required to make this bundle searchable and is not a reason to publish private documentation.

The attached [24 retrieval cases](retrieval-cases.json) provide the proposed initial fixture set: 16 development cases and 8 held-out cases. Freeze it before baseline/tuning; record any later revisions separately. These are agent-authored labels, not measured results or owner adjudication. They include exact identifiers, paraphrases, ambiguous/obsolete names and no-answer cases. Required questions include:

- Why does an old `view=world` URL land here, and where is its translation?
- How do I return from a report to the same leaf and page?
- Which files own book page geometry versus HTML page content?
- How do I hide a study without leaking it through a guessed URL or portrait answer?
- Which database will a preview or migration use?
- How do I promote content without overwriting owner edits?
- How do I replace an image without overwriting immutable bytes?
- Why is live voice disabled, and what are the text caps?
- Where are the current release, rollback and asset-withdrawal procedures?
- Which actions require workstation GPU qualification?
- How does the local office differ from production authentication?
- Is VR implemented, or only a future direction?

Acceptance: all safety-critical questions find the owning current concept/runbook within the top three; at least 90% top-three success on the full fixture set; no-answer cases remain explicit; zero private-path matches. Measure median/p95 lookup time and returned context bytes on the recorded machine, aiming for under one second and bounded output. Freeze results before revising labels. If recall misses, improve ownership descriptions/aliases, not an assertion that search is semantic. Do not claim improved agent task completion from retrieval scores alone.

## 6. Organize all existing documentation

[document-disposition.json](document-disposition.json) assigns a disposition to every one of the 49 tracked Markdown files and records its starting hash. The migration is accountable file by file, not a blanket move of `docs/`.

- Rewrite README as the current 2D portfolio plus Travellers Rest introduction. Replace unsafe/obsolete migration language and obsolete starter instructions.
- Replace HANDOFF with a compact current-state entry. Archive its previous narrative verbatim with a date and superseded status.
- Consolidate ARCHITECTURE, DATA_MODEL, WORLD_ENGINE and current authoring/portrait guidance into the owning concepts/runbooks. Regenerate schema reference from Prisma, including the ledger; distinguish generated reference from authored policy.
- Archive completed deployment briefs, old next-session prompts, the octagon/hall plans and historical delivery reports. Preserve source/decision context and label historical claims with their original date.
- Keep the release receipt folder, review evidence paths, historical-source credits and asset provenance stable. Link them from canonical concepts. Do not move binary evidence merely to make the tree symmetrical.
- Preserve asset-specific READMEs at their owning asset roots when they document current reproducible generation or rights. Mark only the retired hall guide as historical; `assets/library/posters` contains shared artwork and remains relevant.
- Before moving prose, inventory inbound Markdown links and anchors. Rewrite live callers, retain short compatibility pointers for established historical paths, and verify their targets. Retained stubs are pointers, not duplicate sources of instructions.
- Maintain an archive index outside the active OKF bundle. Old “do this next” text must never appear as an unlabeled current directive.

## 7. Ordered implementation and acceptance

Each step is a scoped, reviewable change. Runtime and documentation evolve together; do not update docs to claim that a later step is already implemented.

| Step | Work | Exit evidence |
| --- | --- | --- |
| 1. Preserve and freeze | Record checkout/owner changes; retain private release baselines; capture representative current screenshots/URLs and retrieval baseline; review the explicit removal inventory against the owner's stated scope | Reproducible baseline, exact file/asset lists, no broad clean/reset. |
| 2. Decouple and translate | Extract catalog/sample UI and taxonomy; add compatibility resolver; update readers/admin previews | Public/private URL matrix passes; six published studies and hidden records unchanged; stable leaf/section/book IDs. |
| 3. Remove the old hall | Delete exclusive hall runtime/styles/assets/tests and retire hall admin commands. Preserve all Travellers Rest prototype paths and R3F per the owner clarification | No live route/admin/sample can launch the hall; no hall fetch/chunk; bundled hall URLs absent; shared artwork and plain reading retained. |
| 4. Refactor active boundaries | Collection query/projection, transactional admin use cases, world orchestration/engine loading, storage helpers and styles; fix inventory output ownership | Focused behavior tests and before/after measurements per seam; no book/design drift. |
| 5. Author and migrate knowledge | Write concepts and decisions, rewrite current runbooks/entrypoints, archive history with link compatibility | All 49 original documents accounted for; no stale current guidance; every module has a source/test route. |
| 6. Install searchable navigation | Vendor pinned tool, register modules/docs, generate compact guides/index/map, add Overton fixtures and CI | Isolated checkout build/check/search; deterministic second build; retrieval and private-path checks pass. |
| 7. Qualify and release implementation | Full local checks, disposable DB rehearsal, protected preview and workstation-GPU hosted visitor checks; then scoped release when execution is requested | New measured release receipt, verified production URLs, rollback target and withdrawal instructions. This planning turn does not deploy. |

Use a short bridge commit for extraction if necessary, but completion means the old runtime is gone, not merely hidden behind a flag. Code and doc changes should not be a single opaque mass-format commit. Preserve the existing release branch/history; choose a scoped cleanup branch from the reviewed current state during implementation.

### Verification matrix

1. **Portable CI:** typecheck, lint, unit/domain and migration/upload safety contracts; disposable PGlite authoring/privacy checks; portfolio/catalog accessibility; no-JS reading; native-world no-WebGL fallback; navigation translator cases. Update the current CI grep/test organization so coverage follows retained behaviors rather than deleted legacy test names.
2. **Native world:** current desktop and emulated-phone journeys; all six books and their report-to-marked-page returns; selection/reopen/drag/turn; letter/transcription/scan; all nine soccer clips; menus, full-screen, keyboard/focus and portrait navigation. Re-run geometry/page audits after changes to reader boundaries. Physical phone and software-renderer 3D remain separately unqualified unless actually tested.
3. **Lifecycle and performance:** same browser/device/data, cold/warm 2D and world entry samples; wire/script/image bytes, LCP/CLS, p95 frame time, cancellation, context loss and ten enter/read/report/exit cycles. Preserve zero WebGL work before estate entry, zero draws while hidden/report-paused, stable active GPU counts and zero contexts after exit. Report the existing unresolved heap trend honestly. Investigate material regressions rather than attributing a shorter file to faster rendering.
4. **Data and operations:** exact published/hidden identities, stable page IDs/order, aliases/redaction, audit/revision atomicity, drift refusal, preview isolation, asset MIME/range/cache behavior and independent rollback/content/asset withdrawal. No normal build may reset a database or overwrite an old receipt.
5. **Documentation:** actual YAML parsing; registered/unique concepts and owners; source/test link existence; metadata/registry consistency; broken links/anchors; generated-output freshness; root/nested byte caps; preserved Next block; no private paths; malformed YAML, duplicate IDs, stale sources and symlink escape fixtures; independent-clone operation. Source hashes flag drift, not semantic truth.

Use the prior release's performance only as a documented reference. Capture fresh matched baselines before runtime refactors and compare medians/frame distributions on the same setup; the old hall's package size is not the current estate's startup cost. Retain optimizations only with measured benefit. Behavior-preserving ownership refactors can be valuable without a speed claim.

## 8. Future worlds and VR boundary

Name the current implementation as Travellers Rest in the module map. Keep collection/readers, asset delivery, portrait contracts and resource ownership independent of the room design where they already have clean boundaries. Isolate estate-specific placements, anchors, exhibits and narration from rendering/session code as the above refactors justify it.

Record future multi-world navigation, namespaced save state, input abstraction, XR session lifecycle, stereoscopic rendering, headset comfort/performance, spatial audio and controller/hand interaction as **proposed** requirements. Do not implement a world registry, `/worlds/*`, ECS, physics stack, WebXR support or universal renderer API now. The second real world and actual headset targets should drive those interfaces. Preserve existing Travellers Rest bookmark keys until a versioned migration is deliberately needed.

## 9. Completion and remaining decisions

The cleanup is done when the current application has one world; old public/private/sample entrypoints translate safely; collection data and owner edits remain intact; obsolete hall code/dependencies/delivery assets are removed; current modules have clear ownership; every original document is retained, merged or archived with a recorded disposition; and current knowledge is locally searchable with measured retrieval quality and enforced freshness.

No owner credential or product clarification blocks this plan. Recommended defaults are local repository search, the existing UI/route layout, no schema deletion, no new VR framework, and a pinned portable OKF tool. A public documentation site, semantic embedding service or broader BellLabs toolchain work would be a separate scope choice.

Planning artifacts only were created. Existing application files, AGENTS.md, source masters, databases and production are unchanged by this exploration.
