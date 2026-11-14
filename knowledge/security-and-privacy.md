---
type: "Architecture Concept"
title: "Authorization and public projections"
description: "Every admin page, action and handler must authorize through requireAdmin/getAdmin. The proxy is an optimistic cookie redirect, not authorization. Cache Components requires a Suspense boundary around request, cookie and database reads; console exports use officePage even when the parent layout is mounted."
tags: ["security", "and", "privacy"]
aliases: ["hidden content", "guessed URLs and sitemap", "portrait evidence privacy"]
owner: "identity-office"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../lib/auth/session.ts", "title": "Authorization and public projections implementation"}, {"id": "proof", "resource": "../scripts/test-library-admin.mjs", "title": "Relevant verification"}]
---

# Authorization and public projections

Every admin page, action and handler must authorize through requireAdmin/getAdmin. The proxy is an optimistic cookie redirect, not authorization. Cache Components requires a Suspense boundary around request, cookie and database reads; console exports use officePage even when the parent layout is mounted.

Publication uses display and scheduling; activation independently controls ingestion. Hidden or deleted records do not enter public readers or portrait evidence. Unlisted content is direct-link only. Wrappers can suppress their underlying project. Client names, repository aliases, show_name and redaction_policy must survive every new projection. The local-office exception is explicitly launched, loopback-bound and unavailable in production.

[Source](../lib/auth/session.ts) · [Verification](../scripts/test-library-admin.mjs)
