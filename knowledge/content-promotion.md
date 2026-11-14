---
type: "Architecture Concept"
title: "Drift-checked content promotion"
description: "Code deployment, content publication and media delivery are separate operations. release-content plans against a specific target and retains a private baseline. Apply only the reviewed scoped plan; it compares owner fields and refuses drift. Never regenerate a baseline to bypass a refusal. The six-study publication and its prior receipts are the starting edition, not permission for broad seeding."
tags: ["content", "promotion"]
owner: "release-operations"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../scripts/release-content.mjs", "title": "Drift-checked content promotion implementation"}, {"id": "proof", "resource": "../tests/release-safety.test.mjs", "title": "Relevant verification"}]
---

# Drift-checked content promotion

Code deployment, content publication and media delivery are separate operations. release-content plans against a specific target and retains a private baseline. Apply only the reviewed scoped plan; it compares owner fields and refuses drift. Never regenerate a baseline to bypass a refusal. The six-study publication and its prior receipts are the starting edition, not permission for broad seeding.

Withdrawal hides the same planned content and verifies absence from direct reports, sitemap and portrait citations. Restore uses the original snapshot, including leaf order and identities. Code rollback alone does not restore content. Keep private baselines outside Git and preserve the recorded independent withdrawal procedure in the release runbook.

[Source](../scripts/release-content.mjs) · [Verification](../tests/release-safety.test.mjs)
