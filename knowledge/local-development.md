---
type: "Architecture Concept"
title: "Local office, samples and development"
description: "Use Node 24 and npm ci. npm run admin:local opens the real local content office on 127.0.0.1:3078; its saves use the configured database and actor local-office. Account changes still require a real session. npm run preview:library uses port 3077 and a scoped review projection; preview visibility is not publication."
tags: ["local", "development"]
owner: "identity-office"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../scripts/preview-library.mjs", "title": "Local office, samples and development implementation"}, {"id": "proof", "resource": "../scripts/test-library-admin.mjs", "title": "Relevant verification"}]
---

# Local office, samples and development

Use Node 24 and npm ci. npm run admin:local opens the real local content office on 127.0.0.1:3078; its saves use the configured database and actor local-office. Account changes still require a real session. npm run preview:library uses port 3077 and a scoped review projection; preview visibility is not publication.

/samples and /dev/library-admin are development-only fictional browser-local editing. npm run test:admin and test:office create disposable PostgreSQL-compatible data and never need owner records. npm run build:local avoids migration; npm run build runs the guarded migration deployment path. Stop the owning test server before starting another on the same port.

[Source](../scripts/preview-library.mjs) · [Verification](../scripts/test-library-admin.mjs)
