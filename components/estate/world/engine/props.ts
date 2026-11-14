/* Blender-authored pieces for the live library.

   The kit is built by assets/travellers-rest/kit/build_kit.py and packed by
   scripts/pack-kit.mjs with every node's name, parent and transform intact. A node's
   transform in the file is its place in the house, so nothing is positioned here.

   Names: Blender and the file use lower-case dotted names ("chair.windsor"). GLTFLoader
   strips the dots from Object3D.name ("chairwindsor") and keeps the original spelling in
   userData.name, which is what `Kit` indexes. Each mesh hangs on a child called
   "<name>~mesh" (the packer's quantization transform lives there), so the named node
   keeps the pivot it was authored with.

   Nothing in this module touches the DOM or WebGL when it is loaded. */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Tier } from "./kit";

const HOLDER = "~mesh";
type FinishBook = Record<string, THREE.Material | THREE.Material[]>;

/** Where the kit is served from, or null when the visit asks for the code-built room
    (`?kit=off`, used for comparison and for exporting the room to Blender). */
/** Where the kit comes from: the delivery URL the house program names for this tier, or
    nothing when no kit has been delivered or the visitor asked for the code-built room. */
export function kitSource(url: string | null) {
  if (typeof location !== "undefined" && new URLSearchParams(location.search).get("kit") === "off") return null;
  return url;
}
/** The kit as it sits in the checkout, for the renderer fixture. */
export const localKit = (tier: Tier) => "/travellers-rest/kit" + (tier === "low" ? "-low" : "") + ".glb";

/** A copy of a packed geometry in plain floats, moved into the house's frame. */
function settle(source: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const g = new THREE.BufferGeometry();
  for (const name of ["position", "normal", "uv", "uv1"]) {
    const a = source.getAttribute(name);
    if (!a) continue;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
    g.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize));
  }
  if (source.index) g.setIndex(Array.from(source.index.array));
  return g.applyMatrix4(matrix);
}

export class Kit {
  private nodes = new Map<string, THREE.Object3D>();
  private dressed = new Map<THREE.Material, THREE.Material>();
  private made: { dispose(): void }[] = [];

