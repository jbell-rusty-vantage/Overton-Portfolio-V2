// Isolated live-portrait qualification office: loopback only, its own build directory
// (.next-office/proof), the configured database read through the normal projection, and
// live settings passed through the process environment rather than written to env files.
// Usage: node scripts/portrait-live-server.mjs [port]   (default 3081)
// Requires AI_GATEWAY_API_KEY in .env/.env.local. The ledger is the shared portrait_ledger.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";

const port = Number(process.argv[2] || 3081);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error("Invalid port");
const bin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const env = {
  ...process.env,
  NODE_ENV: "development",
  LIBRARY_CONTENT_SOURCE: "database",
  LIBRARY_LOCAL_REVIEW: "",
  LIBRARY_OFFICE_HOST: "127.0.0.1:" + port,
  LIBRARY_OFFICE_TEST: "1",
  PORTRAIT_PAID_ENABLED: "1",
  PORTRAIT_MODEL: process.env.PORTRAIT_MODEL || "openai/gpt-6-luna",
  PORTRAIT_PRICE_VERSION: process.env.PORTRAIT_PRICE_VERSION || "vercel-gateway-openai-gpt-6-luna-2026-11-13",
  PORTRAIT_INPUT_USD_PER_MILLION: process.env.PORTRAIT_INPUT_USD_PER_MILLION || "0.10",
  PORTRAIT_OUTPUT_USD_PER_MILLION: process.env.PORTRAIT_OUTPUT_USD_PER_MILLION || "0.50",
  PORTRAIT_WEB_SEARCH_USD_PER_CALL: process.env.PORTRAIT_WEB_SEARCH_USD_PER_CALL || "0.01",
  PORTRAIT_USD_PER_TURN: process.env.PORTRAIT_USD_PER_TURN || "0.05",
  PORTRAIT_USD_PER_DAY: process.env.PORTRAIT_USD_PER_DAY || "1",
  PORTRAIT_USD_PER_MONTH: process.env.PORTRAIT_USD_PER_MONTH || "5",
  // The evaluation runs many fresh sessions from one loopback network bucket.
  PORTRAIT_NETWORK_DAY: process.env.PORTRAIT_NETWORK_DAY || "200",
  PORTRAIT_EVAL_TRACE: "1",
  PORTRAIT_SESSION_SECRET: process.env.PORTRAIT_SESSION_SECRET || randomBytes(32).toString("base64url"),
};
console.log(`Live portrait qualification office: http://127.0.0.1:${port}/admin/library/preview (model ${env.PORTRAIT_MODEL})`);
const child = spawn(process.execPath, [bin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], { stdio: "inherit", env });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
