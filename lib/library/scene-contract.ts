import manifest from "@/assets/library/manifest.json";
import house from "@/assets/travellers-rest/anchors.json";
import world from "@/assets/travellers-rest/anchors-v2.json";
type Anchor = { node: string; target: number[]; yaw?: number };
function validateScene(bytes: Uint8Array, anchors: Anchor[]) {
  if (bytes.length < 20 || bytes.length > 8 * 1024 * 1024)
    throw Error("The GLB must fit the eight MiB scene budget.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== bytes.length ||
    view.getUint32(16, true) !== 0x4e4f534a
  )
    throw Error("Expected a complete glTF 2 GLB.");
  const end = 20 + view.getUint32(12, true);
  if (end > bytes.length) throw Error("Invalid scene header.");
  const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, end)));
  if (
    !Array.isArray(json.nodes) ||
    !json.meshes?.length ||
    json.buffers?.some((b: { uri?: string }) => b.uri) ||
    json.images?.some((i: { uri?: string }) => i.uri)
  )
    throw Error("Use a self-contained GLB with embedded resources.");
  for (const a of anchors) {
    const hits = json.nodes
      .map((n: { name?: string }, index: number) =>
        n.name === a.node ? index : -1,
      )
      .filter((index: number) => index >= 0);
    if (
      hits.length !== 1 ||
      !json.scenes?.[json.scene ?? 0]?.nodes?.includes(hits[0])
    )
      throw Error("Missing, duplicated or non-root scene anchor: " + a.node);
    const node = json.nodes[hits[0]];
    const position = a.target;
    const translation = node.translation ?? [0, 0, 0];
    if (
      node.matrix ||
      position.some((n, i) => Math.abs(n - translation[i]) > 0.01) ||
      (node.scale ?? [1, 1, 1]).some((n: number) => Math.abs(n - 1) > 0.001)
    )
      throw Error("Unexpected scene anchor transform: " + a.node);
    const angle = ((a.yaw ?? 0) * Math.PI) / 360;
    const rotation = node.rotation ?? [0, 0, 0, 1];
    const alignment =
      rotation[1] * Math.sin(angle) + rotation[3] * Math.cos(angle);
    if (Math.abs(Math.abs(alignment) - 1) > 0.001)
      throw Error("Unexpected anchor orientation: " + a.node);
  }
  return json;
}
export function validateHall(bytes: Uint8Array) {
  validateScene(bytes, [
    ...manifest.zones,
    ...manifest.shelves.map((a) => ({ ...a, target: [a.x, 0, a.z] })),
    ...manifest.screens.map((a) => ({ ...a, target: a.pos })),
  ]);
}
/** Edition 1 carries the custodian clip in the model. Edition 2 is the architectural
    shell of the continuous world: the portrait, bindings and documents are live objects,
    so the contract is the extended set of standing, shelf and resting anchors. */
export function validateEstate(bytes: Uint8Array, edition: 1 | 2 = 1) {
  const glb = validateScene(
    bytes,
    Object.entries(edition === 2 ? world : house).map(([node, target]) => ({
      node,
      target,
    })),
  );
  if (
    edition === 1 &&
    !glb.animations?.some(
      (a: { name?: string }) => a.name === "Custodian recognition",
    )
  )
    throw Error("The custodian performance clip is missing.");
}
