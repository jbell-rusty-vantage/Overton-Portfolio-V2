/* A document or record that can be lifted from where it lies. As with the volumes, a
   single `progress` value runs from resting (0) to held before the visitor (1), so an
   interrupted lift returns along the same path to its own place. The room shows a small
   texture; the full scan is fetched only when the object is picked up. */
import * as THREE from "three";
import { easeInOut, facedBox, paper, standard } from "./kit";
import { serif } from "../sheets";
import type { RoomObject } from "@/lib/estate/world";
import type { Kit } from "./props";

export type ArtifactSpec = {
  object: RoomObject;
  width: number;
  height: number;
  rest: { position: THREE.Vector3; quaternion: THREE.Quaternion };
  /** Which chest drawer carries it, if any. */
  drawer?: number;
  label: string;
};
export type View = { zoom: number; x: number; y: number };

const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");
const back = () => standard({ map: paper("#e2d3ab", 211), roughness: 0.95 });

function cardFace(o: RoomObject) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 400;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(paper("#efe6cd", 212).image as HTMLCanvasElement, 0, 0, 640, 400);
  ctx.strokeStyle = "#9a3b2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 78);
  ctx.lineTo(640, 78);
  ctx.stroke();
  ctx.strokeStyle = "rgba(60,90,120,.35)";
  ctx.lineWidth = 1;
  for (let y = 118; y < 400; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#2c2418";
  ctx.font = "600 30px " + serif;
  ctx.fillText(o.title, 34, 56, 572);
  ctx.font = "19px " + serif;
  ctx.fillStyle = "#5a4a30";
  ctx.fillText("Museum record · " + o.maker, 34, 108, 572);
  ctx.fillStyle = "#3b3122";
  ctx.font = "20px " + serif;
  let line = "",
    y = 146;
  for (const word of o.caption.split(/\s+/)) {
    const next = line ? line + " " + word : word;
    if (ctx.measureText(next).width > 570 && line) {
      ctx.fillText(line, 34, y);
      y += 34;
      line = word;
      if (y > 372) break;
    } else line = next;
  }
  if (y <= 372) ctx.fillText(line, 34, y);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export class Artifact3D {
  readonly ready: Promise<void>;
  readonly group = new THREE.Group();
  readonly hit: THREE.Mesh;
  progress = 0;
  target = 0;
  hover = 0;
  hoverTarget = 0;
  view: View = { zoom: 1, x: 0, y: 0 };
  page = 0;
  private sheet: THREE.Mesh;
  private front: THREE.MeshStandardMaterial;
  private band: THREE.Mesh;
  private small: THREE.Texture | null = null;
  private full = new Map<number, THREE.Texture>();
  private wanted = 0;
  private disposed = false;
  private loading = new Set<number>();
  private spin: { t: number; to: number } | null = null;
  private viewNow: View = { zoom: 1, x: 0, y: 0 };
  /** Reports a failed scan so the panel can say so and offer the source link. */
  onMissing: (page: number) => void = () => {};
  onLoaded: (page: number) => void = () => {};

  constructor(
    readonly spec: ArtifactSpec,
    private redraw: () => void,
    kit: Kit | null = null,
  ) {
    const { width, height, object } = spec;
    let ready!: () => void;
    this.ready = new Promise<void>(resolve => { ready = resolve; });
    this.front = new THREE.MeshStandardMaterial({ roughness: 0.9, color: "#efe4c8" });
    if (object.form === "card") this.front.map = cardFace(object);
    else if (object.pages[0]?.small)
      loader.load(
        object.pages[0].small,
        (t) => {
          if (this.disposed) { t.dispose(); ready(); return; }
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          this.small = t;
          if (!this.front.map) {
            this.front.map = t;
            this.front.color.set("#ffffff");
            this.front.needsUpdate = true;
            this.redraw();
          }
          ready();
        },
        undefined,
        ready,
      );
    else ready();
    if (object.form === "card") ready();
    if (object.form === "card") this.front.color.set("#ffffff");
    const stock = object.form === "sheet" && !["table.map", "wall.jackson"].includes(object.rest) ? kit?.geometry("letter.sheet") : null;
    if (stock) {
      // The Blender sheet lies on the bench. Rotate it into the reader's XY plane,
      // keeping its folds and its scan UVs; cards and framed pictures stay rigid.
      stock.rotateX(Math.PI / 2);
      stock.scale(width / 0.2, height / 0.25, 1);
      // GLTFLoader's image convention is top-left; these scans arrive through
      // TextureLoader, whose flipY is true. Restore the sheet's bottom-left UVs.
      const uv = stock.getAttribute("uv");
      for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
      this.front.side = THREE.DoubleSide;
    }
    const geometry = stock ?? facedBox(width, height, 0.0009, [4]);
    this.sheet = new THREE.Mesh(geometry, stock ? this.front : [back(), this.front]);
    this.sheet.receiveShadow = true;
    // Marks the manuscript lines a selected transcript passage refers to.
    this.band = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 1),
      new THREE.MeshBasicMaterial({
        color: "#f2c14e",
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.band.visible = false;
    this.band.position.z = 0.0012;
    this.hit = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.03, height + 0.03, 0.03),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.group.add(this.sheet, this.band, this.hit);
    this.group.name = "Object · " + object.title;
    this.group.position.copy(spec.rest.position);
    this.group.quaternion.copy(spec.rest.quaternion);
  }
  /** Fetch the inspection scan for a page and show it when it arrives. */
  showPage(index: number, instant = false) {
    const pages = this.spec.object.pages;
    if (this.disposed || !pages.length) return;
    const to = THREE.MathUtils.clamp(index, 0, pages.length - 1);
    this.wanted = to;
    const src = pages[to].src;
    if (src && !this.full.has(to) && !this.loading.has(to)) {
      this.loading.add(to);
      loader.load(
        src,
        (t) => {
          this.loading.delete(to);
          if (this.disposed) { t.dispose(); return; }
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 16;
          this.full.set(to, t);
          if (this.page === to && !this.spin) this.apply(to);
          this.onLoaded(to);
          this.redraw();
        },
        undefined,
        () => { this.loading.delete(to); if (!this.disposed) this.onMissing(to); },
      );
    }
    if (to === this.page && !this.spin) {
      this.apply(to);
      return;
    }
    if (instant || this.progress < 0.9) {
      this.page = to;
      this.apply(to);
    } else this.spin = { t: 0, to };
    this.redraw();
  }
  private apply(index: number) {
    const texture = this.full.get(index) ?? (index === 0 ? this.small : null);
    if (this.spec.object.form === "card") return;
    if (texture && this.front.map !== texture) {
      this.front.map = texture;
      this.front.color.set("#ffffff");
      this.front.needsUpdate = true;
    }
  }
  highlight(range: { y0: number; y1: number } | null) {
    this.band.visible = !!range;
    if (range) {
      const h = this.spec.height;
      this.band.scale.y = Math.max(0.01, (range.y1 - range.y0) * h);
      this.band.position.y = h / 2 - ((range.y0 + range.y1) / 2) * h;
    }
    this.redraw();
  }
  setView(v: View) {
    const zoom = THREE.MathUtils.clamp(v.zoom, 1, 5);
    const reach = (zoom - 1) / (2 * zoom);
    this.view = {
      zoom,
      x: THREE.MathUtils.clamp(v.x, -reach, reach),
      y: THREE.MathUtils.clamp(v.y, -reach, reach),
    };
    this.redraw();
  }
  get out() {
    return this.progress > 0 || this.target > 0;
  }
  get settled() {
    return this.progress === 1 && this.target === 1;
  }
  /** `hand` is where the sheet's centre should be at zoom 1, facing the visitor. */
  update(
    dt: number,
    hand: { position: THREE.Vector3; quaternion: THREE.Quaternion },
    reduced: boolean,
    drawerOffset: THREE.Vector3,
  ) {
    let moving = false;
    if (this.hover !== this.hoverTarget) {
      this.hover = THREE.MathUtils.damp(this.hover, this.hoverTarget, 14, dt);
      if (Math.abs(this.hover - this.hoverTarget) < 0.004) this.hover = this.hoverTarget;
      moving = true;
    }
    if (this.progress !== this.target) {
      const step = reduced ? 1 : dt / 1.35;
      this.progress =
        this.target > this.progress
          ? Math.min(this.target, this.progress + step)
          : Math.max(this.target, this.progress - step * 1.2);
      if (this.progress === 0) {
        this.band.visible = false;
        this.view = { zoom: 1, x: 0, y: 0 };
        this.viewNow = { zoom: 1, x: 0, y: 0 };
        if (this.page !== 0) {
          this.page = 0;
          this.apply(0);
        }
      }
      moving = true;
    }
    for (const k of ["zoom", "x", "y"] as const)
      if (Math.abs(this.viewNow[k] - this.view[k]) > 0.0005) {
        this.viewNow[k] = reduced ? this.view[k] : THREE.MathUtils.damp(this.viewNow[k], this.view[k], 12, dt);
        moving = true;
      }
    if (this.spin) {
      this.spin.t = Math.min(1, this.spin.t + dt / 0.55);
      if (this.spin.t >= 0.5 && this.page !== this.spin.to) {
        this.page = this.spin.to;
        this.apply(this.page);
      }
      if (this.spin.t >= 1) this.spin = null;
      moving = true;
    }
    // A sheet only needs to throw a shadow once it has left the table.
    this.sheet.castShadow = this.progress > 0;
    const rest = this.spec.rest.position.clone().add(drawerOffset);
    const k = easeInOut(this.progress);
    const g = this.group;
    // Lift clear of the table first, then come to the hand.
    const lift = rest.clone();
    lift.y += 0.16 * Math.min(1, this.progress * 4) + this.hover * 0.012;
    const z = this.viewNow.zoom;
    // Zoom enlarges the sheet in the hand; panning slides it in its own plane.
    const held = hand.position
      .clone()
      .add(
        new THREE.Vector3(
          -this.viewNow.x * this.spec.width * z,
          -this.viewNow.y * this.spec.height * z,
          0,
        ).applyQuaternion(hand.quaternion),
      );
    g.position.copy(lift).lerp(held, k);
    g.quaternion.copy(this.spec.rest.quaternion).slerp(hand.quaternion, k);
    g.scale.setScalar(THREE.MathUtils.lerp(1, z, k));
    if (this.spin) {
      const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * (this.spin.t < 0.5 ? this.spin.t : this.spin.t - 1));
      g.quaternion.multiply(turn);
    }
    return moving;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.sheet.geometry.dispose();
    if (this.spec.object.form === "card") this.front.map?.dispose();
    this.front.dispose();
    this.full.forEach((t) => t.dispose());
    this.small?.dispose();
    this.full.clear();
    this.loading.clear();
  }
}
