---
type: "Architecture Concept"
title: "Application boundaries"
description: "The homepage is the 2D portfolio; /library is the optional Travellers Rest visit. Reports, résumé, soccer, blog, favorites and the text catalog remain independent HTML destinations. The office lives under /admin. The seven-room hall is retired. The current Travellers Rest world uses native Three.js; earlier Travellers Rest prototype tools are preserved at the owner’s explicit request. React owns accessible controls and reading surfaces."
tags: ["system", "overview"]
owner: "public-routes"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../app/page.tsx", "title": "Application boundaries implementation"}, {"id": "proof", "resource": "../tests/release-paths.test.ts", "title": "Relevant verification"}]
---

# Application boundaries

The homepage is the 2D portfolio; /library is the optional Travellers Rest visit. Reports, résumé, soccer, blog, favorites and the text catalog remain independent HTML destinations. The office lives under /admin. The seven-room hall is retired. The current Travellers Rest world uses native Three.js; earlier Travellers Rest prototype tools are preserved at the owner’s explicit request. React owns accessible controls and reading surfaces.

The collection is projected once per request, with separate direct-reader visibility. The estate layers its program, companion book, media and placements over that collection. Never import production functionality from app/dev. Development world-lab is an isolated renderer fixture, not another public world.

[Source](../app/page.tsx) · [Verification](../tests/release-paths.test.ts)
