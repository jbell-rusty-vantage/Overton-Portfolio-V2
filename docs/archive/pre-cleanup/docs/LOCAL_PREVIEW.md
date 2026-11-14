# Review The Library locally

Open [the entrance](http://127.0.0.1:3077/). Choose **Enter the library**, then **Visit project stacks**. Mission Control is on [the AI shelf](http://127.0.0.1:3077/?view=world&zone=stacks&shelf=stacks-ai-agents); Knowledge Services is on [the data shelf](http://127.0.0.1:3077/?view=world&zone=stacks&shelf=stacks-data-knowledge). Select a physical binding, its marker or its full title below the scene to read the book. Escape returns from the reader.

| Review path | What it contains |
| --- | --- |
| [Project stacks](http://127.0.0.1:3077/?view=world&zone=stacks) | The database-backed local review |
| [Mission Control](http://127.0.0.1:3077/projects/agentic-mission-control) | Overview, architecture and source |
| [Knowledge Services](http://127.0.0.1:3077/projects/agent-knowledge-services) | Overview, architecture and source |
| [Populated sample stacks](http://127.0.0.1:3077/samples?view=world&zone=stacks) | Eight fictional projects and additional sample writing, favorites and stage volumes |
| [Text catalog](http://127.0.0.1:3077/catalog) | Search and complete reading pages with JavaScript disabled |
| [Local office](http://127.0.0.1:3078/admin) / [Library editor](http://127.0.0.1:3078/admin/library) | No login on the dedicated local server; real PostgreSQL content and placement. [Owner workflow](ITERATING_ON_THE_LIBRARY.md) |
| [Sample placement desk](http://127.0.0.1:3077/dev/library-admin) | Browser-local editing and backup of synthetic data |

## Server and restart

The review listens on `127.0.0.1:3077`; the writing office listens separately on `127.0.0.1:3078`. Background stdout/stderr for this checkout are in `.local-library/preview*.log` and `.local-library/office*.log`. After a reboot, start the desired server again. Use the addresses here, not `localhost`, for the local office and starter review.

From a new PowerShell window, restart in the foreground with the following commands. Use the exact loopback address in the review links.

```powershell
Set-Location 'C:\Users\Pinda\Overton-Portfolio-local'
npm run preview:library -- 3077
# In a separate terminal:
npm run admin:local -- 3078
```

Use Ctrl+C for a foreground server. For a background launch, find its current runner with `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object CommandLine -Match 'scripts[/\\]preview-library\.mjs' | Select-Object ProcessId,CommandLine`. Verify the checkout, port and whether `--office` is present before stopping that runner and its children. Do not reuse a PID from an old session. To check the office, open `/admin` and verify the project counts render, not just a 200 status.

The runner sets `LIBRARY_CONTENT_SOURCE=database` and explicitly enables the development-only, loopback-bound review of the two seeded project IDs and their book wrappers. It rejects forwarded remote hosts and addresses. Ordinary public reads continue to require eligible publication state. Production ignores the development review flag. An unavailable database produces an unavailable collection.

For a credential-free fixture run, set `$env:LIBRARY_CONTENT_SOURCE='fixtures'` in a fresh shell before running the preview on an available port. The fixture catalog is labeled as demonstration content. The `/samples` and `/dev/library-admin` routes are local development tools.

## Starter collection

A read-only check of the configured portfolio endpoint `ep-noisy-frost-advb430b`, database `neondb`, found all three expected Library migrations finished, seven rooms, eleven shelves and two screen slots. Project, book and shelf-slot counts were zero before the import. No schema migration ran during implementation.

| Project | Verified public source and revision | Placement | Project ID / book ID |
| --- | --- | --- | --- |
| Mission Control | [Repository revision](https://github.com/jbell-rusty-vantage/agentic-mission-control/tree/882b77da06c5b844145ace0f4fec032097dfe80c), GitHub ID `1448425052` | `stacks-ai-agents`, slot 1 | `de910cab-f3a6-461a-a110-aaa581e59d23` / `716013b1-0734-4175-9f5b-b15c94e41869` |
| Knowledge Services | [Repository revision](https://github.com/jbell-rusty-vantage/agent-knowledge-services/tree/0abcecf4da4d5ea55762d669842c6aa3bc4a1775), GitHub ID `1448706688` | `stacks-data-knowledge`, slot 1 | `cd0cc512-e3b4-4531-a93a-854e83b5d343` / `4dc8cb72-8972-484e-a208-d8080a174e79` |

GitHub returned 404 for the exact suggested spelling `agentic-knowledge-services`. Mission Control’s repository history names `agent-knowledge-services` as its Knowledge Services companion. Its pinned README, package tree and the local canonical checkout corroborate that identity. [Repository mapping](https://github.com/jbell-rusty-vantage/agentic-mission-control/blob/882b77da06c5b844145ace0f4fec032097dfe80c/docs/REPOSITORY-HISTORY.md)

The import created two projects, two repo rows, two primary links, two hybrid books, two authored architecture pages and two slots. It recorded eight revisions and eight provenance audit records. No publish events were emitted. Projects and repositories are inactive and hidden. Books are hidden. The combined rerun found both projects unchanged, with zero updates or duplicates. Each has one authored page plus generated overview and source pages. The seed bundle is in `assets/library/starters.json`.

To inspect the seed diff again, run `node --env-file=.env scripts/seed-library.mjs agentic-mission-control agent-knowledge-services`. Its default mode is read-only.

## Verification

The safe production build command is `npm run build:local`. It generates Prisma’s client and runs Next without invoking the deployment script. The existing deployment build retains its own migration behavior.

| Command | Coverage |
| --- | --- |
| `npm test` | Publication, activation, scheduling, redaction, safe text/links, book-page order, shelf constraints, intake and both GLBs |
| `npm run typecheck` and `npm run lint` | TypeScript and ESLint |
| `npm run test:browser` | All rooms and shelves, both live local starter readers, deep links/history, phone layout, keyboard, accessibility scans, WebGL absence/context loss, corrupt-file retry, sandbox and scriptless reading |
| `npm run test:admin` after a local build | Authenticated browser workflow against disposable in-memory PGlite. Creates a draft, places it, authors a page, previews, publishes, hides, rejects a stale edit and checks the resulting audit/revision records |
| `npm run test:office` | Same edit-to-visitor proof without a session, including cover registration and shelf renaming; checks the local actor and rejects nonlocal requests |
| `npm run profile:library` after a local build | Cold/warm local rendering measurements from production-mode Chrome and a fixture collection |

The browser and admin scripts use installed Chrome. The admin harness uses only its in-process database and a fixture session. It also checks hidden/unlisted content, scheduled/deleted rows, ambiguous wrappers, client aliases and restricted activity. It leaves the shared portfolio target untouched. Live Blob upload, third-party embeds, a physical phone and manual assistive-technology qualification were outside the tests performed. The public guide is deterministic, and feed views display approved stored events on page load.

Screenshots from the local review are in `.local-library/evidence/`, including the entrance, every room, a focused shelf, desktop and phone readers, the catalog, the fallback and the isolated admin workflow. `.local-library/performance.json` records the actual profile. The compressed standard GLB is 1,996,124 bytes and the low tier is 1,491,316 bytes. Both passed glTF validation with zero errors and warnings. Blender MCP reopened the editable source and reimported the shipping GLB with twenty intact anchors.

The verification run passed five contract tests, eleven browser tests, the isolated admin and privacy checks, typecheck, lint and the migration-free Next 16.4.5 production build. Chrome 156 on the machine’s AMD Radeon GPU produced the following fixture measurements over loopback. Both catalog profiles loaded zero scene files before 3D entry.

| Viewport | Catalog LCP / CLS | Cold / warm entry | GLB wire transfer | Peak draws / triangles | Median drawn frame interval |
| --- | --- | --- | --- | --- | --- |
| 1366 × 860 | 404 ms / 0 | 1,144 ms / 201 ms | 799,715 bytes | 83 / 95,662 | 16.7 ms |
| 390 × 844, low tier | 424 ms / 0 | 945 ms / 186 ms | 617,604 bytes | 50 / 66,819 | 16.7 ms |

These are desktop Chrome measurements at two viewport sizes. Touch emulation also opened Knowledge Services at 360 × 800 and at tablet sizes. Real-device frame rates, field interaction latency and long-session GPU memory were not measured.

The visitor routes are under `app/`, with the room and reader in `components/library/` and the public projection in `lib/library/`. The authenticated editor lives under `app/admin/(console)/library/`. The original artwork and generators are under `assets/library/`; shipping scene and cover files are in `public/library/`.

See [the asset rebuild guide](../assets/library/README.md) and [the project intake guide](LIBRARY_INTAKE.md) for editing, placement and publication. The review runs locally. No Git remote, push, Vercel setup or deployment was performed.

