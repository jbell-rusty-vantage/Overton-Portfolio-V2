# Data model — "The Library" (schema v1)

Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma). Every model and selected non-obvious columns carry `///`
doc comments that are also written into Postgres as `COMMENT ON` statements, so the schema explains itself in the
Neon console (and to agents using the Neon MCP `describe_table_schema` tool).

For the full table/column dictionary, see [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md). For the current migration audit and execution checklist, see [MIGRATION_STATUS.md](MIGRATION_STATUS.md).

## Three core ideas

### 1. Activation vs display (two independent switches)

| Switch       | Values                                        | Controls                                           |
| ------------ | --------------------------------------------- | -------------------------------------------------- |
| `activation` | `inactive`, `tracking`, `paused`              | Whether webhooks / sync jobs ingest data for a row |
| `display`    | `hidden`, `unlisted`, `published`, `featured` | Whether visitors can see it, and how prominently   |

A repo can be `tracking` + `hidden`: its signals are recorded but nothing is public until John flips `display`.
Repo sync creates new repos as `inactive` + `hidden`; John chooses what is tracked and shown in `/admin/repos`.

### 2. Signals → moments → timelines

```
GitHub / Vercel webhooks ─┐
Admin custom events ──────┼─► activity_events (SIGNALS, append-only) ─► live feed, 3D scene effects
System (post published) ──┘            │
                                       │ group + curate (admin / admin agent / portfolio_promote_signal)
Hand-written moments ─────────────────►▼
                               timeline_nodes (MOMENTS) ─► timeline_memberships ─► timelines
                                                                     (global · per-project · evolution · custom)
```

- **Signal** (`activity_events`): raw fact with `occurred_at`, `source`, `type_code` (→ `lk_signal_types`),
  links to repo / deployment / project / post, `visibility` (public/private/redacted), full `payload`,
  `dedupe_key` (idempotency, e.g. `gh:push:<sha>`), optional `expires_at` and `scene_effect`. Never edited except
  visibility/expiry.
- **Moment** (`timeline_nodes`): curated story point. Built from one signal, a group of signals
  (`timeline_node_signals` keeps the evidence), or none (hand-written / progress update). Carries stage, skills
  (`node_skills` with level 1–5), project, importance 1–5, date `precision` (day/month/year for pre-GitHub history).
- **Timeline** (`timelines` + `timeline_memberships`): ordered set of moments. Seeded: `global`, `evolution`.

### 3. One block format everywhere

Rich content is stored as JSON arrays of `{ component, props }` blocks: `projects.body_blocks`,
`timeline_nodes.body_blocks`, `book_pages.blocks`, `favorites.why_blocks`, `stages.reflection`, `ui_layouts.blocks`.
The same code-level component registry (Zod prop schemas — to be built with the 3D/agent phase) renders them in MDX,
on 3D book pages, in librarian generative UI and in the admin. `ui_components` mirrors the registry in the DB.

## Table groups

| Group | Tables |
| --- | --- |
| Admin auth | `admin_users`, `admin_sessions` |
| Lookups (extend with `INSERT`) | `stages`, `lk_signal_types`, `lk_media_roles`, `lk_skill_categories`, `lk_library_zone_kinds`, `favorite_categories` |
| Sources | `github_accounts`, `repos`, `clients`, `deployments` (live sites) |
| Projects | `projects`, `project_repos`, `project_deployments`, `project_links`, `project_skills` |
| Blog | `posts`, `post_series`, `post_projects`, `post_timeline_nodes`, `post_assets` |
| Timeline | `activity_events`, `timeline_nodes`, `timeline_node_signals`, `timelines`, `timeline_memberships`, `skills`, `node_skills` |
| Media | `media_assets`, `media_links`, `link_previews` |
| Favorites | `favorites`, `favorite_relations` |
| Library (3D) | `library_zones`, `shelves`, `shelf_slots`, `books`, `book_pages`, `computer_screens`, `scene_assets` |
| Generative UI | `ui_components`, `ui_layouts` |
| Agents | `agents`, `agent_sessions`, `agent_messages`, `agent_tool_calls`, `approval_requests` |
| Operations | `revisions`, `audit_log`, `analytics_events`, `webhook_deliveries` |

