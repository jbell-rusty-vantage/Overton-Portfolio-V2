// Pack the Blender kit for the browser WITH IDENTITY PRESERVED.
//
//   node scripts/pack-kit.mjs
//
// Reads  .local-library/kit/kit-export.glb          (written by assets/travellers-rest/kit/build_kit.py)
//        assets/travellers-rest/kit/source.json     (what Blender says each node is)
// Writes public/travellers-rest/kit.glb             detailed tier
//        public/travellers-rest/kit-low.glb         compact tier
//        assets/travellers-rest/kit/manifest.json   every node: transform, pivot, bounds, triangles, materials
//
// Unlike pack-estate.mjs there is NO flatten and NO join: every named node keeps its
// name, parent and transform, because the engine looks pieces up by name and the moving
// parts turn about their own origins. Meshopt quantization rewrites the transform of
// the node that carries a mesh, so each mesh is first moved onto an unnamed-in-the-
// contract child ("<name>~mesh"); the named node above it stays exactly as authored.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, simplify, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import validator from "gltf-validator";
import sharp from "sharp";

const SOURCE = ".local-library/kit/kit-export.glb";
const RECORD = "assets/travellers-rest/kit/source.json";
const MANIFEST = "assets/travellers-rest/kit/manifest.json";
const TIERS = [
  { tier: "detailed", file: "public/travellers-rest/kit.glb", texture: 1024, quality: 84, ratio: 1, bytes: 1.5 * 1024 * 1024, triangles: 150_000 },
  { tier: "compact", file: "public/travellers-rest/kit-low.glb", texture: 512, quality: 74, ratio: 0.5, bytes: 600 * 1024, triangles: 80_000 },
];
/** Largest edge allowed for a texture in the detailed tier (the compact tier halves it). */
const TEXTURE_LIMIT = { "kit.ao": 1024, walnut: 512 };
const HOLDER = "~mesh";

/** The spelling three.js gives a node: GLTFLoader removes dots and other reserved characters. */
const threeName = (name) => name.replace(/\s/g, "_").replace(/[[\].:/]/g, "");

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const round = (v, places = 6) => +v.toFixed(places);
const list = (values, places = 6) => Array.from(values, (v) => round(v, places));
const record = JSON.parse(await readFile(RECORD, "utf8"));

function own(node) {
  // The mesh that belongs to a named node: its own, or the one on its holder child.
  return node.getMesh() ?? node.listChildren().find((c) => c.getName() === node.getName() + HOLDER)?.getMesh() ?? null;
}
function holder(node) {
  return node.getMesh() ? node : (node.listChildren().find((c) => c.getName() === node.getName() + HOLDER) ?? node);
}
function triangles(mesh) {
  return mesh ? mesh.listPrimitives().reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3, 0) : 0;
}
function bounds(node) {
  const mesh = own(node);
  if (!mesh) return null;
  const m = holder(node).getWorldMatrix();
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  const p = [0, 0, 0];
  for (const prim of mesh.listPrimitives()) {
    const position = prim.getAttribute("POSITION");
    for (let i = 0; i < position.getCount(); i++) {
      position.getElement(i, p);
      const w = [0, 1, 2].map((r) => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r]);
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], w[k]);
        max[k] = Math.max(max[k], w[k]);
      }
    }
  }
  return { min: list(min, 4), max: list(max, 4) };
}
const named = (doc, name) => doc.getRoot().listNodes().filter((n) => n.getName() === name);
const apart = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
/** Rotations compare up to sign: q and -q are the same turn. */
const turned = (a, b) => Math.min(apart(a, b), apart(a, b.map((v) => -v)));

// --- 1. The export must say what Blender said. -------------------------------------
const exported = await io.read(SOURCE);
for (const want of record.nodes) {
  const found = named(exported, want.name);
  if (found.length !== 1) throw Error(`Export has ${found.length} nodes named ${want.name}`);
  const node = found[0];
  if (apart(node.getWorldTranslation(), want.pivot) > 1e-4) throw Error("Pivot moved in export: " + want.name);
  if (turned(node.getWorldRotation(), want.rotation) > 1e-4) throw Error("Rotation changed in export: " + want.name);
  if (apart(node.getWorldScale(), want.scale) > 1e-4) throw Error("Scale changed in export: " + want.name);
  if ((want.type === "mesh") !== !!node.getMesh()) throw Error("Mesh missing in export: " + want.name);
  if ((node.getParentNode()?.getName() ?? null) !== want.parent) throw Error("Parent changed in export: " + want.name);
}
const strangers = exported.getRoot().listNodes().map((n) => n.getName()).filter((name) => !record.nodes.some((n) => n.name === name));
if (strangers.length) throw Error("Export has nodes Blender did not record: " + strangers.join(", "));
const spellings = new Set(record.nodes.map((n) => threeName(n.name)));
if (spellings.size !== record.nodes.length) throw Error("Two names collapse to one three.js spelling");

// --- 2. The manifest, measured on the export. --------------------------------------
const nodes = record.nodes.map((want) => {
  const node = named(exported, want.name)[0];
  const mesh = node.getMesh();
  return {
    name: want.name,
    three: threeName(want.name),
    parent: want.parent,
    piece: want.piece,
    role: want.role,
    collection: want.collection,
    type: want.type,
    mesh: mesh?.getName() ?? null,
    local: { translation: list(node.getTranslation()), rotation: list(node.getRotation()), scale: list(node.getScale()) },
    world: { translation: list(node.getWorldTranslation()), rotation: list(node.getWorldRotation()), scale: list(node.getWorldScale()), matrix: list(node.getWorldMatrix()) },
    pivot: { point: list(node.getWorldTranslation()), ...(want.motion ?? { kind: "origin" }) },
    bounds: bounds(node),
    triangles: {},
    materials: mesh ? [...new Set(mesh.listPrimitives().map((p) => p.getMaterial()?.getName() ?? ""))] : [],
  };
});

