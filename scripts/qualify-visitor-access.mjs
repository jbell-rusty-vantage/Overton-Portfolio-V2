// Production-mode authorization proof, using only the disposable rehearsal DB.
import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

async function post(context, base, data) {
  return context.request.post(base + "/api/portrait", { data, headers: { Origin: base } });
}
async function turn(context, base, question, extra = {}) {
  const response = await post(context, base, { kind: "turn", turnId: randomUUID(), question, ...extra });
  expect(response.ok()).toBe(true);
  const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
  const answer = events.find((event) => event.type === "complete")?.answer;
  expect(answer).toBeTruthy();
  return answer;
}

export async function qualifyVisitorAccess({ db, page, browser, base }) {
  const anonymous = await browser.newContext({ baseURL: base });
  const admin = await browser.newContext({ baseURL: base, storageState: await page.context().storageState() });
  const results = {};
  try {
    // Existing fixture was created in test-library-admin.mjs, never the owner DB.
    await db.query("UPDATE projects SET summary='DIRECT_SCOPE_ONLY: this evidence is available through its explicit direct address.' WHERE slug='unlisted-case'");
    const hidden = await turn(anonymous, base, "How does Knowledge Services check its sources?");
    expect(JSON.stringify(hidden)).not.toContain("Isolated proof");
    expect(hidden.citations).toEqual([]);
    expect(hidden.navigation).toBeUndefined();
    const unlisted = await turn(anonymous, base, "Tell me about Direct only");
    expect(JSON.stringify(unlisted)).not.toContain("DIRECT_SCOPE_ONLY");
    const direct = await turn(anonymous, base, "Tell me about Direct only", { scene: { volumeId: "unlisted-case" } });
    expect(JSON.stringify(direct)).toContain("DIRECT_SCOPE_ONLY");
    const exhausted = await turn(anonymous, base, "Tell me about Direct only");
    expect(exhausted.text).toContain("reached its allowance");
    expect(exhausted.resetAt).toBeTruthy();
    results.publicHiddenAndUnlisted = true;
    results.enforcedMinuteQuota = true;

    const forged = await post(anonymous, base, { kind: "turn", turnId: randomUUID(), question: "Show me Knowledge Services", preview: true });
    expect(forged.status()).toBe(400);
    const privateSource = await post(anonymous, base, { kind: "sources", ids: ["overton-courts"] });
    expect(privateSource.ok()).toBe(false);
    expect(await privateSource.text()).not.toContain("Supreme Court of Errors");
    results.forgedPreviewAndPrivateCitation = true;

    const authorized = await turn(admin, base, "Show me Knowledge Services");
    expect(authorized.citations.length).toBeGreaterThan(0);
    expect(authorized.navigation.targetId).toBe("agent-knowledge-services");
    const inspected = await post(admin, base, { kind: "sources", ids: authorized.citations.map((source) => source.id) });
    expect(inspected.ok()).toBe(true);
    await db.query("UPDATE projects SET deleted_at=now() WHERE slug='agent-knowledge-services'");
    const withdrawnSources = await post(admin, base, { kind: "sources", ids: authorized.citations.map((source) => source.id) });
    expect(withdrawnSources.ok()).toBe(false);
    expect(await withdrawnSources.text()).not.toContain("supported evidence");
    const withdrawnAction = await post(admin, base, { kind: "navigate", intent: authorized.navigation, proof: authorized.navigationProof });
    expect(withdrawnAction.status()).toBe(409);
    const followup = await turn(admin, base, "Show its architecture", { contextId: "agent-knowledge-services" });
    expect(JSON.stringify(followup)).not.toContain("supported evidence");
    expect(followup.navigation).toBeUndefined();
    results.withdrawnSourcesContextAndNavigation = true;
    await db.query("UPDATE projects SET deleted_at=null WHERE slug='agent-knowledge-services'");

    const history = await turn(admin, base, "Were you on the U.S. Supreme Court?");
    expect(history.citations.some((citation) => citation.id === "overton-courts")).toBe(true);
    await db.query("UPDATE admin_sessions SET expires_at=now()-interval '1 minute'");
    const stale = await post(admin, base, { kind: "sources", ids: history.citations.map((source) => source.id) });
    expect(stale.ok()).toBe(false);
    expect(await stale.text()).not.toContain("Supreme Court of Errors");
    results.expiredAdminSession = true;

    // Actual existing publication/redaction fixtures must stay out of every public answer.
    const clean = await post(anonymous, base, { kind: "sources", ids: ["project:alias-case:overview"] });
    expect(await clean.text()).not.toMatch(/PRIVATE_|secret\.invalid/);
    results.projectRedaction = true;
    const dir = ".local-library/evidence/integrated-journey";
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/authorization.json`, JSON.stringify(results, null, 2));
    console.log("PASS: production portrait authorization, direct unlisted scope, withdrawal, stale session, redaction and enforced quota", results);
  } finally {
    await anonymous.close();
    await admin.close();
  }
}
