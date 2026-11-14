import * as THREE from "three";

type Disposable = { dispose(): void; addEventListener?: (...args: never[]) => void; removeEventListener?: (...args: never[]) => void };
/** One engine owns its graph, including replaced GLTF finishes and render targets.
 * Child disposal events remove their resources before the remaining graph is released. */
export class ResourceOwner {
  private resources = new Map<Disposable, () => void>();
  private released = new WeakSet<Disposable>();
  private closed = false;

  own(resource: Disposable | null | undefined) {
    if (!resource || this.released.has(resource) || this.resources.has(resource)) return;
    if (this.closed) { resource.dispose(); this.released.add(resource); return; }
    const onDispose = () => {
      this.resources.delete(resource);
      this.released.add(resource);
      resource.removeEventListener?.(...["dispose", onDispose] as never[]);
    };
    resource.addEventListener?.(...["dispose", onDispose] as never[]);
    this.resources.set(resource, onDispose);
  }

  tree(root: THREE.Object3D) {
    root.traverse(object => {
      const mesh = object as THREE.Mesh;
      this.own(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) this.own(value);
        this.own(material);
      }
      const light = object as THREE.Light & { shadow?: THREE.LightShadow };
      if (light.shadow) { this.own(light.shadow.map); this.own(light.shadow.mapPass); }
    });
  }

  dispose() {
    this.closed = true;
    for (const [resource, listener] of this.resources) {
      resource.dispose();
      resource.removeEventListener?.(...["dispose", listener] as never[]);
      this.released.add(resource);
    }
    this.resources.clear();
  }
}
