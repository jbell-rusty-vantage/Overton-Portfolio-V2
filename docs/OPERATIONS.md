# Operations runbook

For everyday editing of the configured database, use [the local office](ITERATING_ON_THE_LIBRARY.md#start-the-right-server). It does not need a migration, seed or hosted deployment. The production-mode verification command is `npm run build:local`.

## Environments & infrastructure

| Thing | Where |
| --- | --- |
| Hosting | Current local binding (November 13): Vercel `overton-portfolio-v2`, Git origin `jbell-rusty-vantage/Overton-Portfolio-V2`; accepted public destination `overton-portfolio-v2.vercel.app`. Recheck remote Git integration before release. Older `Overton77/overton-portfolio` target is historical. |
| Database | Neon Postgres, reached via the `DATABASE_URL` env var on the Vercel project (all environments) |
| Media | Vercel Blob store `overton-portfolio-store` (`BLOB_STORE_ID`, public access, OIDC auth on Vercel) |

### Environment variables

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon URL (pooled is fine). Runtime client + migrations (direct host derived automatically). |
| `DATABASE_URL_UNPOOLED` | no | Explicit direct URL for migrations, if you prefer. |
| `BLOB_STORE_ID` | yes (Vercel) | Set by connecting the Blob store. With `VERCEL_OIDC_TOKEN` (automatic on Vercel) this authenticates Blob. |
| `BLOB_WEBHOOK_PUBLIC_KEY` | yes (Vercel) | Set by the Blob store; verifies upload-completed callbacks. |
| `BLOB_READ_WRITE_TOKEN` | no | Alternative to OIDC (useful for local uploads). |
| `GITHUB_TOKEN` | no | Raises GitHub API rate limits for repo sync; required to see private repos. |
| `DB_DEPLOY_SKIP` | no | `1` = this build does not run migrations. |
| `DB_DEPLOY_SKIP_LEGACY_WIPE` | no | `1` = refuse the one-time legacy wipe. |

## Migrations

Migrations live in `prisma/migrations/` and run **automatically on every Vercel build** (`npm run build` →
`prisma generate && node scripts/db-deploy.mjs && next build`). Preview deployments use the same `DATABASE_URL`
unless you scope a different value to the Preview environment — so a migration merged to a PR branch hits the
production database when its preview builds. Keep migrations additive, or give Preview its own Neon branch
(Vercel → Settings → Environment Variables → `DATABASE_URL` for Preview → a Neon `preview` branch URL).

`scripts/db-deploy.mjs`:
1. picks `DATABASE_URL_UNPOOLED` or `DATABASE_URL`, swaps a `-pooler` host for the direct host (Prisma Migrate needs
   session advisory locks), logs only host + database name;
2. **one-time legacy wipe**: if tables exist but `_prisma_migrations` does not, drops everything in `public`
   (this is how the old portfolio schema was removed). Never fires again once migrations have run;
3. runs `prisma migrate deploy`.

### Making a schema change

```bash
# 1. edit prisma/schema.prisma (add /// doc comments for new tables/columns)
# 2. create the migration against a local or Neon dev-branch database
npx prisma migrate dev --name add_something        # needs a shadow DB; local Postgres is easiest
# 3. if you added doc comments, append COMMENT ON statements:
node scripts/gen-comments.mjs > /tmp/comments.sql   # copy the new lines into the migration.sql
# 4. views/functions/triggers: edit prisma/sql/objects.sql and copy the changed CREATE OR REPLACE
#    statements into the new migration (objects.sql is the readable source of truth)
# 5. commit; the Vercel build applies it
```

Alternative without a local DB: `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
against a Neon **dev branch** URL, saved as `prisma/migrations/<timestamp>_<name>/migration.sql`.

### Local Postgres for development

```bash
# any Postgres 16 works; e.g. Docker:
docker run -d --name lib-pg -e POSTGRES_HOST_AUTH_METHOD=trust -p 5433:5432 postgres:16
createdb -h localhost -p 5433 -U postgres portfolio
echo 'DATABASE_URL="postgresql://postgres@localhost:5433/portfolio"' > .env.local
npm run db:deploy   # applies all migrations (+ seeds) locally
npm run dev
```

## Neon SQL cookbook

```sql
-- What is in the library?
SELECT * FROM v_project_overview;
SELECT * FROM v_repo_tracking;
SELECT * FROM v_live_feed LIMIT 20;
SELECT * FROM v_library_shelves;

-- Show a repo publicly
UPDATE repos SET activation = 'tracking', display = 'published' WHERE full_name = 'Overton77/biotech-kg';

-- Publish anything by slug (audited)
SELECT portfolio_set_display('project', 'biotech-kg', 'featured');

-- Add a favorite category (no deploy needed)
INSERT INTO favorite_categories (code, label, attribute_schema, sort_order)
VALUES ('podcast', 'Podcasts', '{"host":"string"}', 90);

-- Who changed what
SELECT * FROM audit_log ORDER BY at DESC LIMIT 50;
SELECT version, author, message, created_at FROM revisions WHERE entity_type = 'project' AND entity_id = '<uuid>' ORDER BY version;

-- Pending agent approvals
SELECT * FROM v_pending_approvals;
```

## Admin access

- Login: `/admin/login`. One admin row in `admin_users` (scrypt password hash). Sessions in `admin_sessions`
  (cookie holds a random token; DB stores its SHA-256; 14-day expiry).
- Lost password: generate a new hash locally and update the row:
  ```bash
  node -e 'const c=require("crypto");const s=c.randomBytes(16);const h=c.scryptSync(process.argv[1],s,64,{N:16384,r:8,p:1});console.log(`scrypt$16384$8$1$${s.toString("base64")}$${h.toString("base64")}`)' 'new-password-here'
  ```
  ```sql
  UPDATE admin_users SET password_hash = '<output>', must_change_password = false WHERE email = '<you>';
  DELETE FROM admin_sessions;  -- sign out everywhere
  ```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails in `[db-deploy]` | Read the Vercel build log: it prints the target host and the Prisma error. Fix the migration and push; set `DB_DEPLOY_SKIP=1` to ship code without migrating. |
| `P3009 failed migrations` | `npx prisma migrate resolve --rolled-back <name>` (or `--applied`) against the direct URL, then redeploy. |
| Blob upload: "No blob credentials found" | Locally: `vercel env pull` (OIDC token) or set `BLOB_READ_WRITE_TOKEN`. On Vercel: make sure the Blob store is connected to the project. |
| Admin redirect loop | Clear the `lib_admin_session` cookie; check `admin_sessions` rows exist/not expired. |
