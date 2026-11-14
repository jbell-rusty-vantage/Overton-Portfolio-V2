# Next session · brief for the main agent

**Current owner direction, November 13:** Run the next session with GPT-6 Astra to build evidence-backed project showcases and the 2D portfolio. Use the [current brief and start prompt](SHOWCASES_AND_2D_NEXT.md). Finish with a handoff for final organization and deployment readiness.

The three-pathway coordination instructions below are historical. For current book and portrait status, see [HANDOFF.md](../HANDOFF.md) and [the live portrait record](PORTRAIT_LIVE_NEXT.md).

**Implementation session, November 12–13:** the three allowed Astra/High workers completed their pathways and the coordinator integrated report/history, portrait/navigation/media, schema and landing controls. The owner chose to retain the portico and 3.19 m ceiling. The instructions below remain the orchestration and acceptance contract; their planning-time “not implemented” statements are historical. Use [HANDOFF](../HANDOFF.md) and [the current integration record](SESSION_INTEGRATION.md) for observed verification and remaining release work. No owner-database imports, publication, deployment or commits are authorized. Paid visitor-model usage remains disabled.

**Final local qualification:** 64 contracts and all 52 browser scenarios have passing evidence; typecheck, lint, migration-free build, isolated production release/authorization/portrait journeys, read-only import plan and continuous actual-office recording passed. Desktop measured 58.6–60 fps across the five scenarios, with 59.4 fps real page turns; this is not locked-60 or physical-device qualification. The portrait is `portrait-extractive-mock-v1`, $0 provider cost; live quality/billing remain unqualified. Review the current handoff before further work. The portico/ceiling decisions are settled; do not ask them again. Next release work requires the owner's content/voice decisions and explicit authorization for imports, migration and release. Preserve the existing hidden/uncommitted state.

**Owner's goal, expanded November 12, 2026.** A portfolio whose entrance introduces John Overton Bell and leads into one continuous 3D visit to his ancestor's library at Travellers Rest, where each project opens into a full-screen web report and Judge John Overton's portrait is an engaging, knowledgeable host. The portrait should reflect on modern AI, the frontier-model competition, infrastructure and Harvey; answer grounded questions about John's work; and take visitors to the relevant book. It is a private, hidden draft today. [Where it stands](../HANDOFF.md) · [What was built and measured](TRAVELLERS_REST_CONTINUOUS.md)

**The work is three pathways.** Preserve A and B below and add **[C · the conversational portrait](PATHWAY_PORTRAIT.md)**. Give each to one agent as a whole, meaningful task. C owns its new conversation/retrieval modules, isolated UI, tests and draft content; the main agent integrates it into the world after A and B finish. This keeps C out of the reader/engine overlap. The research and original sample performances are ready in **[PORTRAIT_RESEARCH_AND_VOICE.md](PORTRAIT_RESEARCH_AND_VOICE.md)**. This brief supersedes older references to only two pathways.

**What this planning pass closes.** Historical grounding, a voice direction, researched AI briefing seeds, retrieval and navigation contracts, cost controls and acceptance scenarios are specified. Live LLM conversation, RAG, dynamic speech and visitor-chat spending enforcement are **not implemented or qualified by this pass**. Existing narration remains intact. GPT-6 Astra is the owner's requested next implementation agent; that does not require using an expensive frontier model for every visitor turn.

## Team contract · GPT-6 Astra, High

**Owner's explicit instruction:** use capable agents for complete, naturally independent pieces of work, with tightly bounded spawning. This contract overrides any older permission to subdivide work or spawn descendants in linked briefs.

