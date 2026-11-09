# Handoff — The Library

**Next owner goal:** iterate on the Blender hall and its artwork, then curate and seed the real collections. The hall is implemented. Start the next session with the [iteration guide](docs/ITERATING_ON_THE_LIBRARY.md): it maps each type of change to its source, its editor and a visitor-facing check. The [original implementation plan](docs/LIBRARY_IMPLEMENTATION_PLAN.md) is design history, not a list of currently missing features.

## Start here

| Open | What you're looking at |
| --- | --- |
| [Local office](http://127.0.0.1:3078/admin) | No sign-in on this computer. Projects, media, books, shelves and pages write to the configured PostgreSQL database. Restart with `npm run admin:local`. |
| [Draft preview](http://127.0.0.1:3078/admin/library/preview) / [visitor portfolio](http://127.0.0.1:3078/) | Preview includes drafts. The visitor view applies publication rules. Publish the project and its book to release a linked volume. |
| [Starter review](http://127.0.0.1:3077/) / [sample stacks](http://127.0.0.1:3077/samples?view=world&zone=stacks) | Separate review server: two exact hidden starter drafts on the entrance, eight fictional projects in the sample area. Restart with `npm run preview:library`. |
| [Asset workshop](assets/library/README.md) | Editable Blender source, procedural rebuild, anchors, optimization and validation. |
| [Preview runbook](docs/LOCAL_PREVIEW.md) | Startup, local proof, seeded IDs, performance evidence and limitations. |

The confirmed starter projects are **Mission Control** and **agent-knowledge-services**. Both remain hidden in the configured portfolio DB. They each have a book, an authored architecture page and a physical slot; see the [seed inventory](docs/LOCAL_PREVIEW.md#starter-collection). Editing shelf titles in the office updates the visitor’s labels and physical signs without changing URLs. Finished images from ChatGPT Images can be registered from `public/library/artwork/` and assigned to individual books. No new owner content was seeded or published during this refinement.

**Verified November 8, 2026:** the local no-login dashboard loaded both existing projects; the Knowledge Services draft reader loaded in the office and returned 404 on the ordinary text catalog. Both the sessionless office and signed-in production-mode workflow registered cover art, created and placed a book, renamed its shelf, published it and withdrew it using an isolated database. Typecheck, lint, the migration-free production build, contract tests and the eleven visitor browser journeys passed. See [verification commands](docs/LOCAL_PREVIEW.md#verification).

## Work that belongs in later sessions

- Ask which room, collection, physical asset or project is being changed; use the existing anchor slug and current DB title. Keep original image sources separate from the public delivery files.
- Prepare future bulk imports against the [intake guide](docs/LIBRARY_INTAKE.md). The current starter seed is scoped to the two verified repositories; it is not a general-purpose importer. A new shelf anchor or schema change is different from renaming an existing shelf.
- The guide today is deterministic. Conversational agents, webhook receivers, live push updates and vector retrieval are future features. Production publication/deployment, live Blob credentials, third-party embeds and physical phone performance were not qualified by the local browser tests.

The three existing migrations were previously confirmed on the configured database. Schema and operations are described in [Data model](docs/DATA_MODEL.md), [Migration status](docs/MIGRATION_STATUS.md) and [Operations](docs/OPERATIONS.md). No new migration is needed for this refinement. Use `npm run build:local` when validating locally; the deployment build can migrate the target DB. Visibility, client redaction, audit and revision rules still apply in the no-login local editor.
