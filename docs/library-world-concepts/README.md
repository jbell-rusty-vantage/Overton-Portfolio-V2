# Two worlds for John Overton’s Library

**Decision for John** · November 11, 2026 · Concept art and proposed visitor behavior

I recommend **The Octagon at Night** as the front door to the portfolio. It gives a first-time visitor a reason to pick up an engineering project and a reason to remember the person who built it. **The Library Under the Stand** is my choice if you want someone to spend their first ten seconds watching football and discover your engineering work through the way you study a play.

## A · The Octagon at Night

![A lamp-headed archivist opens a folio in a rain-lit octagonal library.](octagon-at-night.png)

### The Night Archivist and the last showing

The front desk has a book resting on felt and a little brass bell. Ring it and a single reading lamp rises above the shelves. The lamp is the Archivist’s head. It turns toward you, draws out *Mission Control* with both hands and carries it to the lectern. You can follow or select **Meet me at the book**. The room goes quiet when the cover opens.

1. **Read.** The Archivist slips one finger under a folded sheet and leaves the rest to you. Pull its brass tab to unfold the route from a mission manifest to a judged result. Touch the verifier to read what decides whether a run succeeded. Drag the page by its corner, use the arrow keys or open the same spread as selectable text. The lamp follows your place. The guide waits as long as you read.
2. **See it run.** A small still on the gallery page is the first frame of the real Mission Control reel. Choose **Take this to the desk**. The Archivist leaves a ribbon on that spread. The main monitor plays the 19-second recording on request. The side monitor carries the matching case-study still and caption. You can inspect it, replay the reel, or return to the marked page.
3. **Attend the last showing.** A film ticket is waiting beside the keyboard. Accept it and the lamps dim in sequence down to the screening bay. A second custodian, *The Number Ten*, is an imagined guest host for a Pelé tribute. A single gold numeral on the reel leader introduces the screening. *“Keep the whole goal in view,”* the host says. *“Watch it once before we talk about it.”* The title card credits **John Overton · Wellington vs. Royal Palm · Free-kick winner**. The linen screen fills with the original 22-second night film, including the floodlights and the touchline. The room stays quiet through the strike.
4. **Leave with a choice.** When the film ends, the projectionist holds the closing frame. **Watch again**, **Thread the Gun Club double** and **Return to my page** are within reach. The little click of the projector stopping is the end of the guided visit.

