# The Library: implementation plan for GPT 6 Astra

**Prepared:** 2026-11-08  
**Repository:** `C:\Users\Pinda\Overton-Portfolio-local`  
**Plan file:** `C:\Users\Pinda\Overton-Portfolio-local\docs\LIBRARY_IMPLEMENTATION_PLAN.md`  
**Required implementation model:** **GPT 6 Astra**  
**Status:** Planning complete; revised for John's local-preview and GitHub-seeding clarification. Implementation has not started in this task.

## 1. Outcome, sequence, and authority

Build John Overton's portfolio as a polished, navigable 3D library **locally and leave a tested preview running for him to review when he wakes up, if implementation is ready by then**. He explicitly authorizes the future Astra implementation agent to inspect authenticated GitHub and seed a few accurately sourced projects into the verified intended portfolio database, starting with `agentic-mission-control` and `agentic-knowledge-services` as candidates. This avoids a separate manual content-population step. John can expand or refine the content later through the admin dashboard or a handwritten report. He should not have to finish writing his projects or operate Blender manually before seeing the result. Morning readiness is a goal, not a promised completion time.

The existing new Library schema is the intended foundation. Do not recreate the old portfolio or replace the schema with a generic project table. Build the world and research the approved GitHub candidates in parallel; seed the verified target as soon as contracts and safety checks are ready, then show those projects in the local preview. Keep fixtures for tests, empty areas and a genuine database blocker, but do not treat fixture-only delivery as the preferred final result or defer approved seeding indefinitely. Missing schema/credentials must not stop independent visual work. John will create the GitHub remote and Vercel deployment himself; local review and optional iteration come before any deployment.

The required implementation agent is **GPT 6 Astra**, as explicitly requested by John. A prompt naming a model does not select it: confirm the actual chat/model configuration before coding. If GPT 6 Astra is unavailable, stop before implementation and report that specific blocker; do not silently substitute a model. The user is asking for this plan now, not for an implementation or a new chat to be started automatically.

### Scope of the future implementation

- A cohesive library environment with seven named areas and all eleven existing shelf anchors.
- Finished original environment assets, reusable books/props, lighting, navigation and meaningful interactions.
- An accessible HTML catalog and deep-linkable content pages using the same content as 3D.
- A small real starter collection seeded from verified GitHub candidates into the intended database, with idempotent writes and a tested local preview; clearly labeled fixtures remain available for tests and blocked/no-DB development.
- Extensions to the existing admin, not a second admin product: books, pages, placements, zone controls, computer screens, scene versions, visitor preview and publishing checks.
- A safe content adapter for the intended Library schema, with public visibility and redaction enforced on the server.
- A documented path from dashboard entry or handwritten report to reviewed drafts, then deliberate publication.
- Tests, reproducible asset creation, performance measurements, screenshots and a truthful final handoff, including the working local URL, running-server status, log location and exact resume command.

### Boundaries

This planning task changes documentation only and performs no GitHub inspection, implementation, server launch or database mutation. The future Astra task includes local code/assets/tests, a running local preview, authenticated read-only GitHub research and a few accurately sourced project seeds into the verified intended database. That narrow non-destructive seed is already authorized and does not require another generic permission request. **No deployment, push, Git remote creation/change, Vercel project/deployment creation, live schema migration, credential creation, destructive reset, paid asset purchase, or premature public content publication is authorized.** Database provisioning or migration, an ambiguous target, expanded data-sharing scope or a destructive/conflicting write is a specific blocker to resolve, not permission to guess. Never expose environment values, authentication hashes, connection strings, private client data or notes in reports or public browser bundles. Preserve pre-existing work. Local content visibility for review must not accidentally expose draft records through an existing public site.

### Latest user clarification: scope and delivery

This clarification supersedes this plan's earlier fixture-only preference and any blanket ban on real starter-project seeding. It does not start implementation in this planning task.

<transcript_evidence>
User: “Okay make this completely understood. The agent can seed a few projects in the database to use in the 3d world. This is best so we don't have to take that extra step. Github is authenticated here and agentic-mission-control and agentic-knowledge-services are good candidates. I also want it known that I want this developed locally and spun up so that in the morning (if it's done by then) when I wake up I can view the result and optionally iterate before deployment. I will have the github remote and vercel deployment by then. I have to create those. It will be a small step at that point.”
</transcript_evidence>
## 2. Verified baseline, not assumed completion

Read `AGENTS.md`, `HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/ADMIN.md`, `docs/MIGRATION_STATUS.md`, `docs/SCHEMA_REFERENCE.md`, and `docs/LIBRARY_3D.md` before implementation. Recheck facts that may have changed since this audit.

| Area | Verified in source on 2026-11-08 | Not verified / missing |
| --- | --- | --- |
| Checkout | Branch `main`, commit `0057e96`; existing documentation modifications were present before this plan | Remote state and deployment state were not inspected |
| Public app | `app/page.tsx` is an under-construction page; existing ink/parchment/brass tokens in `app/globals.css` | No 3D world, scene assets, public project/blog/evolution/favorite routes, or public content loader |
| Declared stack | Next `^16.4.0`, React `^19.3.0`, Prisma `^7.10.0`, Tailwind 4, TypeScript 5, Zod 4; Cache Components and partial prefetch enabled | Usable Next/Prisma/TypeScript/pg/ESLint packages absent locally; do not claim installed compatibility from package.json alone |
| 3D packages | R3F, drei and three are not declared yet | Exact compatible versions must be checked and pinned during implementation |
| Library data | Seven Library models exist: LibraryZone, Shelf, ShelfSlot, Book, BookPage, ComputerScreen, SceneAsset; seven zones and eleven shelves are in reference SQL | Reference rows are source definitions, not proof they exist in Neon |
| Database | Prior source audit documents 52 models/tables, 452 scalar columns, 17 enums and eight views; migration source available | `.env` is 0 bytes; no DATABASE_URL or DATABASE_URL_UNPOOLED in this process; no live target/connection/migration checked |
| Existing admin | Source implements auth, projects, repos, sites, media, posts, events, moments, favorites and account | Not runtime tested in this task; Library placement/books/pages/screens/scene-version editors are absent |
| Rich content | JSON block fields and a raw project JSON editor exist | Shared validated component registry and renderer are absent; current save checks only array/object shape |
| Assets | No repository `public/` scene inventory was found; Blender skill and its documented executable path exist on the computer | Blender version/render/export and final assets were not executed or validated in this task |
| Agents/realtime | Tables, planned tools and notification SQL exist | No working public librarian, portfolio MCP, webhook receivers or realtime browser transport |
| Tests | No automated suite is declared | Historical handoff test claims are not fresh results |

Pre-existing changes: modified `HANDOFF.md`, `README.md`, `docs/DATA_MODEL.md`; untracked `docs/MIGRATION_STATUS.md`, `docs/SCHEMA_REFERENCE.md`, `scripts/gen-schema-reference.mjs`. Do not reset, stage, delete or overwrite them to make the tree clean. Inspect status again at implementation start.

### Two important source-level corrections

1. **Visibility and activation are separate.** `display` governs publication. `activation` (`inactive`, `tracking`, `paused`) governs ingestion. A paused project can remain published. Do not implement `activation === tracking` as the public-visibility test. The broad AGENTS.md instruction to respect both must be implemented according to their documented meanings.
2. **Existing SQL views are not a safe public API.** In particular, `v_library_shelves` resolves rows without a complete visibility/deletion gate; `v_live_feed` checks event visibility/expiry but not all source visibility/redaction. A new explicit public projection is required. Do not serialize raw Prisma rows, view rows or signal payloads into the browser.

## 3. Product and art direction

### Refined concept: a working library, not a game lobby

A contemporary personal research library with warm oak, parchment, dark ink, aged brass and restrained deep-green accents. It should feel crafted and calm, with clear readable destinations rather than a maze. Architecture, book typography and computer hardware share one visual language. No floating neon dashboard panels scattered across a generic room, no unrelated stock assets, no cyberpunk effects and no fake accomplishment metrics.

The first frame shows the front desk, a sightline to the project stacks, and enough of the left/right wings to communicate one connected place. Featured work is immediately reachable. Every destination is also in a conventional HTML navigation/catalog. The world enriches understanding; it never holds the content hostage.

Retain current UI token families. Suggested scene materials: warm oak `#76543A`, dark timber `#3D2D24`, parchment `#F6F1E7`, ink `#1D1A16`, brass `#9A6B1F`, forest cloth `#36564A`, muted slate `#48606A`. These are art-direction starting values, not measured contrast guarantees. Use real contrast checks for HTML labels, overlays and focus states.

- Broad architectural forms, chamfered edges, modest wear, consistent material roughness.
- Daylight from high windows, warm practical lamps, baked/contact shading and controlled exposure.
- One family of shelf bays, desk furniture and signage; avoid visual density at eye level.
- Distinctive details: brass shelf plaques, a card catalog/search drawer, a reading table, a simple sculptural librarian marker, an evolution frieze and an integrated two-screen computer desk.
- No background music or narration on load. Sound is optional, off by default, and not part of the acceptance gate.
- No invented humanoid assistant identity. The first librarian is a tasteful desk marker plus clearly labeled **Library guide**, not a promise of live AI.

### Spatial plan

One open room with seven functional areas, not seven separately loading levels. A starting blockout is approximately **30 m wide by 26 m deep**, with a **4.8 m ceiling**. World coordinates are Y-up, meters, entrance toward +Z, rear stacks toward -Z. Keep eye-level circulation clear, avoid forced stairs, and use uncluttered central paths at least 2 m wide.

These are proposed blockout coordinates. Refine camera framing and asset bounds after rendering, then freeze one authoritative manifest; do not duplicate hard-coded transforms between Blender, React and database defaults.

