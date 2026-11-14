# Live portrait conversation · state and operations

## Where it stands · November 13, 2026

**Live, model-generated conversation is implemented, enabled locally and qualified on the real path.** The portrait in the existing panel answers with `openai/gpt-6-luna` through Vercel AI Gateway, using the existing `AI_GATEWAY_API_KEY`. It retrieves John's project material with application-run library tools and uses OpenAI's built-in `web_search` for history and current AI questions. Every turn is reserved, settled and capped in the durable `portrait_ledger`. The panel labels this truthfully at runtime ("Live replies · openai/gpt-6-luna via Vercel AI Gateway · checked against cited sources"). With paid mode off it says scripted.

It is **local only**: hidden preview, uncommitted, not deployed. The Vercel project has none of these settings. The owner authorized two things this session: the ledger-only migration on the configured Neon database (applied; `prisma migrate status` showed it as the only pending migration) and caps of **$0.05/turn, $1/day, $5/month**.

This supersedes the earlier November 13 correction, which recorded that replies were scripted and the paid adapter only selected source IDs. That ID-only selection adapter and the unmounted request scaffold (`gateway-setup.ts`) were removed.

## How a turn works

`app/api/portrait/route.ts` → `runTurn()` (`lib/portrait/conversation.ts`) → `GatewayAgent` (`lib/portrait/agent.ts`), behavior in `content/portrait/live-behavior.ts`.