- One coordinating **GPT-6 Astra agent at High reasoning**, plus **at most three worker agents total for the session**, also **GPT-6 Astra at High reasoning**. Maximum four agents including the coordinator; maximum delegation depth one.
- Only the coordinator may spawn. Each worker is a leaf: **no subagents, no delegation, no new chats**, even after a slot becomes free. No extra review, research, testing or microtask agents. Reuse the original workers for corrections; the coordinator handles remaining work if a worker cannot continue.
- Intended assignments are A showcases, B world, C portrait, each from its complete brief below. Before launch, verify their writable files and integration contracts against the actual checkout. Use fewer workers or sequence dependent work if the boundaries cannot be kept independent; three is a ceiling, not a target for busywork.
- With the available collaboration tool, explicitly request `model: "gpt-6-astra"`, `reasoning_effort: "high"`, `fork_turns: "none"`. A fresh worker needs a self-contained assignment: absolute repository path, its entire brief by file reference, the main brief's team/ownership rules, applicable AGENTS.md files, the owner's outcome, current shared-file contract and relevant decisions. Do not assume it inherited this conversation. If the requested configuration cannot be selected, report that limitation rather than silently substituting a different model or reasoning effort.
- Give each worker its whole outcome once. It owns implementation and focused verification. It returns one completion report or a concrete blocker; it need not request routine approvals. The coordinator gives the owner concise milestone updates, uses completion notifications/bounded waits, and avoids repeated status polling or drip-feeding tasks.
- Freeze the shared interfaces before launch: A supplies stable report section IDs and report integration instructions; B preserves or documents route/engine/audio changes; C supplies a mountable conversation panel and validated navigation intents. The coordinator owns shared integration and full-system qualification after the workers return.
- Do not create user-owned Codex chats or worktrees merely to represent these workers. Use subagents in this session and the existing suitable checkout; preserve the owner's uncommitted work.

| | Pathway A · project showcases | Pathway B · the 3D world |
| --- | --- | --- |
| Brief | [PATHWAY_SHOWCASES.md](PATHWAY_SHOWCASES.md) | [TRAVELLERS_REST_NEXT.md](TRAVELLERS_REST_NEXT.md) |
| Outcome | From a book, one action opens a full-screen report that reads like a high-quality web report and returns to the same page; new posters; clean pages; whole pictures; the same showcase in the plain view and on every card | A house that matches the survey record, moving parts on the Blender kit, baked light, grounds in their recorded places, position-aware movement, a walk back out, 60 fps on the desktop |
| Owns | The reader and page layout, `components/library`, `lib/library`, `app/projects`, `app/books`, artwork, project and book content through the office | `components/estate/world/engine`, controls, `World.tsx`, the entrance flow, `assets/travellers-rest`, pack, kit and voice scripts |
| Content standard | Decent showcases that prove the machinery. The owner will write the real reports later; do not rewrite his words | Interpretation is labelled; the record decides where the two disagree |
| Supporting documents | [PROJECT_POSTERS.md](PROJECT_POSTERS.md), [ITERATING_ON_THE_LIBRARY.md](ITERATING_ON_THE_LIBRARY.md), [ADMIN.md](ADMIN.md) | [WORLD_ENGINE.md](WORLD_ENGINE.md), [TRAVELLERS_REST_SURVEY.md](TRAVELLERS_REST_SURVEY.md), the kit and grounds READMEs |

**The seams.** The reader (A) and engine (B) already meet at a few calls: the reader asks for a volume, says when the DOM page is showing, and drives turns and holds; the engine paints leaves from print instructions and draws the cover from an image address. A specifies the report route and pause/resume integration; **the main agent applies the shared edits to `lib/estate/world.ts` and `World.tsx` after B finishes**. This overrides A's older permission to edit those files concurrently. C returns typed, validated navigation intents and a mountable conversation panel; it does not manipulate cameras or write those shared files. The main agent wires intents into the same route/history controls as visitor clicks, and integrates speech with the existing media arbiter. C consumes the authorized collection and stable content IDs; it does not rewrite A's project reports or B's archival assets.

## C · the portrait's experience