| Zone slug | Exact existing GLB node | Location / role | Initial camera position -> target |
| --- | --- | --- | --- |
| entrance | `zone_entrance` | Front center; desk and catalog search | `[0,3.0,10]` -> `[0,1.5,-3]` |
| stacks | `zone_stacks` | Rear wall; four project bays | `[0,2.0,-6]` -> `[0,1.8,-12]` |
| evolution-hall | `zone_evolution` | Left middle; ordered stage display | `[-8.5,1.7,1]` -> `[-13,1.7,0]` |
| periodicals | `zone_periodicals` | Front left; writing rack | `[-7,1.7,7]` -> `[-11,1.4,7]` |
| favorites-wing | `zone_favorites` | Right side; books/tools/optional longevity | `[8.5,1.7,-3]` -> `[13,1.7,-3]` |
| reading-room | `zone_reading_room` | Rear left; quiet table and courses/reports | `[-8,2.0,-7]` -> `[-13,1.5,-8]` |
| computer-station | `zone_computer` | Front right; demos and activity | `[5.5,1.7,7]` -> `[8.5,1.4,7]` |

Default camera FOV 45-50 degrees; final FOV and portrait framing are responsive. Eye-level shelf views should not pitch steeply. Transitional paths travel through a clear central waypoint rather than interpolate through shelves. Use a small navigation graph with validated waypoints. Zone camera presets are destinations, not a collision system.

### Exact shelf naming contract

Preserve these source identifiers; do not derive names by simply replacing hyphens in slugs. The mappings are not uniformly mechanical.

| Shelf slug | Exact existing node | Proposed placement |
| --- | --- | --- |
| stacks-ai-agents | `shelf_stacks_ai` | Rear bay x=-7.5, z=-12.2 |
| stacks-data-knowledge | `shelf_stacks_data` | Rear bay x=-2.5, z=-12.2 |
| stacks-web-apps | `shelf_stacks_web` | Rear bay x=2.5, z=-12.2 |
| stacks-client-work | `shelf_stacks_client` | Rear bay x=7.5, z=-12.2 |
| evolution-timeline | `shelf_evolution` | Left wall x=-13.2, z=0; stage panels rather than dense stacks |
| periodicals-blog | `shelf_periodicals` | Front-left rack x=-11, z=7 |
| favorites-books | `shelf_fav_books` | Right wall x=13.2, z=-8 |
| favorites-tools | `shelf_fav_tools` | Right wall x=13.2, z=-3 |
| favorites-longevity | `shelf_fav_longevity` | Right wall x=13.2, z=2; neutral samples only |
| reading-room-courses | `shelf_reading_courses` | Left rear x=-13.2, z=-10 |
| reading-room-articles | `shelf_reading_articles` | Left rear x=-13.2, z=-6 |

Shelf node is the local anchor, not necessarily a rendered mesh. Store front direction, slot grid, readable camera and hit bounds in the scene manifest. Proposed standard bay: 3.6 m wide, 2.7 m high, 0.45 m deep, three rows of eight content slots. Default DB capacity is 24. Position numbering is explicitly 1..capacity; map rows left-to-right, top-to-bottom. Specialized racks may use a different visual arrangement while keeping stable logical positions.

Do not compress text to fit every spine. A shelf-level HTML list supplies full titles; hovered/focused books show a readable label. Empty slots can contain decorative noninteractive volumes, but those are scenery, never fake projects or selectable content. More than 24 items uses catalog pagination and additional approved placement, not overlapping books or silently dropped items.

## 4. Asset production plan

### Preferred workflow

Produce the room and core props **originally and reproducibly in Blender**, using a saved Python scene-generation script and editable `.blend` source. This avoids dependence on purchased packs, mismatched styles and unverifiable licenses. Implement the functional graybox first, then replace geometry with the finished environment without changing anchor IDs.

The local Blender skill is at `C:\Users\Pinda\.codex\skills\blender\SKILL.md`; read its local setup reference. The executable documented there exists at `C:\Users\Pinda\AppData\Local\Programs\Blender\blender-5.2.2-windows-x64\blender.exe`, but the future agent must verify the installed version. Use official Blender Lab MCP if actually available, or the documented background Blender workflow. Do not modify security/network settings or install a different similarly named MCP package to obtain access.

A raster concept or generated texture can support art direction, but it is not a playable 3D asset. Do not claim an image generator has produced meshes, collision, UVs or rigging. No generated imagery is required to unblock this plan.

### Inventory and delivery tiers

| ID / asset | Functional placeholder | Finished v1 treatment | Required source / delivery |
| --- | --- | --- | --- |
| ENV-01 room shell | Primitive floor/walls/window planes | Beveled modular walls, beams, high windows, framed thresholds; visible ceiling where framing requires it | Original Blender script + `.blend`; `library-shell.<hash>.glb` |
| ENV-02 floor/rug | Solid colors and simple plane | Restrained timber floor, low-detail woven rug marking central reading space | Original procedural texture or licensed PBR with provenance; compressed maps |
| FUR-01 shelf kit | Box shelf repeated eleven times | One consistent bay family with plausible thickness, trim and brass plaques | Original instanced Blender modules; manifest anchors retained |
| FUR-02 front desk | Desk block | Curved/chamfered oak desk, card drawer, lamp, guide marker | Original; no animated human dependency |
| FUR-03 reading furniture | Table and chairs as primitives | Two table variants, chair prototype instanced, bookrests | Original kit; collisions unnecessary for guided camera |
| FUR-04 computer desk | Two monitor planes on box stand | Modern understated dual-screen workstation integrated with oak/brass furniture | Original model; screen anchors `screen_main`, `screen_side` documented |
| BOOK-01 closed book family | Shared box geometry with label | Cloth/leather/paper variants using one small mesh family and material/atlas variations | Original; instanced per shelf; no unique GLB per title |
| BOOK-02 selected/open book | Hinged cover and rigid page plane | Readable opening gesture and restrained page-turn flourish | Original local animation; HTML reader is content layer |
| SIGN-01 zone/shelf signage | DOM labels | Matching serif/microtype signage; 3D plaques plus accessible HTML equivalents | System font first; any distributed font needs included license |
| EVOL-01 evolution display | Six numbered panels | Continuous brass timeline frieze with six restrained stage markers | Uses actual stage codes; sample moments explicitly fictional |
| PROP-01 set dressing | None or simple shapes | A few lamps, bookends, globe/abstract sculpture, plant and wall frames | Original low-poly kit; avoid clutter and costly transparency |
| TEX-01 materials | Solid colors | Small shared oak/brass/cloth/paper palette; bake procedural Blender shaders to glTF-compatible PBR maps | Pack source textures, document color-space choices |
| LIGHT-01 lighting | Ambient + one key | Baked/environment lighting, restrained realtime key, ambient/contact shadows by quality tier | Original baked lighting or source-licensed HDRI |
| POSTER-01 fallback | Styled HTML gradient | One rendered library entrance still, landscape and portrait crops | Generated from final Blender source; AVIF/WebP plus alt text |
| CONTENT-01 sample covers | Typographic colored cards | Coherent original editorial covers with SAMPLE marking | SVG/PNG/WebP locally; no copyrighted book-cover requirement |
| CONTENT-02 diagrams | Labeled placeholder blocks | Original small architecture illustrations, sample screenshots and gallery cards | Deterministic SVG/HTML-generated sources; no invented real product screenshots |

Default inventory contains **no third-party model dependency**. Optional sources if they materially improve the result: Poly Haven (`https://polyhaven.com/`) or ambientCG (`https://ambientcg.com/`) for materials/HDRIs, Kenney (`https://kenney.nl/assets`) for simple props, and Google Fonts (`https://fonts.google.com/`) for a locally bundled typeface. These are candidate source sites, not assets acquired or licenses verified in this task. Verify the exact item's license, author and redistribution terms before use. Avoid asset aggregators with ambiguous licensing. No paid acquisition without approval.

### Required asset provenance and manifests

Create `assets/library/ASSET_MANIFEST.json` and `assets/library/README.md`. For each final asset record stable ID, source URL or original-generation script, author, license, retrieval/creation date, modifications, source path, output path/hash, dimensions, triangle count, material/texture count, compressed transfer bytes and attribution text. Bundle applicable license files under `assets/library/licenses/`.

Suggested structure (all proposed, not present now):

- `assets/library/source/library.blend`
- `scripts/scene/build-library.py`
- `scripts/scene/export-library.py`
- `scripts/scene/validate-library.mjs`
- `assets/library/scene-manifest.json`
- `public/scene/` for versioned runtime GLB, textures, decoders and posters
- `public/demo/` for original sample images/covers

Manifest version 1 includes coordinate convention, required zone/shelf/screen nodes, default camera presets, safe waypoints, slot grids, optional decorative nodes, bounding boxes and runtime asset hashes. Core GLB must not bake in project IDs, personal content or private metadata. It is architecture; DTO content populates books and screens at runtime.

### Export and review checklist

1. Set meters and transforms deliberately. Blender is Z-up; exported glTF is Y-up. Test the actual exported anchors and camera vectors rather than guessing conversion.
2. Retain named anchor empties through export and optimization. Never allow optimization to remove or rename semantic nodes.
3. Reuse geometry/materials; apply only necessary modifiers. Bake unsupported Blender procedural materials. Check normals, backfaces, pivots, scale and texture paths.
4. Keep authored `.blend` and script editable. Pack or include dependencies. Never overwrite an unrelated open Blender scene.
5. Export uncompressed master GLB, then optimize runtime copies. Prefer Meshopt plus KTX2/Basis where supported; use a verified fallback if device compatibility requires it. Test compression commands against the installed tool version, not copied historical flags.
6. Keep decoders/transcoders local and version matched. No mandatory third-party runtime CDN.
7. Run a glTF validator and custom anchor/bounds checks. Reimport the exported GLB into a clean Blender scene or viewer.
8. Render entrance, every zone and selected-book views. Inspect real pixels for camera collisions, dark labels, material scale, geometry gaps and book occlusion. View the final assets in the app, not just Blender.

## 5. Content architecture and offline-first development

### One content model, two presentations

Canonical HTML pages and catalog are the content source of truth. The canvas is an optional navigation/visualization layer consuming the same **public-safe DTOs**. Do not build an independent JSON content system for 3D that later requires rewriting to use Neon.

Proposed modules:

