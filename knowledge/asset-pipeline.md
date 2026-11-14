---
type: "Architecture Concept"
title: "Immutable media and delivery inventory"
description: "Replacement images and GLBs receive new content-addressed filenames; never overwrite immutable bytes. Verify SHA-256 after upload, not only file size. Blob references and bundled files have distinct withdrawal paths. Removing a UI or hiding content does not revoke public URLs or cached copies."
tags: ["asset", "pipeline"]
owner: "asset-authoring"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../scripts/immutable-blob.mjs", "title": "Immutable media and delivery inventory implementation"}, {"id": "proof", "resource": "../tests/release-safety.test.mjs", "title": "Relevant verification"}]
---

# Immutable media and delivery inventory

Replacement images and GLBs receive new content-addressed filenames; never overwrite immutable bytes. Verify SHA-256 after upload, not only file size. Blob references and bundled files have distinct withdrawal paths. Removing a UI or hiding content does not revoke public URLs or cached copies.

assets:inventory validates current delivery and writes temporary output under .local-library by default. An explicit --output creates a new snapshot exclusively and refuses to overwrite a receipt. Prior dated release evidence is immutable. Hall GLBs are removed from current bundled delivery; source masters and old deployments remain recovery history. Shared covers and posters remain in use.

[Source](../scripts/immutable-blob.mjs) · [Verification](../tests/release-safety.test.mjs)
