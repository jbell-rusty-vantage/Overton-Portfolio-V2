# Pathway B · the 3D world, Blender assets and interaction

**Coordinator integration, November 13:** report/portrait history and media arbitration, live entrance, authored six-stop tour, shared header, plain fallback, atmosphere controls and the bounded landing route are mounted. Desktop/phone browser journeys passed; see [SESSION_INTEGRATION](SESSION_INTEGRATION.md) for the final command results. The owner retained the portico and 3.19 m ceiling.

Startup now prepares images, textures, shaders, a representative front/back leaf and the actual framebuffer/GPU fence before movement; a 60-second deadline falls back safely. Camera-only walking no longer redraws the fixed sun shadow map. Selected-book leaf textures allocate before flight, landed leaves reuse their exact backing surfaces, and late picture loads refresh only affected printed surfaces. The focused real-book trace reduced the first render CPU stall from 107.1 ms to at most 10.4 ms without lowering paper resolution. The trace has no long tasks or page errors, but development first-turn frame rate is not claimed as constant 60. Final production figures and recording are owned by the coordinator's integration record, not inferred from these focused checks.

**Final production evidence:** desktop walk/document/film **60.0 fps**, speaking **58.6**, six actual Mission Control turns **59.4**, all p95 **16.8 ms**; entry-to-ready **5.81 s**. Emulated phone **59.8–60.0 fps**, ready **5.53 s**. These measured samples approach the desktop target but do not establish a locked 60 fps or physical-device performance. The final isolated production rehearsal passed all release/withdrawal and cross-pathway checks. The actual-office [145.68-second silent recording](travellers-rest-review/continuous-visit-integrated.mp4) passed without page errors and was visually inspected along with report, portrait-source, phone-control and returned-entrance stills. No import or release occurred.

**Worker contract:** GPT-6 Astra, High reasoning. Own this complete pathway and its focused verification. Do not spawn agents, delegate, or create chats; follow the main brief's depth-one, three-worker-total cap. Report completion or a concrete blocker to the coordinator.

**This is pathway B of three.** The main agent's brief is [NEXT_SESSION.md](NEXT_SESSION.md); the others are [project showcases](PATHWAY_SHOWCASES.md) and [the conversational portrait](PATHWAY_PORTRAIT.md). This brief is a complete task for one agent: carry it through and report once at the end. The main brief controls concurrency and shared-file ownership. **November 12 integration override:** B owns the world/route files while working; the main agent applies A's report and C's conversation/navigation/audio integrations afterward. Preserve the existing route and voice contracts or document any required adaptation. C does not edit B's engine or narration assets concurrently.

**Outcome.** A visitor walks a house that matches the record, among Blender-made things that move as real objects, at 60 fps on the owner's desktop: the room corrected to the survey, the moving parts on the Blender kit, baked light, grounds where the record puts them, movement that follows where the visitor stands, and a walk back out to the entrance. The owner is John Overton Bell, a descendant of Judge John Overton, who visited the house when he was young.

**You own:** `components/estate/world/engine/**`, `components/estate/world/Controls.tsx` and `controls.css`, `components/estate/world/{bookHold,shelfCare,bookSound}.ts`, `components/estate/world/World.tsx` and `world.css`, `components/estate/Estate.tsx` and `Entrance.tsx` (the flow between entrance and world), `assets/travellers-rest/**`, `lib/estate/world.ts` and `objects.ts`, the pack, kit, voice, record and profile scripts, `tests/estate.test.ts`, `tests/kit.test.ts`, `tests/browser/{estate,navigation}.spec.ts`.

**You do not touch:** `Reader.tsx`, `paginate.ts`, `sheets.ts`, `bookPrint.ts`, `book.css`, `Inspector.tsx`, anything under `components/library/`, `lib/library/`, `app/projects`, `app/books`, `public/library/artwork/`, or project and book content in the office. Those are pathway A's.

**The seam between the pathways** is small and already exists; keep it stable. The reader asks the engine for a volume (`engine.volume(slug)`), tells it when the DOM page is showing (`engine.setInk`), and drives turns and holds through the engine's book methods; the engine reads print instructions from `sheets.ts` (`paintSheet`) and draws the cover from the image address it is given. If you must change a signature on that seam, keep the old one working and say so in your report. Pathway A adds one place to the route model for the full-screen report and one button to the reader; neither needs anything from the engine except that it stops drawing while the report covers it.

