# Travellers Rest · the continuous library

**Where this stands, November 12, 2026 (after the second pass).** The owner asked for one continuous 3D world behind **Enter the library**, and then for a second pass on the books, movement, the grounds, the Blender assets, the survey record and the way the entrance leads into the world. All of that is implemented in the private draft: the entrance introduces John Overton Bell and his ancestor's house, a visitor walks up a planted lawn past present-day museum visitors, Judge Overton speaks from his frame, every project volume opens into re-typeset pages that turn when clicked and go back to the shelf when carried there, and the letters are lifted and read in the room. It is exercised by 40 browser journeys, imported to the portfolio database as a hidden draft, and rehearsed through release and withdrawal on disposable data. It is not published or deployed. Still open: the owner found the book pages not yet good enough, the room has not yet been corrected to the survey record, the Blender book, letter and drawers do not yet drive the moving parts, desktop frame rate is below its 60 fps target, and no physical phone has been measured. [What the next session does](NEXT_SESSION.md)

[Open the private preview](http://127.0.0.1:3078/admin/library/preview) · [Go straight to the project shelves](http://127.0.0.1:3078/admin/library/preview#cabinet) · [Watch the continuous walkthrough](travellers-rest-review/continuous-visit.mp4) · [Engine reference](WORLD_ENGINE.md) · [Survey comparison](TRAVELLERS_REST_SURVEY.md) · [First-pass instructions](TRAVELLERS_REST_IMMERSIVE.md)

![The south front as a visitor walks up: hedged beds, the portico, a museum guide](travellers-rest-review/world-grounds.png)

## What the second pass changed

| Asked for | What exists now | Proof | Still open |
| --- | --- | --- | --- |
| Book pages without blanks, cut-offs or badly rendered pictures | Every page of all fourteen volumes re-typeset, **but the owner's review afterwards found the pages still not good enough**: writing that stops part-way down a page, screenshots cropped through their content, diagrams and shading that read as a smudge, and film previews showing a spinner or covered by controls. The audit does not measure those. Fixed since: words on a turning leaf print darker, films wait as a clean preview with a play mark, and the 3D book shows the whole poster as its front board. The cut screenshots are in the source captures and are content to replace ([poster and curation brief](PROJECT_POSTERS.md)). Audit of 288 pages across desktop and phone layouts: blank pages 8 → 0, near-blank 37 → 2, letterboxed pictures 31 → 0, distorted pictures 61 → 0, text running off the page 1 → 0, phone toolbar covering text 151 → 0. | [Desktop pages](travellers-rest-review/books/pages-desktop.jpg) · [Phone pages](travellers-rest-review/books/pages-phone.jpg) · [Audit data](travellers-rest-review/books/audit-desktop.json) | The audit still flags 83 pages where a picture sits about 14 px wider than the text column, and 161 headings whose line box is a pixel short; neither is visibly cut in the contact sheets. The 2 near-blank pages are short closing sections. |
| Click a page to turn it; click and drag to put the book back | Click or tap either page to turn. Drag the outer margin to turn a leaf by hand. Drag the head or foot margin, or fling the book, to carry it back to its slot. The shelf tips a volume out on hover, leaves an "OUT" slip in the gap and keeps a ribbon at the visitor's place. | `npm run test:books` (7 journeys) · [Open volume](travellers-rest-review/world-book.png) | Shelf plaques are not readable at standing distance; no label for the hovered volume inside the scene; spines carry no titles. |
| Smoother, more granular movement | Eased walking at 1.9 m/s (Shift faster, C slower), smoothed look, mouse look, wheel steps, an analog thumb-stick, collision that slides along walls and furniture, routes that go round furniture and yield to any input, a click-to-walk ring and a ground-floor plan. | `npm run test:navigation` (8 journeys) | **Within reach** follows the last named stop, not where the visitor stands. The stair and upstairs are closed. |
| Trees, garden, people and flora outside | Magnolias and a tree line, a hedged garden with beds, a gravel drive and carriage oval, fences, sky and wind, and eight present-day figures: a museum guide, a family with a child, and visitors. No enslaved people, period labourers or re-enactors are depicted. | [Guide at the door](travellers-rest-review/grounds/guide.jpg) · [Family on the path](travellers-rest-review/grounds/family.jpg) · [From above](travellers-rest-review/grounds/high.jpg) · [East side](travellers-rest-review/grounds/east.jpg) | Positions are invented: the survey puts the formal garden east of the house, not in front. The grounds are not visible through the library windows. |
| Build up the Blender assets | A Blender kit of 57 named pieces with a build script, a packer and contract tests. Live in the room: the chair, writing table, candlesticks, inkwell, mantel, andirons and logs, sash windows, six-panel door and chest carcass. `?kit=off` shows the code-built room for comparison. | [Kit contact sheet](travellers-rest-review/kit/kit-contact-sheet.jpg) · [Hearth](travellers-rest-review/kit/kit-hearth.jpg) · [Kit notes](../assets/travellers-rest/kit/README.md) | The kit's book, letter sheet and sliding drawers are built and tested but the moving parts are still code-built. Bookcases and mouldings are not yet from Blender. |
| Precise architectural schematics | The HABS TN-14 record retrieved and compared with the model. It holds no measured drawings: the plan and elevation are scaled tracings, good to about ±0.10 m. The library is the right room, side and size (6.05 × 5.80 m against 6.155 × 5.86). | [Survey comparison](TRAVELLERS_REST_SURVEY.md) · [Survey data](../assets/travellers-rest/survey/survey.json) | **None of the corrections is applied.** Both doors, the stair, the window sizes and the chimney breast are wrong in the model; see the table in the next-session instructions. |
| The owner's introduction on the root page | The entrance says, in the first person, that this was his ancestor's house, that his middle name was chosen after Judge Overton and that he visited as a child. Titles, the brand line and page metadata use "John Overton Bell". The custodian calls him his descendant. | [Introduction](travellers-rest-review/world-introduction.png) · [Entrance](travellers-rest-review/world-entrance.png) | The wording is drafted from the owner's message and is his to edit. |
| Entrance and world as one flow | **Enter the library** walks in through the door; every other way in arrives directly. The entrance picture dissolves into the room. The world's top bar carries the entrance's three destinations. The entrance offers **Return to where I was**. The 3D code and model are warmed while the entrance is read. | [Doorway view](travellers-rest-review/world-library.png) | No walk back out; the two headers are separate components. |

## One visit, start to finish

| Step | What happens | Close-up |
| --- | --- | --- |
| Enter | **Enter the library** starts on the lawn and walks through the portico, the hall and the library doorway in one take. **Skip travel** arrives at once. Any key, drag or stick movement takes over from the walk. | [Lawn and portico](travellers-rest-review/world-grounds.png) · [Doorway view](travellers-rest-review/world-library.png) |
| The custodian | The portrait notices a first arrival and offers to speak. Sound starts only when the visitor chooses **Hear his welcome**; **Read his welcome in silence** runs the same performance on a silent clock. Mouth, gaze and captions follow the audio's playback time. His choices use the same navigation as the room, and an unanswered invitation closes when the visitor picks something up. | [Speaking in the frame](travellers-rest-review/world-custodian.png) |
| The family cabinet | All fourteen project volumes stand under their four shelf names. Hover, keyboard focus or touch tips a binding out and names it. | [Shelves and work screen](travellers-rest-review/world-cabinet.png) |
| Reading | A selected volume pulls clear and opens. Pages are real text, links, images and video on the paper. Click a page or use the arrows to turn; the place is kept in the address and on the device. **Return to the shelf**, Escape, Back, or carrying the book by its head or foot margin puts it back in its own slot. | [Open volume](travellers-rest-review/world-book.png) · [Leaf turning](travellers-rest-review/world-page-turn.png) · [Gallery pages](travellers-rest-review/world-reading.png) |
| The 1832 letter | On the writing table. It lifts, the full scan loads, and the panel gives all four images, magnification, the checked transcription and the archival record. Selecting a transcribed line marks it on the manuscript. | [Line marked on the manuscript](travellers-rest-review/world-letter.png) · [Second scan](travellers-rest-review/world-letter-scan-2.png) · [Writing table](travellers-rest-review/world-desk.png) |
| Other objects | Three more Overton letters in the correspondence drawer, the 1828 invitation in the campaign drawer, the 1795 map on the hall table, Earl’s Jackson in the hall, both pages of *Murfree v. Leeper* in the open casebook, the Tennessee Reports on the law shelf, and three museum records as source-linked cards. | |
| The work screen | The Mission Control reel, its case study and the Royal Palm film play on the screen inside the cabinet, with captions, seek and a link to the browser’s own player. Starting a film pauses the custodian. | [Film on the cabinet screen](travellers-rest-review/world-screen.png) |

Everything that can be picked up with the pointer is also a button under **Within reach** and in the **Directory**, which is how keyboard and screen-reader visitors use the room. **Plain page view** in the Directory, and the automatic fallback when 3D cannot start, lead to the earlier pages with the same rooms, books and records.

## What is evidence and what is interpretation

- **The likeness** is the Tennessee Virtual Archive photograph of Earl’s 1817 portrait at every pose. A mesh registered to the sitter’s eyes, brow, mouth and shoulders moves the photograph by millimetres; nothing is repainted. The only added surface is the dark interior between the lips. [Photographic record](https://teva.contentdm.oclc.org/digital/collection/p15138coll33/id/285/)
- **The voice and words** are new. Thirty-four cues were written for this visit and spoken by a synthetic voice (`gpt-4o-mini-tts`, voice `onyx`); the custodian panel says so. One cue quotes the 1832 letter and names its source. Two cues were re-voiced in the second pass so the custodian says "descendant". [Authored cues](../content/travellers-rest/narration.json) · [Voice pipeline](../scripts/voice-estate.py)
- **The letters** are Library of Congress scans from the Andrew Jackson Papers, held complete. The 1832 and 1831 texts were checked against *The Papers of Andrew Jackson*; the 1827 and 1812 readings are this project’s own and are marked with their confidence. Uncertain words stay in brackets. [Sequence, transcriptions and checks](../assets/travellers-rest/archive/letters.json) · [Curatorial notes](../assets/travellers-rest/archive/README.md)
- **The room** is the right room at about the right size, and the survey comparison now lists where it departs from the record. Until those corrections are made, door positions, the stair, the window sashes and the chimney breast are interpretation that the record contradicts. Joinery profiles, furniture, the family cabinet, the chest, light and colour are interpretation. [Survey comparison](TRAVELLERS_REST_SURVEY.md)
- **The grounds** are interpretation throughout. Plant and path positions were invented before the survey comparison was finished and do not yet follow it. The people are present-day museum visitors and staff. [Grounds notes](../assets/travellers-rest/grounds/README.md)
- **The owner's relationship to the house** is stated as he gave it: a descendant of Judge Overton, his middle name chosen after him, a visitor to the house when young. No genealogy was researched or added.

## Measured delivery

Chrome 157.0.8103.52 ran the optimized production build against disposable PostgreSQL-compatible storage, loading the house shell, voice, scans and film from the verified public Blob objects. Each row is a fresh browser context on this workstation’s GPU (ANGLE (AMD, AMD Radeon (TM) Graphics (0x000015E7) Direct3D11 vs_5_0 ps_5_0, D3D11)). Desktop is 1366 × 860 at 1×. The phone row is **emulation** at 390 × 844 with touch and 2× device scale on the same GPU; no physical phone was measured.

| Device, backend and model tier | Entrance transfer | Total at the library | Total at an open book | Shell GLB transfer | Walking in | Portrait speaking | Leaf turns | Letter held, magnified | Film on the cabinet screen |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| Desktop · WebGL 2 · detailed tier | 1,298,601 B | 2,833,227 B | 3,340,035 B | 493,567 B | 54.2 fps · p95 33.3 ms | 53.2 fps · p95 33.3 ms | 44.8 fps · p95 49.8 ms | 47.3 fps · p95 33.4 ms | 57.5 fps · p95 16.8 ms |
| Emulated phone · WebGL 2 · compact tier | 845,123 B | 2,209,187 B | 2,715,955 B | 323,179 B | 58.6 fps · p95 16.8 ms | 60 fps · p95 16.8 ms | 59.2 fps · p95 16.9 ms | 58.4 fps · p95 16.8 ms | 60 fps · p95 16.8 ms |

On the desktop these are below the 60 fps target: walking in at 54.2 fps, the portrait speaking at 53.2 fps, leaf turns at 44.8 fps, the letter magnified at 47.3 fps, the film at 57.5 fps. The median frame is on time in every state; the shortfall is intermittent long frames. The emulated phone meets its 30 fps target in every state. Compared with the first pass, walking in now crosses the planted grounds and is slower on the desktop for it; the first-pass desktop figures were 59.2, 51.8, 46.2, 51.3 and 55.8 fps in the same column order.

Frame intervals are sampled between display ticks that contained WebGL draws. Leaf-turn samples start in the same event-loop turn as the click, so they include printing the leaf and the page change. [Raw measurements](travellers-rest-review/performance-v2.json) · [Measurement code](../scripts/profile-estate.mjs)

**WebGL 2 is the default and the only renderer for the continuous world.** WebGPU was not measured for this workload. Shadows are redrawn only while something moves, and the renderer now gives up canvas resolution (down to 0.7×) before frame rate; page text stays sharp because it is drawn by the browser, not the canvas.

The continuous shell is 319,060 bytes (14,876 triangles) with a 272,540-byte compact tier, each with 24 validated anchors and zero validator errors or warnings. The Blender kit is 574,236 bytes with a 404,276-byte compact tier. The first edition’s two models are unchanged and remain the versioned baseline. [Model validation](../assets/travellers-rest/delivery.json) · [Anchor contract](../assets/travellers-rest/anchors-v2.json) · [Kit manifest](../assets/travellers-rest/kit/manifest.json)

## Draft seed and publication list

The guarded importer has run in both passes. The database now holds **79 current delivery files for the continuous edition** (11,342,848 bytes: 40 scans, 34 voice tracks, 4 models and the timeline), and all 111 objects of both editions were verified by SHA-256. The second pass added seven rows (two rebuilt shell tiers, the timeline, two re-voiced cues and the two kit tiers) and pointed the two stored scene versions at the rebuilt shell, each with an audit record. A following read-only plan is empty. Database readback found 0 checksum mismatches. [Database readback](travellers-rest-review/seed-diff-v2.json) · [Blob URLs, hashes and credits](../content/travellers-rest/blob-manifest.json)

Two things to know. The house program has 4 revisions and 3 edition audit records: revision 3 is a redundant copy from a verification retry in the first pass (cause fixed, record left), and revision 4 records the second pass. And 5 superseded delivery files from earlier builds remain in the store and as unused database rows; nothing refers to them, and removing them is the owner's call.

| Item | State now | What makes it visitor-visible |
| --- | --- | --- |
| Site code | Local only, uncommitted. Typecheck, lint, contract tests, browser journeys and the migration-free production build pass. | Deploy through the portfolio’s existing workflow. |
| House program, edition 2 | Hidden draft. Four rooms hidden, both scene versions of edition 2 inactive, edition 1 versions untouched and inactive. | Office → Library → **Travellers Rest** → **Published guided visit**. The action validates both edition 2 shells against the anchor contract and activates them with the rooms and the house book. **Hidden draft** withdraws it. |
| Project volumes | All 14 project and book pairs hidden. | Publish each project and its book. A hidden or withdrawn project leaves the cabinet; a link to it arrives at the cabinet with a notice. |
| Voice, scans, shell, kit | Uploaded under immutable `travellers-rest/v2/` names. | Reachable by direct URL; the visit itself follows the settings above. |

## Verified on the merged second-pass code

| Check | Result |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Pass. Lint reports only the existing unused binding in the older content builder. |
| `npm test` | 16 of 16: model contracts for both editions, route round-trips, program parsing, object provenance, caption and mouth timing for every cue, and the Blender kit's names, transforms and pivots. |
| `npm run build:local` | Pass. |
| `npm run test:browser` | 40 of 40 on the loopback review: the continuous visit on desktop and an emulated phone, the book handling journeys, the movement journeys, and the earlier guided and hall journeys. |
| `npm run test:admin -- --profile-estate` | Pass. Isolated database and production server: in-place upgrade to edition 2, release with scene validation, publication window, reading from the physical house book, project visibility on the shelves, withdrawn-volume link, withdrawal, unchanged global screens, then the measurements above. |

## Known limits and the next decisions

- **The room does not yet match the record.** The corrections are listed and ordered but not made.
- **Frame rate.** Read the table; the desktop shortfall is real on this integrated GPU. Baked light, fewer live lights and printing a leaf off the main thread are the candidates.
- **No physical phone.** Emulation only.
- **Blender moving parts.** Built and tested in the kit, not yet driving the book, the letter or the drawers.
- **Grounds positions** are invented and contradict the survey in placing the garden in front.
- **Jackson’s side of the correspondence.** Two candidate letters are identified (8 June 1829, Tennessee State Library and Archives; 31 December 1829, New York Public Library); neither was downloaded or added.
- **Placements** scoped to this house can be stored in the program but have no office form.
- **Owner decisions:** keep or remove the 1954 portico; which ceiling height to trust; approve the introduction, the custodian’s words and voice and the 1827 and 1812 readings; whether to remove the superseded delivery files; when to release.

## Reopen and reproduce

```powershell
npm run admin:local                      # private preview on port 3078
npm run typecheck; npm run lint; npm test
npm run build:local
npm run test:browser                     # test:books and test:navigation run a part
npm run test:admin -- --profile-estate   # isolated release rehearsal and measurements
npm run estate:look                      # scripted screenshots of any stop
npm run kit:pack; npm run kit:room       # Blender kit pack and room export
node scripts/pack-estate.mjs --edition 2 # shell tiers and anchors
python scripts/voice-estate.py           # voice any changed cue, verify, rewrite timeline
node --env-file=.env --env-file=.env.local scripts/seed-estate.mjs   # read-only plan
node scripts/record-estate.mjs           # continuous walkthrough and close-ups
```

[World shell](../components/estate/world/World.tsx) · [Engine](../components/estate/world/engine/engine.ts) · [Movement](../components/estate/world/engine/controller.ts) · [Room](../components/estate/world/engine/room.ts) · [Grounds](../components/estate/world/engine/grounds.ts) · [Volumes](../components/estate/world/engine/volume.ts) · [Reader](../components/estate/world/Reader.tsx) · [Portrait rig](../components/estate/world/engine/portrait.ts) · [Visit model and routes](../lib/estate/world.ts) · [Importer](../scripts/seed-estate.mjs) · [Iteration guide](ITERATING_ON_THE_LIBRARY.md)