1. **Authorize.** The route reprojects the authorized corpus (unchanged rules: admin preview sees reviewed cards and drafts; public sees published projections only).
2. **Reserve.** The worst case is reserved before dispatch: 3 calls × (32,000 input bytes + 6,000 hidden tool tokens) + 2 searches × 12,000 injected tokens, 3 × 1,000 output tokens (reasoning included), plus 2 × $0.01 search fees = **$0.0353**. It is computed from `lib/portrait/limits.ts`. `paidConfig` refuses a turn cap below it.
3. **Generate.** The agent calls the Responses API at `https://ai-gateway.vercel.sh/v1/responses`, pinned to the OpenAI route (`only:["openai"]`; Azure's search fee is higher), with `store:false`, low reasoning and strict JSON output `{text, citationIds, webSources, projectId}`.
   - **Tools:** `list_projects`, `search_library` and `read_section` run in the application over the already-authorized evidence only. `web_search` is provider-executed, low context, at most 2 per turn, and **withheld from any question about John** (`webAllowedFor`).
   - **Bounds:** at most 3 calls (the last has no tools), 4 library tool runs, a 20 s call timeout and a 45 s turn deadline. There are no retries, no model-supplied URLs fetched and no model routes.
4. **Validate.**
   - A citation ID the model was not shown this turn rejects the whole answer, and reviewed excerpts are shown instead.
   - Web sources must match this turn's search results.
   - Prose is stripped of markdown, links, unlisted URLs, domains, raw IDs and private-use citation markers.
   - The route re-checks every library citation and every project the model saw against a fresh projection after provider latency.
5. **Settle.** Each call settles at the gateway's reported `provider_metadata.gateway.cost` (it includes search fees), or else at an uncached upper bound from usage. A missing charge holds the reservation.
   - Rejected requests (400/401/403/404/413/422/429) settle at $0; 5xx, timeouts and malformed responses hold.
   - **Stop** dispatches nothing new but lets the in-flight call finish, so its real charge settles instead of being held.
   - A charge above its reservation still kills admission.
6. **Navigate.** Navigation remains application-owned: only an explicit "show/open/take…" request auto-opens, through the existing signed single-use proof. A model-named book is only offered as a button, and only when it is cited.
7. **Follow-ups.** The last two exchanges are AES-256-GCM sealed to the visitor's signed session and returned as an opaque token (`lib/portrait/memory.ts`). The browser holds it in memory only. It expires after 30 minutes and is dropped if any passage or project book it drew on is withdrawn. The server stores no chat.

The answer is buffered, validated and then sent through the existing NDJSON surface. It is **not** token streaming. Dynamic voice remains a separate later task.

## Configuration (local, server-only)

`.env.local` (git-ignored) holds `PORTRAIT_PAID_ENABLED=1`, `PORTRAIT_MODEL=openai/gpt-6-luna`, `PORTRAIT_PRICE_VERSION=vercel-gateway-openai-gpt-6-luna-2026-11-13`, input $0.10/M, output $0.50/M, `PORTRAIT_WEB_SEARCH_USD_PER_CALL=0.01`, the three caps and a generated `PORTRAIT_SESSION_SECRET`. The key stays in `.env`; it was never printed, copied or sent anywhere but the gateway. Prices are the gateway's OpenAI-route list prices checked November 13; re-check and bump the version when they change.

- **Pause everything:** `PORTRAIT_KILL_SWITCH=1`. Authored reflections remain.
- **Back to the free mock:** `PORTRAIT_PAID_ENABLED=0`.
- **Optional:** `PORTRAIT_NETWORK_DAY` (default 30).

## Evaluation and qualification (the feedback loop)

- `npm run portrait:live-server` starts an isolated loopback office on 3081 (build dir `.next-office/proof`, live settings passed through the process only, tool trace exposed). The owner's office is untouched.
- `npm run eval:portrait` runs `content/portrait/eval-fixtures.json` (23 cases, 25 turns) through the real route. It applies objective checks (citations, web use, navigation, forbidden text), grades each reply with an `openai/gpt-6.1-terra` judge (grounding, rubric, persona) and reconciles spend against the ledger. Reports go to `.local-library/portrait-eval/`. Re-run it after any change to `live-behavior.ts`; fix a rubric only when the expectation itself was wrong.
- `npm run qualify:portrait` runs the 15 adversarial/concurrency checks, a real-gateway failure (invalid key) and the 7-step browser proof.

**Results, November 13:**
- **Eval:** eight iterations moved from 13/25 to **25/25 passing and 25/25 grounded** on the final run (persona 4.36/5). The three runs before it scored 20–22/25, so expect occasional subtle attribution slips, such as citing a sibling passage for a detail. No run invented a project metric, client or deployment, leaked instructions or a key, web-searched John after the gate, or claimed to open a book.
- **Final run numbers:** visitor spend $0.0468 for 25 turns, exactly equal to the ledger's settled total, with nothing held. Median full answer 5.1 s, p95 8.2 s; first text equals full answer because delivery is buffered. Turns without a web search cost $0.0001–0.001; a search turn about $0.0107.
- **Adversarial and concurrency, 15/15:**
  - Forged citations, assistant history and the preview flag are rejected (400); cross-origin requests are refused (403).
  - Another session's or a forged context token is ignored, while the genuine token carries the follow-up.
  - Navigation: a different target with the same proof, or another session's proof, is refused (409); a valid proof is consumed once, then replay is refused.
  - A forged source inspection fails closed.
  - Stop settled its actual $0.000256.
  - Hosted Neon concurrency: 1 of 4 parallel same-session turns admitted, and 8 of 10 parallel sessions (the global cap).
- **Provider failure:** the real gateway returned 401; the reviewed-excerpt fallback was shown after one call, settled at $0.
- **Browser, 7/7, no page errors:** truthful label, open question, follow-up, sourced answer with inspected cards, "Show me Mission Control" opening the book through signed navigation, Back, and Stop. Screenshots are in `.local-library/portrait-eval/browser/`.
- **Quota exhaustion live:** the isolated server's 200-turn network bucket ran out mid-run and gave the allowance reply at $0 with no dispatch. The per-minute limit was seen in the browser; its message is now plain English.
- **Other checks:** 72 contracts (35 portrait), typecheck, full lint (one pre-existing warning elsewhere), `npm run build:local` and the 6 visitor journeys pass.
- **One live turn on the owner's office (3078)** with the final configuration: Knowledge Services, cited, signed navigation, $0.000336.

**Spend today:** 291 metered turns, $0.377 settled (largest turn $0.0208). One $0.0353 reservation is held from a Stop test run before the Stop fix (charge `…5189eb0e89e5`, 14:40 UTC). Evaluation judge calls (~$0.30) and probes are outside the visitor ledger. Reconcile the held charge only against confirmed gateway usage (dashboard or `GET /v1/generation`), inside a locked ledger transaction. Never clear the ledger to get past a cap.

## Spoken conversation (GPT-Live) · November 13, 2026

**The portrait now holds a spoken, two-way conversation, enabled locally.** "Speak with the Judge" (top of the panel) brings the visitor before the painting. The first press asks for microphone permission; after that you simply talk. The portrait answers aloud in the "cedar" voice, with his mouth driven by the live audio, and captions show both sides.

**How it works with Vercel serverless functions.** No function holds the audio.
- `POST /api/portrait/voice {kind:"start"}` (`app/api/portrait/voice/route.ts`) admits the visitor under the ledger and reserves the whole bounded session. It then mints a **single-use, 60-second** gateway client secret (`POST https://ai-gateway.vercel.sh/v1/realtime/client-secrets`, `routeKind:"live"`) and returns.
- The browser (`components/portrait/live-voice.ts`) opens `wss://ai-gateway.vercel.sh/v1/live/sessions` itself. It streams 24 kHz PCM16 microphone audio through an inline AudioWorklet and plays the reply through an AnalyserNode, whose loudness drives the portrait's jaw (`engine.speakLive`).
- GPT-Live (`openai/gpt-live-1`, full duplex, $0.05/min) uses **client delegation**. The voice model itself holds no facts (`voiceInstructions` in `lib/portrait/voice.ts`). For every factual question it emits `session.delegation.created`. The page then sends the visitor's utterance to the existing grounded `POST /api/portrait` turn with `spoken:true` (library tools, web search, citation checks, sealed follow-ups, per-turn metering) and returns the validated answer with `session.commentary.append` for the voice to speak.
- Sources and signed navigation work exactly as for typed questions: a spoken "show me Mission Control" opens the book.
- `{kind:"end"}` settles the session at the larger of the provider-reported `session.closed.usage.seconds` and the server's own elapsed time.

**Limits (owner-approved).** 3-minute sessions inside the shared **$1/day and $5/month** caps (the $0.05 per-turn cap applies to text turns). A session reserves $0.1625: 180 s plus 15 s close grace. One live voice session per visitor, 4 per visitor per day; delegated turns use the ordinary turn limits. The client warns the model 20 s before the bound and closes at it. A missing or impossible usage report holds the reservation. A real overrun past the reservation trips the kill switch, which happened once in qualification and was reconciled below.

**Configuration** (`.env.local`): `PORTRAIT_VOICE_ENABLED=1`, `PORTRAIT_VOICE_MODEL=openai/gpt-live-1`, `PORTRAIT_VOICE_PRICE_VERSION`, `PORTRAIT_VOICE_USD_PER_MINUTE=0.05`, `PORTRAIT_VOICE_MAX_SECONDS=180`, `PORTRAIT_VOICE_NAME=cedar`. Voice also requires live text mode. Set `PORTRAIT_VOICE_ENABLED=0` to turn voice off and keep typed conversation.

**Qualification, November 13** (`npm run qualify:portrait-voice`, `scripts/qualify-portrait-voice-browser.mjs`):
- **Real-path session in Node** (synthesized spoken questions): delegation matched expectations on 6 of 6 questions. Greeting and prompt injection were handled by voice alone, with the injection refused. The 4 knowledge questions were delegated, and the current-AI one used web search. A judge found the speech faithful to the grounded answer in 3 of 4 cases; the fourth flag was a wording nit. The run also caught three issues, now fixed:
  - questions bleeding together across turns;
  - continuous output audio being misread as speaking;
  - the harness not enforcing the time bound.
- **Browser, Chrome with a fake microphone, 6/6 twice, no page or console errors:**
  - The spoken "Please show me Mission Control" was delegated, grounded with 3 sources, and opened `#book/agentic-mission-control` through signed navigation, while the voice said "You will find the volume before you. Mission Control is still in development…".
  - Starting from the entrance, the visitor is brought straight before the painting (`#portrait`) with no recorded-welcome card. The jaw moved with the voice (peak 0.64–0.72) and was released at the end.
  - Screenshot: `.local-library/portrait-eval/voice-browser-portrait/speaking-face.png`.
- **Declined microphone:** a clear message, and nothing is reserved, because the microphone is requested before admission.
- **Contracts:** voice ledger coexistence, daily voice limit, turn-cap exemption, config fail-closed, settlement floor, token minting and navigation binding (76 total).
- **Latency:** session open 2.6–4.5 s; first spoken words about 3 s after a greeting. The "Permit me a moment with the shelves" filler comes while the grounded answer is fetched (5–9 s). The full reply follows.

**Spend and reconciliation.** Voice sessions on November 13 cost $0.38 in the ledger, against $0.353 in the gateway's own report (which also includes one probe outside the ledger), so the ledger reads conservatively high. Two charges were reconciled with `scripts/reconcile-portrait-ledger.mjs`, each with recorded evidence:
- a 270 s harness overrun, settled at the provider-reported $0.225, which also lifted the kill switch;
- an aborted browser run, settled at the $0.0158 delta from the gateway report.

`npm run portrait:ledger` lists unresolved charges next to the gateway's daily report per model, an independent check on what browsers report.

**Voice-specific limits not yet qualified.**
- The browser relays the provider's usage and chooses when to close; the server cannot cut a live socket. A tampered client could keep a session open past its bound. The ledger then under-counts until the gateway report reveals it, so set an **AI Gateway budget** as the hard backstop before any public release.
- Interruption (barge-in) relies on GPT-Live's full duplex; no explicit interruption event was observed to handle.
- Not yet tested: physical microphones and echo in a real room, mobile Safari, and the new `cedar` voice's fit for the Judge (owner review).
- Dynamic speech is separate from the 34 recorded custodian cues; those are unchanged.

## Not yet qualified

- **Deployment.** Remote visitors share one network bucket (30 turns/day for everyone) until a trusted platform-address adapter exists. Vercel needs its own env, secret and caps. Hosted latency and billing on Vercel are unmeasured.
- **Public visitors.** Non-admin sessions (published projection, no reviewed cards) were not exercised live; authorization is unchanged and covered by contracts.
- **Withdrawal and expiry on real data.** Withdrawal during a conversation and expired cards (they expire November 20 and December 13) are covered by contracts, not live runs on the owner's data.
- **Web grounding depth.** The judge sees only the title and URL of web results, not page text. Web claims are attributed and dated, but not entailment-checked.
- **Owner voice review.** The judge's persona score (4.36/5) is not a human review. Content-card refresh before release still applies.
