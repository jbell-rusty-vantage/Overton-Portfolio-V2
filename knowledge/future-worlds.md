---
type: "Architecture Concept"
title: "Future worlds and immersive VR"
description: "Travellers Rest is the only implemented world. Immersive VR, WebXR sessions, stereoscopic rendering, controller/hand input, headset comfort and spatial audio are proposed requirements, not supported features. No headset qualification has occurred."
tags: ["future", "worlds"]
owner: "estate-engine"
implementation_status: "proposed"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../components/estate/world/engine/controller.ts", "title": "Future worlds and immersive VR implementation"}, {"id": "proof", "resource": "../tests/world-environment.test.ts", "title": "Relevant verification"}]
---

# Future worlds and immersive VR

Travellers Rest is the only implemented world. Immersive VR, WebXR sessions, stereoscopic rendering, controller/hand input, headset comfort and spatial audio are proposed requirements, not supported features. No headset qualification has occurred.

Keep collection/readers, assets, portrait contracts and resource ownership independent where current boundaries justify it. A second real world and named headset targets should drive world registries, namespaced save state and input abstractions. Do not add /worlds routes, ECS, physics stacks or a universal renderer API speculatively. Preserve existing bookmark keys until a deliberate versioned migration.

[Source](../components/estate/world/engine/controller.ts) · [Verification](../tests/world-environment.test.ts)
