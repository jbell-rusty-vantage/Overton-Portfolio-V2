// The Blender kit's contract with the engine: every node the manifest lists is in both
// packed files under the same name, in the same place, turning about the same pivot,
// and the parts authored to move are nodes of their own.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { NodeIO, type Document, type Node } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

// gltf-validator ships no types: load it untyped and describe the one call used.
type Validator = { validateBytes(bytes: Uint8Array, options?: object): Promise<{ issues: { numErrors: number } }> };
const loaded: { default?: Validator } & Partial<Validator> = await import("gltf-validator" as string);
const validator = (loaded.default ?? loaded) as Validator;

type Triple = [number, number, number];
type Entry = {
  name: string;
  three: string;
  parent: string | null;
  piece: string;
  role: "placed" | "moving" | "stock";
  type: "mesh" | "empty";
  mesh: string | null;
  world: { translation: Triple; rotation: number[]; scale: Triple; matrix: number[] };
  pivot: { point: Triple; kind: string; axis?: Triple; travel?: number };
  bounds: { min: Triple; max: Triple } | null;
  triangles: Record<string, number>;
  materials: string[];
};
type Tier = { file: string; bytes: number; sha256: string; triangles: number };
type Manifest = { tiers: Record<"detailed" | "compact", Tier>; nodes: Entry[]; materials: { name: string; finish: string | null }[] };
type Source = { nodes: { name: string; parent: string | null; pivot: Triple; rotation: number[]; scale: Triple; role: string; motion?: { kind: string } }[] };

const folder = "assets/travellers-rest/kit/";
const manifest: Manifest = JSON.parse(await readFile(folder + "manifest.json", "utf8"));
const source: Source = JSON.parse(await readFile(folder + "source.json", "utf8"));
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const files = await Promise.all(
  Object.values(manifest.tiers).map(async (tier) => {
    const bytes = await readFile(tier.file);
    return { tier, bytes, doc: await io.readBinary(new Uint8Array(bytes)) };
  }),
);

const MM = 0.001;
const apart = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const turned = (a: number[], b: number[]) => Math.min(apart(a, b), apart(a, b.map((v) => -v)));
const find = (doc: Document, name: string) => doc.getRoot().listNodes().filter((n) => n.getName() === name);
const holder = (node: Node) => node.listChildren().find((c) => c.getName() === node.getName() + "~mesh");
/** What three.js's GLTFLoader calls a node (PropertyBinding.sanitizeNodeName). */
const threeName = (name: string) => name.replace(/\s/g, "_").replace(/[[\].:/]/g, "");

test("both packed kits validate and stay inside their budgets", async () => {
  for (const { tier, bytes } of files) {
    const report = await validator.validateBytes(new Uint8Array(bytes), { maxIssues: 16 });
    assert.equal(report.issues.numErrors, 0, tier.file);
    assert.equal(bytes.length, tier.bytes, tier.file + " is not the file the manifest describes; run node scripts/pack-kit.mjs");
  }
  const [detailed, compact] = files;
  assert.ok(detailed.bytes.length <= 1.5 * 1024 * 1024 && detailed.tier.triangles <= 150_000);
  assert.ok(compact.bytes.length <= 600 * 1024 && compact.tier.triangles <= detailed.tier.triangles);
});

test("every manifest node is in both files with its name, transform and pivot", () => {
  assert.ok(manifest.nodes.length >= 50);
  for (const { tier, doc } of files)
    for (const want of manifest.nodes) {
      const found = find(doc, want.name);
      assert.equal(found.length, 1, `${tier.file}: ${want.name}`);
      const node = found[0];
      assert.ok(apart(node.getWorldTranslation(), want.world.translation) < MM, `${tier.file}: ${want.name} moved`);
      assert.ok(apart(node.getWorldTranslation(), want.pivot.point) < MM, `${tier.file}: ${want.name} pivot moved`);
      assert.ok(turned(node.getWorldRotation(), want.world.rotation) < 1e-4, `${tier.file}: ${want.name} turned`);
      assert.ok(apart(node.getWorldScale(), want.world.scale) < 1e-4, `${tier.file}: ${want.name} scaled`);
      assert.ok(apart(node.getWorldMatrix(), want.world.matrix) < MM, `${tier.file}: ${want.name} matrix`);
      assert.equal(node.getParentNode()?.getName() ?? null, want.parent, `${tier.file}: ${want.name} parent`);
      // The mesh hangs on a holder child, so quantization never reached the named node.
      assert.equal(node.getMesh(), null);
      assert.equal(!!holder(node)?.getMesh(), want.type === "mesh", `${tier.file}: ${want.name} mesh`);
      // Role, piece and motion travel in the file itself, for the engine to read.
      assert.equal(node.getExtras().kit_role, want.role);
      assert.equal(node.getExtras().kit_piece, want.piece);
      if (want.pivot.kind !== "origin") assert.equal(node.getExtras().kit_motion, want.pivot.kind);
    }
});

test("names are stable, lower-case and distinct in both spellings", () => {
  const names = manifest.nodes.map((n) => n.name);
  for (const node of manifest.nodes) {
    assert.match(node.name, /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/);
    assert.equal(node.three, threeName(node.name));
    assert.ok(node.name === node.piece || node.name.startsWith(node.piece + "."), node.name + " is outside its piece " + node.piece);
  }
  assert.equal(new Set(names).size, names.length);
  assert.equal(new Set(manifest.nodes.map((n) => n.three)).size, names.length);
  for (const material of manifest.materials) assert.match(material.name, /^[a-z][a-z0-9.-]*$/);
});

