import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds, weld, meshopt, simplify } from "@gltf-transform/functions";
import {
  MeshoptDecoder,
  MeshoptEncoder,
  MeshoptSimplifier,
} from "meshoptimizer";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import validator from "gltf-validator";

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
const manifest = JSON.parse(
  await readFile("assets/library/manifest.json", "utf8"),
);
const required = [...manifest.zones, ...manifest.shelves, ...manifest.screens];
const assets = [];
for (const low of [false, true]) {
  const doc = await io.read(
    low
      ? ".local-library/hall-low-master.glb"
      : ".local-library/hall-master.glb",
  );
  const nodes = doc.getRoot().listNodes();
  const anchors = required.map((a) => {
    const node = nodes.find((n) => n.getName() === a.node);
    if (!node) throw Error("Missing source anchor " + a.node);
    return {
      name: a.node,
      translation: node.getWorldTranslation(),
      rotation: node.getWorldRotation(),
    };
  });
  await doc.transform(weld());
  if (low)
    await doc.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: 0.58, error: 0.002 }),
    );
  await doc.transform(
    meshopt({
      encoder: MeshoptEncoder,
      level: "medium",
      quantizePosition: 15,
      quantizeTexcoord: 14,
    }),
  );
  const scene = doc.getRoot().listScenes()[0];
  for (const a of anchors)
    if (
      !doc
        .getRoot()
        .listNodes()
        .some((n) => n.getName() === a.name)
    ) {
      scene.addChild(
        doc
          .createNode(a.name)
          .setTranslation(a.translation)
          .setRotation(a.rotation),
      );
    }
  const file = low ? "public/library/hall-low.glb" : "public/library/hall.glb";
  const bytes = await io.writeBinary(doc);
  const report = await validator.validateBytes(bytes, {
    uri: file,
    maxIssues: 32,
  });
  if (report.issues.numErrors)
    throw Error(JSON.stringify(report.issues.messages));
  const reopened = await io.readBinary(bytes);
  for (const a of anchors) {
    const hits = reopened
      .getRoot()
      .listNodes()
      .filter((n) => n.getName() === a.name);
    if (
      hits.length !== 1 ||
      hits[0]
        .getWorldTranslation()
        .some((v, i) => Math.abs(v - a.translation[i]) > 0.005)
    )
      throw Error("Anchor mismatch " + a.name);
  }
  const triangles = reopened
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);
  await writeFile(file, bytes);
  assets.push({
    file,
    bytes: bytes.length,
    boundsMeters:getBounds(reopened.getRoot().listScenes()[0]),
    triangles,
    materials: reopened.getRoot().listMaterials().length,
    textures: reopened.getRoot().listTextures().length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    validatorErrors: report.issues.numErrors,
    validatorWarnings: report.issues.numWarnings,
    anchors: anchors.length,
  });
}
for (const name of [
  "entrance.webp",
  "entrance-portrait.webp",
  "plate-0.webp",
  "plate-1.webp",
  "plate-2.webp",
  "plate-3.webp",
]) {
  const file = "public/library/" + name,
    bytes = await readFile(file);
  assets.push({
    file,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
await writeFile(
  "assets/library/ASSET_MANIFEST.json",
  JSON.stringify(
    {
      source:
        "Original geometry, textures and cover illustrations generated in this repository",
      units: "meters, glTF Y-up",
      created:"2026-11-07",
      attribution:"Original project artwork generated for John Overton’s Library with Blender and the bundled illustration script.",
      thirdPartyArt:[],
      editableSource:"assets/library/The Library.blend",
      generators: [
        "assets/library/build.py",
        "assets/library/illustrate.py",
        "scripts/pack-library.mjs",
      ],
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.table(
  assets.map(({ file, bytes, triangles }) => ({ file, bytes, triangles })),
);
