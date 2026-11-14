import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute, formatRoute, type Place } from "../lib/estate/world";
import { portraitRoute } from "../lib/estate/visitor-navigation";
import type { Volume } from "../lib/library/model";
const home = (): Place => "cabinet";
test("the upper landing has a reloadable history destination", () => {
  const route = { place: "entry" as const, focus: null, landing: true as const };
  assert.equal(formatRoute(route), "#landing");
  assert.deepEqual(parseRoute("#landing", home), route);
});
const volume: Volume = { slug: "mission", title: "Mission", summary: "", kind: "Project", shelf: null, position: 1, plate: 0, tags: [], pages: [{ key: "design-7", title: "Architecture", blocks: [] }] };
test("report links keep section and underlying book marker independently", () => {
  const route = { place: "cabinet" as const, focus: { kind: "book" as const, slug: "mission", leaf: "design-7", page: 3 }, report: { section: "overview" } };
  assert.deepEqual(parseRoute(formatRoute(route), home), route);
  const contents = { ...route, focus: { ...route.focus, leaf: "front", page: 3 } };
  assert.deepEqual(parseRoute(formatRoute(contents), home), contents);
  const direct = parseRoute("#report/mission/design-7", home)!;
  assert.equal(direct.report?.section, "design-7");
  assert.equal(formatRoute({ ...direct, report: undefined }), "#book/mission");
  assert.equal(parseRoute("#report/https://evil.test/x", home), null);
});
test("portrait navigation accepts only mounted catalog IDs and actual leaf keys", () => {
  const intent = { intentId: "1", turnId: "2", targetId: "mission", mode: "report" as const, sectionId: "design-7", label: "Mission" };
  assert.equal(portraitRoute(intent, [volume])?.report?.section, "design-7");
  assert.equal(portraitRoute(intent, []), null);
  assert.equal(portraitRoute({ ...intent, targetId: "Mission" }, [volume]), null);
  assert.equal(portraitRoute({ ...intent, sectionId: "invented" }, [volume]), null);
});
