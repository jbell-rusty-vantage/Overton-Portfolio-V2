<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: "The Library" — John Overton's portfolio

Start with `HANDOFF.md` (current state + next steps), then `docs/`:
`ARCHITECTURE.md` · `DATA_MODEL.md` · `ADMIN.md` · `OPERATIONS.md` · `LIBRARY_3D.md`.
For scene enhancements, ChatGPT artwork, shelf titles or seeding, use [the iteration guide](docs/ITERATING_ON_THE_LIBRARY.md) before changing a manifest or migration. The real local content office is `npm run admin:local` (port 3078); the sample desk is browser-only.

### Ground rules

- **Data model**: `prisma/schema.prisma` is the source of truth. Add `///` doc comments to every new model/column
  (they become `COMMENT ON` via `scripts/gen-comments.mjs`). DB names are snake_case via `@@map`/`@map`.
- **Migrations** are SQL files in `prisma/migrations/` and run on every Vercel build (`scripts/db-deploy.mjs`).
  Never edit an applied migration; add a new one. Views/functions/triggers: edit `prisma/sql/objects.sql`, then copy
  the changed statements into a new migration.
- **Prisma 7**: import the client and types from `@/lib/db` (never `@prisma/client`). The generated client lives in
  `lib/generated/prisma` (git-ignored; `npm install`/`prisma generate` creates it).
- **Auth**: every admin page, Server Action and admin Route Handler must call `requireAdmin()`/`getAdmin()` from
  `lib/auth/session.ts`. `proxy.ts` is only an optimistic redirect.
- **Cache Components is on**: cookie/DB reads must be inside `<Suspense>`. Wrap admin page exports with `officePage` from `components/admin/office-page.tsx`; new pages need their own boundary even when the layout is already mounted.
- **Admin writes**: `audit()` every write, `snapshot()` content changes (revisions), `emitSignal()` for timeline-worthy
  events. Signals are append-only (only visibility/expiry change).
- **Visibility**: respect `display` (hidden/unlisted/published/featured) and `activation` everywhere public data is read.
  Client work (moving company) must honour `redaction_policy`, `public_alias`, `show_name`.
- Verify with `npm run typecheck && npm run lint && npm run build` before pushing.
