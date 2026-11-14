/** Prepare the actual framebuffer/shadow programs and resident textures before the
 * loading screen releases movement. compileAsync alone does not upload geometry or
 * textures, or execute the driver's first draw. No warm-up advances scene time.
 */
import * as THREE from "three";
export type Preparation = { milliseconds: number; textures: number; programs: number };
const yieldTask = () => new Promise<void>(resolve => setTimeout(resolve, 0));
async function submitted(renderer: THREE.WebGLRenderer, disposed: () => boolean) {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!fence) throw Error("Unable to prepare the graphics context");
  gl.flush();
  const start = performance.now();
  try {
    while (!disposed()) {
      const status = gl.clientWaitSync(fence, 0, 0);
      if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) return;
      if (status === gl.WAIT_FAILED || gl.isContextLost() || performance.now()-start>30000) throw Error("Graphics preparation did not complete");
      await new Promise<void>(resolve => setTimeout(resolve, 8));
    }
  } finally { gl.deleteSync(fence); }
}
export async function prepareScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, disposed: () => boolean): Promise<Preparation> {
  const start=performance.now(),textures=new Set<THREE.Texture>();
  scene.traverseVisible(object=>{
    const renderable=object as THREE.Mesh;
    if(!renderable.material)return;
    for(const material of Array.isArray(renderable.material)?renderable.material:[renderable.material]) {
      if(!material.visible)continue;
      for(const value of Object.values(material))if(value instanceof THREE.Texture&&!value.isRenderTargetTexture)textures.add(value);
    }
  });
  if(scene.background instanceof THREE.Texture)textures.add(scene.background);
  // Bounded batches let the browser paint the genuine loading state between uploads.
  let budget=performance.now();
  for(const texture of textures){
    if(disposed())return {milliseconds:performance.now()-start,textures:0,programs:0};
    if(texture.image)renderer.initTexture(texture);
    if(performance.now()-budget>8){await yieldTask();budget=performance.now();}
  }
  if(disposed())return {milliseconds:performance.now()-start,textures:0,programs:0};
  await renderer.compileAsync(scene,camera);
  if(disposed())return {milliseconds:performance.now()-start,textures:0,programs:0};
  const culling=new Map<THREE.Object3D,boolean>();
  try {
    scene.traverse(object=>{culling.set(object,object.frustumCulled);object.frustumCulled=false;});
    // The default framebuffer is intentional: an offscreen target changes output
    // colour-space shader variants and would leave the visitor's first draw cold.
    renderer.render(scene,camera);
    await submitted(renderer,disposed);
  } finally {for(const [object,value] of culling)object.frustumCulled=value;}
  return {milliseconds:performance.now()-start,textures:textures.size,programs:renderer.info.programs?.length??0};
}
