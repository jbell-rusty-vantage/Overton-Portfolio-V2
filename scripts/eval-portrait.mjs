// Live portrait evaluation: the feedback loop for prompt and agent changes.
// Drives the real /api/portrait route of a running office (scripts/portrait-live-server.mjs)
// with content/portrait/eval-fixtures.json, applies objective checks, asks a judge model to
// grade grounding/rubric/persona, and reconciles visitor-turn spend against portrait_ledger.
//
//   node scripts/eval-portrait.mjs [--base http://127.0.0.1:3081] [--only id,id] [--no-judge] [--concurrency 3]
//
// Spends real money: visitor turns are metered by the shared ledger and its caps; judge
// calls are reported separately. Report: .local-library/portrait-eval/<timestamp>.json
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";

for (const f of [".env.local", ".env"]) try { process.loadEnvFile(f); } catch { /* optional */ }
const arg = (name, fallback) => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : fallback; };
const base = arg("base", "http://127.0.0.1:3081"), only = arg("only", "")?.split(",").filter(Boolean) ?? [];
const judgeOn = !process.argv.includes("--no-judge"), concurrency = Number(arg("concurrency", "3"));
// A stronger judge than the portrait model keeps the feedback signal from echoing its errors.
const JUDGE_MODEL = arg("judge", "openai/gpt-6.1-terra");
const fixtures = JSON.parse(await readFile("content/portrait/eval-fixtures.json", "utf8")).cases.filter(c => !only.length || only.includes(c.id));
const started = new Date();

