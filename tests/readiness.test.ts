import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { prepareScene } from '../components/estate/world/engine/readiness';

function fixture() {
  const scene=new THREE.Scene(), texture=new THREE.Texture({width:1,height:1}), material=new THREE.MeshBasicMaterial({map:texture});
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(),material);scene.add(mesh);
  let signalled=false, deleted=0;const events:string[]=[];
  const gl={SYNC_GPU_COMMANDS_COMPLETE:1,ALREADY_SIGNALED:2,CONDITION_SATISFIED:3,WAIT_FAILED:4,
    fenceSync(){events.push('fence');return {};},flush(){events.push('flush');},
    clientWaitSync(): number {return signalled?2:0;},isContextLost(){return false;},deleteSync(){deleted++;}};
  const renderer={getContext:()=>gl,info:{programs:[{}]},initTexture(t:THREE.Texture){assert.equal(t,texture);events.push('texture');},
    async compileAsync(){events.push('compile');},render(){assert.equal(mesh.frustumCulled,false);events.push('render');}} as unknown as THREE.WebGLRenderer;
  return {scene,mesh,renderer,events,signal:()=>{signalled=true;},deleted:()=>deleted,gl};
}
test('readiness waits for actual submitted GPU work before restoring culling and resolving',async()=>{
  const f=fixture();let resolved=false;
  const preparing=prepareScene(f.renderer,f.scene,new THREE.PerspectiveCamera(),()=>false).then(r=>{resolved=true;return r;});
  await new Promise(r=>setTimeout(r,15));assert.equal(resolved,false);assert.equal(f.mesh.frustumCulled,false);
  f.signal();const result=await preparing;
  assert.deepEqual(f.events,['texture','compile','render','fence','flush']);assert.equal(result.textures,1);assert.equal(result.programs,1);
  assert.equal(f.mesh.frustumCulled,true);assert.equal(f.deleted(),1);
});
test('failed GPU preparation rejects and releases fence/culling state',async()=>{
  const f=fixture();f.gl.clientWaitSync=()=>4;
  await assert.rejects(prepareScene(f.renderer,f.scene,new THREE.PerspectiveCamera(),()=>false),/did not complete/);
  assert.equal(f.mesh.frustumCulled,true);assert.equal(f.deleted(),1);
});
test('unmount during preparation stops waiting and releases the GPU fence',async()=>{
  const f=fixture();let disposed=false;const preparing=prepareScene(f.renderer,f.scene,new THREE.PerspectiveCamera(),()=>disposed);
  await new Promise(r=>setTimeout(r,15));disposed=true;await preparing;
  assert.equal(f.mesh.frustumCulled,true);assert.equal(f.deleted(),1);
});
