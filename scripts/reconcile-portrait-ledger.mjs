// Operator reconciliation for one portrait ledger charge, inside the same row lock the
// application uses. Settle only against CONFIRMED provider usage (gateway dashboard, the
// generation lookup, or provider-reported Live session seconds). Prints before/after.
//   node scripts/reconcile-portrait-ledger.mjs --list
//   node scripts/reconcile-portrait-ledger.mjs --charge <id suffix> --usd <confirmed> --reason "<evidence>" [--unkill]
import pg from "pg";
for (const f of [".env.local", ".env"]) try { process.loadEnvFile(f); } catch { /* optional */ }
const arg = name => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : undefined; };
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const { rows } = await client.query("SELECT state FROM portrait_ledger WHERE id = 1 FOR UPDATE");
  const state = rows[0].state;
  const open = state.turns.filter(t => t.status !== "settled").map(t => ({ id: t.id, kind: t.kind ?? "turn", status: t.status, reservedUsd: t.reserved / 1e6, actualUsd: t.actual === undefined ? null : t.actual / 1e6, at: new Date(t.at).toISOString(), model: t.model }));
  if (process.argv.includes("--list")) {
    // Independent cross-check: the gateway's own daily spend per model against the ledger.
    const day = arg("day") ?? new Date().toISOString().slice(0, 10), from = Date.parse(day + "T00:00:00Z"), to = from + 86400000;
    const ledger = {}; for (const t of state.turns.filter(t => t.at >= from && t.at < to)) ledger[t.model] = +(((ledger[t.model] ?? 0) + (t.actual ?? t.reserved) / 1e6).toFixed(6));
    const gateway = {};
    for (const model of Object.keys(ledger)) {
      const r = await fetch(`https://ai-gateway.vercel.sh/v1/report?start_date=${day}&end_date=${day}&group_by=day&model=${encodeURIComponent(model)}`, { headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` } }).catch(() => null);
      gateway[model] = r?.ok ? (await r.json()).results?.[0]?.total_cost ?? 0 : "unavailable";
    }
    console.log(JSON.stringify({ killed: state.killed, unresolved: open, day, ledgerUsdByModel: ledger, gatewayReportedUsdByModel: gateway, note: "Gateway totals include calls outside the visitor ledger (evaluation judges, probes) and ingest asynchronously." }, null, 1));
    await client.query("ROLLBACK"); process.exit(0);
  }
  const suffix = arg("charge"), usd = Number(arg("usd")), reason = arg("reason");
  if (!suffix || !Number.isFinite(usd) || usd < 0 || !reason) throw Error("--charge, --usd and --reason are required");
  const matches = state.turns.filter(t => t.id.endsWith(suffix));
  if (matches.length !== 1) throw Error(`expected exactly one charge ending ${suffix}, found ${matches.length}`);
  const t = matches[0], before = { status: t.status, actual: t.actual, killed: state.killed };
  t.actual = Math.ceil(usd * 1e6); t.status = "settled"; t.reconciled = { at: new Date().toISOString(), reason };
  if (process.argv.includes("--unkill")) state.killed = false;
  await client.query("UPDATE portrait_ledger SET state = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = 1", [JSON.stringify(state)]);
  await client.query("COMMIT");
  console.log(JSON.stringify({ charge: t.id, before, after: { status: t.status, actualUsd: t.actual / 1e6, killed: state.killed }, reason }, null, 1));
} catch (error) { await client.query("ROLLBACK").catch(() => {}); console.error(String(error)); process.exitCode = 1; }
finally { await client.end(); }
