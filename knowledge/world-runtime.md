---
type: "Architecture Concept"
title: "Renderer sessions and resource lifecycle"
description: "Engine is the native Three.js facade; React owns navigation and accessible controls. ResourceOwner tracks geometries, textures and materials, including resources that arrive after cancellation. Scene readiness includes assets, shader preparation and native paper surfaces. A failed or lost WebGL context falls back to plain reading."
tags: ["world", "runtime"]
owner: "estate-engine"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../components/estate/world/engine/engine.ts", "title": "Renderer sessions and resource lifecycle implementation"}, {"id": "proof", "resource": "../tests/readiness.test.ts", "title": "Relevant verification"}]
---

# Renderer sessions and resource lifecycle

Engine is the native Three.js facade; React owns navigation and accessible controls. ResourceOwner tracks geometries, textures and materials, including resources that arrive after cancellation. Scene readiness includes assets, shader preparation and native paper surfaces. A failed or lost WebGL context falls back to plain reading.

One renderer lives for a visit. Hidden and report-paused intervals must issue zero draws; exit must release contexts and listeners. Verify cancellation, late loading, context loss and ten enter/read/report/exit cycles on the same GPU profile. The previous heap trend did not fully plateau; shorter source files do not prove faster rendering. React Three Fiber remains only for preserved Travellers Rest prototype tooling.

[Source](../components/estate/world/engine/engine.ts) · [Verification](../tests/readiness.test.ts)
