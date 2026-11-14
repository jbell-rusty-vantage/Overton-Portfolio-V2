---
type: "Architecture Concept"
title: "Database migrations and schema contract"
description: "Prisma schema.prisma is authoritative: 53 models, including PortraitLedger, and four existing migration directories at cleanup baseline. Import the generated client and types through lib/db. New models and columns need triple-slash documentation and snake_case database mappings. Applied SQL migrations are immutable; add another migration. Functions, views and triggers also have readable definitions in prisma/sql/objects.sql."
tags: ["database", "contract"]
owner: "database"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../prisma/schema.prisma", "title": "Database migrations and schema contract implementation"}, {"id": "proof", "resource": "../tests/release-safety.test.mjs", "title": "Relevant verification"}]
---

# Database migrations and schema contract

Prisma schema.prisma is authoritative: 53 models, including PortraitLedger, and four existing migration directories at cleanup baseline. Import the generated client and types through lib/db. New models and columns need triple-slash documentation and snake_case database mappings. Applied SQL migrations are immutable; add another migration. Functions, views and triggers also have readable definitions in prisma/sql/objects.sql.

The normal build never wipes a nonempty database without migration history. db-deploy refuses it; explicit target fingerprints and direct/pooled agreement guard deployment. DB_DEPLOY_SKIP=1 performs a migration-free verification build. Disposable PGlite tests apply the real migrations and exercise safety without owner data. Schema reference is generated separately from authored policy.

[Source](../prisma/schema.prisma) · [Verification](../tests/release-safety.test.mjs)