- `lib/library/contracts.ts`: Zod-validated public types, block types, scene references; no Prisma imports.
- `lib/library/data/provider.server.ts`: chooses explicit fixture vs database provider server-side.
- `lib/library/data/fixtures.ts`: deterministic synthetic data; no DB/generated Prisma/auth/Blob imports.
- `lib/library/data/prisma-provider.server.ts`: guarded dynamic import, queries and public projection.
- `lib/library/visibility.ts`: pure tested discovery/detail/redaction policy functions.
- `lib/library/scene/manifest.ts`: typed manifest loader and node validation.
- `lib/library/blocks/registry.ts` and rendering components: shared validation and UI.
- `components/library/`: shell, navigation, reader, catalog, search, guide, settings and canvas entry.
- `components/library/scene/`: camera rig, asset loader, shelves/books, screen surfaces and quality manager.

Keep pure types/enums out of `@/lib/db` on fixture/client paths. `lib/db.ts` eagerly creates Prisma and throws without DATABASE_URL, so even accidental import through a shared helper can break fixture mode. Guarded provider loading and import-graph tests are mandatory. Prisma may still need local client generation for the existing admin to typecheck; generation is not database migration.

### Explicit modes

Proposed server variable `LIBRARY_CONTENT_SOURCE=fixtures|database`. Never derive mode solely from whether the DB request succeeded. In local development with no connection, fixtures are an explicit documented default. A production build should require an explicit content choice and must not silently replace a failed real catalog with fictional achievements.

Fixture mode:

- Requires no Neon connection, Blob credentials, GitHub token, AI provider, analytics or remote API calls.
- Presents a persistent but unobtrusive **Sample collection: demonstration content** label, visible in reader/search/metadata as appropriate.
- Supports the complete visitor journey and a separate local, explicitly labeled admin preview sandbox.
- Admin preview uses in-memory or browser-local drafts, reset/import/export controls and no network writes. It is not the real authenticated admin, never impersonates a real save, and is disabled by default in production. Keep real `/admin` auth intact; a local `/dev/library-admin` or equivalent guarded sandbox is safer than bypassing existing auth.
- Database mode failures show honest unavailable/empty/error states and retry/fallback navigation, never hidden demo substitution.

Distinguish three outputs: (1) fixture fallback/test world, (2) real GitHub-sourced starter projects persisted in the verified database and visible in the protected local preview, and (3) complete DB-backed admin workflows verified on a safe test/development target. The requested final direction is (2), with (3) implemented and tested as far as the available target permits, not an indefinite fixture-only demo. Do not claim real persistence from mocks or invent DB availability. If blocked, keep the local fixture preview usable and report the exact missing target/configuration or permission; resume the approved seed when that blocker is resolved.

### Sample content package

Use stable fixture IDs (UUID-shaped where schema-compatible) and `demo-` slugs. All sample records carry fixture-only `isDemo` metadata; do not invent this as a Prisma column. Suggested collection:

- Eight project books: two per project shelf, such as **Sample Agent Workbench**, **Sample Research Assistant**, **Sample Knowledge Atlas**, **Sample Data Pipeline**, **Sample Web Application**, **Sample Interface System**, **Sample Client Case Study A**, **Sample Client Case Study B**.
- One featured item from each of the four project categories.
- Six synthetic evolution moments linked to actual stage codes: novice, builder, full_stack, systems_data, ai_agent_mastery, production_grade. Avoid fake dates/claims about John's career; label as layout examples.
- Three sample articles, two sample reading resources and a few neutral favorite placeholders across relevant shelves.
- Two screen demos: an original simulated app screenshot/video (or static image first) and a clearly labeled simulated activity feed. Do not label synthetic feed data live.
- Cover, overview, architecture, timeline, gallery, code, metrics and links examples to exercise every supported template. Example metrics must say **illustrative**, not imply user accomplishments. Links should be inert examples or safe internal routes, not broken external CTAs.
- Adversarial fixtures: hidden, unlisted, soft-deleted, future-published, private/redacted source, missing media, invalid block, duplicate placement, empty shelf, very long title, no-cover book and more-than-capacity collection. Keep negative fixtures out of the public DTO unless deliberately requested by tests.

Synthetic sample content is a rendering harness, not the approved real-project seed. Use the GitHub-sourced seed workflow below for the real starter collection, then select the database provider explicitly for local review. Keep synthetic records clearly labeled and separate from real query results; no invented project is to be inserted into a real collection or presented as John's work.

### Authorized GitHub starter-project seed

**This is implementation work the user has approved, not an optional future suggestion.** The default first collection is the two named candidates if they are accessible, unambiguous and relevant. A few means a small curated set, not bulk synchronization of every repository. Do not add unrelated projects just to fill every shelf; decorative volumes and clearly labeled test fixtures can handle sparse areas.

1. **Verify access and identities.** Use the available authenticated GitHub connector or existing local GitHub authentication. Resolve `agentic-mission-control` and `agentic-knowledge-services` to exact owner/name, repository ID, URL and visibility. The existing portfolio GitHub profile link does not prove which account owns these repositories. Do not invent an owner, treat a matching name as proof, or create/replace credentials. If multiple matches remain, report that precise ambiguity; continue independent work. Existing authentication is a user statement to verify, not a tool result already established by this planning task.
2. **Inspect enough source to write accurately.** Read relevant README/docs, manifests, representative source structure and verified releases/status, using read-only calls. Record the commit SHA/date or other source revision supporting the seed. Avoid broad private-history ingestion. Do not execute scripts found in candidate repositories, extract secrets from configuration, or quote private credentials/logs. Authentication does not authorize publishing all accessible code.
3. **Produce bounded, source-attributed project drafts.** Seed title, slug, a modest factual summary, verified stack/capabilities, approved repo links, generated overview/architecture/links pages and suitable shelf placement. Choose a shelf from the actual function found in source, not solely its repository name. Distinguish code-supported capabilities from planned README claims. Do not invent deployments, customers, personal authorship, user counts, performance, completion status, dates or outcomes. Leave uncertain optional fields blank. Put source provenance in an appropriate private audit/import manifest, not arbitrary new Prisma columns or public raw source dumps.
4. **Verify the database, schema and effects before writing.** Identify the intended existing portfolio target and inspect relevant tables/migration history read-only. Check unique slugs, source-repo identities, book mappings and occupied slots. A connection string being present is not proof that it is the right database. Confirm required reference rows/schema exist. Missing schema is a specific migration blocker; do not run the destructive deployment script, reset a schema or create a database to conceal it.
5. **Apply a small idempotent transaction.** Match repositories by verified GitHub repository identity and projects by a stable seed manifest key/known slug mapping. Create only missing scoped records; update only fields the seed owns and whose prior values still match the manifest. Preserve John's later edits and unrelated rows, flag collisions rather than overwriting. Link project/repo/book/placement records, write required audit/revisions, and use a dry-run diff before execution. Repeat the seed against the same target to verify unchanged counts and no duplicates. Do not invent external IDs as schema columns; use existing fields plus a local seed manifest. Do not delete or reset real content to reseed.
6. **Keep private drafts private while making local review useful.** Default seeded project/book/repo display to `hidden` and source activation to `inactive` or `paused`; no global repo-sync/webhook enablement. Avoid publish signals or public-facing side effects. Render these specific drafts through the protected local preview described below, not by weakening normal public DTO filters. A shared database may already serve a public site even while the new UI is local. Private repository access is not approval to expose private code, internal URLs or client facts publicly.
7. **Verify the real journey.** Load the seeded collection from the database adapter, open each book, verify the corresponding HTML detail, inspect the admin entry and reload to prove persistence. Record what was inserted/updated/unchanged/skipped and the exact safe target identifiers. Test after re-running the seed. Report inaccessible/ambiguous candidates honestly; do not replace them with invented claims or claim real seeding succeeded from fixtures.

For local visibility, use an authenticated admin preview session (and provide its verified entry URL) or a strictly development-only, loopback-only preview gate scoped to the seeded entity IDs. The latter must be explicitly enabled server-side, unavailable in a production build, unable to widen access via an arbitrary query flag, and not exposed by tunnels/LAN binding. Share the ordinary public renderer after a separate authorized preview projection; do not change the normal public-access rules. If the safe preview route needs a login, make that clear and retain the existing authentication flow. Never print a password or temporary access token in the handoff.

A configured shared/live portfolio database is not automatically forbidden for this narrow hidden draft seed if the target and absence of public side effects are verified. Publishing test records, deletion tests, schema changes or broad imports are outside that narrow authorization and belong on an authorized isolated target. If there is a material ambiguity or data-sharing expansion, ask for that exact missing decision, not generic repeat permission for the already approved seed.

If credentials or a usable schema are genuinely unavailable, continue with fixtures and a prepared source-backed seed bundle, launch the local preview, and report the specific blocker. Once it is resolved, complete the seed under the existing authorization. Do not force John to write the same project descriptions or do a manual import merely because fixture mode was originally planned.
## 6. Mapping to the existing Library schema

Use `prisma/schema.prisma` as the database source of truth, not this narrative. No core schema migration is required for a first world. Runtime metadata and validation contracts can live in code and existing JSON fields. Record any genuinely necessary additive migration as a separately reviewed proposal.

| Existing model | Fields used | Implementation rule |
| --- | --- | --- |
| LibraryZone | slug, kindCode, title, description, sceneNodeName, cameraPreset, sortOrder, display | Validate camera JSON; defaults from manifest; hiding a zone removes its content affordances, not structural room walls |
| Shelf | slug, zoneId, title, theme, sceneNodeName, capacity, sortOrder | Shelf has no display column; zone and contained-entity visibility govern it; validate capacity and registered anchor |
| ShelfSlot | shelfId, position, entityType, entityId, spineStyle | Unique shelf+position; no DB polymorphic FK; enforce existence, range, type allowlist, target visibility and safe style values in app |
| Book | slug, entityType/entityId, title, subtitle, coverMediaId, pageMode, display | Optional presentation wrapper; effective visibility never exceeds linked content; handle standalone books deliberately |
| BookPage | bookId, position, templateCode, blocks | Unique book+position; validated blocks; no independent page display; parent's effective permission applies |
| ComputerScreen | slot, mode, deploymentId, mediaId, config | Seed slots main/side; no display field; store `enabled` and safe mode configuration in validated JSON, gate through computer zone and referenced content |
| SceneAsset | slug, mediaId, version, isActive, notes | Versioned immutable asset; existing unique key is slug+version, not one-active-per-slug; activation needs atomic app validation |

### Placement and book resolution

