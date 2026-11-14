# The continuous library · engine reference

Read this before changing the 3D world. It says where each part lives, the conventions every part relies on, and how to see and measure a change. Current status and owner decisions are in [HANDOFF.md](../HANDOFF.md); what was built and measured is in [the continuous library review](TRAVELLERS_REST_CONTINUOUS.md).

## What it is

**Enter the library** mounts one WebGL canvas (`three` 0.187, no React Three Fiber in this part) that stays up through travel, reading, close inspection and playback. React owns the address, the overlays and the readable DOM; the engine owns everything drawn. The location hash is the single description of where the visitor stands and what they hold.

| Concern | File |
| --- | --- |
| Places, routes, hash ⇄ state, cue and object types | [lib/estate/world.ts](../lib/estate/world.ts) |
| Shell: one canvas, overlays, navigation, custodian card, directory | [components/estate/world/World.tsx](../components/estate/world/World.tsx), [world.css](../components/estate/world/world.css) |
| Engine: renderer, lights, loading, picking, route → scene, frame loop | [engine/engine.ts](../components/estate/world/engine/engine.ts) |
| Camera: named stops, eased walking and look, mouse look, travel that yields to input | [engine/controller.ts](../components/estate/world/engine/controller.ts) |
| Where a visitor can stand: collision circles and boxes, grid routes round furniture | [engine/navmesh.ts](../components/estate/world/engine/navmesh.ts) |
| Thumb-stick, ground-floor plan, movement help | [Controls.tsx](../components/estate/world/Controls.tsx), [controls.css](../components/estate/world/controls.css) |
| Library interior built in code: joinery, furniture, finishes, painted occlusion | [engine/room.ts](../components/estate/world/engine/room.ts), [engine/kit.ts](../components/estate/world/engine/kit.ts) |
| Blender-authored furniture kit: loader, and the Blender sources and packer | [engine/props.ts](../components/estate/world/engine/props.ts), [kit README](../assets/travellers-rest/kit/README.md), [scripts/pack-kit.mjs](../scripts/pack-kit.mjs) |
| Outdoors: trees, garden, people, sky, and the walking contract for the lawn | [engine/grounds.ts](../components/estate/world/engine/grounds.ts) and `engine/grounds/` ([what is documented and what is invented](../assets/travellers-rest/grounds/README.md)) |
| What the survey record says, against the model | [TRAVELLERS_REST_SURVEY.md](TRAVELLERS_REST_SURVEY.md), [survey.json](../assets/travellers-rest/survey/survey.json) |
| A physical volume: slot → hand → open → leaf turn → back | [engine/volume.ts](../components/estate/world/engine/volume.ts) |
| DOM pages registered to the paper, pagination, page typography | [Reader.tsx](../components/estate/world/Reader.tsx), [paginate.ts](../components/estate/world/paginate.ts), [sheets.ts](../components/estate/world/sheets.ts), [book.css](../components/estate/world/book.css) |
| Printing the DOM page onto the turning leaf; dragging a leaf or the whole book; shelf behaviour; optional paper sounds | [bookPrint.ts](../components/estate/world/bookPrint.ts), [bookHold.ts](../components/estate/world/bookHold.ts), [shelfCare.ts](../components/estate/world/shelfCare.ts), [bookSound.ts](../components/estate/world/bookSound.ts) |
| Documents and records that can be lifted | [engine/artifact.ts](../components/estate/world/engine/artifact.ts), [Inspector.tsx](../components/estate/world/Inspector.tsx), [lib/estate/objects.ts](../lib/estate/objects.ts) |
| The portrait rig and the voice clock | [engine/portrait.ts](../components/estate/world/engine/portrait.ts), [voice.ts](../components/estate/world/voice.ts) |
| Server projection, program schema, importer | [lib/estate/catalog.ts](../lib/estate/catalog.ts), [lib/estate/program.ts](../lib/estate/program.ts), [scripts/seed-estate.mjs](../scripts/seed-estate.mjs) |

## Conventions

