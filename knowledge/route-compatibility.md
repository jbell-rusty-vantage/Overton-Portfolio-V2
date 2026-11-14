---
type: "Architecture Concept"
title: "Legacy URLs and current destinations"
description: "Old view=world links translate to the current visit. Entrance maps to /library, stacks to #cabinet, computer-station to #screen/main; periodicals, favorites-wing, evolution-hall and reading-room map to /blog, /favorites, /evolution and /catalog. Unknown zones fall back to the entrance."
tags: ["route", "compatibility"]
aliases: ["selected work bookmark", "portfolio anchors", "redirected into the world"]
owner: "public-routes"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../lib/library/paths.ts", "title": "Legacy URLs and current destinations implementation"}, {"id": "proof", "resource": "../tests/release-paths.test.ts", "title": "Relevant verification"}]
---

# Legacy URLs and current destinations

Old view=world links translate to the current visit. Entrance maps to /library, stacks to #cabinet, computer-station to #screen/main; periodicals, favorites-wing, evolution-hall and reading-room map to /blog, /favorites, /evolution and /catalog. Unknown zones fall back to the entrance.

resolveLegacyArrival accepts only a previously authorized projection. A unique book match placed in the estate opens #book/slug/leaf. Invalid leaf keys start that book at the beginning. Unplaced content uses its authorized HTML reader. Ambiguous or hidden identities do not disclose a destination. Existing valid current-world fragments take precedence over retired query parameters, including report section, leaf and page.

The browser owns fragment translation because servers cannot see fragments. replaceState or location.replace avoids redirect bounce on Back. Root portfolio anchors remain portfolio anchors. Authenticated previews authorize before lookup and keep their draft labeling. No-JavaScript visitors retain the text catalog. Samples are development-only, browser-local text editing.

[Source](../lib/library/paths.ts) · [Verification](../tests/release-paths.test.ts)

A selected work bookmark such as /#selected-work or /#work-gowipe stays on the portfolio. /projects#work-gowipe preserves its bookmark through the portfolio redirect; it does not enter the world.
