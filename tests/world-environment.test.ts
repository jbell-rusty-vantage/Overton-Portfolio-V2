import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { readFile } from "node:fs/promises";
import { Controller } from "../components/estate/world/engine/controller";
import { DEFAULT_ENVIRONMENT, Environment, environmentPalette, environmentState } from "../components/estate/world/engine/environment";

test("environment input keeps valid preferences and rejects unsupported values", () => {
  const chosen=environmentState(DEFAULT_ENVIRONMENT,{daylight:"dusk",season:"autumn",sound:true});
  assert.deepEqual(chosen,{daylight:"dusk",season:"autumn",sound:true});
  assert.deepEqual(environmentState(chosen,JSON.parse('{"daylight":"midnight","season":"rain","sound":"yes"}')),chosen);
  assert.ok(environmentPalette(chosen).strength<environmentPalette(DEFAULT_ENVIRONMENT).strength);
  assert.equal(DEFAULT_ENVIRONMENT.sound,false);
});

test("atmosphere is silent until opted in; suspension preserves preference", async () => {
  let created=0,closed=0;
  const gains:number[]=[];
  const node=()=>({connect(){return this;},disconnect(){},start(){},stop(){},gain:{value:0,setTargetAtTime(v:number){gains.push(v);}},frequency:{value:0}});
  const previous=Object.getOwnPropertyDescriptor(globalThis,"AudioContext");
  Object.defineProperty(globalThis,"AudioContext",{configurable:true,value:class {
    currentTime=0;sampleRate=8;destination={};
    constructor(){created++;}
    createGain(){return node();} createBufferSource(){return node();} createBiquadFilter(){return node();}
    createBuffer(){return {getChannelData(){return new Float32Array(16);}};}
    async resume(){} async close(){closed++;}
  }});
  const sun=new THREE.DirectionalLight();let applied=0;
  const env=new Environment(sun,()=>applied++,()=>{});
  try {
    assert.equal(created,0);
    await env.set({season:"autumn"});assert.equal(created,0);
    await env.set({sound:true});assert.equal(created,1);assert.equal(gains.at(-1),.16);
    env.suspend(true);assert.equal(gains.at(-1),0);assert.equal(env.state().sound,true);
    env.suspend(false);assert.equal(gains.at(-1),.16);
    await env.set({sound:false});assert.equal(gains.at(-1),0);assert.equal(created,1);
    assert.equal(applied,3);
  } finally { env.dispose();if(previous)Object.defineProperty(globalThis,"AudioContext",previous);else Reflect.deleteProperty(globalThis,"AudioContext"); }
  assert.equal(closed,1);
});