### Enums vs lookup tables

- **Postgres enums** for stable state machines used in code: `display_state`, `activation_state`, `redaction_policy`,
  `project_status`, `signal_source`, `signal_visibility`, `date_precision`, `timeline_node_kind`, `timeline_kind`,
  `media_kind`, `media_provider`, `favorite_status`, `book_page_mode`, `screen_mode`, `entity_type`,
  `agent_message_role`, `approval_status`. Adding a value = a migration (`ALTER TYPE ... ADD VALUE`).
- **Lookup tables** (text `code` primary key) for taxonomies that grow: stages, signal types, media roles, skill
  categories, library zone kinds, favorite categories. Adding a value = `INSERT`, no deploy.

### Polymorphic links

`media_links`, `favorite_relations`, `shelf_slots`, `books`, `revisions`, `audit_log`, `approval_requests` point at
"anything" via `entity_type` (enum) + `entity_id` (uuid). Postgres can't enforce a foreign key across tables, so the
app validates on write. (Planned: an integrity trigger per polymorphic table.)

### Privacy (client work)

- `repos.redaction_policy`: `none` · `messages_hidden` · `counts_only` · `curated_only`.
- `repos.public_alias` and `clients.public_alias` / `clients.show_name` hide real names (e.g. the moving company).
- Signals default to `private`; only signals from public rows with `public_by_default` types become `public`.

### Version history & audit

- `revisions`: full JSON snapshot per change (`entity_type`, `entity_id`, `version`, `author`, `message`).
  Written by every admin create/update (`lib/admin/audit.ts → snapshot()`).
- `audit_log`: every admin/agent/SQL-helper write.

## Views (one-line answers)

| View | Answers |
| --- | --- |
| `v_live_feed` | Public, unexpired signals newest first |
| `v_project_overview` | Projects with repo/deployment/moment counts, primary URL, cover, last activity |
| `v_timeline` | Moments on every timeline, ordered |
| `v_evolution` | The Novice → Production timeline by stage |
| `v_library_shelves` | Zones → shelves → slots with resolved titles |
| `v_favorites_by_category` | Favorites grouped by category |
| `v_pending_approvals` | Human-in-the-loop queue |
| `v_repo_tracking` | Which repos are tracked/shown, their projects and signal counts |

## SQL helper functions (each writes `audit_log`)

```sql
SELECT portfolio_set_display('project', 'biotech-kg', 'published');   -- also stamps published_at
SELECT portfolio_place_on_shelf('stacks-ai-agents', 'project', '<project uuid>', 1);
SELECT portfolio_promote_signal('<activity_event uuid>', 'ai_agent_mastery');  -- draft moment from a signal
```

## Triggers

- `trg_<table>_updated_at` on every table with `updated_at` (keeps it right for SQL-editor edits).
- `trg_activity_events_notify` → `pg_notify('activity_events', {...})` for a future realtime worker.

## Seeded reference data (migration `20261008000100_seed_reference_data`)

Stages (novice → builder → full_stack → systems_data → ai_agent_mastery → production_grade), signal types,
media roles, skill categories, library zone kinds, favorite categories (book, course, article, ai_tool,
software_tool, supplement, longevity_device, lab_test — each with an `attribute_schema`), timelines (`global`,
`evolution`), default library zones + 11 shelves, computer screens (`main`, `side`), agents (`librarian`, `admin`),
and the bootstrap admin user (must change password on first login).

## Deferred / planned

- `content_chunks` with `pgvector` embeddings for the librarian (add with the agent phase:
  `CREATE EXTENSION vector;` + `Unsupported("vector(1536)")` column).
- Biomarker / lab-result tables (`bio_*`) linked to `lab_test` favorites.
- Shared tag vocabulary (today `tags text[]` on projects, posts, favorites, media).
- Polymorphic integrity triggers.
