/* The grounds of Travellers Rest: trees, garden, people and sky outside the house.
   The engine calls `buildGrounds` once after the shell has loaded and `update` on every
   frame in which the visitor can see outdoors. Coordinates are the house's own: metres,
   Y up, south +Z; the ground is y = 0 and the south door is at x = 0, z ≈ 3.1.

   What is documented and what is interpretation is set out in
   assets/travellers-rest/grounds/README.md. The plan (positions, the walking contract)
   is in grounds/plan.ts; surfaces, flora, made things and people are beside it. The whole
   of the outdoors is about twenty draw calls: everything static is merged by material,
   the people are one skinned mesh, and shade is painted, not computed. */
import * as THREE from "three";
import type { EnvironmentPalette } from "./environment";
import { seeded, type Tier } from "./kit";
import { layEdging, layGravel, raiseFences, raiseOutbuilding, setBench, setSign, shadeHedges } from "./grounds/built";
import { Mesher, flat, growTree, hedgeBox, shrub, tone, tuft, type RGB } from "./grounds/flora";
import { buildPeople } from "./grounds/people";
import { OUTBUILDINGS, SHADE, beds, edgings, fences, foundation, hedges, heightAt, obstaclesFor, smooth, standing, terrain, treesFor, trunkRadius, walkable, type Circle } from "./grounds/plan";
import { ShadePainter, barkTexture, brickTexture, gravelTexture, hedgeTexture, lawnTexture, macroTexture, personShadeTexture, plantAtlas, signTexture, skyTexture, treelineTexture, type Cell } from "./grounds/surfaces";

export type Grounds = {
  root: THREE.Group;
  /** Advance wind, figures and light. Return true while anything is moving. */
  update(dt: number, camera: THREE.Vector3): boolean;
  setEnvironment(palette: EnvironmentPalette): void;
  dispose(): void;
};
/** Trunks, hedges, beds, fences, the bench and the people who stand or sit: circles on
    the ground plane that a walking visitor must go round. The camera controller reads
    this list. It is filled for the detailed tier when the module loads and refilled once
    for the actual tier when the grounds are built; after that it does not change. The
    strolling family is not in it: they stop and give way when the visitor is close. */
export const groundsObstacles: Circle[] = [...obstaclesFor("high"), ...standing.map((p) => ({ x: p.x, z: p.z, r: 0.45 }))];
/** Where a visitor may walk outdoors, as boxes [x0, x1, z0, z1] on the ground plane. */
export const groundsWalkable: [number, number, number, number][] = walkable;
/** Height of the lawn under a point, for the visitor's eye level outdoors: level round
    the house and garden (zero), rolling gently beyond about thirty metres. The porch
    deck and steps are not included. */
export function groundHeight(x: number, z: number) {
  return heightAt(x, z);
}

/** Region of the painted shade map on the ground, in metres. */
const SHADE_RECT = { x0: -40, z0: -55, size: 130 };

type Wind = { value: number };
type Shared = { time: Wind; shade: { value: THREE.Texture | null }; rect: { value: THREE.Vector4 }; macro: { value: THREE.Texture | null } };
/** Teach a standard material the three things the grounds need: painted shade looked
    up along the sun's ray, air moving through leaves, and crowns shaded as soft volumes. */
