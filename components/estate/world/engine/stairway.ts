/** The measured stair and a bounded reconstructed landing, not an invented upper
 * floor plan. Metres in house coordinates. The ramp follows the 8 + 3 + 5 risers;
 * smoothing eye height does not turn the stair into a teleport.
 */
import * as THREE from "three";
export type FloorLevel = "ground" | "stairs" | "landing";
type Point = {x:number;z:number};
export const STAIR = { floor:.53, upper:3.80, eye:1.62, halfWidth:.51, foot:{x:-.91,z:.48}, landing:{x:1.22,z:-2.288}, bounds:{x0:.73,x1:1.81,z0:-2.798,z1:-1.778} } as const;
const path: THREE.Vector3[] = [new THREE.Vector3(-.91,.53,.48),new THREE.Vector3(-.91,.53,.03),new THREE.Vector3(-.91,.53+8*3.27/16,-1.778)];
for(let i=1;i<=12;i++) {const t=i/12,a=Math.PI-t*Math.PI/2;path.push(new THREE.Vector3(-.4+.51*Math.cos(a),.53+(8+3*t)*3.27/16,-1.778-.51*Math.sin(a)));}
path.push(new THREE.Vector3(.73,3.80,-2.288));
const lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z));
const eye=(p:THREE.Vector3)=>p.clone().add(new THREE.Vector3(0,STAIR.eye,0));
function closest(p:Point) {
 let best={distance:Infinity,index:0,t:0,along:0,point:path[0].clone()};
 for(let i=0;i<path.length-1;i++){
  const a=path[i],b=path[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=THREE.MathUtils.clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/l2,0,1),q=a.clone().lerp(b,t),distance=Math.hypot(p.x-q.x,p.z-q.z);
  if(distance<best.distance)best={distance,index:i,t,along:lengths[i]+Math.sqrt(l2)*t,point:q};
 }
 return best;
}
export class Stairway {
 level:FloorLevel="ground";
 get active(){return this.level!=="ground";}
 reset(){this.level="ground";}
 reconcile(p:THREE.Vector3){
  const b=STAIR.bounds,q=closest(p);
  this.level=p.y>STAIR.upper+STAIR.eye-.3&&p.x>=b.x0-.01&&p.x<=b.x1&&p.z>=b.z0&&p.z<=b.z1?"landing":q.distance<.3&&q.along>.04&&p.y>2.1?"stairs":"ground";
 }
 height(p:Point){return this.level==="landing"?STAIR.upper:closest(p).point.y;}
 /** Returns null when the ordinary ground-floor collision remains responsible. */
 move(from:Point,dx:number,dz:number,radius=.28):Point|null {
  const p={x:from.x+dx,z:from.z+dz},margin=STAIR.halfWidth-radius,b=STAIR.bounds;
  if(this.level==="ground"){
   if(!(dz<0&&from.z>=.36&&from.z<.8&&p.z<=.48&&Math.abs(p.x-STAIR.foot.x)<=margin))return null;
   this.level="stairs";
  }
  if(this.level==="landing"){
   if(p.x<=b.x0+radius&&dx<0&&Math.abs(p.z-STAIR.landing.z)<=margin)this.level="stairs";
   else return {x:THREE.MathUtils.clamp(p.x,Math.abs(p.z-STAIR.landing.z)<=margin?b.x0:b.x0+radius,b.x1-radius),z:THREE.MathUtils.clamp(p.z,b.z0+radius,b.z1-radius)};
  }
  if(p.x>b.x0&&Math.abs(p.z-STAIR.landing.z)<=margin){this.level="landing";return {x:Math.min(p.x,b.x1-radius),z:THREE.MathUtils.clamp(p.z,b.z0+radius,b.z1-radius)};}
  if(p.z>=.48&&Math.abs(p.x-STAIR.foot.x)<=margin){this.level="ground";return p;}
  const q=closest(p),scale=q.distance>margin?margin/q.distance:1;
  // End caps cannot be crossed sideways into the void beside the stair.
  return {x:q.point.x+(p.x-q.point.x)*scale,z:q.point.z+(p.z-q.point.z)*scale};
 }
 /** Eye-height points from the current stair/landing pose to its foot. */
 descend(from:THREE.Vector3){
  const q=closest(from),out=[from.clone(),eye(q.point)];
  for(let i=q.index;i>=0;i--)out.push(eye(path[i]));
  return out;
 }
 /** Caller prepends a ground collision route to the foot when on the ground. */
 ascend(from?:THREE.Vector3){
  const q=from?closest(from):null,out=from?[from.clone(),eye(q!.point)]:[eye(path[0])];
  for(let i=q?q.index+1:1;i<path.length;i++)out.push(eye(path[i]));
  out.push(new THREE.Vector3(STAIR.landing.x,STAIR.upper+STAIR.eye,STAIR.landing.z));
  return out;
 }
 landingTarget(p:Point,radius=.28){const b=STAIR.bounds;return p.x>=b.x0+radius&&p.x<=b.x1-radius&&p.z>=b.z0+radius&&p.z<=b.z1-radius;}
}
