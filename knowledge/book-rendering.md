---
type: "Architecture Concept"
title: "Native paper and HTML page measurements"
description: "sheets.ts defines page metrics shared by printed HTML and geometry; paginate.ts partitions content into native surfaces. Reader.tsx owns accessible page content and controls. Volume3D, BookHold and turn geometry own physical handling. These boundaries keep paper size and printed text synchronized."
tags: ["book", "rendering"]
owner: "native-books"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../components/estate/world/sheets.ts", "title": "Native paper and HTML page measurements implementation"}, {"id": "proof", "resource": "../tests/leaf-surfaces.test.ts", "title": "Relevant verification"}]
---

# Native paper and HTML page measurements

sheets.ts defines page metrics shared by printed HTML and geometry; paginate.ts partitions content into native surfaces. Reader.tsx owns accessible page content and controls. Volume3D, BookHold and turn geometry own physical handling. These boundaries keep paper size and printed text synchronized.

Keep ordered leaf ranges through the real end, opaque paper, guarded animated turns and viewport-aware metrics. Do not change geometry merely to split a large file. After reader-boundary changes, inspect every six-study page on desktop and emulated phone for blank, missing, clipped or cropped surfaces and confirm report returns. Emulated phone evidence is not a physical-device qualification.

[Source](../components/estate/world/sheets.ts) · [Verification](../tests/leaf-surfaces.test.ts)
