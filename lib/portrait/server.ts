import "server-only";
import { cookies, headers } from "next/headers";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { getAdmin } from "@/lib/auth/session";
import { isLocalOffice } from "@/lib/auth/local-office";
import { getCollection } from "@/lib/library/catalog";
import { db } from "@/lib/db";
import { hash, projectEvidence, staticEvidence } from "./evidence";
import { PostgresStore, LocalMockStore, type Transaction } from "./storage";
import { Ledger, paidConfig, rehearsalLimits } from "./ledger";
import { DeterministicProvider } from "./provider";
import { GatewayAgent } from "./agent";
import { voiceConfig } from "./voice";
import { sessionCookie, sign } from "./security";

export async function authorizedCorpus(direct?:string){
  const admin=await getAdmin(),preview=!!admin&&!admin.mustChangePassword;
  const base=await getCollection({database:true,admin:preview});
  // getCollection's starter preview is NOT an authentication grant.
  const permitted=(source:string)=>preview||source==="database";
  let volumes=permitted(base.source)?base.volumes:[];
  if(direct){const explicit=await getCollection({database:true,admin:preview,direct});if(permitted(explicit.source)){const v=explicit.volumes.find(v=>v.slug===direct);if(v&&!volumes.some(x=>x.slug===v.slug))volumes=[...volumes,v];}}
  return {preview,volumes,evidence:[...staticEvidence(preview),...projectEvidence(volumes,preview)]};
}
const transaction:Transaction=async fn=>db.$transaction(async tx=>fn({query:async(sql,args=[])=>{
  if(sql.startsWith("SELECT"))return {rows:await tx.$queryRawUnsafe<Record<string,unknown>[]>(sql,...args)};
  await tx.$executeRawUnsafe(sql,...args);return {rows:[]};
}}),{maxWait:2000,timeout:5000});
/** What the panel may truthfully say about this server, without cookies or secrets. */
export function capability(){
  const env=process.env,config=paidConfig(env);
  if(env.PORTRAIT_KILL_SWITCH==="1")return {available:false,live:false,label:"Conversation paused · authored reflections remain"};
  if(env.NODE_ENV==="production"&&(!env.PORTRAIT_SESSION_SECRET||env.PORTRAIT_SESSION_SECRET.length<32))return {available:false,live:false,label:"Conversation unavailable · the books and authored reflections remain available"};
  const voice=voiceConfig(env);
  return config?{live:true,model:config.price.model,webSearch:(config.price.webSearchUsdPerCall??0)>0,voice:voice?{model:voice.model,maxSeconds:voice.maxSeconds}:null,label:`Live replies · ${config.price.model} via Vercel AI Gateway · checked against cited sources`}
    :{live:false,label:"Scripted replies and reviewed source excerpts · live model not enabled"};
}
export async function runtime(){
  const h=await headers(),local=isLocalOffice(h),env=process.env,config=paidConfig(env);
  const localDir=join(tmpdir(),`overton-portrait-mock-${hash(process.cwd()).slice(0,12)}`);
  let secret=env.PORTRAIT_SESSION_SECRET;
  if(!secret&&local){await mkdir(localDir,{recursive:true});const file=join(localDir,"session-secret");try{await writeFile(file,randomBytes(32).toString("base64url"),{flag:"wx",mode:0o600});}catch(e){if((e as NodeJS.ErrnoException).code!=="EEXIST")throw e;}secret=await readFile(file,"utf8");}
  if(!secret||secret.length<32)throw Error("Portrait session signing is unavailable");
  const jar=await cookies(),session=sessionCookie(jar.get("portrait_session")?.value,secret);
  if(session.fresh)jar.set("portrait_session",session.value,{httpOnly:true,secure:env.NODE_ENV==="production",sameSite:"strict",path:"/api/portrait",maxAge:86400});
  const paid=!!config;
  const store=local&&!paid?new LocalMockStore(localDir):new PostgresStore(transaction);
  // No untrusted forwarding headers. Until a deployment supplies a trusted address
  // adapter, remote visitors conservatively share one secondary network bucket.
  const network=sign(`${new Date().toISOString().slice(0,10)}:${local?"loopback-office":"remote-shared"}`,secret);
  // Live answers: GPT via Vercel AI Gateway with the existing server-only AI_GATEWAY_API_KEY.
  const agent=paid?new GatewayAgent(config!.price.model,env.AI_GATEWAY_API_KEY!,(config!.price.webSearchUsdPerCall??0)>0):undefined;
  return {secret,session:session.id,network,store,ledger:new Ledger(store),caps:config?.caps??rehearsalLimits,price:config?.price,provider:new DeterministicProvider(),agent,local,killed:env.PORTRAIT_KILL_SWITCH==="1"};
}
