// Focused development-engine comparison; this is not the production visitor profile.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const dir='docs/travellers-rest-review/survey-pass';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--ignore-gpu-blocklist','--enable-gpu']});
const results=[],errors=[];
try {
for(const mode of ['live','baked','phone']) {
 const phone=mode==='phone';
 const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1366,height:860},deviceScaleFactor:phone?2:1,isMobile:phone,hasTouch:phone});
 const page=await context.newPage();page.on('pageerror',e=>errors.push({mode,error:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({mode,error:m.text().slice(0,300)});});
 await page.goto('http://127.0.0.1:3078/dev/world-lab?instant'+(mode==='baked'?'&lighting=baked':'')+'#library');
 await page.waitForSelector('canvas[data-scene=ready]',{timeout:120000});
 if(mode==='baked')await page.waitForSelector('canvas[data-lighting=baked]');
 await page.waitForTimeout(1500);
 const gpu=await page.evaluate(()=>{const gl=window.engine.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 for(const stop of phone?['library']:['library','entry','approach','drawers']) {
  await page.evaluate(stop=>window.engine.setRoute({place:stop,focus:null},true),stop);await page.waitForTimeout(300);await page.screenshot({path:dir+'/'+mode+'-'+stop+'.png'});
 }
 for(const scenario of phone?['walk']:['walk','leaf turns']) {
  await page.evaluate(scenario=>window.engine.setRoute({place:scenario==='walk'?'entry':'cabinet',focus:scenario==='walk'?null:{kind:'book',slug:'v0',leaf:0,page:0}},true),scenario);
  await page.waitForTimeout(1200);
  const metrics=await page.evaluate(async scenario=>{
   const e=window.engine,frameTimes=[],drawTimes=[],timers=[];let previous=e.renderer.info.render.frame;
   const started=performance.now();
   if(scenario==='walk')for(const [i,place] of ['library','desk','drawers','cabinet'].entries())timers.push(setTimeout(()=>e.controller.go(place),i*3000));
   else for(let i=0;i<8;i++)timers.push(setTimeout(()=>e.turn('v0',i%2?-1:1,null,null,.5),i*1400));
   await new Promise(resolve=>{function tick(t){frameTimes.push(t);if(e.renderer.info.render.frame!==previous){drawTimes.push(t);previous=e.renderer.info.render.frame;}if(t-started<12000)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
   timers.forEach(clearTimeout);
   const stats=ts=>{const v=ts.slice(1).map((t,i)=>t-ts[i]).sort((a,b)=>a-b);const mean=v.reduce((a,b)=>a+b,0)/v.length;return {samples:v.length,averageFps:+(1000/mean).toFixed(1),medianMs:+v[Math.floor(v.length*.5)].toFixed(1),p95Ms:+v[Math.floor(v.length*.95)].toFixed(1),over33ms:v.filter(x=>x>33.4).length};};
   return {presentation:stats(frameTimes),draws:stats(drawTimes),scene:e.stats()};
  },scenario);
  results.push({mode,scenario,gpu,...metrics});console.log(JSON.stringify(results.at(-1)));
 }
 await context.close();
}
} finally {await browser.close();}
await writeFile(dir+'/measurements.json',JSON.stringify({date:new Date().toISOString(),conditions:'Running Next development office 3078, world-lab with stand-in volumes and blank page turns. Headless installed Chrome; no other browser or Blender process from this worker during sampling. Desktop 1366x860 DPR1; emulated phone 390x844 DPR2. Single 12-second sample per scenario; no production, real page-paint, WebGPU or physical-phone qualification.',results,errors},null,2)+'\n');
if(errors.length)console.log('Errors',errors);
