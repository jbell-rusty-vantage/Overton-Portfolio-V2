---
type: "Architecture Concept"
title: "Searchable OKF documentation"
description: "The registered flat knowledge bundle uses OKF 0.2 Markdown with parsed YAML. The pinned local agent-docs v1.2 snapshot generates compact guides, a source/test map and an index. Bootstrap hashes identify the canonical local snapshot; no nonexistent upstream commit is claimed."
tags: ["documentation", "system"]
aliases: ["stale evidence", "source freshness", "cited source file changes", "detect documentation drift"]
owner: "documentation"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../.agent-docs/cli.mjs", "title": "Searchable OKF documentation implementation"}, {"id": "proof", "resource": "../tests/docs/navigation.test.mjs", "title": "Relevant verification"}]
---

# Searchable OKF documentation

The registered flat knowledge bundle uses OKF 0.2 Markdown with parsed YAML. The pinned local agent-docs v1.2 snapshot generates compact guides, a source/test map and an index. Bootstrap hashes identify the canonical local snapshot; no nonexistent upstream commit is claimed.

Use docs:search for lexical retrieval and docs:context for bounded source-linked sections. Search is not semantic embeddings and does not prove task completion. Add an explanation with owner, tags, source/test links and honest implementation/validation fields; register it in config.json and its owning module, then run docs:build, docs:check and docs:test. Never put secrets, private content, local release baselines or runtime logs in the bundle. Archive text is excluded from default retrieval. Frozen Overton retrieval fixtures are separate from upstream tool tests.

[Source](../.agent-docs/cli.mjs) · [Verification](../tests/docs/navigation.test.mjs)

The Overton profile declines multi-word questions with fewer than two matched terms. This conservative lexical no-answer threshold reduces generic-word false positives; it is not semantic confidence. Development-fixture aliases can be refined, while held-out queries and labels remain frozen.
