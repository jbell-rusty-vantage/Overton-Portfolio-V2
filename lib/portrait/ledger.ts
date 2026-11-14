import { AGENT_LIMITS, TURN_DEADLINE_MS } from "./limits";
/** Integer micro-dollars; one globally serialized state, shared by every instance.
 * Content is never stored. Unresolved provider charges remain reserved indefinitely. */
export type Charge = { id:string; session:string; network:string; at:number; deadline:number; reserved:number; actual?:number; status:"active"|"uncertain"|"settled"; model:string; priceVersion:string; navigationConsumed?:boolean; /** Absent = a text turn. A voice session runs alongside its own delegated text turns. */ kind?:"voice" };
/** Voice sessions a visitor session may open per UTC day. */
export const VOICE_SESSIONS_PER_DAY=4;
export type LedgerState = { version:1; killed:boolean; turns:Charge[] };
export type AtomicStore = { update<T>(fn:(state:LedgerState)=>T):Promise<T> };
export type Limits = { turn:number; day:number; month:number; sessionDay:number; networkDay:number; concurrency:number; sessionMinute:number };
export const rehearsalLimits:Limits = {turn:0,day:0,month:0,sessionDay:12,networkDay:30,concurrency:8,sessionMinute:3};
export type Admission = {ok:true;charge:Charge}|{ok:false;reason:string;resetAt:string};
const dayStart=(n:number)=>{const d=new Date(n);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());};
const monthStart=(n:number)=>{const d=new Date(n);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);};
export function reserveInState(state:LedgerState, charge:Charge, caps:Limits, now:number):Admission {
  const deny=(reason:string,reset=dayStart(now)+86400000):Admission=>({ok:false,reason,resetAt:new Date(reset).toISOString()});
  if(state.killed) return deny("paused");
  if(!Object.values(caps).every(Number.isSafeInteger) || Object.values(caps).some(n=>n<0) || !Number.isSafeInteger(charge.reserved) || charge.reserved<0) return deny("configuration");
  // A duplicate is never dispatched again, even if its previous request disconnected.
  if(state.turns.some(t=>t.id===charge.id)) return deny("duplicate");
  for(const t of state.turns) if(t.status==="active" && t.deadline<=now) t.status="uncertain";
  const active=state.turns.filter(t=>t.status==="active");
  const sameKind=(t:Charge)=>(t.kind??"turn")===(charge.kind??"turn");
  // One active turn and one active voice session per visitor; a voice session's delegated
  // text turns are admitted beside it under the ordinary turn limits.
  if(active.some(t=>t.session===charge.session&&sameKind(t))) return deny("active-session",now+TURN_DEADLINE_MS);
  if(active.length>=caps.concurrency) return deny("concurrency",now+TURN_DEADLINE_MS);
  const session=state.turns.filter(t=>t.session===charge.session&&sameKind(t));
  if(charge.kind==="voice"&&session.filter(t=>t.at>=dayStart(now)).length>=VOICE_SESSIONS_PER_DAY) return deny("voice-day");
  if(charge.kind!=="voice"&&session.filter(t=>t.at>now-60000).length>=caps.sessionMinute) return deny("minute",Math.min(...session.filter(t=>t.at>now-60000).map(t=>t.at))+60000);
  if(charge.kind!=="voice"&&session.filter(t=>t.at>=dayStart(now)).length>=caps.sessionDay) return deny("session-day");
  if(state.turns.filter(t=>t.network===charge.network && t.at>=dayStart(now)).length>=caps.networkDay) return deny("network-day");
  const cost=(since:number)=>state.turns.filter(t=>t.at>=since || t.status!=="settled").reduce((s,t)=>s+(t.actual??t.reserved),0);
  // A voice session is bounded by its configured length (lib/portrait/voice.ts), not the per-turn cap.
  if((charge.kind!=="voice"&&charge.reserved>caps.turn) || cost(dayStart(now))+charge.reserved>caps.day || cost(monthStart(now))+charge.reserved>caps.month) return deny("spend");
  state.turns=state.turns.filter(t=>t.status!=="settled" || t.at>=now-35*86400000);
  state.turns.push(charge);
  return {ok:true,charge};
}
export class Ledger {
  constructor(private store:AtomicStore){}
  reserve(charge:Charge,caps:Limits,now=Date.now()){return this.store.update(s=>reserveInState(s,charge,caps,now));}
  async settle(id:string,actual:number|undefined){return this.store.update(s=>{
    const t=s.turns.find(t=>t.id===id); if(!t || t.status==="settled") return;
    // Missing, invalid or unexpectedly high usage is never a refund.
    if(actual===undefined || !Number.isSafeInteger(actual) || actual<0 || actual>t.reserved){
      t.status="uncertain";
      if(actual!==undefined && actual>t.reserved){s.killed=true;if(Number.isSafeInteger(actual))t.actual=Math.max(t.actual??0,actual);}
      return;
    }
    t.actual=actual;t.status="settled";
  });}
}
export type Price = {model:string;version:string;inputUsdPerMillion:number;outputUsdPerMillion:number;webSearchUsdPerCall?:number};
export function priceMicros(input:number,output:number,price:Price){return Math.ceil(input*price.inputUsdPerMillion+output*price.outputUsdPerMillion);}
const searchMicros=(price:Price)=>Math.ceil((price.webSearchUsdPerCall??0)*1e6);
/** Worst case for one live turn: every call at its full input/output bound, uncached,
 * plus every permitted web search fee and its injected content. */
