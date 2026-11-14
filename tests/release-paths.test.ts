import test from "node:test";
import assert from "node:assert/strict";
import { withinPreview, sceneHref } from "../lib/library/model";
import { isWorldFragment } from "../lib/library/paths";
import { ResourceOwner } from "../components/estate/world/engine/resources";
import * as THREE from "three";

test("compatibility paths preserve reader types and separate portfolio fragments", () => {
  assert.equal(withinPreview("/projects/gowipe", true), "/admin/preview/projects/gowipe");
  assert.equal(withinPreview("/books/record", true), "/admin/preview/books/record");
  assert.equal(withinPreview("/resume", true), "/resume");
  assert.match(sceneHref("stacks", null, "gowipe"), /^\/library\?view=world/);
  assert.equal(isWorldFragment("#book/gowipe/gallery/3"), true);
  assert.equal(isWorldFragment("#selected-work"), false);
  assert.equal(isWorldFragment("#work-gowipe"), false);
  assert.equal(isWorldFragment("#book/../../admin"), false);
});

test("engine resource ownership disposes shared and late graph resources once", () => {
  const owner = new ResourceOwner(), texture = new THREE.Texture(), material = new THREE.MeshBasicMaterial({ map: texture }), geometry = new THREE.BoxGeometry();
  const root = new THREE.Group(); root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
  let textures = 0, materials = 0, geometries = 0;
  texture.addEventListener("dispose", () => textures++); material.addEventListener("dispose", () => materials++); geometry.addEventListener("dispose", () => geometries++);
  owner.tree(root); geometry.dispose(); owner.dispose(); owner.dispose();
  assert.deepEqual([textures, materials, geometries], [1, 1, 1]);
  const late = new THREE.Texture(); let cleaned = 0; late.addEventListener("dispose", () => cleaned++);
  owner.own(late); owner.own(late); assert.equal(cleaned, 1);
});