Support existing slots pointing directly to project/post/favorite/timeline entities, plus explicit `book` slots. Do not require manually creating a Book row for every project. Resolver rules:

1. Validate and resolve the target using a supported entity allowlist.
2. If it is a Book, apply its own display policy and linked target policy.
3. If it is a content entity, use one explicitly resolved Book wrapper if present; otherwise generate a virtual book from that entity without a database write.
4. Multiple Book wrappers for one target are possible in the current schema. Never select an arbitrary first row. Admin flags ambiguity and excludes the public placement until a wrapper is explicitly selected. Do not discard hidden wrappers before resolving ambiguity; doing so could bypass their restrictive visibility. Generated fallback applies only when no applicable wrapper exists, not as an escape from a hidden or ambiguous wrapper.
5. Generated mode derives pages from canonical project/post/favorite/timeline data. Authored mode uses BookPage rows. Hybrid mode uses generated templates with explicitly authored template replacements/additions under a documented stable order. Do not append both duplicate overview/cover pages accidentally.
6. Book wrapper visibility is restrictive, not a bypass. Hidden target + published book remains hidden. Standalone authored books may be public on their own if deliberately published.

Use page positions for stored ordering, and stable semantic template IDs for generation. A project without a Book row should still appear in the HTML catalog and work when placed. Book pages are presentations of the source, not a second conflicting project record.

### Server-side publication contract

Define separate functions for **discovery**, **direct-detail access**, **admin preview** and **source ingestion**. Apply at every entry point, including route metadata, server-rendered HTML, RSC data, search, sitemap, screen content and future AI tools.

- `hidden`: absent from public list/search/world/feeds/metadata; direct public detail returns not found.
- `unlisted`: absent from discovery and sitemaps; direct URL allowed only if all linked content passes detail permissions. Set noindex. Unlisted is not confidential and is not authentication.
- `published`: discoverable and directly readable when not deleted and schedule permits.
- `featured`: same public access, plus intentional prominence; stable rank/sort fallback.
- `deletedAt`: exclude where the model has this field. Do not invent soft-delete columns for every model.
- `publishedAt`: enforce schedules for content types that define scheduling, especially posts. Use an injectable clock in tests; a cached not-yet-due item must not remain hidden forever after its schedule.
- Zone display gates shelf discovery; an unlisted/hidden zone must not make its books discoverable through a world payload. A hidden zone need not hide a published project from the independent general catalog.
- Relationship visibility is an intersection, never an override. Public project does not reveal hidden repos, private deployments, private media or a hidden book wrapper.
- Use `clients.publicAlias` when `showName` is false; never transmit private client name, internal notes or a concealed hostname/URL. Curated text must also be reviewed because aliases alone do not redact screenshots or prose.
- Repo policies: `none` permits only independently public-safe fields; `messages_hidden` removes raw messages; `counts_only` exposes only approved aggregate counts; `curated_only` exposes no raw commit/activity feed. The exact allowed DTO is explicit and tested.
- Events require public visibility, non-expiry and safe linked sources; never expose full payload, actor email, repository metadata or private URLs by default. Newly hiding a project must suppress its old public signals too.
- Public Blob URLs are not access-controlled merely because a DB row is hidden. Hidden media must not be transmitted to public DTOs; explain that anyone already holding a public URL can still access it. Confidential uploads need a separately designed private-storage workflow, not a false promise of revocation.

Start with explicit selected fields and a server-only resolver, rather than changing existing SQL views. This avoids a live migration dependency and makes policy unit-testable. A future view-hardening migration is possible but not necessary for the visual milestone.

## 7. Visitor experience and navigation

### First load and entry

Render a useful server HTML shell immediately: title, brief introduction, featured project cards, catalog/search access, scene poster and **Enter the library**. Begin importing 3D code only after user intent or a carefully bounded idle prefetch on capable desktop devices; do not fetch large GLBs before meaningful HTML. On mobile, reduced-motion or data-saving contexts, default to the catalog with an explicit optional 3D entry.

The canvas loader has actual load progress where measurable, a clear status, cancellation/return to catalog and a finite failure state. Preserve usable content if JS, WebGL or any asset fails. A poster is a preview, not a substitute for accessible content.

### Controls and state machine

Use guided camera navigation plus limited orbit/look within safe bounds, not first-person WASD/pointer lock for v1. This gives a spatial experience without requiring game literacy, collision physics or a movement tutorial. Rapier is not required. Keep free walking as an optional future feature, not a dependency or hidden scope increase.

States: `catalog`, `loading-world`, `overview`, `moving-to-zone`, `shelf-focus`, `book-selected`, `reader-open`, `screen-open`, `error-fallback`. Implement explicit transition ownership so stale camera animations cannot win after a later click.

- Global DOM toolbar: Library/Catalog toggle, zone menu, search, help, quality, reduced motion and reset view.
- Click/tap zone or use menu: move via a safe path and update contextual label.
- Click/tap shelf: frame it, show its full-title list and selectable volumes.
- Hover/focus a selectable volume: modest highlight and accessible title. Do not make hover mandatory.
- Select a book: short pull/open animation, then open an HTML reader. A clear close control, Escape and browser Back return to prior context.
- Repeated clicks while moving either update the destination or are safely coalesced. Never queue ten camera tours.
- An active reader owns focus and scroll; canvas controls pause. Restore focus to the invoking control and previous camera state on close.
- A selected book with invalid/missing content reports unavailable and leaves navigation functional. Never blank the whole world.
- A reset action always works; cancelling a tour cancels all pending steps and narration.

Keyboard controls are conventional: Tab/Shift+Tab through real DOM controls, Enter/Space to activate, Escape to close, Arrow keys only within an explicitly focused widget. Do not globally capture arrows, wheel, Space or touch gestures that belong to page reading. Offer previous/next shelf/book controls as buttons.

### Route model and history

Use real pages for durable content, such as `/projects`, `/projects/[slug]`, `/blog`, `/blog/[slug]`, `/evolution`, `/favorites`, and `/books/[slug]` for standalone authored books. The exact Next route organization can be refined by Astra while preserving these user-facing concepts.

A proposed in-world location is `/?view=world&zone=stacks&shelf=stacks-ai-agents&book=demo-agent-workbench&page=overview`. Parse it using a strict allowlist and validate references. Unknown zone/book/page falls back gracefully. Do not encode private IDs or draft information in public URLs.

- Explicit navigation pushes history; continuous animation, drag and hover do not.
- Initial invalid parameters are normalized without redirect loops.
- Back/Forward restores world, reader and page state without fighting animation.
- Deep links load only the selected public content, not every book's full body.
- A full project route is readable without loading the world. Reader provides **Open full page** and a shareable canonical link.
- Reader in-world state is an enhancement; SEO canonical points to the content route. Avoid creating an indexable duplicate for every camera URL.
- Draft preview is authenticated and uncached, not a public `?preview=true` bypass. It has noindex and is excluded from sitemap/search.

### HTML-first book reader

Choose an HTML overlay/drawer styled like an opened book, with semantic sections, crisp text and selectable links. On a large display it may show a two-page spread; mobile and zoom use one column. A short 3D cover animation is decorative. Do not render paragraphs into canvas textures or make transformed drei Html the only way to read.

Initial template registry: Cover, Overview/Prose, Architecture, Timeline, Gallery, Code, Metrics and Links. Reuse the same validated blocks for project detail, book pages and admin preview. Keep dynamic diagrams and media lazy. Never require all templates or empty pages in a real project. Generated pages omit empty sections; authored pages show validation feedback.

For code snippets, render text, never execute. Treat MDX and uploaded report text as untrusted input: no arbitrary imports, arbitrary React component execution, script tags or uncontrolled HTML. Either support a constrained documented MDX subset through a safe compilation pipeline or render sanitized Markdown and a strict block allowlist. Unsupported content gets an explicit editor warning, not eval.

### Computer station

The in-world monitors show lightweight posters, short summary text or simple canvas textures. Clicking opens an accessible DOM panel with the actual media/feed. Do not run numerous live iframes or videos as 3D textures.

- `image`: safe local/allowlisted image with meaningful alt text.
- `video`: poster first, click-to-play, captions where speech exists, pause on close/hidden tab.
- `feed`: current public-safe events or labeled fixture events, bounded count and no fabricated live indicator.
- `terminal`: explicitly labeled **Activity replay**, showing curated sanitized excerpts only; never a real shell or raw private commit log.
- `iframe`: explicit opt-in open, HTTPS allowlisted target and minimal sandbox/permissions. Honor frame denial; show poster + **Open site** link instead. Do not proxy around CSP/X-Frame-Options or ask visitors to bypass warnings. Avoid combining powerful iframe capabilities for untrusted same-origin content.

The seeded side screen has no deployment configured. Render an intentional empty/demo state rather than loading a missing URL. Validate all external URLs against supported schemes and destinations; reject javascript/data/file URLs in links or blocks. Any new server-side URL fetch/health check must guard private/link-local addresses and redirect chains to avoid SSRF.

### Library guide and future AI

Deliver a useful deterministic guide now: **Show featured work**, **Explore AI projects**, **View the journey**, **Browse writing**, **Find a project**. These call the same typed navigation commands as buttons. Label it clearly; do not show fake chat typing, invented answers or claim AI is connected.

Keep `navigateTo`, `openBook`, `searchCatalog`, `getProject`, `getTimeline` as pure/validated application commands ready for a future agent adapter. Real AI integration remains a separate milestone: provider/model and budget confirmed, server-side credentials, rate/abuse limits, privacy/retention policy, grounded citations and public-only tools. Never offer admin tools to the public agent. Conversations and pgvector are not required for the world. Do not build a surprise paid backend to animate the librarian.

Realtime is also non-blocking. Start with server-rendered or refreshable current data. A DB NOTIFY event is not a browser feed: it may include private events and requires an authorized bridge. Future SSE/provider choice needs an explicit deployment design; subscribe workers must re-read current public policy before emitting. No presence tracking by default.

## 8. Admin dashboard implementation

### Preserve and extend the existing system

Existing `/admin` is the base. Keep its authentication and account flow, existing project/media/post operations and database model. Add a **Library** navigation section with a practical content-first workflow rather than forcing John to edit coordinates or JSON for routine changes.

Suggested routes:

