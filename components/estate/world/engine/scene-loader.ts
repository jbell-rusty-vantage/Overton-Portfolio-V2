import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { ResourceOwner } from './resources';

/** Register every arriving graph before consumers inspect cancellation or compose it. */
export class OwnedSceneLoader {
  private loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  constructor(private owner: ResourceOwner) {}
  async loadAsync(url: string, progress?: (event: ProgressEvent) => void) {
    const gltf = await this.loader.loadAsync(url, progress);
    this.owner.tree(gltf.scene);
    return gltf;
  }
}
