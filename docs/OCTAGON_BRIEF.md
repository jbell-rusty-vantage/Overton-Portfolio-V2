# Brief: The Octagon at Night

**For:** the agent session building the next Library (Claude Fable 5.2).
**From:** John Overton (owner), drafted 2026-11-10.
**Status:** approved direction. The owner chose concept A, *The Octagon at Night*. This brief overrides `HANDOFF.md` and `docs/LIBRARY_3D.md` wherever they conflict.

## The outcome

A visitor enters a dark, rain-lit octagonal reading room. A Custodian takes a volume from a shelf, carries it to a lectern and opens it. The visitor turns real pages that hold John's projects. The pages are typeset like a book, with moving plates (videos playing on the page) and a fold-out architecture diagram. Zooming into a spread gives crisp, selectable, linkable text. The site deploys on Vercel. Last of all, the Custodian can answer questions, using a low-cost model through Vercel AI Gateway.

**Hyper-realism here means photographic lighting and materials, delivered in the browser.** It does not mean a photoreal human. The book is the main thing, so build it first and get it right before building the room.

## Read before you start

1. `AGENTS.md`. The ground rules are binding: Prisma 7 imports from `@/lib/db`, Cache Components with `<Suspense>`, `requireAdmin()` for anything admin, `audit()`/`snapshot()` on writes, visibility rules everywhere, and never editing an applied migration.
2. `docs/ITERATING_ON_THE_LIBRARY.md`, `assets/library/README.md`, `docs/LOCAL_PREVIEW.md`.
3. The Next.js guides in `node_modules/next/dist/docs/`. This is Next 16.4 and differs from your training data.
4. Code you will build on:
   - `components/library/World.tsx`: camera rig, hit targets, the current book pull.
   - `components/library/Experience.tsx`: state machine, URL state, guide.
   - `components/library/Reading.tsx`: the HTML reader, which stays as the accessible fallback.
   - `lib/library/model.ts`: the `Volume`, `Leaf` and `Block` types.
   - `lib/library/catalog.ts`: `getCollection()`, the only source of visitor-safe data.
   - `lib/library/policy.ts`: the block allow-list and template names.
   - `lib/library/scene-contract.ts`: the GLB anchor validator.

## Verified state on 2026-11-10

- **The content is already seeded.** All 14 volumes in `content/library/books.mjs` are in Postgres as projects and hybrid books with 4–6 pages and shelf positions. `node --env-file=.env scripts/seed-library-content.mjs` (plan mode) reports every volume `unchanged`. **All of them are hidden.** No blog posts exist yet, so the periodicals bay will be empty. `HANDOFF.md` still says only two starters exist; that is out of date.
- **The current hall is a stylized procedural build.** `assets/library/build.py` produces about 95k triangles with lighting baked into vertex colours, delivered as `public/library/hall.glb` (2.0 MB) and `public/library/hall-low.glb` (1.5 MB). It can't reach this level of realism. The Octagon is a new, hand-authored Blender source.
- **Selecting a book today** plays a short pull animation and then opens the HTML reader as an overlay.
- **Stack:** three 0.187, @react-three/fiber 9.8.2, no drei, no `ai` package yet. Blender 5.2.2 is at `C:\Users\Pinda\AppData\Local\Programs\Blender\blender-5.2.2-windows-x64\blender.exe`. A Blender MCP connection may be live. **It controls the owner's open Blender session**, so inspect it before changing anything and never make destructive edits without asking.
- **`AI_GATEWAY_API_KEY` is set in `.env`**, which is git-ignored. Never print, log or commit it. Add an empty placeholder to `.env.example`.

## Content to use

`content/` holds the authored, public-safe copy. It is already the source of what's in Postgres.

