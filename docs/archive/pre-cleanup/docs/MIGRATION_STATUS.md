# New portfolio migration status

_Source audit from 2026-11-07 at commit `0057e96`._

A subsequent read-only check during the Library implementation confirmed the configured portfolio database contains the three expected finished migrations and the room and shelf reference rows. The scoped hidden starter seed was then applied and verified. The historical audit below describes the earlier checkout. See [the current preview handoff](LOCAL_PREVIEW.md).

## Scope and intent

The old portfolio schema and its content are intentionally being replaced. The target is the new **The Library** design in `prisma/schema.prisma`, not preservation of the old data model. This work concerns database migration and documentation only. It does not require a web deployment, a Git remote, a public UI, or a replacement data model.

## What is verified

- 52 Prisma models map exactly to the 52 application tables in the initial SQL migration. There are no missing or extra tables between those sources.
- The table definitions contain 452 scalar columns and use 17 PostgreSQL enum types.
- The second migration includes `COMMENT ON TABLE` for all 52 tables, column comments for selected non-obvious fields, all 8 designed views, and the SQL functions/triggers.
- `prisma/sql/objects.sql` is included verbatim in the second migration.
- The third migration contains the reference data and bootstrap admin account required by the design. Do not print or copy the bootstrap password hash into status reports.
- No existing migration SQL was changed during this check.

This is a source audit, **not confirmation that a live database is migrated**.

## Migration inventory

| Order | Migration | Purpose |
| --- | --- | --- |
| 1 | `20261008000000_init` | 52 tables, 17 enum types, foreign keys and indexes |
| 2 | `20261008000050_comments_views_functions` | Database documentation, 8 views, helper functions, timestamp and activity notification triggers |
| 3 | `20261008000100_seed_reference_data` | Stages, lookup categories, global/evolution timelines, library zones/shelves, computer screens, agents and bootstrap admin |

See [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) for every table and column, [DATA_MODEL.md](DATA_MODEL.md) for concepts and privacy semantics, and [OPERATIONS.md](OPERATIONS.md) for operational commands.

## Historical blockers at the time of the source audit

At the local check on 2026-11-07:

- `.env` existed but was empty (0 bytes). Neither `DATABASE_URL` nor `DATABASE_URL_UNPOOLED` was available to the process. No database host, branch or database name could be verified from this checkout.
- `node_modules` contained directory placeholders, but `pg`, Prisma, Next.js, TypeScript and ESLint were not installed as usable packages. The generated Prisma client was absent.
- Dependency installation had previously been denied by network policy. It was not retried or worked around during this check.

No database connection, schema wipe, migration, seed, deployment or remote change was performed during this check. Existing handoff statements about earlier deployment must not be used as proof of the current database state.

## Before applying the existing migrations

1. Supply the intended Neon connection using the local environment file. Keep credentials out of Git, documentation, terminal output and chat. Prefer an explicit `DATABASE_URL_UNPOOLED` for migration work; the application can retain a pooled `DATABASE_URL`.
2. Verify the target host, database name, Neon project and branch. Confirm any pooled and direct URLs refer to the same intended database. Use a read-only catalog inspection to check current tables and `_prisma_migrations` before running the migration script.
3. Restore the project's declared dependencies through an allowed installation path. Confirm the Prisma CLI and `pg` are usable **before** running `scripts/db-deploy.mjs`; it currently checks and may erase the legacy schema before invoking Prisma.
4. Review the destructive preflight below. Apply only after the exact target and destructive effects have been confirmed.
5. Run only the database migration, not `npm run build`. A build also invokes the migration script and then deploy-related application work; it is unnecessary for this request.
6. Verify the live catalog and migration history, then record the result below. Do not mark completion from a successful connection alone.

### Destructive preflight

`scripts/db-deploy.mjs` treats any nonempty `public` schema without `public._prisma_migrations` as legacy. In that case it drops public views, materialized views, tables, sequences and enum types using `CASCADE`, then applies the three migrations. This is intentional for the old portfolio, but the heuristic alone does not establish that a target is the correct database.

`CASCADE` can remove dependent objects outside `public`. The script does not create a backup and the legacy wipe is not in the same transaction as subsequent Prisma migrations. If migration fails after the wipe, the old data is already gone. Verify any required restore point separately and obtain action-time confirmation of the exact database before irreversible deletion. Never run this script against an unknown or unrelated target.

`DB_DEPLOY_SKIP_LEGACY_WIPE=1` makes the script refuse a detected legacy schema. `DB_DEPLOY_SKIP=1` skips all migrations. Neither flag means the schema has been migrated. If `_prisma_migrations` already exists, inspect its rows and errors instead of deleting it or rerunning the initial schema manually.

## Completion checks

- [ ] Intended Neon project, branch, host and database recorded without credentials.
- [ ] Existing schema and migration history inspected read-only.
- [ ] Destructive reset, if needed, confirmed for that exact target.
- [ ] All three expected migrations have `finished_at` values and no unresolved failed attempt.
- [ ] All 52 application tables exist (53 public tables if `_prisma_migrations` is the only extra table).
- [ ] All 452 designed columns, 17 enum types, foreign keys and indexes match the migration definitions.
- [ ] All 8 views exist: `v_live_feed`, `v_project_overview`, `v_timeline`, `v_evolution`, `v_library_shelves`, `v_favorites_by_category`, `v_pending_approvals`, `v_repo_tracking`.
- [ ] Table documentation is populated; expected helper functions and triggers exist.
- [ ] Reference rows exist for stages, lookups, timelines, library layout, screens, agents and admin. Do not expose authentication hashes in verification output.
- [ ] Application client can be generated; schema/type validation completes when dependencies are available.

## Live execution result

The later read-only inspection found all three expected migrations finished on the configured portfolio target. No migrations were executed by either Library session. See the [starter inventory and verification](LOCAL_PREVIEW.md#starter-collection) for that target and the content changes.
