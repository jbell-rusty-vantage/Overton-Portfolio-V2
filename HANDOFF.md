# Handoff — "The Library" portfolio

_Last updated: 2026-10-08 · Phase 1 (foundation: data model + admin) complete._

## What happened in phase 1

- **Old portfolio removed.** The previous Next 15 site (pages, components, blog, Prisma schema, Pinecone and
  socket.io dependencies) is deleted. The old database tables are dropped by a **one-time legacy wipe** during the
  first deploy (`scripts/db-deploy.mjs`: it runs only when tables exist without `_prisma_migrations`).
- **Stack upgraded**: Next.js 16.4 (Cache Components, Partial Prefetching, `proxy.ts`), React 19.3,
  Tailwind v4, Prisma 7.10 (`prisma-client` generator, `@prisma/adapter-pg`, `prisma.config.ts`), TypeScript 5,
  ESLint 9 flat config. `AGENTS.md` points coding agents at the bundled Next docs in `node_modules/next/dist/docs/`.
- **Data model v1** (52 tables, 8 views, SQL helper functions, `updated_at` + `pg_notify` triggers, a `COMMENT ON` on
  every table): see `docs/DATA_MODEL.md`. Migrations:
  1. `20261008000000_init`: tables, enums, indexes
  2. `20261008000050_comments_views_functions`: comments, triggers, views, functions
  3. `20261008000100_seed_reference_data`: stages, lookups, favorite categories, timelines, library zones and
     shelves, computer screens, agents, bootstrap admin
- **Migrations run on every Vercel build** (`npm run build` → `prisma generate` → `db-deploy` → `next build`).
- **Admin console** at `/admin`: GitHub repos, live sites, projects, media and artifacts (Vercel Blob), MDX blog
  posts, events and signals, moments, favorites, account. See `docs/ADMIN.md`.
- **Public site**: `/` is a placeholder ("The Library — under construction") until the 3D world ships.

## Access

- Admin login: `johnoverton743@gmail.com` with the bootstrap password given in the chat (it is not stored in the
  repo, only its scrypt hash). You must change it on first login. Recovery steps are in `docs/OPERATIONS.md`.
- Vercel project `overton-portfolio` (team "Overton's projects"). Env vars used: `DATABASE_URL`, `BLOB_STORE_ID`,
  `BLOB_WEBHOOK_PUBLIC_KEY` (OIDC Blob auth). Optional: `GITHUB_TOKEN`. The old `PINECONE_API_KEY` is no longer
  used and can be deleted.

## Verify after the first production deploy

- [ ] Vercel build log shows `[db-deploy] LEGACY WIPE …` once, then `All migrations have been successfully applied`.
- [ ] `/admin/login` → bootstrap login → forced password change works.
- [ ] Media: upload a small image and a large video (presigned flow; OIDC Blob auth). If the presigned upload fails
      with a pathname/suffix error, set `addRandomSuffix: false` in `app/api/admin/blob/route.ts`.
- [ ] Posts: upload an MDX file with one referenced image (server-side `put`).
- [ ] Repos: add the `Overton77` account → Sync repos. Add `GITHUB_TOKEN` for private and client repos.

## Next phases

### Phase 2: seed the real content (next session)
1. Sync GitHub accounts and choose which repos are tracked and shown.
2. Add live sites and run health checks.
3. Create projects; link repos and sites; covers and screenshots (moving-company work: curated media only, client
   alias).
4. **Guided evolution ingestion**: backfill historical commits/releases as signals (`backfilled = true`), then
   curate moments per stage. Stages are provisional and may be renamed.
5. Favorites per category; upload existing posts as MDX.

### Phase 3: the 3D library (`docs/LIBRARY_3D.md`)
React Three Fiber + drei, with the Blender scene exported to GLB. Scene object names match
`library_zones.scene_node_name` / `shelves.scene_node_name`. Book pages render component blocks. Includes a 2D
fallback.

### Phase 4: agents and realtime
- Component registry (Zod prop schemas) shared by MDX, book pages and generative UI; sync it to `ui_components`.
- eve librarian (public) + eve admin agent (approvals through `approval_requests`); a portfolio MCP server and agent
  skill sharing one tool package; conversations stored in `agent_*`.
- `content_chunks` + pgvector for retrieval (a new migration).
- GitHub and Vercel webhooks into `webhook_deliveries`, then `activity_events`; realtime transport (SSE + Upstash, or
  Ably/Pusher). Choose one.

## Open questions (from the spec, round 3)

- Evolution: earliest starting point; what each stage should hold; whether skill levels change over time;
  before/after code blocks; moments not tied to a project.
- Privacy: whether to ingest signals at all for moving-company repos; whether a second GitHub account needs webhooks;
  rewriting commit messages before they go public.
- Content: one shared tag vocabulary? Scheduled publishing for everything? Case studies as their own type?
- 3D: zones/shelves count, camera model, librarian avatar, page rendering approach.
- Realtime transport and presence; whether to keep live-site uptime history; librarian model and budget;
  conversation retention.

## Known limitations / TODO

- Preview deployments share the production `DATABASE_URL`, so migrations from a PR's preview build hit production.
  Keep migrations additive, or scope a Neon branch URL to the Preview environment.
- No webhook receivers yet; signals come from admin, system and promotion only.
- Polymorphic `entity_type` + `entity_id` links are validated in the app only (no DB trigger yet).
- Scheduled posts don't emit their NEW BLOG POST signal automatically when the date arrives (needs a cron).
- No automated test suite yet. Phase 1 was verified with typecheck, lint, a production build and a Playwright smoke
  run against local Postgres: login, forced password change, sites, projects, events, favorites and MDX upload.