| Path | What it is | How to use it |
| --- | --- | --- |
| `content/library/books.mjs` → `books.json` | The 14 volumes: copy, pages, media, shelf, position, `publishAs`, and a per-volume `blurb` written in the Custodian's voice. | **The source for seeds.** Edit `books.mjs`, run `node scripts/build-library-content.mjs`, then the seeder. |
| `content/artwork.json` | `covers` (cloth colour, emblem, kicker per volume) and `diagrams` (a structured architecture diagram per volume: columns, nodes, notes). | Cloth and emblem drive the 3D binding. Diagrams become fold-out plates drawn as crisp vector art, not just the rendered PNG. |
| `public/library/artwork/*.webp` | Prepared covers, plates and screenshots. | Page images, frontispieces. |
| `public/library/recordings/*.mp4` (also `content/media-out/`) | Six walkthrough videos. | Moving plates. |
| `content/media-src/` | Raw captures and PNGs. Git-ignored. | Source only. Never ship directly. |
| `content/projects/*.json` | Research notes per project. **They contain `sensitive` and `uncertain` fields.** | **Never** read these into the app, page textures or AI context. Use `books.mjs` only. |

### Prototype volumes

Use these three for the book prototype. They cover three different shelves, two moving plates and a client volume, which is subject to redaction rules.

| Volume | Shelf | Moving plate | Why |
| --- | --- | --- | --- |
| `agentic-mission-control` | `stacks-ai-agents` #1, featured | `agentic-mission-control-reel.mp4` | Flagship. Six leaves and a rich architecture diagram. |
| `ai-engineer-worldsfair-showcase` | `stacks-data-knowledge` #2, featured | `ai-engineer-worldsfair-showcase-walkthrough.mp4` | Image-heavy gallery. |
| `vantage-movers` | `stacks-client-work` #1, featured | `vantage-movers-walkthrough.mp4` | Client work. Must honour `redaction_policy`, `public_alias` and `show_name`. |

These are hidden, so view them through the office's **Preview drafts** (`npm run admin:local`, then `/admin/library/preview`) or the `review` content source. **Do not publish anything.** Publication is the owner's decision (see Phase 4).

### Unseeded candidates

`content/projects/agentic-sdlc.json` has notes and a cover but no volume in `books.mjs`. Draft a volume for owner review only if time allows, following the rules at the top of `books.mjs`: public-safe, nothing untrue, missing facts left blank.

## Design

### The room

A two-storey octagon at night: walnut, brass, green banker's lamps, rain running down tall windows, and a spiral stair up to a gallery rail. There is one bay per side and a lectern with a reading table at the centre. The darkness and pools of lamplight are deliberate. They read as photographic and keep the cost of rendering down.

