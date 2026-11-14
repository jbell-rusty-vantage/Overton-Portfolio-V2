---
type: "Architecture Concept"
title: "Voice policy and authored narration"
description: "Live two-way voice remains disabled until provider/server hard spending and session termination bounds are verified. A browser socket and a nominal three-minute timer are not a proven hard backstop. Available credentials do not authorize enabling it."
tags: ["portrait", "voice"]
owner: "portrait"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../lib/portrait/voice.ts", "title": "Voice policy and authored narration implementation"}, {"id": "proof", "resource": "../tests/portrait.test.ts", "title": "Relevant verification"}]
---

# Voice policy and authored narration

Live two-way voice remains disabled until provider/server hard spending and session termination bounds are verified. A browser socket and a nominal three-minute timer are not a proven hard backstop. Available credentials do not authorize enabling it.

Authored narration remains available and is independent of live voice. Preserve timeline cues, caption completeness, mute/reduced-motion behavior and Stop. Spoken project facts in a future qualified live mode must use the same grounded text-agent path and shared budget. Record any future provider qualification separately from the current deployed policy.

[Source](../lib/portrait/voice.ts) · [Verification](../tests/portrait.test.ts)
