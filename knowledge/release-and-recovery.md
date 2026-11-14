---
type: "Architecture Concept"
title: "Deployment, rollback and withdrawal"
description: "Run typecheck, lint, unit and safety tests, inventory, production build, disposable authoring and browser qualification before release. Verify a protected Preview with its isolated database, then deploy the reviewed source to Production and verify actual public URLs. Record source SHA, deployment ID, rollback target, tests and limitations in a new release receipt."
tags: ["release", "and", "recovery"]
owner: "release-operations"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../scripts/verify-release-http.mjs", "title": "Deployment, rollback and withdrawal implementation"}, {"id": "proof", "resource": "../tests/release-safety.test.mjs", "title": "Relevant verification"}]
---

# Deployment, rollback and withdrawal

Run typecheck, lint, unit and safety tests, inventory, production build, disposable authoring and browser qualification before release. Verify a protected Preview with its isolated database, then deploy the reviewed source to Production and verify actual public URLs. Record source SHA, deployment ID, rollback target, tests and limitations in a new release receipt.

Code rollback uses the prior deployment; content restoration uses private drift-checked baselines; asset withdrawal removes exact bundled/Blob objects independently. Never overwrite an earlier release receipt during checks. Main should contain the reviewed history and match origin after release; preserve untracked authoring masters locally. Detailed commands belong in the release runbook.

[Source](../scripts/verify-release-http.mjs) · [Verification](../tests/release-safety.test.mjs)
