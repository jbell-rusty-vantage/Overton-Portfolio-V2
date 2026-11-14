---
type: "Architecture Concept"
title: "Authenticated authoring and drafts"
description: "The library action is a thin authenticated adapter. library-use-cases owns validated book, page, placement, shelf-title and estate-release commands. The adapter acquires the advisory transaction lock and runs a Serializable transaction; snapshots, audits and signals receive the same transaction client. Conflicts preserve submitted input and require reload."
tags: ["admin", "and", "drafts"]
owner: "authoring"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../lib/admin/library-use-cases.ts", "title": "Authenticated authoring and drafts implementation"}, {"id": "proof", "resource": "../scripts/test-library-admin.mjs", "title": "Relevant verification"}]
---

# Authenticated authoring and drafts

The library action is a thin authenticated adapter. library-use-cases owns validated book, page, placement, shelf-title and estate-release commands. The adapter acquires the advisory transaction lock and runs a Serializable transaction; snapshots, audits and signals receive the same transaction client. Conflicts preserve submitted input and require reload.

Hall camera, screen and scene commands are absent from the command table as well as the UI. Their historical database records are retained. /admin/preview/library and typed preview readers call requireAdmin before fetching drafts. The sample desk stores fictional edits in localStorage and cannot write PostgreSQL.

[Source](../lib/admin/library-use-cases.ts) · [Verification](../scripts/test-library-admin.mjs)
