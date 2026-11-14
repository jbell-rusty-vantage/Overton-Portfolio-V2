/* The continuous world: one renderer, one camera and one scene root for the whole
   visit. React owns the route and the DOM surfaces; this class owns everything that is
   drawn and reports selections back so both sides use the same navigation. */
import * as THREE from "three";
import { OwnedSceneLoader } from "./scene-loader";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  anchor,
  companionSlug,
  houseShelves,
  places,
  type Cue,
  type Place,
  type RoomObject,
  type Route,
} from "@/lib/estate/world";
import { Controller } from "./controller";
import { ResourceOwner } from "./resources";
import { prepareScene } from "./readiness";
import { Environment, type EnvironmentState } from "./environment";
import { Artifact3D, type View } from "./artifact";
import { Portrait } from "./portrait";
import { buildGrounds, type Grounds } from "./grounds";
import { ROOM, buildLibrary, dressShell, sky, type Finishes } from "./room";
import { Batch, seeded, type Tier } from "./kit";
import { kitSource, loadKit, type Kit } from "./props";
import { setDrawerExtension } from "./navmesh";
import { BOOK, Volume3D, bindingColors, bookThickness, type Hand } from "./volume";
import { BookHold } from "../bookHold";
import { ShelfCare } from "../shelfCare";
import { serif, type PageMetrics, type Sheet } from "../sheets";

export type Target =
  | { kind: "book"; slug: string }
  | { kind: "object"; id: string }
  | { kind: "place"; place: Place }
  | { kind: "portrait" }
  | { kind: "screen" };
export type VolumeInput = {
  slug: string;
  title: string;
  shelf: string | null;
  position: number;
  leaves: number;
  cover?: string;
};
export type Insets = { top: number; right: number; bottom: number; left: number };
export type EngineOptions = {
  canvas: HTMLCanvasElement;
  tier: Tier;
  reduced: boolean;
  scene: string;
  portrait: string;
  /** Delivery URL of the Blender furniture kit for this tier, if one exists. */
  kit: string | null;
  volumes: VolumeInput[];
  companion: VolumeInput | null;
  objects: RoomObject[];
  metrics: PageMetrics;
  events: {
    ready(): void;
    progress(percent: number): void;
    failed(): void;
    select(target: Target): void;
    hover(info: { label: string; hint: string; x: number; y: number } | null): void;
    arrive(place: Place): void;
    travel(active: boolean): void;
    settled(kind: "book" | "object", id: string): void;
    scan(id: string, page: number, ok: boolean): void;
  };
};
type Hit = { mesh: THREE.Object3D; target: Target; label: string; hint: string; live: () => boolean };
export type Reachable = { key: string; label: string; hint: string; target: Target };

const lying = (yaw = 0) =>
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, yaw, 0, "YXZ"));
const V = (p: number[]) => new THREE.Vector3(p[0], p[1], p[2]);