- `/admin/library`: overview of public collection, warnings, draft counts and **Preview as visitor**.
- `/admin/library/placements`: zone -> shelf -> slots, with searchable eligible content and keyboard-accessible reorder controls.
- `/admin/library/books` and `/admin/library/books/[id]`: generated/authored/hybrid configuration, cover and page/block editing.
- `/admin/library/zones`: title, display, order, validated camera presets with reset-to-manifest; advanced geometry controls not required.
- `/admin/library/screens`: main/side mode, referenced media/site, enabled state, poster and preview.
- `/admin/library/assets`: register an uploaded scene asset, inspect version/manifest compatibility, activate or restore an earlier version.

Existing project detail adds **Library presentation**, shelf placement and visitor-preview links. Project creation with a standard template should not require manually authoring a book or learning a separate CMS. The default hidden draft can get an optional generated book presentation; show the exact public state in one place.

### Publishing workflow

1. Enter title/summary and choose type/category; new content stays hidden.
2. Add optional sections/media and review privacy fields, including client alias and screenshot redaction.
3. Pick a shelf and position (or use a suggested free slot), preview cover and generated pages.
4. **Preview as visitor** shows the same policy/renderer as public mode but only to the authenticated admin, with a draft banner.
5. A publication checklist reports missing title, invalid blocks, broken references, inaccessible media, private linked content and ambiguous book mappings. Distinguish blockers from optional completeness warnings.
6. Deliberate **Publish** or **Feature** confirms resulting discovery placement; **Unlisted** clearly says direct-link access only; **Hide** removes discovery/detail access and related feed entries.
7. After save, show persisted state and safe error/retry feedback. Do not show success before the mutation completes.

Content display and source activation must be labeled separately (for example **Public visibility** vs **Track source activity**), not collapsed into one switch. Saving project text must not automatically publish it. If a book and project disagree, show the effective state and why, not two apparently contradictory green badges.

### Placement editor behavior

Use a list/grid first, optional 3D preview second. Drag-and-drop is an enhancement with move-up/down and shelf/position fields. Validate capacity, occupied target, unsupported entity type, deleted target and missing anchors. Do not call `portfolio_place_on_shelf` blindly: the current helper overwrites an occupied slot and does not enforce capacity, target validity or snapshot behavior.

Default policy: one primary placement per content entity, with intentional duplicate placement allowed only after an explicit choice. The schema permits duplicates across slots, so the UI/resolver must not pretend a uniqueness constraint exists. Moves/swaps are atomic and preserve both items. Reject or offer a reviewed swap for occupied destinations; never silently replace a project.

With a hidden zone or content item, keep its placement visible in the admin as unpublished and exclude it publicly. Hiding content should not destructively erase its placement. When a shelf's capacity is reduced, require resolving out-of-range content first.

### Books/pages and blocks

Provide field-based editors for ordinary Prose, image/gallery, links, architecture, code, metrics and timeline blocks; JSON remains an advanced escape hatch with the same validation. Show live HTML preview. Do not lose edits on validation failure, navigate-away warning, expired session or concurrent change. Support duplicate/reorder/remove page with clear confirmation for destructive actions.

Resolve generated/authored/hybrid precedence explicitly as described above. Keep generated text tied to canonical project fields; show which pages are overridden in hybrid mode. Existing `body_blocks` JSON is not validated enough for execution/rendering; enforce the registry on server save and read.

### Security and transactional writes

Every new page, Server Action and route handler calls `requireAdmin()`/`getAdmin()` appropriately. The layout and `proxy.ts` are not security boundaries. Validate all IDs, enums, URLs, block shapes, camera ranges, spine values and polymorphic links on the server. Never trust a client saying an entity is publishable.

Group content mutations, placement moves, audit and revision writes in a transaction. `snapshot()` currently reads max(version)+1 and can race; extend safely for transaction clients/concurrency, or use serialization/locking plus retry. Do not replicate its current race into multi-row edits. Use optimistic concurrency via existing updatedAt where available; otherwise compare a submitted revision/state hash in a transaction. Failed saves must not leave new content without its audit or partially moved slots.

Invalidate all affected public data keys/routes after writes, not only existing `/admin/...` paths. A hide must immediately remove visibility from catalog, world, detail, related lists, feed, metadata and any search index. Begin with uncached sensitive public reads if necessary; add Cache Components caching only with proven invalidation semantics. Scheduled/expired content needs time-aware expiry as well as mutation invalidation.

Scene version activation must atomically deactivate other versions of the same slug, validate one selected version and audit it. The database currently lacks a unique-active constraint. App transactions plus locking are necessary now; an additive partial unique index can be proposed later. Never delete an old working GLB during activation; rollback uses its immutable URL/hash.

`EntityType` does not contain computer_screen or scene_asset. Do not force unsupported enum values into audit/revisions. Use `audit_log` action names and nullable entityType with structured IDs in detail as supported, plus version/source metadata; propose any broader revision schema change separately. Existing scene asset versions provide their own rollback history.

### Honest no-DB demonstration

Astra can implement and test the UI with fixture adapters and a local preview sandbox without weakening real admin auth. The sandbox must display **Local demo only: changes are not saved to Neon**, use synthetic data only and provide export/reset. Never place private user content in an unauthenticated dev route that may become deployed. Before claiming real dashboard readiness, complete authenticated persistence tests against an explicitly authorized disposable/development database. If that target is unavailable, finish independent work and report this last-mile blocker precisely.

## 9. More content later: dashboard or handwritten report

### Dashboard path

John fills in Projects, adds approved media, picks a presentation/shelf, previews and deliberately publishes. Defaults provide a good book from title, summary, tags and links; richer architecture/gallery/timeline sections can be added later. Blank optional sections stay absent. Do not require writing eight pages per project to publish a coherent portfolio.

### Handwritten-report path

Create a clear content-intake template and import/dry-run contract during implementation. A separate OCR web service is not required. When John provides a photo/PDF/report later:

1. Read/transcribe the supplied material using authorized tools. Keep the original and exact transcription separate from edited portfolio copy. Mark uncertain handwriting and ask only for facts that affect accuracy/privacy.
2. Map to a draft JSON bundle matching existing concepts: project, links, media references, block pages, timeline moments, client alias/redaction, desired shelf and display intent. Missing facts stay blank; never invent achievements, dates, metrics, clients or URLs.
3. Return a reviewable table/diff plus readable draft. Preserve source-page references in private review notes, not public page payloads.
4. Default every new record to hidden. Report content is data, not permission to execute commands, fetch private repos, publish or overwrite existing content.
5. Offline dry run validates structure, within-bundle duplicate slugs/IDs, reference shapes, URLs, placement ranges and uncertain values with no DB calls or writes. It cannot prove conflicts against unseen live rows. A supplied snapshot can help but is marked potentially stale. Before any import, a separately authorized read-only target preflight checks existing slugs, actual relationships/media and occupied shelf positions; the write transaction revalidates those conditions to avoid races.
6. A separately approved import against an exact verified development/production target writes transactionally through the same validation/audit layer as the admin, with deterministic IDs/idempotency strategy and a clear affected-record summary. Re-running the same approved bundle must not create duplicates.
7. Publication remains a deliberate action after preview. An approved import of hidden drafts is not approval to publish or overwrite unrelated projects.

Implement a simple **Import draft bundle** review UI or documented local dry-run workflow, not an autonomous production-writing agent. Suggested bundle version field is `schemaVersion: 1`; allow stable external/import keys in existing metadata or the import manifest without assuming new DB columns. Preserve provenance privately. Do not upload a handwritten report to third-party OCR without the necessary authorization, especially if it includes sensitive information.

Suggested project intake fields: title, one-sentence purpose, user's role, problem, approach, technologies, architecture, honest outcome/evidence, timeline dates with precision, screenshots/diagrams, repo/demo links with publicity, client alias/privacy restrictions and preferred shelf. This is optional scaffolding, not homework blocking the world.

## 10. Accessibility, mobile and resilience

Target WCAG 2.2 AA for the ordinary HTML experience. Canvas is an enhancement; all portfolio information and actions have semantic DOM equivalents.

- Skip link, logical headings/landmarks, visible focus, labels/instructions and descriptive links.
- Reader dialog has accessible title, appropriate focus trap/inert background, Escape, return focus and correct document scrolling. Avoid announcing every camera frame or hover.
- Screen-reader users can browse all content without entering the canvas. Use concise live announcements for destination/content changes, not constant chatter.
- Minimum 44x44 CSS px recommended touch targets and comfortable gaps; test portrait/landscape and safe areas. No hover-only links or precision spine tapping.
- Contrast: 4.5:1 ordinary text, 3:1 large text and essential UI graphics; test actual token combinations in light/dark modes.
- Respect prefers-reduced-motion before the first animation. Replace camera travel/page flips with instant or short crossfade transitions; disable continuous bobbing, parallax and ambient movement. User setting persists locally without overriding a stronger accessibility preference unexpectedly.
- No flashes or surprise sound. No continuous movement behind long-form reading.
- At 200% zoom and narrow widths, reader becomes a single logical column with no clipped controls. Code can scroll within its own labeled region.
- WebGL creation failure, context loss, driver issue, load timeout, corrupted GLB, missing texture and low memory all lead to an intelligible fallback, not an indefinite spinner.
- On context loss, release stale resources, offer retry and preserve route/content state. Avoid repeated automatic GPU restart loops.
- Data-saver or low quality mode starts with HTML/poster. Do not rely on unreliable device-memory/UA guesses alone; capability detection, observed performance and explicit user choice govern enhancement.
- Hidden tab pauses rendering/audio/video; reader-open state can reduce or suspend scene updates. Dispose scene geometries, materials, textures, render targets, controls and event handlers correctly on unmount or version change. Shared loader caches need ownership/ref-count care so one component does not dispose assets still in use.

## 11. Performance and technical budgets

Budgets below are acceptance targets, not measurements already achieved. Measure production-mode local builds with a recorded device/browser/network profile, then tune before claiming success.

