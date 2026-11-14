import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import type { Exchange } from "./agent";
import { clipBytes } from "./evidence";

/** Short follow-up memory without server-side chat retention: the last exchanges are
 * AES-256-GCM sealed to this visitor's signed session and handed back to the browser,
 * which holds them in memory only. The browser can return or drop the token but cannot
 * read, edit or forge it. It expires after 30 minutes; the server stores nothing. */
export const MEMORY = { exchanges: 2, questionBytes: 600, answerBytes: 1400, ttlMs: 30 * 60 * 1000, tokenChars: 9000 } as const;
const key = (secret: string) => createHmac("sha256", secret).update("portrait-context-v1").digest();

export function sealContext(history: Exchange[], session: string, secret: string, now = Date.now()): string | undefined {
  const kept = history.slice(-MEMORY.exchanges).map(h => ({ q: clipBytes(h.q, MEMORY.questionBytes), a: clipBytes(h.a, MEMORY.answerBytes), ids: h.ids.slice(0, 28) }));
  for (let start = 0; start < kept.length; start++) {
    const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(secret), iv);
    cipher.setAAD(Buffer.from(session));
    const body = Buffer.concat([cipher.update(JSON.stringify({ v: 1, exp: now + MEMORY.ttlMs, h: kept.slice(start) }), "utf8"), cipher.final()]);
    const token = Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
    if (token.length <= MEMORY.tokenChars) return token; // otherwise keep only the newer exchange
  }
  return undefined;
}
/** Invalid, foreign-session, tampered or expired tokens open as an empty history. */
export function openContext(token: string | undefined, session: string, secret: string, now = Date.now()): Exchange[] {
  if (!token || token.length > MEMORY.tokenChars) return [];
  try {
    const raw = Buffer.from(token, "base64url"), decipher = createDecipheriv("aes-256-gcm", key(secret), raw.subarray(0, 12));
    decipher.setAAD(Buffer.from(session)); decipher.setAuthTag(raw.subarray(12, 28));
    const value = JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8"));
    if (value?.v !== 1 || !(value.exp > now) || !Array.isArray(value.h)) return [];
    return value.h.filter((h: Exchange) => typeof h?.q === "string" && typeof h?.a === "string" && Array.isArray(h?.ids)).slice(-MEMORY.exchanges);
  } catch { return []; }
}
/** Earlier answers may quote material since withdrawn: drop any exchange whose cited
 * passages are no longer all in the fresh authorized corpus. */
export function reauthorize(history: Exchange[], authorizedIds: Set<string>) {
  // ids hold cited passage IDs and `volume:<slug>` for every project book the model saw.
  return history.filter(h => h.ids.every(id => authorizedIds.has(id)));
}
