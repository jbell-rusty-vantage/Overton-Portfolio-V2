# The grounds of Travellers Rest

What the visitor sees between the south lawn and the front door, where it comes from, and how much of it is this project's own reading. The scene is built in code by [grounds.ts](../../../components/estate/world/engine/grounds.ts) and the files beside it in [grounds/](../../../components/estate/world/engine/grounds/); nothing here is a downloaded model or photograph.

## What the record says

| Source | What it gives |
| --- | --- |
| [Historic American Buildings Survey TN-14](https://www.loc.gov/item/tn0036/), data pages, 1971 (held copy: [tn-14-survey.pdf](../archive/originals/tn-14-survey.pdf)) | “The house faces south.” Outbuildings: a brick smokehouse and a brick dwelling for enslaved people on the north side, a brick law office on the south side. The survey describes the building; it does not describe planting. |
| [The Cultural Landscape Foundation, Travellers Rest Historic House Museum](https://www.tclf.org/travellers-rest-historic-house-museum) | The present nine acres: an open lawn to the south “lined by trees on either side”; the house “connected to the remnants of an historic circular carriage drive set around a grassy oval and shaded by large magnolia trees”; “a small formal garden lined by symmetrical hedgerows” fronting the house; Overton's law office (rebuilt in brick in the 1950s), a barn and outbuildings; the Weaving House and its garden to the north. The Overton plantation had a peach orchard, an English garden and apple trees, and was worked by about eighty enslaved people. |
| [Travellers Rest Historic House Museum](https://www.historictravellersrest.org/book-an-event) | The museum's own description of the grounds today: “large magnolia trees, a beautiful formal garden, and grassy meadows”. Venue listings for the museum on other sites ([WeddingWire](https://www.weddingwire.com/biz/historic-travellers-rest/799a25b72ab744a4.html), [Eventective](https://www.eventective.com/nashville-tn/historic-travellers-rest-665773.html)) add an herb garden, a crib barn and white fences; these were read as search excerpts only. |
| Carol M. Highsmith, [photograph of 10 November 2021](https://www.loc.gov/item/2021756795/), Library of Congress (held copy: [house-color.jpg](../archive/originals/house-color.jpg)) | The south front in low autumn sun: dark magnolias at both ends of the house, a crown overhanging from the south, dappled shade across lawn and weatherboards, a red-brown gravel drive with a brick edge, a white picket fence and a board screen at the west end, a small brick building beyond it, yellow and red autumn leaves behind. |

## What was built from it

**Documented, and placed where the record puts it**

- The house faces south and is approached from the south lawn.
- Southern magnolias at the west and east ends of the south front and by the oval. They are the trees every description names and the photograph shows.
- An oval gravel carriage drive round a grassy oval, south of the house, with a brick edge (the edge and the colour of the gravel are from the photograph).
- The formal garden east of the house beside the gallery, with an oval hedge and a west entrance; the old front parterres and foundation shrubs have been removed.
- An open lawn running south, lined by trees on both sides, with meadow grass at its margins.
- A white picket fence and a board screen at the west end of the house, and a brick outbuilding beyond them.
- The season and the light: an autumn afternoon with the sun in the south-south-west, as in the photograph. Magnolias and cedars stay green; the other trees are turning.

**Interpretation: this project's own choices, not a survey**

- The November 12 survey supplies approximate positions and sizes, with stated tolerances (typically ±3 m for grounds). Coordinates in `plan.ts` add 3.12 m to distances measured from the south threshold. The carriage oval starts about 12 m beyond that threshold. The garden is east of the gallery and the two large magnolias stand off the front corners.
- The garden's two planted strips, species, visitor paths and hedge detail remain interpretation; there is no planting schedule.
- The Weaving House, smokehouse and reconstructed law office now have distinct details from HABS photo 11 and the held NRHP description: stone bases, the weaving house’s off-centre porch and end chimney, the smokehouse’s gable door and side vent, and the law office’s nine-over-nine windows and four-post porch. Fine opening dimensions and orientation remain approximate; no interiors or modern barn are modelled.
- The paths, garden sign, bench, far woodland and tree species other than the documented magnolias are interpretation. The visited site is level in this model; distant scenic ground begins beyond 70 m. This is not a topographic survey. The real railway and surrounding houses are omitted.
- The Weaving House's history as a dwelling associated with enslaved people is not staged with period figures. That history needs sourced interpretation, not an invented outdoor scene.
- Weatherboards reuse the crown shade texture, projected along the afternoon sun ray. Engine environment controls vary colour/intensity/wind palettes and provide opt-in synthesized wind, quiet birds and wood/gravel footsteps. Palettes are artistic studies, not seasonal canopy replacement or astronomical time; the painted shadow direction stays fixed. No sound is represented as a recording from the historic site.

## The people

Eight figures on the detailed tier, five on the compact tier. All are present-day museum visitors or staff in ordinary clothes of today, with a mix of ages and appearances. They are plain model figures without faces. No one is in period dress, no one is at work on the land, and there are no re-enactors.

| Who | Where | What they do |
| --- | --- | --- |
| A guide, with a lanyard and badge | On the grass east of the steps, clear of the door and the walk | Stands with hands folded and turns her head to a visitor coming up the walk |
| A family: two adults and a child | The east garden | Stroll slowly round the flower bed, the child holding a parent's hand; they stop and give way if the visitor stands in their path |
| A visitor reading the garden sign | The east garden | Reads, and now and then looks up at the house |
| A reader on the bench (detailed tier) | Under the oval magnolia | Sits with a book, looks up from time to time |
| Two visitors, one with a phone (detailed tier) | On the oval, facing the house | One raises a phone to photograph the house and lowers it again; the other looks up at it |

Under reduced motion everyone holds still, the leaves do not move and nothing is redrawn.

## How it is drawn

- About fourteen draw calls. Everything static is merged by material: one mesh of bark, two of leaf cards, one of garden plants, one of hedges and shrubs, one of painted joinery, one each of lawn, gravel and brick. The people are a single skinned mesh.
- Shade is painted. Every leaf cluster, trunk, hedge, fence and standing figure stamps its shadow into one texture along the sun's direction, and the ground, gravel, hedges, fences and people look that texture up along the same ray. No lights were added and no shadow map is used out of doors.
- Leaves, grasses and flowers move in the vertex shader; dapples stir by a few centimetres.
- All textures are generated at start-up from fixed seeds. No texture files were added under `public/travellers-rest/grounds/`.

The ell and L-shaped gallery now come from `kit/ell_assets.py` in the surveyed shell. Their scaled plan dimensions and photographed exterior details are preserved in the editable Blender source; the restored ell interior is not inferred from the obsolete pre-restoration plan.