| Measure | Initial target |
| --- | --- |
| HTML catalog | LCP <=2.5 s, INP <=200 ms, CLS <=0.1 on a documented representative profile |
| Desktop world first-use transfer | <=8 MB compressed critical scene/models/textures, excluding deferred media |
| Mobile optional low tier | <=4 MB critical scene/assets; catalog remains immediately usable |
| Entrance poster | <=200 KB landscape; <=120 KB portrait target |
| Total v1 world assets | <=20 MB lazily loaded, excluding explicit user-opened videos |
| Scene complexity | <=200k visible triangles / <=150 draw calls standard tier; <=80k / <=80 low tier as starting budgets |
| Texture budget | Mostly 1K maps, selective 2K hero atlas; <=128 MB estimated GPU texture memory standard, <=64 MB low |
| Frame rate | Target 60 fps representative desktop, stable >=30 fps on tested mobile; reduce quality or offer catalog when sustained below target |
| Pixel ratio | Adaptive, generally capped 1.5 standard / 1.0 low; avoid automatic full-resolution rendering on very high-DPR phones |
| CPU/JS work | No expensive content parse, search/index build or per-book React state updates every animation frame |

Use instancing for repeated books and shelf modules where practical; separate static decoration from interactive hit regions. Only selected/nearby book labels need expensive text. Share atlases/materials; cap transparency, postprocessing and shadow maps. No physics, bloom stack, SSAO or environment-map extravagance without demonstrated value within budget.

Prefer demand-driven rendering while idle, with explicit invalidation during camera or selection animation. Add an adaptive quality ladder: reduce DPR, shadows, decorative detail and then use poster/catalog. Load main room once; lazy-load reader media, computer demos and zone-detail assets. Dispose old versions after the new scene is ready and no references remain.

Do not put Three/R3F in the server import graph. Use a client boundary that dynamically imports the canvas with SSR disabled; check the installed Next docs for the supported placement of `ssr: false`. Keep the HTML shell server-renderable. No hydration mismatch from random book heights/colors: derive deterministic variation from stable IDs or the manifest, not Math.random at render time.

Dependency policy: check React/R3F/three/drei version compatibility against actual available packages, pin compatible versions in lockfile, and add only needed modules. Avoid a heavyweight state/physics/postprocessing library merely for convenience. A reducer/context and existing Zod are sufficient until evidence says otherwise.

## 12. Safe local build and database boundary

### Initial audit blockers: recheck at implementation

At the initial planning audit, usable dependencies were absent; migration-status notes recorded a denied network installation. Recheck current state before treating either as an active blocker. This planning task did not retry installation. The future agent may try a permitted documented installation route once the implementation task is authorized, but must honor any denial, not use mirrors/proxies to bypass it. An installed-package directory placeholder is not successful installation.

`AGENTS.md` requires reading bundled Next docs. They are unavailable now because Next is not installed. Restore dependencies through an allowed route first, then read the relevant local documentation for dynamic imports, Client/Server boundaries, Cache Components, Suspense, caching/invalidation, route params/searchParams, Server Actions and Route Handlers. Do not silently downgrade the declared stack to fit older assumptions. If pinned package versions are unavailable, report and propose the smallest supported change.

### Dangerous default build behavior

Current `npm run build` runs `prisma generate`, then `scripts/db-deploy.mjs`, then Next build. With a configured target, `db-deploy.mjs` may drop legacy public schema objects with CASCADE when `_prisma_migrations` is missing. That can erase data before migrations fail. **Do not run the unguarded build during this work.**

Implementation should add a clearly named local verification script (for example `build:local`) that generates the client and runs Next build **without calling the migration script**. Keep deployment pipeline changes separately reviewable and never infer deploy authorization. As an additional defense, use `DB_DEPLOY_SKIP=1` for any verification path that can reach the existing script; confirm the skip log. A skipped migration is not successful migration verification.

No fixture build/runtime should require a live database or fabricated credentials. If existing admin's eager `lib/db.ts` initialization prevents building the public fixture app, narrowly refactor database access to initialize only on an actual DB-backed request, keeping real admin routes fail-closed with a configuration error. Do not bypass authentication, create a fake production URL, or turn real admin routes into unauthenticated demos.

Local commands and exact flags must be verified against installed tooling; do not execute this section during planning. Before build, inspect all scripts and inherited environment variables by presence only, never print secrets. Test the fixture app with DB variables absent and assert it makes zero database calls.

### Verified database target and authorized starter seed

Re-read `docs/MIGRATION_STATUS.md`, then recheck present configuration because the prior empty .env audit is historical, not proof that the implementation session is still unconfigured. Identify the exact project/branch/host/database from available authorized configuration without exposing connection strings; inspect catalog and migration history read-only. Once it is unambiguously the intended portfolio database and the necessary schema exists, proceed with the few approved project seeds under section 5's workflow. Do not ask again merely because a real database write is needed for that approved seed. Prefer an existing isolated development target for mutation tests. If only a shared/live target is configured, scoped hidden draft seeding may proceed only when it cannot affect public outputs; tests that publish/delete or unrelated writes need an isolated authorized test target. Applying missing schema, creating a database/branch, changing production settings or resetting existing data is not included and must not occur as a side effect of installation/build.

Never run `db push`, `migrate reset`, the legacy wipe or a destructive SQL helper to make tests pass. Never edit applied migrations. Do not reuse historical claims that preview and production share a connection as proof of today's configuration; verify before any future rollout. Production/preview database isolation must be settled before deployment, which is outside this task.

### Required local running preview and morning handoff

The deliverable is a **working local app left available for review**, not only code, screenshots or instructions to start it later. Use `C:\Users\Pinda\Overton-Portfolio-local` on John's Windows computer. Do not wait for a GitHub remote or Vercel project; John will create those himself. Deployment is a later, separate action after he has the opportunity to inspect and iterate.

- Start the app with the verified repository workflow after passing the relevant build/type/lint/test checks. Prefer a stable local production-mode preview after a migration-free build if supported, otherwise an explicitly documented development server. Either way, no migration is part of startup.
- Bind to loopback (`127.0.0.1`/`localhost`) and choose an available port, preserving unrelated running services. Never assume port 3000 or announce a URL before checking it. No tunnel, public preview link, firewall change, LAN exposure, service installation or scheduled startup task is needed or authorized.
- Use a process that can survive the worker's terminal/session when supported. On Windows, start background helpers with a hidden window and logs in a known local path; keep command, working directory and PID/process identity so restart/stop instructions target only this app. Do not kill another process to claim its port.
- After launch, request the actual URL and open it in a browser. Verify the landing/world loads, camera/reader navigation works, the seeded projects are visible through the appropriate local preview entry, the HTML catalog remains usable, and no fatal console/network errors occur. Verify database persistence by reload when seeding succeeded. An HTTP 200 by itself is not complete verification.
- Test any required admin-preview login path without bypassing real authentication. Report the correct local entry URL and whether sign-in is required. Do not include secrets in logs, output or URL parameters.
- Recheck process health and the URL after the last code edit/build and immediately before the completion report. Leave it running if possible. State what is still running, when it was verified and any environment limitation. Do not promise that a sleeping/restarted computer or session teardown cannot stop it, and do not change sleep/power/security settings to keep it alive.
- Write a short local runbook, for example `docs/LOCAL_PREVIEW.md`, with exact start/resume command, required working directory, chosen port/URL, content source (`database` or explicit fixture fallback), log path, safe stop/restart command and unresolved blockers. Include those essentials in the final message so John can open the result when awake without hunting through the implementation plan.
- Aim for a reviewable result by the morning if the work completes in time. Do not claim that timing is guaranteed or mark incomplete work finished to meet it. If still working or blocked, report what is available locally and the next concrete step without deploying anything.
## 13. Milestones and orchestration

GPT 6 Astra owns implementation and integration. If parallel workers are used for substantive implementation, they must also satisfy John's model requirement, not silently substitute another model. Divide work by independent modules and use one integration owner; do not let asset and UI workers invent incompatible scene/content contracts. Any worker receives this document, the exact repo path, the no-deployment boundary and narrow verified-target starter-seed authorization and the relevant source files.

Use a local checklist/implementation log with meaningful completed/blocked states. Do not claim every milestone complete because the world renders once. Estimates depend on installation and modeling performance; prioritize complete vertical slices and report evidence rather than speculative calendar promises.

### M0. Establish the safe baseline

**Work:** Verify actual model is GPT 6 Astra, repo path, branch/status, existing changes and local instructions. Inspect package scripts. Restore dependencies only through an allowed route; read bundled Next docs. Add/use a migration-free verification path. Verify Blender capability without touching another scene. Verify available authenticated GitHub access, resolve the two named repositories without assuming owner, and identify the intended database/schema read-only. Record precise dependency/config blockers and start the source research in parallel with design work.

**Exit:** Toolchain and GitHub candidates known, or exact access blockers reported; existing work preserved; no database mutation yet and no deployment action. The fallback app can build/dev-serve without DB. Database target/schema findings and the starter-seed dry-run inputs are recorded without secrets.

### M1. Freeze contracts and build the content foundation

**Work:** Define scene manifest, public DTOs, explicit source selector, fixture collection, visibility policy and block registry. Build HTML catalog and one deep-linkable project page. Implement generated/authored/hybrid resolver and unit tests independently of Prisma. Establish deterministic data, ID and slot conventions. Map verified GitHub facts to a small source-attributed draft seed bundle; prepare transactional/idempotent seed and local-preview projection. Start M6 seeding as soon as these contracts and the target are ready, not only after all art/admin work.

**Exit:** All sample content is accessible through HTML without WebGL/Neon; hidden/unlisted/alias/redaction tests pass; representative book templates render safely. The manifest includes exactly seven required zone and eleven shelf anchors plus explicit screen mapping.

### M2. Complete a functional spatial vertical slice

**Work:** Primitive room with all anchor locations; working overview -> shelf -> book -> reader -> back. Add guided camera state machine, DOM controls, URL navigation, optional guide actions, loading/error boundary and device/reduced-motion selection. One sample project fully exercises 3D and HTML parity.

**Exit:** Mouse, keyboard and touch can complete the same journey; direct route and Back/Forward work; no camera path cuts through furniture; failure returns to content. All remaining zones have working meaningful selection, not decorative inaccessible rooms.

### M3. Produce and integrate the final environment

**Work:** Original Blender room/furniture/books/signage, optimized GLB/materials, baked lighting and posters. Keep script/source/provenance. Validate anchors after optimization. Review entrance and every zone in actual app screenshots, including mobile low tier. Adjust composition so the world feels intentional with a sparse or full collection.