**Do not:** commit, push, deploy, run the importer with `--apply`, release the visit, or restart the office server on port 3078. Finish with the checks at the end of this document passing, and a report of what is implemented, what is tested, what is not done, where the evidence is, and what the owner must decide.

**For Codex.** The repository's `AGENTS.md` and `C:/Users/Pinda/.codex/AGENTS.md` apply. The Next.js in this repository is newer than most training data: read `node_modules/next/dist/docs/` before using a framework API. Everything is uncommitted on `main`; commit only when the owner asks, on a branch, and never with `git add -A` (the working tree holds private files). The private preview is `npm run admin:local` on port 3078 and may already be running. Bash heredocs containing an odd number of apostrophes fail on this machine; write a script file and run it. Blender 5.2.2 is at `C:\Users\Pinda\AppData\Local\Programs\Blender\blender-5.2.2-windows-x64\blender.exe`. Headless Chrome uses the real GPU. To see any state of the world without clicking through it: `node scripts/look-estate.mjs <url> <width> <height> "<json steps>"` (the steps are listed at the top of that file).

## November 12 second implementation pass — supersedes first handoff below

The independent asset/engine pass now closes the remaining room/desk migration and the surveyed exterior details. This is still a hidden draft. The coordinator owns the shared World/route/entrance, report, portrait and media UI, including `scripts/record-estate.mjs`; B no longer edits those files.

- **Authored and integrated:** `room.shell`, `room.joinery` and `desk.study` are reproducible Blender kit roots. Floors, ceiling, flush arched west wall, door/window openings, desk electronics and closed books are authored geometry. Dado skirting and chair rail are single swept stock profiles; casings meet without face overlap. There is no invented room crown. Existing procedural fallbacks remain. Source paint/wood bakes and separate moving parts remain editable. The kit is 676,984 / 480,724 bytes, 62 named objects and 42 meshes; both tiers validate with zero errors/warnings.
- **Visually checked live:** `survey-pass/room-kit-live.png` shows the corrected room. The old painted occlusion was still suggesting a crown and projecting chimney breast; that false shadow was removed. The floor-to-ceiling height remains 3.19 m, and the portico is retained.
- **Exterior:** `kit/ell_assets.py`, called by `apply_survey.py`, replaces the ell with the scaled 17.67 m length, 8.531 m offset rear addition, 4.252 m gallery and 4.003 m return behind the main block. Gallery posts, capitals, rails, balusters, steps, sash openings and chimney stacks follow HABS photos 3/4 as an exterior reconstruction. Collision and foliage exclusion follow the new envelope. Both packed shell tiers validate (337,320 / 290,796 bytes, 15,672 triangles). The continuous Blender assembly was regenerated from these sources.
- **Outbuildings:** the Weaving House now has a stone base, upper openings, off-centre porch and end chimney; the smokehouse has its gable door, deep eaves and small side vent; the reconstructed law office has a centre door between nine-over-nine windows and four porch posts. HABS photo 11 and the held NRHP description support these distinctions. Fine dimensions, locations/orientation and materials remain approximations; interiors and the modern barn are not modelled. Evidence: `gallery.png`, `weaving.png`, `smokehouse.png`, `office.png` in the same review folder. The later fence was moved clear of the law-office footprint.
- **Environment API:** `Engine.getEnvironment()` / `await setEnvironment({ daylight, season, sound })` expose morning/afternoon/dusk and summer/autumn/winter palette studies plus opt-in wind, synthetic birds and distance-based wood/gravel footfalls. These are artistic palettes, not solar calculations or winter defoliation. The afternoon shadow direction remains fixed. `suspendAtmosphere(value)` preserves the sound preference while media plays; report pause and document visibility also silence it. The coordinator mounts and arbitrates the controls.
- **Tour seam:** `controller.cancelTravel()` clears motion, keys, touch/drag/fling and pending arrival while preserving the exact pose and place. It emits a travel-ended event once and no false arrival. The coordinator owns the tour UI and route/history handling.
- **Focused verification:** all six packed-kit contracts and six new `tests/world-environment.test.ts` tests pass. The latter cover preset validation, audio opt-in/suspend/dispose, exact-pose cancellation/no false arrival, new room roots, stair ascent/descent/interruption and manual landing guard collision. Focused lint and TypeScript checks passed before the final documentation update. Visual checks reported no page errors. Earlier development performance numbers below are historical samples, not measurements of the final integrated production visit; the coordinator owns final profiling.

