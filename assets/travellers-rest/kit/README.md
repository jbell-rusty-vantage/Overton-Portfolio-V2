# The Travellers Rest kit

Blender-authored pieces for the continuous library, and the pipeline that carries them into the live room with their names, places and pivots intact. The engine reference is [docs/WORLD_ENGINE.md](../../../docs/WORLD_ENGINE.md); the room these pieces stand in is built in [room.ts](../../../components/estate/world/engine/room.ts), whose `ROOM` holds every dimension.

## What is here

| File | What it is |
| --- | --- |
| `build_kit.py`, `kit_tools.py` | The builder. Models every piece, generates the finishes, bakes occlusion, saves the `.blend`, exports glTF, renders stills. |
| `Travellers Rest - kit.blend` | The editable source the builder writes. Collections: **Kit** › Furniture, Desk furniture, Hearth, Joinery, Mouldings (stock), Moving parts (stock); and **Review (not exported)** with a ghost of the room, lights and five cameras. Bevel and weighted-normal modifiers are left live. |
| `source.json` | What Blender says each exported node is: name, parent, role, pivot, rotation, scale, motion. |
| `manifest.json` | Written by the packer: every node with local and world transform, pivot, bounds, triangles per tier and materials; both delivery files with size and SHA-256. The tests read it. |
| `assemble_world.py` | Builds `../Travellers Rest - continuous.blend`: shell, code-built interior, kit and anchors in one scene. |
| [scripts/pack-kit.mjs](../../../scripts/pack-kit.mjs) | Packs the export to `public/travellers-rest/kit.glb` and `kit-low.glb`. |
| [scripts/export-room.mjs](../../../scripts/export-room.mjs) | Exports the code-built interior from the running engine to glTF. |
| [props.ts](../../../components/estate/world/engine/props.ts) | The loader the engine uses. |
| [tests/kit.test.ts](../../../tests/kit.test.ts) | The contract: names, transforms, pivots, separate moving parts. |

## Rebuild everything from nothing

Run from the repository root. Blender 5.2.2 is not on `PATH`; in Git Bash:

```bash
BLENDER="/c/Users/Pinda/AppData/Local/Programs/Blender/blender-5.2.2-windows-x64/blender.exe"

# 1. Model, bake, save the .blend, export, render the kit stills (about six minutes; add `-- --quick` to skip the bake and stills)
"$BLENDER" -b -P assets/travellers-rest/kit/build_kit.py

# 2. Pack both tiers, write the manifest, verify nothing moved
node scripts/pack-kit.mjs

# 3. Check the contract
npx tsx --test tests/kit.test.ts

# 4. Export the code-built interior from the running office preview (npm run admin:local, port 3078)
node scripts/export-room.mjs

# 5. Assemble the whole library as one Blender scene and render two stills
"$BLENDER" -b -P assets/travellers-rest/kit/assemble_world.py
```

Steps 1 to 3 need nothing but Blender and `node_modules`. Step 4 needs the preview running with the kit already in `public/`, because the export leaves out whatever the kit supplies. Suggested `package.json` scripts (not added: `package.json` belongs to another workstream):

```json
"kit:pack": "node scripts/pack-kit.mjs",
"kit:room": "node scripts/export-room.mjs",
"test": "tsx --test tests/library.test.ts tests/estate.test.ts tests/kit.test.ts"
```

Scratch output goes to `.local-library/kit/` (the unpacked export `kit-export.glb`, generated textures, `room-export.glb`, logs).

## Coordinates and placement

The house frame is metres, Y up, south +Z. Blender is Z up, north +Y, so house `(x, y, z)` is Blender `(x, -z, y)`; `G()` in `kit_tools.py` converts. A piece is modelled in its own frame with its front toward −Y and then placed with `place(obj, house_xyz, yaw)`.

**A placed piece's transform is its place in the house.** The table's root is at `(-4.95, 0.53, 0.75)` because `ROOM.table` is centred there. Nothing is positioned in browser code: move the piece in Blender, rebuild, and it moves in the room. The tests pin the pieces to the `ROOM` positions so a drift is caught.

Stock pieces (mouldings, the book, the letter) sit on a bench north of the house at Blender Y ≈ 5 to 6; their world position means nothing, their local frame is the contract.

## Naming rules