- **Units and axes.** Metres, Y up, **south is +Z**, west is −X. The house is 15.85 m wide (x −7.9…7.9) and 6.2 m deep (z −3.1…3.1). Interior floor is y = 0.53, ground outside is y = 0, the porch and steps are at z 3.1…5.3. The south door is at x = 0, z ≈ 3.1.
- **The library** is the west third: x −7.76…−1.605, z −3.0…2.86, ceiling 3.72 (3.19 m above the floor, retained by the owner). `ROOM` in `room.ts` holds every dimension; the flush, segmental-arched hearth is on the west wall at z = 0, sixteen-over-twelve sash windows centre at x −6.03 and −3.55, and the hall door spans z 0.27…1.18. The ell door spans x −5.65…−4.65; the chest has moved east to x −2.95. The existing portico stays by the owner's decision.
- **Anchors.** [anchors-v2.json](../assets/travellers-rest/anchors-v2.json) holds camera stops and resting places. `node scripts/pack-estate.mjs --edition 2` writes them into both shell tiers; `validateEstate(bytes, 2)` and `npm test` check them. The shell GLB is the exterior and the hall only.
- **One number per moving thing.** A volume or document has `progress` from resting (0) to held (1) and a `target`. Every pose is a pure function of `progress`, so a recall in mid-air runs back along the same path. Keep new motion in this form.
- **Readable text is DOM.** The open book's two pages are real elements; `Engine.placePages()` gives each a projective `matrix3d` matching its sheet of paper. While the DOM is visible the paper shows a blank texture; for a turning leaf the page is painted onto the paper by `paintSheet` from the same `Sheet` model. Pagination measures a hidden copy of the page with the same stylesheet.
- **Blender pieces replace code-built ones by name.** `loadKit` returns the kit's named nodes; `buildLibrary(tier, kit)` uses a kit piece where one exists and the code-built piece otherwise (`?kit=off` forces the code-built room). Names, transforms and pivots are checked by `tests/kit.test.ts`. Never rewrite an `InstancedMesh` buffer every frame: it stalls the frame by milliseconds.
- **Draw calls and light.** The room draws about 200 calls at rest. Static pieces go through `Batch` (merged by material). A shelved book is one proxy block. Lights are fixed (hemisphere, one shadowed sun, fill, bounce, fire, hall, one shadowed reading light): do not add lights; paint glow with sprites instead. Sun and reading shadows redraw only while something moves (`stir` in the frame loop). The renderer drops pixel ratio before frame rate.
- **Deterministic.** Surfaces are generated with seeded noise in `kit.ts`. Nothing random at runtime may change layout.
- **Fallbacks.** Reduced motion: no flights, still portrait, full cue text. No WebGL or no model: `onPlain(true)` shows the plain pages. Sound is off until the visitor chooses it.

## Engine surface used by React

`new Engine({ canvas, tier, reduced, scene, portrait, volumes, companion, objects, metrics, events })`, then `setRoute(route, instant)`, `setLayout(single, insets)`, `attachPages(left, right)`, `setSpread / turn / setInk` for a volume, `setView / highlight` for a document, `speak / attend` for the portrait, `setScreen`, `focusTarget`, `rememberPose`, `skipTravel`, `stats`, `dispose`. Events: `ready, progress, failed, select, hover, arrive, travel, settled, scan`. In a draft review the engine is on `window.estateEngine`.

`pause()` cancels the frame loop, clears walking inputs and releases pointer lock without changing the camera, book progress, selected leaf or route. `resume()` resets the elapsed-time clock and restarts drawing. Both are idempotent. The report coordinator should pause after a directly linked book has settled and resume when the report closes; audio remains the coordinator's responsibility. Reader/volume, `setInk`, turn/hold and `paintSheet` contracts are unchanged.

`reachable()` returns the same distance- and room-filtered targets used for pointer picking. React subscribes through `controller.watch()` and only replaces its accessible list when the target keys change. Open chest drawers update collision bounds at centimetre increments. Gamepads use the standard mapping (left stick walk/strafe, right stick look); keyboard/text entry and held objects suppress that input. Drag still takes the view while a programmed walk continues, pending the owner's preference.

The Blender kit now supplies sliding chest drawers, moving volume boards/block/spine, folded letter sheets and both bookcases, as well as furniture. Procedural fallbacks remain. The shell source is preserved as `Travellers Rest - guided.blend`; `apply_survey.py` writes a separate surveyed source and `world-survey.glb` for edition-two packing. `?lighting=baked` selects the experimental static interior atlas, with live-light fallback on loading failure; default lighting remains live until the comparison is qualified.

## Seeing and measuring a change

