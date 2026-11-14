# Operations

Historical compatibility pointer. The pre-cleanup text is superseded; it is not current operational guidance.

[Current explanation](../knowledge/release-and-recovery.md) · [Preserved original](archive/pre-cleanup/docs/OPERATIONS.md) · [Documentation index](README.md)

<a id="operations-runbook"></a>
<a id="environments--infrastructure"></a>
<a id="environment-variables"></a>
<a id="migrations"></a>
<a id="making-a-schema-change"></a>
<a id="1-edit-prismaschemaprisma-add--doc-comments-for-new-tablescolumns"></a>
<a id="2-create-the-migration-against-a-local-or-neon-dev-branch-database"></a>
<a id="3-if-you-added-doc-comments-append-comment-on-statements"></a>
<a id="4-viewsfunctionstriggers-edit-prismasqlobjectssql-and-copy-the-changed-create-or-replace"></a>
<a id="statements-into-the-new-migration-objectssql-is-the-readable-source-of-truth"></a>
<a id="5-commit-the-vercel-build-applies-it"></a>
<a id="local-postgres-for-development"></a>
<a id="any-postgres-16-works-eg-docker"></a>
<a id="neon-sql-cookbook"></a>
<a id="admin-access"></a>
<a id="troubleshooting"></a>
<a id="november-13-production-release"></a>
