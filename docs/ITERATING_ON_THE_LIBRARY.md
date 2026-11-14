# Editing The Library in the next session

Start from the change you want to make. PostgreSQL owns the collection and its display names. Blender owns the furniture and the location of each anchor. A shelf title, a book page, or a project cover can change without rebuilding the hall.

For the current **Travellers Rest** entrance, open the [full private visit](http://127.0.0.1:3078/admin/library/preview). The [delivery notes](TRAVELLERS_REST_DELIVERY.md) cover the four authored house-book leaves, archived objects, model tiers, renderer measurements and scoped cabinet program. The library editor has a Travellers Rest section for the guided release and its optional UTC window. Project and book visibility still control which volumes appear in the cabinet.

The owner’s November 12 direction is the [continuous 3D library](TRAVELLERS_REST_IMMERSIVE.md). Follow that brief for the persistent room, speaking portrait, physical project books and manuscript inspection.

| Change | Edit here | Check the result here |
| --- | --- | --- |
| Add content or change its visibility | [Local dashboard](http://127.0.0.1:3078/admin) → Projects, Blog posts, Favorites, or Events & signals → Moments | [Draft preview](http://127.0.0.1:3078/admin/library/preview), then the [visitor catalog](http://127.0.0.1:3078/catalog) after publication |
| Author a book, move it, rename a shelf, edit a screen or set a room camera | [Library editor](http://127.0.0.1:3078/admin/library); forms and write handlers in [the editor directory](../app/admin/%28console%29/library/) | Open the affected room by its stable slug. A rename changes its sign, navigation, reader label, and catalog search. |
| Add an image made in ChatGPT Images | [Bundled artwork folder](../public/library/artwork/) → [Media](http://127.0.0.1:3078/admin/media), then choose the cover on the book or project | Open its catalog card, full reader and physical binding. See the image recipe below. |
| Change geometry, furniture, materials, lighting or the entrance poster | [Blender source and rebuild commands](../assets/library/README.md), [procedural scene](../assets/library/build.py), [illustration generator](../assets/library/illustrate.py) | Check the desktop and low-detail hall, plus both entrance posters. The [packed asset inventory](../assets/library/ASSET_MANIFEST.json) records the built-in files. |
| Move or add a physical destination | [Anchor and camera manifest](../assets/library/manifest.json), corresponding scene export and Postgres room/shelf rows | [Scene validator](../lib/library/scene-contract.ts), then visit the anchor and open a volume. |
| Change navigation, layouts or how bindings behave | [Experience and reader components](../components/library/), [3D camera and hit targets](../components/library/World.tsx), [visitor styles](../app/library.css) | [Browser journeys](../tests/browser/library.spec.ts) cover the room, mobile, history, fallback and no-JS reading. |
| Change which rows or fields visitors can see | [Database projection](../lib/library/catalog.ts), [visibility and block policy](../lib/library/policy.ts), [page composition](../lib/library/pages.ts) | [Isolated publication tests](../scripts/test-library-admin.mjs) cover discovery, direct reads, linked-project redaction and publication. |
| Change the fictional examples | [Fixture collection](../lib/library/fixtures.ts); [sample desk](../components/library/SampleDesk.tsx) | [Sample stacks](http://127.0.0.1:3077/samples?view=world&zone=stacks). Sample edits are browser-local; they do not seed Postgres. |

## Start the right server

From the project root, run **`npm run admin:local`** and open **[the office](http://127.0.0.1:3078/admin)**. The launcher uses the configured `DATABASE_URL`, binds to `127.0.0.1`, and grants the content editor a local identity without creating an admin user or session. No migrations or seeds run at startup. Use that exact address; production, plain `npm run dev`, and the separate review server keep session authentication. Stop the foreground command with Ctrl+C. See [the runbook](LOCAL_PREVIEW.md) for background instances.

On the office server, **Preview drafts** is the curator’s view; **Open portfolio** applies normal visitor visibility. The separate `npm run preview:library` server on port **3077** can show the two confirmed hidden starter projects at its entrance. Seeing them there does not mean they were published. If the visitor collection is empty but the editor has rows, check publication before assuming a DB problem.

## Put a project on a shelf

1. In **Projects**, create the project and save its summary, links and optional cover. Leave it hidden while drafting.
2. In **Library → Books & pages**, create a hidden book linked to that project. Choose **hybrid** for generated overview/source pages plus authored pages. Add content and choose a cover if the book needs different art.
3. In **Shelf placement**, pick a shelf and an open position. Positions are 1–24: eight across, top row first, bounded by the shelf's capacity. Use **Preview drafts** to walk to it and turn the pages.
4. To release it, publish the project first, then its book. Open the portfolio or text catalog in a fresh tab. A hidden wrapper suppresses the linked project. Unlisted books are direct-link only; future-dated or deleted records stay out. Hiding either record withdraws that presentation.

Standalone books can be placed on any supported shelf without a project. Posts, favorites and moments have their own editors and public readers; creating one doesn't automatically assign it a physical slot. The current placement forms handle books and direct projects. For future batch seeding of other entity types, use their typed `shelf_slots` links; review occupancy and visibility first. See [content intake](LIBRARY_INTAKE.md) and the [schema](../prisma/schema.prisma).

## Bring in a dedicated image

Export a finished PNG, JPEG, WebP or AVIF into `public/library/artwork/`; use a lowercase filename such as `mission-control-cover.webp` (letters, digits, hyphens or underscores). In **Media & artifacts → Bundled artwork**, select the file, give it a title and alt text, and register it. In **Library → Books & pages → Cover artwork**, select that image. Use a new filename when replacing an edition so old links and caches remain predictable. Refresh the visitor page after saving.

The media record, cover assignment and revisions are in PostgreSQL. The image bytes ship with the app; keep the file in the checkout and include it in the next deployment. These are public assets, including while the book is hidden. Keep source prompts, unapproved drafts and private references outside `public/`. An image can also be used in an authored **Image** block by its `/library/artwork/…` path. Blob-backed uploads in Media are an alternative when Blob credentials are configured.

For an image intended as **architecture** (a mural, framed art or material) instead of a book cover, add it as a source under `assets/library/`, reference it in the Blender build, and regenerate both hall tiers following the [asset guide](../assets/library/README.md). A card cover cannot alter the built-in geometry.

## Stable identities and rebuild boundaries

Room and shelf slugs appear in deep links and seeds. Scene node names are GLB anchors. **Rename the title**, not either identifier, for a wording change. Database titles drive the live cabinets, while fictional fixtures use the manifest defaults. The built-in poster is a static Blender render. Moving a shelf physically requires updating the coordinates/yaw, its GLBs and any camera overrides; renaming it does not. For a manually edited `.blend`, preserve a versioned copy before running the procedural build: the standard build regenerates the named source file.

| Room slug | Physical shelf slugs |
| --- | --- |
| `stacks` | `stacks-ai-agents`, `stacks-data-knowledge`, `stacks-web-apps`, `stacks-client-work` |
| `evolution-hall` | `evolution-timeline` |
| `periodicals` | `periodicals-blog` |
| `favorites-wing` | `favorites-books`, `favorites-tools`, `favorites-longevity` |
| `reading-room` | `reading-room-courses`, `reading-room-articles` |
| `entrance`, `computer-station` | No bookshelves; the station uses `main` and `side` screens. |

## Change the continuous Travellers Rest library

Start with [the engine reference](WORLD_ENGINE.md) for the file map and conventions, [the survey comparison](TRAVELLERS_REST_SURVEY.md) before moving a wall, door or window, and [the next-session instructions](TRAVELLERS_REST_NEXT.md) for the ordered work.

The house program is now edition 2: **Enter the library** opens one 3D world that stays mounted through travel, reading, close inspection and playback. [Owner review and measurements](TRAVELLERS_REST_CONTINUOUS.md) · [Private preview](http://127.0.0.1:3078/admin/library/preview)

| To change | Edit | Then |
| --- | --- | --- |
| What a project book says | The project and its book in the office, as before | Reload. The physical volume, its spine, its pages and the directory all read the same projected `Volume`. A new project appears in the family cabinet on the shelf it has in the collection. |
| Where a volume stands in this house only | `placements` in the house program (`ui_layouts`, slug `travellers-rest-visit`) | An entry `{ book, shelf, position }` overrides the collection's shelf for the cabinet without moving the book in the older hall. There is no office form for this yet. |
| The custodian's words | [narration.json](../content/travellers-rest/narration.json) | `python scripts/voice-estate.py` voices only the cues whose text changed, checks that each was spoken to its last word, and rewrites the timeline. Then run the importer. |
| A stop, a resting place or a camera position | [anchors-v2.json](../assets/travellers-rest/anchors-v2.json), and `places` in [world.ts](../lib/estate/world.ts) for the line of sight | `node scripts/pack-estate.mjs --edition 2`, `npm test`, then the importer. The packer writes the anchors into both shell tiers and the release action checks them. |
| The room itself | [room.ts](../components/estate/world/engine/room.ts) for joinery, finishes and furniture; [engine.ts](../components/estate/world/engine/engine.ts) for light, fire, drawers and the screen | Reload the preview. Nothing is packed: the interior is built in the browser, so every binding, leaf and sheet keeps its own transform. |
| A letter or other document | Add its scans and checked transcription to [letters.json](../assets/travellers-rest/archive/letters.json), or a plate to [catalog.json](../assets/travellers-rest/archive/catalog.json) with a placement in [objects.ts](../lib/estate/objects.ts) | `python assets/travellers-rest/archive/prepare-world.py` for plate derivatives, then the importer. Add the same file keys to `scripts/estate-inventory.mjs`; `npm test` fails if the two lists differ. |
| A piece of furniture or joinery made in Blender | [build_kit.py](../assets/travellers-rest/kit/build_kit.py), following [the kit notes](../assets/travellers-rest/kit/README.md) | `npm run kit:pack`, `npm test` (the kit contract), reload with and without `?kit=off`, then the importer so the kit files are delivered. |
| How a visitor walks, looks or is routed | [controller.ts](../components/estate/world/engine/controller.ts) and [navmesh.ts](../components/estate/world/engine/navmesh.ts) | `npm run test:navigation`. Furniture that moves needs its obstacle moved too. |
| Trees, garden, paths or the people outside | [plan.ts](../components/estate/world/engine/grounds/plan.ts) for positions; the other files beside it for how each thing is made | Reload; `npm run estate:look` for screenshots. Present-day visitors and staff only. |
| How a book page is laid out or handled | [paginate.ts](../components/estate/world/paginate.ts), [sheets.ts](../components/estate/world/sheets.ts), [book.css](../components/estate/world/book.css), [Reader.tsx](../components/estate/world/Reader.tsx) | `npm run test:books`, and look at every volume: the page audit lives in `.local-library/books/` until it is moved into `scripts/`. |
| The owner's introduction on the entrance | [Entrance.tsx](../components/estate/Entrance.tsx) (`.ea-intro`) | Reload. The custodian's matching words are in the narration file. |

**Import and release.** `node --env-file=.env --env-file=.env.local scripts/seed-estate.mjs` prints a read-only plan. `--apply` uploads new delivery files under `travellers-rest/v2/<key>-<hash>`, verifies every object by SHA-256, links them in one transaction and upgrades the house program in place with an audit record and a revision. It refuses to change the edition of a published visit. Release and withdrawal stay in the office under **Travellers Rest**; the action validates both edition 2 scene tiers against the anchor contract before activating them.

**Renderer fixture.** `/dev/world-lab` on the loopback review server mounts the engine alone with stand-in volumes and no database. It exists for visual iteration and frame-time checks of the room itself and returns 404 in production.

**Fallbacks that must keep working.** A missing model or lost WebGL context switches to the plain pages (the earlier rooms, house book and cabinet). Reduced motion keeps the still portrait, shows each cue's full text and places books and documents without flights. Sound is off until the visitor chooses it. `npm run test:browser` covers each of these.

## Close a session

Record what changed, whether it lives in Git, PostgreSQL or both, what the visitor can actually see, and the next owner's decision. Put reproducible commands and source entrypoints in this guide, and current status in [HANDOFF.md](../HANDOFF.md). Use `npm run build:local` for a migration-free build; `npm run build` is the deployment path and runs the DB deployment script. Use `npm run test:office` to exercise editing and publication without writing test data to the configured portfolio database.