| Bay | Room slug | Shelf slugs, which must not change |
| --- | --- | --- |
| 1 | `entrance` | none (doors, circulation desk, the Custodian's post) |
| 2 | `stacks` (left half) | `stacks-ai-agents`, `stacks-data-knowledge` |
| 3 | `stacks` (right half) | `stacks-web-apps`, `stacks-client-work` |
| 4 | `evolution-hall` | `evolution-timeline` (the spiral stair climbs here: Novice at the bottom, Production at the top) |
| 5 | `periodicals` | `periodicals-blog` |
| 6 | `favorites-wing` | `favorites-books`, `favorites-tools`, `favorites-longevity` |
| 7 | `reading-room` | `reading-room-courses`, `reading-room-articles` |
| 8 | `computer-station` | screens `main` and `side` |

**Room and shelf slugs, scene node names, and the rule of 24 positions per shelf (3 rows × 8) stay exactly as they are.** Coordinates, yaw and camera presets change in `assets/library/manifest.json`. The scene validator and the anchor checks in `npm run assets:pack` must pass. An empty bay, such as periodicals today, must still look intentional.

### The Custodian

**Default design: an automaton archivist.** It is made of brass, walnut and glass, with a lamp-filament "eye", built from rigid jointed parts with no skin deformation. The owner hasn't confirmed the design yet. Before modelling in detail, render three turnaround stills (the automaton plus two variants) and get the owner's choice.

The Custodian needs these clips, made in Blender and exported as named GLB animations: `idle`, `greet`, `walk`, `reach_low`, `reach_high`, `pull_book`, `carry`, `present`, `turn_page`, `gesture_to_bay`. When it presents a book it shows that volume's `blurb` as a caption (Phase 4 puts the blurb in the database). Reduced-motion visitors and the catalog never depend on it.

### The book (the key piece)

- **Model:** a cloth-grain cover coloured from `artwork.json`'s `cloth`, a debossed `emblem`, gilt page edges, headbands, a ribbon marker and a hinged spine. The page block gets visibly thinner or thicker as pages move from one side to the other.
- **Page turn:** a runtime vertex-shader curl, so any page count works and the turn follows the visitor's drag or swipe. Add slight translucency so the back of the page shows faintly, and a shadow in the gutter.
- **Page content:** typeset each page from the visitor-safe `Volume` already returned by `getCollection()`.
  - Recommended approach: a client-side canvas compositor, which adds no new public endpoint and so no new way to leak drafts.
  - If you prefer a server renderer instead, such as `next/og` from a Route Handler, it must apply the same visibility rules as `getCollection()`, and drafts must require `requireAdmin()`.
  - Use one book typeface family. Self-host it under an open licence.
- **Book structure:** frontispiece (cover art) → title page (title, tagline, tags) → each `Leaf` in template order, flowing over as many physical pages as it needs, each chapter opening with a drop cap → architecture as a **fold-out plate** → gallery videos as **moving plates** (a video frame inset on the open page, with the poster frame shown while the page is turning) → links as a colophon.
- **Inspect mode:** zooming into a spread fades in a DOM layer registered exactly over the page, with real text, links and video controls. It reuses the reader's block rendering.
- **Fallbacks:** the existing HTML reader and `/catalog` remain the route for mobile and reduced-motion visitors, screen readers and no-JS. Escape, Back and focus return keep working.

### Rendering pipeline

- Model in Blender at real-world scale with PBR materials. Use **lightmaps baked in Cycles** on a second UV set, not vertex colours. Add reflection probes rendered from Blender for brass and varnish. Compress textures to KTX2. Use Meshopt for geometry, as `assets:pack` already does.
- Use three's WebGPU renderer with a WebGL2 fallback. Post-processing: AgX tone mapping, ambient occlusion, bloom on the lamps, depth of field only in inspect mode, a little grain. Adapt quality by reducing DPR, effects and tier, as the current code does.
- **Opening shot:** a short Cycles-rendered entrance video, path-traced, that crossfades into the realtime scene at a matching camera. Update the entrance poster images to match.
- **Third-party assets:** only CC0 sources (Poly Haven, ambientCG). Record every one in `assets/library/ASSET_MANIFEST.json` → `thirdPartyArt`. Ask the owner before using anything with a non-CC0 licence. Anything in a GLB can be extracted by visitors.
- **Large files** go to Vercel Blob, not git. Load the poster first, then the low-detail tier, then full quality.

**Budgets** are targets. Measure them and report the real numbers:

| | Desktop, high tier | Phone, low tier |
| --- | --- | --- |
| First interactive frame | ≤ 25 MB transferred | ≤ 8 MB |
| Frame rate (book open) | 60 fps, mid-range GPU | 30 fps, mid-range phone |
| Room | ≤ 500k triangles | ≤ 150k triangles |

The book prototype must hit the phone budget on its own, before the room exists.

## Phases and owner checkpoints

Work in this order. **Stop at each ⏸ and show the owner** screenshots, a short screen recording and the real numbers before moving on.

1. **Book prototype.** One book on a lectern in a lit void, on a dev-only route. Check what's already under `app/dev/` before adding one. Pull the book from a three-volume shelf, open it, turn every page, use the moving plate and the fold-out, enter and leave inspect mode. Use real data from the three prototype volumes in draft preview. Measure on desktop and with phone emulation. ⏸
2. **The Custodian.** Three turnaround stills ⏸. Then rough-model the chosen design, add the `pull_book → carry → present` sequence in the same prototype, and make it skippable. ⏸
3. **The Octagon.** A grey-box blockout with cameras for all eight bays ⏸. Then full materials, baked lighting, the rain and the entrance video ⏸. Put it behind a switch (for example a `scene_assets` swap or an env flag). **The current hall stays the default until the owner approves the Octagon.**
4. **Content dressing and seeding.**
   - Add a nullable column, such as `books.custodian_note`, with a `///` doc comment. Do this as a **new** migration (and regenerate comments).
   - Extend `scripts/seed-library-content.mjs` to fill it from `blurb`. Run the seeder in plan mode, then `--apply`, which keeps everything hidden.
   - Load the note through `getCollection()`, never through a client-side import of `content/`.
   - Add per-volume binding style from `artwork.json`.
   - **Publishing (`--publish`) is the owner's decision.** Prepare a list of what each volume will make public and ask. ⏸
5. **The Custodian answers questions (AI, last).** See below. ⏸

## Phase 5: the AI Custodian

The deterministic guide stays the default. AI is an opt-in **Ask the Custodian** feature, switched on only when `AI_GATEWAY_API_KEY` is set and an owner flag is enabled. Without it, the site behaves exactly as before.

- **Models through Vercel AI Gateway.** Both IDs were confirmed in the Gateway catalogue on 2026-11-10:
  - Primary: `openai/gpt-6-luna`, at $0.10 per million input tokens and $0.50 per million output; cache reads are $0.01 per million.
  - Fallback: `anthropic/claude-haiku-5.5`, at the same prices below 100k input tokens.
  - Use the AI SDK (`ai` package) with Gateway model strings in a Route Handler under `app/api/`. Check the current AI SDK and Gateway docs for the streaming call and the fallback configuration rather than relying on memory.
- **Context:** the whole public catalog (14 volumes, roughly 30k tokens) fits in one cached system prompt. **Don't build vector retrieval for v1.** Build the prompt only from `getCollection()` in **visitor** mode. Never include drafts, hidden rows, `content/projects/*.json` or anything redacted. Keep the prompt prefix byte-stable so caching works. Visitor input goes after it.
- **Tools** run on the client as Custodian actions and use the same typed navigation commands as the buttons: `navigate_to(zone | shelf)`, `open_book(slug, page?)` and `find_volumes(query)`. Validate every tool argument against the allow-list of known slugs.
- **Persona:** the Custodian answers only from the catalog. It says plainly when something isn't in the library and never invents projects, numbers, clients or dates. It keeps replies short, about 120 words at most, and states that it is an AI guide.
- **Guardrails:** limit output tokens; cap turns per session; rate-limit per visitor (Vercel WAF rule or equivalent); add bot protection. The owner sets a Gateway spend limit; tell them where. Store conversations in the existing `agent_sessions`, `agent_messages` and `agent_tool_calls` tables without raw IP addresses.
- **Expected cost** (estimate, not measured): about 30k cached input plus about 400 output tokens per turn. That is under $0.001 per turn after the first, so roughly 1,000 visitor questions cost about $1. Report the measured cost after testing.

## Rules that can't bend

- Never invent facts about John's work. Copy comes from `books.mjs`, and changes to it go back through the owner.
- Visibility, client redaction and draft isolation apply to the 3D scene, page textures and AI context exactly as they do to the HTML catalog.
- Room and shelf slugs, scene node names and existing URLs stay stable. Rename a title, never an identifier.
- Don't edit applied migrations. Put views and functions in `prisma/sql/objects.sql` and copy them into a new migration.
- Keep a versioned copy of any `.blend` before a scripted rebuild overwrites it.
- No commits or pushes to `main` unless the owner asks. Work on a branch.

## Verification and handoff

- Run `npm run typecheck && npm run lint && npm run build:local`, then `npm test`, `npm run test:browser` and `npm run test:office`. Add browser journeys covering opening a book, turning a page, inspect mode, Escape/Back and reduced motion.
- Check the visitor portfolio (publication rules applied) as well as draft preview.
- Add measured numbers to `ASSET_MANIFEST.json` and to the runbook in `LOCAL_PREVIEW.md`.
- Rewrite `HANDOFF.md` when you finish. Say what the owner can now see, what is implemented but not yet approved, what is hidden versus published, the measured performance numbers, and the next owner decision.
