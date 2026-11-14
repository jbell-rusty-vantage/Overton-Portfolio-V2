import { createHash } from "node:crypto";
import { type Volume } from "../library/types";
import type { EvidenceRecord, Citation } from "./contracts";
import cards from "../../content/portrait/cards.json";

export const aliases: Record<string, string[]> = {
  "agentic-mission-control": ["mission control", "mission-control", "agentic-mission-control"],
  "agent-knowledge-services": ["knowledge services", "knowledge-services", "agent-knowledge-services"],
  gowipe: ["gowipe", "go-wipe", "go wipe"],
};
export const hash = (text: string) => createHash("sha256").update(text).digest("hex");
/** One UTF-8 byte per token is a conservative upper bound for byte-level BPE.
 * Non-ASCII text is charged by its bytes, not JS characters. No hidden history. */
export const tokenUpperBound = (text: string) => Buffer.byteLength(text, "utf8");
export function clipBytes(text: string, max: number) {
  let result = "";
  for (const point of text) { if (tokenUpperBound(result + point) > max) break; result += point; }
  return result;
}
export function projectEvidence(volumes: Volume[], preview: boolean): EvidenceRecord[] {
  return volumes.filter(v => v.kind === "Project").flatMap(v => v.pages.map(page => {
    const text = clipBytes(page.blocks.filter(b => ["text", "metric", "heading"].includes(b.kind)).map(b => b.text).join("\n"), 1600);
    return {
      id: `project:${v.slug}:${page.key}`, corpus: "project" as const, title: `${v.title} · ${page.title}`, text,
      sourceUrlOrInternalRef: `volume:${v.slug}`, sourceLocator: page.key, checkedAt: new Intl.DateTimeFormat("en-CA", {timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),
      entityId: v.slug, canonicalSlug: v.projectSlug ?? v.slug, aliases: aliases[v.projectSlug ?? v.slug] ?? [v.title],
      sourceRevision: hash(text).slice(0,16), contentHash: hash(text), approvalState: preview ? "reviewed-draft" as const : "published" as const,
      audience: preview ? "authenticated-preview" as const : "public" as const, redactionState: "projected" as const,
      claimKind: preview ? "curated-project-draft" as const : "owner-approved" as const, targetId: v.slug, sectionId: page.key,
    };
  }).filter(e => e.text));
}
export function staticEvidence(preview: boolean): EvidenceRecord[] {
  // These new cards remain private draft until explicit editorial release.
  return preview ? cards.map(c => ({ ...c, corpus: c.corpus, claimKind: c.claimKind,
    contentHash: hash(c.text), sourceRevision: `portrait-2026-11-12-r1:${hash(c.text).slice(0,12)}`, approvalState: "reviewed-draft",
    audience: "authenticated-preview", redactionState: "projected", aliases: c.aliases ?? [],
  } as EvidenceRecord)) : [];
}
export function projectMatches(query: string, volumes: Volume[]) {
  const q = query.toLowerCase();
  return volumes.filter(v => v.kind === "Project" && [v.title, v.projectSlug ?? v.slug, ...(aliases[v.projectSlug ?? v.slug] ?? [])].some(a => q.includes(a.toLowerCase())));
}
export function retrieve(query: string, evidence: EvidenceRecord[], volumes: Volume[], contextId?: string, now = Date.now()) {
  const matches = projectMatches(query, volumes);
  const contextual = matches.length ? matches.map(v=>v.slug) : contextId && /\b(it|that|architecture|claim|sources|proof)\b/i.test(query) ? [contextId] : [];
  const terms = query.toLowerCase().match(/[a-z0-9]+/g)?.filter(t => t.length > 2) ?? [];
  const score = (e: EvidenceRecord) => {
    const text = `${e.title} ${e.text} ${e.aliases.join(" ")}`.toLowerCase();
    let n = terms.reduce((s,t) => s + (text.includes(t) ? 1 : 0), 0);
    if (contextual.includes(e.targetId ?? "")) n += 30;
    if (/\btour\b|build.*related|anything related/i.test(query) && e.corpus === "project") {
      n += 20;
      if (/engineer/i.test(query) && /architecture/i.test(e.title)) n += 8;
      if (/recruiter/i.test(query) && /overview|role|evidence/i.test(e.title)) n += 8;
      if (/related/i.test(query) && ["agentic-mission-control","agent-knowledge-services"].includes(e.canonicalSlug??"")) n += 15;
    }
    if (/architecture|claim|proof|sources|check/i.test(query) && /architecture|evidence|claim|proof/i.test(e.title)) n += 5;
    if (/harvey|papers|reports/i.test(query) && ["harvey", "overton-reports", "overton-papers"].includes(e.id)) n += 15;
    if (/supreme|court/i.test(query) && e.id === "overton-courts") n += 30;
    if (/ahead|race|competing|anthropic|google|meta|openai|latest|today/i.test(query) && e.id.startsWith("model-")) n += 20;
    if (/powers|infrastructure|chips|energy|electricity/i.test(query) && e.id.startsWith("infra-")) n += 20;
    return n;
  };
  let bytes = 0;
  return evidence.filter(e => e.corpus !== "project" || !contextual.length || contextual.includes(e.targetId ?? ""))
    .filter(e => !e.expiresAt || Date.parse(e.expiresAt) > now || !/today|latest|current|now/i.test(query))
    .map(e=>({ e, score:score(e) })).filter(x=>x.score>1).sort((a,b)=>b.score-a.score)
    .slice(0,6).flatMap(({e})=>{ const text=clipBytes(e.text, Math.min(1600, 4200-bytes)); bytes+=tokenUpperBound(text); return text ? [{...e,text}] : []; });
}
/** Citations per answer (library passages; live web results are counted separately). */
export const MAX_CITATIONS = 8;
export function citations(ids: string[], evidence: EvidenceRecord[]): Citation[] {
  if (ids.length > MAX_CITATIONS || new Set(ids).size !== ids.length || ids.some(id=>!evidence.some(e=>e.id===id))) throw Error("Invalid citation");
  return ids.map(id=>{
    const e=evidence.find(e=>e.id===id)!;
    const ref=e.sourceUrlOrInternalRef;
    if (!ref.startsWith("volume:") && !safeSourceUrl(ref)) throw Error("Unsafe source");
    return {id:e.id,title:e.title,text:e.text,sourceUrlOrInternalRef:ref,sourceLocator:e.sourceLocator,checkedAt:e.checkedAt,expiresAt:e.expiresAt,sourceRevision:e.sourceRevision,claimKind:e.claimKind};
  });
}
export function safeSourceUrl(ref:string) { try { const u=new URL(ref); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; } }
