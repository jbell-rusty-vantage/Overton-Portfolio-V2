# Architecture

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Turbopack, **Cache Components** + Partial Prefetching on) |
| UI | React 19.3, Tailwind CSS v4 (`@tailwindcss/turbopack` loader, tokens in `app/globals.css`) |
| Database | Neon Postgres 16 |
| ORM | Prisma 7.10 — `prisma-client` generator → `lib/generated/prisma` (git-ignored, generated on install/build), `@prisma/adapter-pg` driver adapter, config in `prisma.config.ts` |
| Media | Vercel Blob (public store, OIDC auth; presigned client uploads for large files) |
| Hosting | Vercel (Git integration: `main` → production) |
| World | React Three Fiber + Three.js, Blender hall, Meshopt GLBs, HTML catalog and reader |
| Planned | Conversational librarian, realtime channel, pgvector |

## Repository layout

```
app/
  page.tsx                    public entrance; reads projected collection
  catalog/                    scriptless catalog and reader
  admin/
    login/                    sign-in (useActionState + Server Action)
    actions.ts                logout
    (console)/                authenticated console (route group → /admin/*)
      layout.tsx              static chrome + streamed navigation and local access note
      page.tsx                dashboard
      repos/ sites/ projects/ library/ media/ posts/ events/ favorites/ account/
        page.tsx              Server Component: requireAdmin() → Prisma queries → forms
        actions.ts            "use server" mutations: requireAdmin() → write → audit/snapshot → revalidatePath
  api/admin/                  Route Handlers (Blob presigned uploads, MDX download)
components/admin/             UI kit (PageHeader, Field, Select, Badge, SubmitButton, nav)
components/library/           3D scene, shelf signs, book jackets, accessible reader and controls
assets/library/               Blender source, generators and semantic manifest
public/library/               optimized hall, covers, posters and registered bundled artwork
lib/
  library/                    public database projection, sample data, reader policy and scene contract
  db.ts                       Prisma client singleton (+ re-exports generated types/enums)
  auth/                       password (scrypt), session (DAL: getAdmin/requireAdmin), constants
  admin/                      form parsing, audit/revisions/signals helpers
  generated/prisma/           generated client (do not edit, not committed)
prisma/
  schema.prisma               data model (source of truth; /// comments → COMMENT ON)
  migrations/                 SQL migrations (applied on every Vercel build)
  sql/objects.sql             views, functions, triggers (readable source; copied into migrations)
scripts/
  db-deploy.mjs               build-time migrate (direct URL, one-time legacy wipe)
  gen-comments.mjs            schema doc comments → COMMENT ON SQL
proxy.ts                      optimistic /admin cookie gate (Next 16 "proxy", formerly middleware)
docs/                         this documentation
```

## Request flow & auth

1. `proxy.ts` redirects `/admin/*` (except `/admin/login`) to the login page when the session cookie is missing.
   This is only an optimistic check.
2. Every admin page, Server Action and admin Route Handler calls `requireAdmin()` / `getAdmin()` from
   `lib/auth/session.ts` (the Data Access Layer). It looks up `sha256(cookie)` in `admin_sessions`.
3. The bootstrap account has `must_change_password = true`; `requireAdmin()` redirects to `/admin/account` until it
   is changed.

The explicitly launched **local office** is a development-only exception. The launcher binds the server to IPv4 loopback; both the proxy and the data layer check the exact host/port and request headers via `lib/auth/local-office.ts`. Its identity has no account ID and cannot change passwords, profile or sessions. Production ignores this mode. See [iteration guide](ITERATING_ON_THE_LIBRARY.md) for the two servers and their different visibility policies.

With Cache Components, reading request headers, cookies or the DB must happen inside `<Suspense>`. Each console page uses [officePage](../components/admin/office-page.tsx) so its placeholder is available on sibling navigations as well as the initial load. The static chrome is prerendered while page data streams.

## Mutations

Server Actions (`"use server"`) in each section's `actions.ts`. Pattern:

```ts
export async function updateThing(fd: FormData) {
  const admin = await requireAdmin();          // authorize (never trust the client)
  const row = await db.thing.update({ … });     // write
  await snapshot("thing", row.id, row, admin.email, "updated");  // revisions
  await audit(admin.email, "update", "thing", row.id);           // audit_log
  revalidatePath("/admin/things");              // refresh
}
```

Signals (`activity_events`) are emitted with `emitSignal()` (idempotent via `dedupe_key`).

## Media uploads

- **Large files** (video, GLB, images): browser → `uploadPresigned()` (`@vercel/blob/client`) → `/api/admin/blob`
  issues a short-lived presigned PUT (`handleUploadPresigned` + `issueSignedToken`, admin-only) → the file goes
  straight to Blob (no 4.5 MB function limit) → a Server Action registers the `media_assets` row.
- **MDX posts** with inline images go through a Server Action (body limit 4 MB, `next.config.ts`); images are
  `put()` to Blob and their paths rewritten in the MDX (`post_assets` keeps the mapping).

## Deployment

Push to `main` → Vercel build → `prisma generate` → `scripts/db-deploy.mjs` (migrate) → `next build`.
If migrations fail, the build fails and the previous deployment stays live.

## Next.js 16 notes for contributors (and agents)

- Read `AGENTS.md`: the bundled docs in `node_modules/next/dist/docs/` are authoritative for this version.
- `middleware` is now `proxy` (`proxy.ts`, export `proxy`).
- `params` / `searchParams` are Promises; use the global `PageProps<"/route">` / `LayoutProps<"/route">` helpers
  (generated by `next typegen` / dev / build).
- Cache Components: use `"use cache"` + `cacheLife`/`cacheTag` for public cached reads (3D library data);
  `updateTag`/`revalidatePath`/`refresh` after mutations.
- `next lint` is gone; run `npm run lint` (ESLint 9 flat config).