  constructor(readonly scene: THREE.Object3D) {
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      const name: unknown = o.userData.name;
      if (typeof name === "string" && !name.endsWith(HOLDER)) this.nodes.set(name, o);
    });
  }
  get size() {
    return this.nodes.size;
  }
  /** True when every named node is in the file. */
  has(...names: string[]) {
    return names.every((name) => this.nodes.has(name));
  }
  /** The live node, pivot and children intact, by its dotted name. */
  object(name: string) {
    return this.nodes.get(name) ?? null;
  }
  /** A node's origin in the house: a pivot, a resting place or a flame. */
  point(name: string) {
    return this.nodes.get(name)?.getWorldPosition(new THREE.Vector3()) ?? null;
  }
  /** What a node was authored to do: `{ kind: "slide" | "hinge" | "gutter", axis, travel }`. */
  motion(name: string) {
    const data = this.nodes.get(name)?.userData;
    if (!data?.kit_motion) return null;
    return { kind: data.kit_motion as string, axis: new THREE.Vector3(...(data.kit_axis as [number, number, number])), travel: (data.kit_travel as number) ?? 0 };
  }

  /** A movable piece, baked into house axes with its authored origin at zero.
      Clones share no geometry with the loader: each owner may safely dispose them. */
  moving(name: string, finishes: FinishBook) {
    const node = this.nodes.get(name);
    if (!node) return null;
    const group = new THREE.Group();
    const pivot = node.getWorldPosition(new THREE.Vector3());
    const shift = new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
    node.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      const copy = new THREE.Mesh(settle(mesh.geometry, shift.clone().multiply(mesh.matrixWorld)), this.dress(mesh.material, finishes));
      copy.castShadow = copy.receiveShadow = true;
      group.add(copy);
    });
    group.position.copy(pivot);
    group.name = name;
    return group;
  }

  /** Stock shape in its unrotated local glTF frame. The bench placement is excluded. */
  geometry(name: string) {
    const node = this.nodes.get(name);
    if (!node) return null;
    const inverse = node.matrixWorld.clone().invert();
    const parts: THREE.BufferGeometry[] = [];
    node.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) parts.push(settle(mesh.geometry, inverse.clone().multiply(mesh.matrixWorld)));
    });
    if (!parts.length) return null;
    const shared = Object.keys(parts[0].attributes).filter((key) => parts.every((g) => g.getAttribute(key)));
    for (const g of parts) for (const key of Object.keys(g.attributes)) if (!shared.includes(key)) g.deleteAttribute(key);
    const merged = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    // The exporter already converts mesh coordinates to Y-up; only the stock root's
    // bench placement was removed. Applying another axis conversion would flatten it.
    return merged;
  }

  /** The room's own finish for a kit material that names one (so Blender joinery and
      code-built joinery are one walnut), keeping the kit's baked occlusion; otherwise
      the material exactly as Blender exported it. */
  private dress(source: THREE.Material, finishes: FinishBook) {
    const known = this.dressed.get(source);
    if (known) return known;
    const kit = source as THREE.MeshStandardMaterial;
    const named = typeof source.userData.finish === "string" ? finishes[source.userData.finish] : undefined;
    const base = Array.isArray(named) ? named[0] : named;
    let material: THREE.Material = source;
    if (base) {
      const copy = base.clone() as THREE.MeshStandardMaterial;
      copy.name = base.name + " · " + source.name;
      copy.aoMap = kit.aoMap;
      copy.aoMapIntensity = 1;
      // The Blender shader bake is the finish. Preserve its authored UVs and colour
      // instead of silently replacing it with a second browser-generated texture.
      if (kit.map && (/^(walnut|paint\.)/.test(source.name) || source.userData.baked_finish === true)) {
        copy.map = kit.map;
        copy.bumpMap = null;
      }
      this.made.push(copy);
      material = copy;
    } else kit.envMapIntensity = 0.7;
    this.dressed.set(source, material);
    return material;
  }

  /** The named pieces as static geometry, merged by material: one draw call per
      finish, however many pieces. Nodes authored as `moving` or `stock` are left out;
      they are for `object()`. */
  merged(pieces: string[], finishes: FinishBook, name = "Blender kit") {
    const sets = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const visit = (o: THREE.Object3D) => {
      if (o.userData.kit_role === "moving" || o.userData.kit_role === "stock") return;
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && !Array.isArray(mesh.material)) {
        const list = sets.get(mesh.material) ?? [];
        list.push(settle(mesh.geometry, mesh.matrixWorld));
        sets.set(mesh.material, list);
      }
      o.children.forEach(visit);
    };
    for (const piece of pieces) {
      const root = this.nodes.get(piece);
      if (root) visit(root);
    }
    const group = new THREE.Group();
    group.name = name;
    for (const [source, list] of sets) {
      // Merging needs one layout: keep the attributes every part of this finish has.
      const shared = Object.keys(list[0].attributes).filter((key) => list.every((g) => g.getAttribute(key)));
      for (const g of list) for (const key of Object.keys(g.attributes)) if (!shared.includes(key)) g.deleteAttribute(key);
      const geometry = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, this.dress(source, finishes));
      mesh.name = name + " · " + source.name;
      mesh.castShadow = mesh.receiveShadow = true;
      this.made.push(geometry);
      group.add(mesh);
    }
    return group;
  }
  dispose() {
    this.made.forEach((m) => m.dispose());
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
  }
}

/** Load the kit. Resolves to null on any failure: the code-built pieces stand in. */
export async function loadKit(url: string | null): Promise<Kit | null> {
  if (!url) return null;
  try {
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
    const kit = new Kit(gltf.scene);
    return kit.size ? kit : null;
  } catch (error) {
    console.warn("Blender kit unavailable; the code-built pieces stand in.", error);
    return null;
  }
}
