// Rehearses the existing loopback office only; never starts/stops it or enables paid calls.
import {writeFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import assert from "node:assert/strict";
const url="http://127.0.0.1:3078/api/portrait";
let cookie="";
async function post(body,extra={}){
 const start=performance.now();
 const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",Origin:"http://127.0.0.1:3078",...(cookie?{Cookie:cookie}:{}),...extra},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
 const set=response.headers.get("set-cookie");if(set)cookie=set.split(";")[0];
 let firstTextMs=null,answer=null,buffer="";
 if(response.headers.get("content-type")?.includes("ndjson")){
  const reader=response.body.getReader(),decoder=new TextDecoder();
  for(;;){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});for(;;){const end=buffer.indexOf("\n");if(end<0)break;const event=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);if(event.type==="text")firstTextMs??=performance.now()-start;else answer=event.answer;}}
 }else answer=await response.json();
 return {status:response.status,firstTextMs,fullAnswerMs:performance.now()-start,answer};
}
const output=[];
for(const q of ["Could you have used Harvey when writing the Overton Papers?","Show me Knowledge Services architecture","What did John do for go-wipe?"]){
 const result=await post({kind:"turn",turnId:randomUUID(),question:q});assert.equal(result.status,200);assert.equal(result.answer.mode,"mock");assert.equal(result.answer.costUsd,0);assert(result.answer.citations.length);output.push({question:q,...result});
 if(result.answer.navigation){const nav={kind:"navigate",intent:result.answer.navigation,proof:result.answer.navigationProof};assert.equal((await post(nav)).status,200);assert.equal((await post(nav)).status,409);}
 const sources=await post({kind:"sources",ids:result.answer.citations.map(c=>c.id)});assert.equal(sources.status,200);
}
const denied=await post({kind:"turn",turnId:randomUUID(),question:"One more question"});assert.equal(denied.answer.mode,"fallback");assert.equal(denied.answer.notice,"minute");
assert.equal((await post({kind:"turn",turnId:randomUUID(),question:"private",preview:true})).status,400);
assert.equal((await post({kind:"sources",ids:["forged"]})).status,503);
const remote=await post({kind:"turn",turnId:randomUUID(),question:"Show me Knowledge Services"},{"x-forwarded-for":"203.0.113.9"});assert.notEqual(remote.answer.mode,"mock");
await writeFile("content/portrait/http-proof.json",JSON.stringify({testedAt:new Date().toISOString(),qualification:"existing loopback office; deterministic mock only; no paid calls",turns:output,quota:"fourth request denied",navigation:"validated then replay rejected",forgery:"preview flag and unknown citation denied",remote:"local-office privilege denied for forwarded remote address"},null,2)+"\n");
console.log(output.map(x=>({question:x.question,model:x.answer.model,costUsd:x.answer.costUsd,firstTextMs:x.firstTextMs,fullAnswerMs:x.fullAnswerMs,citations:x.answer.citations.map(c=>c.id)})));
