# Travellers Rest · the measured record against the model

Survey of 12 November 2026. This says what measured material exists for Judge Overton's house, what each number in the 3D model should be, and where every number came from. The data is in [survey.json](../assets/travellers-rest/survey/survey.json); held files and their hashes are in [files.json](../assets/travellers-rest/survey/files.json). No application code was changed.

## The short answer

- **The library is the right room, in the right place, the right size.** It is the west room of the main block, west of the entry hall, lettered LIBRARY on the survey plan and photographed as "first floor, southwest room". Surveyed 6.05 × 5.80 m against 6.155 × 5.86 m modelled, which is inside the reading tolerance.
- **The hearth is on the right wall** (the west gable wall, centred within 0.1 m). The chimney stands outside the wall, though, so the room has no chimney breast.
- **Two doors and the stair are in the wrong places.** The door to the ell is 2.5 m too far east, the door from the hall is 1.05 m too far south and too wide, and the stair starts 0.94 m too far south and should end in winders.
- **The windows are the wrong pattern and slightly off.** They are sixteen-over-twelve sashes, not six-over-six; they sit 0.25 m further east, are 0.12 m narrower, and their heads are 0.16 m higher.
- **The portico is not Overton's.** The survey dates it to 1954, and it is gone in the 2021 photograph. Keeping or removing it is the owner's decision.
- **The house does not face south.** The front faces true azimuth 238°, south-west by west. The model's sun happens to be correct for that as it stands.

## What the measured record is, and is not

HABS TN-14 has **no measured-drawing sheets**. The Library of Congress record holds 11 photographs, 10 data pages and a caption page. The plan on data p. 8 and the south elevation on p. 9 are small tracings made in 1970 by Patrick W. Crawford from the restoration architects' drawings. Each has a graphic scale bar and not one written dimension.

So every length here is scaled from a scale bar on a 200 dpi scan, or derived from a photograph or an aerial image. On the plan one pixel is 28 mm, on the elevation 14 mm. I give ±0.10 m for plan values and ±0.06 m for elevation heights. Horizontal positions on the elevation carry a further ±2 %, because it makes the front 51.3 ft where the plan and the survey text make it 52 ft.

The dimensioned originals exist but are not online:

