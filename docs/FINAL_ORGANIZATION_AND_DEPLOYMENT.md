# Next milestone — final organization and deployment readiness

**Updated owner goal, November 13:** the next session must complete route separation, final asset/renderer/code optimization and actual deployment. Start with [the inspected execution brief](DEPLOYMENT_EXECUTION_BRIEF.md), which includes concrete findings and a paste-ready prompt. This earlier document remains supporting context for content promotion, disclosure and withdrawal.

The reviewable first edition is implemented locally. Start with [the delivery and evidence record](SHOWCASES_AND_2D_DELIVERY.md), then [the private selected-work preview](http://127.0.0.1:3078/admin/library/preview?portfolio=1). The remaining outcome is an approved, published collection and a qualified hosted visitor journey. This brief does not imply that either has happened.

## Actual state at handoff

- Working tree contains substantial prior 3D, portrait and résumé work plus this 2D/content pass. Nothing from this session was committed, pushed or deployed. Preserve unrelated changes and source assets.
- Six case studies are JSON drafts, shown only through authorized admin projection. Public `/projects` exists but does not show the hidden selected books. The résumé/PDF remain available. No PostgreSQL writes or asset uploads occurred.
- New `*-v3.webp` public derivatives are safe public-site captures and authored diagrams. Files under `public/` become directly reachable on deployment regardless of book visibility. Older public media need the release inventory review below.
- Current Git origin is `jbell-rusty-vantage/Overton-Portfolio-V2`. The bound Vercel project in `.vercel/project.json` is **overton-portfolio-v2**. The accepted résumé points at `https://overton-portfolio-v2.vercel.app/`. Older runbook references to `Overton77/overton-portfolio` are historical. Re-read binding and remote state before deployment; this pass did not inspect or change Vercel configuration.
- Database remains the configured Neon PostgreSQL; media uses existing bundled assets and Vercel Blob. No new schema migration is needed for the 2D portfolio. Earlier portrait/estate database and asset changes retain their own release history and requirements.

## Final editorial decisions

Review the primary order: Vantage Movers, GoWipe, Overtech / Research Agent, Mission Control, AI Engineer Platform, with Knowledge Services as the technical companion. Keep navigation compact: Selected Work, Résumé, The Library; Text catalog in the footer. The root remains the estate entrance with an explicit Browse portfolio choice; changing the default landing route is a separate editorial decision.

Confirm titles, John's role, client naming and the six substantial narratives. The draft already distinguishes local tests, dated real runs, current live UI and planned features. Do not remove those boundaries to make a stronger marketing claim. Select supporting reports from the eight-item disposition table in the delivery. Their continued existence is not an instruction to publish all of them. Daryl's résumé omission does not decide his portfolio placement.

## Concrete promotion package

1. Run `node scripts/prepare-showcase-promotion.mjs`. Review `.local-library/showcase-2026/promotion-plan.json`: expected source summaries/pages/tags/status, authored page mode, stable keys, role/status metadata, replacement blocks, poster choices and local media hashes. If the office source has changed, reconcile it; do not overwrite newer owner writing. The automatic draft projection also fails closed on source drift.
2. Confirm client `redaction_policy`, `public_alias`, `show_name`, project/repository activation and display. No private repository URLs or customer screenshots should be introduced. The featured Vantage report uses blank-contact public forms; GoWipe uses a fresh anonymous cart. Approve the recorded research projection separately from its private raw archive.
3. Register required media and update projects/books through authenticated, audited office writes. Keep revisions/snapshots and timeline signals where applicable. Preserve stable slugs and leaf keys. Use **authored** page mode for the replacement sets so position preserves walkthrough order. `Heading` + `label: section-title` preserves custom section titles; `Metric` labels `Role` and `Status` preserve the reviewed header facts. Import alone is not publication.
4. Reconcile the existing artwork/estate manifests from earlier sessions. New study media is bundled, not a reason to rerun a broad seed. Existing unqualified dashboard captures, unavailable booking pictures and retired source assets must be withheld or reviewed; do not delete source files merely because they are omitted from the featured studies.
5. Publish only the approved project/book pairs, with deliberate activation and dates. Check the public collection and direct reader after each pair. The web résumé adds corresponding case-study links automatically when the report is publicly discoverable; unlisted/hidden entries do not enter that list.

## Specific source gaps

| Project | Additional proof needed only for a stronger release claim |
| --- | --- |
| Vantage | Authorized synthetic CRM sandbox receipt through booking/cancellation, source/deployed revision alignment, isolated dashboard capture. Current public pre-submit and mocked service proof is already labeled. No customer submissions or real bookings are authorized by this handoff. |
| GoWipe | Theme provenance and an authorized analytics/consent/test-order reconciliation before claiming delivered purchase attribution or improvement. Current guest-cart task and outgoing events are sufficient for the bounded story. |
| Overtech | Anonymous reader availability after its separate studio launch decision; sanitization/release of any newer private Eve cases. Ready endpoint is not agent qualification. |
| Mission Control | Current hosted/provider and wider integration gates; recorded November 9 run does not release Sprint OC W1. |
| AI Engineer / KS | Connected student app, worker and cross-service clients; real capture→admission→retrieval qualification. Current source tests and dated disposable service proof remain explicitly bounded. |

None requires fabricating a walkthrough or silently expanding this portfolio task into those projects' build/release programs.

## Hosted release checks

Run typecheck, lint, all contracts, focused browser tests and `npm run build:local` before release. `npm run build` executes database migrations and must only run against the intended deployment target after pending migrations are reviewed. The 2D changes themselves add no migration.

Use a Vercel preview with intentionally scoped database/media before production. On the actual anonymous hosted path, at desktop and phone width, exercise entrance → Browse portfolio → each selected report → its walkthrough/source → Back to the selected card; résumé → public case study; PDF download; direct report/section URLs; enlarged image focus/Escape; video controls; reduced motion. Confirm the 2D path fetches no GLB or scene runtime and renders no canvas. Exercise hidden, unlisted, disabled and aliased client records by discovery and guessed URLs, including linked repositories and media. Verify the lightweight catalog with JavaScript disabled.

Then test book → report → same marked page, history/reload, portrait citations after content promotion and withdrawal. Requalify stale portrait research/voice/provider caps under its existing handoff; set the required hard voice-budget backstop before release. Measure a physical phone and assistive-technology behavior separately from workstation emulation. Check asset cache headers, font/image loading, metadata/canonicals and the correct Vercel domain. Record the actual deployment ID and content revision; a successful build is not a release receipt.

## Withdrawal and rollback

Hiding either an approved project or its wrapper book withdraws its report from the normal projection; linked discovery and résumé links should disappear on the next read. Verify guessed URLs and portrait retrieval after withdrawal. Unlisting is not hiding: it intentionally retains direct access. Revert content through its revision snapshot, preserving audit history.

For code, restore the previous verified Vercel deployment or revert the scoped release commit, then recheck collection/asset compatibility. Reverting code does not undo database publication or remove publicly reachable bundled media. Withdraw or remove sensitive media explicitly if needed. Keep the previous source assets, page snapshots and recorded evidence until the replacement release is qualified.

## Start prompt

Read AGENTS.md, HANDOFF.md, docs/SHOWCASES_AND_2D_DELIVERY.md and this handoff. Review the local first edition with the owner, settle lineup/navigation and client/media disclosure, reconcile source drift, and prepare the exact audited content promotion and Vercel release. Preserve the 3D/portrait baseline and distinguish local proof from hosted proof. Do not treat unpublished draft files, successful tests or a build as already published content.
