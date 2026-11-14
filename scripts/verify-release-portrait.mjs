import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

const base = process.env.RELEASE_BASE_URL;
if (!base) throw Error("Select the hosted deployment explicitly");
const label = process.argv.includes("--provider-failure") ? "provider-failure" : process.argv.includes("--withdrawn") ? "withdrawn" : process.argv.includes("--exhausted") ? "exhausted" : "published";
const browser = await chromium.launch({ channel: "chrome" });
const result = { base, label, at: new Date().toISOString(), turns: [] };
try {
  const context = await browser.newContext({ baseURL: base, ...(process.env.RELEASE_STORAGE_STATE ? { storageState: process.env.RELEASE_STORAGE_STATE } : {}) });
  const capabilities = await context.request.get("/api/portrait", { headers: { Origin: base } });
  result.capability = await capabilities.json();
  expect(result.capability.live).toBe(true); expect(result.capability.voice).toBeNull();
  async function turn(question, turnId = randomUUID()) {
    const started = performance.now();
    const response = await context.request.post("/api/portrait", { data: { kind: "turn", turnId, question }, headers: { Origin: base }, timeout: 60000 });
    expect(response.status()).toBe(200);
    const answer = (await response.text()).trim().split("\n").map(JSON.parse).find(e => e.type === "complete")?.answer;
    expect(answer).toBeTruthy();
    result.turns.push({ question, latencyMs: performance.now() - started, answer });
    return answer;
  }
  if (label === "provider-failure") {
    const a = await turn("What work did John do for GoWipe? Cite the project.");
    expect(a.mode).toBe("fallback"); expect(a.text.length).toBeGreaterThan(0);
  } else if (label === "exhausted") {
    const a = await turn("What work did John do for GoWipe?");
    expect(a.text).toMatch(/allowance|rest|limit|later/i); expect(a.mode).toBe("fallback");
  } else if (label === "withdrawn") {
    const a = await turn("What work did John do for GoWipe? Cite the project.");
    expect(JSON.stringify(a.citations)).not.toMatch(/gowipe|vantage-movers|agentic-mission-control/i);
  } else {
    const id = randomUUID(), question = "What work did John do for GoWipe? Cite the case study.";
    const a = await turn(question, id);
    expect(a.mode).toBe("live"); expect(a.citations.length).toBeGreaterThan(0);
    expect(JSON.stringify(a.citations)).toMatch(/gowipe/i);
    const duplicate = await turn(question, id);
    expect(duplicate.mode).toBe("fallback");
    const hidden = await turn("Describe the unpublished Daryl Davis project implementation.");
    expect(JSON.stringify(hidden.citations)).not.toMatch(/volume:daryl-davis|projects\/daryl-davis/i);
  }
  result.passed = true;
  console.log(JSON.stringify({ base, label, passed: true, turns: result.turns.map(t => ({ mode: t.answer.mode, citations: t.answer.citations.length, latencyMs: t.latencyMs })) }));
} finally {
  await writeFile(`.local-library/release/portrait-${label}.json`, JSON.stringify(result, null, 2));
  await browser.close();
}
