<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN GENERATED: agent-docs -->
## Repository guide

John Overton Bell’s 2D portfolio, shared readers and the single Travellers Rest world.

Lifecycle: Cleanup implementation; see HANDOFF.md for exact release qualification.

Read the relevant documents below before changing behavior. Inspect more-specific AGENTS.md files in the destination directory. Accepted docs record settled decisions; proposed, reference, and deprecated docs are labelled context. The map is navigation, not proof of implementation or deployment.

- Start with HANDOFF.md; report implemented, tested and deployed behavior separately.
- Authorize every admin entry; use officePage/Suspense for request and database reads.
- Import Prisma through lib/db; never edit applied migrations or reset owner data.
- Audit writes and snapshot content within the same transaction; respect display, scheduling and client redaction.
- Preserve book/leaf identities, bookmark keys and resource disposal. Keep live voice disabled.
- Use the guarded npm docs commands; private paths and authoring masters are excluded.

### Business logic and workflows (OKF)

Start with `knowledge/index.md`; read one matching concept, then its implementation/tests. Do not load the whole bundle.

- Routes and privacy: `knowledge/system-overview.md` → `knowledge/route-compatibility.md` → `knowledge/security-and-privacy.md`
- Author and publish: `knowledge/collection-publication.md` → `knowledge/report-authoring.md` → `knowledge/admin-and-drafts.md` → `knowledge/content-promotion.md`
- Database and local work: `knowledge/database-contract.md` → `knowledge/integrations-and-environments.md` → `knowledge/local-development.md`
- World and books: `knowledge/estate-program.md` → `knowledge/world-runtime.md` → `knowledge/navigation-and-bookmarks.md` → `knowledge/book-rendering.md` → `knowledge/folio-and-media.md`
- Sources and assets: `knowledge/historical-evidence.md` → `knowledge/asset-pipeline.md` → `knowledge/authoring-tools.md`
- Portrait: `knowledge/portrait-text.md` → `knowledge/portrait-voice.md`
- Qualification and recovery: `knowledge/testing-and-performance.md` → `knowledge/release-and-recovery.md`
- Knowledge and future scope: `knowledge/documentation-system.md` → `knowledge/future-worlds.md`

Search: `node .agent-docs/cli.mjs search --repo . --query "your terms"` (add `--format json`).
Exact text: `rg -n -i "your terms" knowledge -g "*.md"`.
Run this repository-relative command from the canonical repository root; package identity does not determine its workspace directory.
Concepts describe observed behavior; accepted source decisions remain authoritative. Check cited code/tests before changing behavior.

### Code navigation

Read `docs/agents/CODE-MAP.md` for source entrypoints, interfaces, dependencies, tests, and architecture by module.

- `app/AGENTS.md`: Public routes and authenticated office adapters.
- `components/AGENTS.md`: Shared readers and Travellers Rest rendering.
- `lib/AGENTS.md`: Collection policy, database, auth and portrait contracts.
- `scripts/AGENTS.md`: Authoring, release and qualification commands.
- `tests/AGENTS.md`: Behavior and safety evidence.
- `.agent-docs/AGENTS.md`: Pinned knowledge tooling and registries.
- `prisma/AGENTS.md`: Database schema and migrations.
- Change a visitor route or reader: public-routes → collection → portfolio-reports
- Author safely: authoring → identity-office → database
- Maintain Travellers Rest: estate-program → estate-session → estate-engine → native-books → exhibits-media
- Release and recover: release-operations → asset-authoring → portrait
- Maintain knowledge: documentation

### Task routes

- Current outcome and qualification state: `HANDOFF.md`
- Release and recovery runbook: `docs/operations/release.md`

### Validation

Run from this repository root; choose checks relevant to the change. Commands are documented here, never executed by the documentation updater.

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run test:safety`
- `npm run build`
- `npm run docs:check`

Documentation: `node .agent-docs/cli.mjs check --repo .`; refresh with `node .agent-docs/cli.mjs build --repo .`. Edit `.agent-docs/config.json` to change this guide.

[Docs index]|root:.
|.:{HANDOFF.md}
|docs/operations:{release.md}
<!-- END GENERATED: agent-docs -->