**Light qualification:** the final 4096-pixel, 48-sample CPU bake plus compositor denoise is packed at 3,173,932 bytes with zero validator errors (SHA-256 `7481dba65218cc02b7f7ebb50e8b6dc431504f8d3536c5f42cc778eabefd7a4b`). `room-kit-baked-final.png` was visually inspected: grain is removed, room trim is clean and shelf detail is retained substantially better than the 2048 comparison. The authored afternoon bake is available through `?lighting=baked`; live remains the standard mode, preserving responsive daylight palettes and the existing appearance. This visual check does not claim production performance or eliminate the atlas's fixed lighting/resolution tradeoff.

**Accessible stair and landing:** `engine/stairway.ts` provides a constrained 3D path for the eight straight risers, three winders and five upper risers. The ceiling is opened over the stair. The landing stands at 3.80 m on the 80 mm slab above the retained 3.72 m ceiling. Programmed travel and manual walking ascend/descend the same route; guards bound the 1.08 × 1.02 m reconstructed landing. `Engine.visitLanding(instant)` queues before model readiness; `setRoute` clears obsolete queued intent. `controller.level` / `Watch.level` report `ground|stairs|landing`. Ordinary named destinations route back down, and `cancelTravel()` can stop on a tread without a false arrival or vertical jump. Ground-floor objects and books are excluded from pointer picking and Within reach on stairs/landing; directory destinations can still guide the visitor downstairs.

**Integrated browser evidence:** `upper-landing.png`, `stair-ascent.png` and `landing-checks.json` record ascent, the east guard stopping the eye at x 1.53, descent to the library, audio context running only after a click, media ducking to zero without losing preference, both pre-ready queue cases (honour or clear on a newer route), and cross-floor reach exclusion. These are development fixture checks with no page errors. The coordinator mounts `#landing`, the reconstructed-extent label and return control, and owns final route/history/reload checks.

**Exact evidentiary limit:** HABS TN-14 has a first-floor tracing and photographs, not an upper-floor plan or dimensioned restoration sheets. The landing's clear width and floor slab are bounded model reconstructions adjoining the recorded stair. No upstairs room layout, contents or historical furnishing is invented or accessible. Production frame-time qualification, physical-device/gamepad checks and owner review of historical narration/transcription remain qualification work. Unavailable restoration drawings remain a content gap. The coordinator subsequently verified the NYPL December 31 retained-copy identity and eight-image manifest; see ARCHIVE_VERIFICATION.md. That second image set was not imported. The coordinator owns final shared tour/entrance/report/portrait/landing integration; this B pass does not claim their qualification from an API alone. The final read-only importer plan reports 20 media inserts and two shell pointers; nothing was applied.

## November 12 first handoff — historical snapshot

This is a **partial implementation handoff, not completion of pathway B**. The owner-approved survey and moving-object pass is implemented and locally exercised. The live desktop development fixture averaged 58.6 fps walking; the baked alternative is faster but visibly grainy, and required implementation below is still open. Nothing was published, uploaded, imported with `--apply`, committed or deployed.

**Owner decisions applied:** keep the existing portico and the 3.19 m ceiling above the library floor. The library/ell doors, windows, chest, portrait, hall width, map stop, flush arched hearth and eight-tread/winder stair have moved together with anchors and collision bounds. The original guided source is preserved; `apply_survey.py` writes `Travellers Rest - surveyed.blend`. The upper five-bay façade and shutters are retained. The reconstructed stair is scenery with collision, not an upstairs route.

**Implemented and exercised:** Blender drawers, physical book boards/block/spine, folded letter sheets and bookcases; node-baked wood/paint finishes; larger shelf plaques and an in-scene hovered title; evenly lit turning paper; real transparent library glazing; position-based accessible reach/picking; drawer collision; standard-mapping gamepad input; a south-door walk that dissolves back to the entrance and yields to walking input. Open-book routes are retained in session storage. `Engine.pause()/resume()` preserve pose and held state for the coordinator's report integration; the existing Reader contracts remain compatible.