- **Meet the judge:** preserve the existing introduction and add optional short authored reflections: the quill and the model, Harvey and legal judgment, the four laboratories, the physical cost of computation, and John's opportunity as a builder. Label them as newly written interpretation spoken by a synthetic voice.
- **Ask the judge:** stream a short answer, show its sources, retain bounded conversational context, and invite a useful follow-up. Distinguish historical evidence, the owner's approved information, dated industry news and the portrait's imagined opinions.
- **Let him show you:** questions about Mission Control, Knowledge Services and GoWipe resolve to actual catalog IDs. “Show me” opens the right book/report; unsolicited recommendations offer a button. Preserve Back, the marked page, keyboard access and reduced motion.
- **Keep hospitality affordable:** prerecorded introductions need no live LLM call. Live turns require durable server-side limits, bounded tool calls and context, a shared cost reservation ledger and a global stop. Exhaustion leaves the books and authored tour available. See C for provisional rehearsal limits; no unapproved production spending default.
- **Keep the evidence current:** modern facts come from dated, reviewed briefing cards with citations and expiry. No visitor-triggered open-ended web research in the first release. A stale brief is identified as stale, not narrated as today's news.

## What you do

1. **Read** [HANDOFF.md](../HANDOFF.md), all three pathway briefs and [the portrait research/voice pack](PORTRAIT_RESEARCH_AND_VOICE.md). Open the preview and use it for five minutes: `http://127.0.0.1:3078/admin/library/preview` (start it with `npm run admin:local` if it is not running). Open a book, turn pages, follow "Full reading page", meet the portrait and walk outside. Inspect current auth/public projections before choosing the conversation transport. Read the relevant bundled Next.js guides before writing framework code.
2. **Ask the owner the two questions that block pathway B before you launch it**, because they are his and waiting on them mid-task is the kind of check-in he wants to avoid: keep or remove the portico (built 1954, gone by 2021); and which ceiling height to trust (the model's 3.19 m or the survey's roughly 2.92 m, low confidence). If he is not available, tell B to leave both as they are.
3. **Launch the independent pathways under the team contract above:** at most one worker each for A, B and C, all GPT-6 Astra at High reasoning. Hand over each complete brief with the self-contained assignment context. Workers must not spawn, even if capacity later becomes available. Sequence any work that turns out to depend on another pathway. Each reports at completion or a genuine blocker; do not interrupt them with extra tasks.
4. **While they work, do not edit their files.** Check that the office and preview stay up, and prepare the shared integration checklist. Keep provider credentials server-side. Missing credentials or an unset spend cap must still allow C to deliver a deterministic mock-backed demonstration and its tests; label that clearly, then separately qualify a bounded live run when configured. Do not let live-API access block A or B.
5. **When all three report, integrate.** Read their reports and diffs; apply the shared route, report, portrait-panel and audio edits yourself. Then, on the merged tree: `npm run typecheck; npm run lint; npm test; npm run build:local; npm run test:browser; npm run test:admin -- --profile-estate`. Add C's retrieval, authorization, concurrent-budget and provider-contract checks. Run `node --env-file=.env --env-file=.env.local scripts/seed-estate.mjs` for the read-only import plan; `--apply` uploads to the owner's Blob store and writes his database, so run it only when he says to. Record the walkthrough (`node scripts/record-estate.mjs`). Walk book → report → same page and question → cited answer → correct book → Back, on desktop and at phone width. Test quota exhaustion and provider failure. A mock pass is not a live-model qualification.
6. **Report to the owner** in the form `C:/Users/Pinda/.codex/AGENTS.md` asks for: the outcome still needed first, then what is implemented, tested, integrated and unqualified for each pathway, measurements and his decisions. Include retrieval evidence, current briefing dates, actual model IDs, observed cost/latency and remaining release requirements. Update [HANDOFF.md](../HANDOFF.md) and these briefs. If using `python .local-library/write-handoff.py`, update its text first and preserve this expanded three-pathway goal rather than restoring the obsolete two-pathway opening.

## Rules for every agent