function glow(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 38, 1, 32, 32, 31);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, outer);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function plaque(text: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 48;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 48);
  g.addColorStop(0, "#c9a257");
  g.addColorStop(0.5, "#a37c38");
  g.addColorStop(1, "#7e5c26");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 48);
  ctx.strokeStyle = "rgba(40,24,6,.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, 506, 42);
  ctx.fillStyle = "#24170a";
  ctx.font = "600 23px " + serif;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), 256, 25, 480);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(56, 1, 0.04, 90);
  readonly controller: Controller;
  private volumes = new Map<string, Volume3D>();
  private artifacts = new Map<string, Artifact3D>();
  private portrait: Portrait | null = null;
  private hits: Hit[] = [];
  private raycaster = new THREE.Raycaster();
  private frame = 0;
  private last = 0;
  private dirty = true;
  private disposed = false;
  private resources = new ResourceOwner();
  private prepared = false;
  private startupTimer: ReturnType<typeof setTimeout> | undefined;
  readonly readiness = { started: performance.now(), assetsMilliseconds: 0, prepareMilliseconds: 0, totalMilliseconds: 0, textures: 0, programs: 0 };
  private paused = false;
  private kit: Kit | null = null;
  private shafts: THREE.Mesh[] = [];
  private size = { w: 1, h: 1 };
  private route: Route = { place: "approach", focus: null };
  private held: { kind: "book" | "object"; id: string } | null = null;
  private returnPose: ReturnType<Controller["pose"]> | null = null;
  private settledId = "";
  private flames: { sprite: THREE.Sprite; base: THREE.Vector3; scale: number; phase: number }[] = [];
  private fire: THREE.PointLight | null = null;
  private dust: THREE.Points | null = null;
  private readingLight = new THREE.SpotLight("#ffe7c0", 0, 2.2, 0.62, 0.6, 1.4);
  private sun: THREE.DirectionalLight | null = null;
  private atmosphere: Environment;
  private atmosphereDucked = false;
  private grounds: Grounds | null = null;
  /** Frames for which shadows are still to be redrawn after the last movement. */
  private stir = 4;
  private drawers: { group: THREE.Group; open: number; reach: number }[] = [];
  private screen: THREE.Mesh | null = null;
  private screenTexture: THREE.Texture | null = null;
  private pages: { left: HTMLElement | null; right: HTMLElement | null } = { left: null, right: null };
  private hovered: Hit | null = null;
  private shelfLabel: THREE.Sprite | null = null;
  private shelfLabelSlug = "";
  private disposers: (() => void)[] = [];
  private clock = 0;
  private fps = { frames: 0, slow: 0 };
  /** The visitor's hand on the held book, and the manners of the shelved ones. */
  private hold = new BookHold(this.camera, () => this.size);
  private shelf = new ShelfCare(this.scene);
  private putBack: (() => void) | null = null;
  private canvasHold = -1;
  private carried = false;
  private reports: { mesh: THREE.Mesh; home: THREE.Vector3; hover: number; target: number }[] = [];
  insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  single = false;

  constructor(private o: EngineOptions) {
    const { canvas, tier } = o;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === "high" ? 1.5 : 1.25));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    canvas.setAttribute("data-backend", "webgl2");
    canvas.setAttribute("data-tier", tier);
    this.scene.background = sky();
    this.controller = new Controller(this.camera, canvas, o.reduced, this.scene);
    this.controller.suspend(true);
    this.controller.onMove = () => this.invalidate();
    this.controller.onTravel = (active) => o.events.travel(active);
    this.controller.onArrive = (place) => {
      if (this.portrait) this.portrait.awake = ["library", "portrait", "desk", "cabinet", "reports", "drawers"].includes(place);
      o.events.arrive(place);
    };
    this.lights();
    this.atmosphere = new Environment(this.sun!, (palette) => this.grounds?.setEnvironment(palette), () => this.invalidate());
    const visibility = () => this.atmosphere.suspend(document.hidden || this.paused || this.atmosphereDucked);
    document.addEventListener("visibilitychange", visibility);
    this.disposers.push(() => document.removeEventListener("visibilitychange", visibility));
    this.bind();
    this.resize();
    this.startupTimer = setTimeout(() => {
      if (this.prepared || this.disposed) return;
      this.dispose();
      o.events.failed();
    }, 60000);
    void this.load();
    this.frame = requestAnimationFrame(this.tick);
  }

  private lights() {
    const { tier } = this.o;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    this.resources.own(environment);
    this.scene.environment = environment.texture;
    room.dispose();
    this.scene.environmentIntensity = 0.22;
    pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight("#e3e7ee", "#b59c78", 0.36));
    // Late-afternoon sun from the south-south-west, low enough to cross the room.
    const sun = new THREE.DirectionalLight("#ffcf94", 7.5);
    const dir = new THREE.Vector3(0.36, -0.56, -0.75).normalize();
    sun.target.position.set(-4.6, ROOM.floor, 0.2);
    sun.position.copy(sun.target.position).addScaledVector(dir, -14);
    sun.castShadow = true;
    const size = tier === "high" ? 2048 : 1024;
    sun.shadow.mapSize.set(size, size);
    Object.assign(sun.shadow.camera, { left: -5.4, right: 5.4, top: 5.2, bottom: -4.2, near: 2, far: 26 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.025;
    // The room is still: its shadows are redrawn only when something in it moves.
    sun.shadow.autoUpdate = false;
    sun.shadow.needsUpdate = true;
    this.sun = sun;
    this.scene.add(sun, sun.target);
    // Sky light entering by the sashes, and its warm return from the sunlit boards.
    const fill = new THREE.PointLight("#fff1dc", 2.6, 9, 1.6);
    fill.position.set(-5.0, 2.5, 2.35);
    this.scene.add(fill);
    const bounce = new THREE.PointLight("#ffb072", tier === "high" ? 1.5 : 1.1, 6, 1.8);
    bounce.position.set(-5.1, 0.95, 0.4);
    this.scene.add(bounce);
    this.fire = new THREE.PointLight("#ff8a3c", 0.75, 6, 1.9);
    this.fire.position.set(-6.85, 0.95, 0);
    this.scene.add(this.fire);
    const hall = new THREE.PointLight("#ffe7c2", 3.2, 9, 1.5);
    hall.position.set(0.15, 3.05, 1.5);
    this.scene.add(hall);
    // A light over the visitor's shoulder so an open page is legible anywhere in the room.
    this.readingLight.castShadow = true;
    this.readingLight.shadow.mapSize.set(512, 512);
    this.readingLight.shadow.camera.near = 0.05;
    this.readingLight.shadow.camera.far = 1.6;
    this.readingLight.shadow.bias = -0.002;
    this.readingLight.shadow.autoUpdate = false;
    this.scene.add(this.readingLight, this.readingLight.target);
  }

  private async load() {
    const { o } = this;
    try {
      const loader = new OwnedSceneLoader(this.resources);
      // The Blender kit loads beside the shell and never rejects: without it the
      // code-built furniture stands in.
      const kitLoading = loadKit(kitSource(o.kit)).then(kit => {
        if (kit) this.resources.tree(kit.scene);
        if (this.disposed) return null;
        return kit;
      });
      const gltf = await loader.loadAsync(o.scene, (e) => {
        if (e.lengthComputable && e.total) o.events.progress(Math.round((92 * e.loaded) / e.total));
      });
      if (this.disposed) return;
      for (const name of Object.keys(anchor))
        if (!gltf.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)))
          throw Error("Scene anchor missing: " + name);
      const kit = await kitLoading;
      if (this.disposed) return;
      this.kit = kit;
      const library = buildLibrary(o.tier, kit);
      o.canvas.setAttribute("data-kit", library.kit.length ? "blender" : "code");
      dressShell(gltf.scene, library.finishes);
      this.scene.add(gltf.scene, library.root);
      // The static bake is an opt-in comparison until its light and colour have been
      // visually qualified. Moving parts always remain the same authored kit.
      let bakedLoading: Promise<unknown> = Promise.resolve();
      if (new URLSearchParams(location.search).get("lighting") === "baked") {
        bakedLoading = loader.loadAsync("/travellers-rest/interior-light.glb").then((baked) => {
          if (this.disposed) return;
          library.root.visible = false;
          for (const child of [...library.root.children]) if (child.name === "Daylit sash") this.scene.add(child);
          this.scene.add(baked.scene);
          o.canvas.setAttribute("data-lighting", "baked");
          this.invalidate();
        }).catch(() => o.canvas.setAttribute("data-lighting", "live-fallback"));
      }
      this.grounds = buildGrounds({ tier: o.tier, reduced: o.reduced, scene: this.scene, shell: gltf.scene });
      this.atmosphere.refresh();
      this.scene.add(this.grounds.root);
      this.dress(library.finishes, library.flames, library.shelves.projects);
      this.portrait = new Portrait(o.portrait, library.finishes, () => this.invalidate());
      this.scene.add(this.portrait.group);
      this.register(this.portrait.hit, { kind: "portrait" }, "Judge John Overton", "Meet the custodian");
      this.shelve(library.finishes, library.shelves.projects);
      this.arrange(library.finishes);
      this.hotspots();
      o.events.progress(94);
      await Promise.all([bakedLoading, this.portrait.ready, ...[...this.volumes.values()].map(v=>v.ready), ...[...this.artifacts.values()].map(a=>a.ready)]);
      if (this.disposed) return;
      this.readiness.assetsMilliseconds = performance.now() - this.readiness.started;
      o.events.progress(96);
      // Exercise the front/back paper programs during genuine loading as well as
      // the room. One leaf suffices; allocating every shelved book's paper would
      // retain hundreds of megabytes before any of them has been opened.
      const restoreLeaf = this.volumes.values().next().value?.preparationLeaf();
      let prepared;
      try {
        prepared = await prepareScene(this.renderer, this.scene, this.camera, () => this.disposed);
      } finally { restoreLeaf?.(); }
      if (this.disposed) return;
      this.readiness.prepareMilliseconds = prepared.milliseconds;
      this.readiness.textures = prepared.textures;
      this.readiness.programs = prepared.programs;
      this.readiness.totalMilliseconds = performance.now() - this.readiness.started;
      o.canvas.setAttribute("data-preparation", JSON.stringify(this.readiness));
      this.prepared = true;
      clearTimeout(this.startupTimer);
      this.controller.suspend(this.paused);
      this.last = 0;
      this.stir = 6;
      o.events.progress(100);
      o.canvas.setAttribute("data-scene", "ready");
      this.applyRoute(this.route, this.arriveInstantly);
      if (this.pendingLanding !== null) {
        this.controller.visitLanding(this.pendingLanding);
        this.pendingLanding = null;
      }
      o.events.ready();
      this.invalidate();
    } catch (error) {
      clearTimeout(this.startupTimer);
      console.error("Travellers Rest world unavailable", error);
      if (!this.disposed) { this.dispose(); o.events.failed(); }
    }
  }

  /** Light, fire, dust and the live fittings of the chest and cabinet. */
  private dress(f: Finishes, flames: { at: THREE.Vector3; scale: number }[], shelves: number[]) {
    const fireMap = glow("rgba(255,244,200,1)", "rgba(255,140,40,.75)");
    const material = new THREE.SpriteMaterial({ map: fireMap, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const haloMaterial = new THREE.SpriteMaterial({
      map: glow("rgba(255,190,110,.5)", "rgba(255,170,90,.14)"),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
      toneMapped: false,
    });
    const rand = seeded(5);
    flames.forEach((fl, i) => {
      const count = fl.scale === 1 ? 6 : 1;
      for (let k = 0; k < count; k++) {
        const sprite = new THREE.Sprite(material);
        const base = fl.at.clone();
        if (count > 1) base.add(new THREE.Vector3((rand() - 0.5) * 0.1, rand() * 0.08, (rand() - 0.5) * 0.5));
        sprite.position.copy(base);
        const s = fl.scale === 1 ? 0.2 + rand() * 0.13 : 0.075;
        sprite.scale.set(s * (fl.scale === 1 ? 0.8 : 0.6), s * (fl.scale === 1 ? 1.25 : 1.5), 1);
        this.scene.add(sprite);
        this.flames.push({ sprite, base, scale: s, phase: rand() * 9 + i });
      }
      if (fl.scale !== 1) {
        // The pool of candlelight is painted, not computed: a soft halo around the
        // flame costs nothing per pixel elsewhere in the room.
        const halo = new THREE.Sprite(haloMaterial);
        halo.position.copy(fl.at);
        halo.scale.set(1.25, 1.25, 1);
        this.scene.add(halo);
      }
    });
    // Embers.
    const ember = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.7),
      new THREE.MeshBasicMaterial({ opacity: 0.6, map: glow("rgba(255,150,60,1)", "rgba(170,40,8,.7)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    ember.rotation.x = -Math.PI / 2;
    ember.position.set(-7.5, 0.6, 0.02);
    this.scene.add(ember);
    // Dust in the two shafts of sun.
    const dir = new THREE.Vector3(0.36, -0.56, -0.75).normalize();
    const n = this.o.tier === "high" ? 260 : 110;
    const pts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const c = ROOM.windows[i % 2];
      const along = rand() * 3.4;
      const p = new THREE.Vector3(c + (rand() - 0.5) * 0.9, ROOM.sill + rand() * (ROOM.head - ROOM.sill), 2.9).addScaledVector(dir, along);
      if (p.y < ROOM.floor + 0.05) p.y = ROOM.floor + 0.05 + rand() * 0.6;
      pts.set([p.x, p.y, p.z], i * 3);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    this.dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ map: glow("rgba(255,244,220,1)", "rgba(255,230,180,.35)"), size: 0.016, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }),
    );
    this.scene.add(this.dust);
    // Shafts: faint sheets of lit air from each sash to the floor.
    const beam = document.createElement("canvas");
    beam.width = 8;
    beam.height = 128;
    const bctx = beam.getContext("2d")!;
    const bg = bctx.createLinearGradient(0, 0, 0, 128);
    bg.addColorStop(0, "rgba(255,236,196,.55)");
    bg.addColorStop(1, "rgba(255,236,196,0)");
    bctx.fillStyle = bg;
    bctx.fillRect(0, 0, 8, 128);
    const beamMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(beam), transparent: true, opacity: 0.045, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
    for (const c of ROOM.windows)
      for (const off of [-0.3, 0, 0.3]) {
        const length = 3.6;
        const g = new THREE.PlaneGeometry(ROOM.head - ROOM.sill, length);
        const m = new THREE.Mesh(g, beamMat);
        // Plane spans the window's height and runs down the sun's direction.
        const origin = new THREE.Vector3(c + off, (ROOM.sill + ROOM.head) / 2, 2.9);
        const up = new THREE.Vector3(0, 1, 0);
        const x = up.clone().sub(dir.clone().multiplyScalar(up.dot(dir))).normalize();
        const z = new THREE.Vector3().crossVectors(x, dir.clone().negate()).normalize();
        m.matrixAutoUpdate = false;
        m.matrix.makeBasis(x, dir.clone().negate(), z).setPosition(origin.addScaledVector(dir, length / 2));
        m.renderOrder = 3;
        this.shafts.push(m);
        this.scene.add(m);
      }
    // Chest drawers: the upper two slide. Staggered so both can be seen into.
    const C = ROOM.chest;
    [
      { y0: 1.137, y1: 1.39, reach: 0.3, label: "Correspondence" },
      { y0: 0.882, y1: 1.113, reach: 0.52, label: "Campaign · 1828" },
    ].forEach((d, index) => {
      const b = new Batch();
      const x0 = C.x0 + 0.04,
        x1 = C.x1 - 0.04;
      b.span(f.walnut, x0, x1, d.y0, d.y1, C.z1 - 0.022, C.z1, 0.7, "x");
      // Lined with paper, as a document drawer would be.
      b.span(f.paper, x0 + 0.01, x1 - 0.01, d.y0 + 0.012, d.y0 + 0.022, C.z0 + 0.03, C.z1 - 0.02, 0.4, "x");
      for (const x of [x0 + 0.01, x1 - 0.022])
        b.span(f.walnutDark, x, x + 0.012, d.y0 + 0.012, d.y1 - 0.03, C.z0 + 0.03, C.z1 - 0.02, 0.7, "z");
      b.span(f.walnutDark, x0 + 0.01, x1 - 0.01, d.y0 + 0.012, d.y1 - 0.03, C.z0 + 0.03, C.z0 + 0.042, 0.7, "x");
      for (const s of [-0.38, 0.38]) b.add(new THREE.SphereGeometry(0.017, 10, 8), f.brass, [(x0 + x1) / 2 + s, (d.y0 + d.y1) / 2, C.z1 + 0.014]);
      const group = new THREE.Group();
      const authored = this.kit?.moving("chest.drawer." + (index ? "campaign" : "correspondence"), f);
      group.add(authored ?? b.build("Drawer · " + d.label));
      group.name = "Drawer · " + d.label;
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.024), new THREE.MeshStandardMaterial({ map: plaque(d.label), roughness: 0.4, metalness: 0.6 }));
      tag.position.set((x0 + x1) / 2, (d.y0 + d.y1) / 2, C.z1 + 0.002);
      group.add(tag);
      this.scene.add(group);
      this.drawers.push({ group, open: 0, reach: d.reach });
    });
    // Printed index on the Blender folio. Films open at reading size in the native
    // viewer; the object in the room remains paper, never a glowing monitor.
    const S = ROOM.screen;
    this.screenTexture = this.folioIndex();
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(S.w, S.h), new THREE.MeshBasicMaterial({ map: this.screenTexture, toneMapped: false }));
    this.screen.name = "Viewing folio · printed index";
    this.screen.position.set(S.x, S.y, S.z);
    this.screen.rotation.y = Math.PI / 2;
    this.scene.add(this.screen);
    this.register(this.screen, { kind: "screen" }, "The viewing folio", "Project recordings and all nine soccer highlights");
    void shelves;
  }

  /** Stand every available project volume in its own slot in the family cabinet. */
  private shelve(f: Finishes, shelves: number[]) {
    const { o } = this;
    const front = ROOM.shelfFront - 0.014;
    const rowY = [shelves[1], shelves[0]];
    // Viewer's left is south. Row 0 runs above the screen niche, row 1 beside it.
    const start = [2.85, 2.15];
    const cursor = [...start];
    const upright = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    for (const group of houseShelves) {
      const members = o.volumes
        .filter((v) => v.shelf === group.shelf)
        .sort((a, b) => a.position - b.position);
      if (!members.length) continue;
      const row = group.row;
      const from = cursor[row];
      this.shelf.run();
      for (const v of members) {
        const thickness = bookThickness(v.leaves, v.slug);
        const closed = thickness + BOOK.board * 2;
        const z = cursor[row] - closed / 2;
        cursor[row] -= closed + 0.0015;
        const volume = new Volume3D(
          {
            slug: v.slug,
            title: v.title,
            series: group.title,
            kind: "project",
            color: bindingColors[group.shelf] ?? "#3a2a1c",
            thickness,
            cover: v.cover,
            rest: {
              position: new THREE.Vector3(front, rowY[row] + BOOK.H / 2 + BOOK.over, z),
              quaternion: upright.clone(),
            },
            clear: new THREE.Vector3(1, 0, 0),
          },
          f,
          o.tier,
          o.metrics,
          () => this.invalidate(),
          this.kit,
        );
        this.addVolume(volume);
        this.shelf.add(volume);
      }
      // Bookend and a brass plate under the group.
      const end = cursor[row];
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.min(0.44, from - end + 0.05), 0.047),
        new THREE.MeshStandardMaterial({ map: plaque(group.title), roughness: 0.42, metalness: 0.55 }),
      );
      plate.position.set(ROOM.shelfFront + 0.0012, rowY[row] - 0.027, (from + end) / 2);
      plate.rotation.y = Math.PI / 2;
      this.scene.add(plate);
      const bookend = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.008), f.brass);
      bookend.position.set(front - 0.07, rowY[row] + 0.075, end - 0.006);
      bookend.castShadow = true;
      this.scene.add(bookend);
      cursor[row] = end - 0.085;
    }
    // Volumes placed on shelves this house does not name still get a slot.
    const loose = o.volumes.filter((v) => !houseShelves.some((s) => s.shelf === v.shelf));
    for (const v of loose) {
      const row = cursor[0] > 1.6 ? 0 : 1;
      const thickness = bookThickness(v.leaves, v.slug);
      const closed = thickness + BOOK.board * 2;
      const z = cursor[row] - closed / 2;
      cursor[row] -= closed + 0.0015;
      this.addVolume(
        new Volume3D(
          { slug: v.slug, title: v.title, series: "Portfolio", kind: "project", color: "#3a2a1c", thickness, cover: v.cover, rest: { position: new THREE.Vector3(front, rowY[row] + BOOK.H / 2 + BOOK.over, z), quaternion: upright.clone() }, clear: new THREE.Vector3(1, 0, 0) },
          f,
          o.tier,
          o.metrics,
          () => this.invalidate(),
          this.kit,
        ),
      );
    }
    if (o.companion) {
      const thickness = 0.034;
      const at = V(anchor["book.companion"]);
      this.addVolume(
        new Volume3D(
          {
            slug: o.companion.slug,
            title: o.companion.title,
            series: "A visitor’s companion",
            kind: "companion",
            color: "#3c2616",
            thickness,
            rest: { position: new THREE.Vector3(at.x, at.y + thickness / 2 + BOOK.board, at.z), quaternion: lying(-0.18) },
            clear: new THREE.Vector3(0, 0.6, 0),
          },
          f,
          o.tier,
          o.metrics,
          () => this.invalidate(),
          this.kit,
        ),
      );
    }
  }
  private addVolume(volume: Volume3D) {
    this.volumes.set(volume.spec.slug, volume);
    this.scene.add(volume.group);
    this.register(
      volume.hit,
      { kind: "book", slug: volume.spec.slug },
      volume.spec.title,
      volume.spec.series + " · select to read",
      () => !this.held || this.held.id === volume.spec.slug,
    );
  }

  /** Lay out every inspectable object where the visitor will come across it. */
  private arrange(f: Finishes) {
    const { o } = this;
    const C = ROOM.chest;
    // The open casebook the facsimile leaf lies in.
    const book = new Batch();
    const at = V(anchor["desk.casebook"]);
    book.span(f.calf[0], -0.2, 0.2, 0, 0.006, -0.13, 0.13);
    book.span(f.leaves, -0.19, -0.004, 0.006, 0.03, -0.122, 0.122);
    book.span(f.leaves, 0.004, 0.19, 0.006, 0.022, -0.122, 0.122);
    book.span(f.paper, -0.19, -0.004, 0.03, 0.0305, -0.122, 0.122);
    book.span(f.paper, 0.004, 0.19, 0.022, 0.0225, -0.122, 0.122);
    const casebook = book.build("Open Tennessee Reports");
    casebook.position.copy(at);
    casebook.rotation.y = 0.2;
    this.scene.add(casebook);
    // The two stacked reports beside it, as in Earl's painting.
    const stack = new Batch();
    stack.span(f.calf[2], -0.1, 0.1, 0, 0.045, -0.13, 0.13);
    stack.span(f.leaves, -0.092, 0.097, 0.004, 0.041, -0.124, 0.124);
    stack.span(f.calf[0], -0.105, 0.095, 0.045, 0.092, -0.128, 0.128);
    stack.span(f.leaves, -0.097, 0.092, 0.049, 0.088, -0.122, 0.122);
    const reports = stack.build("Stacked Tennessee Reports");
    reports.position.copy(V(anchor["book.reports"]));
    reports.rotation.y = -0.25;
    this.scene.add(reports);
    // Card tray for the museum records.
    const tray = new Batch();
    tray.span(f.walnutDark, -0.13, 0.13, 0, 0.008, -0.09, 0.09);
    tray.span(f.walnutDark, -0.13, 0.13, 0.008, 0.05, -0.09, -0.082);
    tray.span(f.walnutDark, -0.13, -0.122, 0.008, 0.05, -0.09, 0.09);
    tray.span(f.walnutDark, 0.122, 0.13, 0.008, 0.05, -0.09, 0.09);
    const trayGroup = tray.build("Record tray");
    trayGroup.position.set(-4.36, ROOM.table.top, 0.5);
    trayGroup.rotation.y = -0.12;
    this.scene.add(trayGroup);
    let cards = 0,
      letters = 0;
    for (const object of o.objects) {
      const first = object.pages[0];
      const ratio = first?.width && first?.height ? first.width / first.height : 0.8;
      let width = 0.2,
        height = 0.25,
        rest: { position: THREE.Vector3; quaternion: THREE.Quaternion },
        drawer: number | undefined;
      if (object.form === "card") {
        width = 0.2;
        height = 0.125;
        rest = {
          position: new THREE.Vector3(-4.36 + (cards - 1) * 0.012, ROOM.table.top + 0.075 + cards * 0.004, 0.47 + cards * 0.035),
          quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, Math.PI - 0.12, 0, "YXZ")),
        };
        cards++;
      } else if (object.rest === "desk.letter") {
        height = 0.25;
        width = height * ratio;
        rest = { position: V(anchor["desk.letter"]), quaternion: lying(-0.16) };
      } else if (object.rest === "desk.casebook") {
        height = 0.235;
        width = height * ratio;
        rest = {
          position: new THREE.Vector3(at.x + 0.094, at.y + 0.0235, at.z - 0.02),
          quaternion: lying(0.2),
        };
      } else if (object.rest === "table.map") {
        width = 0.86;
        height = width / ratio;
        rest = { position: V(anchor["table.map"]).add(new THREE.Vector3(0, 0.002, 0)), quaternion: lying(-Math.PI / 2) };
      } else if (object.rest === "drawer.campaign") {
        height = 0.2;
        width = height * ratio;
        drawer = 1;
        rest = { position: new THREE.Vector3((C.x0 + C.x1) / 2 - 0.2, 0.908, C.z1 - 0.2), quaternion: lying(0.1) };
      } else if (object.rest === "wall.jackson") {
        height = 1.0;
        width = height * ratio;
        rest = {
          position: new THREE.Vector3(1.965, 2.25, -0.33),
          quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2),
        };
        // A plain frame stays on the wall when the canvas comes forward.
        const fr = new Batch();
        for (const s of [-1, 1]) {
          fr.span(f.gilt, 1.94, 1.975, 2.25 - height / 2 - 0.05, 2.25 + height / 2 + 0.05, -0.33 + s * (width / 2 + 0.025) - 0.025, -0.33 + s * (width / 2 + 0.025) + 0.025);
          fr.span(f.gilt, 1.94, 1.975, 2.25 + s * (height / 2 + 0.025) - 0.025, 2.25 + s * (height / 2 + 0.025) + 0.025, -0.33 - width / 2 - 0.05, -0.33 + width / 2 + 0.05);
        }
        this.scene.add(fr.build("Jackson frame"));
      } else {
        height = 0.25;
        width = height * ratio;
        drawer = 0;
        rest = {
          position: new THREE.Vector3(C.x0 + 0.3 + (letters % 3) * 0.36, 1.165 + letters * 0.0012, C.z1 - 0.185 - Math.floor(letters / 3) * 0.14),
          quaternion: lying((letters - 1) * 0.12),
        };
        letters++;
      }
      const artifact = new Artifact3D({ object, width, height, rest, drawer, label: object.title }, () => this.invalidate(), this.kit);
      artifact.onMissing = (page) => o.events.scan(object.id, page, false);
      artifact.onLoaded = (page) => o.events.scan(object.id, page, true);
      this.artifacts.set(object.id, artifact);
      this.scene.add(artifact.group);
      this.register(
        artifact.hit,
        { kind: "object", id: object.id },
        object.title,
        object.date + " · select to examine",
        () => !this.held || this.held.id === object.id,
      );
    }
  }
  private hotspots() {
    const spot = (at: number[], size: [number, number, number], place: Place, label: string, hint: string, live: () => boolean) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshBasicMaterial({ visible: false }));
      mesh.position.copy(V(at));
      this.scene.add(mesh);
      this.register(mesh, { kind: "place", place }, label, hint, live);
    };
    // The target is live in the visitor's current room, irrespective of the last stop.
    const at = (...p: Place[]) => () => !this.held && p.some((place) => {
      const pos = this.camera.position;
      return place === "approach" ? pos.z > 3.1 : ["entry", "map"].includes(place) ? pos.x > -1.4 && pos.z < 3.2 : pos.x < -1.6 && pos.z < 3.2;
    });
    spot(anchor["door.south"], [1.3, 2.6, 0.6], "entry", "The south door", "Step inside", at("approach"));
    spot(anchor["door.library"], [0.35, 2.3, 1.25], "library", "The library", "Step into the southwest room", at("entry", "map"));
    spot([-7.58, 2.0, 2.12], [0.4, 1.5, 1.55], "cabinet", "The family cabinet", "John’s project volumes", at("library", "desk", "portrait", "reports", "drawers"));
    spot([-7.58, 1.9, -2.12], [0.4, 1.6, 1.55], "reports", "The law shelves", "The Tennessee Reports", at("library", "desk", "portrait", "cabinet", "drawers"));
    spot([-4.95, 1.25, 0.75], [1.7, 0.3, 1.0], "desk", "The writing table", "Letters and the house book", at("library", "portrait", "cabinet", "reports", "drawers"));
    spot([-2.95, 1.0, -2.74], [1.35, 0.95, 0.5], "drawers", "The correspondence chest", "Letters and the 1828 invitation", at("library", "desk", "portrait", "cabinet", "reports"));
    spot([1.49, 1.3, -0.38], [0.85, 0.5, 1.5], "map", "The map table", "Tennessee in 1795", at("entry"));
    // The two Tennessee Reports left standing among the law books.
    const f = this.volumes.values().next().value;
    void f;
    const leatherA = new THREE.MeshStandardMaterial({ color: "#5d3018", roughness: 0.5 });
    for (const [i, z] of [-2.07, -2.19].entries()) {
      const vol = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.27, 0.058), [new THREE.MeshStandardMaterial({ map: this.reportSpine(i + 1), roughness: 0.5 }), leatherA, leatherA, leatherA, leatherA, leatherA]);
      vol.position.set(ROOM.shelfFront - 0.12, 1.63 + 0.135, z);
      vol.castShadow = vol.receiveShadow = true;
      this.scene.add(vol);
      // They answer a pointer as the project volumes do: tipped out by the headcap.
      this.reports.push({ mesh: vol, home: vol.position.clone(), hover: 0, target: 0 });
      this.register(vol, { kind: "object", id: "murfree-leeper" }, "Tennessee Reports, volume " + (i + 1), "Overton, reporter · select to open the first case", () => !this.held && this.artifacts.has("murfree-leeper"));
    }
  }
  private reportSpine(volume: number) {
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 448;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#5d3018";
    ctx.fillRect(0, 0, 96, 448);
    for (const y of [40, 120, 300, 380]) {
      ctx.fillStyle = "#d9b56c";
      ctx.fillRect(0, y, 96, 3);
    }
    ctx.fillStyle = "#6e1712";
    ctx.fillRect(8, 136, 80, 92);
    ctx.fillStyle = "#e3c27c";
    ctx.textAlign = "center";
    ctx.font = "600 15px " + serif;
    ctx.fillText("TENNESSEE", 48, 166, 76);
    ctx.fillText("REPORTS", 48, 188, 76);
    ctx.font = "13px " + serif;
    ctx.fillText("OVERTON", 48, 212, 76);
    ctx.font = "600 22px " + serif;
    ctx.fillText(String(volume), 48, 268);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  private folioIndex() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 830;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#eee1bf"; ctx.fillRect(0, 0, 1024, 830);
    ctx.strokeStyle = "#ac8c50"; ctx.lineWidth = 2; ctx.strokeRect(25, 25, 974, 780);
    ctx.fillStyle = "#44351f"; ctx.textAlign = "center";
    ctx.font = "28px " + serif; ctx.fillText("FROM THE FAMILY CABINET", 512, 130);
    ctx.font = "64px " + serif; ctx.fillText("The viewing folio", 512, 255);
    ctx.fillRect(412, 306, 200, 2);
    ctx.font = "42px " + serif; ctx.fillText("Project recordings", 512, 403);
    ctx.fillText("& case studies", 512, 461);
    ctx.fillText("Soccer highlights", 512, 562);
    ctx.font = "30px " + serif; ctx.fillText("Nine moments · two matches", 512, 614);
    ctx.font = "italic 32px " + serif; ctx.fillText("Open to read & watch", 512, 729);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    return texture;
  }
  private register(mesh: THREE.Object3D, target: Target, label: string, hint: string, live: () => boolean = () => !this.held) {
    this.hits.push({ mesh, target, label, hint, live });
  }

  private bind() {
    const { canvas } = this.o;
    const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement | Window, type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn as EventListener, opts);
      this.disposers.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };
    on(canvas, "pointermove", (e) => {
      if (e.pointerType === "touch" || this.controller.dragged) return;
      // With the pointer captured for mouse-look, the middle of the view is the pointer.
      const at = this.controller.aimPoint(e);
      const hit = this.pick(at.x, at.y);
      this.setHover(hit, at.x, at.y);
      // Over bare floor, mark where a press would take the visitor.
      this.controller.preview(hit || this.held ? null : this.floorPoint(at.x, at.y));
    });
    on(canvas, "pointerleave", () => {
      this.setHover(null, 0, 0);
      this.controller.preview(null);
    });
    on(canvas, "click", (e) => {
      // The click that ends a carry of the held book is not a new selection.
      if (this.carried) {
        this.carried = false;
        return;
      }
      if (this.controller.dragged) return;
      const at = this.controller.aimPoint(e);
      const hit = this.pick(at.x, at.y);
      if (hit) {
        this.o.events.select(hit.target);
        return;
      }
      if (this.held) return;
      // An empty patch of floor: walk there, round whatever stands between.
      const point = this.floorPoint(at.x, at.y);
      if (point) this.controller.walk(point.x, point.z);
    });
    on(canvas, "wheel", (e) => {
      const a = this.heldArtifact();
      if (!a?.settled) return;
      e.preventDefault();
      a.setView({ ...a.view, zoom: a.view.zoom * (e.deltaY < 0 ? 1.18 : 1 / 1.18) });
    }, { passive: false });
    // Drag pans a held document; two fingers pinch it.
    const fingers = new Map<number, { x: number; y: number }>();
    let spread = 0;
    on(canvas, "pointerdown", (e) => {
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (fingers.size === 2) {
        const [p, q] = [...fingers.values()];
        spread = Math.hypot(p.x - q.x, p.y - q.y);
      }
    });
    on(window, "pointermove", (e) => {
      const prev = fingers.get(e.pointerId);
      const a = this.heldArtifact();
      if (!prev || !a?.settled) return;
      const dx = e.clientX - prev.x,
        dy = e.clientY - prev.y;
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (fingers.size === 2) {
        const [p, q] = [...fingers.values()];
        const now = Math.hypot(p.x - q.x, p.y - q.y);
        if (spread > 0) a.setView({ ...a.view, zoom: a.view.zoom * (now / spread) });
        spread = now;
      } else if (a.view.zoom > 1.01) {
        const scale = a.view.zoom * this.size.h * 0.78;
        a.setView({ ...a.view, x: a.view.x - dx / scale / (a.spec.width / a.spec.height), y: a.view.y + dy / scale });
      }
    });
    const lift = (e: PointerEvent) => {
      fingers.delete(e.pointerId);
      spread = 0;
    };
    on(window, "pointerup", lift);
    on(window, "pointercancel", lift);
    // The held book, taken by its boards or caught in flight, follows the pointer;
    // carried toward its shelf and let go, it is put back. Capture phase, so the
    // camera does not also turn with the same drag.
    on(window, "pointerdown", (e) => {
      this.carried = false;
      const book = this.heldBook();
      if (e.target !== canvas || e.button || !book || this.hold.active) return;
      const hit = this.pick(e.clientX, e.clientY);
      if (hit?.target.kind !== "book" || hit.target.slug !== book.spec.slug) return;
      e.stopPropagation();
      this.canvasHold = e.pointerId;
      this.grabBook(e.clientX, e.clientY);
    }, { capture: true });
    on(window, "pointermove", (e) => {
      if (e.pointerId === this.canvasHold) this.dragBook(e.clientX, e.clientY);
    });
    const letGo = (e: PointerEvent) => {
      if (e.pointerId !== this.canvasHold) return;
      this.canvasHold = -1;
      const result = this.releaseBook(e.type === "pointercancel");
      this.carried = result !== "tap";
      if (result === "return") this.putBack?.();
    };
    on(window, "pointerup", letGo);
    on(window, "pointercancel", letGo);
    const observer = new ResizeObserver(() => this.resize());
    observer.observe(canvas.parentElement ?? canvas);
    this.disposers.push(() => observer.disconnect());
    const wake = () => {
      cancelAnimationFrame(this.frame);
      this.last = 0;
      if (!document.hidden && !this.paused && !this.disposed) {
        this.invalidate();
        this.frame = requestAnimationFrame(this.tick);
      }
    };
    document.addEventListener("visibilitychange", wake);
    this.disposers.push(() => document.removeEventListener("visibilitychange", wake));
    const lost = (e: Event) => {
      e.preventDefault();
      this.dispose();
      this.o.events.failed();
    };
    canvas.addEventListener("webglcontextlost", lost);
    this.disposers.push(() => canvas.removeEventListener("webglcontextlost", lost));
  }
  private heldArtifact() {
    return this.held?.kind === "object" ? (this.artifacts.get(this.held.id) ?? null) : null;
  }
  private pointer = new THREE.Vector2();
  private pick(x: number, y: number) {
    const r = this.o.canvas.getBoundingClientRect();
    this.pointer.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const live = this.hits.filter((h) => this.inReach(h));
    const found = this.raycaster.intersectObjects(live.map((h) => h.mesh), false)[0];
    if (!found) return null;
    const hit = live.find((h) => h.mesh === found.object) ?? null;
    // Hotspots yield to anything physical in front of or behind them within reach.
    if (hit?.target.kind === "place") {
      const nearer = this.raycaster
        .intersectObjects(live.filter((h) => h.target.kind !== "place").map((h) => h.mesh), false)[0];
      if (nearer) return live.find((h) => h.mesh === nearer.object) ?? hit;
    }
    return hit;
  }
  private floorPoint(x: number, y: number) {
    const r = this.o.canvas.getBoundingClientRect();
    this.pointer.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // Boards, deck or lawn, and only where a visitor could stand and see to.
    return this.controller.floorTarget(this.raycaster.ray);
  }
  private setHover(hit: Hit | null, x: number, y: number) {
    if (this.hovered !== hit) {
      this.focusTarget(hit?.target ?? null);
      // Under a pointer only the report it rests on comes forward.
      if (hit) for (const r of this.reports) r.target = hit.mesh === r.mesh ? 1 : 0;
      this.hovered = hit;
      this.o.canvas.style.cursor = hit ? "pointer" : "";
    }
    // In the hand, the same binding offers the way back.
    const inHand = hit?.target.kind === "book" && this.held?.id === hit.target.slug;
    this.o.events.hover(hit ? { label: hit.label, hint: inHand ? "Drag toward its shelf to put it back" : hit.hint, x, y } : null);
  }
  /** Nudge a binding or sheet forward: used by pointer hover and by keyboard focus. */
  focusTarget(target: Target | null) {
    const slug = target?.kind === "book" && !this.held ? target.slug : "";
    if (slug !== this.shelfLabelSlug) {
      this.shelfLabelSlug = slug;
      const book = this.volumes.get(slug);
      if (book) {
        this.shelfLabel ??= new THREE.Sprite(new THREE.SpriteMaterial({depthTest:false,depthWrite:false,toneMapped:false}));
        this.shelfLabel.material.map?.dispose();
        this.shelfLabel.material.map = plaque(book.spec.title);
        this.shelfLabel.material.needsUpdate = true;
        this.shelfLabel.position.copy(book.spec.rest.position).add(new THREE.Vector3(.28,.26,0));
        this.shelfLabel.scale.set(1.15,.108,1);
        this.shelfLabel.renderOrder = 8;
        this.scene.add(this.shelfLabel);
      }
      if (this.shelfLabel) this.shelfLabel.visible = !!book;
    }
    for (const v of this.volumes.values()) v.hoverTarget = target?.kind === "book" && target.slug === v.spec.slug ? 1 : 0;
    this.shelf.focus(target?.kind === "book" ? target.slug : null);
    for (const r of this.reports) r.target = !this.held && target?.kind === "object" && target.id === "murfree-leeper" ? 1 : 0;
    for (const a of this.artifacts.values()) a.hoverTarget = target?.kind === "object" && target.id === a.spec.object.id ? 1 : 0;
    this.invalidate();
  }

  resize() {
    const el = this.o.canvas.parentElement ?? this.o.canvas;
    const w = Math.max(1, el.clientWidth),
      h = Math.max(1, el.clientHeight);
    this.size = { w, h };
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 66 : w / h < 1.25 ? 60 : 55;
    this.controller.setNarrow(w / h < 0.8);
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }
  invalidate() {
    this.dirty = true;
  }

  /** Where something of a given size should be held so it fills the free view. */
  private hand(width: number, height: number, tilt: number, fill = 0.86): Hand {
    const { w, h } = this.size;
    const i = this.insets;
    const fw = Math.max(0.2, (w - i.left - i.right) / w),
      fh = Math.max(0.2, (h - i.top - i.bottom) / h);
    const cx = (i.left - i.right) / w,
      cy = (i.bottom - i.top) / h;
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const d = Math.max(width / (fw * fill * this.camera.aspect), height / (fh * fill)) / (2 * t);
    const q = this.camera.quaternion;
    const position = this.camera.position
      .clone()
      .add(new THREE.Vector3(cx * d * t * this.camera.aspect, cy * d * t, -d).applyQuaternion(q));
    const quaternion = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt));
    return { position, quaternion, single: this.single };
  }
  private bookHand(): Hand {
    const { W, H } = BOOK;
    // Resting pages face the eye squarely. Native text then needs only an affine
    // transform, avoiding perspective-rasterized glyphs on a still reading surface.
    return this.hand(this.single ? W + 0.012 : W * 2 + 0.03, H + 0.022, 0, 0.98);
  }
  private heldBook() {
    return this.held?.kind === "book" ? (this.volumes.get(this.held.id) ?? null) : null;
  }
  /** Take hold of the held book at a point on screen. */
  grabBook(x: number, y: number) {
    const book = this.heldBook();
    if (!book || this.hold.active) return false;
    this.hold.begin(book, x, y);
    return true;
  }
  /** Carry it with the pointer. True once letting go would put it back. */
  dragBook(x: number, y: number) {
    const was = this.hold.loose;
    const armed = this.hold.move(x, y);
    if (!was && this.hold.loose) {
      // It has left the reading position: the DOM pages step aside until it settles.
      this.settledId = "";
      this.o.events.settled("book", "");
    }
    this.shelf.arm(armed);
    this.invalidate();
    return armed;
  }
  /** Let go: "return" asks the caller to put the book back, "stay" settles it open
      again, "tap" means it was never moved. */
  releaseBook(abandon = false) {
    const result = this.hold.end(abandon);
    this.shelf.arm(false);
    this.invalidate();
    return result;
  }
  /** Who to tell when a book taken hold of in the room should go back. */
  onPutBack(fn: (() => void) | null) {
    this.putBack = fn;
  }
  /** Take the leaf beside the open spread by its edge. */
  grabLeaf(slug: string, dir: 1 | -1, left: Sheet | null, right: Sheet | null, fraction: number) {
    return this.volumes.get(slug)?.grabLeaf(dir, left, right, fraction) ?? Promise.resolve(false);
  }
  /** Move the held leaf with a pointer that started at (x0, y0). Returns how far over
      it is, 0…1. Its edge keeps the pointer's travel across the paper. */
  scrubLeaf(slug: string, dir: 1 | -1, x0: number, y0: number, x: number, y: number) {
    const book = this.volumes.get(slug);
    if (!book) return 0;
    const at = (px: number, py: number) => {
      const r = this.o.canvas.getBoundingClientRect();
      this.pointer.set(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      return book.touch(this.raycaster.ray)?.x ?? 0;
    };
    // One page at a time, the leaf's far side is off the screen: half the travel will do.
    const travel = ((at(x, y) - at(x0, y0)) / BOOK.W) * (this.single ? 2 : 1);
    const edge = THREE.MathUtils.clamp(dir > 0 ? 1 + travel : -1 + travel, -1, 1);
    // The leaf's angle puts its edge under the pointer; undo the easing of the turn.
    const s = Math.acos(edge) / Math.PI;
    const eased = 0.5 - Math.sin(Math.asin(1 - 2 * s) / 3);
    const t = dir > 0 ? eased : 1 - eased;
    book.scrub(t);
    return t;
  }
  dropLeaf(slug: string, turn: boolean) {
    this.volumes.get(slug)?.drop(turn);
  }

  /** Page shape and the screen area the DOM panels leave free. */
  setLayout(single: boolean, insets: Insets) {
    this.single = single;
    this.insets = insets;
    this.invalidate();
  }
  /** The route is the single source of truth for where the visitor is and what is held. */
  private arriveInstantly = true;
  private pendingLanding: boolean | null = null;
  /** Queue safely before model readiness; the route owner supplies #landing. */
  visitLanding(instant = false) {
    if (this.o.canvas.getAttribute("data-scene") !== "ready") {
      this.pendingLanding = instant;
      return true;
    }
    const accepted = this.controller.visitLanding(instant);
    this.invalidate();
    return accepted;
  }
  setRoute(route: Route, instant = false) {
    this.pendingLanding = null;
    this.route = route;
    if (this.o.canvas.getAttribute("data-scene") === "ready") this.applyRoute(route, instant);
    // Asked before the house has loaded: keep the manner of arrival for when it has.
    else this.arriveInstantly = instant;
  }
  private applyRoute(route: Route, instant: boolean) {
    const f = route.focus;
    const next = f?.kind === "book" ? { kind: "book" as const, id: f.slug } : f?.kind === "object" ? { kind: "object" as const, id: f.id } : null;
    const known = next && (next.kind === "book" ? this.volumes.has(next.id) : this.artifacts.has(next.id));
    const want = known ? next : null;
    const changed = want?.id !== this.held?.id || want?.kind !== this.held?.kind;
    if (changed) {
      // One thing in the hand at a time: whatever was out goes back to its place.
      for (const v of this.volumes.values()) if (v.spec.slug !== want?.id) v.target = 0;
      for (const a of this.artifacts.values()) if (a.spec.object.id !== want?.id) a.target = 0;
      this.settledId = "";
      // Whatever was settled in the hand no longer is.
      this.o.events.settled(want?.kind ?? "book", "");
    }
    const moving = this.controller.place !== route.place || this.controller.level !== "ground" || instant;
    if (want) {
      if (!this.held) this.returnPose = null;
      this.held = want;
      this.controller.held = true;
      if (moving) this.controller.go(route.place, instant);
      const item = want.kind === "book" ? this.volumes.get(want.id)! : this.artifacts.get(want.id)!;
      if (want.kind === "book") (item as Volume3D).prepareTurn(this.renderer);
      item.target = 1;
      if (instant || this.o.reduced) item.progress = 1;
      if (want.kind === "object") (item as Artifact3D).showPage((f as { page?: number }).page ? (f as { page: number }).page - 1 : 0, changed || instant);
    } else {
      this.held = null;
      this.controller.held = false;
      if (moving || !this.returnPose) this.controller.go(route.place, instant);
      else this.controller.restore(this.returnPose);
      this.returnPose = null;
    }
    this.setHover(null, 0, 0);
    this.invalidate();
  }
  /** Remember the view an inspection started from. */
  rememberPose() {
    if (!this.returnPose && !this.controller.travelling) this.returnPose = this.controller.pose();
  }
  skipTravel() {
    this.controller.skip();
    for (const v of this.volumes.values()) if (v.target !== v.progress) v.progress = v.target;
    for (const a of this.artifacts.values()) if (a.target !== a.progress) a.progress = a.target;
    this.invalidate();
  }
  /** DOM pages that the open book carries. Their transforms follow the paper. */
  attachPages(left: HTMLElement | null, right: HTMLElement | null) {
    this.pages = { left, right };
    this.invalidate();
  }
  volume(slug: string) {
    return this.volumes.get(slug) ?? null;
  }
  artifact(id: string) {
    return this.artifacts.get(id) ?? null;
  }
  setSpread(slug: string, left: Sheet | null, right: Sheet | null, fraction: number) {
    this.volumes.get(slug)?.setSpread(left, right, fraction);
  }
  setPageMetrics(slug: string, metrics: PageMetrics) {
    this.volumes.get(slug)?.setMetrics(metrics);
    this.invalidate();
  }
  turn(slug: string, dir: 1 | -1, left: Sheet | null, right: Sheet | null, fraction: number) {
    return this.volumes.get(slug)?.turn(dir, left, right, fraction, this.o.reduced) ?? Promise.resolve(false);
  }
  setInk(slug: string, on: boolean) {
    this.volumes.get(slug)?.setInk(on);
  }
  setView(id: string, view: View) {
    this.artifacts.get(id)?.setView(view);
  }
  highlight(id: string, range: { y0: number; y1: number } | null) {
    this.artifacts.get(id)?.highlight(range);
  }
  /** The custodian follows a cue whose clock is the audio element (or a silent timer). */
  speak(speech: { cue: Cue; time: () => number; playing: () => boolean } | null, attention?: number[] | null) {
    if (!this.portrait) return;
    this.portrait.speech = speech;
    this.portrait.attend(attention ? V(attention) : null);
    this.invalidate();
  }
  /** Drive the portrait's mouth from a live voice level, or stop with null. */
  speakLive(level: (() => number) | null) {
    if (!this.portrait) return;
    this.portrait.live = level;
    this.invalidate();
  }
  attend(point: number[] | null) {
    this.portrait?.attend(point ? V(point) : null);
    this.invalidate();
  }
  getEnvironment() { return this.atmosphere.state(); }
  /** Duck sound for narration/video without changing the visitor's sound preference. */
  suspendAtmosphere(value: boolean) {
    this.atmosphereDucked = value;
    this.atmosphere.suspend(value || this.paused || document.hidden);
  }
  /** Enable sound from a user gesture; the result reports whether audio started. */
  async setEnvironment(change: Partial<EnvironmentState>) {
    await this.atmosphere.set(change);
    return this.atmosphere.state();
  }

  /** Pause the world without losing the held leaf, camera or animation progress.
      The report overlay owns its own audio; call resume when it closes. */
  pause() {
    if (this.paused) return;
    this.paused = true;
    cancelAnimationFrame(this.frame);
    this.controller.suspend(true);
    this.atmosphere.suspend(true);
    this.last = 0;
  }
  resume() {
    if (!this.paused || this.disposed) return;
    this.paused = false;
    this.controller.suspend(!this.prepared);
    this.atmosphere.suspend(document.hidden || this.atmosphereDucked);
    this.last = 0;
    this.invalidate();
    this.frame = requestAnimationFrame(this.tick);
  }
  private inReach(hit: Hit) {
    if (!hit.live()) return false;
    // All placed collections are on the ground floor. Directory navigation may
    // bring the visitor down, but objects cannot be picked through the landing.
    if (this.controller.level !== "ground" && hit.target.kind !== "place") return false;
    if (this.held) return true;
    const at = hit.mesh.getWorldPosition(new THREE.Vector3()), eye = this.camera.position;
    if ((at.x < -1.6) !== (eye.x < -1.6) && at.z < 3.1 && eye.z < 3.1 && hit.target.kind !== "place") return false;
    return Math.hypot(at.x - eye.x, at.z - eye.z) <= (hit.target.kind === "place" ? 6.5 : hit.target.kind === "portrait" ? 6 : 3);
  }
  /** Accessible controls and pointer picking share this physical-distance policy. */
  reachable(): Reachable[] {
    const unique = new Map<string, Reachable>();
    for (const hit of this.hits) if (this.inReach(hit)) {
      const key = JSON.stringify(hit.target);
      if (!unique.has(key)) unique.set(key, { key, label: hit.label, hint: hit.hint, target: hit.target });
    }
    return [...unique.values()];
  }

  private tick = (now: number) => {
    if (this.disposed || this.paused || document.hidden) return;
    this.frame = requestAnimationFrame(this.tick);
    if (!this.prepared) return;
    if (document.hidden) return;
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0.016;
    this.last = now;
    this.clock += dt;
    let active = this.controller.update(dt);
    this.atmosphere.update(this.camera.position, !this.held);
    const inside = this.camera.position.x < -1.3 && this.camera.position.z < 3.2;
    // Drawers answer to where the visitor stands.
    const atChest = Math.hypot(this.camera.position.x - (ROOM.chest.x0 + ROOM.chest.x1) / 2, this.camera.position.z - ROOM.chest.z1) < 1.65 && !this.controller.travelling;
    for (const d of this.drawers) {
      const goal = atChest || (this.held?.kind === "object" && this.artifacts.get(this.held.id)?.spec.drawer !== undefined) ? 1 : 0;
      if (Math.abs(d.open - goal) > 0.001) {
        d.open = this.o.reduced ? goal : THREE.MathUtils.damp(d.open, goal, 5, dt);
        d.group.position.z = d.open * d.reach;
        active = true;
      }
    }
    setDrawerExtension(Math.max(0, ...this.drawers.map((d) => d.open * d.reach)));
    for (const shaft of this.shafts) shaft.visible = !this.held;
    const bookHand = this.bookHand();
    // A hand on the book moves where it is held; the shelf answers to what is out.
    if (this.hold.apply(bookHand, dt, this.o.reduced)) active = true;
    if (this.shelf.update()) active = true;
    for (const r of this.reports)
      if (r.hover !== r.target) {
        r.hover = this.o.reduced ? r.target : THREE.MathUtils.damp(r.hover, r.target, 13, dt);
        if (Math.abs(r.hover - r.target) < 0.004) r.hover = r.target;
        // Spine toward the room (+x): slide out and tip the head forward.
        r.mesh.position.set(r.home.x + 0.03 * r.hover, r.home.y - 0.004 * r.hover, r.home.z);
        r.mesh.rotation.z = -0.11 * r.hover;
        active = true;
      }
    let stirred = false;
    // A leaf turning in the hand only changes the shadow under the reading light.
    let leafing = false;
    for (const d of this.drawers) if (d.open > 0.001 && d.open < 0.999) stirred = true;
    for (const v of this.volumes.values())
      if (v.update(dt, bookHand, this.o.reduced)) {
        active = true;
        if (v.turning && v.settledOpen) leafing = true;
        else stirred = true;
      }
    for (const a of this.artifacts.values()) {
      const s = a.spec;
      const hand = this.hand(s.width, s.height, 0, 0.82);
      const offset = new THREE.Vector3(0, 0, s.drawer !== undefined ? this.drawers[s.drawer].open * this.drawers[s.drawer].reach : 0);
      if (a.update(dt, hand, this.o.reduced, offset)) {
        active = true;
        stirred = true;
      }
    }
    // The sun and its orthographic shadow camera stay fixed in world space.
    // Walking without a held object changes only the view, so its existing map is
    // still exact. Redraw it for moving casters, not for camera-only travel.
    if (stirred || (this.held && this.controller.travelling)) this.stir = 3;
    if (this.stir > 0) {
      this.stir--;
      if (this.sun) this.sun.shadow.needsUpdate = true;
      this.readingLight.shadow.needsUpdate = true;
      active = true;
    } else if (leafing) this.readingLight.shadow.needsUpdate = true;
    if (this.portrait?.update(dt, this.camera.position, this.o.reduced)) active = inside || !!this.portrait.speech || !!this.portrait.live;
    // What is in the hand has arrived: tell the DOM surfaces once.
    if (this.held) {
      const item = this.held.kind === "book" ? this.volumes.get(this.held.id) : this.artifacts.get(this.held.id);
      const settled = this.held.kind === "book" ? (item as Volume3D)?.settledOpen : (item as Artifact3D)?.settled;
      if (settled && this.settledId !== this.held.id) {
        this.settledId = this.held.id;
        this.o.events.settled(this.held.kind, this.held.id);
      }
      const lit = this.held.kind === "book" ? bookHand.position : this.hand(0.3, 0.3, 0).position;
      this.readingLight.target.position.copy(lit);
      this.readingLight.position.copy(lit).add(new THREE.Vector3(0.18, 0.5, 0.32).applyQuaternion(this.camera.quaternion));
      const level = item ? item.progress : 0;
      this.readingLight.intensity = 1.9 * THREE.MathUtils.smoothstep(level, 0.5, 1);
    } else if (this.readingLight.intensity) this.readingLight.intensity = 0;
    // Living light: only worth drawing while the visitor can see the room.
    if (inside && !this.o.reduced) {
      const t = this.clock;
      const flick = 0.82 + 0.1 * Math.sin(t * 9.1) + 0.08 * Math.sin(t * 15.7 + 1.3) + 0.06 * Math.sin(t * 4.3);
      if (this.fire) this.fire.intensity = 0.75 * flick;
      for (const fl of this.flames) {
        const s = 0.85 + 0.2 * Math.sin(t * 8 + fl.phase) + 0.1 * Math.sin(t * 13 + fl.phase * 2);
        fl.sprite.scale.set(fl.scale * 0.7 * (fl.scale > 0.2 ? 1 : 0.8), fl.scale * 1.3 * s, 1);
        fl.sprite.position.y = fl.base.y + (fl.scale > 0.2 ? 0.05 * s : 0.004 * s);
      }
      if (this.dust) this.dust.rotation.y = Math.sin(t * 0.05) * 0.012;
      active = true;
    }
    // Outdoors is alive only while the visitor is out there or in the hall looking out.
    if (!inside && this.grounds?.update(dt, this.camera.position)) active = true;
    if (active || this.dirty) {
      this.dirty = false;
      this.renderer.render(this.scene, this.camera);
      this.placePages();
      // Protect the frame rate on slower graphics: give up resolution, never motion.
      this.fps.frames++;
      if (dt > 0.03) this.fps.slow++;
      if (this.fps.frames >= 90) {
        // A third of recent frames missed their slot: render fewer pixels. The words on
        // an open page are DOM and stay sharp whatever the canvas resolution.
        const ratio = this.renderer.getPixelRatio();
        if (this.fps.slow > 30 && ratio > 0.7) {
          this.renderer.setPixelRatio(ratio > 1 ? 1 : Math.max(0.7, ratio - 0.15));
          this.resize();
          this.o.canvas.setAttribute("data-ratio", String(this.renderer.getPixelRatio()));
        }
        this.fps = { frames: 0, slow: 0 };
      }
    }
  };
  /** Register each DOM page to its sheet of paper with a projective transform. */
  private placePages() {
    const book = this.held?.kind === "book" ? this.volumes.get(this.held.id) : null;
    const { left, right } = this.pages;
    if (!book || book.progress < 0.9) return;
    const quads = book.quads(this.camera, this.size.w, this.size.h);
    const m = book.metrics;
    for (const [el, q] of [
      [left, quads.left],
      [right, quads.right],
    ] as const) {
      if (!el) continue;
      const [p0, p1, p2, p3] = q;
      const dx1 = p1[0] - p2[0],
        dx2 = p3[0] - p2[0],
        sx = p0[0] - p1[0] + p2[0] - p3[0];
      const dy1 = p1[1] - p2[1],
        dy2 = p3[1] - p2[1],
        sy = p0[1] - p1[1] + p2[1] - p3[1];
      const den = dx1 * dy2 - dx2 * dy1;
      const g = (sx * dy2 - dx2 * sy) / den,
        h = (dx1 * sy - sx * dy1) / den;
      const a = p1[0] - p0[0] + g * p1[0],
        b = p3[0] - p0[0] + h * p3[0],
        c = p0[0];
      const d = p1[1] - p0[1] + g * p1[1],
        e = p3[1] - p0[1] + h * p3[1],
        f = p0[1];
      const W = m.width,
        H = m.height;
      // A book at rest is square to the camera. Keep it in the browser's 2D text
      // compositor instead of making Chrome rasterize a projective layer.
      if (Math.abs(g) < 1e-7 && Math.abs(h) < 1e-7) {
        const matrix = [a / W, d / W, b / H, e / H, c, f].map(n => +n.toFixed(8)).join(",");
        if (el.dataset.matrix !== matrix) {
          el.dataset.matrix = matrix;
          el.style.transform = "matrix(" + matrix + ")";
        }
        continue;
      }
      // Written only when the paper has actually moved: a still book costs the page
      // compositor nothing.
      const matrix = [a / W, d / W, 0, g / W, b / H, e / H, 0, h / H, 0, 0, 1, 0, c, f, 0, 1]
        .map((n) => +n.toFixed(6))
        .join(",");
      if (el.dataset.matrix !== matrix) {
        el.dataset.matrix = matrix;
        el.style.transform = "matrix3d(" + matrix + ")";
      }
    }
  }
  /** Numbers for the measured-delivery report. */
  stats() {
    const info = this.renderer.info;
    return { triangles: info.render.triangles, calls: info.render.calls, textures: info.memory.textures, geometries: info.memory.geometries, pixelRatio: this.renderer.getPixelRatio() };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.resources.tree(this.scene);
    if (this.scene.background instanceof THREE.Texture) this.resources.own(this.scene.background);
    cancelAnimationFrame(this.frame);
    this.disposers.forEach((d) => d());
    this.controller.dispose();
    this.atmosphere.dispose();
    this.volumes.forEach((v) => v.dispose());
    this.shelf.dispose();
    this.artifacts.forEach((a) => a.dispose());
    this.portrait?.dispose();
    this.grounds?.dispose();
    this.kit?.dispose();
    this.screenTexture?.dispose();
    this.resources.dispose();
    this.scene.clear();
    this.renderer.dispose();
    clearTimeout(this.startupTimer);
    // The entrance renderer is replaced by the visit renderer. Release its GPU
    // allocations instead of waiting for detached-canvas collection.
    // React development replay may immediately reuse the same connected canvas.
    // Lose the context only after an actual unmount has detached it.
    setTimeout(() => { if (!this.o.canvas.isConnected) this.renderer.forceContextLoss(); }, 0);
  }
}
export { places, companionSlug };
