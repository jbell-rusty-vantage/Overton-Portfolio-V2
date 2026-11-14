// Pack the Blender export for the browser. Edition 1 is the integrated guided house
// (kept byte-for-byte as the versioned baseline). Edition 2 is the architectural shell
// for the continuous world: the southwest room's fixed dressing is removed because the
// library interior, bindings, leaves and artifacts are live objects with their own
// transforms. Run `node scripts/pack-estate.mjs --edition 2` (default) or `--edition 1`.
import { readFile, writeFile } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  join,
  meshopt,
  prune,
  simplify,
  weld,
} from "@gltf-transform/functions";
import {
  MeshoptEncoder,
  MeshoptDecoder,
  MeshoptSimplifier,
} from "meshoptimizer";
import validator from "gltf-validator";
import sharp from "sharp";

const flag = process.argv.indexOf("--edition");
const edition = flag > 0 ? Number(process.argv[flag + 1]) : 2;
if (edition !== 1 && edition !== 2) throw Error("Unknown edition");
const anchors = JSON.parse(
  await readFile(
    "assets/travellers-rest/anchors" + (edition === 2 ? "-v2" : "") + ".json",
    "utf8",
  ),
);
// Everything inside the southwest room that the live world now owns.
const interior = [
  "A map of the Tennassee Government",
  "Andiron finials",
  "Bound volumes",
  "Cabinet backs",
  "Cabinet cheeks",
  "Cabinet crown",
  "Cabinet shelves",
  "Candlestick foot",
  "Candlestick stem",
  "Chair crest",
  "Chair rail and skirting",
  "Chair spindles",
  "Chimney breast",
  "Door casing",
  "Door head",
  "Door latch",
  "Firebox",
  "Hearth irons",
  "Hearth logs",
  "Hearthstone",
  "Ink",
  "Inset writing surface",
  "Jackson on the hall wall",
  "Letter on the writing table",
  "Library south windows",
  "Lines of type",
  "Lozenges",
  "Mantel jamb foot",
  "Mantel jambs",
  "Mantelshelf",
  "North plaster",
  "Open reports, boards",
  "Open reports, leaves",
  "Overton · registered likeness",
  "Page edges",
  "Painted dado",
  "Pewter inkwell",
  "Plaster ceiling",
  "Portrait gilt rail",
  "Portrait gilt side",
  "Portrait rabbet",
  "Raised door fields",
  "Six-panel door",
  "South plaster",
  "Spine bands",
  "Stacked reports",
  "Tallow taper",
  "West plaster",
  "West trim",
  "West wainscot",
  "White ash flooring",
  "Wick",
  "Windsor chair",
  "Woven borders",
  "Woven hearth rug",
  "Writing quill",
  "Writing table",
];
await Promise.all([
  MeshoptEncoder.ready,
  MeshoptDecoder.ready,
  MeshoptSimplifier.ready,
]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });
const proof = [];
for (const low of [false, true]) {
  const doc = await io.read(edition === 2 ? ".local-library/estate/world-survey.glb" : ".local-library/estate/world.glb");
  const root = doc.getRoot();
  let removed = 0;
  if (edition === 2) {
    for (const node of root.listNodes()) {
      const base = node.getName().replace(/\.\d+$/, "");
      if (node.getMesh() && interior.includes(base)) {
        node.dispose();
        removed++;
      }
    }
    for (const animation of root.listAnimations()) animation.dispose();
    // The first edition's anchor empties are replaced by the extended contract below.
    for (const node of root.listNodes())
      if (!node.getMesh() && /^[a-z]+\.[a-z]+$/.test(node.getName()))
        node.dispose();
  }
  // Join the static architecture by material. Movable objects never enter this file
  // in edition 2, so no identity is lost here.
  await doc.transform(
    flatten(),
    join({ keepNamed: false }),
    weld(),
    dedup(),
    prune(),
  );
  if (low)
    await doc.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: 0.58, error: 0.0015 }),
    );
  for (const texture of root.listTextures()) {
    const size = low ? 512 : 1024;
    const bytes = await sharp(texture.getImage())
      .resize({
        width: size,
        height: size,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: low ? 71 : 88 })
      .toBuffer();
    texture.setImage(bytes).setMimeType("image/jpeg");
  }
  await doc.transform(
    meshopt({
      encoder: MeshoptEncoder,
      level: "medium",
      quantizePosition: 16,
      quantizeTexcoord: 14,
    }),
  );
  const scene = root.listScenes()[0];
  for (const [name, point] of Object.entries(anchors)) {
    if (!root.listNodes().some((n) => n.getName() === name))
      scene.addChild(doc.createNode(name).setTranslation(point));
  }
  const file =
    "public/travellers-rest/world" +
    (edition === 2 ? "-v2" : "") +
    (low ? "-low" : "") +
    ".glb";
  const bytes = await io.writeBinary(doc);
  const report = await validator.validateBytes(bytes, { maxIssues: 64 });
  if (report.issues.numErrors || bytes.byteLength > 8 * 1024 * 1024)
    throw Error(JSON.stringify(report.issues.messages));
  const reopened = await io.readBinary(bytes);
  for (const [name, point] of Object.entries(anchors)) {
    const nodes = reopened
      .getRoot()
      .listScenes()[0]
      .listChildren()
      .filter((n) => n.getName() === name);
    if (
      nodes.length !== 1 ||
      nodes[0]
        .getWorldTranslation()
        .some((v, i) => Math.abs(v - point[i]) > 0.01)
    )
      throw Error("Invalid estate anchor " + name);
  }
  if (edition === 1 && !reopened.getRoot().listAnimations().length)
    throw Error("Missing portrait animation");
  await writeFile(file, bytes);
  proof.push({
    file,
    edition,
    bytes: bytes.length,
    triangles: root
      .listMeshes()
      .flatMap((m) => m.listPrimitives())
      .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0),
    animations: root.listAnimations().map((a) => a.getName()),
    anchors: Object.keys(anchors).length,
    removedInteriorObjects: removed,
    errors: report.issues.numErrors,
    warnings: report.issues.numWarnings,
  });
}
const receipt = "assets/travellers-rest/delivery.json";
const previous = JSON.parse(await readFile(receipt, "utf8")).filter(
  (p) => (p.edition ?? 1) !== edition,
);
await writeFile(
  receipt,
  JSON.stringify(
    [...previous.map((p) => ({ edition: 1, ...p })), ...proof].sort(
      (a, b) => a.edition - b.edition,
    ),
    null,
    2,
  ) + "\n",
);
console.table(proof);