test("cancelTravel preserves pose/place and never emits a false arrival", () => {
  const descriptors = new Map(["window","document"].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  Object.defineProperty(globalThis,"window",{configurable:true,value:new EventTarget()});
  Object.defineProperty(globalThis,"document",{configurable:true,value:Object.assign(new EventTarget(),{activeElement:null,pointerLockElement:null})});
  const dom=Object.assign(new EventTarget(),{isConnected:true}) as unknown as HTMLElement;
  const controller=new Controller(new THREE.PerspectiveCamera(),dom,false);
  let arrivals=0;const travel:boolean[]=[];
  controller.onArrive=()=>arrivals++;controller.onTravel=v=>travel.push(v);
  try {
    controller.go("library");
    for(let i=0;i<10;i++)controller.update(.1);
    assert.equal(controller.travelling,true);
    const before=controller.pose(),place=controller.place;
    controller.cancelTravel();controller.cancelTravel();
    for(let i=0;i<30;i++)controller.update(.1);
    assert.equal(arrivals,0);assert.equal(controller.place,place);assert.deepEqual(travel,[true,false]);
    assert.deepEqual(controller.pose(),before);
    assert.equal(controller.debug().pending,false);assert.equal(controller.debug().resting,true);
    // A later deliberate journey still works.
    controller.go("entry");controller.skip();assert.equal(arrivals,1);
  } finally {controller.dispose();for(const [k,d] of descriptors)if(d)Object.defineProperty(globalThis,k,d);else Reflect.deleteProperty(globalThis,k);}
});

test("packed room assets retain the survey ceiling and single authored room roots",async()=>{
 const manifest=JSON.parse(await readFile("assets/travellers-rest/kit/manifest.json","utf8"));
 const room=manifest.nodes.find((n:{name:string})=>n.name==="room.shell");
 assert.ok(room);assert.equal(room.role,"placed");
 assert.ok(Math.abs(room.bounds.max[1]-3.80)<.002);
 for(const name of ["room.joinery","desk.study"])assert.ok(manifest.nodes.some((n:{name:string})=>n.name===name));
 assert.equal(manifest.nodes.filter((n:{name:string})=>n.name.startsWith("room.")).length,2);
});

test("stair route ascends, interrupts safely and returns via the stair", () => {
  const descriptors=new Map(["window","document"].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  Object.defineProperty(globalThis,"window",{configurable:true,value:new EventTarget()});
  Object.defineProperty(globalThis,"document",{configurable:true,value:Object.assign(new EventTarget(),{activeElement:null,pointerLockElement:null})});
  const controller=new Controller(new THREE.PerspectiveCamera(),Object.assign(new EventTarget(),{isConnected:true}) as unknown as HTMLElement,false);
  const finish=()=>{for(let i=0;i<1600&&controller.travelling;i++)controller.update(.025);assert.equal(controller.travelling,false);};
  try {
    controller.snap("library");controller.visitLanding();
    const heights:number[]=[];for(let i=0;i<1600&&controller.travelling;i++){controller.update(.025);heights.push(controller.camera.position.y);}
    assert.equal(controller.level,"landing");assert.ok(Math.abs(controller.camera.position.y-5.42)<.001);
    assert.ok(heights.some(y=>y>3&&y<4));assert.ok(heights.every((y,i)=>!i||Math.abs(y-heights[i-1])<.15),"no floor teleport");
    assert.equal(controller.walk(1.8,-2.288),false,"upper boundary blocks walking into unrecorded rooms");
    controller.go("entry");finish();assert.equal(controller.level,"ground");
    controller.visitLanding();
    for(let i=0;i<800&&controller.level==="ground";i++)controller.update(.025);
    assert.equal(controller.level,"stairs");controller.cancelTravel();const pose=controller.pose();controller.update(.1);assert.deepEqual(controller.pose(),pose);
    controller.go("library");finish();assert.equal(controller.level,"ground");assert.ok(controller.camera.position.y<2.3);
  }finally{controller.dispose();for(const[k,d]of descriptors)if(d)Object.defineProperty(globalThis,k,d);else Reflect.deleteProperty(globalThis,k);}
});
import { Stairway, STAIR } from "../components/estate/world/engine/stairway";
test("manual stair movement stays within the corridor and landing guards",()=>{
 const stair=new Stairway();let p:{x:number;z:number}={x:STAIR.foot.x,z:.6};
 for(const goal of stair.ascend())for(let i=0;i<100&&Math.hypot(goal.x-p.x,goal.z-p.z)>.01;i++){
  const d=Math.hypot(goal.x-p.x,goal.z-p.z),step=Math.min(.04,d);
  const next=stair.move(p,(goal.x-p.x)*step/d,(goal.z-p.z)*step/d);
  p=next??{x:p.x+(goal.x-p.x)*step/d,z:p.z+(goal.z-p.z)*step/d};
 }
 assert.equal(stair.level,"landing");assert.ok(stair.height(p)>3.7);
 for(let i=0;i<80;i++)p=stair.move(p,.2,.1)!;
 assert.ok(p.x<=STAIR.bounds.x1-.28+.00001);assert.ok(p.z<=STAIR.bounds.z1-.28+.00001);
 // Return to the opening, then reverse the same physical path.
 const center=STAIR.landing;
 for(let i=0;i<100&&Math.hypot(center.x-p.x,center.z-p.z)>.01;i++){const d=Math.hypot(center.x-p.x,center.z-p.z);p=stair.move(p,(center.x-p.x)*Math.min(.04,d)/d,(center.z-p.z)*Math.min(.04,d)/d)!;}
 for(const goal of stair.descend(new THREE.Vector3(p.x,5.42,p.z)))for(let i=0;i<100&&Math.hypot(goal.x-p.x,goal.z-p.z)>.01;i++){
  const d=Math.hypot(goal.x-p.x,goal.z-p.z);p=stair.move(p,(goal.x-p.x)*Math.min(.04,d)/d,(goal.z-p.z)*Math.min(.04,d)/d)!;
 }
 p=stair.move(p,0,.08)??{x:p.x,z:p.z+.08};assert.equal(stair.level,"ground");assert.ok(p.z>=.48);
});
