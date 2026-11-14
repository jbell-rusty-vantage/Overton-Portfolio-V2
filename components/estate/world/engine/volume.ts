/* A physical volume. One number, `progress`, carries it from its shelf slot (0) to
   lying open in the visitor's hands (1); every pose between is a pure function of that
   number, so a book recalled halfway simply runs back along the same path and settles
   in its own slot. Local frame: spine on Y, pages along ±X, the reading surface at
   Z = 0 facing +Z. */
import * as THREE from "three";
import {
  easeInOut,
  facedBox,
  leather,
  seeded,
  slab,
  standard,
  type Tier,
} from "./kit";
import type { Finishes } from "./room";
import type { Kit } from "./props";
import {
  paintSheet,
  serif,
  type PageMetrics,
  type Sheet,
} from "../sheets";

export const BOOK = { W: 0.2, H: 0.285, board: 0.0042, over: 0.006 };
export type VolumeSpec = {
  slug: string;
  title: string;
  /** Small line on the spine foot and cover: the shelf it belongs to. */
  series: string;
  kind: "project" | "companion";
  color: string;
  thickness: number;
  cover?: string;
  rest: { position: THREE.Vector3; quaternion: THREE.Quaternion };
  /** Direction that clears the shelf or the table. */
  clear: THREE.Vector3;
};
export type Hand = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  single: boolean;
};
/** Shares of `progress`: clear of the shelf by PULL, in the hand by CARRY; the boards
    begin to part at OPEN, a little before it arrives. */
export const PULL = 0.2,
  CARRY = 0.64,
  OPEN = CARRY - 0.07;
const UP = new THREE.Vector3(0, 1, 0);
const scratch = {
  out: new THREE.Vector3(),
  along: new THREE.Vector3(),
  pivot: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  m: new THREE.Matrix4(),
};

function fitTitle(ctx: CanvasRenderingContext2D, text: string, width: number, start: number, min: number, weight = "") {
  let size = start;
  let lines: string[] = [];
  for (; size >= min; size -= 1) {
    ctx.font = weight + size + "px " + serif;
    lines = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (line && ctx.measureText(next).width > width) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
    if (lines.length <= 3 && lines.every((l) => ctx.measureText(l).width <= width)) break;
  }
  return { size, lines };
}
const gold = "#d9b56c";

export class Volume3D {
  readonly ready: Promise<void>;
  readonly group = new THREE.Group();
  readonly hit: THREE.Mesh;
  progress = 0;
  target = 0;
  hover = 0;
  hoverTarget = 0;
  /** A neighbour makes room: −1…1 along the shelf, away from the binding in hand. */
  sway = 0;
  swayTarget = 0;
  /** Leaning into the gap a neighbour left: −1…1 along the shelf. */
  private lean = 0;
  private stale = false;
  /** Share of the leaves lying to the left when open. */
  private fraction = 0.1;
  private left = new THREE.Group();
  private right = new THREE.Group();
  private blockL: THREE.Mesh;
  private blockR: THREE.Mesh;
  private boardL: THREE.Mesh;
  private boardR: THREE.Mesh;
  private spineL: THREE.Mesh;
  private spineR: THREE.Mesh;
  private spine: THREE.Mesh;
  private pageL: THREE.Mesh;
  private pageR: THREE.Mesh;
  private leaf: THREE.Mesh;
  private leafBack: THREE.Mesh;
  /** A closed book standing in its slot is drawn as one simple block. */
  private proxy: THREE.Mesh;
  private detailed = true;
  private canvases: Record<"L" | "R" | "A" | "B", HTMLCanvasElement>;
  private textures: Record<"L" | "R" | "A" | "B", THREE.CanvasTexture>;
  private shown: { left: Sheet | null; right: Sheet | null } = { left: null, right: null };
  /** A leaf in the air. `t` runs from lying where it was (0) to lying turned (1) and
      heads for `goal`; while a hand holds it, `t` is set directly. */
  private flip: {
    t: number;
    goal: 0 | 1;
    held: boolean;
    dir: 1 | -1;
    done: (turned: boolean) => void;
    after: { left: Sheet | null; right: Sheet | null };
    fractions: [number, number];
    /** The far side of the leaf is printed just before it comes into view. */
    late: (() => void) | null;
    /** The page under the leaf is printed a frame after the leaf itself, so no
        frame has to send two sheets to the graphics card. */
    soon: (() => void) | null;
    frames: number;
  } | null = null;
  private ribbon: THREE.Mesh;
  private images = new Map<string, HTMLImageElement | null>();
  /** What each canvas carries now, so a page is never printed twice. */
  private printed: Partial<Record<"L" | "R" | "A" | "B", { sheet: Sheet | null; side: "left" | "right" }>> = {};
  private blank: { L: THREE.CanvasTexture; R: THREE.CanvasTexture } | null = null;
  private pixels: number;
  private turnPrepared = false;
  private single = false;
  private disposed = false;
  private disposables: { dispose(): void }[] = [];
  metrics: PageMetrics;

