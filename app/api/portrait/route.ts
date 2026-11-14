import { authorizedCorpus, capability, runtime } from "@/lib/portrait/server";
import { openContext, reauthorize, sealContext } from "@/lib/portrait/memory";
import { readRequest, sameOriginRequest } from "@/lib/portrait/request";
import { runTurn, validateNavigation } from "@/lib/portrait/conversation";
import { citations } from "@/lib/portrait/evidence";
import { consumeNavigation, navigationProof } from "@/lib/portrait/security";
import { ALLOWANCE, FALLBACK, type PortraitEvent } from "@/lib/portrait/contracts";
const privateHeaders={"Cache-Control":"private, no-store, max-age=0","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
export async function GET(request:Request){
  if(!sameOriginRequest(request))return Response.json({error:"Unavailable"},{status:403,headers:privateHeaders});
  return Response.json(capability(),{headers:privateHeaders});
}
export async function POST(request:Request){
  // Require same-origin browser requests, and reject cross-site fetch metadata.
  if(!sameOriginRequest(request))return Response.json({error:"Unavailable"},{status:403,headers:privateHeaders});
  let input;try{input=await readRequest(request);}catch{return Response.json({error:"Invalid or oversized portrait request"},{status:400,headers:privateHeaders});}
  try{
    const r=await runtime();
    if(input.kind==="cancel"){
      await r.store.update(s=>{const turn=s.turns.find(t=>t.id===`${r.session}:${input.turnId}`);if(turn)turn.navigationConsumed=true;});
      return Response.json({ok:true},{headers:privateHeaders});
    }
    if(r.killed)return Response.json({error:ALLOWANCE},{status:503,headers:privateHeaders});
    const direct=input.kind==="turn"?input.scene?.volumeId:input.direct;
    const corpus=await authorizedCorpus(direct);
    if(input.kind==="sources")return Response.json({citations:citations(input.ids,corpus.evidence)},{headers:privateHeaders});
    if(input.kind==="navigate"){
      const valid=validateNavigation(input.intent,corpus.volumes)&&await consumeNavigation(input.intent,input.proof,r.session,r.secret,r.store);
      return Response.json({ok:valid},{status:valid?200:409,headers:privateHeaders});
    }
    // Browser history text, summaries and citations are never trusted or retained.
    // Only identifiers are accepted, and each must resolve in this fresh projection.
    const contextId=corpus.volumes.some(v=>v.slug===input.contextId)?input.contextId:undefined;
    const scene=corpus.volumes.some(v=>v.slug===input.scene?.volumeId)?input.scene:undefined;
    // Follow-up memory is server-sealed to this session; earlier answers that drew on
    // since-withdrawn passages or books are dropped before the model sees them.
    const authorizedIds=(corpus:{evidence:{id:string}[];volumes:{slug:string}[]})=>new Set([...corpus.evidence.map(e=>e.id),...corpus.volumes.map(v=>`volume:${v.slug}`)]);
    const history=reauthorize(openContext(input.context,r.session,r.secret),authorizedIds(corpus));
    const {context:_ignored,...turn}=input;void _ignored;
    const answer=await runTurn({...turn,contextId,scene},{...r,...corpus,history,signal:request.signal});
    // Revalidate once more after provider latency, before disclosing any content. Web
    // results are not library records; they are shown as unreviewed external links.
    const fresh=await authorizedCorpus(direct);
    const freshIds=authorizedIds(fresh);
    if(answer.citations.some(c=>c.claimKind!=="web-search-result"&&!fresh.evidence.some(e=>e.id===c.id&&e.sourceRevision===c.sourceRevision))||(answer.exposed??[]).some(id=>!freshIds.has(id))){answer.text=FALLBACK;answer.citations=[];delete answer.navigation;answer.navigationRequested=false;answer.mode="fallback";answer.exposed=[];}
    if(answer.mode!=="fallback"&&answer.text!==ALLOWANCE)answer.context=sealContext([...history,{q:input.question,a:answer.text,ids:answer.exposed??[]}],r.session,r.secret);
    else if(history.length)answer.context=sealContext(history,r.session,r.secret);
    const trace=answer.trace;delete answer.exposed;delete answer.trace;
    if(r.local&&process.env.PORTRAIT_EVAL_TRACE==="1")answer.trace=trace;
    if(answer.navigation&&validateNavigation(answer.navigation,fresh.volumes))answer.navigationProof=navigationProof(answer.navigation,r.session,r.secret);
    else delete answer.navigation;
    const encoder=new TextEncoder();let at=0;
    const stream=new ReadableStream({pull(controller){
      if(request.signal.aborted){controller.close();return;}
      let event:PortraitEvent;
      if(at<answer.text.length){event={type:"text",text:answer.text.slice(at,at+180)};at+=180;}
      else{event={type:"complete",answer};controller.enqueue(encoder.encode(JSON.stringify(event)+"\n"));controller.close();return;}
      controller.enqueue(encoder.encode(JSON.stringify(event)+"\n"));
    }});
    return new Response(stream,{headers:{...privateHeaders,"Content-Type":"application/x-ndjson; charset=utf-8"}});
  }catch{return Response.json({error:"The conversation is unavailable. The books and authored reflections remain available."},{status:503,headers:privateHeaders});}
}
