---
type: "Architecture Concept"
title: "Viewing folio and soccer collection"
description: "The period-paper viewing folio exposes project recordings and all nine soccer clips. Playback, fullscreen and keyboard ownership must remain usable on desktop and phone layouts. Screen fragments select the current folio; retired computer-screen database records no longer drive portfolio reads."
tags: ["folio", "and", "media"]
owner: "exhibits-media"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../components/estate/world/Folio.tsx", "title": "Viewing folio and soccer collection implementation"}, {"id": "proof", "resource": "../tests/browser/folio.spec.ts", "title": "Relevant verification"}]
---

# Viewing folio and soccer collection

The period-paper viewing folio exposes project recordings and all nine soccer clips. Playback, fullscreen and keyboard ownership must remain usable on desktop and phone layouts. Screen fragments select the current folio; retired computer-screen database records no longer drive portfolio reads.

Media pauses when hidden or closed. Keep controls outside gesture capture and retain browser Back/reload behavior. The same media can have smaller physical-book presentations and larger report playback. Validate MIME, ranges and cache headers separately from UI checks.

[Source](../components/estate/world/Folio.tsx) · [Verification](../tests/browser/folio.spec.ts)