- The private office preview is normally running: `http://127.0.0.1:3078/admin/library/preview#library` (all fourteen projects, database content). Routes: `#library #portrait #desk #cabinet #reports #drawers #entry #map #walk`, `#book/<slug>/<leaf>/<page>`, `#object/<id>/<scan>`, `#screen/<main|side|film>`.
- `http://127.0.0.1:3078/dev/world-lab#cabinet` mounts the engine alone with stand-in volumes (no database). Add `?instant` to skip flights; `window.engine` is the engine.
- Scripted look: `node scripts/look-estate.mjs <url> <width> <height> "<json steps>"`. Steps are `["ready"]`, `["wait", ms]`, `["click", selector]`, `["key", name]`, `["eval", js]`, `["shot", file.png]`, `["goto", url]`, `["text", selector]`. Width below 700 emulates a phone with touch. Headless Chrome uses the real GPU on this machine. Keep the JSON in a file and pass `"$(cat file)"`.
- Frame time: sample `requestAnimationFrame` intervals in an `eval` step, or run `npm run test:admin -- --profile-estate` after `npm run build:local` for the recorded measurement.
- Checks: `npx tsc --noEmit`, `npx eslint <files>`, `npm test`, `npm run test:browser` (starts its own review server on port 3077; run it from one place at a time).

## Rules that bite

- Read `AGENTS.md`. This is a newer Next.js than most documentation describes; check `node_modules/next/dist/docs/` before using a framework API.
- Lint enforces the React Compiler rules: no `setState` in an effect body, no reading or writing a ref during render, no assigning to properties of state objects (call a method instead), no local helper named `use`.
- In the Bash tool, a heredoc whose body has an odd number of apostrophes fails. Write scripts to a file and run them.
- Blender 5.2.2 is at `C:\Users\Pinda\AppData\Local\Programs\Blender\blender-5.2.2-windows-x64\blender.exe` and runs headless with `-b -P script.py`.
- Do not publish, deploy, apply the importer or write to the portfolio database without the owner's instruction. Do not send the owner's personal details to outside services.


## Second survey pass interfaces

The kit supplies `room.shell`, `room.joinery` and `desk.study` in addition to moving props and furniture. `room.ts` skips its counterparts only when the complete required kit set exists; the original code fallback remains. Stock-profile sweeps replace overlapping trim boxes, and painted contact shading follows the flush wall and actual ceiling junction. The continuous Blender assembly appends these authored roots and the revised ell/gallery shell.

`controller.cancelTravel()` stops at the current pose, resets all motion/input and pending arrival, leaves `place`/route untouched and does not emit `onArrive`. `onTravel(false)` fires once if a journey was active. This is the tour Stop/interruption seam, separate from `pause()/resume()`, which preserve ongoing travel progress.

`getEnvironment()` returns `{daylight, season, sound}`. `await setEnvironment(partial)` applies validated values and returns the actual state; enabling sound must be called from the visitor gesture. Daylight values are `morning|afternoon|dusk`, seasons `summer|autumn|winter`. Defaults preserve the existing live appearance (`afternoon`, `summer`, sound off). These are palette studies with fixed afternoon shadow geometry, not astronomical daylight or true seasonal defoliation. The baked-light comparison also retains its authored afternoon illumination.

`suspendAtmosphere(true)` temporarily ducks ambient sound without changing the user's sound preference. Release it when narration/conversation/video ends. It combines with report pause and document-hidden state, so releasing one cause cannot unmute another. Audio consists of generated wind, quiet synthetic chirps and distance-triggered footsteps; there are no fetched recordings or paid requests. `dispose()` closes the audio context. Unit evidence is in `tests/world-environment.test.ts`.


`visitLanding(instant=false)` visits only the reconstructed upper landing via the measured stair. It queues before the model is ready; any newer `setRoute` clears the queue. The route owner applies the entry physical route, then calls this method for `#landing`. `controller.level` and `Watch.level` report `ground|stairs|landing`. From upstairs, ordinary `go(place)` descends before following ground-floor routing. Manual input yields from programmed travel and remains constrained to the same stair corridor and landing guards. The upper-floor plan is not in the held HABS record, so no rooms beyond the landing are open. Its 3.80 m floor is the slab top above the retained 3.72 m ceiling. Ground-floor collections are excluded from picking/reachable lists while above ground; directory navigation remains available.

The final clean atlas is 4096 px, 48 CPU samples and compositor denoise, packed at 3,173,932 bytes with no glTF errors. `room-kit-baked-final.png` records its visual review. Live remains default because palette controls require responsive lighting; the static afternoon comparison remains explicit. No final production frame-rate claim is made by this asset check.