**Exit:** Finished v1 environment replaces graybox without changing content contracts. All zones look coherent; selected books are readable; no missing-node/texture errors; provenance complete; performance budget measured. This milestone is not complete with only primitives or a generated concept image.

### M4. Complete visitor features

**Work:** All book templates, search/filter/catalog, evolution display, periodicals, favorites/reading room, computer panel modes and deterministic guide. Add content/asset loading and cancellation, sensible empty states and correct route/canonical metadata. Resolve sound/video behavior and accessibility issues.

**Exit:** Full fixture visitor experience works without any connected service. No deceptive AI/live-data claim. Unsupported iframes/media/unknown blocks fail safely. Clear mobile/catalog preference and persistence work.

### M5. Extend Library administration and content intake

**Work:** Build authenticated Library pages/actions, validated editing controls, placement moves/swaps, books/pages, screens, scene versions, protected visitor preview, publishing checks and shared cache invalidation. Add local sandbox adapters for no-DB UI verification. Implement draft-bundle schema/dry run, intake template and idempotency design.

**Exit:** John can understand how to create a project, preview it, place it, publish/hide it and replace media through the UI. Sandbox explicitly says local demo. Server actions enforce authorization and transactional validation in tests. Handwritten-report pathway yields reviewed hidden drafts, not uncontrolled publication.

### M6. Seed approved projects and verify real persistence

**Dependency:** Verified intended portfolio database with the existing schema, verified GitHub candidate identities and working dependencies. John has already authorized the few source-backed project seeds. Missing credentials/schema, ambiguous ownership/target or unsafe side effects are specific blockers; creating/migrating/resetting a database is not silently included.

**Work:** Implement the Prisma adapter and validate schema mapping/read policy. Research the two named candidates using authenticated GitHub; execute the scoped starter seed transaction once target and dry-run checks pass. Verify rows, repo links, books/placements, audits and rerun idempotency. Make the seeded projects visible through the safe local preview without publishing drafts to an existing public site. Test real auth/save/reload and revisions; run publish/unpublish, concurrency and destructive edge-case tests only on a safe authorized development/test target. No deployment, production settings or unrelated records are touched.

**Exit:** A few verified real projects, prioritizing the two named candidates when eligible, are persisted and visible in the running local world; source provenance, written/unchanged/skipped counts and idempotency are reported. If a genuine blocker remains, report it precisely and leave the fixture-backed local preview running, with the validated seed bundle ready. Fixture-only completion does not silently satisfy the approved seeding request. Do not claim real dashboard persistence from mocks.

### M7. Verification and delivery

**Work:** Run the matrix below, accessibility/manual review, asset validator, lint/typecheck, unit/integration/E2E tests and migration-free production build. Re-run affected checks after final edits. Launch the completed local preview on loopback, verify its actual URL in a browser and exercise the seeded collection. Leave the server running if the environment supports it; record process/log/resume details and recheck health before handing off. Capture screenshots and update docs/handoff with commands, paths, measurements and limitations.

**Exit:** John receives a tested local URL he can open for review and iteration before deployment, plus exact restart instructions if the computer/process stops. The starter seed is complete or its exact blocker is explicit; no fake content was silently imported. Preserve the server where possible. No deployment, GitHub remote creation/change, Vercel creation or push; John will create those later. Report actual readiness without guaranteeing it will finish before he wakes.

### Dependency graph and non-blockers

- M0 -> M1 -> M2. Asset work M3 can proceed once M1 anchors/layout freeze; M4 integrates M2/M3.
- Admin UI M5 can proceed in parallel after M1 contracts, without a live database.
- GitHub research begins at M0; M6 starter seeding is already authorized and runs as soon as M1 contracts and the verified target are ready, in parallel with world polish/admin work. A genuine DB blocker cannot stop M2-M4 or the running local fallback.
- M7 integrates all completed paths, starts/verifies the local review server and explicitly distinguishes any blocked M6 work. Do not end with code-only delivery when a working local preview can be launched.
- AI, realtime, custom humanoid avatar, physical walking, guestbook, biomarker modules, analytics and production deployment are deferred. None is required to deliver the promised library and admin controls.

## 14. Verification matrix and definition of done