async function turn(jar, body) {
  const t0 = performance.now();
  const response = await fetch(base + "/api/portrait", { method: "POST", headers: { "Content-Type": "application/json", Origin: base, ...(jar.cookie ? { Cookie: jar.cookie } : {}) }, body: JSON.stringify(body) });
  const set = response.headers.get("set-cookie"); if (set) jar.cookie = set.split(";")[0];
  if (!response.ok) return { error: `${response.status} ${await response.text()}`, ms: performance.now() - t0 };
  const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = "", first, answer;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true });
    let end; while ((end = buffer.indexOf("\n")) >= 0) { const event = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1); if (event.type === "text") first ??= performance.now() - t0; else answer = event.answer; }
  }
  return { answer, firstMs: first, fullMs: performance.now() - t0 };
}
function checks(t, expect, result) {
  const a = result.answer, fails = [];
  if (!a) return ["no answer: " + (result.error ?? "stream ended")];
  if (a.mode !== "live") fails.push(`mode ${a.mode}${a.notice ? " (" + a.notice + ")" : ""}`);
  const ids = a.citations.map(c => c.id), searched = (a.trace ?? []).some(x => x.startsWith("web_search")) || a.citations.some(c => c.claimKind === "web-search-result");
  if (expect.web === true && !searched) fails.push("expected web search");
  if (expect.web === false && searched) fails.push("used web search");
  if (expect.cite && !ids.some(id => new RegExp(expect.cite, "i").test(id))) fails.push(`no citation matching ${expect.cite} (got ${ids.join(", ") || "none"})`);
  for (const re of expect.citeAll ?? []) if (!ids.some(id => new RegExp(re, "i").test(id))) fails.push(`missing citation ${re}`);
  for (const re of expect.match ?? []) if (!new RegExp(re, "i").test(a.text)) fails.push(`text lacks /${re}/`);
  for (const re of expect.notMatch ?? []) if (new RegExp(re, "i").test(a.text)) fails.push(`text matches forbidden /${re}/`);
  if (expect.maxWords && a.text.split(/\s+/).length > expect.maxWords) fails.push(`${a.text.split(/\s+/).length} words > ${expect.maxWords}`);
  if (expect.nav) {
    if (!!a.navigationRequested !== expect.nav.requested) fails.push(`navigationRequested ${a.navigationRequested}`);
    if (expect.nav.target && !new RegExp(expect.nav.target, "i").test(a.navigation?.targetId ?? "")) fails.push(`navigation target ${a.navigation?.targetId ?? "none"}`);
    if (expect.nav.requested && !a.navigationProof) fails.push("no signed navigation proof");
  }
  if (/\*\*|^#+\s|\]\(http/m.test(a.text)) fails.push("markdown in text");
  return fails;
}
const judgeSystem = `You grade one reply from an AI portrait of the historical Judge John Overton (1766-1833) who hosts the software portfolio of his living descendant John Overton Bell. You receive the visitor question, any earlier exchange, the reply, the sources the reply cited (library passages with full text; live web results with title and URL only) and a rubric.
Background facts the portrait is given and may state without a citation: it is an imagined, AI-created portrait of Judge John Overton (1766-1833) of Travellers Rest, Nashville; the portfolio library is presented as his library at Travellers Rest; John Overton Bell is his descendant, a living software engineer whose project books fill this library; the judge died in 1833 and did not know modern technology.
Citations are attached separately as the sources list; the reply text itself should contain no inline citation markers or links. Live web results come with title and URL only, because their page content is not available to you: treat a claim attributed to a listed web result as supported unless it contradicts that title/URL or is implausible for it, and require time-sensitive web claims to be dated. Library passages come with full text and must actually support the claims drawn from them. Statements about what the library does or does not contain, and widely known general dates used only as context (for example when a famous person held office), are acceptable without a citation when correct.
Judge strictly:
- grounded: true only if every factual claim about John's projects or the historical record is supported by a cited library passage (or, for history/current events, attributed to a cited web result), and nothing contradicts or overstates the sources (no invented metrics, clients, deployment, quotations, memories or dates). Imagined opinion that is clearly framed as such is not a factual claim. Greetings with no factual claims are grounded.
- rubric: true only if the reply meets every requirement of the rubric. The rubric never overrides the background facts above, and offering to discuss modern AI is expected behavior.
- persona: 1-5 for a warm, restrained, plain-spoken period voice that answers the question directly and concisely (5 = excellent).
- issues: short list of concrete problems ("" if none).
Return JSON only.`;
let judgeMicros = 0;
async function judge(c, i, result, earlier) {
  const a = result.answer; if (!a || !judgeOn) return undefined;
  const sources = a.citations.map(s => s.claimKind === "web-search-result" ? { kind: "web", title: s.title, url: s.sourceUrlOrInternalRef } : { kind: "library", id: s.id, title: s.title, claimKind: s.claimKind, checkedAt: s.checkedAt, text: s.text });
  const body = { model: JUDGE_MODEL, store: false, max_output_tokens: 2000, reasoning: { effort: "medium" }, providerOptions: { gateway: { only: ["openai"] } },
    text: { format: { type: "json_schema", name: "grade", strict: true, schema: { type: "object", additionalProperties: false, required: ["grounded", "rubric", "persona", "issues"], properties: { grounded: { type: "boolean" }, rubric: { type: "boolean" }, persona: { type: "integer" }, issues: { type: "string" } } } } },
    input: [{ role: "system", content: judgeSystem }, { role: "user", content: JSON.stringify({ question: c.turns[i].q, earlier, reply: a.text, sources, rubric: c.turns[i].rubric }) }] };
  const r = await fetch("https://ai-gateway.vercel.sh/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json(); judgeMicros += Math.ceil(Number(j?.provider_metadata?.gateway?.cost ?? 0) * 1e6);
  try { return JSON.parse(j.output.find(o => o.type === "message").content[0].text); } catch { return { grounded: false, rubric: false, persona: 0, issues: "judge failed: " + JSON.stringify(j).slice(0, 200) }; }
}
async function runCase(c) {
  const jar = {}, out = []; let context, contextId, earlier = null;
  for (let i = 0; i < c.turns.length; i++) {
    const t = c.turns[i], result = await turn(jar, { kind: "turn", turnId: randomUUID(), question: t.q, ...(context ? { context } : {}), ...(contextId ? { contextId } : {}) });
    const a = result.answer; context = a?.context; contextId = a?.navigation?.targetId ?? contextId;
    const fails = checks(t, t.expect ?? {}, result), grade = await judge(c, i, result, earlier);
    if (grade && !grade.grounded) fails.push("judge: not grounded");
    if (grade && !grade.rubric) fails.push("judge: rubric unmet");
    out.push({ q: t.q, pass: !fails.length, fails, grade, text: a?.text, citations: a?.citations?.map(x => x.claimKind === "web-search-result" ? "web:" + x.sourceUrlOrInternalRef : x.id), navigation: a?.navigation ? { targetId: a.navigation.targetId, requested: a.navigationRequested } : undefined,
      trace: a?.trace, mode: a?.mode, model: a?.model, costUsd: a?.costUsd, firstMs: Math.round(result.firstMs ?? 0), fullMs: Math.round(result.fullMs ?? 0), error: result.error });
    earlier = { question: t.q, reply: a?.text };
    const status = fails.length ? "FAIL" : "pass";
    console.log(`${status} ${c.id}#${i + 1} ${(result.fullMs / 1000).toFixed(1)}s $${a?.costUsd ?? "?"} [${(a?.trace ?? []).join(" | ")}]${fails.length ? "\n     - " + fails.join("\n     - ") : ""}${grade?.issues ? "\n     judge: " + grade.issues : ""}`);
  }
  return { id: c.id, turns: out };
}
const results = [], queue = [...fixtures];
await Promise.all(Array.from({ length: concurrency }, async () => { while (queue.length) results.push(await runCase(queue.shift())); }));
results.sort((a, b) => fixtures.findIndex(f => f.id === a.id) - fixtures.findIndex(f => f.id === b.id));
const turns = results.flatMap(r => r.turns), pass = turns.filter(t => t.pass).length;
const costs = turns.map(t => t.costUsd).filter(x => typeof x === "number"), lat = turns.map(t => t.fullMs).sort((a, b) => a - b);
const visitorUsd = costs.reduce((s, x) => s + x, 0);
// Reconcile with the durable ledger: every settled or held turn admitted since the run began.
let ledger;
try {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL }); await client.connect();
  const { rows } = await client.query("select state from portrait_ledger where id = 1"); await client.end();
  const recent = rows[0].state.turns.filter(t => t.at >= started.getTime() - 1000 && t.priceVersion !== "zero-cost-mock-v1");
  ledger = { turns: recent.length, settled: recent.filter(t => t.status === "settled").length, held: recent.filter(t => t.status !== "settled").length,
    settledUsd: recent.reduce((s, t) => s + (t.actual ?? 0), 0) / 1e6, heldReservedUsd: recent.filter(t => t.status !== "settled").reduce((s, t) => s + t.reserved, 0) / 1e6, killed: rows[0].state.killed };
} catch (error) { ledger = { error: String(error).slice(0, 160) }; }
const summary = { at: started.toISOString(), base, model: turns.find(t => t.model)?.model, judge: judgeOn ? JUDGE_MODEL : null, cases: results.length, turns: turns.length, pass,
  grounded: turns.filter(t => t.grade?.grounded).length, persona: +(turns.reduce((s, t) => s + (t.grade?.persona ?? 0), 0) / Math.max(1, turns.filter(t => t.grade).length)).toFixed(2),
  webSearchTurns: turns.filter(t => (t.trace ?? []).some(x => x.startsWith("web_search"))).length,
  visitorUsd: +visitorUsd.toFixed(6), judgeUsd: judgeMicros / 1e6, medianMs: lat[Math.floor(lat.length / 2)], p95Ms: lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))],
  medianFirstMs: turns.map(t => t.firstMs).sort((a, b) => a - b)[Math.floor(turns.length / 2)], ledger };
await mkdir(".local-library/portrait-eval", { recursive: true });
const file = `.local-library/portrait-eval/${started.toISOString().replace(/[:.]/g, "-")}.json`;
await writeFile(file, JSON.stringify({ summary, results }, null, 1));
console.log("\n" + JSON.stringify(summary, null, 1) + "\nreport: " + file);
