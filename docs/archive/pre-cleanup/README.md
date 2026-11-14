# The Library — John Overton's portfolio

A portfolio built as a 3D library. Visitors move between seven rooms in an original Blender hall, choose a project from a shelf and open a readable book. A guide, searchable catalog and scriptless reading pages provide additional paths into the collection.

Open the [local office](http://127.0.0.1:3078/admin) to edit the PostgreSQL-backed portfolio, [The Library](http://127.0.0.1:3077/) to review the two starter projects, or [the sample stacks](http://127.0.0.1:3077/samples?view=world&zone=stacks) to explore fictional volumes. For subsequent sessions start with [the iteration guide](docs/ITERATING_ON_THE_LIBRARY.md): scene files, image intake, editing shelves, seeding and verification.

Current migration verification: see [`docs/MIGRATION_STATUS.md`](docs/MIGRATION_STATUS.md). Source completeness does not establish the live database state.

## Stack

Next.js 16.4 (App Router, Cache Components) · React 19.3 · Tailwind v4 · Prisma 7 + Neon Postgres · Vercel Blob ·
React Three Fiber · Three.js · Blender 5.2.2. The local visitor guide uses deterministic navigation.

## Quick start

```powershell
npm install                 # first-time setup; generates Prisma client
npm run admin:local         # no-login local office at http://127.0.0.1:3078/admin
# In a second terminal, if needed:
npm run preview:library     # starter preview and samples at http://127.0.0.1:3077/
```

The office needs an already-migrated PostgreSQL database configured via `DATABASE_URL`. For a new checkout, see [.env.example](.env.example) and [the operations runbook](docs/OPERATIONS.md) before initializing a database. Neither preview command runs migrations.

| Script | What it does |
| --- | --- |
| `npm run build:local` | Generate Prisma client and build Next without deploying migrations |
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | `prisma generate` → `db-deploy` (migrations) → `next build` |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm run db:deploy` | Apply migrations to `DATABASE_URL` (direct host, one-time legacy wipe) |
| `npm run db:migrate:dev` | Create a new migration from schema changes (needs a dev DB) |
| `npm run db:studio` | Prisma Studio |

## Documentation

- [`HANDOFF.md`](HANDOFF.md) — what exists, what's next, open questions
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, layout, auth, mutations, uploads, deployment
- [`docs/SCHEMA_REFERENCE.md`](docs/SCHEMA_REFERENCE.md) - all 52 tables, columns, relations and enum types
- [`docs/MIGRATION_STATUS.md`](docs/MIGRATION_STATUS.md) - migration inventory, current blockers and verification checklist
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — tables, concepts (signals → moments → timelines), views, SQL helpers
- [`docs/ADMIN.md`](docs/ADMIN.md) — the admin console, section by section
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — env vars, migrations, Neon SQL cookbook, troubleshooting
- [`docs/LIBRARY_3D.md`](docs/LIBRARY_3D.md) — current 3D entrypoints and historical design context
- [`AGENTS.md`](AGENTS.md) — rules for AI coding agents working in this repo