**Grounds:** the formal garden is east of the gallery, the carriage oval begins about 12 m beyond the south threshold, large magnolias stand off the front corners, and invented foundation planting/front parterres are removed. Three named outbuilding masses occupy the approximate survey positions. Their HABS architectural details remain unfinished. Painted tree shade now projects onto exterior weatherboards without another live light. All figures remain present-day visitors.

**Focused evidence:** `docs/travellers-rest-review/survey-pass/` holds library, façade, stair, drawer and folded-letter screenshots and `measurements.json`. Four browser journeys passed on the existing office: physical reach/pause/resume/walk-out, walking acceleration/collision, routed floor selection, and phone thumb-stick/look. Focused lint passed. The estate+kit contracts passed 13/14 before coordinator inventory integration; the sole failure is the expected missing new Jackson inventory key. Both shell and kit tiers validate with zero glTF errors/warnings. The read-only importer plan completed with four media inserts and two scene-pointer updates, without applying them (run again after the coordinator adds Jackson).

| Development engine fixture, AMD Radeon D3D11 / Chrome | Live | Experimental bake |
| --- | --- | --- |
| Desktop walking, 1366 × 860, DPR 1 | 58.6 fps | 59.5 fps |
| Blank physical leaf turns | 59.5 fps | 60.0 fps |
| Held-book draw calls | 126 | 88 |
| Emulated phone walking, 390 × 844, DPR 2 requested | 60.0 fps | not sampled |

Each is one 12-second sample on the running Next development server with stand-in volumes and blank turns. Median 16.7 ms, p95 16.8 ms in these samples. Phone adaptive canvas ratio ended at 1.25. This is **not** a production-reader, real page-printing, WebGPU or physical-phone qualification; `scripts/profile-survey.mjs` records exact conditions. The final small firebox chase/scan-UV fixes followed this sample and were visually rechecked.

**Baked light:** static export, editable source, 2048 px/32-sample atlas and validated packed delivery exist. `?lighting=baked` is an opt-in comparison; normal visits keep live light. Atlas noise and dark trim seams prevent accepting it as the final appearance. The assembled continuous Blender source was regenerated without rendering; the stock moulding migration and complete overlapping-trim cleanup are not finished.

**Archive seam:** `archive/jackson-letter.json` contains the complete eight-image June 8, 1829 TSLA sequence, original record/manifest, image hashes, rights statement and required credit. Projection is all-or-none through approved media. The coordinator owns adding those 16 full/thumbnail keys to the importer and is checking a page-aligned transcription. This B pass does not claim that transcription is checked. The NYPL second letter and unavailable dimensioned restoration drawings remain separate gaps; no archive requests were sent.

**Remaining work toward the full outcome:** qualify a clean light bake and production 60 fps; migrate stock mouldings/remaining room and desk geometry; finish HABS outbuilding detail and ell/gallery fidelity; build the interruptible guided tour and upstairs; season/time controls and opted-in outdoor sound; a shared entrance/world header, live entrance first frame and destination cards. Physical-gamepad behaviour is implemented but not hardware-tested. The owner still decides whether dragging should end programmed travel (current behaviour keeps travel and takes only the view). Narration and historical wording were preserved; no paid voice regeneration ran.

The remaining geometry migration, clean bake, tour/upstairs, detailed outbuildings, seasonal/sound controls and entrance flow are **implementation still needed, not external blockers**. External qualification gaps are the unavailable dimensioned restoration drawings, owner review of historical narration/transcriptions, and physical-device testing. No external gap justifies treating the internal work as complete. Full typecheck and focused lint passed; the full shared build/test suite, new continuous recording and voice regeneration were not run.

The coordinator applies report and portrait integration after this partial handoff. World/route/engine edits are frozen for that integration. It can use `pause()/resume()` without a new engine focus kind; pause after a direct-linked book settles. Delivery hashes changed, so the isolated rehearsal must intercept the exact new local bytes until an owner-authorized upload occurs. Production CDN delivery remains unqualified. The final glazing shader and façade-name normalization followed the browser window; their packed contract is checked, but they need the coordinator's next visual pass. The continuous assembled Blender source predates the last small firebox refinement; the surveyed shell and dedicated light-bake sources contain the latest geometry.

## Read first

