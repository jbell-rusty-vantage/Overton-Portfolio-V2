/* How the shelved volumes behave toward one another. The binding under the pointer
   tips out and its neighbours make room; when a volume is out, the one beside it leans
   into the gap and a marker slip stands in the slot, so it is plain which one is in
   the visitor's hands and where it goes back. Everything here is a function of the
   volumes' own `progress` and hover, so it runs backward as cleanly as forward. */
import * as THREE from "three";
import { serif } from "./sheets";
import { BOOK, PULL, type Volume3D } from "./engine/volume";

export class ShelfCare {
  /** Volumes standing side by side between two bookends, in shelf order. */
  private runs: Volume3D[][] = [];
  private slip: THREE.Mesh;
  private card = document.createElement("canvas");
  private texture: THREE.CanvasTexture;
  private material: THREE.MeshStandardMaterial;
  private named = "";
  private armed = false;

  constructor(scene: THREE.Scene) {
    this.card.width = 128;
    this.card.height = 352;
    this.texture = new THREE.CanvasTexture(this.card);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.85,
      transparent: true,
      opacity: 0,
      emissive: "#ffca78",
      emissiveMap: this.texture,
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
    });
    this.slip = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.slip.visible = false;
    this.slip.name = "Shelf marker";
    scene.add(this.slip);
  }
  /** Begin a new run of neighbours (after a bookend). */
  run() {
    this.runs.push([]);
  }
  add(volume: Volume3D) {
    if (!this.runs.length) this.run();
    this.runs[this.runs.length - 1].push(volume);
  }
  /** The bindings either side of the one under the pointer make room for it. */
  focus(slug: string | null) {
    for (const run of this.runs) {
      const at = slug ? run.findIndex((v) => v.spec.slug === slug && !v.out) : -1;
      run.forEach((v, i) => {
        v.swayTarget = at < 0 ? 0 : i === at - 1 ? -1 : i === at + 1 ? 1 : 0;
      });
    }
  }
  /** The marker glows while letting go would send the book home. */
  arm(on: boolean) {
    this.armed = on;
  }
  private print(volume: Volume3D) {
    const c = this.card,
      ctx = c.getContext("2d")!;
    ctx.fillStyle = "#efe4c6";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#8a7243";
    ctx.lineWidth = 3;
    ctx.strokeRect(7, 7, c.width - 14, c.height - 14);
    ctx.fillStyle = "#7a1420";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 22px " + serif;
    ctx.fillText("OUT", c.width / 2, 34);
    ctx.fillStyle = "#8a7243";
    ctx.fillRect(28, 54, c.width - 56, 2);
    ctx.save();
    ctx.translate(c.width / 2, 200);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#2a2116";
    let size = 30;
    for (; size > 15; size--) {
      ctx.font = "600 " + size + "px " + serif;
      if (ctx.measureText(volume.spec.title).width <= 250) break;
    }
    ctx.fillText(volume.spec.title, 0, 0, 262);
    ctx.restore();
    this.texture.needsUpdate = true;
  }
  /** Each frame: lean the neighbour of whatever is out and stand the marker in its
      slot. Returns true while the marker is still fading. */
  update() {
    let out: Volume3D | null = null,
      gap = 0;
    for (const run of this.runs) {
      const lean = run.map(() => 0);
      run.forEach((v, i) => {
        if (!v.out) return;
        const g = THREE.MathUtils.smoothstep(v.progress, PULL * 0.9, PULL + 0.12);
        if (g > gap) {
          gap = g;
          out = v;
        }
        // The volume before it leans in; the first of a run is leaned on from after.
        if (i > 0) lean[i - 1] += g;
        else if (run.length > 1) lean[1] -= g;
      });
      run.forEach((v, i) => v.setLean(v.out ? 0 : THREE.MathUtils.clamp(lean[i], -1, 1)));
    }
    const held = out as Volume3D | null;
    const before = this.material.opacity,
      glow = this.material.emissiveIntensity;
    if (held) {
      if (this.named !== held.spec.slug) {
        this.named = held.spec.slug;
        this.print(held);
        const rest = held.spec.rest.position;
        const width = Math.min(0.05, held.closedThickness - 0.012);
        this.slip.scale.set(width, width * 2.75, 1);
        this.slip.position.set(rest.x - 0.02, rest.y - BOOK.H / 2 - BOOK.over + (width * 2.75) / 2 + 0.001, rest.z);
        this.slip.rotation.y = Math.PI / 2;
      }
      this.material.opacity = gap;
      this.material.emissiveIntensity = this.armed ? 0.55 : 0;
    } else {
      this.material.opacity = 0;
      this.material.emissiveIntensity = 0;
    }
    this.slip.visible = this.material.opacity > 0.01;
    return before !== this.material.opacity || glow !== this.material.emissiveIntensity;
  }
  dispose() {
    this.slip.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