function outdoor<M extends THREE.Material>(material: M, shared: Shared, options: { shade?: boolean; wind?: boolean; soft?: boolean; macro?: boolean; fill?: number }) {
  const fill = options.fill ?? 1;
  const key = "grounds:" + (options.shade ? "s" : "") + (options.wind ? "w" : "") + (options.soft ? "f" : "") + (options.macro ? "m" : "") + fill;
  material.customProgramCacheKey = () => key;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shared.time;
    shader.uniforms.uShade = shared.shade;
    shader.uniforms.uShadeRect = shared.rect;
    shader.uniforms.uMacro = shared.macro;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGroundsPos;\nuniform float uTime;\n" + (options.wind ? "attribute float aWind;\n" : ""))
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n" +
          (options.wind
            ? `{
  vec3 wp = transformed;
  float gust = 0.55 + 0.45 * sin(uTime * 0.31 + wp.x * 0.07 + wp.z * 0.05);
  float g = aWind * gust;
  transformed.x += g * (0.05 * sin(uTime * 1.3 + wp.x * 0.9 + wp.y * 0.7) + 0.02 * sin(uTime * 3.1 + wp.z * 2.3 + wp.y * 1.9));
  transformed.z += g * (0.04 * cos(uTime * 1.1 + wp.z * 0.8 + wp.y * 0.6) + 0.02 * sin(uTime * 2.7 + wp.x * 2.1));
  transformed.y += g * 0.018 * sin(uTime * 2.2 + wp.x * 1.7 + wp.z * 1.3);
}`
            : ""),
      )
      .replace("#include <project_vertex>", "#include <project_vertex>\nvGroundsPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    let fragment = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vGroundsPos;\nuniform float uTime;\nuniform sampler2D uShade;\nuniform vec4 uShadeRect;\nuniform sampler2D uMacro;");
    let colour = "#include <map_fragment>\n";
    if (options.macro)
      colour += `{
  vec3 m1 = texture2D(uMacro, vGroundsPos.xz / 43.0).rgb;
  vec3 m2 = texture2D(uMacro, vGroundsPos.zx / 9.7).rgb;
  float lush = m1.r * 0.65 + m2.g * 0.35;
  float dry = m1.g * 0.6 + m2.r * 0.4;
  diffuseColor.rgb *= mix(vec3(0.78, 0.84, 0.72), vec3(1.1, 1.08, 0.94), lush);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.4, 1.14, 0.74), smoothstep(0.5, 0.95, dry) * 0.5);
}
`;
    if (options.shade)
      colour += `{
  vec2 sp = vGroundsPos.xz + vec2(${SHADE.x.toFixed(4)}, ${SHADE.z.toFixed(4)}) * max(vGroundsPos.y, 0.0);
  sp += 0.03 * vec2(sin(uTime * 1.1 + sp.x * 1.9 + sp.y * 0.7), cos(uTime * 0.87 + sp.y * 2.3 + sp.x * 0.5));
  float sh = texture2D(uShade, (sp - uShadeRect.xy) * uShadeRect.zw).r;
  diffuseColor.rgb *= mix(vec3(1.0), vec3(0.3, 0.37, 0.52), sh);
}
`;
    fragment = fragment.replace("#include <map_fragment>", colour);
    // The open sky: the house's lights are set for its rooms, so the cool light that
    // fills shadows out of doors is painted in here instead of adding a lamp.
    if (!options.soft)
      fragment = fragment.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\nreflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.2, 0.235, 0.3) * " + fill.toFixed(2) + ";");
    if (options.soft)
      fragment = fragment
        // Leaf cards are seen from both sides but lit as parts of one rounded crown.
        .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\nnormal = normalize(vNormal);\nnonPerturbedNormal = normal;")
        // Light coming through the leaves when the visitor looks toward the sun.
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
#if NUM_DIR_LIGHTS > 0
{
  float through = pow(max(dot(-normalize(vViewPosition), directionalLights[0].direction), 0.0), 3.0);
  reflectedLight.directDiffuse += diffuseColor.rgb * directionalLights[0].color * through * 0.07;
}
#endif
reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.2, 0.235, 0.3) * ${fill.toFixed(2)};`,
        );
    shader.fragmentShader = fragment;
  };
  return material;
}

/** Leaves must stay out of the house: its rooms are drawn at the same time. */
function keepOut(x: number, y: number, z: number, pad: number) {
  if (y < 10.2 && Math.abs(x) < 8.8 + pad && z > -3.7 - pad && z < 3.8 + pad) return true;
  if (y < 6.4 && Math.abs(x) < 2.7 + pad && z > 3 && z < 5.7 + pad) return true;
  if (y < 8 && x > -8.6-pad && x < 3.7+pad && z > -29.7-pad && z < -3) return true;
  return y < 8 && x > 3-pad && x < 8.4+pad && z > -7.6-pad && z < -3;
}

export function buildGrounds(options: {
  tier: Tier;
  reduced: boolean;
  scene: THREE.Scene;
  /** The packed exterior and hall, for adjusting the lawn it already carries. */
  shell: THREE.Object3D;
}): Grounds {
  const { tier, reduced, shell } = options;
  const high = tier === "high";
  const root = new THREE.Group();
  root.name = "Grounds";
  const rand = seeded(1799);

  // The survey model's flat lawn gives way to this one.
  const replaced: THREE.Object3D[] = [];
  shell.traverse((o) => {
    if (/landscape/i.test(o.name) && o.visible) {
      o.visible = false;
      replaced.push(o);
    }
  });

  const shade = new ShadePainter(high ? 2048 : 1024, SHADE_RECT);
  const shared: Shared = {
    time: { value: 0 },
    shade: { value: null },
    rect: { value: new THREE.Vector4(SHADE_RECT.x0, SHADE_RECT.z0, 1 / SHADE_RECT.size, 1 / SHADE_RECT.size) },
    macro: { value: macroTexture(31) },
  };
  // The same crown shadow crosses the weatherboards at the height reached by the
  // sun ray. Clone only exterior joinery materials: indoor plaster stays untouched.
  const facade: {mesh: THREE.Mesh; original: THREE.Material | THREE.Material[]}[] = [];
  const facadeFinishes = new Map<THREE.Material, THREE.Material>();
  shell.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !/Survey[_ ]?(south|weatherboard|wall[_ ]?over|window[_ ]?apron)|Corner[_ ]?boards|Eaves/i.test(o.name)) return;
    facade.push({mesh:o,original:o.material});
    const shadeFinish = (m: THREE.Material) => {
      let copy = facadeFinishes.get(m);
      if (!copy) { copy = outdoor(m.clone(), shared, {shade:true,fill:0}); facadeFinishes.set(m,copy); }
      return copy;
    };
    o.material = Array.isArray(o.material) ? o.material.map(shadeFinish) : shadeFinish(o.material);
  });
  const atlas = plantAtlas(1812, high ? 2048 : 1024);
  const textures: THREE.Texture[] = [atlas, shared.macro.value!];
  const keep = <T extends THREE.Texture>(t: T) => (textures.push(t), t);
  const leafy = (withShade: boolean) =>
    outdoor(new THREE.MeshLambertMaterial({ map: atlas, vertexColors: true, alphaTest: 0.4, alphaToCoverage: true, side: THREE.DoubleSide }), shared, { wind: true, soft: true, shade: withShade });
  const materials = {
    lawn: outdoor(new THREE.MeshStandardMaterial({ map: keep(lawnTexture(5)), vertexColors: true, roughness: 1 }), shared, { shade: true, macro: true }),
    gravel: outdoor(new THREE.MeshStandardMaterial({ map: keep(gravelTexture(7)), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), shared, { shade: true }),
    brick: outdoor(new THREE.MeshStandardMaterial({ map: keep(brickTexture(9)), vertexColors: true, roughness: 0.92 }), shared, { shade: true }),
    bark: outdoor(new THREE.MeshLambertMaterial({ map: keep(barkTexture(13)), vertexColors: true }), shared, { shade: true, fill: 1.3 }),
    hedge: outdoor(new THREE.MeshLambertMaterial({ map: keep(hedgeTexture(17)), vertexColors: true }), shared, { shade: true, fill: 1.2 }),
    plain: outdoor(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 }), shared, { shade: true }),
    people: outdoor(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86 }), shared, { shade: true }),
    crowns: leafy(false),
    plants: leafy(true),
    sign: outdoor(new THREE.MeshStandardMaterial({ map: keep(signTexture()), roughness: 0.7 }), shared, { shade: true }),
  };
  const meshers = { gravel: new Mesher(), brick: new Mesher(), bark: new Mesher(), near: new Mesher(), far: new Mesher(), plants: new Mesher(), hedge: new Mesher(), plain: new Mesher() };
  const add = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material, order = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "Grounds · " + name;
    mesh.castShadow = mesh.receiveShadow = false;
    mesh.renderOrder = order;
    root.add(mesh);
    return mesh;
  };

  // ── Sky ──
  const dome = add(
    "sky",
    new THREE.SphereGeometry(40, 40, 14, -Math.PI / 2, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshBasicMaterial({ map: keep(skyTexture(3, high ? 2048 : 1024)), side: THREE.BackSide, depthTest: false, depthWrite: false, toneMapped: false, fog: false }),
    -1000,
  );
  dome.frustumCulled = false;
  // The dome is drawn first and always centred on the eye, so it is never clipped.
  dome.onBeforeRender = (_r, _s, camera) => {
    dome.matrixWorld.setPosition(camera.position);
  };

  // ── Lawn ──
  {
    const n = high ? 72 : 44;
    const reach = 70;
    const m = new Mesher();
    const far = tone("#b9c8b4");
    const axis = Array.from({ length: n + 1 }, (_, i) => {
      const t = (i / n) * 2 - 1;
      return Math.sign(t) * Math.pow(Math.abs(t), 1.7) * reach;
    });
    for (let j = 0; j <= n; j++)
      for (let i = 0; i <= n; i++) {
        const x = axis[i],
          z = 8 + axis[j];
        const d = Math.hypot(x, z - 8);
        const k = smooth(26, 66, d) * 0.5;
        m.vertex(x, terrain(x, z), z, 0, 1, 0, x / 3.1, z / 3.1, [1 + (far[0] * 2.2 - 1) * k, 1 + (far[1] * 2.2 - 1) * k, 1 + (far[2] * 2.2 - 1) * k]);
      }
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const a = j * (n + 1) + i;
        m.quad(a, a + n + 1, a + n + 2, a + 1);
      }
    const g = m.build(false);
    g.computeVertexNormals();
    add("lawn", g, materials.lawn);
  }

  // ── Made things ──
  layGravel(meshers.gravel);
  layEdging(meshers.brick);
  raiseFences(meshers.plain, tier, shade);
  raiseOutbuilding(meshers.brick, meshers.plain, shade);
  setBench(meshers.plain, shade);
  const signFace = setSign(meshers.plain, shade);
  shadeHedges(shade);

  // ── Trees ──
  const trees = treesFor(tier);
  for (const t of trees) growTree(t, { bark: meshers.bark, leaves: t.detail === 2 ? meshers.far : meshers.near, shade, keepOut }, high ? 1 : 0.55);

  // ── Hedges, beds and foundation planting ──
  const box = tone("#e4ecd0");
  for (const h of hedges) hedgeBox(meshers.hedge, h, box);
  for (const h of edgings) hedgeBox(meshers.hedge, h, tone("#eef4d8"));
  const soil = tone("#3b2d22");
  const plants = meshers.plants;
  const white: RGB = [1, 1, 1];
  const leafTone = tone("#7c9a52", 1.6);
  for (const [x0, x1, z0, z1] of beds) {
    const m = meshers.plain;
    const a = m.vertex(x0, 0.02, z1, 0, 1, 0, 0, 0, soil),
      b = m.vertex(x1, 0.02, z1, 0, 1, 0, 0, 0, soil),
      c = m.vertex(x1, 0.02, z0, 0, 1, 0, 0, 0, soil),
      d = m.vertex(x0, 0.02, z0, 0, 1, 0, 0, 0, soil);
    m.quad(a, b, c, d);
  }
  // The two parterre beds: drifts of autumn flowers round a tall grass, box at the ends.
  const drifts: Cell[] = ["mum", "aster", "anemone", "sedum", "mum", "aster"];
  for (const [bx0,bx1,bz0,bz1] of beds) {
    const x0=bx0+.25, x1=bx1-.25, z0=bz0+.25, z1=bz1-.25;
    const count = high ? 58 : 30;
    for (let i = 0; i < count; i++) {
      const u = rand(),
        v = rand();
      const x = x0 + u * (x1 - x0),
        z = z0 + v * (z1 - z0);
      const middle = 1 - Math.abs(v - 0.5) * 2;
      const cell = drifts[Math.min(5, Math.floor(u * 6 + (rand() - 0.5) * 0.8 + 0.5)) % 6];
      const h = 0.36 + middle * 0.26 + rand() * 0.14;
      tuft(plants, x, 0.02, z, h * (1.05 + rand() * 0.4), h, rand() * 3, cell, white, 0.5);
    }
    for (let i = 0; i < 6; i++) flat(plants, x0 + rand() * (x1 - x0), 0.03, z0 + rand() * (z1 - z0), 0.9, rand() * 6, "cover", white);
    const cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2;
    for (let i = 0; i < 3; i++) tuft(plants, cx + (rand() - 0.5) * 0.3, 0.02, cz + (rand() - 0.5) * 0.2, 1.1, 1.15, rand() * 3, "meadow", white, 1.1, 3);
    for (const ex of [x0 + 0.2, x1 - 0.2]) {
      shrub(meshers.hedge, ex, 0, cz, 0.34, 0.6, box, high ? 2 : 1, 40 + Math.round(ex));
      shade.blob(ex + SHADE.x * 0.4, cz + SHADE.z * 0.4, 0.5, 0.6);
    }
  }
  // Under the south windows: evergreen mounds, hosta and fern, a few late flowers.
  for (const [x0, x1, z0, z1] of foundation) {
    const n = Math.round((x1 - x0) / 1.25);
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i + 0.5) / n) * (x1 - x0) + (rand() - 0.5) * 0.2;
      const end = i === 0 || i === n - 1;
      const r = end ? 0.5 : 0.3 + rand() * 0.12;
      const z = z0 + 0.42 + (end ? 0.1 : rand() * 0.12);
      shrub(meshers.hedge, x, 0, z, r, r * (end ? 1.35 : 1.1), i % 3 === 1 ? tone("#dfe8c0") : box, high ? 2 : 1, 70 + i);
      shade.blob(x + SHADE.x * r * 0.7, z + SHADE.z * r * 0.7, r * 1.1, 0.6);
      for (let k = 0; k < (high ? 7 : 3); k++) {
        const a = rand() * 6.3;
        tuft(plants, x + Math.cos(a) * r * 0.9, r * (0.3 + rand() * 0.8), z + Math.sin(a) * r * 0.9, 0.5, 0.46, rand() * 3, "fine", leafTone, 0.35, 1);
      }
    }
    const front = high ? 16 : 8;
    for (let i = 0; i < front; i++) {
      const x = x0 + 0.2 + rand() * (x1 - x0 - 0.4),
        z = z1 - 0.12 - rand() * 0.3;
      const pick = rand();
      const cell: Cell = pick < 0.4 ? "hosta" : pick < 0.7 ? "fern" : pick < 0.85 ? "anemone" : "aster";
      const h = cell === "fern" ? 0.55 : 0.42 + rand() * 0.12;
      tuft(plants, x, 0.02, z, h * 1.5, h, rand() * 3, cell, white, 0.45);
    }
  }
  // Soften the clipped hedges with a few sprays of new growth.
  if (high)
    for (const h of hedges) {
      const len = Math.max(h.x1 - h.x0, h.z1 - h.z0);
      for (let i = 0; i < len * 1.6; i++) tuft(plants, h.x0 + rand() * (h.x1 - h.x0), h.h - 0.12, h.z0 + rand() * (h.z1 - h.z0), 0.3, 0.26, rand() * 3, "fine", leafTone, 0.3, 1);
    }

  // ── Long grass where the mower does not reach, and fallen leaves ──
  const grassTone = (x: number, z: number): RGB => {
    const k = Math.min(0.55, Math.max(0, (Math.hypot(x, z - 8) - 26) / 70));
    const c = tone(rand() < 0.5 ? "#a4b47c" : "#beb684", 1.0);
    const hz = tone("#a4b49c", 1.0);
    return [c[0] + (hz[0] - c[0]) * k, c[1] + (hz[1] - c[1]) * k, c[2] + (hz[2] - c[2]) * k];
  };
  for (const f of fences) {
    const len = Math.hypot(f.to[0] - f.from[0], f.to[1] - f.from[1]);
    const n = Math.round(len * (high ? 3 : 1.4));
    for (let i = 0; i < n; i++) {
      const k = rand(),
        off = (rand() - 0.5) * 0.5;
      const x = f.from[0] + (f.to[0] - f.from[0]) * k + off,
        z = f.from[1] + (f.to[1] - f.from[1]) * k + off;
      const h = 0.35 + rand() * 0.4;
      tuft(plants, x, heightAt(x, z), z, h * 1.3, h, rand() * 3, rand() < 0.35 ? "meadow" : "grass", grassTone(x, z), 1);
    }
  }
  for (const t of trees) {
    if (t.detail === 2 || t.kind === "magnolia" || t.kind === "cedar") continue;
    const r = trunkRadius(t);
    for (let i = 0; i < (high ? 9 : 5); i++) {
      const a = rand() * 6.3,
        d = r + 0.15 + rand() * 0.35,
        x = t.x + Math.cos(a) * d,
        z = t.z + Math.sin(a) * d,
        h = 0.3 + rand() * 0.3;
      tuft(plants, x, heightAt(x, z), z, h * 1.4, h, rand() * 3, "grass", grassTone(x, z), 1);
    }
    // Leaves down on the grass and the gravel under the turning trees.
    const fallen = Math.round(t.r * t.r * (high ? 0.42 : 0.2) * (t.detail === 0 ? 1 : 0.5));
    for (let i = 0; i < fallen; i++) {
      const a = rand() * 6.3,
        d = Math.sqrt(rand()) * t.r * 1.2,
        x = t.x + Math.cos(a) * d + 0.8,
        z = t.z + Math.sin(a) * d - 0.6;
      if (keepOut(x, 0, z, 0.6) || Math.hypot(x, z - 8) > 29) continue;
      flat(plants, x, 0.03 + rand() * 0.004, z, 0.8 + rand() * 0.5, rand() * 6.3, "litter", t.kind === "dogwood" ? tone("#e8b0a0", 1.1) : white);
    }
  }
  // Meadow beyond the mown lawn: taller, paler grass toward the woods.
  {
    const want = high ? 1050 : 320;
    let placed = 0,
      guard = 0;
    while (placed < want && guard++ < want * 6) {
      const a = rand() * 6.3,
        d = 22 + Math.pow(rand(), 0.8) * 30;
      const x = Math.sin(a) * d,
        z = 8 + Math.cos(a) * d;
      const mown = (Math.abs(x) < 23 && z > -1.5 && z < 38) || keepOut(x, 0, z, 1.5);
      const lawnAxis = z > 30 && Math.abs(x) < 15;
      const inOut = OUTBUILDINGS.some((o) => x > o.x0-.5 && x < o.x1+.5 && z > o.z0-.5 && z < o.z1+.5);
      if (mown || lawnAxis || inOut) continue;
      const far = d > 36;
      const h = (0.5 + rand() * 0.5) * (far ? 1.5 : 1);
      tuft(plants, x, heightAt(x, z), z, h * (far ? 2.6 : 1.7), h, rand() * 3, rand() < 0.6 ? "meadow" : "grass", grassTone(x, z), 1, far ? 1 : 2);
      placed++;
    }
  }

  // ── People ──
  for (const p of standing) {
    if (!high && p.role !== "guide" && p.role !== "reader") continue;
    const tall = p.role === "sitter" ? 1.2 : 1.7;
    shade.streak(p.x, p.z, tall * Math.hypot(SHADE.x, SHADE.z), 0.62, 0.8, SHADE.x, SHADE.z);
  }
  const shadeTexture = keep(shade.finish());
  shared.shade.value = shadeTexture;
  const people = buildPeople(tier, reduced, shade.field(), keep(personShadeTexture()), materials.people);
  root.add(people.group);

  // ── Far woods: two painted bands behind the real trees ──
  {
    const m = new Mesher();
    const band = (radius: number, height: number, v0: number, v1: number, repeat: number, turn: number) => {
      const n = 64;
      let previous: [number, number] | null = null;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2 + turn,
          x = Math.sin(a) * radius,
          z = 8 + Math.cos(a) * radius,
          y = terrain(x, z) - 1.2;
        const lo = m.vertex(x, y, z, 0, 1, 0, (i / n) * repeat, v0, white),
          hi = m.vertex(x, y + height, z, 0, 1, 0, (i / n) * repeat, v1, white);
        if (previous) m.quad(previous[0], lo, hi, previous[1]);
        previous = [lo, hi];
      }
    };
    band(66, 15, 0.5, 1, 3, 0.4);
    band(60, 11, 0, 0.5, 4, 1.7);
    const ring = add("far woods", m.build(false), new THREE.MeshBasicMaterial({ map: keep(treelineTexture(23)), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false }), -10);
    ring.frustumCulled = false;
  }

  // ── Assemble ──
  const count: Record<string, number> = {};
  const emit = (name: string, m: Mesher, material: THREE.Material, wind = false) => {
    if (!m.triangles) return;
    count[name] = m.triangles;
    return add(name, m.build(wind), material);
  };
  emit("gravel", meshers.gravel, materials.gravel);
  emit("brick", meshers.brick, materials.brick);
  emit("bark", meshers.bark, materials.bark);
  emit("crowns", meshers.near, materials.crowns, true);
  emit("distant crowns", meshers.far, materials.crowns, true);
  emit("garden plants", meshers.plants, materials.plants, true);
  emit("hedges", meshers.hedge, materials.hedge);
  emit("joinery", meshers.plain, materials.plain);
  add("sign", signFace, materials.sign);
  count.people = people.triangles;
  root.userData.triangles = count;

  groundsObstacles.length = 0;
  groundsObstacles.push(...obstaclesFor(tier), ...people.obstacles);

  let time = 0, wind = 1;
  return {
    root,
    setEnvironment(palette) {
      materials.crowns.color.set(palette.foliage);
      materials.plants.color.set(palette.foliage);
      materials.lawn.color.set(palette.grass);
      (dome.material as THREE.MeshBasicMaterial).color.set(palette.sky);
      wind = palette.wind;
    },
    update(dt, camera) {
      if (reduced) return false;
      time += Math.min(dt, 0.1);
      shared.time.value = time * wind;
      people.update(Math.min(dt, 0.1), camera);
      return true;
    },
    dispose() {
      facade.forEach(({mesh,original}) => {mesh.material=original;});
      facadeFinishes.forEach((material) => material.dispose());
      replaced.forEach((o) => (o.visible = true));
      people.dispose();
      root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => mat.dispose());
      });
      textures.forEach((t) => t.dispose());
      root.removeFromParent();
    },
  };
}
