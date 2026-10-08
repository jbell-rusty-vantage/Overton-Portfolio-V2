# The Library — John Overton's portfolio

A portfolio rebuilt as a **3D library**: projects are books on shelves, an **AI librarian** guides visitors, an
**Evolution Hall** tells the story from first code to production-grade agent systems, and a computer station shows
live projects and realtime GitHub activity.

**Status:** foundation phase. The data model (Neon + Prisma 7), the build-time migration pipeline and the private
admin console are live. The public site shows a placeholder until the 3D world ships. See [`HANDOFF.md`](HANDOFF.md).

## Stack

Next.js 16.4 (App Router, Cache Components) · React 19.3 · Tailwind v4 · Prisma 7 + Neon Postgres · Vercel Blob ·
Vercel. Next up: React Three Fiber + Blender, Vercel eve agents, realtime.

## Quick start

```bash
npm install                 # also runs prisma generate
cp .env.example .env.local  # set DATABASE_URL (local Postgres or a Neon dev branch)
npm run db:deploy           # apply migrations + reference seeds
npm run dev                 # http://localhost:3000, admin at /admin
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | `prisma generate` → `db-deploy` (migrations) → `next build` |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm run db:deploy` | Apply migrations to `DATABASE_URL` (direct host, one-time legacy wipe) |
| `npm run db:migrate:dev` | Create a new migration from schema changes (needs a dev DB) |
| `npm run db:studio` | Prisma Studio |

## Documentation

- [`HANDOFF.md`](HANDOFF.md) — what exists, what's next, open questions
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, layout, auth, mutations, uploads, deployment
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — tables, concepts (signals → moments → timelines), views, SQL helpers
- [`docs/ADMIN.md`](docs/ADMIN.md) — the admin console, section by section
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — env vars, migrations, Neon SQL cookbook, troubleshooting
- [`docs/LIBRARY_3D.md`](docs/LIBRARY_3D.md) — the 3D library plan (Three.js / Blender) and open questions
- [`AGENTS.md`](AGENTS.md) — rules for AI coding agents working in this repo
