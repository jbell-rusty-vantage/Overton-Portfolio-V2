---
type: "Architecture Concept"
title: "Visit history and saved reading places"
description: "The location hash describes place, held object, report section, leaf and page. lib/estate/world parses and formats it; visitor-navigation validates portrait destinations. session.ts owns browser subscriptions and the stable overton-estate: storage namespace. Preserve tw-route and existing bookmark keys."
tags: ["navigation", "and", "bookmarks"]
aliases: ["return to book", "case study return", "exact leaf and page", "marked page"]
owner: "estate-session"
implementation_status: "implemented"
validation_status: "source-inspected; release qualification recorded separately"
sources: [{"id": "implementation", "resource": "../components/estate/world/session.ts", "title": "Visit history and saved reading places implementation"}, {"id": "proof", "resource": "../tests/browser/navigation.spec.ts", "title": "Relevant verification"}]
---

# Visit history and saved reading places

The location hash describes place, held object, report section, leaf and page. lib/estate/world parses and formats it; visitor-navigation validates portrait destinations. session.ts owns browser subscriptions and the stable overton-estate: storage namespace. Preserve tw-route and existing bookmark keys.

Fresh shelf or directory selections begin on page one. Only Return to my place explicitly resumes a bookmark. Opening a report and returning restores the same marked page. Back, Forward and reload must agree; do not create duplicate listeners or restore old bookmarks on ordinary pickup. Navigation Stop cancels travel and deferred portrait intents.

[Source](../components/estate/world/session.ts) · [Verification](../tests/browser/navigation.spec.ts)
