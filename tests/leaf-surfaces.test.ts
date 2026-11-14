import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Volume3D } from '../components/estate/world/engine/volume';

const prototype=Volume3D.prototype as unknown as {land(this:unknown,turned:boolean):void;picture(this:unknown,url:string):unknown};
for(const dir of [1,-1])test(`land ${dir} reuses exact leaf pixels and retains four distinct backing surfaces`,()=>{
 const left={id:'incoming-left'},right={id:'incoming-right'},old={id:'old'};
 const canvases=Object.fromEntries(['L','R','A','B'].map(k=>[k,{canvas:k}]));
 const textures=Object.fromEntries(['L','R','A','B'].map(k=>[k,{texture:k}]));
 const page=dir>0?'L':'R',leaf=dir>0?'B':'A',incoming=dir>0?left:right;
 const expectedCanvas=canvases[leaf],expectedTexture=textures[leaf];let done=false;
 const book={flip:{dir,after:{left,right},fractions:[.1,.3],done(v:boolean){done=v;}},
  leaf:{visible:true,material:{map:null}},leafBack:{visible:true,material:{map:null}},
  shown:{left:old,right:old},canvases,textures,printed:{[leaf]:{sheet:incoming,side:dir>0?'left':'right'}},
  fraction:.1,stale:false,paintStatic(){assert.equal(this.canvases[page],expectedCanvas);assert.equal(this.textures[page],expectedTexture);}};
 prototype.land.call(book,true);
 assert.equal(done,true);assert.equal(book.leaf.visible,false);assert.equal(book.leafBack.visible,false);
 assert.equal(new Set(Object.values(book.textures)).size,4);assert.equal(new Set(Object.values(book.canvases)).size,4);
 assert.equal(book.leaf.material.map,book.textures.A);assert.equal(book.leafBack.material.map,book.textures.B);
});
