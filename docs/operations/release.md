# Release and recovery

Run from the repository root with Node 24. Check `git status`, the bound `.vercel/project.json`, and the database target before any operation. Preserve private release baselines. Do not print credentials.

1. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:safety`, `npm run assets:inventory`, `npm run docs:check`, `npm run docs:test`, and `npm run build`. Use `DB_DEPLOY_SKIP=1` for a migration-free local verification; a real deployment uses the guarded target contract.
2. Run `npm run test:admin`, `npm run test:office`, portable browser tests, and the native workstation journeys. The first two create disposable data. Inspect book surfaces and lifecycle separately from software-renderer CI.
3. Deploy a Preview using the bound Vercel CLI project. Preview must use its isolated database. Verify the private platform gate and the application auth gate independently. Never enable live voice as part of deployment.
4. Integrate reviewed commits to main, push, and deploy Production. Record the exact SHA and deployment ID in a new dated receipt. Verify `/`, `/library`, the six reports, résumé, catalog, admin protection and removed hall asset URLs on the actual production alias.
5. Run `node scripts/verify-release-http.mjs` with the intended `RELEASE_BASE_URL`; read the script for its current options. `scripts/profile-release.mjs` accepts PROFILE_BASE, PROFILE_PORTFOLIO, PROFILE_ESTATE and a unique PROFILE_LABEL. Preserve fresh evidence rather than overwriting prior release measurements.

`npm run assets:inventory` writes ignored temporary inventory. `npm run assets:inventory -- --output docs/releases/<new-release>/assets.json` creates an exclusive snapshot and refuses an existing file.

Code rollback: identify the previous successful Production deployment from the new receipt and use `vercel rollback <deployment-url>`, then recheck public URLs. A rollback does not restore content or revoke media.

Content withdrawal/restoration: use the reviewed private plan and baseline with `scripts/release-content.mjs`; inspect its help and target fingerprint before apply. It refuses owner drift. Never recreate the baseline to bypass a refusal. Verify reports, sitemap and portrait evidence after withdrawal.

Asset withdrawal: remove only exact exclusively referenced bundled derivatives in a new deployment and, when authorized, the corresponding Blob objects from the inventory. Verify direct HTTP URLs. Cached/downloaded immutable bytes and historical deployments may remain. Preserve source masters and credits.

The [previous release](../releases/2026-11-13/README.md) records independently rehearsed content restoration and asset withdrawal. New code-only releases leave owner content unchanged and must say so explicitly.