- Lower-case, dotted, stable: `<piece>` for the root and `<piece>.<part>` below it (`chair.windsor`, `chair.windsor.seat`, `book.board.front`, `book.pivot.gutter`). Hyphens are allowed inside a word (`moulding.chair-rail`). Materials follow the same rule (`walnut`, `paint.joinery`, `leather.tooled`).
- **three.js strips the dots.** `GLTFLoader` passes names through `PropertyBinding.sanitizeNodeName`, so `chair.windsor` arrives as `Object3D.name === "chairwindsor"`; the dotted name is kept in `userData.name`. The manifest records both (`name`, `three`), the packer refuses two names that collapse to one spelling, and `Kit` indexes by the dotted name.
- Custom properties on an object travel as glTF extras and arrive in `userData`:
  - `kit_piece`: the root name the node belongs to.
  - `kit_role`: `placed` (rests in the room; merged into static geometry), `moving` (authored to move; left out of the static merge), `stock` (reusable; never placed automatically).
  - `kit_motion`, `kit_axis`, `kit_travel`: `slide`, `hinge` or `gutter`, the axis in house coordinates, and metres or radians of travel.
- Custom properties on a material: `finish` names the live room finish to use in its place (a key of `finishes()` in `room.ts`); `tile` is the metres one texture repeat covers.
- In the packed files each mesh hangs on a child node `<name>~mesh`. Meshopt quantization rewrites the transform of the node that carries a mesh; the holder takes that, so the named node keeps the transform and pivot it was authored with. The holder is not part of the contract.

## How the engine finds a piece

`Engine.load()` starts `loadKit(kitSource(tier))` beside the shell: `/travellers-rest/kit.glb`, or `kit-low.glb` when the tier is `"low"`. `loadKit` resolves to a `Kit` or to `null` on any failure and never rejects.

`buildLibrary(tier, kit)` holds the table `KIT_PIECES` (table, chair, candles, desk, mantel, hearth, sashes, door, chest → the root names each needs). For each entry, if the kit has every node, the code-built counterpart is skipped; otherwise the code-built piece is built as before. The supplied roots go through `kit.merged(pieces, finishes)`: every mesh under them is baked into the house frame and merged by material, so the kit costs one draw call per finish. Candle flames are lit at the `candlestick.*.flame` empties. The canvas carries `data-kit="blender"` or `"code"`.

For a material with a `finish` property the merge uses a copy of the room's own finish and keeps the kit's baked occlusion, so Blender joinery and code-built joinery are the same walnut. Remove the property from a material in Blender and its own exported texture is drawn instead (`leather.tooled` and `ink` already work this way).

`kit.object(name)` returns the live node with its pivot and children, `kit.point(name)` its origin in the house, `kit.motion(name)` its authored axis and travel. `kit.moving(name, finishes)` returns independently disposable moving geometry with its authored pivot. `kit.geometry(name)` returns stock geometry without its bench placement. Drawers, volume boards/block/spine and folded document sheets now use these paths; existing flight/hinge/leaf-turn contracts remain unchanged.

Add `?kit=off` to any world URL to see the code-built room; `scripts/export-room.mjs` and before/after comparisons rely on it.

## Add a piece

1. In `build_kit.py`, write a function that builds it from `Part` (boxes with bevel weights, `lathe`, `turned`, `tube`, `sweep`, `extrude`), in the piece's own frame, and call it with the others.
2. Give the root a dotted name, `place()` it in house coordinates, `tag()` it with its piece and role, and parent the parts with `child()`. Put the origin where the thing turns or slides.
3. Use an existing material, or add one to `M` with `material()`; give it a `finish` if the room already has that surface.
4. Rebuild, pack, run the tests. Open the stills in `docs/travellers-rest-review/kit/`.
5. To put it in the room, add its root to `KIT_PIECES` in `room.ts` and guard the code-built counterpart with the same key. Add its position to the last test.

Editing by hand in Blender works too, but the builder overwrites the `.blend`: anything meant to last belongs in `build_kit.py`. To export a hand-edited file without rebuilding, select the **Kit** collection's objects and export glTF with Apply Modifiers, +Y Up and Custom Properties on, to `.local-library/kit/kit-export.glb`; `pack-kit.mjs` then fails, by design, until `source.json` agrees.

## Live use after the survey pass

The kit supplies both bookcases, two sliding chest drawers, the moving book boards/block/spine and folded correspondence sheets. Sixteen-over-twelve library sashes replace the former pattern. The ell door, mantel and chest positions follow the survey; the 3.19 m ceiling and portico remain by owner decision.

The table below is a historical inventory. The second pass adds authored `room.shell`, `room.joinery` and `desk.study`: walls/floor/ceiling, swept skirting/chair rail and edge-meeting casings. On November 13 the study's computer and laptop were replaced by a walnut reading stand, layered rag paper and brass page clips; the chest books remain. The paper's printed index, moving book leaves, portrait, fire and effects remain code-built. No unsupported room cornice is added.

### Viewing folio · November 13

`desk.study` is an empty root with `desk.study.stand`, `.paper`, `.fittings` and `.chest-books`. The paper faces house +X at `[-7.375, 1.64, 2.53]`, measures 0.64 × 0.55 m, and stays inside the former display niche. Its ledge spans house Z 2.205–2.855, leaving neighboring project spines exposed. The engine's printed index is a 0.58 × 0.47 m plane at X −7.370. Films open in a large native viewer; no moving picture runs on the paper in the room.