  constructor(
    readonly spec: VolumeSpec,
    f: Finishes,
    tier: Tier,
    metrics: PageMetrics,
    private redraw: () => void,
    kit: Kit | null = null,
  ) {
    this.metrics = metrics;
    // Enough for the printed leaf to stay legible in the air on a dense screen.
    this.pixels = tier === "high" ? 768 : 640;
    const { W, H, board, over } = BOOK;
    const T = spec.thickness;
    const cloth = standard({
      map: leather(spec.color, 500 + spec.slug.length * 7 + spec.title.length),
      roughness: spec.kind === "project" ? 0.78 : 0.55,
      bump: 0.3,
      env: 0.5,
    });
    const coverFront = cloth.clone();
    coverFront.bumpMap = null;
    coverFront.map = this.coverTexture();
    const spineMat = cloth.clone();
    spineMat.bumpMap = null;
    spineMat.map = this.spineTexture();
    this.disposables.push(cloth, coverFront, spineMat, coverFront.map!, spineMat.map!);
    const paperTop = f.paper;
    const mesh = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[]) => {
      const o = new THREE.Mesh(g, m);
      o.castShadow = o.receiveShadow = true;
      this.disposables.push(g);
      return o;
    };
    // Boards: the left one carries the front cover on its outer (−Z) face.
    const stock = (name: string, x: number, y: number, z: number) => {
      const shape = kit?.geometry(name);
      if (!shape) return null;
      shape.computeBoundingBox();
      const bounds = shape.boundingBox!, size = bounds.getSize(new THREE.Vector3());
      const centre = bounds.getCenter(new THREE.Vector3());
      shape.translate(-centre.x, -centre.y, -centre.z);
      shape.scale(x / size.x, y / size.y, z / size.z);
      return shape;
    };
    const boardGeo = stock("book.board.back", W + over + board, H + over * 2, board) ?? slab(W + over + board, H + over * 2, board, 0.5);
    this.boardR = mesh(boardGeo, cloth);
    this.boardL = mesh(boardGeo.clone().toNonIndexed(), [cloth, cloth, cloth, cloth, cloth, coverFront]);
    // BoxGeometry's −Z face is drawn mirrored for an outside viewer once UVs are in metres.
    const uv = this.boardL.geometry.attributes.uv as THREE.BufferAttribute;
    const pos = this.boardL.geometry.attributes.position;
    const normal = this.boardL.geometry.attributes.normal;
    this.boardL.geometry.clearGroups();
    const bodyTriangles: number[] = [], coverTriangles: number[] = [];
    for (let i = 0; i < pos.count; i += 3) {
      const cover = normal.getZ(i) < -0.95;
      (cover ? coverTriangles : bodyTriangles).push(i, i + 1, i + 2);
      if (cover) for (let k = i; k < i + 3; k++) uv.setXY(k, 0.5 - pos.getX(k) / (W + over + board), 0.5 + pos.getY(k) / (H + over * 2));
    }
    this.boardL.geometry.setIndex([...bodyTriangles, ...coverTriangles]);
    this.boardL.geometry.addGroup(0, bodyTriangles.length, 0);
    this.boardL.geometry.addGroup(bodyTriangles.length, coverTriangles.length, 5);
    // Text blocks: unit thickness, scaled as leaves move from right to left.
    const blockGeo = stock("book.block", W, H, 1) ?? new THREE.BoxGeometry(W, H, 1);
    const sides = [f.leaves, f.leaves, f.leaves, f.leaves, paperTop, paperTop];
    this.blockR = mesh(blockGeo, kit ? f.leaves : sides);
    this.blockL = mesh(blockGeo.clone(), kit ? f.leaves : sides);
    const half = new THREE.BoxGeometry(board, H + over * 2, 1);
    this.spineR = mesh(half, cloth);
    this.spineL = mesh(half.clone(), cloth);
    this.spine = mesh(stock("book.spine", board, H + over * 2, T + board * 2) ?? new THREE.BoxGeometry(board, H + over * 2, T + board * 2), [
      cloth,
      spineMat,
      cloth,
      cloth,
      cloth,
      cloth,
    ]);
    if (!this.spine.geometry.groups.length) this.spine.geometry.addGroup(0, this.spine.geometry.index?.count ?? this.spine.geometry.attributes.position.count, 0);
    // Printed surfaces.
    const make = () => {
      const c = document.createElement("canvas");
      c.width = this.pixels;
      c.height = Math.round((this.pixels * metrics.height) / metrics.width);
      return c;
    };
    this.canvases = { L: make(), R: make(), A: make(), B: make() };
    const tex = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      this.disposables.push(t);
      return t;
    };
    this.textures = {
      L: tex(this.canvases.L),
      R: tex(this.canvases.R),
      A: tex(this.canvases.A),
      B: tex(this.canvases.B),
    };
    const sheetMat = (t: THREE.Texture, side: THREE.Side = THREE.FrontSide) => {
      // Printed paper is evenly lit. A moving leaf must not sweep a diagonal shadow
      // or sunlight stripe over the readable page below it.
      const m = new THREE.MeshBasicMaterial({ map: t, side, toneMapped: false });
      this.disposables.push(m);
      return m;
    };
    const pageGeo = new THREE.PlaneGeometry(W, H);
    this.pageR = mesh(pageGeo, sheetMat(this.textures.R));
    this.pageL = mesh(pageGeo.clone(), sheetMat(this.textures.L));
    this.pageR.castShadow = this.pageL.castShadow = false;
    const leafGeo = new THREE.PlaneGeometry(W, H, 22, 1);
    this.leaf = mesh(leafGeo, sheetMat(this.textures.A));
    const backGeo = new THREE.PlaneGeometry(W, H, 22, 1);
    this.leafBack = mesh(backGeo, sheetMat(this.textures.B, THREE.BackSide));
    // The back of the leaf reads left to right when it has landed on the left.
    const buv = backGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < buv.count; i++) buv.setX(i, 1 - buv.getX(i));
    this.leaf.visible = this.leafBack.visible = false;
    // The ribbon marks the open place and hangs below the tail when the book is shut.
    const silk = new THREE.MeshStandardMaterial({ color: spec.kind === "project" ? "#6a1420" : "#9a7a34", roughness: 0.55, side: THREE.DoubleSide });
    this.ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.0034, H + 0.022), silk);
    this.ribbon.position.set(0.0042, -0.011, 0.0009);
    this.ribbon.receiveShadow = true;
    this.disposables.push(this.ribbon.geometry, silk);
    this.right.add(this.boardR, this.blockR, this.spineR, this.pageR, this.ribbon);
    this.left.add(this.boardL, this.blockL, this.spineL, this.pageL);
    this.group.add(this.right, this.left, this.spine, this.leaf, this.leafBack);
    this.group.name = "Volume · " + spec.title;
    const block = facedBox(W + over + board, H + over * 2, T + board * 2, [1]);
    const tint = new THREE.Color(spec.color).multiplyScalar(0.9),
      edge = new THREE.Color("#cdbd95");
    const colors: number[] = [];
    // Faces in vertex order: +x fore-edge, −x spine, +y head, −y tail, ±z boards.
    for (let face = 0; face < 6; face++)
      for (let i = 0; i < 4; i++) {
        const c = face === 0 || face === 2 || face === 3 ? edge : tint;
        colors.push(c.r, c.g, c.b);
      }
    block.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const shell = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.78,
    });
    this.disposables.push(block, shell);
    this.proxy = new THREE.Mesh(block, [shell, spineMat]);
    this.proxy.receiveShadow = true;
    this.proxy.position.set((W + over - board) / 2, 0, 0);
    this.group.add(this.proxy);
    // One generous, invisible handle for pointer and touch.
    this.hit = new THREE.Mesh(
      new THREE.BoxGeometry(W + 0.02, H + 0.02, T + 0.012),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.hit.position.set(W / 2, 0, 0);
    this.group.add(this.hit);
    this.layout(1);
    // Unprinted paper for each side: shown under the DOM page while the book is still.
    const bare = (side: "left" | "right") => {
      const c = make();
      paintSheet(c.getContext("2d")!, this.pixels, metrics, null, side);
      return tex(c);
    };
    this.blank = { L: bare("left"), R: bare("right") };
    this.paint("L", null, "left");
    this.paint("R", null, "right");
    this.pose({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), single: false });
    this.ready = spec.cover ? this.loadCover(spec.cover, coverFront) : Promise.resolve();
  }
  private spineTexture() {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 640;
    const ctx = c.getContext("2d")!;
    const base = leather(this.spec.color, 900 + this.spec.title.length).image as HTMLCanvasElement;
    ctx.drawImage(base, 0, 0, 160, 640);
    const rule = (y: number, h = 2) => {
      ctx.fillStyle = gold;
      ctx.fillRect(14, y, 132, h);
    };
    rule(26, 3);
    rule(34, 1);
    rule(600, 3);
    rule(592, 1);
    // Paper label, as on a nineteenth-century cloth binding.
    const project = this.spec.kind === "project";
    ctx.fillStyle = project ? "#efe4c6" : "#1b1510";
    ctx.fillRect(16, 62, 128, 400);
    ctx.strokeStyle = project ? "#8a7243" : gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 68, 116, 388);
    ctx.save();
    ctx.translate(80, 262);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = project ? "#2a2116" : gold;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fit = fitTitle(ctx, this.spec.title, 360, 44, 22, "600 ");
    const two = fit.lines.slice(0, 2);
    two.forEach((line, i) => ctx.fillText(line, 0, (i - (two.length - 1) / 2) * (fit.size + 4)));
    ctx.restore();
    ctx.fillStyle = gold;
    ctx.textAlign = "center";
    ctx.font = "600 15px " + serif;
    const words = this.spec.series.toUpperCase().split(/\s+/);
    const foot: string[] = [];
    let line = "";
    for (const w of words) {
      if (line && ctx.measureText(line + " " + w).width > 128) {
        foot.push(line);
        line = w;
      } else line = line ? line + " " + w : w;
    }
    foot.push(line);
    foot.slice(0, 4).forEach((l, i) => ctx.fillText(l, 80, 492 + i * 19));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  private coverCanvas = document.createElement("canvas");
  private coverTexture() {
    const c = this.coverCanvas;
    c.width = 512;
    c.height = 730;
    this.drawCover(null);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  private drawCover(image: HTMLImageElement | null) {
    const c = this.coverCanvas,
      ctx = c.getContext("2d")!;
    if (image) {
      // The project's own poster is the whole front board, edge to edge. It carries its
      // own title, so nothing is printed over it; the board is 512 x 730 (about 7:10),
      // and a 4:5 poster loses about six percent from each side.
      const k = Math.max(512 / image.naturalWidth, 730 / image.naturalHeight);
      const sw = 512 / k,
        sh = 730 / k;
      ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, 0, 0, 512, 730);
      // The turn of the cloth at the edges and the hinge.
      const wear = ctx.createLinearGradient(0, 0, 512, 0);
      wear.addColorStop(0, "rgba(0,0,0,.34)");
      wear.addColorStop(0.05, "rgba(0,0,0,.04)");
      wear.addColorStop(0.95, "rgba(0,0,0,0)");
      wear.addColorStop(1, "rgba(0,0,0,.22)");
      ctx.fillStyle = wear;
      ctx.fillRect(0, 0, 512, 730);
      return;
    }
    const base = leather(this.spec.color, 700 + this.spec.title.length).image as HTMLCanvasElement;
    ctx.drawImage(base, 0, 0, 512, 730);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 460, 678);
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, 440, 658);
    ctx.textAlign = "center";
    ctx.fillStyle = gold;
    ctx.font = "600 17px " + serif;
    ctx.fillText(this.spec.series.toUpperCase(), 256, 86, 400);
    {
      ctx.strokeRect(256 - 110, 190, 220, 220);
      ctx.beginPath();
      ctx.arc(256, 300, 70, 0, Math.PI * 2);
      ctx.stroke();
    }
    const fit = fitTitle(ctx, this.spec.title, 400, 46, 26);
    ctx.fillStyle = gold;
    ctx.font = fit.size + "px " + serif;
    fit.lines.forEach((l, i) => ctx.fillText(l, 256, 572 + i * (fit.size + 6) - ((fit.lines.length - 1) * (fit.size + 6)) / 2));
    ctx.font = "600 14px " + serif;
    ctx.fillText(this.spec.kind === "project" ? "JOHN OVERTON BELL" : "TRAVELLERS REST", 256, 674);
  }
  private loadCover(url: string, material: THREE.MeshStandardMaterial) {
    return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (this.disposed) { resolve(); return; }
      try {
        this.drawCover(img);
        material.map!.needsUpdate = true;
        this.redraw();
      } catch {}
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
    });
  }
  private picture = (url: string) => {
    if (!this.images.has(url)) {
      this.images.set(url, null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (this.disposed) return;
        this.images.set(url, img);
        // Refresh only surfaces using this picture. During a turn, the page below
        // the leaf already carries the incoming spread; paintStatic() would put
        // the old spread back there and force another full upload when it lands.
        for (const which of ["L", "R", "A", "B"] as const) {
          const printed = this.printed[which];
          if (!printed?.sheet?.ops.some(op => op.t === "image" && op.url === url)) continue;
          delete this.printed[which];
          this.paint(which, printed.sheet, printed.side);
        }
        this.redraw();
      };
      img.src = url;
    }
    return this.images.get(url) ?? null;
  };
  private paint(which: "L" | "R" | "A" | "B", sheet: Sheet | null, side: "left" | "right") {
    const held = this.printed[which];
    if (held && held.sheet === sheet && held.side === side) return;
    this.printed[which] = { sheet, side };
    const ctx = this.canvases[which].getContext("2d")!;
    try {
      paintSheet(ctx, this.pixels, this.metrics, sheet, side, this.picture);
      this.textures[which].needsUpdate = true;
    } catch {
      // A cross-origin picture cannot be copied to paper; the DOM page still shows it.
      paintSheet(ctx, this.pixels, this.metrics, sheet, side);
      this.textures[which].needsUpdate = true;
    }
  }
  /** While the DOM page lies on the paper the sheet itself is left blank, so the lit
      paper shows through real text. For a turning leaf the words go onto the paper. */
  private ink = true;
  setInk(on: boolean) {
    if (this.ink === on) return;
    this.ink = on;
    // Retain the requested state during a turn; land() applies it. Dropping this
    // request can leave printed ink underneath the readable DOM after a resize.
    if (this.flip) return;
    this.paintStatic();
    this.redraw();
  }
  /** Printed pages when the paper must carry the words, bare paper otherwise. Switching
      is a change of texture, not a repaint. */
  private paintStatic() {
    if (this.ink) {
      this.paint("L", this.shown.left, "left");
      this.paint("R", this.shown.right, "right");
    }
    const show = (mesh: THREE.Mesh, map: THREE.Texture) => {
      (mesh.material as THREE.MeshStandardMaterial).map = map;
    };
    show(this.pageL, this.ink || !this.blank ? this.textures.L : this.blank.L);
    show(this.pageR, this.ink || !this.blank ? this.textures.R : this.blank.R);
  }
  /** Distribute thickness between the two stacks. */
  private layout(open: number) {
    const { W, board, over } = BOOK;
    const T = this.spec.thickness;
    const f = THREE.MathUtils.lerp(0.5, this.fraction, open);
    const tl = Math.max(0.004, T * f),
      tr = Math.max(0.004, T - tl);
    // Reading surface sits at Z = 0; the right stack hangs below it.
    this.blockR.scale.z = tr;
    this.blockR.position.set(W / 2, 0, -tr / 2);
    this.boardR.position.set((W + over - board) / 2, 0, -tr - board / 2);
    this.spineR.scale.z = tr + board;
    this.spineR.position.set(-board / 2, 0, -(tr + board) / 2);
    this.pageR.position.set(W / 2, 0, 0.0004);
    this.blockL.scale.z = tl;
    this.blockL.position.set(-W / 2, 0, -tl / 2);
    this.boardL.position.set(-(W + over - board) / 2, 0, -tl - board / 2);
    this.spineL.scale.z = tl + board;
    this.spineL.position.set(board / 2, 0, -(tl + board) / 2);
    this.pageL.position.set(-W / 2, 0, 0.0004);
    this.spine.position.set(-board / 2, 0, (tl - tr) / 2);
    return { tl, tr };
  }
  /** Closed size along the three local axes, for shelf spacing. */
  get closedThickness() {
    return this.spec.thickness + BOOK.board * 2;
  }
  /** A viewport change must update both the DOM registration and printed pages. */
  setMetrics(metrics: PageMetrics) {
    if (Object.keys(metrics).every(key => this.metrics[key as keyof PageMetrics] === metrics[key as keyof PageMetrics])) return;
    this.snapTurn();
    this.metrics = metrics;
    this.printed = {};
    for (const which of ["L", "R", "A", "B"] as const) {
      this.canvases[which].height = Math.round(this.pixels * metrics.height / metrics.width);
      this.textures[which].needsUpdate = true;
    }
    if (this.blank) for (const side of ["left", "right"] as const) {
      const texture = this.blank[side === "left" ? "L" : "R"];
      const canvas = texture.image as HTMLCanvasElement;
      canvas.height = Math.round(this.pixels * metrics.height / metrics.width);
      paintSheet(canvas.getContext("2d")!, this.pixels, metrics, null, side);
      texture.needsUpdate = true;
    }
    this.paintStatic();
    this.redraw();
  }
  setSpread(left: Sheet | null, right: Sheet | null, fraction: number) {
    this.snapTurn();
    this.fraction = THREE.MathUtils.clamp(fraction, 0.06, 0.94);
    // The same spread again (after a turn has already laid it): nothing to print.
    if (left !== this.shown.left || right !== this.shown.right) {
      this.shown = { left, right };
      this.paintStatic();
    }
    this.stale = true;
    this.redraw();
  }
  /** Raise a leaf: by itself (it runs on to the other side) or held by its edge. */
  private lift(dir: 1 | -1, left: Sheet | null, right: Sheet | null, fraction: number, held: boolean) {
    this.snapTurn();
    return new Promise<boolean>((resolve) => {
      this.ink = true;
      (this.pageL.material as THREE.MeshStandardMaterial).map = this.textures.L;
      (this.pageR.material as THREE.MeshStandardMaterial).map = this.textures.R;
      let late: () => void, soon: () => void;
      if (dir > 0) {
        this.paint("A", this.shown.right, "right");
        this.paint("L", this.shown.left, "left");
        // Until the leaf has lifted, the page beneath still shows what the leaf does.
        this.paint("R", this.shown.right, "right");
        soon = () => this.paint("R", right, "right");
        late = () => this.paint("B", left, "left");
      } else {
        this.paint("B", this.shown.left, "left");
        this.paint("R", this.shown.right, "right");
        this.paint("L", this.shown.left, "left");
        soon = () => this.paint("L", left, "left");
        late = () => this.paint("A", right, "right");
      }
      this.flip = {
        t: 0,
        goal: held ? 0 : 1,
        held,
        dir,
        done: resolve,
        after: { left, right },
        fractions: [this.fraction, THREE.MathUtils.clamp(fraction, 0.06, 0.94)],
        late,
        soon,
        frames: 0,
      };
      this.bend(dir > 0 ? 0 : 1);
      this.leaf.visible = this.leafBack.visible = true;
      this.redraw();
    });
  }
  /** Turn one leaf. Resolves true when it has landed turned, false when it was laid
      back where it came from; an interrupted turn lands at once. */
  turn(dir: 1 | -1, left: Sheet | null, right: Sheet | null, fraction: number, instant: boolean) {
    if (instant || this.progress < 0.99) {
      this.setSpread(left, right, fraction);
      return Promise.resolve(true);
    }
    return this.lift(dir, left, right, fraction, false);
  }
  /** Take a leaf by its edge. It follows `scrub` until `drop` lets it fall either way. */
  grabLeaf(dir: 1 | -1, left: Sheet | null, right: Sheet | null, fraction: number) {
    if (this.progress < 0.99) return Promise.resolve(false);
    return this.lift(dir, left, right, fraction, true);
  }
  /** Where the held leaf is: 0 lying where it was, 1 lying turned. */
  scrub(t: number) {
    if (!this.flip?.held) return;
    this.flip.t = THREE.MathUtils.clamp(t, 0, 1);
    this.redraw();
  }
  drop(turn: boolean) {
    if (!this.flip?.held) return;
    this.flip.held = false;
    this.flip.goal = turn ? 1 : 0;
    this.redraw();
  }
  /** Send a leaf that is in the air back the way it came, or on again. */
  reverseTurn() {
    if (!this.flip || this.flip.held) return false;
    this.flip.goal = this.flip.goal ? 0 : 1;
    this.redraw();
    return true;
  }
  /** +1 while a leaf is going over to the left, −1 while one is coming back, else 0. */
  get leafHeading() {
    return this.flip ? this.flip.dir * (this.flip.goal ? 1 : -1) : 0;
  }
  private land(turned: boolean) {
    const flip = this.flip;
    if (!flip) return;
    this.flip = null;
    this.leaf.visible = this.leafBack.visible = false;
    if (turned) {
      this.shown = flip.after;
      // The side that just landed already contains the exact printed resting page.
      // Exchange its backing surface instead of painting and uploading it again.
      // The leaf is hidden now; no visible surface loses pixels during the swap.
      const page = flip.dir > 0 ? "L" : "R", leaf = flip.dir > 0 ? "B" : "A";
      const sheet = flip.dir > 0 ? this.shown.left : this.shown.right;
      const printed = this.printed[leaf];
      if (printed && printed.sheet === sheet && printed.side === (flip.dir > 0 ? "left" : "right")) {
        [this.canvases[page], this.canvases[leaf]] = [this.canvases[leaf], this.canvases[page]];
        [this.textures[page], this.textures[leaf]] = [this.textures[leaf], this.textures[page]];
        [this.printed[page], this.printed[leaf]] = [this.printed[leaf], this.printed[page]];
        (this.leaf.material as THREE.MeshBasicMaterial).map = this.textures.A;
        (this.leafBack.material as THREE.MeshBasicMaterial).map = this.textures.B;
      }
    }
    this.fraction = flip.fractions[turned ? 1 : 0];
    this.paintStatic();
    this.stale = true;
    flip.done(turned);
  }
  /** Whatever leaf is in the air lands at once where it was heading. */
  snapTurn() {
    if (this.flip) this.land(!this.flip.held && this.flip.goal === 1);
  }
  get turning() {
    return !!this.flip;
  }
  /** Allocate only the selected book's two turning surfaces before it opens.
      Their resolution and mipmaps remain identical to the printed pages. */
  prepareTurn(renderer: THREE.WebGLRenderer) {
    if (this.turnPrepared) return;
    renderer.initTexture(this.textures.A);
    renderer.initTexture(this.textures.B);
    this.turnPrepared = true;
  }
  /** One representative leaf participates in the loading draw. Shader compilation
      alone leaves the driver's first front/back draw cold. Restored before ready. */
  preparationLeaf() {
    const front = this.leaf.visible, back = this.leafBack.visible;
    this.leaf.visible = this.leafBack.visible = true;
    return () => { this.leaf.visible = front; this.leafBack.visible = back; };
  }
  private bend(t: number) {
    // t = 0: flat on the right. t = 1: flat on the left. The outer edge trails the spine.
    const { W } = BOOK;
    const base = Math.PI * easeInOut(t);
    const lag = Math.sin(Math.PI * t) * 0.95;
    for (const mesh of [this.leaf, this.leafBack]) {
      const p = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const cols = 23;
      let x = 0,
        z = 0.0012;
      for (let i = 0; i < cols; i++) {
        const s = i / (cols - 1);
        const angle = base - lag * s ** 1.6 + Math.sin(Math.PI * t) * 0.22 * Math.sin(s * Math.PI);
        if (i > 0) {
          x += Math.cos(angle) * (W / (cols - 1));
          z += Math.sin(angle) * (W / (cols - 1));
        }
        p.setX(i, x);
        p.setZ(i, Math.max(0.0012, z));
        p.setX(i + cols, x);
        p.setZ(i + cols, Math.max(0.0012, z));
      }
      p.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
  }
  private detail(on: boolean) {
    if (this.detailed === on) return;
    this.detailed = on;
    this.proxy.visible = !on;
    this.left.visible = this.right.visible = on;
    this.spine.visible = on;
  }
  /** Standing in its slot: tipped out by the headcap under a pointer, making room for
      the binding beside it, or leaning into the gap a neighbour left. `weight` fades
      all three as the book itself leaves the shelf. */
  private shelved(weight: number) {
    const g = this.group,
      rest = this.spec.rest;
    g.position.copy(rest.position);
    g.quaternion.copy(rest.quaternion);
    const hover = this.hover * weight,
      sway = this.sway * weight,
      lean = this.lean * weight;
    if (!hover && !sway && !lean) return;
    const out = scratch.out.copy(this.spec.clear).normalize();
    const along = scratch.along.crossVectors(UP, out);
    if (along.lengthSq() < 0.2) {
      // Lying flat on a table: it simply rises a little.
      g.position.addScaledVector(this.spec.clear, hover * 0.035);
      return;
    }
    along.normalize();
    const { W, H } = BOOK;
    const foot = () => scratch.pivot.copy(rest.position).addScaledVector(UP, -H / 2 - BOOK.over);
    const about = (pivot: THREE.Vector3, axis: THREE.Vector3, angle: number) => {
      scratch.q.setFromAxisAngle(axis, angle);
      g.position.sub(pivot).applyQuaternion(scratch.q).add(pivot);
      g.quaternion.premultiply(scratch.q);
    };
    if (lean) about(foot().addScaledVector(along, (Math.sign(lean) * this.closedThickness) / 2), out, -lean * 0.07);
    if (sway) {
      about(foot(), out, -sway * 0.02);
      g.position.addScaledVector(along, sway * 0.003);
    }
    if (hover) {
      about(foot().addScaledVector(out, -W * 0.82), along, hover * 0.12);
      g.position.addScaledVector(out, hover * 0.028);
    }
  }
  /** Places every part for the current progress. The three stages overlap, so the
      book never comes to rest between leaving the shelf, crossing the room and
      opening: each is still a pure function of `progress`. */
  private pose(hand: Hand) {
    const { W } = BOOK;
    const p = this.progress;
    this.detail(p > 0);
    if (!this.detailed) {
      this.shelved(1);
      return;
    }
    const rest = this.spec.rest;
    const clamp = THREE.MathUtils.clamp;
    const pull = easeInOut(clamp(p / PULL, 0, 1));
    const carry = easeInOut(clamp((p - PULL * 0.6) / (CARRY - PULL * 0.6), 0, 1));
    const open = clamp((p - OPEN) / (1 - OPEN), 0, 1);
    const e = easeInOut(open);
    this.left.rotation.y = Math.PI * (1 - e);
    this.layout(e);
    this.spine.visible = open < 0.02;
    this.spineL.visible = this.spineR.visible = !this.spine.visible;
    this.pageL.visible = this.pageR.visible = open > 0;
    // Open, the handle covers both boards.
    this.hit.scale.x = 1 + e;
    this.hit.position.x = (W / 2) * (1 - e);
    const g = this.group;
    this.shelved(1 - pull);
    g.position.addScaledVector(this.spec.clear, 0.27 * pull);
    if (carry <= 0) return;
    // In the hand: closed, the cover is centred; open, the gutter (or the right page
    // on a narrow screen) is.
    const closedShift = new THREE.Vector3(-W / 2, 0, 0).applyQuaternion(hand.quaternion);
    const openShift = new THREE.Vector3(hand.single ? -W / 2 : 0, 0, 0).applyQuaternion(hand.quaternion);
    const held = hand.position.clone().add(closedShift);
    const out = rest.position.clone().addScaledVector(this.spec.clear, 0.27);
    // A shallow arc with a little lift, as an arm would carry it.
    const mid = out.clone().lerp(held, 0.5);
    mid.y += 0.11;
    const a = out.lerp(mid, carry),
      b = mid.lerp(held, carry);
    g.position.lerp(a.lerp(b, carry), carry);
    g.quaternion.slerp(hand.quaternion, carry);
    if (e > 0) g.position.lerp(hand.position.clone().add(openShift), e);
  }
  /** A neighbour leans into the gap this much (−1…1 along the shelf). */
  setLean(lean: number) {
    if (Math.abs(lean - this.lean) < 0.0005) return;
    this.lean = lean;
    this.stale = true;
  }
  /** A hand has hold of the book: it is exactly this far from its slot. */
  hold(progress: number) {
    this.snapTurn();
    this.setInk(true);
    this.progress = this.target = THREE.MathUtils.clamp(progress, 0, 1);
    this.stale = true;
    this.redraw();
  }
  /** Advance toward the target. Returns true while anything is still moving. */
  update(dt: number, hand: Hand, reduced: boolean) {
    let moving = this.stale;
    this.stale = false;
    this.single = hand.single;
    if (this.hover !== this.hoverTarget) {
      this.hover = reduced ? this.hoverTarget : THREE.MathUtils.damp(this.hover, this.hoverTarget, 13, dt);
      if (Math.abs(this.hover - this.hoverTarget) < 0.004) this.hover = this.hoverTarget;
      moving = true;
    }
    if (this.sway !== this.swayTarget) {
      this.sway = reduced ? this.swayTarget : THREE.MathUtils.damp(this.sway, this.swayTarget, 11, dt);
      if (Math.abs(this.sway - this.swayTarget) < 0.004) this.sway = this.swayTarget;
      moving = true;
    }
    if (this.progress !== this.target) {
      if (this.target < 1) {
        this.snapTurn();
        this.setInk(true);
      }
      const step = reduced ? 1 : dt / 1.9;
      this.progress =
        this.target > this.progress
          ? Math.min(this.target, this.progress + step)
          : Math.max(this.target, this.progress - step * 1.25);
      moving = true;
    }
    const flip = this.flip;
    if (flip) {
      if (!flip.held) {
        const step = dt / (reduced ? 0.001 : 0.82);
        flip.t = flip.goal ? Math.min(1, flip.t + step) : Math.max(0, flip.t - step);
      }
      if (flip.soon && ++flip.frames > 1) {
        flip.soon();
        flip.soon = null;
      }
      if (flip.late && flip.t > 0.2) {
        flip.late();
        flip.late = null;
      }
      // The two stacks trade thickness as the leaf goes over.
      this.fraction = THREE.MathUtils.lerp(flip.fractions[0], flip.fractions[1], easeInOut(flip.t));
      this.bend(flip.dir > 0 ? flip.t : 1 - flip.t);
      if (!flip.held && flip.t === flip.goal) this.land(flip.goal === 1);
      moving = true;
    }
    if (moving || this.progress > PULL) this.pose(hand);
    return moving;
  }
  place(hand: Hand) {
    this.pose(hand);
  }
  get settledOpen() {
    return this.progress === 1 && this.target === 1;
  }
  get out() {
    return this.progress > 0 || this.target > 0;
  }
  /** Where a ray meets the reading surface, in the book's own metres: x runs from the
      gutter (0) to the fore-edges (±W), y from the tail (−H/2) to the head. */
  touch(ray: THREE.Ray) {
    this.group.updateMatrixWorld(true);
    const inverse = scratch.m.copy(this.group.matrixWorld).invert();
    const o = scratch.pivot.copy(ray.origin).applyMatrix4(inverse),
      d = scratch.out.copy(ray.direction).transformDirection(inverse);
    if (Math.abs(d.z) < 1e-6) return null;
    const t = -o.z / d.z;
    return t > 0 ? { x: o.x + d.x * t, y: o.y + d.y * t } : null;
  }
  /** Screen corners of the two printed pages, clockwise from top-left, in CSS pixels. */
  quads(camera: THREE.Camera, width: number, height: number) {
    const { W, H } = BOOK;
    this.group.updateMatrixWorld(true);
    const project = (x: number, y: number) => {
      const v = new THREE.Vector3(x, y, 0.0006).applyMatrix4(this.group.matrixWorld).project(camera);
      return [((v.x + 1) / 2) * width, ((1 - v.y) / 2) * height] as [number, number];
    };
    const quad = (x0: number, x1: number) => [project(x0, H / 2), project(x1, H / 2), project(x1, -H / 2), project(x0, -H / 2)];
    return { left: quad(-W, 0), right: quad(0, W) };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.images.clear();
    this.snapTurn();
    this.disposables.forEach((d) => d.dispose());
  }
}

/** Deterministic binding colours per shelf, so a visitor can learn the cabinet. */
export const bindingColors: Record<string, string> = {
  "stacks-ai-agents": "#23402f",
  "stacks-data-knowledge": "#5b1f1b",
  "stacks-web-apps": "#1f2f4a",
  "stacks-client-work": "#6a4a22",
};
export function bookThickness(pages: number, slug: string) {
  const r = seeded(slug.length * 31 + pages)();
  return 0.05 + Math.min(8, pages) * 0.0022 + r * 0.006;
}