Implement automated tests alongside the work, not as an afterthought. A suggested minimal tooling choice is Vitest (or the project's verified compatible runner) for pure policy/resolvers and Playwright for browser flows, with axe checks plus manual accessibility review. Verify packages rather than adding speculative versions. Browser tests should use fixture data by default and must not accidentally connect to production.

| Area | Required checks | Evidence |
| --- | --- | --- |
| Source selector | Fixtures with all DB/Blob/GitHub/AI variables absent; database mode failure never falls back to demos; production fixture opt-in explicit | Unit/import graph tests and recorded network check |
| GitHub starter seed | Exact repository identity/access/visibility; source-backed facts; target/schema preflight; transactional scoped writes; rerun produces no duplicates or overwritten manual edits; hidden defaults and safe local visibility | Read-only source provenance, seed diff/result and database/browser verification |
| Running local preview | Available loopback port; actual URL opened in browser; seeded books/detail/admin paths work; process survives where supported; final health recheck; accurate logs/resume command | URL, timestamp, process/log record, screenshots and runbook |
| Publication | hidden/unlisted/published/featured, soft-deleted and scheduled content; discoverability vs direct URL; book wrapper and target intersection; hidden zone vs independent catalog | Parameterized policy tests |
| Activation | paused/inactive published content visible; tracking hidden content private; ingestion flags never unlock content | Unit tests |
| Redaction | Every repo policy and client alias across text, URLs, counts, actor, feed, terminal, metadata, media alt text and link previews; old public event disappears when target hides | Public DTO snapshots with sentinel private strings absent |
| Content blocks | Valid templates; malformed/unknown component; unsafe URL; oversized/recursive inputs; code/HTML/script injection; absent optional data | Validation/render tests |
| Book resolution | No Book row; standalone; linked wrapper; ambiguous wrappers; generated/authored/hybrid order and overrides; missing page/media | Resolver tests |
| Placement | 1..capacity boundaries, full shelf, move/swap, occupied slot, duplicate policy, invalid entity type, missing entity, hidden target, null/duplicate scene nodes | Unit + transactional integration tests |
| Scene contract | Seven zone and eleven shelf anchors; two mapped screen anchors; coordinate conversion, bounds/slot grid, optimized GLB retains names | Validator output plus reimport |
| Navigation | Enter/cancel; each zone; repeated clicks; interrupt tour; select/close/reopen; browser Back/Forward; deep link/reload; invalid query; opening external/full-page links | E2E plus video or screenshots |
| Reader | Correct title/page order, semantic text, all templates, close/Escape/return focus, scroll, zoom, mobile one-column, no stale reader after URL change | E2E and manual screen-reader check |
| Search/catalog | Same visibility and content as world, empty results, long text, all categories, filtered selection, no hidden title/slug leakage | Unit + E2E |
| Screens | All five modes, missing config, blocked iframe, invalid media, pause on close, explicit playback consent, no raw shell/private output | Fixture browser tests |
| Accessibility | Keyboard-only complete journey, visible focus, 200% zoom, contrast, labeled controls, reader focus, reduced-motion from first render, no hover-only actions | axe + manual checklist; no blanket automated-compliance claim |
| Resilience | Disabled JS HTML where applicable, WebGL unavailable/context loss, failed/corrupt GLB, slow load/cancel, failed font/media, hidden tab and resume | E2E fault injection + manual GPU case |
| Mobile | 360/390px portrait, tablet portrait/landscape, desktop at 1366 and 1920 widths, high-DPR limit, touch scrolling vs canvas gestures | Named device/browser screenshots |
| Performance | Cold/warm loads, render statistics, triangle/draw-call counts, transferred bytes, memory/resource trends across repeated enter/exit and asset swaps | Production-mode measurements and profiles |
| Auth/admin | Signed out, expired/forged session, forced password change, direct action requests, unauthorized preview, validation failure retains edits | Integration/E2E on authorized test target; mocks clearly marked |
| Admin workflow | Create hidden draft -> preview -> place -> publish -> reload -> edit -> hide; deleted/changed related source; no partial audit/placement writes | DB-backed integration proof when available |
| Concurrency | Two tabs edit same record/slot/version; audit/revision numbering; exactly one active scene asset per slug | Transaction tests against authorized test DB |
| Import | Valid dry run, uncertain/missing fields, duplicate slug/ID, unsafe link, conflicting slot, repeated identical bundle, unauthorized publish/overwrite rejected | Fixtures and integration tests |
| Cache correctness | Hide/delete/alias changes affect every public surface; no admin preview leakage into shared cache; scheduling/expiry advances on time | E2E with fake clock where appropriate |
| Existing admin regression | Existing projects/repos/sites/media/posts/events/favorites/account flows still usable; no auth weakening or accidental route collision | Targeted smoke suite, state what could not run |
| Build | Typecheck, lint, tests, asset validation, Next production build with migrations excluded; no secrets or DB imports in client | Command exit statuses and output summary |

### Required visual evidence

Save screenshots of entrance overview, each zone, one selected shelf, open book on desktop, single-column mobile reader, mobile catalog, reduced-motion mode, graceful loading/error fallback, admin placement editor and publication preview. Use the verified approved starter projects in the protected local preview, with synthetic fixtures labeled wherever still needed; never expose private source facts in public screenshots. Review screenshots at final viewport sizes; do not accept invisible labels, accidental clipping, floating furniture, z-fighting or lens distortion because tests passed.

### Definition of done for the fixture world

- The complete designed room and all seven areas exist with finished v1 assets, not just a graybox.
- All eleven shelf anchors have sensible empty/populated behavior; sample books/screens work.
- Any visitor can discover/read the same content in HTML and 3D; direct links and history work.
- No live service or credential is required for the sample world, content readers or local demo controls.
- Samples are unmistakably samples, never presented as John's career facts.
- Mobile, keyboard, reduced motion, no-WebGL and failed-asset paths are usable.
- Security/visibility contracts are implemented and tested before the DB adapter can feed the browser.
- Assets have editable sources, optimization/rebuild scripts, manifest and licensing records.
- Measured performance meets targets or deviations are plainly documented with remedies.

### Definition of done for the requested starter collection and local review

- The exact GitHub identities and relevant source revisions for the two named candidates were verified, with no guessed owners or unsupported claims.
- A few eligible projects were seeded transactionally into the verified intended database; rerun idempotency, preserved manual edits and hidden/public-safety defaults were checked. If a real blocker prevented this, it is stated explicitly rather than marking the seed complete.
- The database-backed books, HTML detail and admin entry were browser-tested through the safe local preview. Fixtures are clearly separate wherever still used.
- The actual loopback URL is reported and the app is left running where supported, with final health verification, content-source status and exact restart/log details. Server persistence limitations are disclosed.
- John can review and iterate before deployment. No remote or Vercel setup is created for him and no premature public publication occurs.
### Definition of done for the real admin integration

In addition to the fixture criteria: authenticated persistence, audit/revision consistency, real protected preview, publish/hide effects, placements, screen configuration and scene version switching are verified on an authorized development target. If credentials/target authorization are unavailable, mark these as **implemented but integration unverified** or **not implemented**, whichever is true. Never substitute a simulated click-through for that evidence.

### Final implementation report must include

1. What is implemented versus deferred/blocked; separate fixture world, sandbox admin and real persistence.
2. The verified local preview URL, which content source it uses, whether the server is still running, process/log details and exact local start/resume plus migration-free build/test commands.
3. Changed files, local asset/source locations and screenshots.
4. Test results as passed/failed/not run, with why and smallest next step.
5. Performance profile and measured asset sizes, not unsupported claims.
6. A precise seed report (target identifiers without secrets, verified repo identities, sourced facts, IDs/slugs, inserted/updated/unchanged/skipped counts, visibility, audit/provenance and idempotency result), plus confirmation that no deployment, push, schema migration, remote/Vercel creation or premature public publication occurred.
7. A short guide for John: add a project, preview, publish/hide, place on shelf, or supply a handwritten report.
8. Any decision/approval still needed, without blocking already-complete independent work.

## 15. Risks, defaults and escalation points

| Risk | Default mitigation / escalation |
| --- | --- |
| Installation/declared version unavailable | Report actual failure; use allowed package route only; propose compatible version changes, do not silently downgrade |
| Build triggers legacy wipe | New migration-free local build; never unguarded existing build; no DB credentials required for fixture path |
| Missing or ambiguous database target | Verify available configuration early; finish and run the fallback world if genuinely blocked; report the exact missing target/schema/configuration and resume the already approved seed when resolved |
| Private content leaks via convenient views | Server-only explicit projections, sentinel-data tests, no raw payload serialization |
| Hidden public Blob stays accessible by known URL | Explain limitation; never promise DB visibility revokes URL; private-media architecture is separate |
| Art asset scope overwhelms code | Original reusable modular kit, seven areas in one room, no humanoid/physics dependency, final polish milestone explicit |
| Placeholder design becomes a throwaway | Stable DTOs and scene anchors from the start; replace provider/content, not renderer |
| Graybox mislabeled complete | Require final Blender assets and real-pixel visual review |
| Admin appears complete without persistence | Distinguish sandbox from real authenticated saves; require DB evidence before claiming completion |
| Concurrent edits corrupt placements/revisions | Transactions, optimistic concurrency and locked scene activation; no blind SQL helper calls |
| GPU/mobile instability | Conservative budgets, adaptive DPR, pause/dispose, optional 3D, always-available HTML |
| Long titles/large collection | Full DOM title list, generated layout constraints, catalog pagination and no forced unreadable spines |
| Expensive/deceptive AI or realtime | Deterministic guide and labeled fixture feed first; separate verified service/budget work later |
| Report transcriptions are wrong or sensitive | Private review draft, uncertainty markers, no fabricated facts, hidden defaults and explicit import/publication approval |
| Feature expansion stalls delivery | Ship the world/admin core before free walking, agent chat, guestbook, analytics or biomarker features |

Defaults chosen to avoid unnecessary design interviews: guided camera, HTML reader, one connected room, original modular assets, verified GitHub starter-project seeding with fixture fallback, deterministic guide, no sound, no physics, no analytics, local running preview, and no premature public publication. John can revise aesthetic details later without changing the architecture. Ask only when a concrete permission, unavailable model, irreversible action or genuine factual ambiguity blocks the next step.

## 16. Copy-ready handoff to GPT 6 Astra

Use the following prompt in a chat **actually configured with GPT 6 Astra**. It carries John's explicit narrow approval for authenticated GitHub research and starter-project seeding. It does not select the model, authorize deployment, or authorize schema migration. Include section 1's verbatim clarification with the handoff when forwarding to a worker.

> Implement the 3D Library portfolio locally in `C:\Users\Pinda\Overton-Portfolio-local` using `docs\LIBRARY_IMPLEMENTATION_PLAN.md`. You must be GPT 6 Astra; if the chat is using another model, stop before coding and report the mismatch rather than substituting a model. Build and spin up a tested local preview, leaving it running if possible so I can view it when I wake up, if the work is done by then, and iterate before deployment. Do not promise a morning deadline you cannot verify.
>
> Start by reading AGENTS.md, HANDOFF.md, this plan including my clarification in section 1, docs/ARCHITECTURE.md, docs/DATA_MODEL.md, docs/ADMIN.md, docs/MIGRATION_STATUS.md and the Prisma schema. Inspect repo status and preserve existing work. Read relevant local skills, use the installed Blender workflow for reproducible original assets, restore dependencies only through an authorized route and read the installed Next.js docs before coding.
>
> I authorize you to inspect my authenticated GitHub and seed a few accurately sourced projects in the intended portfolio database, so I do not have to take an extra content-population step. `agentic-mission-control` and `agentic-knowledge-services` are good candidates. Verify their exact owners/identities, accessibility and visibility rather than guessing. Read enough README/docs/code to describe what they actually do; do not invent accomplishments, clients, metrics, deployments or authorship. Verify the exact database target and existing schema before scoped writes. Use a reviewed dry-run diff, transactions, source provenance, stable matching/idempotency, audit/revisions and safe placement. Preserve existing user edits and unrelated records. This narrow seed is already approved; ask only for a specific missing target, conflicting write, data-sharing expansion or required migration, not generic permission to do the seed again.
>
> Make seeded drafts visible in a safe local preview without prematurely publishing them to any existing live site. Keep hidden defaults and normal public filtering intact; use authenticated preview or a strictly development-only loopback preview gate scoped to the seeded records. Private repo access does not authorize public disclosure of private code or client facts. No public publish signals or broad GitHub synchronization. Confirm actual DB persistence and that rerunning the seed creates no duplicates. If the database/schema is genuinely unavailable, keep building with clearly labeled fixtures, prepare the source-backed seed bundle, report the exact blocker and resume the approved seed when resolved. Do not silently choose an indefinite fixture-only result.
>
> Preserve the seven zone and eleven shelf identifiers. Deliver a polished spatial library with original editable Blender source and optimized GLB, not just a graybox/concept image. Keep accessible HTML catalog/detail pages as the content source of truth with 3D optional navigation. Extend the existing admin for books/pages, placement, screens, scene versions, protected preview and visibility; retain dashboard and handwritten-report intake for my later additions. Share typed public-safe DTOs between explicit fixture/database adapters, enforce current visibility/redaction server-side, and keep ingestion activation separate from publishing. AI and realtime services are not prerequisites.
>
> Use a migration-free local build. The current npm run build can call a destructive legacy database wipe; do not run it unguarded. No schema migration/reset, credential creation, paid purchase, push, GitHub remote creation/change, Vercel project/deployment creation or deployment is authorized. I will create the GitHub remote and Vercel setup myself. My local review and optional iteration come first; do not treat available deployment tools as permission to publish.
>
> Work through the milestones and test visitor journeys, keyboard/touch/reduced motion, history, WebGL/asset failures, privacy, administration and performance. Start the app on an available loopback port, browser-test the actual local URL and real starter-project collection, and leave a persistent background server when supported. Avoid public tunnels or system power/security changes. Record the actual URL, content source, process/log details and exact start/resume commands in docs/LOCAL_PREVIEW.md. Recheck health before reporting success; explain any sleep/restart/session limitation honestly.
>
> Keep useful milestone updates coming and finish with the local URL and server status, seeded-project/source/target summary without secrets, screenshots, exact run/test commands and passed/failed/not-run checks. Distinguish real DB persistence from a fixture/sandbox fallback. State what remains and confirm no deployment, remote/Vercel creation or premature public publication occurred.
## 17. Planning audit record

The plan was revised after John's clarification to include authenticated GitHub candidate research, a few verified-target real project seeds and a running local preview for morning review if ready. Section 16 and the content modes, database boundary, milestones, verification and final-delivery requirements were updated consistently. This revision itself made documentation changes only; GitHub access, repo owners, current DB configuration and server readiness were not tested anew.

This plan was prepared from the local source, not from a running deployment. The planning task inspected documentation, package declarations, repository status, schema, source admin/actions/auth, SQL views/reference rows, available asset paths and Blender instructions. It did not install dependencies, run application tests/builds, connect to a database, create assets, implement code, migrate/seed data, modify Git remotes, push or deploy.

Primary source references:

- `prisma/schema.prisma`: publication/activation enums and comments; Library models around lines 904-1017.
- `prisma/migrations/20261008000100_seed_reference_data/migration.sql`: scene identifiers around lines 91-123; no authentication values should be copied into reports.
- `prisma/sql/objects.sql`: views around lines 58-145; display/placement helpers around lines 172-229; activity notification around lines 40-51.
- `app/admin/(console)/projects/actions.ts`: current project write/publication/body-block behavior.
- `lib/auth/session.ts`, `lib/admin/audit.ts`, `lib/db.ts`: auth, transactional/revision considerations and eager DB initialization.
- `package.json`, `scripts/db-deploy.mjs`, `prisma.config.ts`, `next.config.ts`: declared toolchain, build/migration coupling and Cache Components.
- `docs/MIGRATION_STATUS.md`: current verified source audit versus pending live migration.

The document is ready to hand to GPT 6 Astra. **That readiness is planning readiness, not a claim that dependencies, a live database or the 3D world are already operational.**