- Whole tasks, separate files, one report at the end. Workers may plan their own steps but may not spawn or delegate them. The three-worker lifetime cap and depth-one limit apply throughout the session.
- Stay inside the files your brief gives you. If you need something across the seam, provide a proposed contract or integration patch for the coordinator; do not edit another worker's files concurrently.
- Nothing is committed, pushed, deployed, released or imported by a pathway agent. Everything stays a hidden draft.
- All three pathways share one working tree and one office server on port 3078. Do not restart it; a broken build breaks the other agents' view, so keep the typecheck clean as you go. Run only your own browser specs while working (`npx playwright test <spec> --output .local-library/pw-<name>`); the full suite is the main agent's at the end. C owns new tests; existing shared tests and package scripts are integrated by the main agent.
- If the owner would rather have each pathway isolated, he can approve a baseline commit on a branch and a git worktree per pathway; without that, the shared tree with file ownership is what worked in the last session.

## Environment

- `AGENTS.md` in the repository and `C:/Users/Pinda/.codex/AGENTS.md` apply. The Next.js here is newer than most training data: read `node_modules/next/dist/docs/` before using a framework API.
- Everything is uncommitted on `main`. Commit only when the owner asks, on a branch, and never with `git add -A`: the working tree holds private files.
- Bash heredocs containing an odd number of apostrophes fail on this machine; write a script file and run it.
- Blender 5.2.2: `C:\Users\Pinda\AppData\Local\Programs\Blender\blender-5.2.2-windows-x64\blender.exe`. Headless Chrome uses the real GPU.
- To see any state without clicking through it: `node scripts/look-estate.mjs <url> <width> <height> "<json steps>"` (steps are listed at the top of that file). Running it during a browser test or a measurement disturbs both.
- The speech model can drop a final sentence; `scripts/voice-estate.py` checks every cue was spoken to the end.

## Paste to start

```text
Work in C:\Users\Pinda\Overton-Portfolio-local as the coordinating GPT-6 Astra agent at High reasoning.

Read C:\Users\Pinda\.codex\AGENTS.md, the repository AGENTS.md, HANDOFF.md, and docs/NEXT_SESSION.md first. Follow NEXT_SESSION.md as the authoritative orchestration brief, including its team contract and shared-file ownership overrides.

Complete the portfolio work in these three whole outcomes:
A. Project showcases: docs/PATHWAY_SHOWCASES.md
B. Continuous 3D world: docs/TRAVELLERS_REST_NEXT.md
C. Conversational John Overton portrait: docs/PATHWAY_PORTRAIT.md, supported by docs/PORTRAIT_RESEARCH_AND_VOICE.md

You may spawn at most THREE worker agents TOTAL during this session, all GPT-6 Astra at High reasoning. Only you may spawn. Workers must not spawn, delegate or create chats. No additional reviewer, research or microtask agents. Reuse the same workers for corrections; handle remaining work yourself. This overrides any older subdivision permission in linked documents.

Confirm file boundaries and shared interfaces before launching. Give each independent pathway to one worker as a complete task, with its full brief and self-contained repository context. Use fewer workers or sequence dependent work when needed. Each worker owns implementation and focused verification, reporting on completion or a genuine blocker. Do not drip-feed tasks or repeatedly poll for status. Keep me informed at meaningful milestones.

You own the shared route, report, portrait, audio and schema/dependency integration after workers finish, followed by end-to-end qualification. Deliver the complete visitor journey: enter the library, open a book and full-screen report, return to the same page, ask the portrait a question, inspect its sources, and ask it to show the relevant project. Include historically grounded narration, approved project retrieval, dated AI/Harvey/infrastructure briefings, validated navigation, and enforced server-side rate and spending limits.

Ask about the existing portico and ceiling decisions without blocking unrelated work; leave those two features unchanged if unanswered. Preserve existing uncommitted work. Keep everything a hidden draft. Do not commit, push, deploy, publish, apply imports to the owner's database, or enable uncapped paid usage. Missing live-provider configuration must not prevent a clearly labeled mock-backed implementation and tests; distinguish that from live qualification.

Run the verification in NEXT_SESSION.md, including the portrait's authorization, retrieval, navigation and concurrent-budget tests. Update HANDOFF.md and the relevant briefs. Finish with what still stands between the portfolio and the goal, then distinguish what is implemented, tested, integrated and qualified, with evidence and remaining owner decisions. Continue through integration and verification; worker completion alone is not task completion.
```
