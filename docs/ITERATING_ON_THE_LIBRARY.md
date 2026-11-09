# Editing The Library in the next session

Start from the change you want to make. PostgreSQL owns the collection and its display names. Blender owns the furniture and the location of each anchor. A shelf title, a book page, or a project cover can change without rebuilding the hall.

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

## Close a session

Record what changed, whether it lives in Git, PostgreSQL or both, what the visitor can actually see, and the next owner's decision. Put reproducible commands and source entrypoints in this guide, and current status in [HANDOFF.md](../HANDOFF.md). Use `npm run build:local` for a migration-free build; `npm run build` is the deployment path and runs the DB deployment script. Use `npm run test:office` to exercise editing and publication without writing test data to the configured portfolio database.
