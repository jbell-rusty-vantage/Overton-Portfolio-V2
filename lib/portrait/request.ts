import { z } from "zod";
const id=z.string().min(1).max(160).regex(/^[a-zA-Z0-9_:.-]+$/);
const scene=z.object({place:z.string().max(80).optional(),volumeId:id.optional(),sectionId:id.optional(),returnMarker:z.string().max(160).optional()}).strict();
const navigation=z.object({intentId:z.string().uuid(),turnId:z.string().uuid(),targetId:id,mode:z.enum(["focus","book","report"]),sectionId:id.optional(),label:z.string().max(300)}).strict();
export function sameOriginRequest(request:Request){
  try{const origin=request.headers.get("origin");return (!origin||new URL(origin).host===request.headers.get("host"))&&request.headers.get("sec-fetch-site")!=="cross-site";}catch{return false;}
}
export const requestSchema=z.discriminatedUnion("kind",[
  z.object({kind:z.literal("turn"),turnId:z.string().uuid(),question:z.string().min(1).max(1200),scene:scene.optional(),contextId:id.optional(),context:z.string().max(9000).regex(/^[A-Za-z0-9_-]+$/).optional(),spoken:z.boolean().optional()}).strict(),
  z.object({kind:z.literal("navigate"),intent:navigation,proof:z.string().max(200),direct:id.optional()}).strict(),
  z.object({kind:z.literal("cancel"),turnId:z.string().uuid()}).strict(),
  z.object({kind:z.literal("sources"),ids:z.array(id).max(8),direct:id.optional()}).strict(),
]);
/** Read with a byte ceiling before JSON parsing, even when Content-Length is absent. */
/** Question 1,200 chars + sealed follow-up context 9,000 chars + framing. */
export const REQUEST_BYTES=16000;
export const voiceSchema=z.discriminatedUnion("kind",[
  z.object({kind:z.literal("start")}).strict(),
  z.object({kind:z.literal("end"),voiceId:z.string().uuid(),seconds:z.number().nonnegative().max(7200).optional()}).strict(),
]);
export async function readVoiceRequest(request:Request){return voiceSchema.parse(JSON.parse(await readBody(request)));}
export async function readRequest(request:Request){return requestSchema.parse(JSON.parse(await readBody(request)));}
async function readBody(request:Request){
  if(Number(request.headers.get("content-length"))>REQUEST_BYTES)throw Error("Request too large");
  const reader=request.body?.getReader();if(!reader)throw Error("Missing body");let size=0;const chunks:Uint8Array[]=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>REQUEST_BYTES)throw Error("Request too large");chunks.push(value);}}finally{await reader.cancel();}
  return Buffer.concat(chunks).toString("utf8");
}
