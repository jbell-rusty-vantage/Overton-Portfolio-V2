// Cross-pathway visitor proof. Called only from the disposable database rehearsal.
import { expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

class Visit {
  constructor(page) { this.page = page; }
  get canvas() { return this.page.getByLabel(/^The library at Travellers Rest,/); }
  get portrait() { return this.page.getByRole("complementary", { name: "Ask Judge Overton", exact: true }); }
  toolbar(title) { return this.page.getByRole("toolbar", { name: "Reading " + title, exact: true }); }
  report(title) { return this.page.getByRole("dialog", { name: title + " full report", exact: true }); }
  async ask(question) {
    await this.portrait.getByLabel("Your question").fill(question);
    const response = this.page.waitForResponse((r) => r.url().endsWith("/api/portrait") && r.request().postDataJSON()?.kind === "turn");
    await this.portrait.getByRole("button", { name: "Ask", exact: true }).click();
    const result = await response;
    if (!result.ok()) return undefined;
    const events = (await result.text()).trim().split("\n").map((line) => JSON.parse(line));
    return events.find((event) => event.type === "complete")?.answer;
  }
}

export async function qualifyVisitorJourney({ db, page: authenticated, browser, base }) {
  // Deliberately labeled fixtures, never imports into the owner's database.
  await db.exec(`
    INSERT INTO projects(id,slug,title,summary,body_blocks,display,updated_at)
    VALUES(gen_random_uuid(),'agent-knowledge-services','Knowledge Services',
      'Isolated proof: capture source material, check claims, retain supported evidence.',
      '[{"component":"Heading","props":{"text":"Architecture"}},{"component":"Prose","props":{"text":"The isolated fixture captures source material, checks claims against it and stores supported evidence. This is test data, not deployment evidence."}}]',
      'hidden',now()) ON CONFLICT (slug) DO NOTHING;
    INSERT INTO books(id,slug,title,entity_type,entity_id,display,updated_at)
    SELECT gen_random_uuid(),'agent-knowledge-services','Knowledge Services','project',id,'hidden',now()
    FROM projects WHERE slug='agent-knowledge-services' ON CONFLICT(slug) DO NOTHING;
  `);
  const dir = ".local-library/evidence/integrated-journey";
  await mkdir(dir, { recursive: true });
  const storageState = await authenticated.context().storageState();
  const results = [];
  for (const device of ["desktop", "phone-width"]) {
    const phone = device === "phone-width";
    const context = await browser.newContext({ baseURL: base, storageState,
      viewport: phone ? { width: 390, height: 844 } : { width: 1366, height: 860 },
      hasTouch: phone, isMobile: phone, reducedMotion: phone ? "reduce" : "no-preference" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const visit = new Visit(page);
    try {
      await page.goto("/admin/library/preview");
      await page.getByRole("link", { name: "Enter the library", exact: true }).first().click();
      await expect(visit.canvas).toHaveAttribute("data-scene", "ready", { timeout: 90000 });
      if (phone) {
        await page.getByRole("button", { name: "Directory", exact: true }).click();
        await page.getByRole("complementary", { name: "Directory", exact: true }).getByRole("button", { name: /Mission Control/ }).click();
      } else {
        await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "My portfolio", exact: true }).click();
        await page.getByRole("navigation", { name: /Within reach/ }).getByRole("button", { name: /Mission Control/ }).click();
      }
      const toolbar = visit.toolbar("Mission Control");
      await expect(toolbar).toBeVisible({ timeout: 45000 });
      await toolbar.getByRole("button", { name: "Next page", exact: true }).click();
      await expect.poll(() => new URL(page.url()).hash).toMatch(/#book\/agentic-mission-control\//);
      const marker = new URL(page.url()).hash;
      await toolbar.getByRole("button", { name: "Open full report", exact: true }).click();
      await expect(visit.report("Mission Control")).toBeVisible();
      await page.screenshot({ path: `${dir}/${device}-report.png` });
      await page.reload();
      await expect(visit.report("Mission Control")).toBeVisible({ timeout: 90000 });
      await page.keyboard.press("Escape");
      await expect(toolbar).toBeVisible({ timeout: 45000 });
      await expect.poll(() => new URL(page.url()).hash).toBe(marker);

      await page.getByRole("button", { name: "Ask Judge Overton", exact: true }).click();
      await expect(visit.portrait).toBeVisible();
      await expect(visit.portrait).toHaveCSS("background-color", "rgb(32, 38, 33)");
      const answer = await visit.ask("How does Knowledge Services check its sources?");
      expect(answer?.mode).toBe("mock");
      expect(answer?.costUsd).toBe(0);
      expect(answer?.citations.some((citation) => citation.id.startsWith("project:agent-knowledge-services:"))).toBe(true);
      // A question offers guidance without moving the book.
      expect(new URL(page.url()).hash).toBe(marker);
      await visit.portrait.getByRole("button", { name: /^Inspect \d+ sources?$/ }).click();
      await expect(visit.portrait.getByRole("region", { name: "Verified sources" })).toContainText("supported evidence");
      // Closed details omit the body from innerText, so read its textContent.
      const timing = (await visit.portrait.locator("details.portrait-meta").textContent())?.match(/first text ([\d.]+)s \/ complete ([\d.]+)s/);
      expect(timing, "browser-measured portrait delivery diagnostics").toBeTruthy();
      await expect(visit.portrait.getByRole("button", { name: "Close conversation" })).toBeInViewport();
      await page.screenshot({ path: `${dir}/${device}-sources.png` });
      const shown = await visit.ask("Show me Knowledge Services");
      expect(shown?.navigationRequested).toBe(true);
      await expect(visit.toolbar("Knowledge Services")).toBeVisible({ timeout: 45000 });
      await expect(visit.portrait.getByRole("status")).toContainText("Opened Knowledge Services");
      await page.goBack();
      await expect(toolbar).toBeVisible({ timeout: 45000 });
      await expect.poll(() => new URL(page.url()).hash).toBe(marker);
      await page.screenshot({ path: `${dir}/${device}-returned.png` });
      if (phone) {
        const guidedReport = await visit.ask("Show me Knowledge Services report");
        expect(guidedReport?.navigation?.mode).toBe("report");
        await expect(visit.report("Knowledge Services")).toBeVisible({ timeout: 45000 });
        await page.screenshot({ path: dir + "/phone-guided-report.png" });
        await page.goBack();
        await expect(toolbar).toBeVisible({ timeout: 45000 });
        await expect.poll(() => new URL(page.url()).hash).toBe(marker);
      }
      if (!phone) {
        // Hold a genuine server-authorized action response at the transport boundary.
        // Stop must prevent the delayed acknowledgment from moving the visitor.
        let pendingAction = false, releaseAction;
        const gate = new Promise(resolve => { releaseAction = resolve; });
        const delayedNavigation = async route => {
          if (route.request().postDataJSON()?.kind !== "navigate") return route.continue();
          const response = await route.fetch();
          expect(response.ok()).toBe(true);
          pendingAction = true;
          await gate;
          await route.fulfill({ response }).catch(() => {}); // Stop aborts this browser request.
        };
        await context.route("**/api/portrait", delayedNavigation);
        try {
          await visit.ask("Show me Knowledge Services");
          await expect.poll(() => pendingAction).toBe(true);
          await visit.portrait.getByRole("button", { name: "Stop", exact: true }).click();
          releaseAction();
          await expect(visit.portrait.getByRole("status")).toContainText("Stopped");
          await expect.poll(() => new URL(page.url()).hash).toBe(marker);
          await page.screenshot({ path: dir + "/desktop-stopped-guidance.png" });
        } finally { releaseAction(); await context.unroute("**/api/portrait", delayedNavigation); }
        const quota = await visit.ask("Who is competing to build these models?");
        expect(quota.text).toContain("reached its allowance");
        await page.screenshot({ path: dir + "/desktop-quota.png" });
        // Browser delivery failure fixture; actual provider failures are separately
        // exercised against the server ledger and adapter in tests/portrait.test.ts.
        const failTurn = async route => {
          if (route.request().postDataJSON()?.kind === "turn")
            await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Conversation temporarily unavailable. The books and authored tour remain available." }) });
          else await route.continue();
        };
        await context.route("**/api/portrait", failTurn);
        await visit.ask("Tell me about the library");
        await expect(visit.portrait.getByRole("status")).toContainText("temporarily unavailable");
        await visit.portrait.getByText("Authored reflections · always available", { exact: true }).click();
        await expect(visit.portrait.getByText("Original dramatic writing, awaiting voice review.", { exact: false })).toBeVisible();
        await page.screenshot({ path: dir + "/desktop-transport-failure.png" });
        await context.unroute("**/api/portrait", failTurn);
      }
      expect(errors).toEqual([]);
      results.push({ device, reportReloadAndReturn: marker, citedTarget: shown.navigation.targetId,
        mockModel: answer.model, providerCostUsd: answer.costUsd, serverFirstTextMs: answer.firstTextMs,
        serverFullAnswerMs: answer.fullAnswerMs, browserFirstTextSeconds: Number(timing[1]), browserFullAnswerSeconds: Number(timing[2]),
        guidedReportAndBack: phone, delayedGuidanceStopAndQuota: !phone, errors });
    } finally { await context.close(); }
  }
  await writeFile(`${dir}/results.json`, JSON.stringify(results, null, 2));
  console.log("PASS: integrated entrance, book, report/reload/same page, cited mock portrait, guided book and Back on desktop and phone width", results);
}
