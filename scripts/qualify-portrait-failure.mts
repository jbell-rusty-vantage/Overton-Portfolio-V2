// Live provider-failure qualification: the real GatewayAgent calls the real gateway endpoint
// with a deliberately invalid credential. Expect a rejected request, the reviewed-excerpt
// fallback, no retry and a $0 settlement. Uses an in-memory ledger (no paid inference occurs).
//   npx tsx scripts/qualify-portrait-failure.mts
import { randomUUID } from "node:crypto";
import { GatewayAgent } from "../lib/portrait/agent";
import { runTurn } from "../lib/portrait/conversation";
import { staticEvidence } from "../lib/portrait/evidence";
import { DeterministicProvider } from "../lib/portrait/provider";
import { Ledger, rehearsalLimits, type LedgerState } from "../lib/portrait/ledger";

const state: LedgerState = { version: 1, killed: false, turns: [] };
const ledger = new Ledger({ async update(fn) { return fn(state); } });
let calls = 0; const original = globalThis.fetch;
globalThis.fetch = (async (...args: Parameters<typeof fetch>) => { calls++; return original(...args); }) as typeof fetch;
const price = { model: "openai/gpt-6-luna", version: "failure-qualification", inputUsdPerMillion: 0.1, outputUsdPerMillion: 0.5, webSearchUsdPerCall: 0.01 };
const answer = await runTurn({ turnId: randomUUID(), question: "Were you on the Supreme Court?" }, {
  evidence: staticEvidence(true), volumes: [], provider: new DeterministicProvider(),
  agent: new GatewayAgent(price.model, "invalid-qualification-key", true), ledger,
  caps: { ...rehearsalLimits, turn: 50_000, day: 1_000_000, month: 5_000_000 }, price,
  session: "failure-qualification", network: "failure-qualification", signal: new AbortController().signal,
});
const charge = state.turns[0];
const pass = answer.mode === "fallback" && calls === 1 && charge?.status === "settled" && charge.actual === 0 && answer.citations.some(c => c.id === "overton-courts");
console.log(JSON.stringify({ pass, mode: answer.mode, notice: answer.notice, trace: answer.trace, providerCalls: calls, ledger: { status: charge?.status, actual: charge?.actual }, citations: answer.citations.map(c => c.id), text: answer.text.slice(0, 160) }, null, 1));
process.exit(pass ? 0 : 1);