The historical reference is Pelé’s association with the number ten. The guest host’s lines are written for this experience and credited to the fictional host. The match, performance and film captions belong to John. [FIFA on Pelé and the number ten](https://inside.fifa.com/fr/tournaments/mens/worldcup/1970mexico/news/joyeux-anniversaire-pele-80-ans-de-passion-et-de-genie)

## B · The Library Under the Stand

![An enamel projector cart in a daylight library under stadium terraces, with match film on a whitewashed wall.](library-under-the-stand.png)

### The Kit Keeper and the Saturday edit

You enter through the players’ tunnel the morning after a match. Sunlight cuts a white line across the green worktable. Above you, the underside of the terrace steps forms the ceiling. Below each step is another shelf of clothbound field notebooks. A battered green library trolley rolls into the light. It carries books on the bottom shelf and a working projector on top. This is the Kit Keeper. Put a film can on it and it becomes your guide.

1. **Start with the play.** The visitor can choose **Just watch** or **Read the pitch**. Open the Gun Club double and the first goal plays at match speed. For the tactical replay, the Keeper sets down an orange magnetic **14**. It is the guest coaching voice for a Johan Cruyff tribute. The reel stops at an editor-selected frame before the decisive action. The coach asks, *“Where would you want the ball next?”* Tap a patch of grass or use a keyboard choice, then release the frame. Your chalk mark remains on the board beside the original footage. There is no score for guessing. The second goal is available on the next reel.
2. **Read the field notebook.** The Keeper stamps the chosen frame onto a paper match card. A note on the back asks, *“Want to see how John studies something too large to watch in one sitting?”* The trolley opens a drawer containing *AI Engineer Research Library*. Leaf through a real research brief example from the project’s gallery. Unfold the architecture page to trace how talks become sourced briefs. Tabs let you enter at **Talk**, **Brief** or **Sources** and move between them in any order.
3. **Work the edit desk.** Put the notebook on the scanner. The main monitor loads the project’s 18-second walkthrough. The side monitor holds a still from its gallery. Pin a still and it stays visible while you scrub or change screens. A keyboard-accessible **Compare** control performs the same action as placing the paper on the scanner.
4. **Call the final reel.** The Keeper rolls to the wall and offers you the Royal Palm free kick. Watch it clean, or return to the board for another tactical reading. The ticket you take out through the tunnel links to the project and the match you chose.

The Cruyff reference invites visitors to look away from the ball, inspect space and see a decision unfold. Any on-film arrows or freeze frames would be authored against John’s actual clips. The original coaching prompts belong to the imagined guide. [Barça Innovation Hub on Cruyff’s use of space](https://barcainnovationhub.fcbarcelona.com/blog/do-players-run-less-when-their-team-is-in-possession-of-the-ball/)

## How the chosen world would run

**Timing.** A showcase is an ordered set of specific book spreads, monitor states and film cues. Opening a spread enables the relevant demonstration. Accepting the ticket prepares the projector. Pressing play starts the clip clock. Pause and seek also pause and seek any annotations. Reading time is always the visitor’s. An optional opening and closing date can select a featured program for an event. Its stops still advance at the visitor’s pace. Missing or withdrawn stops drop out of the public sequence.

**Navigation.** Both worlds support a guided visit and direct entry to each book, workstation or screening. Leaving a station pauses its media. Returning restores the page or playback position. Reduced-motion visitors can cut straight to a station and use ordinary text and video controls, including captions. The scripted custodians can run the whole show without a model call.

**3D production.** Use the installed Blender 5.2.2 to author the book, rig the custodians and light the room. Build the props at the scale the camera actually sees them. In A, spend the close-up detail on the thumb against the folio and the shadow in the gutter. In B, spend it on the chalk mark lining up with the original film when playback resumes. Use Cycles for stills and static light bakes, with licensed CC0 surface scans from Poly Haven for wood, paper or concrete where suitable. Keep editable sources and material provenance with the project. [Blender Cycles baking](https://docs.blender.org/manual/en/latest/render/cycles/baking.html) · [Poly Haven asset license](https://polyhaven.com/license)

**Browser delivery.** Use the project’s existing Three.js and React Three Fiber scene, the GLB anchor contract and Meshopt packing. Add KTX2 textures where measurements justify them. Trial the Three.js WebGPU renderer and its WebGL2 fallback on the book curl and on actual projected video before choosing the default. Play a single video stream per active station and offer the same clip in a native player. For the full world, the Octagon brief’s targets are 25 MB to first interaction on desktop, 8 MB on phone, and 60/30 fps respectively with the book open. Actual device measurements are part of qualification. [Three.js renderer guide](https://threejs.org/manual/pages/webgpurenderer) · [Three.js KTX2 loader](https://threejs.org/docs/pages/KTX2Loader.html)

## What approval unlocks

The source collection contains fourteen authored volumes and six project recordings. The match library includes the two Gun Club goals and the Royal Palm winner, each with a poster. The November 10 Octagon brief records the fourteen volumes as seeded and hidden. The current match catalog points to local public files. Live Postgres contents and Blob inventory need to be reconciled for the selected program. [Existing Octagon brief](../OCTAGON_BRIEF.md) · [Collection source](../../content/library/books.mjs) · [Match catalog](../../lib/performances.ts)

After the choice, the setup deliverable is a repeatable draft seed for the selected program, a versioned Blob asset inventory and a runbook for GPT‑6 Extra High or Ultra. Postgres owns the stop order, spread, screen roles, caption references, timecodes, visibility and optional event window. Blob holds the approved delivery files. Existing project records, media and stable room and shelf identities are reused. The seed accounts for a public Blob being directly readable even when its database row is hidden.

The runbook starts with one verifiable journey using the real assets. For A, the reader can leave the Mission Control architecture spread, watch its reel, play the Royal Palm winner and return to the same spread. For B, the visitor can mark a Gun Club replay, read the research-library notebook and compare its real walkthrough with a pinned gallery still. The handoff specifies the cameras, custodian gestures, content sources, lighting references and desktop, phone and keyboard checks needed to reproduce that journey.

*The two images are original ImageGen concept studies. Their projected frames and book illustrations establish the art direction. The running showcases would use the portfolio’s actual project pages, screenshots and match film.*

<details>
<summary>Concept art prompts used in the built-in ImageGen tool</summary>

**The Octagon at Night**

> Architectural editorial photograph, cinematic 16:9 landscape design keyframe of 'The Octagon at Night', a two-storey octagonal walnut library at midnight, rain on high leaded windows, green-shaded brass reading lights, warm golden shelf bays and slate-blue moonlight. Foreground in sharp grazing lamplight: an open massive cloth-bound engineering folio at a low lectern, cream engraved systems-diagram foldout and burgundy ribbon; beside it a modest, beautifully made jointed walnut and brass librarian automaton with a single small glass lamp for a face, in the act of easing the book open with gentle articulated hands, not steampunk costume. Further away to the side, a twin-monitor desk neatly recessed into old oak; through a little opening in the far bay, a glowing linen projection screen showing an indistinct football pitch. Asymmetric eye-level composition like a fine interiors photograph, restrained color, tactile paper and pools of light, inviting space, enough exposure to read the architecture. Original render reference for a web portfolio, no titles, watermark, interface or legible text.

**The Library Under the Stand**

> Wide landscape 16:9 architectural photograph of a remarkable library tucked underneath the sloping east grandstand of a modest European football ground, midmorning after a match. Low sawtooth underside of stepped concrete terraces is the ceiling, above blond oak library shelves. A tunnel at the left ends in an intense horizontal strip of sunlit green grass, empty red terrace seats and white touchline. Foreground large green linoleum cutting table with open linen coaching folio, physical paper tabs, magnetic tactics pieces, and a strip of annotated black-and-white contact print frames. The friendly custodian is a wonderfully practical original waist-high rolling green enamel book cart with a 16mm cine-projector head, spoked rubber wheels and brass adjustable lens; its strongest visual gesture is projecting a single big freeze frame of anonymous amateur football onto a whitewashed concrete wall in a shaded alcove to the right. The booth contains two small functional video editing monitors alongside shelves of bound match programmes. Crisp daylight, chalk, scratched enamel, restrained orange accents. Strong diagonal composition and natural perspective, intimate and attainable physically based render for an interactive portfolio. The building should unmistakably be both a library and beneath stadium seating; avoid giant arenas, crowds, fantasy robots, captions, watermark, logo or interface.

</details>
