import { randomUUID } from "node:crypto";
import { runtime } from "@/lib/portrait/server";
import { readVoiceRequest, sameOriginRequest } from "@/lib/portrait/request";
import { GATEWAY_LIVE_SOCKET_URL, mintLiveToken, voiceConfig, voiceInstructions, voiceReservationMicros, voiceSettlement, VOICE_CLOSE_GRACE_SECONDS } from "@/lib/portrait/voice";
import type { Charge } from "@/lib/portrait/ledger";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: privateHeaders });

/** Voice is a short serverless exchange: `start` admits and reserves a bounded session in
 * the shared ledger, then mints a single-use, 60-second gateway token; the browser holds
 * the audio WebSocket to the gateway itself. `end` settles the reported duration. */
export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return json({ error: "Unavailable" }, 403);
  let input; try { input = await readVoiceRequest(request); } catch { return json({ error: "Invalid voice request" }, 400); }
  try {
    const r = await runtime(), config = voiceConfig(process.env);
    if (r.killed || !config) return json({ error: "Voice conversation is not available." }, 503);
    if (input.kind === "end") {
      const id = `${r.session}:voice:${input.voiceId}`;
      const charge = await r.store.update(s => s.turns.find(t => t.id === id && t.kind === "voice") as Charge | undefined);
      if (!charge) return json({ error: "Unknown voice session" }, 404);
      const actual = voiceSettlement(input.seconds, charge.at, Date.now(), config);
      await r.ledger.settle(id, actual);
      return json({ ok: true, costUsd: actual === undefined ? null : actual / 1e6 });
    }
    const voiceId = randomUUID(), now = Date.now();
    const admitted = await r.ledger.reserve({ id: `${r.session}:voice:${voiceId}`, kind: "voice", session: r.session, network: r.network, at: now,
      deadline: now + (config.maxSeconds + VOICE_CLOSE_GRACE_SECONDS + 30) * 1000, reserved: voiceReservationMicros(config), status: "active",
      model: config.model, priceVersion: config.priceVersion }, r.caps, now);
    if (!admitted.ok) return json({ error: "allowance", reason: admitted.reason, resetAt: admitted.resetAt }, 429);
    try {
      const { token, expiresAt } = await mintLiveToken(process.env.AI_GATEWAY_API_KEY!, config.model, request.signal);
      return json({ voiceId, token, expiresAt, socketUrl: GATEWAY_LIVE_SOCKET_URL, model: config.model, voice: config.voice, maxSeconds: config.maxSeconds, instructions: voiceInstructions(config.maxSeconds) });
    } catch {
      // No token was issued, so no session can exist: release the reservation at zero.
      await r.ledger.settle(admitted.charge.id, 0);
      return json({ error: "Voice conversation is unavailable just now." }, 502);
    }
  } catch { return json({ error: "Voice conversation is unavailable." }, 503); }
}