1. [HANDOFF.md](../HANDOFF.md), then [WORLD_ENGINE.md](WORLD_ENGINE.md).
2. [TRAVELLERS_REST_SURVEY.md](TRAVELLERS_REST_SURVEY.md): the ordered table of model corrections.
3. [The Blender kit README](../assets/travellers-rest/kit/README.md) and [the grounds README](../assets/travellers-rest/grounds/README.md).
4. Open the preview and use it for five minutes before changing anything: `http://127.0.0.1:3078/admin/library/preview` (start it with `npm run admin:local` if it is not running).

## Work, in order

### 1. Make the house match the record

The survey confirms the library is the right room on the right side of the hall, at about the right size, with the hearth on the right wall. It also shows where the model is wrong. Apply these together, because they move furniture, anchors, walking bounds and Blender pieces at once.

| Change | Now | Survey | Where |
| --- | --- | --- | --- |
| Door from the library to the ell | x −3.23…−2.05 | x −5.65…−4.65 | `ROOM` and the north wall in `room.ts`; the kit door's placement; the chest must move (it stands in the real doorway) with its anchors `drawer.*` and `camera.drawers` |
| Door from the hall | z 1.13…2.41 | z 0.27…1.18, 0.91 m wide | `ROOM.door`; the hall partition and surround in the shell (rebuild from `estate.py` or move the partition into code); `door.library`, `camera.library`; routes in `navmesh.ts` |
| Windows | centres −6.26, −3.82; 1.06 wide; head 3.02; six-over-six | centres −6.03, −3.55; 0.945 wide; head 3.18; sixteen-over-twelve | `ROOM.windows`, `windowHalf`, `head`; the kit sash unit in `build_kit.py`; the sun patches will move, so check the writing table still catches light |
| Chimney breast | projects 0.29 m | none: the wall is flush, the chimney is outside, the firebox is arched and about 0.3 m lower | west wall and mantel in `room.ts` and the kit mantel; `portrait.judge` moves back to the wall |
| Stair | starts 0.94 m too far south, straight | eight straight treads, then winders turning east | the shell (`estate.py`), stair blockers in `navmesh.ts` |
| Hall width | 3.14 m | 3.40 m (east wall 0.31 m further east) | the shell, the map table, hall stops |
| Ceiling | 3.19 m | about 2.92 m ± 0.15 (low confidence) | `ROOM.ceil`; decide with the owner before changing |

Decisions the owner must make first: whether to keep the portico (built 1954, gone by 2021), and which ceiling height to trust. The grounds should follow the same record: the formal garden belongs east of the house beside the gallery, the front is lawn with a carriage oval starting about 12 m out, and large evergreens stand off both front corners. After the change, repack the shell (`node scripts/pack-estate.mjs --edition 2`), rebuild the kit, run the importer plan, and re-run every check below.

### 2. Put the moving parts on the Blender assets

The kit already contains a book with hinged boards, a letter sheet and sliding drawers, tested for names, transforms and pivots, but the live book, letter and drawers are still built in code. In this order: chest drawers (made in `dress()` in `engine.ts`), then the book's boards, spine and block inside `Volume3D`, then the letter sheet inside `Artifact3D`, then the bookcases, then dado, cornice and casings from the stock mouldings, then the desk objects, then the room shell. Bake wood and paint from shader nodes instead of generating them with NumPy. Fix the code-built trim that renders black in Cycles in the continuous blend (overlapping faces). Then bake light: with the whole room in Blender, a lightmap for the static interior is the largest available gain in both realism and frame rate.

### 3. The physical book and the shelf

The pages inside a book, the full-screen report and the covers belong to [pathway A](PATHWAY_SHOWCASES.md). This pathway owns the book as an object: the boards, spine, flight, hinge, leaf turn and shelf in `engine/volume.ts`, `bookHold.ts`, `shelfCare.ts` and `bookSound.ts`. Next: shelf plaques large enough to read from standing distance; a label for the hovered volume inside the scene; remove the diagonal band of light that crosses the left page while a leaf turns; move the book's boards, spine and block onto the Blender kit pieces (section 2).

### 4. Movement

Done: eased walking and look, mouse look, analog thumb-stick, a circle that slides along walls and furniture, routes that go round furniture and give way to any input, a ground-floor plan, and a walkable lawn and garden. Next: make "Within reach" and the hotspots follow where the visitor actually stands instead of the last named stop; decide with the owner whether a drag should stop programmed travel (today it only takes the view); gamepad; a tour in which the custodian leads and pauses when the visitor takes over; open chest drawers as obstacles; the stair and an upstairs once the stair is rebuilt.

