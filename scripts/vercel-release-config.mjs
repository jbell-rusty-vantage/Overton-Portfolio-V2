// Uses the existing CLI session; credentials travel only over stdin or the SDK.
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { parse } from "dotenv";
import { loadLocalEnvironment, validatedTarget } from "./database-target.mjs";
loadLocalEnvironment();
const projectId = "prj_VIqs9sg7nSQAVliEFhSuzpt3L4qv";
const cli = process.env.APPDATA + "/npm/node_modules/vercel/dist/vc.js";
function api(endpoint, method = "GET", body) {
  const result = spawnSync(process.execPath, [cli, "api", endpoint, "--scope", "overtons-projects", "--method", method, ...(body ? ["--input", "-"] : [])], { input: body ? JSON.stringify(body) : undefined, encoding: "utf8", maxBuffer: 8e6 });
  if (result.status) {
    let detail = result.stderr + result.stdout;
    const values = JSON.stringify(body ?? {}).match(/"[^"\n]{12,}"/g) ?? [];
    for (const value of values) detail = detail.replaceAll(JSON.parse(value), "[redacted]");
    throw Error(`Vercel ${method} ${endpoint} failed (${result.status}): ${detail.slice(0, 1800)}`);
  }
  return JSON.parse(result.stdout);
}
if (!process.argv.includes("--apply")) throw Error("Use --apply to configure the explicitly authorized existing project");
const production = validatedTarget();
const previewEnv = parse(await readFile(".local-library/release/preview.env"));
const preview = validatedTarget(previewEnv, true);
if (production.fingerprint === preview.fingerprint) throw Error("Preview must be isolated");
let gateway;
try { gateway = JSON.parse(await readFile(".local-library/release/portrait-key.private.json", "utf8")); }
catch (e) {
  if (e.code !== "ENOENT") throw e;
  gateway = api("/api-keys", "POST", { purpose: "ai-gateway", projectId, name: "Portfolio portrait release", aiGatewayQuota: { limitAmount: 1, refreshPeriod: "daily", includeByokInQuota: true, alertThresholds: [75, 100] } });
  await writeFile(".local-library/release/portrait-key.private.json", JSON.stringify(gateway));
}
// Shape is checked without printing the secret response.
const key = gateway.apiKeyString || gateway.apiKey?.value || gateway.key || gateway.token;
if (typeof key !== "string") throw Error("Inspect API key response field names locally; secret shape was not recognized: " + Object.keys(gateway).join(", "));
const budget = api("/ai-gateway/budgets", "PUT", { scopeType: "project", projectId, limitAmount: 5, refreshPeriod: "monthly", includeByokInQuota: true, justification: "Owner-approved portrait cap, independent gateway enforcement." });
if (budget.limitAmount !== 5 || !budget.active) throw Error("Gateway budget not active");
const shared = {
  LIBRARY_CONTENT_SOURCE: "database", LIBRARY_PUBLIC_ORIGIN: "https://overton-portfolio-v2.vercel.app",
  AI_GATEWAY_API_KEY: key, PORTRAIT_PAID_ENABLED: "1", PORTRAIT_KILL_SWITCH: "0",
  PORTRAIT_MODEL: "openai/gpt-6-luna", PORTRAIT_PRICE_VERSION: "vercel-gateway-openai-gpt-6-luna-2026-11-13",
  PORTRAIT_INPUT_USD_PER_MILLION: "0.10", PORTRAIT_OUTPUT_USD_PER_MILLION: "0.50", PORTRAIT_WEB_SEARCH_USD_PER_CALL: "0.01",
  PORTRAIT_USD_PER_TURN: "0.05", PORTRAIT_USD_PER_DAY: "1", PORTRAIT_USD_PER_MONTH: "5", PORTRAIT_NETWORK_DAY: "30",
  PORTRAIT_VOICE_ENABLED: "0", PORTRAIT_VOICE_MODEL: "openai/gpt-live-1", PORTRAIT_VOICE_PRICE_VERSION: "vercel-gateway-openai-gpt-live-1-2026-11-13",
  PORTRAIT_VOICE_USD_PER_MINUTE: "0.05", PORTRAIT_VOICE_MAX_SECONDS: "180", PORTRAIT_VOICE_NAME: "cedar",
};
const receipt = { projectId, budgets: { projectMonthly: budget, keyDaily: { limitAmount: 1, refreshPeriod: "daily" } }, environments: [] };
for (const [environment, target] of [["preview", preview], ["production", production]]) {
  const settings = { ...shared, DATABASE_URL: target.url.href, DATABASE_URL_UNPOOLED: target.url.href, RELEASE_DATABASE_FINGERPRINT: target.fingerprint, PORTRAIT_SESSION_SECRET: randomBytes(32).toString("base64url") };
  for (const [key, value] of Object.entries(settings)) {
    const response = api(`/v10/projects/${projectId}/env?upsert=true`, "POST", { key, value, type: /SECRET|API_KEY|DATABASE_URL/.test(key) ? "sensitive" : "plain", target: [environment], comment: "Portfolio release 2026-11-13; isolated target and approved portrait caps." });
    if (response.error || response.errors?.length) throw Error("Environment update rejected for " + key);
  }
  receipt.environments.push({ environment, fingerprint: target.fingerprint, keys: Object.keys(settings) });
}
await writeFile(".local-library/release/hosted-config.json", JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
