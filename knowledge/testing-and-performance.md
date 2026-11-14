---
type: "Architecture Concept"
title: "Qualification and performance evidence"
description: "Portable checks cover types, lint, domain/privacy contracts, migration/upload safety, disposable admin editing, accessibility and no-JavaScript reading. Native world gestures, book pages and GPU lifecycle require workstation qualification; software-renderer CI is not equivalent."
tags: ["testing", "and", "performance"]
owner: "release-operations"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../scripts/profile-release.mjs", "title": "Qualification and performance evidence implementation"}, {"id": "proof", "resource": "../tests/browser/books.spec.ts", "title": "Relevant verification"}]
---

# Qualification and performance evidence

Portable checks cover types, lint, domain/privacy contracts, migration/upload safety, disposable admin editing, accessibility and no-JavaScript reading. Native world gestures, book pages and GPU lifecycle require workstation qualification; software-renderer CI is not equivalent.

Use matched browser/device/data cold and warm 2D/world measurements before and after refactors. Record wire and script/image bytes, LCP/CLS, entry time and p95 frames. Require no WebGL before entry, no draws while hidden or report-paused, stable active GPU counts and zero contexts after exit. Physical phones and VR remain unqualified unless actually measured. The prior non-plateaued heap trend remains an open limitation.

[Source](../scripts/profile-release.mjs) · [Verification](../tests/browser/books.spec.ts)
