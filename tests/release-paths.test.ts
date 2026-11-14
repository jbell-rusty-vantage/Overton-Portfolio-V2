import test from "node:test";
import assert from "node:assert/strict";
import { withinPreview, sceneHref } from "../lib/library/paths";
import { isWorldFragment, resolveLegacyArrival } from "../lib/library/paths";
import { sampleCollection } from "../lib/library/fixtures";
import { ResourceOwner } from "../components/estate/world/engine/resources";
import * as THREE from "three";

test("compatibility paths preserve reader types and separate portfolio fragments", () => {
  assert.equal(withinPreview("/projects/gowipe", true), "/admin/preview/projects/gowipe");
  assert.equal(withinPreview("/books/record", true), "/admin/preview/books/record");
  assert.equal(withinPreview("/resume", true), "/resume");
  assert.equal(sceneHref("stacks", null, "gowipe"), "/library#book/gowipe");
  assert.equal(isWorldFragment("#book/gowipe/gallery/3"), true);
  assert.equal(isWorldFragment("#selected-work"), false);
  assert.equal(isWorldFragment("#work-gowipe"), false);
  assert.equal(isWorldFragment("#book/../../admin"), false);
});

test("retired destinations translate only authorized unambiguous volumes and preserve current fragments", () => {
  const volumes = sampleCollection().volumes;
  const book = volumes[0];
  const resolve = (query: string, hash = "", placed = [book.slug], admin = false) => resolveLegacyArrival(new URLSearchParams(query), hash, volumes, placed, admin);
  for (const [zone, expected] of Object.entries({ entrance: '/library', stacks: '/library#cabinet', periodicals: '/blog', 'favorites-wing': '/favorites', 'evolution-hall': '/evolution', 'reading-room': '/catalog', 'computer-station': '/library#screen/main', unknown: '/library' })) assert.equal(resolve('view=world&zone=' + zone), expected);
  assert.equal(resolve('book=' + book.slug + '&page=overview'), '/library#book/' + book.slug + '/overview');
  assert.equal(resolve('book=' + book.slug + '&page=missing'), '/library#book/' + book.slug);
  assert.equal(resolve('book=' + book.slug, '', []), '/projects/' + book.slug);
  assert.equal(resolve('book=hidden-private-sentinel'), '/library');
  assert.equal(resolve('book=%2F%2Fevil.invalid'), '/library');
  assert.equal(resolve('book=' + book.slug + '&kind=Favorite'), '/library');
  assert.equal(resolve('zone=stacks', '#report/' + book.slug + '/overview/front/3'), '/library#report/' + book.slug + '/overview/front/3');
  assert.equal(resolve('zone=stacks', '', [book.slug], true), '/admin/preview/library#cabinet');
  assert.equal(resolve('zone=periodicals', '', [], true), '/admin/preview/library?catalog=1');
  assert.equal(resolveLegacyArrival(new URLSearchParams('book=' + book.slug), '', [book, { ...book }], [book.slug]), '/library');
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