`room_assets.py → build_study()` is shared by the full build and the scoped `replace_study.py` script. Run Blender with `--background --python-exit-code 1 --python assets/travellers-rest/kit/replace_study.py`, then `npm run kit:pack`. The scoped script backs up the source before the first replacement and preserves unrelated geometry and baked lighting. `node scripts/capture-folio-plate.mjs` refreshes the two cabinet loading/fallback pictures from the current local preview; it does not write to PostgreSQL.

Both final GLBs validate with zero errors/warnings; all six kit contracts pass. Reopening the source found no missing textures and confirmed that 61 unrelated objects retained their geometry, transforms and materials. [Asset render](../../../docs/travellers-rest-review/kit/viewing-folio.png) · [Cabinet fit](../../../docs/travellers-rest-review/kit/viewing-folio-cabinet.png) · [Integrated qualification](../../../docs/BOOKS_AND_VIEWING_FOLIO.md).

## Original modelling inventory

| In the kit and live in the room | In the kit, prepared for motion, not yet driven | Still built in code |
| --- | --- | --- |
| Windsor chair (saddled seat, turned legs and stretchers, bent arm and bow, nine spindles) | Book: `book.block`, `book.board.front`, `book.board.back` (hinged on the spine edges), `book.spine`, `book.pivot.gutter` | Walls, floor, ceiling, dado, crown, door and window casings |
| Writing table (moulded top, tooled leather with its own baked texture, tapered legs, drawer) | Letter sheet with fold creases and a lifting corner | Both bookcases, the law books and project volumes |
| Four candlesticks with tapers and wick empties | `chest.drawer.correspondence`, `chest.drawer.campaign` (origins on their runners) | The two sliding chest drawers and their labels (in `engine.ts`) |
| Pewter inkwell, two quills, pounce pot | `table.writing.drawer` (live, static) | The open casebook, stacked reports, record tray, objects on the chest |
| Mantel (fluted pilasters, capitals, frieze tablet, bed mouldings and shelf), andirons, three logs | Sashes (live, static; each slides) and the door (live, static; hinged on its edge) | Hearth stone, firebox, slips, rug, portrait, the contemporary desk |
| Two sixteen-over-twelve sash units with moulded muntins | Stock mouldings: chair rail, skirting, cornice, one-metre runs | Fire, candle flames, dust, shafts, painted contact shadows |
| Six-panel door with raised and fielded panels | | |
| Chest of drawers: carcass, bracket feet, fixed lower drawer | | |

## Limits

- Walnut and painted joinery now come from editable procedural shader nodes in `baked_finishes.py`, baked to bounded images (512 px wood, 256 px paint). Leather and paper still use seeded texture generation. Occlusion is a real Cycles bake: one 2048 px atlas on the second UV set (`ao`), shared by every piece, packed to 1024 px (512 px in the compact tier). Drawers are baked standing open.
- The room's own timber and paint textures do not tile seamlessly, so wide kit surfaces show the same soft seams the code-built joinery does. The kit's own textures are seamless.
- No collision or navigation data. The chair and table occupy the footprints the walking bounds already assume.
- The compact tier is simplified to about 78% of the detailed triangles (the error bound stops it there) and uses smaller textures. It has been loaded on an emulated phone, not on a physical one.
- `Travellers Rest - continuous.blend` is assembled, not authored: the interior collection is generated from code and replaced on every run, and the authored room/desk/kit collection is an appended copy. The old render-only trim-shadow suppression has been removed. The code-built chest drawers are kept in a hidden collection there because the kit's drawers take their place.
- The builder is deterministic in geometry, names and transforms. The Cycles bake has not been shown to be bit-identical across machines, so the packed files' hashes may differ after a rebuild elsewhere; `manifest.json` always carries the hashes of the files it was written with.

## Static light comparison

`node scripts/export-room.mjs --static-light` exports only the opaque static library, including placed kit furniture but excluding moving books, drawers, correspondence and transparent glass. `blender --background --threads 4 --python assets/travellers-rest/kit/bake_room.py` makes a bounded 4096 px, 48-sample colour/light atlas with CPU compositor denoising and preserves editable source materials in a hidden collection. `node scripts/pack-room-light.mjs` validates and packs it. The experimental browser path is `?lighting=baked`; default lighting remains live until visual and frame-time comparison qualifies a replacement. A shared 2048 px atlas can lose joinery detail and is not assumed to improve appearance merely because it bakes successfully.

The static bake retains both raw and denoised atlases and its compositor graph in `Travellers Rest - light bake.blend`. `use_active_scene=True` excludes the helper compositor scene from delivery. Default browser lighting remains live; a successful bake/validator alone does not qualify fine texture quality.
