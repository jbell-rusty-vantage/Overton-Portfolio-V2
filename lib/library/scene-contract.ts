import manifest from "@/assets/library/manifest.json";
export function validateHall(bytes: Uint8Array) {
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
  for (const a of [
    ...manifest.zones,
    ...manifest.shelves,
    ...manifest.screens,
  ]) {
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
    const position =
      "x" in a ? [a.x, 0, a.z] : "target" in a ? a.target : a.pos;
    const translation = node.translation ?? [0, 0, 0];
    if (
      node.matrix ||
      position.some((n, i) => Math.abs(n - translation[i]) > 0.01) ||
      (node.scale ?? [1, 1, 1]).some((n: number) => Math.abs(n - 1) > 0.001)
    )
      throw Error("Unexpected scene anchor transform: " + a.node);
    const angle = "yaw" in a ? (a.yaw * Math.PI) / 360 : 0;
    const rotation = node.rotation ?? [0, 0, 0, 1];
    const alignment =
      rotation[1] * Math.sin(angle) + rotation[3] * Math.cos(angle);
    if (Math.abs(Math.abs(alignment) - 1) > 0.001)
      throw Error("Unexpected anchor orientation: " + a.node);
  }
}
