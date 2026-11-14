---
type: "Architecture Concept"
title: "Database and deployment environments"
description: "Production and Preview have isolated database targets. The Vercel project is overton-portfolio-v2; the Git remote is jbell-rusty-vantage/Overton-Portfolio-V2. Inspect the bound project and target fingerprint before operations. DATABASE_URL and DATABASE_URL_UNPOOLED must describe the same database; migrations use the direct connection."
tags: ["integrations", "and", "environments"]
owner: "database"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../scripts/database-target.mjs", "title": "Database and deployment environments implementation"}, {"id": "proof", "resource": "../tests/release-safety.test.mjs", "title": "Relevant verification"}]
---

# Database and deployment environments

Production and Preview have isolated database targets. The Vercel project is overton-portfolio-v2; the Git remote is jbell-rusty-vantage/Overton-Portfolio-V2. Inspect the bound project and target fingerprint before operations. DATABASE_URL and DATABASE_URL_UNPOOLED must describe the same database; migrations use the direct connection.

Environment files, platform state, recovery credentials and private content never enter documentation search or public delivery. Vercel Blob stores immutable media; public assets can remain reachable after a book is hidden. Gateway text settings and voice enablement are operational contracts, not assumptions inferred from available credentials.

[Source](../scripts/database-target.mjs) · [Verification](../tests/release-safety.test.mjs)