test("what Blender recorded is what was packed", () => {
  assert.deepEqual(source.nodes.map((n) => n.name).sort(), manifest.nodes.map((n) => n.name).sort());
  for (const told of source.nodes) {
    const packed = manifest.nodes.find((n) => n.name === told.name)!;
    assert.ok(apart(told.pivot, packed.pivot.point) < MM, told.name);
    assert.ok(turned(told.rotation, packed.world.rotation) < 1e-4, told.name);
    assert.ok(apart(told.scale, packed.world.scale) < 1e-4, told.name);
    assert.equal(told.parent, packed.parent);
    assert.equal(told.motion?.kind ?? "origin", packed.pivot.kind);
  }
});

test("the parts authored to move are separate nodes with their pivots", () => {
  const by = new Map(manifest.nodes.map((n) => [n.name, n]));
  const node = (name: string) => {
    const found = by.get(name);
    assert.ok(found, name + " is missing");
    return found;
  };
  // The book: boards, spine and text block each their own mesh; boards hinge on the
  // spine edges; a named empty marks the gutter.
  const parts = ["book.board.front", "book.board.back", "book.spine", "book.block"].map(node);
  for (const part of parts) {
    assert.equal(part.type, "mesh");
    assert.equal(part.parent, "book");
    assert.ok(part.triangles.detailed > 0);
  }
  assert.equal(new Set(parts.slice(1).map((p) => p.mesh)).size, 3);
  const [front, back, spine] = parts;
  const gutter = node("book.pivot.gutter");
  assert.equal(gutter.type, "empty");
  assert.equal(gutter.pivot.kind, "gutter");
  for (const board of [front, back]) {
    assert.equal(board.pivot.kind, "hinge");
    // Each hinge lies on the spine side of its board, a board's thickness from the gutter.
    const reach = Math.hypot(...board.pivot.point.map((v, i) => v - gutter.pivot.point[i]));
    assert.ok(reach > 0.015 && reach < 0.025, "hinge is " + reach + " m from the gutter");
    const b = board.bounds!;
    const outside = board.pivot.point.some((v, i) => v < b.min[i] - MM || v > b.max[i] + MM);
    assert.equal(outside, false, board.name + " hinge is off the board");
  }
  assert.ok(apart(front.pivot.point, back.pivot.point) > 0.03);
  assert.ok(apart(spine.pivot.point, gutter.pivot.point) < MM);
  // Drawers slide on their runners; the origin is at the mouth, on the drawer's floor.
  for (const name of ["chest.drawer.correspondence", "chest.drawer.campaign", "table.writing.drawer"]) {
    const drawer = node(name);
    assert.equal(drawer.type, "mesh");
    assert.equal(drawer.pivot.kind, "slide");
    assert.deepEqual(drawer.pivot.axis, [0, 0, 1]);
    assert.ok(drawer.pivot.travel! > 0.2);
    const b = drawer.bounds!;
    assert.ok(Math.abs(drawer.pivot.point[1] - b.min[1]) < 0.006, name + " origin is not on its runner");
    assert.ok(Math.abs(drawer.pivot.point[0] - (b.min[0] + b.max[0]) / 2) < 0.002, name + " origin is off centre");
  }
  assert.equal(node("chest.drawer.correspondence").role, "moving");
  assert.equal(new Set(["correspondence", "campaign", "lower"].map((d) => node("chest.drawer." + d).mesh)).size, 3);
  // Sashes slide, the door hinges on its edge, the letter is one sheet.
  for (const name of ["window.sash.west.lower", "window.sash.west.upper", "window.sash.east.lower", "window.sash.east.upper"]) assert.equal(node(name).pivot.kind, "slide");
  const door = node("door.ell");
  assert.equal(door.pivot.kind, "hinge");
  assert.ok(Math.abs(door.pivot.point[0] - door.bounds!.min[0]) < 0.002);
  assert.equal(node("letter.sheet").type, "mesh");
  // Each candlestick marks its wick for the flame.
  for (const name of ["candlestick.table", "candlestick.chest", "candlestick.mantel.north", "candlestick.mantel.south"]) {
    const flame = node(name + ".flame");
    assert.equal(flame.type, "empty");
    assert.ok(flame.pivot.point[1] - node(name).pivot.point[1] > 0.35);
  }
});

test("pieces stand where the room puts them", () => {
  const at = (name: string) => manifest.nodes.find((n) => n.name === name)!.pivot.point;
  // ROOM in components/estate/world/engine/room.ts: floor 0.53; table centre; chest centre.
  assert.ok(apart(at("table.writing"), [-4.95, 0.53, 0.75]) < MM);
  assert.ok(apart(at("chair.windsor"), [-4.5, 0.53, -0.12]) < MM);
  assert.ok(apart(at("chest"), [-2.95, 0.53, -2.7425]) < MM);
  assert.ok(apart(at("mantel"), [-7.76, 0.53, 0]) < MM);
  assert.ok(apart(at("door.ell"), [-5.65, 0.53, -3.0]) < MM);
  assert.ok(apart(at("window.sash.west"), [-6.03, 1.37, 2.957]) < MM);
  assert.ok(apart(at("candlestick.table"), [-5.58, 1.34, 0.47]) < MM);
  assert.ok(apart(at("inkwell"), [-4.38, 1.34, 1.02]) < MM);
  const top = manifest.nodes.find((n) => n.name === "table.writing.top")!.bounds!;
  assert.ok(Math.abs(top.max[1] - 1.34) < 0.002 && Math.abs(top.min[0] + 5.75) < 0.002 && Math.abs(top.max[2] - 1.2) < 0.002);
});
