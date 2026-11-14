# Travellers Rest · owner review

**Superseded as the default, November 12, 2026.** The owner’s review identified fragmentation between the rooms, portrait, books and cabinet. The continuous 3D library that answers it is now the default in the private preview: see [the continuous library review](TRAVELLERS_REST_CONTINUOUS.md). The pages described below remain as the plain view and as the fallback when 3D cannot start; their evidence describes the first, guided edition.

[Open the complete private portfolio](http://127.0.0.1:3078/admin/library/preview) · [Go directly to all fourteen projects](http://127.0.0.1:3078/admin/library/preview#cabinet) · [Watch the 27-second walkthrough](travellers-rest-review/guided-visit.mp4)

The south door opens into the central hall. The southwest library holds Earl’s portrait, the Tennessee Reports and the marked house book. The last leaf opens John’s present-day cabinet. **View my portfolio** on the entrance goes straight to the same cabinet. The built website and the seeded edition are ready for private review. The hosted portfolio has not been released.

![The restored south front as interpreted for the portfolio entrance](travellers-rest-review/entrance.webp)

## A visit through the house and John’s work

| Stop | What to try |
| --- | --- |
| South front and hall | Choose **Enter the house** for the illustrated rooms, or **Visit guide → Start the 3D walk** for the continuous model. Use W and S to move along the route, the arrow keys or a drag to look around, and **Skip travel** to arrive immediately. Compare the rooms with Boucher’s survey photographs and the first-floor plan. |
| Portrait and reports | Choose **Meet Judge Overton**. The archival still holds briefly before the eyes, head and shoulder move toward the visitor and back to the reports. Pause, resume, skip or enable the interpretive voice. The reports open the court-reporting leaf and a facsimile of *Murfree v. Leeper*. Reduced motion keeps the original still and all reading choices. [Portrait](travellers-rest-review/custodian.webp) · [Interactive writing table](travellers-rest-review/writing-table.webp) |
| House book | Read the four leaves in either direction. Examine the early community’s bowl, the records of William and Franklin, the 1828 victory-ball invitation and the first printed case. Source dialogs return focus to their opening controls. The reader remembers a stable leaf key on the device. [Reading spread](travellers-rest-review/house-book.webp) · [Phone entrance](travellers-rest-review/phone.webp) |
| Family cabinet | Search fourteen project volumes in the private office. Open sections such as Architecture, read project evidence, or follow **Full reading page**. The Mission Control work desk remembers the reel or its case-study screen. [Cabinet](travellers-rest-review/cabinet.webp) · [Full project collection](travellers-rest-review/complete-cabinet.webp) · [Project reader](travellers-rest-review/project-reader.webp) |
| Projection room | Select the Royal Palm drawer to prepare the poster. Play starts the owner’s recording. Switch between native playback and the Three.js projection, pause, seek and read the timed descriptions. Closing the room stops the film. [Screening](travellers-rest-review/screening.webp) |

The house is the **enlarged, restored building surveyed in 1970**, begun in 1799. The measured plan locates the southwest library, west hearth, entry and stair. The detailed photographic-style room plates use AI-assisted interpretation. The continuous architectural model, lighting, furnishings, portrait performance and newly written guide voice are separate creative work. The historical sources identify Judge Overton as the reporter of the case. The portfolio owner identifies him as a relative. [HABS survey](https://www.loc.gov/item/tn0036/) · [Earl portrait record](https://teva.contentdm.oclc.org/digital/collection/p15138coll33/id/285/) · [House book and citations](../content/travellers-rest/companion.json) · [Curatorial catalog](../assets/travellers-rest/archive/README.md) · [Plate credits and generation prompts](travellers-rest-review/artwork.md)

## Measured delivery

Chrome 157.0.8103.52 ran the optimized production build against disposable PostgreSQL-compatible storage. The house models and film came from the verified public Blob objects. Each row used a fresh browser context. The desktop viewport was 1366 × 860 at 1×. Phone emulation used 390 × 844, touch enabled, 2× device scale and the same workstation’s AMD Radeon RDNA 2 GPU. These are emulated-phone measurements. A physical phone has not been measured.

| Device and actual backend | Cold entrance transfer | Total transfer at open book | GLB transfer | Page-turn mean fps | Page-turn p95 | Projected video p95 | Dropped / decoded video frames |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop · WebGL 2 | 931,989 B | 2,125,432 B | 875,643 B | 60.0 | 16.8 ms | 34.0 ms | 2 / 109 |
| Desktop · WebGPU | 931,993 B | 2,298,160 B | 875,643 B | 60.0 | 16.8 ms | 49.7 ms | 1 / 109 |
| Emulated phone · WebGL 2 | 546,166 B | 1,177,278 B | 313,312 B | 59.3 | 16.8 ms | 33.4 ms | 0 / 108 |
| Emulated phone · WebGPU | 546,169 B | 1,349,995 B | 313,302 B | 60.0 | 16.8 ms | 33.5 ms | 0 / 108 |

Six real link activations changed the accessible spread and animated a textured leaf on the Blender desk. Frame intervals were sampled between display ticks that contained WebGL draws or WebGPU submissions. Video used 3.6 seconds of decoded match footage on a Three.js texture. The frame intervals describe browser presentation cadence and include the work of preparing each new leaf. Transfer totals use Chrome’s network events. The WebGPU rows include the renderer switch from the default WebGL 2. [Raw measurements](travellers-rest-review/performance.json) · [Measurement code](../scripts/profile-estate.mjs)

**WebGL 2 is the default.** Both renderers met the book targets in this rehearsal. WebGL 2 had the smaller initial renderer payload and the lower desktop video p95. The manual selector keeps WebGPU available. The entrance loads photographic plates first. The model loads on request, uses the compact tier at widths up to 700 CSS pixels, caps renderer pixel ratio at 1.5 and renders on demand. The combined house exports contain 39,302 triangles in 1,342,780 bytes and 35,991 triangles in 770,544 bytes. Both have twelve registered anchors, a custodian animation, and zero Khronos validation errors or warnings. Blender reopened the editable source with its architectural collections, four portrait shape keys and seven packed images. [Editable Blender scene](../assets/travellers-rest/Travellers%20Rest%20-%20guided.blend) · [Model validation](../assets/travellers-rest/delivery.json)

## Draft seed and publication list

The guarded importer verified all **32 public delivery files** by downloading them and comparing SHA-256 before linking them in PostgreSQL. They total 12,200,512 bytes. The initial transaction inserted 46 content and placement rows, wrote 46 audit records and created 43 revisions. A second apply reused all 32 Blob objects and inserted zero rows. A subsequent read-only plan was empty. The original models, full archival masters and authoring sources stayed in the checkout. [Database readback and seed diff](travellers-rest-review/seed-diff.json) · [Blob URLs, hashes, credits and sizes](../content/travellers-rest/blob-manifest.json)

| Item | Current state | What makes it visitor-visible |
| --- | --- | --- |
| Site code | Local production build verified, hosted release pending the owner’s decision | Deploy the reviewed changes through the portfolio’s existing Vercel workflow. The editorial entrance and the publicly credited historical collection are part of the website. |
| Historical companion and four rooms | One hidden book with four authored leaves and one writing-table placement. All four rooms hidden. | In the library editor, save **Travellers Rest → Published guided visit**. This also activates both named scene versions in one transaction. Optional UTC start/end settings govern when the guided program is featured. |
| House scenes | Detailed and compact version 1 both inactive | The same release action validates both remote GLBs and their anchors before enabling them. Selecting **Hidden draft** withdraws the program. |
| Project books | All fourteen project/book pairs hidden | Release each desired project and its linked book using their existing publication controls. A hidden or withdrawn project drops out of the cabinet and its direct visitor reader. |
| Mission Control and match film | Layout edition 1 contains two project-screen cues and one opt-in clip | A released house program enables the film drawer. Mission Control’s own visibility also gates its work desk. The original hall keeps its global main feed and side iframe. |
| Public Blob derivatives | Already uploaded with immutable versioned names | A direct Blob URL serves the approved delivery file. Visitor discovery and the guided experience follow the database settings above. |

The full local cabinet contains Knowledge Services, Mission Control, The Library, Vantage Movers, AI Engineer Platform, AI Engineer Research Library, GoWipe, Overtech Digital Services, Biotech Knowledge Platform, Daryl Davis, Polymarket MCP Server, Biotech Research Ingestion, Lead Analytics and Podcast Ingestion Pipeline. The real visitor projection returned zero projects and rejected the hidden direct catalog links. The isolated release rehearsal exercised both date bounds, publication, project withdrawal and house withdrawal, and compared the global screens before and after. [Live visibility check](travellers-rest-review/live-visibility.json) · [Local publication controls](http://127.0.0.1:3078/admin/library#travellers-rest)

## Reopen and verify

The production build, typecheck, five library contract tests and twenty browser journeys passed. The journeys include a single 3D camera-to-portrait-to-book-to-screening visit, a missing house model, failed film playback, reduced motion, keyboard focus, reload and bookmark recovery. The entrance passed the automated WCAG A/AA checks in the browser suite. The authenticated production editor and sessionless loopback office were exercised with disposable databases. Lint completed with its existing unused binding warning in the older library content builder.

Run `npm run admin:local` from the project root to reopen the full private office on port 3078. The separate `npm run preview:library` on port 3077 admits the two established review projects, Mission Control and Knowledge Services. The earlier architectural study remains available for comparison. [Complete draft](http://127.0.0.1:3078/admin/library/preview) · [Two-project visit](http://127.0.0.1:3077/dev/travellers-rest) · [Original study](http://127.0.0.1:3077/dev/travellers-rest?study=1)

```powershell
npm run typecheck
npm run lint
npm test
npm run build:local
npm run test:browser
npm run test:admin -- --profile-estate
npm run test:office
node --env-file=.env --env-file=.env.local scripts/seed-estate.mjs
```

The last command is a read-only plan. The importer’s explicit `--apply` option verifies the named store and approved objects and writes only its scoped records. Local import uses `DATABASE_URL`, `BLOB_STORE_ID` and `BLOB_READ_WRITE_TOKEN`. The browser never receives those credentials. [Inventory builder](../scripts/estate-inventory.mjs) · [Importer](../scripts/seed-estate.mjs) · [Artist source](../assets/travellers-rest/estate.py) · [Asset packer](../scripts/pack-estate.mjs)
