<!-- BEGIN GENERATED: semantic-map -->
# Semantic code map

Generated from reviewed module descriptions and current selected source files. Package dependencies/exports/script names are extracted from manifests; relationships and ownership are authored. This is not a complete import graph or proof that a designed capability is implemented.

Paths below are repository-relative. Use the task routes, then search the module heading. Follow accepted architecture docs for decisions; proposed/reference/deprecated documents retain those labels.

## Task routes

- Change a visitor route or reader: [public-routes](#public-routes) → [collection](#collection) → [portfolio-reports](#portfolio-reports)
- Author safely: [authoring](#authoring) → [identity-office](#identity-office) → [database](#database)
- Maintain Travellers Rest: [estate-program](#estate-program) → [estate-session](#estate-session) → [estate-engine](#estate-engine) → [native-books](#native-books) → [exhibits-media](#exhibits-media)
- Release and recover: [release-operations](#release-operations) → [asset-authoring](#asset-authoring) → [portrait](#portrait)
- Maintain knowledge: [documentation](#documentation)

## Modules

| Module | Source | Responsibility | State |
|---|---|---|---|
| [public-routes](#public-routes) | app | Application boundaries; Legacy URLs and current destinations | implemented |
| [identity-office](#identity-office) | lib | Authorization and public projections; Local office, samples and development | implemented |
| [collection](#collection) | lib | Collection identity and publication | implemented |
| [portfolio-reports](#portfolio-reports) | components | Reports and shared reading surfaces | implemented |
| [authoring](#authoring) | lib | Authenticated authoring and drafts | implemented |
| [release-operations](#release-operations) | scripts | Drift-checked content promotion; Qualification and performance evidence; Deployment, rollback and withdrawal | implemented |
| [database](#database) | prisma | Database migrations and schema contract; Database and deployment environments | implemented |
| [estate-program](#estate-program) | lib | Travellers Rest content program; Archive evidence, attribution and rights | implemented |
| [estate-engine](#estate-engine) | components | Renderer sessions and resource lifecycle; Future worlds and immersive VR | implemented |
| [estate-session](#estate-session) | components | Visit history and saved reading places | implemented |
| [native-books](#native-books) | components | Native paper and HTML page measurements | implemented |
| [exhibits-media](#exhibits-media) | components | Viewing folio and soccer collection | implemented |
| [asset-authoring](#asset-authoring) | scripts | Immutable media and delivery inventory; Artwork and scene authoring tools | implemented |
| [portrait](#portrait) | lib | Grounded portrait text and spending; Voice policy and authored narration | implemented |
| [documentation](#documentation) | .agent-docs | Searchable OKF documentation | implemented |
| [qualification-contracts](#qualification-contracts) | tests | Portable policy contracts, native browser journeys and documentation safety fixtures. | implemented |

## public-routes

**app** · module · implemented

Application boundaries; Legacy URLs and current destinations

**Enter:** [`app/page.tsx`](../../app/page.tsx), [`lib/library/paths.ts`](../../lib/library/paths.ts)
**Interface:** Application boundaries, Legacy URLs and current destinations
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/release-paths.test.ts`](../../tests/release-paths.test.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/system-overview.md`](../../knowledge/system-overview.md) — Application boundaries
- [reference] [`knowledge/route-compatibility.md`](../../knowledge/route-compatibility.md) — Legacy URLs and current destinations

## identity-office

**lib** · module · implemented

Authorization and public projections; Local office, samples and development

**Enter:** [`lib/auth/session.ts`](../../lib/auth/session.ts), [`scripts/preview-library.mjs`](../../scripts/preview-library.mjs)
**Interface:** Authorization and public projections, Local office, samples and development
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`scripts/test-library-admin.mjs`](../../scripts/test-library-admin.mjs)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/security-and-privacy.md`](../../knowledge/security-and-privacy.md) — Authorization and public projections
- [reference] [`knowledge/local-development.md`](../../knowledge/local-development.md) — Local office, samples and development

## collection

**lib** · module · implemented

Collection identity and publication

**Enter:** [`lib/library/catalog.ts`](../../lib/library/catalog.ts)
**Interface:** Collection identity and publication
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`scripts/test-library-admin.mjs`](../../scripts/test-library-admin.mjs)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/collection-publication.md`](../../knowledge/collection-publication.md) — Collection identity and publication

## portfolio-reports

**components** · module · implemented

Reports and shared reading surfaces

**Enter:** [`components/library/ProjectReport.tsx`](../../components/library/ProjectReport.tsx)
**Interface:** Reports and shared reading surfaces
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/browser/reports.spec.ts`](../../tests/browser/reports.spec.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/report-authoring.md`](../../knowledge/report-authoring.md) — Reports and shared reading surfaces

## authoring

**lib** · module · implemented

Authenticated authoring and drafts

**Enter:** [`lib/admin/library-use-cases.ts`](../../lib/admin/library-use-cases.ts)
**Interface:** Authenticated authoring and drafts
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`scripts/test-library-admin.mjs`](../../scripts/test-library-admin.mjs)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/admin-and-drafts.md`](../../knowledge/admin-and-drafts.md) — Authenticated authoring and drafts

## release-operations

**scripts** · module · implemented

Drift-checked content promotion; Qualification and performance evidence; Deployment, rollback and withdrawal

**Enter:** [`scripts/release-content.mjs`](../../scripts/release-content.mjs), [`scripts/profile-release.mjs`](../../scripts/profile-release.mjs), [`scripts/verify-release-http.mjs`](../../scripts/verify-release-http.mjs)
**Interface:** Drift-checked content promotion, Qualification and performance evidence, Deployment, rollback and withdrawal
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/release-safety.test.mjs`](../../tests/release-safety.test.mjs), [`tests/browser/books.spec.ts`](../../tests/browser/books.spec.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`docs/operations/release.md`](../../docs/operations/release.md) — Release and recovery runbook
- [reference] [`knowledge/content-promotion.md`](../../knowledge/content-promotion.md) — Drift-checked content promotion
- [reference] [`knowledge/testing-and-performance.md`](../../knowledge/testing-and-performance.md) — Qualification and performance evidence
- [reference] [`knowledge/release-and-recovery.md`](../../knowledge/release-and-recovery.md) — Deployment, rollback and withdrawal

## database

**prisma** · module · implemented

Database migrations and schema contract; Database and deployment environments

**Enter:** [`prisma/schema.prisma`](../../prisma/schema.prisma), [`scripts/database-target.mjs`](../../scripts/database-target.mjs)
**Interface:** Database migrations and schema contract, Database and deployment environments
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/release-safety.test.mjs`](../../tests/release-safety.test.mjs)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/database-contract.md`](../../knowledge/database-contract.md) — Database migrations and schema contract
- [reference] [`knowledge/integrations-and-environments.md`](../../knowledge/integrations-and-environments.md) — Database and deployment environments

## estate-program

**lib** · module · implemented

Travellers Rest content program; Archive evidence, attribution and rights

**Enter:** [`lib/estate/program.ts`](../../lib/estate/program.ts), [`lib/estate/objects.ts`](../../lib/estate/objects.ts)
**Interface:** Travellers Rest content program, Archive evidence, attribution and rights
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/estate.test.ts`](../../tests/estate.test.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/estate-program.md`](../../knowledge/estate-program.md) — Travellers Rest content program
- [reference] [`knowledge/historical-evidence.md`](../../knowledge/historical-evidence.md) — Archive evidence, attribution and rights

## estate-engine

**components** · module · implemented

Renderer sessions and resource lifecycle; Future worlds and immersive VR

**Enter:** [`components/estate/world/engine/engine.ts`](../../components/estate/world/engine/engine.ts), [`components/estate/world/engine/controller.ts`](../../components/estate/world/engine/controller.ts)
**Interface:** Renderer sessions and resource lifecycle, Future worlds and immersive VR
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/readiness.test.ts`](../../tests/readiness.test.ts), [`tests/world-environment.test.ts`](../../tests/world-environment.test.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/world-runtime.md`](../../knowledge/world-runtime.md) — Renderer sessions and resource lifecycle
- [reference] [`knowledge/future-worlds.md`](../../knowledge/future-worlds.md) — Future worlds and immersive VR

## estate-session

**components** · module · implemented

Visit history and saved reading places

**Enter:** [`components/estate/world/session.ts`](../../components/estate/world/session.ts)
**Interface:** Visit history and saved reading places
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/browser/navigation.spec.ts`](../../tests/browser/navigation.spec.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/navigation-and-bookmarks.md`](../../knowledge/navigation-and-bookmarks.md) — Visit history and saved reading places

## native-books

**components** · module · implemented

Native paper and HTML page measurements

**Enter:** [`components/estate/world/sheets.ts`](../../components/estate/world/sheets.ts)
**Interface:** Native paper and HTML page measurements
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/leaf-surfaces.test.ts`](../../tests/leaf-surfaces.test.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/book-rendering.md`](../../knowledge/book-rendering.md) — Native paper and HTML page measurements

## exhibits-media

**components** · module · implemented

Viewing folio and soccer collection

**Enter:** [`components/estate/world/Folio.tsx`](../../components/estate/world/Folio.tsx)
**Interface:** Viewing folio and soccer collection
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/browser/folio.spec.ts`](../../tests/browser/folio.spec.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/folio-and-media.md`](../../knowledge/folio-and-media.md) — Viewing folio and soccer collection

## asset-authoring

**scripts** · module · implemented

Immutable media and delivery inventory; Artwork and scene authoring tools

**Enter:** [`scripts/immutable-blob.mjs`](../../scripts/immutable-blob.mjs), [`scripts/pack-kit.mjs`](../../scripts/pack-kit.mjs)
**Interface:** Immutable media and delivery inventory, Artwork and scene authoring tools
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/release-safety.test.mjs`](../../tests/release-safety.test.mjs), [`tests/kit.test.ts`](../../tests/kit.test.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/asset-pipeline.md`](../../knowledge/asset-pipeline.md) — Immutable media and delivery inventory
- [reference] [`knowledge/authoring-tools.md`](../../knowledge/authoring-tools.md) — Artwork and scene authoring tools

## portrait

**lib** · module · implemented

Grounded portrait text and spending; Voice policy and authored narration

**Enter:** [`lib/portrait/server.ts`](../../lib/portrait/server.ts), [`lib/portrait/voice.ts`](../../lib/portrait/voice.ts)
**Interface:** Grounded portrait text and spending, Voice policy and authored narration
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/portrait.test.ts`](../../tests/portrait.test.ts)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/portrait-text.md`](../../knowledge/portrait-text.md) — Grounded portrait text and spending
- [reference] [`knowledge/portrait-voice.md`](../../knowledge/portrait-voice.md) — Voice policy and authored narration

## documentation

**.agent-docs** · module · implemented

Searchable OKF documentation

**Enter:** [`.agent-docs/cli.mjs`](../../.agent-docs/cli.mjs)
**Interface:** Searchable OKF documentation
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** none declared
**Checks:** [`tests/docs/navigation.test.mjs`](../../tests/docs/navigation.test.mjs)
- Preserve the documented visibility, identity and resource ownership invariants.

**Architecture and detailed docs:**

- [reference] [`knowledge/documentation-system.md`](../../knowledge/documentation-system.md) — Searchable OKF documentation

## qualification-contracts

**tests** · module · implemented

Portable policy contracts, native browser journeys and documentation safety fixtures.

**Enter:** [`tests/release-paths.test.ts`](../../tests/release-paths.test.ts), [`tests/release-safety.test.mjs`](../../tests/release-safety.test.mjs), [`tests/browser/compatibility.spec.ts`](../../tests/browser/compatibility.spec.ts), [`tests/docs/navigation.test.mjs`](../../tests/docs/navigation.test.mjs)
**Interface:** npm test; npm run test:safety; npm run test:browser; npm run docs:test
**Package:** not a standalone package
**Export subpaths:** none declared. Declared metadata; build outputs are not read.
**Declared internal package dependencies:** none declared
**Other runtime dependencies:** none declared
**Reviewed runtime/data relationships:** [public-routes](#public-routes), [collection](#collection), [estate-engine](#estate-engine), [documentation](#documentation)
**Checks:** [`tests/browser/books.spec.ts`](../../tests/browser/books.spec.ts), [`tests/browser/navigation.spec.ts`](../../tests/browser/navigation.spec.ts)
- Workstation GPU and hosted release proof are separate from portable CI.

**Architecture and detailed docs:**

No module-specific architecture document registered. Do not infer a design decision from the folder name.
<!-- END GENERATED: semantic-map -->
