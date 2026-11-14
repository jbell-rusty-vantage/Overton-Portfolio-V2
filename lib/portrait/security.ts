import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { AtomicStore } from "./ledger";
import type { NavigationIntent } from "./contracts";
export function sign(value:string,secret:string){return createHmac("sha256",secret).update(value).digest("base64url");}
export function sameSignature(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function sessionCookie(value:string|undefined,secret:string,now=Date.now()){
  const [id,expires,signature]=value?.split(".")??[];
  if(id&&expires&&signature&&Number(expires)>now&&Number(expires)<=now+86400000&&sameSignature(sign(`${id}.${expires}`,secret),signature))return {id,value:value!,fresh:false};
  const next=randomUUID(),expiry=now+86400000,payload=`${next}.${expiry}`;
  return {id:next,value:`${payload}.${sign(payload,secret)}`,fresh:true};
}
export function navigationProof(intent:NavigationIntent,session:string,secret:string,now=Date.now()){
  const expiry=now+120000;return `${expiry}.${sign(JSON.stringify({intent,session,expiry}),secret)}`;
}
export async function consumeNavigation(intent:NavigationIntent,proof:string,session:string,secret:string,store:AtomicStore,now=Date.now()){
  const [expiryText,signature]=proof.split("."),expiry=Number(expiryText);
  if(!signature||!Number.isFinite(expiry)||expiry<=now||expiry>now+120000||!sameSignature(sign(JSON.stringify({intent,session,expiry}),secret),signature))return false;
  return store.update(state=>{
    // Admission order is serialized; timestamps can tie across fast requests.
    const turn=state.turns.filter(t=>t.session===session&&t.kind!=="voice").at(-1);if(!turn||turn.id!==`${session}:${intent.turnId}`||turn.navigationConsumed||turn.status!=="settled")return false;
    turn.navigationConsumed=true;return true;
  });
}
