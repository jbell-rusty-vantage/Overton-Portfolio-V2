---
type: "Architecture Concept"
title: "Collection identity and publication"
description: "types.ts defines Volume, Leaf and Block without renderer dependencies. taxonomy.ts preserves existing category and shelf slugs; owner-edited shelf titles and slot order come from PostgreSQL. Hall node names and camera geometry no longer determine collection eligibility. collection-query.ts owns request-local cached rows; catalog.ts owns projection and policy application."
tags: ["collection", "publication"]
aliases: ["hide a study", "guessed URLs", "sitemap withdrawal", "portrait citations"]
owner: "collection"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../lib/library/catalog.ts", "title": "Collection identity and publication implementation"}, {"id": "proof", "resource": "../scripts/test-library-admin.mjs", "title": "Relevant verification"}]
---

# Collection identity and publication

types.ts defines Volume, Leaf and Block without renderer dependencies. taxonomy.ts preserves existing category and shelf slugs; owner-edited shelf titles and slot order come from PostgreSQL. Hall node names and camera geometry no longer determine collection eligibility. collection-query.ts owns request-local cached rows; catalog.ts owns projection and policy application.

Publish the project and its wrapper book deliberately. Hiding either withdraws that presentation; an unlisted entry requires a direct reader. Scheduled and deleted content stays absent. Duplicate wrappers require unambiguous placement and must not invent a project alias. Stable book slugs, leaf keys and page order preserve citations and bookmarks. No cleanup migration drops historical zones, screens or scene records.

[Source](../lib/library/catalog.ts) · [Verification](../scripts/test-library-admin.mjs)
