// Export the code-built library interior from the running engine to glTF, so the room
// can be opened in Blender (assets/travellers-rest/kit/assemble_world.py imports it).
//
//   node scripts/export-room.mjs [url]
//
// Opens the lab page (the office preview must be running on port 3078), waits for the
// scene, runs three.js's GLTFExporter in the page on a flattened copy of the engine's
// scene, and writes .local-library/kit/room-export.glb with a report beside it.
//
// Left out on purpose: the packed shell (Blender imports it from its own source), the
// grounds, the Blender kit pieces (the kit .blend supplies them), sprites, points,
// invisible hit volumes, and the painted light: additive beams and glows and the
// transparent contact shadows, which stand in for light transport the browser does not
// compute and a renderer in Blender does.
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const staticLight = process.argv.includes("--static-light");
const url = process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3078/dev/world-lab?instant#library";
const out = ".local-library/kit/" + (staticLight ? "static-room-export.glb" : "room-export.glb");
await mkdir(".local-library/kit", { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--enable-gpu"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message.slice(0, 300)));
// The page's own three.js is bundled and private, so the exporter is served to it from
// node_modules under a path the application does not use.
await page.route("**/__kit/**", async (route) => {
  const name = new URL(route.request().url()).pathname.split("/__kit/")[1];
  const file = name === "GLTFExporter.js" ? "node_modules/three/examples/jsm/exporters/GLTFExporter.js" : "node_modules/three/build/" + name;
  let body = await readFile(file, "utf8");
  if (name === "GLTFExporter.js") body = body.replace(/from 'three'/g, "from '/__kit/three.module.js'");
  await route.fulfill({ contentType: "text/javascript", body });
});
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector("canvas[data-scene=ready]", { timeout: 120000 });
await page.waitForTimeout(2000);

const result = await page.evaluate(async (staticLight) => {
  const THREE = await import("/__kit/three.module.js");
  const { GLTFExporter } = await import("/__kit/GLTFExporter.js");
  const engine = window.engine ?? window.estateEngine;
  const scene = engine.scene;
  scene.updateMatrixWorld(true);
  const shell = scene.children.find((c) => c.getObjectByName?.("doorsouth"));
  const outside = new Set([shell, engine.grounds?.root].filter(Boolean));
  const root = new THREE.Group();
  root.name = "Library interior (generated from code)";
  const report = { kit: engine.o.canvas.getAttribute("data-kit"), exported: {}, skipped: {} };
  const count = (bucket, key) => (bucket[key] = (bucket[key] ?? 0) + 1);
  const used = new Set();
  const place = (source, matrix, name, top) => {
    const mesh = new THREE.Mesh(source.geometry, source.material);
    mesh.name = name;
    mesh.matrix.copy(matrix);
    mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
    root.add(mesh);
    count(report.exported, top);
    for (const m of [].concat(source.material)) used.add(m);
  };
  const walk = (o, top) => {
    if (outside.has(o) || !o.visible) return;
    const label = top ?? (o.name || o.type);
    if (o.isSprite || o.isPoints || o.isLine) count(report.skipped, o.type);
    else if (o.isMesh) {
      const materials = [].concat(o.material);
      if (!staticLight && /^Blender kit/.test(o.name)) count(report.skipped, "Blender kit (supplied by the kit .blend)");
      else if (materials.some((m) => m.visible === false)) count(report.skipped, "hit volume");
      else if (materials.some((m) => m.isMeshBasicMaterial && m.transparent && !m.depthWrite)) count(report.skipped, "painted light or shadow");
      else if (materials.some((m) => m.isShaderMaterial || (staticLight && m.transparent))) count(report.skipped, "shader or transparent material");
      else if (o.isInstancedMesh) {
        const each = new THREE.Matrix4();
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, each);
          place(o, new THREE.Matrix4().multiplyMatrices(o.matrixWorld, each), (o.parent?.name || "Instance") + " · volume " + String(i + 1).padStart(3, "0"), label);
        }
      } else place(o, o.matrixWorld, o.name || label, label);
    }
    for (const child of o.children) walk(child, label);
  };
  if (staticLight) walk(scene.getObjectByName("Southwest library"), null);
  else for (const child of scene.children) walk(child, null);
  // Opaque finishes travel as JPEG; anything with transparency keeps PNG.
  for (const m of used) if (m.map && !m.transparent && !m.alphaTest) m.map.userData.mimeType = "image/jpeg";
  const buffer = await new GLTFExporter().parseAsync(root, { binary: true, maxTextureSize: 1024 });
  const bytes = new Uint8Array(buffer);
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { base64: btoa(text), report, nodes: root.children.length };
}, staticLight);
await browser.close();
const bytes = Buffer.from(result.base64, "base64");
await writeFile(out, bytes);
await writeFile(out.replace(/\.glb$/, ".json"), JSON.stringify({ url, bytes: bytes.length, nodes: result.nodes, ...result.report }, null, 2) + "\n");
console.log(out, bytes.length, "bytes,", result.nodes, "nodes");
console.log(JSON.stringify(result.report, null, 1));
