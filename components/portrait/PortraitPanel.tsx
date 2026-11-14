"use client";
import { useEffect, useRef, useState } from "react";
import { DISCLOSURE, type Citation, type NavigationAck, type NavigationIntent, type PortraitAnswer, type PortraitEvent, type SceneSnapshot } from "@/lib/portrait/contracts";
import { reflections } from "@/content/portrait/reflections";
import { LiveVoice, type VoiceState } from "./live-voice";
import "./portrait.css";

export type PortraitPanelProps = {
  scene?:SceneSnapshot;
  /** Use shared route/history; respect signal before moving or completing animation. */
  onNavigate:(intent:NavigationIntent,signal:AbortSignal)=>Promise<NavigationAck>;
  /** Pause existing custodian and film before a turn; never enable sound implicitly. */
  onCancelMedia?:()=>void;
  onClose?:()=>void;
  /** Changes when a film starts, the route changes externally or another speaker starts. */
  cancelKey?:string|number;
  /** Live voice: a loudness reader (0..1) for the portrait's mouth while it speaks, or null. */
  onVoiceLevel?:(level:(()=>number)|null)=>void;
  /** A spoken conversation is starting: bring the visitor before the portrait if free to move. */
  onVoiceStart?:()=>void;
};
const suggestions=["Would Harvey have changed your practice?","Show me Mission Control","How does Knowledge Services check its sources?","What did John do for go-wipe?","Who is competing to build these models?","What powers the machines?","Give me a tour for an engineer","Give me a tour for a recruiter"];
/** Ledger reason codes become plain sentences; other notices are already prose. */
const allowance:Record<string,string>={
  minute:"Three questions a minute is the allowance; you may ask again shortly.",
  "active-session":"Your previous question is still being answered.",
  concurrency:"Many visitors are conversing just now; please ask again in a moment.",
  "session-day":"You have reached today's allowance of questions.",
  "network-day":"Today's allowance of questions for this connection is used up.",
  spend:"Today's conversation budget is spent; the books remain open to you.",
  paused:"The conversation is paused for now.",
  duplicate:"That question was already sent.",
  configuration:"The conversation is not configured.",
  "voice-day":"You have had today's spoken conversations; typed questions remain open.",
};
const voiceLabels:Record<VoiceState,string>={connecting:"Opening the conversation…",listening:"Listening — speak whenever you like.",consulting:"Consulting the shelves…",speaking:"The Judge is speaking.",closing:"Closing the conversation…",ended:"The spoken conversation has ended.",error:"The spoken conversation could not continue."};
const describeNotice=(notice?:string)=>notice?allowance[notice]??notice:"";
export function PortraitPanel({scene,onNavigate,onCancelMedia,onClose,cancelKey,onVoiceLevel,onVoiceStart}:PortraitPanelProps){
  const [question,setQuestion]=useState(""),[text,setText]=useState(""),[answer,setAnswer]=useState<PortraitAnswer|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState(""),[sources,setSources]=useState<Citation[]|null>(null),[reflection,setReflection]=useState<string|null>(null);
  const active=useRef<{controller:AbortController;turnId:string;epoch:number}|null>(null),epoch=useRef(0),context=useRef<string|undefined>(undefined),handled=useRef(new Set<string>());
  // Server-sealed follow-up memory: opaque, held only in this component's memory.
  const memory=useRef<string|undefined>(undefined),[turns,setTurns]=useState(0);
  const [capability,setCapability]=useState<{available?:boolean;live:boolean;label:string;model?:string;voice?:{model:string;maxSeconds:number}|null}|null>(null);
  // Spoken conversation: GPT-Live speaks and listens; every factual question is delegated
  // to the same grounded turn as a typed question (sources and navigation included).
  const voice=useRef<LiveVoice|null>(null),[voiceState,setVoiceState]=useState<VoiceState|null>(null),[voiceDetail,setVoiceDetail]=useState(""),[heard,setHeard]=useState(""),[said,setSaid]=useState(""),[remaining,setRemaining]=useState<number|null>(null);
  useEffect(()=>{const c=new AbortController();fetch("/api/portrait",{signal:c.signal}).then(r=>r.ok?r.json():null).then(v=>{if(v&&typeof v.label==="string")setCapability(v);}).catch(()=>{});return ()=>c.abort();},[]);
  const callbacks=useRef({onNavigate,onCancelMedia,onClose,onVoiceLevel,onVoiceStart});
  useEffect(()=>{callbacks.current={onNavigate,onCancelMedia,onClose,onVoiceLevel,onVoiceStart};},[onNavigate,onCancelMedia,onClose,onVoiceLevel,onVoiceStart]);
  const stop=()=>{
    const old=active.current;epoch.current++;old?.controller.abort();active.current=null;
    if(old)void fetch("/api/portrait",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"cancel",turnId:old.turnId}),keepalive:true}).catch(()=>{});
    setBusy(false);setAnswer(a=>a?{...a,navigation:undefined}:a);setStatus("Stopped. Your reading place is unchanged.");
  };
  const stopRef=useRef(stop);useEffect(()=>{stopRef.current=stop;});
  useEffect(()=>{if(cancelKey!==undefined&&active.current)stopRef.current();},[cancelKey]);
  useEffect(()=>()=>{active.current?.controller.abort();epoch.current++;void voice.current?.stop();callbacks.current.onVoiceLevel?.(null);},[]);
  const askRef=useRef<(value:string,options?:{spoken?:boolean;signal?:AbortSignal})=>Promise<PortraitAnswer|null>>(async()=>null);
  function startVoice(){
    if(voice.current)return;
    callbacks.current.onCancelMedia?.();callbacks.current.onVoiceStart?.();setHeard("");setSaid("");setVoiceDetail("");setRemaining(null);
    const v=voice.current=new LiveVoice({
      state:(state,detail)=>{setVoiceState(state);setVoiceDetail(detail?.startsWith("allowance:")?describeNotice(detail.slice(10)):detail??"");},
      caption:(role,value)=>role==="visitor"?setHeard(value):setSaid(value),
      delegate:async(q,signal)=>{const result=await askRef.current(q,{spoken:true,signal});if(!result)throw Error("No answer");return result.text;},
      level:read=>callbacks.current.onVoiceLevel?.(read),
      remaining:setRemaining,
      ended:()=>{voice.current=null;callbacks.current.onVoiceLevel?.(null);},
    });
    void v.start();
  }
  const endVoice=()=>{void voice.current?.stop();};
  async function navigate(value:PortraitAnswer){
    const intent=value.navigation,run=active.current;
    if(!intent||!value.navigationProof||!run||run.turnId!==intent.turnId||run.controller.signal.aborted||handled.current.has(intent.intentId))return;
    handled.current.add(intent.intentId);
    try{
      const response=await fetch("/api/portrait",{method:"POST",signal:run.controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"navigate",intent,proof:value.navigationProof,direct:scene?.volumeId})});
      if(!response.ok)throw Error("This destination is no longer available.");
      if(run.epoch!==epoch.current||run.controller.signal.aborted)return;
      const ack=await callbacks.current.onNavigate(intent,run.controller.signal);
      if(run.epoch!==epoch.current||run.controller.signal.aborted)return;
      setStatus(ack==="success"?`Opened ${intent.label}.`:ack==="cancelled"?"Navigation cancelled.":"That destination is unavailable. Your reading place is unchanged.");
    }catch(e){if(!run.controller.signal.aborted)setStatus(e instanceof Error?e.message:"Navigation unavailable.");}
  }
  async function ask(value:string,options:{spoken?:boolean;signal?:AbortSignal}={}):Promise<PortraitAnswer|null>{
    if(!value.trim())return null;
    stop();if(!options.spoken)callbacks.current.onCancelMedia?.();
    let delivered:PortraitAnswer|null=null;
    const run={controller:new AbortController(),turnId:crypto.randomUUID(),epoch:++epoch.current};active.current=run;
    options.signal?.addEventListener("abort",()=>run.controller.abort(),{once:true});
    setQuestion(value);setBusy(true);setText("");setAnswer(null);setSources(null);setReflection(null);setStatus("Consulting the material in the library…");
    const start=performance.now();let first:number|undefined;
    try{
      const response=await fetch("/api/portrait",{method:"POST",signal:run.controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"turn",turnId:run.turnId,question:value,scene,contextId:context.current,context:memory.current,...(options.spoken?{spoken:true}:{})})});
      if(!response.ok){const data=await response.json();throw Error(data.error??"Conversation unavailable.");}
      const reader=response.body!.getReader(),decoder=new TextDecoder();let buffer="",received=0;
      for(;;){const next=await reader.read();if(next.done)break;if(run.epoch!==epoch.current)return null;received+=next.value.length;if(received>64000)throw Error("Answer exceeded its delivery allowance.");buffer+=decoder.decode(next.value,{stream:true});
        for(;;){const end=buffer.indexOf("\n");if(end<0)break;const event=JSON.parse(buffer.slice(0,end)) as PortraitEvent;buffer=buffer.slice(end+1);
          if(event.type==="text"){first??=performance.now()-start;setText(t=>t+event.text);}
          else if(event.type==="complete"){
            const result={...event.answer,firstTextMs:first??performance.now()-start,fullAnswerMs:performance.now()-start};delivered=result;setAnswer(result);setText(result.text);setStatus(describeNotice(result.notice));
            context.current=result.navigation?.targetId??context.current;memory.current=result.context;setTurns(n=>result.context?n+1:0);setBusy(false);
            if(result.navigationRequested)await navigate(result);
          }
        }
      }
    }catch(e){if(!run.controller.signal.aborted)setStatus(e instanceof Error?e.message:"Conversation unavailable.");if(options.spoken)throw e;}
    finally{if(run.epoch===epoch.current)setBusy(false);}
    return delivered;
  }
  useEffect(()=>{askRef.current=ask;});
  async function inspect(){
    const run=active.current;if(!answer||!run)return;setSources(null);
    // Library passages are re-projected by the server; live web results are external links.
    const web=answer.citations.filter(c=>c.claimKind==="web-search-result"),ids=answer.citations.filter(c=>c.claimKind!=="web-search-result").map(c=>c.id);
    try{let library:Citation[]=[];if(ids.length){const response=await fetch("/api/portrait",{method:"POST",signal:run.controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"sources",ids,direct:scene?.volumeId})});if(!response.ok)throw Error();library=(await response.json()).citations;}if(run.epoch===epoch.current&&!run.controller.signal.aborted)setSources([...library,...web]);}
    catch{if(run.epoch===epoch.current&&!run.controller.signal.aborted){setSources([]);setText("One or more sources are no longer available. Ask again to consult the current collection.");setAnswer(null);}}
  }
  return <aside className={"portrait-panel"} aria-label="Ask Judge Overton" onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();event.preventDefault();stop();endVoice();callbacks.current.onClose?.();}}}>
    <header className={"portrait-header"}><div><span className={"portrait-eyebrow"}>A conversation in the library</span><h2>Ask Judge Overton</h2></div>{onClose&&<button type="button" onClick={()=>{stop();endVoice();onClose();}} aria-label="Close conversation">×</button>}</header>
    <p className={"portrait-disclosure"}>{DISCLOSURE}</p>
    <p className={"portrait-meta"}>{capability?.label??"Checking how this portrait answers…"}</p>
    {capability?.voice&&<section className={"portrait-voice"} aria-label="Spoken conversation">
      {voiceState&&!["ended","error"].includes(voiceState)
        ?<button type="button" className={"portrait-voice-button active"} onClick={endVoice}>End spoken conversation</button>
        :<button type="button" className={"portrait-voice-button"} onClick={startVoice}>Speak with the Judge</button>}
      <p className={"portrait-voice-state"} role="status" aria-live="polite">{voiceState?voiceLabels[voiceState]:"Talk aloud with the portrait; he answers in his own voice and consults the same sources."}{remaining!==null&&voiceState&&!["ended","error","closing"].includes(voiceState)?` · ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")} left`:""}{voiceDetail?` ${voiceDetail}`:""}</p>
      {heard&&<p className={"portrait-voice-caption"}><span>You</span>{heard}</p>}
      {said&&<p className={"portrait-voice-caption"}><span>The Judge</span>{said}</p>}
      <small>Uses your microphone only while the conversation is open (up to {Math.round(capability.voice.maxSeconds/60)} minutes). Audio goes directly to {capability.voice.model} through Vercel AI Gateway and is not stored by this site.</small>
    </section>}
    <div className={"portrait-suggestions"} aria-label="Suggested questions">{suggestions.map(s=><button type="button" key={s} onClick={()=>void ask(s)}>{s}</button>)}</div>
    <form onSubmit={e=>{e.preventDefault();void ask(question);}} className={"portrait-form"}>
      <label htmlFor="portrait-question">Your question</label>
      <textarea id="portrait-question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={1200} rows={3} placeholder="Ask about a project, the historical record, or AI…"/>
      <div className={"portrait-actions"}><button type="submit" disabled={!question.trim() || capability?.available === false}>Ask</button><button type="button" onClick={stop} disabled={!active.current}>Stop</button>{turns>0&&<button type="button" onClick={()=>{stop();memory.current=undefined;context.current=undefined;setTurns(0);setText("");setAnswer(null);setSources(null);setStatus("Started a new conversation.");}}>Start over</button>}<span>{question.length}/1,200</span></div>
    </form>
    <div role="status" aria-live="polite" className={"portrait-status"}>{busy?"Reading the evidence…":status}</div>
    {text&&<article className={"portrait-answer"}><h3>The portrait replies</h3>{text.split(/\n{2,}/).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</article>}
    {answer&&<>
      <p className={"portrait-meta"}>{answer.mode==="mock"?"Deterministic rehearsal · no live model":answer.mode==="live"?`Generated by ${answer.model} · claims checked against the sources below`:"Reviewed excerpts · no generated reply"}</p>
      <details className={"portrait-meta"}><summary>Conversation diagnostics</summary><p>{answer.model} · {answer.costUsd===null?"charge unresolved":`$${answer.costUsd.toFixed(6)}`} · first text {(answer.firstTextMs/1000).toFixed(2)}s / complete {(answer.fullAnswerMs/1000).toFixed(2)}s</p></details>
      {answer.resetAt&&<p>Available again after {new Date(answer.resetAt).toLocaleString()}.</p>}
      {answer.navigation&&<button type="button" className={"portrait-destination"} onClick={()=>void navigate(answer)}>Open {answer.navigation.label}</button>}
      {!!answer.citations.length&&<button type="button" onClick={()=>void inspect()}>Inspect {answer.citations.length} source{answer.citations.length===1?"":"s"}</button>}
    </>}
    {sources&&<section className={"portrait-sources"} aria-label="Verified sources">{sources.map(source=><details key={source.id} open><summary>{source.title}</summary><p>{source.text}</p><small>{source.claimKind==="web-search-result"?"live web result · not reviewed":source.claimKind.replaceAll("-"," ")} · {source.claimKind==="web-search-result"?"found":"checked"} {source.checkedAt} · {source.sourceLocator}{source.expiresAt?` · expires ${source.expiresAt.slice(0,10)}`:""}</small><details><summary>Source record</summary><small>Revision {source.sourceRevision}</small></details>{source.sourceUrlOrInternalRef.startsWith("https://")&&<a href={source.sourceUrlOrInternalRef} target="_blank" rel="noopener noreferrer">Read original source ↗</a>}</details>)}</section>}
    <details className={"portrait-reflections"}><summary>Authored reflections · always available</summary><p>Original dramatic writing, awaiting voice review. Read silently; no audio is generated.</p><div className={"portrait-suggestions"}>{reflections.map(r=><button key={r.id} type="button" onClick={()=>{stop();setReflection(r.text);}}>{r.title}</button>)}</div>{reflection&&<p>{reflection}</p>}</details>
    <footer className={"portrait-footer"}>Only this turn is displayed. For follow-ups, the last two exchanges travel sealed with this page for 30 minutes; nothing is saved on the server beyond hashed metering. No microphone or automatic speech.</footer>
  </aside>;
}