### 5. The grounds

Done: magnolias and other trees, a hedged garden with beds, a gravel drive and oval, fences, a tree line, a sky, wind, and eight present-day people (a guide, a family with a child, visitors). Present-day people only: no enslaved people, no period labourers, no re-enactors. Next: move everything to the positions the record supports (see 1); dappled shade on the weatherboards; the Weaving House, smokehouse and law office from the HABS photographs; real glass in the library windows so the garden is seen from inside; seasons and time of day by palette; birdsong and gravel underfoot, gated by the visitor's sound choice.

### 6. Entrance and world as one flow

Done: the entrance introduces the owner in his own words; **Enter the library** walks in through the door while every other way in arrives directly; the picture the visitor was looking at dissolves into the room; the world's top bar carries the entrance's three destinations; the entrance offers the way back to where the visitor stood; the 3D code and model are warmed while the entrance is read. Next: a walk out by the south door that dissolves back into the entrance; one shared header component for both; the entrance picture as a live first frame of the world; destination cards that show where each leads; remembering an open book across a visit to the entrance.

### 7. Frame rate and renderers

Read the measured table in the review before optimising. Desktop, production build, this pass: 54.2 fps walking in, 53.2 with the portrait speaking, 44.8 through leaf turns, 47.3 with the letter magnified, 57.5 with the film; the median frame is on time and the loss is intermittent long frames. Walking in became slower when the grounds were planted. The emulated phone holds 58 to 60. The renderer now gives up canvas resolution (down to 0.7×) before frame rate, and page text stays sharp because it is DOM. Largest remaining levers: baked light (see 2), fewer live lights, and printing a leaf off the main thread. WebGPU has still not been measured for this workload. A physical phone has still not been measured.

### 8. The archive

Add a letter from Jackson to Overton: 8 June 1829 at the Tennessee State Library and Archives, printed in *The Papers of Andrew Jackson* VII, 270–272 (rights and image URLs in [correspondence.md](../assets/travellers-rest/survey/correspondence.md)); confirm the New York Public Library copy of 31 December 1829 before using it. Follow the letters already held: complete image sequence, checked transcription with marked doubts, source record. The dimensioned restoration drawings (Warterfield 1966, Brush 1969) and the 2018 National Register update are not online; ask the museum or the state archive for them.

### 9. Before anything is released

The owner reviews the custodian's words and voice and the two transcriptions that rest on this project's own reading (1827 and 1812). Release and withdrawal stay in the office under **Travellers Rest**. Run `node --env-file=.env --env-file=.env.local scripts/seed-estate.mjs` whenever delivery files change; `--apply` only on the owner's instruction. Five superseded delivery files from earlier builds remain in the store and database as unused rows.

## Ideas worth the owner's attention

- **The owner's own memories in the house.** A few markers, indoors and out, each with a sentence or two from John about visiting as a child. Needs his words; nothing should be invented.
- **A custodian who can answer.** Questions answered from the collection and the project books only, with sources shown, in the same voice and captions.
- **The custodian leads a tour.** He names a stop, the camera walks there, he speaks, the visitor can break off at any time.
- **More of the portfolio as objects.** A résumé in the cabinet drawer as an inspectable document, a contact card on the desk, a ledger of recent activity, a second screen for live demos. Each needs the owner's content and consent.
- **Light as the day goes.** Morning, afternoon and candlelight, chosen by the visitor or the hour.
- **Sound.** Fire, clock, paper, footsteps on ash boards, birds outdoors, all behind the existing sound choice.
- **A share image and thumbnail** rendered from the world for links to the site.

## Checks

```powershell
npm run typecheck; npm run lint; npm test        # 16 contract tests, including the kit
npm run build:local
npm run test:browser                             # 40 journeys; test:books and test:navigation run a part
npm run test:admin -- --profile-estate           # isolated release rehearsal and measurements
npm run kit:pack; npm run kit:room               # Blender kit pack and room export (see the kit README)
node scripts/pack-estate.mjs --edition 2         # shell tiers and anchors
python scripts/voice-estate.py                   # voice changed cues, verify each was spoken to the end
node scripts/record-estate.mjs                   # continuous walkthrough and close-ups
```
