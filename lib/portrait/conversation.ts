import { randomUUID } from "node:crypto";
import { type Volume } from "../library/types";
import { FALLBACK, ALLOWANCE, type Citation, type EvidenceRecord, type PortraitAnswer, type NavigationIntent } from "./contracts";
import { citations, hash, projectMatches, retrieve } from "./evidence";
import { buildPrompt, type PortraitProvider } from "./provider";
import { Ledger, reservationMicros, settlementMicros, type Limits, type Price } from "./ledger";
import { AgentFailure, type AgentResult, type AnswerAgent, type Exchange, type WebSource } from "./agent";
import { TURN_DEADLINE_MS } from "./limits";
import { reflections } from "../../content/portrait/reflections";
/** `spoken`: the answer will be read aloud by the voice portrait (shorter, no lists). */
export type Turn = {turnId:string;question:string;scene?:{volumeId?:string;sectionId?:string};contextId?:string;spoken?:boolean};
/** `agent` present = live generated conversation (paid, metered); absent = free mock. */
export type TurnDependencies = {evidence:EvidenceRecord[];volumes:Volume[];provider:PortraitProvider;agent?:AnswerAgent;history?:Exchange[];ledger:Ledger;caps:Limits;price?:Price;session:string;network:string;signal:AbortSignal;now?:()=>number;timeoutMs?:number};
/** Visitor-explicit movement only: the application, never the model, decides to move. */
export const explicitNavigation=(question:string)=>/^\s*(please\s+)?(show|open|take|go|bring|let'?s (see|open))\b/i.test(question);
const excerpt=(s:string,max=480)=>{if(s.length<=max)return s;const sentences=s.match(/[^.!?]+[.!?]+(?:\s|$)/g)??[];const kept:string[]=[];let length=0;for(const sentence of sentences){if(length+sentence.length>max)break;kept.push(sentence);length+=sentence.length;}if(kept.length>1&&kept.at(-1)!.trim().split(/\s+/).length<4)kept.pop();return kept.join("").trim()||"Open the source card for the full passage.";};
export function navigationFor(turn:Turn,volumes:Volume[]):NavigationIntent|undefined {
  const matches=projectMatches(turn.question,volumes);
  const selected=matches.length===1?matches[0]:matches.length===0&&/\b(it|that|its)\b/i.test(turn.question)?volumes.find(v=>v.slug===turn.contextId||v.slug===turn.scene?.volumeId):undefined;
  if(!selected)return;
  const sectionQuery=/architecture|claim|sources|proof|checks?/i.test(turn.question);
  const section=sectionQuery?selected.pages.find(p=>/architecture|claim|evidence|proof/i.test(p.title+" "+p.key)):undefined;
  return {intentId:randomUUID(),turnId:turn.turnId,targetId:selected.slug,mode:section||/report/i.test(turn.question)?"report":"book",sectionId:section?.key,label:section?`${selected.title} · ${section.title}`:selected.title};
}
export function validateNavigation(intent:NavigationIntent,volumes:Volume[]) {
  const target=volumes.find(v=>v.slug===intent.targetId);
  return !!target && ["focus","book","report"].includes(intent.mode) && (!intent.sectionId||target.pages.some(p=>p.key===intent.sectionId));
}
export function composeAnswer(question:string,selected:EvidenceRecord[],now=Date.now()) {
  if(/revenue|income|salary|client list|credentials|private|api.?key|environment|ignore (all|previous|policy)/i.test(question))return {text:FALLBACK,ids:[]};
  if(/quote.*(astra|ai|harvey)|said.*(astra|GPT)/i.test(question))return {text:"No historical quotation exists in this collection about modern AI. These reflections are newly written interpretation, not words Judge Overton spoke. "+reflections[0].text,ids:[]};
  if(/\b(ai|model|machine)\b/i.test(question)&&/worse writer|better writer|deskilling|lose.*skill/i.test(question))return {text:"This collection cannot establish how AI will affect your writing. Whether assistance strengthens or displaces the practice through which judgment develops is an open question, not a diagnosis of your abilities.\n\nImagined reflection, newly written for this portrait: "+reflections[0].text,ids:[]};
  if(!selected.length)return {text:/today|latest|current|ahead/i.test(question)?"The reviewed collection cannot establish today's position. Dated vendor announcements do not establish a universal winner. "+reflections[2].text:FALLBACK,ids:[]};
  const project=selected.filter(e=>e.corpus==="project");
  let chosen:EvidenceRecord[]=[];
  if(/supreme|court/i.test(question))chosen=selected.filter(e=>e.id==="overton-courts");
  else if(/harvey|papers|reports/i.test(question))chosen=selected.filter(e=>["overton-reports","overton-papers","harvey"].includes(e.id));
  else if(/ahead|race|competing|today|latest|anthropic|google|meta|openai/i.test(question))chosen=selected.filter(e=>e.id.startsWith("model-"));
  else if(project.length){const targets=[...new Set(project.map(e=>e.targetId))];chosen=targets.slice(0,3).map(id=>project.find(e=>e.targetId===id)!);}
  else chosen=selected.slice(0,3);
  if(!chosen.length)chosen=selected.slice(0,2);
  const facts=chosen.map(e=>e.corpus==="project"?`${e.title} — curated project excerpt (John's account):\n“${excerpt(e.text,chosen.length>2?360:520)}”`:`${e.title}: ${excerpt(e.text,chosen.length>2?360:520)}`).join("\n\n");
  const stale=chosen.some(e=>e.expiresAt&&Date.parse(e.expiresAt)<=now);
  let frame="Here is what the materials placed in this library support.";
  if(chosen.some(e=>e.id.startsWith("model-")))frame="These are dated vendor notices, checked "+chosen[0].checkedAt+". They cannot establish who is ahead today; capability, reliability, cost and access are different contests.";
  if(stale)frame="This briefing has expired. The following describes the dated record, not current availability. "+frame;
  let end="";
  if(/harvey|papers|reports/i.test(question))end="\n\nImagined reflection: I would have welcomed help finding authorities, and still asked to inspect them. This is a modern counterfactual, not a historical quotation.";
  if(chosen.some(e=>e.corpus==="project"))end="\n\nThese are the project's curated claims. The source cards show their wording and limits; they establish no unrecorded deployment or commercial result.";
  return {text:frame+"\n\n"+facts+end,ids:chosen.map(e=>e.id)};
}
export function webCitation(source:WebSource,now:number):Citation{
  return {id:`web:${hash(source.url).slice(0,16)}`,title:source.title,text:"Found by a live web search during this conversation. It has not been reviewed by John; open the original to check it.",sourceUrlOrInternalRef:source.url,sourceLocator:new URL(source.url).host,checkedAt:new Date(now).toISOString().slice(0,10),sourceRevision:"live-web-search",claimKind:"web-search-result"};
}
/** The model may name the book its reply is about; it is offered only when it is an
 * authorized volume that the reply actually cites. */
function liveNavigation(turn:Turn,result:AgentResult,volumes:Volume[],cited:EvidenceRecord[]){
  const asked=navigationFor(turn,volumes);if(asked)return asked;
  if(!result.projectId||!cited.some(e=>e.targetId===result.projectId))return;
  const target=volumes.find(v=>v.slug===result.projectId);
  return target?{intentId:randomUUID(),turnId:turn.turnId,targetId:target.slug,mode:"book" as const,label:target.title}:undefined;
}
async function liveTurn(turn:Turn,d:TurnDependencies,agent:AnswerAgent,base:PortraitAnswer,start:number,now:()=>number):Promise<PortraitAnswer>{
  const initial=retrieve(turn.question,d.evidence,d.volumes,turn.contextId??turn.scene?.volumeId,start).slice(0,4);
  if(!d.price||d.price.model!==agent.model)return {...base,notice:"Live conversation is disabled until a versioned price and explicit budgets are configured."};
  const price=d.price,reserved=reservationMicros(agent.webSearch?price:{...price,webSearchUsdPerCall:0});
  let admitted;
  try{admitted=await d.ledger.reserve({id:`${d.session}:${turn.turnId}`,session:d.session,network:d.network,at:start,deadline:start+TURN_DEADLINE_MS,reserved,status:"active",model:agent.model,priceVersion:price.version},d.caps,start);}catch{return {...base,notice:"Conversation accounting is unavailable. The authored reflections remain available."};}
  if(!admitted.ok)return {...base,text:ALLOWANCE,notice:admitted.reason,resetAt:admitted.resetAt};
  const chargeId=admitted.charge.id;
  // Stop (d.signal) prevents further calls; only the turn deadline aborts an in-flight call,
  // so a stopped turn still learns and settles the charge of the call it already made.
  const deadline=new AbortController();
  const timer=setTimeout(()=>deadline.abort(),Math.min(TURN_DEADLINE_MS,Math.max(1,d.timeoutMs??TURN_DEADLINE_MS)));
  let result:AgentResult;
  try{
    if(d.signal.aborted)throw new AgentFailure("Cancelled",[]);
    const asked=explicitNavigation(turn.question)?navigationFor(turn,d.volumes):undefined;
    result=await agent.answer({question:turn.question,evidence:d.evidence,volumes:d.volumes,initial,history:d.history??[],contextId:turn.contextId,currentBook:turn.scene?.volumeId,now:start,offeredBook:asked?.label,spoken:turn.spoken},d.signal,deadline.signal);
  }catch(error){
    // Calls that never left cost nothing; any dispatched call without proven usage stays held.
    const calls=error instanceof AgentFailure?error.calls:[undefined];
    const actual=settlementMicros(calls,price);
    try{await d.ledger.settle(chargeId,actual);}catch{/* Reservation remains held. */}
    if(d.signal.aborted)return {...base,costUsd:actual===undefined?null:actual/1e6,notice:"Stopped.",fullAnswerMs:now()-start};
    const fallback=composeAnswer(turn.question,initial,start);
    return {...base,text:fallback.text,citations:citations(fallback.ids,initial),mode:"fallback",model:agent.model,costUsd:actual===undefined?null:actual/1e6,firstTextMs:now()-start,fullAnswerMs:now()-start,
      notice:"The live model could not complete this answer, so these are reviewed excerpts instead."+(actual===undefined?" Its charge is held until reconciled.":""),trace:[`failure:${error instanceof Error?error.message:"unknown"}`]};
  }finally{clearTimeout(timer);}
  const actual=settlementMicros(result.calls,price);
  try{await d.ledger.settle(chargeId,actual);}catch{/* Reservation remains held; the answer is still truthful. */}
  if(d.signal.aborted)return {...base,costUsd:actual===undefined?null:actual/1e6,notice:"Stopped."};
  const cited=result.citationIds.map(id=>result.seen.find(e=>e.id===id)!);
  const navigation=liveNavigation(turn,result,d.volumes,cited);
  return {...base,text:result.text,citations:[...citations(result.citationIds,result.seen),...result.webSources.map(s=>webCitation(s,start))],navigation,navigationRequested:!!navigation&&explicitNavigation(turn.question),
    mode:"live",model:agent.model,costUsd:actual===undefined?null:actual/1e6,firstTextMs:now()-start,fullAnswerMs:now()-start,
    exposed:[...result.citationIds,...result.exposedProjects.map(slug=>`volume:${slug}`)],trace:result.trace};
}
export async function runTurn(turn:Turn,d:TurnDependencies):Promise<PortraitAnswer>{
  const now=d.now??Date.now,start=now();
  const base:PortraitAnswer={turnId:turn.turnId,text:FALLBACK,citations:[],navigationRequested:false,mode:"fallback",model:d.agent?.model??d.provider.model,costUsd:0,firstTextMs:0,fullAnswerMs:0};
  if(turn.question.length>1200 || !turn.question.trim())return {...base,notice:"Please keep the question under 1,200 characters."};
  if(d.agent)return liveTurn(turn,d,d.agent,base,start,now);
  if(d.provider.paid)return {...base,notice:"Paid conversation requires the live gateway agent."};
  const evidence=retrieve(turn.question,d.evidence,d.volumes,turn.contextId??turn.scene?.volumeId,start);
  let prompt:string;try{prompt=buildPrompt(turn.question,evidence);}catch{return {...base,notice:"This question and its evidence exceed the conversation's context allowance."};}
  let admitted;
  try{admitted=await d.ledger.reserve({id:`${d.session}:${turn.turnId}`,session:d.session,network:d.network,at:start,deadline:start+TURN_DEADLINE_MS,reserved:0,status:"active",model:d.provider.model,priceVersion:"zero-cost-mock-v1"},d.caps,start);}catch{return {...base,notice:"Conversation accounting is unavailable. The authored reflections remain available."};}
  if(!admitted.ok)return {...base,text:ALLOWANCE,notice:admitted.reason,resetAt:admitted.resetAt};
  const chargeId=admitted.charge.id;
  try{
    d.signal.throwIfAborted();
    const selected=await boundedSelection(d.provider,prompt,evidence,d.signal,d.timeoutMs);
    const verified=citations(selected.ids,evidence);
    await d.ledger.settle(chargeId,0);
    d.signal.throwIfAborted();
    const supported=evidence.filter(e=>verified.some(c=>c.id===e.id));
    const response=composeAnswer(turn.question,supported,start);
    const navigation=response.ids.length?navigationFor(turn,d.volumes):undefined;
    return {...base,text:response.text,citations:citations(response.ids,evidence),navigation,navigationRequested:!!navigation&&explicitNavigation(turn.question),mode:"mock",costUsd:0,firstTextMs:now()-start,fullAnswerMs:now()-start,notice:"Deterministic rehearsal · no language model call · $0 provider cost",exposed:response.ids};
  }catch{try{await d.ledger.settle(chargeId,0);}catch{/* Reservation remains held. */}return {...base,costUsd:0,notice:"The turn could not finish. The books and authored reflections remain available.",fullAnswerMs:now()-start};}
}
async function boundedSelection(provider:PortraitProvider,prompt:string,evidence:EvidenceRecord[],signal:AbortSignal,timeoutMs=25000){
  const controller=new AbortController();let rejectAbort:(e:Error)=>void=()=>{};
  const onAbort=()=>{controller.abort();rejectAbort(Error("Cancelled"));};
  let timer:ReturnType<typeof setTimeout>|undefined;
  const cancellation=new Promise<never>((_,reject)=>{rejectAbort=reject;timer=setTimeout(()=>{controller.abort();reject(Error("Timeout"));},Math.min(25000,Math.max(1,timeoutMs)));});
  signal.addEventListener("abort",onAbort,{once:true});
  try{signal.throwIfAborted();return await Promise.race([provider.select(prompt,evidence,controller.signal),cancellation]);}finally{clearTimeout(timer);signal.removeEventListener("abort",onAbort);}
}
