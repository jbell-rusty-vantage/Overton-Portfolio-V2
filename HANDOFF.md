# Production release — November 13, 2026

The first edition is deployed and its hosted visitor checks pass. [Portfolio](https://overton-portfolio-v2.vercel.app/) · [Travellers Rest](https://overton-portfolio-v2.vercel.app/library) · [Private dashboard](https://overton-portfolio-v2.vercel.app/admin).

Deployed source `34af904f6242a2e9ad388651dcb38e1160a84f9e`, deployment `dpl_3VDUeWwEv9eQkQgrPdhGM7x3jwRp`. Exactly six studies and the reviewed edition-two estate are published through audited, drift-checked operations. [Release report, measurements, receipts and tested rollback/withdrawal](docs/releases/2026-11-13/README.md). Production and Preview use isolated databases. The owner's password change is complete; temporary verification access is revoked.

Plain `/library` opens Travellers Rest. Old `?view=world` links deliberately preserve the old hall. Live text stays within $0.05/turn, $1/day and $5/month; authored narration works. Live voice is disabled until a provider/server hard termination bound is verified. Phone measurements are emulation; the ten-cycle JavaScript heap trend has not fully plateaued, although GPU counts are stable and exit cleanup passes.

Preserve `.local-library/release` private baselines, promotion plan and preexisting-work archive for rollback. No broad seed, content reset or push to `main`. The historical records below are superseded by this release report. The evidence/CI follow-up installs the runner's missing FFmpeg dependency; it changes no deployed application code.

---

# Handoff — The Library

## Current goal: route separation, optimization and actual deployment · November 13

The owner now wants a clear public/private URL split, a final clean-code and performance pass including asset ingestion/delivery and the renderer, and **actual deployment**. Start with [the inspected execution brief and session prompt](docs/DEPLOYMENT_EXECUTION_BRIEF.md). It supplies a prioritized backlog, verified Vercel target, database/content/asset differences, route contract and release checks. This supersedes the earlier stopping point of deployment readiness.

**Confirmed homepage decision:** `/` is the 2D portfolio; `/library` is the optional estate/3D visit; `/admin` is private management. The owner selected this explicitly. Do not reopen that choice in the next session.

The planning inspection made no application or database changes. It confirmed that deploying code alone is insufficient: the six studies are still staged, the estate importer has 22 pending media records and changed high/low scene pointers, and the hosted portrait configuration is absent from the environment listing. Remove the legacy automatic database wipe from the build path before release. The brief distinguishes confirmed issues from rendering improvements still requiring measurement.

## Completed local milestone: first edition ready for review · November 13

The designed 2D portfolio and six substantive case studies are implemented locally. [Review Selected Work](http://127.0.0.1:3078/admin/library/preview?portfolio=1), then the [delivery/evidence record](docs/SHOWCASES_AND_2D_DELIVERY.md). The next outcome is **final organization and deployment readiness**: [start here](docs/FINAL_ORGANIZATION_AND_DEPLOYMENT.md).

The front door now offers Browse portfolio; `/projects` is the 2D entry with a first-level résumé link and shared project reports. Vantage, GoWipe, Overtech, Mission Control, AI Engineer and the Knowledge Services companion have source-grounded tasks, decisions and explicit qualification limits. New public-site screenshots include blank-contact quote steps and a matching GoWipe guest cart. The same staged writing feeds the 3D books, with stable citation/bookmark keys. Current project source and remote differences, all fourteen books' disposition and exact promotion/withdrawal steps are documented.

Thirteen focused browser checks passed on desktop and emulated phone, including hidden direct URLs, no scene loading on the 2D journey, résumé/PDF, media, all fourteen report layouts, focus/Escape and all six revised books returning from their reports to the marked page at both widths. Typecheck, lint (one existing warning), content contracts and the migration-free production build pass. Final physical-book audit and final evidence are in the delivery record. Phone qualification is emulation, not a physical device.

Writing and artwork remain local draft files, applied only to authorized admin volumes; PostgreSQL content and publication are unchanged. Nothing was committed, pushed or deployed. Public `/projects` correctly withholds the hidden studies. The current bound Vercel target is `overton-portfolio-v2`, with Git origin `jbell-rusty-vantage/Overton-Portfolio-V2`; older target names below are historical. Preserve all prior uncommitted 3D, portrait, résumé and asset work.

## Prior assignment: project showcases and the 2D portfolio · November 13

The owner approved the résumé and wants the next session run with **GPT-6 Astra**. The next work is to inspect his local and remote projects, produce substantive case studies with real walkthroughs, and build a polished portfolio visitors can use without entering the 3D world. Start with the [showcase and 2D brief](docs/SHOWCASES_AND_2D_NEXT.md), which includes the source inventory, résumé placement proposal, acceptance checks, and a paste-ready prompt. That session ends with a new handoff for final organization and deployment readiness.

**Travellers Rest history direction.** Keep Judge John Overton’s story brief in the 2D portfolio and give it an artifact-led sequence in the 3D library. The [researched exhibit brief](docs/OVERTON_HISTORY.md) follows the judge from his Nashville law practice through the plantation, wealth, and Jackson’s campaign, then makes a short turn to his son, Hood’s headquarters, and Confederate defeat. End with emancipation in 1865. The [new local study images and source log](assets/travellers-rest/archive/history-research/README.md) are ready for exhibit authoring. Visitor implementation and preview review remain open.

## Accepted résumé · November 13

The local portfolio links to [the web résumé](http://127.0.0.1:3078/resume) from the estate navigation, footer and text catalog. The [download](http://127.0.0.1:3078/john-overton-bell-resume.pdf) is two letter pages: client work on page one, AI products and infrastructure on page two, with updated skills, the current GitHub account and the TripleTen credential. The web page and PDF use `content/resume.json`; regenerate with `python scripts/build-resume.py` (ReportLab). For the new 2D entry, add **Résumé** next to **Selected Work** and use the existing page as the destination.

The revised résumé removes Daryl Davis, links both Vantage sites, and includes the corrected job history and the AccuTitle / AccuAir engagement. The profile covers web apps, PWAs, mobile apps, and the servers, workers, and agent systems behind them. Overtech Digital Services currently shows a launch placeholder. The research agent status page responds. The repository projects link to their code. The TripleTen transcript stays out of the public site. The earlier untracked PDF was preserved in `.local-library/resume-archive/`.

The [estate draft](http://127.0.0.1:3078/admin/library/preview#cabinet) remains the place to review unpublished books. This résumé pass does not publish those books or deploy the portfolio.

## Owner's book-first correction · November 13

The preceding 3D goal was reliable, readable project books first, followed by replacing the computer with period paper and exposing all soccer highlights. That correction is implemented and locally qualified: opaque enlarged native pages, ordered page ranges through the real end, guarded animated turns and viewport-aware print metrics; a Blender walnut/laid-paper viewing folio replaces the computer; a dedicated collection plays all nine soccer clips.

Follow-up correction: the owner's Mission Control opening on page 17 was reproduced exactly (expected page 1, received 17). `World.select` was silently restoring the saved bookmark on every pickup. Fresh shelf/Within reach/directory selections now start at page 1; only the explicit **Return to my place** control supplies a bookmark. New desktop and emulated-phone regressions pass through reading ahead, shelving, reopening, reload and directory selection; explicit resume and the existing report-return check also pass. This reopening case was missed by the earlier page-traversal audit.

Proof: animated traversal of all fourteen real draft books on desktop and emulated phone (334 pages; no missing, clipped, cropped or lost native surfaces), nine book browser scenarios, five report checks including return to the marked page, all nine soccer clips playing at both widths with history/reload/isolation, native full screen and keyboard ownership. Both new kit tiers validate and their six contracts pass. Typecheck, lint (no errors; unrelated existing warnings), 68 contracts and the migration-free production build pass. [Full change/evidence record](docs/BOOKS_AND_VIEWING_FOLIO.md) · [Books](http://127.0.0.1:3078/admin/library/preview#cabinet) · [Soccer highlights](http://127.0.0.1:3078/admin/library/preview#screen/soccer).

Changes are in the working tree and local preview; nothing was committed, pushed, imported into the owner database, published or deployed. Physical-phone qualification and production release remain outside this local correction. Preserve the source `.blend`, scoped `replace_study.py`, generated kit files and current cabinet plates together. The exact earlier intermittent smear was not reproduced before editing; stable native reading was directly checked on every audited final page.

## Live portrait conversation · November 13

**The portrait now holds a real, model-generated conversation, enabled locally.** It uses `openai/gpt-6-luna` through Vercel AI Gateway (the existing `AI_GATEWAY_API_KEY`), application-run library tools over the authorized project corpus, and OpenAI's built-in web search for history and current AI (never for John himself). Every turn is metered in the durable `portrait_ledger` within the owner-approved caps of $0.05/turn, $1/day and $5/month.

The owner authorized the ledger-only migration on the configured Neon database; it was applied and was the only pending migration. Live configuration is in the git-ignored `.env.local`. Nothing was committed, pushed, deployed or published, and the preview stays hidden.

Qualified on the real path:
- **Evaluation:** an LLM-judged fixture loop reached 25/25 passing and grounded on its final run (20–22/25 on the runs before it).
- **Adversarial and concurrency:** 15/15 live checks pass, including hosted Neon concurrency.
- **Failure and browser:** a real gateway failure falls back to reviewed excerpts at $0, and the 7-step browser proof passes with Back and Stop.
- **Repository checks:** 72 contracts, typecheck, lint, the local build and the visitor journeys pass.

Still open: deployment (remote visitors would share one 30-turn daily bucket), live public-visitor and withdrawal runs, web-content grounding depth, owner voice review, and one $0.0353 test reservation held for reconciliation.

**Voice, same day:** "Speak with the Judge" now holds a spoken, two-way conversation through GPT-Live (`openai/gpt-live-1`, Vercel AI Gateway). The visitor is brought before the painting, and the portrait's mouth follows the voice. Every fact it speaks comes through the same grounded, cited, metered text agent via client delegation. A spoken "show me" opens books. Voice sessions are 3 minutes inside the shared $1/day and $5/month caps. A live browser run with a fake microphone passed 6/6, twice. Before public release, set an AI Gateway budget as a hard backstop, since the browser holds the voice socket.

**Read [PORTRAIT_LIVE_NEXT.md](docs/PORTRAIT_LIVE_NEXT.md)** for how a turn works, operations, the eval loop and the evidence. The scripted-mode statements in the record below predate this and are superseded for the portrait.

## Current three-pathway implementation · November 12–13, 2026

What remains between this private draft and release is owner content/voice review, authorized media/schema imports, live-provider/hosted-database qualification and physical-device checks. The complete private visitor journey is implemented, integrated and locally qualified: entrance → continuous library → book → full-screen report → same marked page → cited portrait answer → requested project → Back. Desktop performance is close to the 60 fps target, not locked to it: walking/document/film 60, speaking 58.6 and real page turns 59.4 fps, all with p95 16.8 ms. No production-release or live-model claim is made.

All 52 browser scenarios have passing evidence (51 in the final broad run plus the corrected gesture rerun); 64 contracts, typecheck, lint and the migration-free production build pass. Final production-mode desktop/phone journeys, authorization, source withdrawal, navigation Stop, quota and failure fallback pass on disposable data. The actual office's uninterrupted [recorded visit](docs/travellers-rest-review/continuous-visit-integrated.mp4) passed with no page errors. [The session record](docs/SESSION_INTEGRATION.md) holds exact commands, latency/cost, measurements and remaining limits. Do not use the older status tables below as the current implementation state.

The owner chose to **retain the portico and the existing 3.19 m ceiling**. Everything remains uncommitted and hidden. No owner database import, commit, push, deployment, publication or paid-provider configuration occurred. The new portrait ledger migration is additive and awaits an authorized owner-database migration; only disposable database tests are permitted in this session. Use `npm run build:local`, since ordinary `build` applies migrations.

Implemented: shared reports and marked-page history, fourteen staged posters and curated imagery, complete page audit, survey corrections and Blender moving parts, finished optional room bake, constrained reconstructed stair landing, atmosphere controls, live entrance, shared header and interruptible authored tour. The integrated portrait uses approved projections, inspectable citations, signed navigation, durable rate/spend accounting and a clearly labeled free mock. New authored reflections are text only. Live model behavior and physical-phone performance remain separate qualifications.

Before release: review posters/reports, narration/voice and uncertain transcripts; authorize asset imports and the additive ledger migration; select/configure a live model with explicit price version and turn/day/month caps, then qualify live quality, latency, billing and hosted PostgreSQL concurrency. Physical phone/gamepad and WebGPU remain unmeasured. The reviewed AI/Harvey/access cards were checked November 12 and expire November 20 UTC; infrastructure cards expire December 13 UTC. Refresh the time-sensitive evidence before release. Missing restoration drawings, unavailable source captures and the office no-JavaScript fallback limit remain documented. The portico and ceiling decisions are settled and must not be reopened without a new owner request.

## Prior-session history

The following planning and second-pass notes are retained as history. Their “not started” and “waiting” statements are superseded by the current session record and pathway handoffs.

**Latest owner expansion, November 12, 2026 — conversational portrait.** The next goal now also includes an imagined Judge John Overton who reflects on modern AI and Harvey, answers from approved project evidence, and guides visitors to the relevant books with bounded token spending. [NEXT_SESSION.md](docs/NEXT_SESSION.md) is now the authoritative **three-pathway** orchestration brief: A showcases, B the world, and [C the portrait](docs/PATHWAY_PORTRAIT.md), with [researched foundations and original narration drafts](docs/PORTRAIT_RESEARCH_AND_VOICE.md). This planning pass closes the voice/research and implementation brief only: live conversation, retrieval, navigation tools, dynamic speech and visitor-chat budget enforcement still need implementation and qualification. Existing narration and runtime behavior were not changed. Older two-pathway descriptions below describe the prior handoff; preserve this expanded goal when regenerating it.

**Owner goal and where it stands, November 12, 2026 (end of the second pass).** The goal is a portfolio whose entrance introduces John Overton Bell and leads into one continuous 3D visit to his ancestor Judge John Overton’s library at Travellers Rest: the portrait speaks, the project books leave their shelves and open into readable pages, authentic letters are lifted and read, and the grounds outside are planted and peopled. That exists as a **private draft** and is the default in the preview. The owner’s second-pass requests (book pages and handling, movement, grounds, Blender assets, the survey record, the introduction, and the flow between entrance and world) are implemented and tested. What still stands between this and the goal: the room has not been corrected to the survey record, the Blender book, letter and drawers do not yet drive the moving parts, desktop frame rate is below target, and no physical phone has been measured. Nothing was published, deployed or committed. The owner is moving to Codex and has added content work: **completely new posters for every project** (he does not like the generic covers) and curation of what is inside the books. He also needs each book to open into a full-screen report that reads like a high-quality web report. The next session is therefore **two pathways under one main agent**: **[main agent brief](docs/NEXT_SESSION.md)** · **[A · project showcases](docs/PATHWAY_SHOWCASES.md)** · **[B · the 3D world](docs/TRAVELLERS_REST_NEXT.md)** · [poster brief](docs/PROJECT_POSTERS.md) · [Owner review, evidence and measurements](docs/TRAVELLERS_REST_CONTINUOUS.md) · [Engine reference](docs/WORLD_ENGINE.md) · [Survey comparison](docs/TRAVELLERS_REST_SURVEY.md) · [Private preview](http://127.0.0.1:3078/admin/library/preview) · [Continuous walkthrough](docs/travellers-rest-review/continuous-visit.mp4)

| Part of the goal | State | Proof |
| --- | --- | --- |
| Entrance introduces the owner and flows into the world | Implemented and tested: first-person introduction; **Enter the library** walks in, other entries arrive directly; the entrance picture dissolves into the room; **Return to where I was**; shared destinations in the world’s top bar | Browser journeys; stills in the review folder |
| One world from the entrance through reading, inspection and playback | Implemented and integrated: a single canvas, camera and scene; the address is the room state | Browser journeys on desktop and an emulated phone |
| The custodian speaks in his frame | Implemented: 34 voiced cues with mouth, gaze and captions on the audio clock; he calls John his descendant | Browser journeys; every cue checked as spoken to its last word |
| Project volumes as physical, readable books | Handling implemented and tested for all fourteen: click to turn, drag a leaf, carry the book back to its slot; shelf hover and "OUT" slip. **Page quality not accepted** by the owner. Fixed since his review: washed-out words on a turning leaf, and film previews covered by browser controls. Open: writing that stops part-way down a page (layout), screenshots that end mid-content and diagrams too small to read (content) | Page audit in the review folder; `npm run test:books` |
| Full-screen project report from a book | **Not started; pathway A.** Today a book ends with a link that leaves the world for the plain reading page | Pathway A brief |
| Project posters and book content | **Not started; pathway A.** All fourteen covers are one emblem template. The 3D book now shows the whole poster as its front board, so new posters need no code. Screenshots that end mid-content, film preview frames and unreadable diagrams are listed for replacement | Poster and curation brief; contact sheet of current covers |
| Movement | Implemented and tested: eased walking and look, mouse look, thumb-stick, sliding collision, routes round furniture, floor-click travel, ground-floor plan, walkable lawn | `npm run test:navigation` |
| Grounds | Implemented: trees, hedged garden, drive and oval, fences, sky, wind, eight present-day visitors and a guide. Positions are invented and not yet moved to the survey record | Stills in the review folder |
| Blender assets | Pipeline established: 57-piece kit with build script, packer and contract tests; furniture, mantel, sashes, door and chest carcass live in the room. Book, letter and drawer pieces built and tested, not yet driving motion | `npm test`; kit renders in the review folder |
| Survey record | Retrieved and compared; corrections listed in order. **Not applied** | Survey comparison |
| Letters and objects | Implemented in the first pass and unchanged: the 1832 letter complete, three more Overton letters, map, invitation, Earl’s Jackson, *Murfree v. Leeper*, museum records | Browser journeys |
| Data and release path | Imported as edition 2, hidden; second pass added the rebuilt shell, kit, timeline and two re-voiced cues; release and withdrawal rehearsed on disposable data | Database readback; isolated rehearsal |
| Performance | Measured in the production build: desktop 54.2 fps walking in, 53.2 with the portrait speaking, 44.8 through leaf turns, 47.3 with the letter magnified and 57.5 with the film playing; emulated phone 58.6 fps walking in, 60 with the portrait speaking, 59.2 through leaf turns, 58.4 with the letter magnified and 60 with the film playing. Below the 60 fps desktop target: walking in at 54.2 fps, portrait speaking at 53.2 fps, leaf turns at 44.8 fps, letter magnified at 47.3 fps, film at 57.5 fps. The phone figures are emulation on this workstation’s GPU | Raw measurements in the review folder |

**Not done, stated plainly.** The book pages do not yet meet the owner’s standard (see pathway A, section 3). The room corrections from the survey are not made, so both doors, the stair, the sashes and the chimney breast still contradict the record. The garden stands in front of the house where the record puts lawn. The Blender moving parts are not wired in. No physical phone was measured. WebGPU was not measured. No Jackson-to-Overton letter was added; two candidates are identified. Shelf plaques cannot be read from standing distance. **Within reach** follows the last named stop instead of the visitor’s position. Five superseded delivery files remain in the store and database as unused rows. The work is uncommitted in the working tree.

**Owner decisions waiting.** Keep or remove the 1954 portico. Which ceiling height to trust. Approve the introduction’s wording, the custodian’s words and voice, and the 1827 and 1812 transcriptions. Whether to delete the superseded delivery files. When to release and deploy.

**Next session starts here.** Give the main agent [its brief](docs/NEXT_SESSION.md), which ends with a prompt to paste. It hands [pathway A](docs/PATHWAY_SHOWCASES.md) and [pathway B](docs/TRAVELLERS_REST_NEXT.md) to one agent each as whole tasks, reported once at the end, and integrates. The earlier guided edition and its evidence remain in [the first delivery notes](docs/TRAVELLERS_REST_DELIVERY.md); its pages are still the plain view and the fallback when 3D cannot start.

## Earlier prototype brief

The original approval request covered [the playable Travellers Rest prototype](http://127.0.0.1:3077/dev/travellers-rest?study=1) and [the implementation and seed brief](docs/TRAVELLERS_REST.md). The house and its surveyed southwest library took priority over the November 10 Octagon brief and the subsequent two-world comparison. The following notes describe the prototype at approval.

**The owner has chosen the custodian. The archival portrait of Judge John Overton must come alive and guide visitors through the library.** The likeness is the Tennessee Virtual Archive photograph of Ralph E. W. Earl’s 1817 painting. Start with the still in its frame and let Overton direct the visitor to the two Tennessee Reports visible in his portrait. The playable library shows the still. Use the [curator’s asset guide](assets/travellers-rest/archive/README.md) and [full performance and seed instructions](docs/TRAVELLERS_REST.md) for the next session.

The local study includes two editable Blender collections, two validated GLBs, archival photographs and a floor plan, a four-leaf reader, a two-screen work desk and an optional match screening inside the contemporary family cabinet. Desktop and emulated-phone browser journeys cover the route, return to the marked leaf, direct 3D selection and media isolation. The presentation is a staged visit. Continuous interior travel, the custodian performance, live seeding, release and physical-phone qualification belong to the full implementation. The existing public entrance still uses the original hall.

## Earlier library baseline

The following November 8 notes describe the original hall and its initial starter seed. The November 10 content review in `docs/OCTAGON_BRIEF.md` subsequently recorded fourteen hidden project volumes. Reconcile the current database before applying the new program. The [iteration guide](docs/ITERATING_ON_THE_LIBRARY.md) covers the existing editor, scene contracts and publication checks.

## Start here

| Open | What you're looking at |
| --- | --- |
| [Local office](http://127.0.0.1:3078/admin) | No sign-in on this computer. Projects, media, books, shelves and pages write to the configured PostgreSQL database. Restart with `npm run admin:local`. |
| [Draft preview](http://127.0.0.1:3078/admin/library/preview) / [visitor portfolio](http://127.0.0.1:3078/) | Preview includes drafts. The visitor view applies publication rules. Publish the project and its book to release a linked volume. |
| [Starter review](http://127.0.0.1:3077/) / [sample stacks](http://127.0.0.1:3077/samples?view=world&zone=stacks) | Separate review server: two exact hidden starter drafts on the entrance, eight fictional projects in the sample area. Restart with `npm run preview:library`. |
| [Asset workshop](assets/library/README.md) | Editable Blender source, procedural rebuild, anchors, optimization and validation. |
| [Preview runbook](docs/LOCAL_PREVIEW.md) | Startup, local proof, seeded IDs, performance evidence and limitations. |

The confirmed starter projects are **Mission Control** and **agent-knowledge-services**. Both remain hidden in the configured portfolio DB. They each have a book, an authored architecture page and a physical slot; see the [seed inventory](docs/LOCAL_PREVIEW.md#starter-collection). Editing shelf titles in the office updates the visitor’s labels and physical signs without changing URLs. Finished images from ChatGPT Images can be registered from `public/library/artwork/` and assigned to individual books. No new owner content was seeded or published during this refinement.

**Verified November 8, 2026:** the local no-login dashboard loaded both existing projects; the Knowledge Services draft reader loaded in the office and returned 404 on the ordinary text catalog. Both the sessionless office and signed-in production-mode workflow registered cover art, created and placed a book, renamed its shelf, published it and withdrew it using an isolated database. Typecheck, lint, the migration-free production build, contract tests and the eleven visitor browser journeys passed. See [verification commands](docs/LOCAL_PREVIEW.md#verification).

## Work that belongs in later sessions

- Ask which room, collection, physical asset or project is being changed; use the existing anchor slug and current DB title. Keep original image sources separate from the public delivery files.
- Prepare future bulk imports against the [intake guide](docs/LIBRARY_INTAKE.md). The current starter seed is scoped to the two verified repositories; it is not a general-purpose importer. A new shelf anchor or schema change is different from renaming an existing shelf.
- The guide today is deterministic. Conversational agents, webhook receivers, live push updates and vector retrieval are future features. Production publication/deployment, live Blob credentials, third-party embeds and physical phone performance were not qualified by the local browser tests.

The three existing migrations were previously confirmed on the configured database. Schema and operations are described in [Data model](docs/DATA_MODEL.md), [Migration status](docs/MIGRATION_STATUS.md) and [Operations](docs/OPERATIONS.md). No new migration is needed for this refinement. Use `npm run build:local` when validating locally; the deployment build can migrate the target DB. Visibility, client redaction, audit and revision rules still apply in the no-login local editor.