export function reservationMicros(price:Price,limits=AGENT_LIMITS){
  const searches=(price.webSearchUsdPerCall??0)>0?limits.webSearches:0;
  const input=limits.calls*(limits.inputBytesPerCall+limits.hiddenFramingTokens)+searches*limits.webSearchInputTokens;
  return priceMicros(input,limits.calls*limits.outputTokensPerCall,price)+searches*searchMicros(price);
}
export type CallUsage = {input:number;output:number;webSearches:number;reportedUsd?:string};
/** Per call: the gateway's reported charge when present, otherwise an uncached upper
 * bound from token usage. Undefined when any call's charge cannot be established. */
export function settlementMicros(calls:(CallUsage|undefined)[],price:Price){
  let total=0;
  for(const call of calls){
    if(!call)return undefined;
    const reported=call.reportedUsd===undefined?NaN:Number(call.reportedUsd);
    if(Number.isFinite(reported)&&reported>=0){total+=Math.ceil(reported*1e6-1e-6);continue;}
    if(![call.input,call.output,call.webSearches].every(n=>Number.isSafeInteger(n)&&n>=0))return undefined;
    total+=priceMicros(call.input,call.output,price)+call.webSearches*searchMicros(price);
  }
  return total;
}
export const GATEWAY_MODEL_ID=/^[a-z0-9-]+\/[a-z0-9][a-z0-9._:-]*$/;
/** Live mode requires every value explicitly; anything missing disables paid dispatch. */
export function paidConfig(env:Record<string,string|undefined>):{price:Price;caps:Limits}|null {
  if(env.PORTRAIT_PAID_ENABLED!=="1" || env.PORTRAIT_KILL_SWITCH==="1" || !env.AI_GATEWAY_API_KEY || !env.PORTRAIT_SESSION_SECRET || env.PORTRAIT_SESSION_SECRET.length<32 || !env.PORTRAIT_MODEL || !GATEWAY_MODEL_ID.test(env.PORTRAIT_MODEL) || !env.PORTRAIT_PRICE_VERSION) return null;
  const number=(key:string,min:number)=>{const text=env[key];const x=text===undefined||text.trim()===""?NaN:Number(text);return Number.isFinite(x)&&x>=min?x:NaN;};
  const positive=(key:string)=>{const x=number(key,0);return x>0?x:NaN;};
  const price={model:env.PORTRAIT_MODEL,version:env.PORTRAIT_PRICE_VERSION,inputUsdPerMillion:positive("PORTRAIT_INPUT_USD_PER_MILLION"),outputUsdPerMillion:positive("PORTRAIT_OUTPUT_USD_PER_MILLION"),webSearchUsdPerCall:number("PORTRAIT_WEB_SEARCH_USD_PER_CALL",0)};
  const networkDay=env.PORTRAIT_NETWORK_DAY===undefined?rehearsalLimits.networkDay:Math.floor(positive("PORTRAIT_NETWORK_DAY"));
  const caps={...rehearsalLimits,networkDay,turn:Math.floor(positive("PORTRAIT_USD_PER_TURN")*1e6),day:Math.floor(positive("PORTRAIT_USD_PER_DAY")*1e6),month:Math.floor(positive("PORTRAIT_USD_PER_MONTH")*1e6)};
  if(![...Object.values(caps),price.inputUsdPerMillion,price.outputUsdPerMillion,price.webSearchUsdPerCall].every(x=>typeof x==="number"&&Number.isFinite(x)))return null;
  // A turn cap below the worst-case reservation would deny every turn; fail closed visibly.
  return reservationMicros(price)<=caps.turn?{price,caps}:null;
}
