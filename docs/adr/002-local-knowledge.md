# Portable local knowledge

Status: implementation decision under the approved cleanup plan.

Use pinned agent-docs v1.2 and a registered OKF 0.2 bundle. Search is lexical, local and bounded. Source hashes detect drift, not semantic correctness. Private paths require an Overton-specific allowlist guard; archives and receipts are excluded from default retrieval. No public docs route, vector database or sibling-workspace dependency is introduced.
