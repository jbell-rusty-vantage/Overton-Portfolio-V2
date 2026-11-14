> Historical hall authoring guide, retired by the one-world cleanup. Commands below are provenance, not supported current release instructions. Shared posters remain current; see [current authoring](../../knowledge/authoring-tools.md).

# The Library scene

The editable source is `The Library.blend`. It contains the original hall, cabinets, rose window, gallery rail, pendants, circulation desk, armillary sphere, reading furniture, periodicals, evolution panels, botanicals, signage and computer station. The source retains named architectural parts and four packed timber textures. The WebGL variants batch permanent geometry by material. Interactive books and hit targets are placed at runtime.

## Scene contract

`manifest.json` supplies the seven room destinations, eleven shelf anchors and two screen anchors. Coordinates are in meters with glTF Y up. The entrance is toward positive Z. `build.py` converts each point to Blender coordinates as `(x, -z, y)`. The web camera, shelf hit targets and display placement all use the same manifest. Shelf positions start at one, run left to right and fill three rows of eight from the top. The public projection rejects out-of-range positions and unknown scene-node mappings.

The built-in art contains decorative books. A face-out cloth binding with a printed title represents a readable volume. The same volumes appear in the HTML catalog. A library editor can replace the built-in hall with a self-contained GLB that satisfies the anchor contract.

Database-backed shelf titles are drawn over the original cabinet lettering by [ShelfPlaque](../../components/library/ShelfPlaque.tsx). Keep a replacement cabinet's title face aligned with `cabinet()` in the generator, or adjust the plaque with the cabinet. The fixtures retain the manifest labels. Physical bindings use [BookJacket](../../components/library/BookJacket.tsx) for registered custom covers. See [the iteration guide](../../docs/ITERATING_ON_THE_LIBRARY.md) for the artwork folder and the no-login editor.

## Rebuild on this checkout

Run these commands from the repository root in PowerShell. Blender runs in a fresh background process. It does not edit the interactive Blender session.

```powershell
$blenderBin = 'C:\Users\Pinda\AppData\Local\Programs\Blender\blender-5.2.2-windows-x64\blender.exe'
python assets/library/illustrate.py
& $blenderBin --background --python-exit-code 1 --python assets/library/build.py
& $blenderBin --background --python-exit-code 1 --python assets/library/build.py -- --low
npm run assets:pack
npm test
```

The illustration generator uses Pillow and NumPy. The timber images are included, so Blender can also rebuild the hall independently of that generator. The standard build saves the editable source and renders landscape and portrait entrance posters with Cycles. Both builds bake diffuse lighting into mesh corners. The low-detail build reduces geometry in globe lamps, moldings, hardware and book spines. Raw exports are written to the ignored `.local-library` directory.

The pack step uses a local Meshopt encoder and verifies each output with the Khronos glTF validator. It reopens the compressed files and checks every required anchor against the master export. Three.js loads its bundled decoder locally. Files, hashes, counts and byte sizes are recorded in [ASSET_MANIFEST.json](ASSET_MANIFEST.json).

## Provenance

The geometry, timber textures, botanical meshes and engraved cover illustrations were generated specifically for John Overton’s Library on November 7, 2026. The source programs are bundled here. Signs use Blender’s built-in font converted to geometry. The project ships no purchased models, external font files, HDRIs or downloaded texture packs. The generated assets carry no additional third-party attribution requirement. The installed software packages retain their own licenses.