| Source | Where | Status |
| --- | --- | --- |
| Warterfield and Bass, "Architectural Restoration of John Overton's Home", Project 6605, June 1966, 17 sheets | Not located. Probably the museum or the Colonial Dames; Nashville Public Library holds Warterfield's slides | Would settle every value below |
| Brush, Hutchison & Gwinn, "Restoration of 1828 Addition", 29 May 1969 | Not located | The HABS tracings were made from these |
| HABS field records FN-24 (the architects' reports of 1966 and 1969) | Library of Congress, unprocessed | Reading-room request |
| National Register additional documentation, 2018, with "new floor plans and maps of the property" | Tennessee Historical Commission or the museum | [Preparer's note](https://www.katehatfield.net/travellers-rest); not found online |

The full register of sources, with identifiers, rights and whether each was downloaded, is under `sources` in survey.json.

### Held now

| What | Count | Bytes |
| --- | --- | --- |
| HABS TN-14 data pages and caption page (PDF) | 2 | 203,353 |
| HABS TN-14 photographs, 5000 px TIFF, with captions | 11 | 197,662,624 |
| USDA NAIP aerial of the site, 3 Dec 2021 (public domain) | 1 | 3,147,594 |
| OpenStreetMap outlines of the site (ODbL) | 1 | 20,537 |
| **Originals** | **15** | **201,034,108** |
| Working sheets (plan in two orientations, elevation, 11 photographs, site) and annotated crops | 30 | 30,841,315 |

The photograph TIFFs are 189 MB. Keep them out of ordinary git history unless the owner decides otherwise.

Two sources were read from temporary copies and not kept, because their terms are not clearly open: the 1969 National Register file at the National Archives ([NAID 135818189](https://catalog.archives.gov/id/135818189), marked "Restricted - Possibly") and the county's 2023 orthophoto ([Metro GIS service record](https://maps.nashville.gov/arcgis/rest/services/Imagery/2023Imagery_WGS84/MapServer?f=pjson), copyright Metro GIS and Pictometry). Only facts and measurements from them are recorded.

## Which room, and how the house grew

![Main block of the survey plan with scaled dimensions](../assets/travellers-rest/survey/crops/plan-main-block.png)

The plan is drawn with north at the bottom of the page; I checked the arrow, and the crops here are turned north-up so west is on the left, as in the model. The main block is 52 ft 1 in × 20 ft 6 in (15.87 × 6.24 m). From east to west it holds the parlor (5.55 m), the entry hall (3.40 m) and the library (6.05 m).

The 2021 photograph shows a vertical board seam in the siding just west of the door bay. The two bays west of it are the addition of 1812: "one room downstairs and one room above ... not joined by inside openings to the original four rooms" (National Register nomination, 1969). The library is that room. The 1799 house was the hall and the parlor with the rooms above them.

Two cautions. The name "library" is the 1970 survey's; I did not find a primary source saying how Judge Overton used the room. And the door from the hall into it is later than 1812; the 1966 restoration "moved an interior door".

![1970 and 2021 photographs of the front](../assets/travellers-rest/survey/crops/photo-front-1970-and-2021.jpg)

## Model against survey

Model values are from `ROOM` in `components/estate/world/engine/room.ts`, `assets/travellers-rest/estate.py`, `assets/travellers-rest/build.py` and `assets/travellers-rest/anchors-v2.json`. Coordinates are the model's: metres, x = 0 on the south-door axis, west negative, south positive z, floor at y = 0.53. Rows are ordered by how visible the error is.

| # | Item | Model | Survey | Diff. | Change | Conf. |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Library door to the ell (north wall) | x −3.23 … −2.05 (`d0`, `d1` in `architecture()`) | x −5.65 … −4.65, 0.99 m wide | 2.51 m west | `d0 = -5.65`, `d1 = -4.65`. `ROOM.chest` (x −5.15 … −3.85) then stands in the doorway: move it to about x −3.60 … −2.30, and move `drawer.correspondence`, `drawer.campaign` and `camera.drawers` by +1.55 in x | medium |
| 2 | Library door from the hall (east wall) | `ROOM.door` z 1.13 … 2.41, 1.28 m wide | z 0.27 … 1.18, 0.91 m wide | 1.05 m north | `door: { z0: 0.27, z1: 1.18 }`; partition, lintel and architrave in `estate.py` to match; `door.library` and `camera.library` z 1.76 → 0.72 | medium |
| 3 | Stair | 16 straight risers, z +0.97 … −2.63 | First riser z +0.03, 8 treads of 0.226 m to z −1.82, then winders turning east | 0.94 m north | Start 0.94 m further north; 9 risers straight, 3–4 winders, continue east over the rear door | medium |
| 4 | Window sashes | Six-over-six, three lights wide | Sixteen-over-twelve, four lights wide, seven rows | — | Upper sash 4 × 4, lower 4 × 3, meeting rail four-sevenths down | high |
| 5 | Library window centres | `ROOM.windows` [−6.26, −3.82] | [−6.03, −3.55] | 0.25 m east | `windows: [-6.03, -3.55]`; front windows in `build.py` to −6.03, −3.55, 3.50, 5.95 | medium |
| 6 | Library window size | 1.06 wide, sill y 1.36, head y 3.02 | 0.945 wide, sill y 1.37, head y 3.18 | head +0.16 | `windowHalf: 0.47`, `sill: 1.37`, `head: 3.18`. Exterior windows in `build.py` are lower still (1.25 … 2.89): centre 2.275, h 1.81, w 0.945 | medium |
| 7 | Chimney breast and firebox | Breast 0.29 m into the room; firebox 1.24 × 1.13, flat head | No breast, wall flush; firebox about 1.19 wide, 0.82 high at the crown of a segmental arch | — | Set `breast` to `ROOM.west`; arch the opening and lower its top from y 1.66 to about 1.35 | medium |
| 8 | Library ceiling | 3.19 m above the floor (`ceil: 3.72`) | Not given. 2.92 ± 0.15 by three estimates | −0.27 | `ceil: 3.45`, provisional | low |
| 9 | Portico | Pedimented porch and steps, z 3.1 … 5.3 | 1970: 3.59 m wide, 2.07 m deep, cornice 2.92 m and apex 3.94 m above the floor, paired posts. Built 1954; absent in 2021 | — | Owner's decision; see below | high |
| 10 | Entry hall width | 3.14 m (−1.475 … +1.665) | 3.40 m (−1.42 … +1.97) | +0.26; east wall +0.31 | `estate.py`: hall east wall x 1.73 → 2.04, floor and ceiling 3.27 → 3.58 wide (centre x 0.07 → 0.22); `table.map` and the Jackson panel move with the wall | medium |
| 11 | Eave, roof, chimneys | Wall top 6.98, ridge 8.84, pitch 29°, chimney tops 9.33 | Eave 6.81, ridge 8.87, pitch about 33°, chimney tops 10.09; chimney 2.07 m wide at the base and 0.77 m proud | eave −0.17, chimneys +0.76 | Block height 6.52 → 6.35, roof rise 1.85 → 2.07, chimneys taller and wider | medium |
| 12 | Ell and 1887 addition | Ell 20.4 m, addition 5.7 m, gallery 3.28 m on the east only | Ell 17.67 m, addition 8.53 × 7.35 m set 1.9 m east, gallery 4.25 m and returning along the north of the main block | joint 2.7 m | Exterior massing only | low |
| 13 | Library finishes | Panelled dado, crown moulding | Flat painted dado under a chair rail at about 0.73 m; no cornice | — | Drop the raised fields and the `crown()` calls | medium |
| 14 | South door leaf | 1.16 × 2.34 | 1.09 × 2.08; frame with transom 2.58 | −0.26 | Leaf 2.08 high, transom glass 0.36 | medium |

### Checked and left alone

| Item | Model | Survey |
| --- | --- | --- |
| House width | 15.85 | 15.87 |
| House depth | 6.20 | 6.24 |
| Library east–west | 6.155 | 6.05 |
| Library north–south | 5.86 | 5.80 |
| First floor above grade at the door | 0.53 | 0.51 (0.63 at the corners) |
| Window sill above the floor | 0.83 | 0.84 |
| Hearth | West wall, z 0 | West wall, z +0.10 |
| Mantel shelf length | 2.54 | 0.87 of the ceiling height, 2.54 at 2.92 m |
| Stair strip | x −1.42 … −0.40 | x −1.42 … −0.37 |

## Where the numbers came from

### Scale

![Plan scale bar](../assets/travellers-rest/survey/crops/plan-scale-bar.png)

Plan: five feet is 55.2 px, so 11.04 px to the foot. Elevation ([crop](../assets/travellers-rest/survey/crops/elev-scale-bar.png)): 22.1 px to the foot. The plan gives 52.1 × 106.1 ft overall; the survey text says "approximately 52' × 107'".

### The library

![Library on the survey plan](../assets/travellers-rest/survey/crops/plan-library.png)

| Value | Feet as scaled | Metres | In the model frame |
| --- | --- | --- | --- |
| Interior east–west | 19 ft 10 in | 6.05 | x −7.68 … −1.62 |
| Interior north–south | 19 ft 0 in | 5.80 | z −2.88 … +2.91 |
| West window centre from the west wall | 5 ft 5 in | 1.64 | x −6.03 |
| East window centre from the east wall | 6 ft 5 in | 1.96 | x −3.55 |
| Between window centres | 8 ft 0 in | 2.44 | |
| Hall door, clear | 3 ft 0 in | 0.91 | z +0.27 … +1.18 |
| Door to the ell, clear | 3 ft 3 in | 0.99 | x −5.65 … −4.65 |
| Hearth slab | 5 ft 9 in × 2 ft 3 in | 1.75 × 0.69 | centred z +0.10 |
| Firebox between jambs | 3 ft 1 in | 0.94 | |
| Chimney outside the wall | 6 ft 10 in × 2 ft 6 in | 2.07 × 0.77 | |

The plan and the elevation agree on the library window centres to 0.08 m (−6.02 and −3.58 on the plan, −6.04 and −3.50 on the elevation).

![Library west wall, 1970](../assets/travellers-rest/survey/crops/photo-library-west-wall.jpg)

The photograph shows what the plan cannot: a flush west wall with the mantel applied to it, no window in that wall, no cornice, a flat painted dado, and the six-panel door to the ell near the north-west corner. The mantel is not original; the survey says it came from a house in Franklin in 1936.

### Heights

![West bays of the south elevation with levels](../assets/travellers-rest/survey/crops/elev-heights-west-bays.png)

| Level, above the first floor | Feet as scaled | Metres | Model y |
| --- | --- | --- | --- |
| Grade at the door | −1 ft 8 in | −0.51 | 0 |
| First-floor sill | 2 ft 9 in | 0.84 | 1.37 |
| First-floor head | 8 ft 8 in | 2.65 | 3.18 |
| Second-floor sill | 13 ft 3 in | 4.04 | 4.57 |
| Second-floor head | 18 ft 3 in | 5.57 | 6.10 |
| Eave | 20 ft 7 in | 6.28 | 6.81 |
| Ridge | 27 ft 5 in | 8.34 | 8.87 |
| Chimney top | 31 ft 4 in | 9.56 | 10.09 |

The 2021 photograph gives the same proportions: sill 3.19 ft above the bottom of the siding against 3.21 ft drawn, second-floor sill 13.9 ft against 13.7 ft.

**Ceiling height is a gap.** No source states it. Three estimates agree loosely: 2.90 m from the elevation, if the second-floor sill sits as high above its floor as the first; 2.95 m from the parlor photograph, where the cornice is about one pane row above the window head; 2.82 m from the library photograph, if Earl's portrait is on a 25 in. canvas. I use 2.92 ± 0.15 m. The model's 3.19 m is probably the floor-to-floor height (3.20 m by the same reasoning).

### Front openings, door and portico

[Façade openings](../assets/travellers-rest/survey/crops/elev-facade-openings.png) · [door and portico](../assets/travellers-rest/survey/crops/elev-door-portico.png)

First-floor sashes are 3 ft 1 in × 5 ft 10 in (0.945 × 1.78 m), four lights wide and seven rows high. The door leaf is 6 ft 10 in (2.08 m) in a 3 ft 7 in (1.09 m) opening under a four-light transom.

### Hall and stair

![Entry hall on the survey plan](../assets/travellers-rest/survey/crops/plan-entry-stair.png)

The [hall photograph](../assets/travellers-rest/survey/crops/photo-hall-stair.jpg) confirms the plan: the stair is on the library side, its first riser just past the library door casing, about ten risers running north before winders turn east above the rear door. The stair was reconstructed in 1966. The total rise is not given.

### Ell

[Whole plan with the ell](../assets/travellers-rest/survey/crops/plan-ell-overall.png). The brick ell is 22 ft 9 in × 58 ft 0 in (6.93 × 17.67 m), its west wall continuing the main block's. The plan shows it before the 1969 restoration, so do not use it for the ell's present interior.

## Where the sources disagree

| Topic | One source | Another | Follow | Why |
| --- | --- | --- | --- | --- |
| Portico | 1970 survey: pedimented portico | 2021: none, two stone steps | 2021, unless the model is declared to be the house as surveyed | The survey itself dates the porch to 1954 |
| Width of the front | Plan 52.1 ft | Elevation 51.3 ft | Plan for positions and overall size, elevation for heights and opening sizes | The plan matches the survey text within 1 % |
| Door axis | Plan: on the centre | Elevation: 0.14 m west | Keep x = 0 on the door | Inside both tolerances |
| Direction | Survey: "the house faces south" | Orthophoto: front faces 238° | 238° for sun and shadow; keep the nominal room names | Measured on georeferenced imagery; OpenStreetMap gives 238.4° |

The archive README records that the survey was chosen as the geometry. If that stands, keep the portico and correct it: 3.59 m over the posts, pediment 4.26 m wide, paired posts at each front corner. If the aim is the house Overton knew, or the house today, remove it.

### Orientation and the sun

The roof edges on the 2023 orthophoto run at 57.7° and 147.7°, so nominal south is true 237.7°, ±1°. True north in the model frame is the direction (x −0.845, z −0.534).

The engine's sun, direction (0.36, −0.56, −0.75), stands 25.6° west of the front normal and 34° high. With the real orientation that is the sun at azimuth 263°, about 16:20 solar time in late April or mid August. It is physically right as written. Do not recompute it on the assumption that +Z is true south; that would be 58° out.

## The grounds

![Schematic plan of the grounds](../assets/travellers-rest/survey/crops/site-grounds-schematic.png)

No measured site plan was found; HABS TN-14 has none. Positions below are the site as it stands, read on the 2023 county orthophoto to about ±3 m and checked against OpenStreetMap. Offsets are metres from the south door: x nominal east, z nominal south. Add 3.12 to z for the model's z. The same features are marked on the public-domain aerial in [site-grounds-annotated.jpg](../assets/travellers-rest/survey/crops/site-grounds-annotated.jpg) and [site-house-surroundings-annotated.jpg](../assets/travellers-rest/survey/crops/site-house-surroundings-annotated.jpg).

| Feature | Position (x, z) | Notes | Conf. |
| --- | --- | --- | --- |
| Front lawn | door to z +12 | Open grass. In 1970 clipped shrubs flanked the portico; none in 2021 | low |
| Carriage-drive oval | x −18 … +18, z +12 … about +48 | Remnant earth track about 3 m wide round a grassy oval; southern half faint | low |
| Path to the door | From the nominal south-east | Earth path with brick edging to two stone steps (2021 photograph) | medium |
| White rail fence | z +62, x −20 … +62 | Gate on the door axis; meadow, modern buildings and parking beyond | low |
| Formal garden | x +25 … +38, z −23 … +3.5 | East of the house beside the gallery, not in front of the door. Oval lawn about 6 × 19 m inside an evergreen hedge; entered from the west at z −10.5 | low |
| Kitchen garden | x −34 … −15, z −39.5 … −29.5 | Fenced raised beds beside the weaving house | low |
| Weaving house | x −25 … −19, z −47.5 … −40.5 | Two-storey brick, about 1820, 6.3 × 7.1 m | medium |
| Smokehouse | x −8 … −2, z −52 … −46 | One-storey brick, 5.7 × 7.4 m; identified by elimination | low |
| Law office | x +33 … +40.5, z +56.5 … +62.5 | Brick reconstruction of the 1950s, 8.3 × 7.2 m; identification probable | low |
| East walk | x +17 … +20, z +10 … −25 | Two benches near z −18.5 and −22 | low |
| Rail yard | x −66 and beyond | Parallel to the ell, behind a belt of trees | medium |

**Trees.** Nine evergreen crowns are placed in survey.json (T1–T9). The three that frame the house are T1 at (−14, +4), 13 m across, in front of and west of the library windows; T2 at (+17, +4), 16 m; and T3 at (+12.5, −13.5), 12 m, in the angle of the gallery. Species were not identified tree by tree. The Cultural Landscape Foundation describes the drive as "shaded by large magnolia trees", and the museum writes that its old ginkgos are "among the largest trees that we have on property"; where the ginkgos stand was not established. Deciduous trees are recorded as masses only.

**Not on the site.** No family cemetery appears in any source read. The house stands on a Mississippian village and burial ground (site 40DV11). The orchards and nursery the farm was known for are gone, and the 1820s carriage house and slave cabins are unlocated. A ground-penetrating radar survey of about 2022 mapped historic drives, walks and foundations; its map was not obtained.

The garden being built from a quicker look should be checked against three points in particular: the formal garden is east of the house, the front is lawn and an oval drive, and the big trees by the front corners are evergreen.

## Jackson to Overton

Findings are in [correspondence.md](../assets/travellers-rest/survey/correspondence.md). Two letters have manuscript images online with clear terms:

1. **8 June 1829**, Tennessee State Library and Archives, Jacob McGavock Dickinson Papers, [ID 43090](https://teva.contentdm.oclc.org/digital/collection/p15138coll33/id/144). The letter Overton received, in Jackson's hand, addressed to him "near Nashville". Rights "No copyright - United States". Printed in *The Papers of Andrew Jackson* VII, pp. 270–272. Images online are only about 1200 px wide.
2. **31 December 1829**, New York Public Library, [Jackson–Lewis correspondence](https://digitalcollections.nypl.org/items/76b0be50-e5b0-0134-7c62-555f39c49a7a). A retained copy in William B. Lewis's hand, signed by Jackson; not Overton's sheet. *Papers* VII, pp. 655–657.

I checked the first against the archive's own record. The Library of Congress holds none; some thirty more belong to the Tennessee Historical Society and are on microfilm only.

## What could not be found or read

- Any dimension string. Nothing in the record is a written measurement.
- The Warterfield, Brush and 2018 National Register drawings.
- Ceiling heights, the stair's total rise, interior door heights, second-floor plan, any section.
- Interior of the library's south and east walls in a photograph; only the west wall and part of the north wall were photographed.
- Tree species by individual tree, and the ginkgos' positions.
- Which small brick building is the smokehouse and which the law office, beyond the reasoning given.
- A measured site plan of any date.

## What to hand a modeller first

1. [plan-library.png](../assets/travellers-rest/survey/crops/plan-library.png) and rows 1, 2, 5, 6 and 7 of the table: both doors, the windows and the flush hearth wall.
2. [plan-entry-stair.png](../assets/travellers-rest/survey/crops/plan-entry-stair.png) and rows 3 and 10: the stair and the hall width.
3. [elev-heights-west-bays.png](../assets/travellers-rest/survey/crops/elev-heights-west-bays.png): every level, and the sash pattern.
4. The portico decision.
5. [site-grounds-schematic.png](../assets/travellers-rest/survey/crops/site-grounds-schematic.png) for the garden.

Full working sheets are in [sheets](../assets/travellers-rest/survey/sheets/): the plan [north-up](../assets/travellers-rest/survey/sheets/habs-tn-14-p08-first-floor-plan-north-up.png) and [as drawn](../assets/travellers-rest/survey/sheets/habs-tn-14-p08-first-floor-plan-as-drawn.png), the [south elevation](../assets/travellers-rest/survey/sheets/habs-tn-14-p09-south-elevation.png), the eleven photographs, and the [aerial in the house frame](../assets/travellers-rest/survey/sheets/usgs-naip-2021-site-house-frame.png).