// --- 3. Pack each tier and prove nothing moved. ------------------------------------
const tiers = {};
for (const t of TIERS) {
  const doc = await io.read(SOURCE);
  const root = doc.getRoot();
  await doc.transform(dedup(), weld());
  if (t.ratio < 1) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: t.ratio, error: 0.0012 }));
  for (const texture of root.listTextures()) {
    const base = (texture.getName() || "").replace(/\.(png|jpe?g)$/i, "");
    const limit = Math.min(t.texture, Math.round(((TEXTURE_LIMIT[base] ?? 1024) * t.texture) / 1024));
    const image = sharp(texture.getImage()).resize({ width: limit, height: limit, fit: "inside", withoutEnlargement: true });
    const grey = base === "kit.ao";
    const bytes = await (grey ? image.greyscale() : image).jpeg({ quality: t.quality, mozjpeg: true }).toBuffer();
    texture.setImage(bytes).setMimeType("image/jpeg");
  }
  // Give every mesh a holder so quantization never touches a named node.
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    node.addChild(doc.createNode(node.getName() + HOLDER).setMesh(mesh));
    node.setMesh(null);
  }
  await doc.transform(
    prune({ keepLeaves: true, keepExtras: true }),
    meshopt({ encoder: MeshoptEncoder, level: "medium", quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }),
  );
  const bytes = await io.writeBinary(doc);
  const report = await validator.validateBytes(bytes, { maxIssues: 64 });
  if (report.issues.numErrors) throw Error(JSON.stringify(report.issues.messages.filter((m) => m.severity === 0)));
  const reopened = await io.readBinary(bytes);
  let total = 0;
  for (const want of nodes) {
    const found = named(reopened, want.name);
    if (found.length !== 1) throw Error(`${t.file} has ${found.length} nodes named ${want.name}`);
    const node = found[0];
    if (apart(node.getWorldTranslation(), want.world.translation) > 1e-5) throw Error(`${t.file}: pivot moved: ${want.name}`);
    if (turned(node.getWorldRotation(), want.world.rotation) > 1e-5) throw Error(`${t.file}: rotation changed: ${want.name}`);
    if (apart(node.getWorldScale(), want.world.scale) > 1e-5) throw Error(`${t.file}: scale changed: ${want.name}`);
    if ((node.getParentNode()?.getName() ?? null) !== want.parent) throw Error(`${t.file}: parent changed: ${want.name}`);
    if ((want.type === "mesh") !== !!own(node)) throw Error(`${t.file}: mesh lost: ${want.name}`);
    if (want.bounds) {
      const now = bounds(node);
      if (apart(now.min, want.bounds.min) > 0.004 || apart(now.max, want.bounds.max) > 0.004) throw Error(`${t.file}: geometry moved: ${want.name}`);
    }
    want.triangles[t.tier] = triangles(own(node));
    total += want.triangles[t.tier];
  }
  if (bytes.byteLength > t.bytes) throw Error(`${t.file} is ${bytes.byteLength} bytes, over its ${t.bytes} budget`);
  if (total > t.triangles) throw Error(`${t.file} has ${total} triangles, over its ${t.triangles} budget`);
  await writeFile(t.file, bytes);
  tiers[t.tier] = {
    file: t.file,
    url: "/" + t.file.replace(/^public\//, ""),
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    triangles: total,
    nodes: reopened.getRoot().listNodes().length,
    meshes: reopened.getRoot().listMeshes().length,
    materials: reopened.getRoot().listMaterials().length,
    textures: reopened.getRoot().listTextures().map((x) => ({ name: x.getName(), bytes: x.getImage().byteLength, size: x.getSize() })),
    validator: { errors: report.issues.numErrors, warnings: report.issues.numWarnings },
  };
}

const materials = exported.getRoot().listMaterials().map((m) => ({
  name: m.getName(),
  finish: m.getExtras().finish ?? null,
  tile: m.getExtras().tile ?? 1,
  doubleSided: m.getDoubleSided(),
  textures: [m.getBaseColorTexture(), m.getMetallicRoughnessTexture(), m.getOcclusionTexture()].filter(Boolean).map((x) => x.getName()),
}));
await writeFile(
  MANIFEST,
  JSON.stringify(
    {
      about: "Travellers Rest kit. Written by scripts/pack-kit.mjs; do not edit by hand.",
      coordinates: "metres, Y up, south +Z (the house's own frame)",
      naming: "Blender and glTF use the dotted name; three.js GLTFLoader strips the dots (see `three`), and keeps the original in userData.name",
      holder: "each mesh sits on a child named <name>" + HOLDER + " so the named node keeps its authored transform",
      blender: record.blender,
      tiers,
      materials,
      nodes,
    },
    null,
    1,
  ) + "\n",
);
console.table(Object.values(tiers).map((t) => ({ file: t.file, bytes: t.bytes, triangles: t.triangles, nodes: t.nodes, meshes: t.meshes, errors: t.validator.errors, warnings: t.validator.warnings })));
for (const t of Object.values(tiers)) console.log(t.sha256, t.bytes, t.file);
