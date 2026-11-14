"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Modal from "@/components/library/Modal";
import { getGame } from "@/lib/performances";
import StudyCollection from "./StudyCollection";

const HouseModel = dynamic(() => import("./HouseModel"), {
  ssr: false,
  loading: () => <p className="tr-fallback">Opening the model…</p>,
});
const base = "/travellers-rest/";
const museum = "https://www.historictravellersrest.org/history/";
const survey =
  "https://tile.loc.gov/storage-services/master/pnp/habshaer/tn/tn0000/tn0036/data/tn0036data.pdf";
const sources = [
  {
    title: "The house survey",
    org: "National Park Service · HABS TN-14",
    url: survey,
    detail:
      "Construction history, materials, first-floor plan and south elevation. The plan on printed page 8 names the library.",
  },
  {
    title: "The south front",
    org: "Library of Congress · Jack E. Boucher",
    url: "https://www.loc.gov/pictures/item/tn0036.photos.152680p/",
    detail: "The survey photograph used for the approach.",
  },
  {
    title: "Inside the southwest room",
    org: "Library of Congress · Jack E. Boucher",
    url: "https://www.loc.gov/pictures/item/tn0036.photos.152686p/",
    detail:
      "The west-facing interior view used to study the mantel, dado and door.",
  },
  {
    title: "The judge and his books",
    org: "Travellers Rest Historic House Museum",
    url: museum + "nashville-from-frontier-to-home-of-the-u-s-president",
    detail:
      "The museum identifies the Tennessee Reports, Pope’s Works and a pewter inkwell in its collection.",
  },
  {
    title: "John Overton",
    org: "Theodore Brown, Jr. · Tennessee Historical Society",
    url: "https://tennesseeencyclopedia.net/entries/john-overton/",
    detail:
      "Overton’s law library, his friendship with Jackson and his work on the presidential campaigns.",
  },
  {
    title: "The first residents",
    org: "Travellers Rest Historic House Museum",
    url: museum + "the-first-residents-of-historic-travellers-rest",
    detail:
      "The Mississippian community that occupied this land centuries before the house.",
  },
  {
    title: "A Past Uncovered",
    org: "Travellers Rest Historic House Museum",
    url: museum + "a-past-uncovered",
    detail:
      "The lives and skilled work of people enslaved on the Overton property.",
  },
  {
    title: "The John Overton papers",
    org: "Tennessee State Library and Archives",
    url: "https://tsla.tnsosfiles.com/history/manuscripts/findingaids/MURDOCK_COLLECTION_OF_JOHN_OVERTON_PAPERS_1780-1797-1820-1908.pdf",
    detail:
      "The finding aid identifies an 1827 confidential letter to Willie Blount on Jackson’s prospects for the presidency.",
  },
];
const stops = [
  {
    id: "approach",
    label: "The approach",
    title: "Travellers Rest",
    eyebrow: "Nashville, Tennessee",
    copy: "My relative, Judge John Overton, made his home here in 1799. Come through the south door to the library.",
    note: "Start at the portico. The south door opens onto the center hall.",
    action: "Enter the house",
    image: "south-front.webp",
    alt: "The south front of Travellers Rest with a pedimented porch, clapboard siding and shuttered sash windows.",
    plate: "The south front, from the southeast",
    credit: "Jack E. Boucher · Historic American Buildings Survey",
  },
  {
    id: "entry",
    label: "The entry hall",
    title: "Across the threshold",
    eyebrow: "The Federal house",
    copy: "Overton began the house in 1799. Later additions gave it the long rear wing visible on the survey plan.",
    note: "Find Entry on the plan. With the south door behind you, the library is on your left and the parlor on your right.",
    action: "Step into the library",
    image: "survey-plan.webp",
    alt: "First-floor survey plan. The library occupies the southwest corner beside the entry, across from the parlor.",
    plate: "First floor, with the south entrance at right",
    credit: "HABS TN-14 · First-floor plan, detail · Printed page 8",
  },
  {
    id: "library",
    label: "The library",
    title: "The judge’s library",
    eyebrow: "The southwest room",
    copy: "By 1808, Overton owned about 160 law books. He gathered decisions from Tennessee’s courts and helped turn them into reports that other lawyers could consult.",
    note: "At the writing table there’s a short companion to the house and the people who lived here.",
    action: "Open the house book",
    image: "reading-room.jpg",
    alt: "Interpretive model of the southwest library with the west mantel, bound books, writing table and pewter inkwell.",
    plate: "The library, looking toward the west mantel",
    credit: "Blender study · Furnishings and color interpreted",
  },
] as const;
const leaves = [
  {
    title: "Before the house",
    subtitle: "The land",
    text: "A Mississippian community lived here centuries before the Overton house. Archaeology gives the site a history much longer than the life of the building.",
    note: "Visit the museum’s account of the first residents",
    object: "first-residents",
    objectLabel: "Examine the ceramic bowl record",
    source: 5,
  },
  {
    title: "The hands that built it",
    subtitle: "The household",
    text: "Enslaved people helped build Travellers Rest and worked throughout the estate. The museum documents skilled brickmakers, weavers, blacksmiths and cooks. Its research preserves names and fragments of lives that the surviving records reveal.",
    note: "Explore A Past Uncovered",
    object: "william-franklin",
    objectLabel: "Read about William and Franklin",
    source: 6,
  },
  {
    title: "A judge and a campaign",
    subtitle: "The correspondence",
    text: "John Overton and Andrew Jackson practiced law in early Nashville and became close friends. Overton helped organize support for Jackson’s presidential bid and wrote a defense of his marriage during the 1828 campaign.",
    note: "Read the Tennessee Historical Society biography",
    object: "election-invitation",
    objectLabel: "Examine the 1828 invitation",
    source: 4,
  },
  {
    title: "A reader’s working life",
    subtitle: "The law reports",
    text: "Overton kept handwritten records of court decisions. The first two volumes of the Tennessee Reports grew out of this work. The museum also identifies Pope’s Works and a pewter inkwell among the objects in its collection.",
    note: "See the museum’s account of the books",
    object: "murfree-leeper",
    objectLabel: "Examine a Tennessee Reports page",
    source: 3,
  },
];
const steps = [
  "approach",
  "entry",
  "library",
  ...leaves.map((_, i) => "leaf-" + (i + 1)),
  "cabinet",
];
const numerals = ["I", "II", "III", "IV"];
function locationStep() {
  const s = window.location.hash.slice(1);
  return steps.includes(s) ? s : steps[0];
}
function subscribe(back: () => void) {
  window.addEventListener("hashchange", back);
  return () => window.removeEventListener("hashchange", back);
}
function go(step: string) {
  window.location.hash = step;
}

function Portico() {
  return (
    <svg
      viewBox="0 0 37 36"
      width="33"
      height="33"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M2 14 18.5 5 35 14H2Zm4 2h25M5 30h27M3 33h31M8 17v12m3-12v12m15-12v12m3-12v12M15 29V18h7v11" />
    </svg>
  );
}
function Arrow({ reverse = false }: { reverse?: boolean }) {
  return <span aria-hidden="true">{reverse ? "←" : "→"}</span>;
}
function SurveyImage({ file, alt }: { file: string; alt: string }) {
  // Photographic plates include the archival border and keep their original aspect ratio.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={base + file} alt={alt} />;
}

function Station({
  index,
  examine,
}: {
  index: number;
  examine: (id: string) => void;
}) {
  const stop = stops[index];
  const [mode, setMode] = useState<"plate" | "model" | "reference">("plate");
  const [turn, setTurn] = useState(0);
  const model = index === 0 ? "house" : "library";
  const next = steps[index + 1];
  return (
    <div className="tr-station">
      <div className="tr-intro">
        <p className="tr-kicker">
          <i />
          {stop.eyebrow}
        </p>
        <h1 tabIndex={-1}>{stop.title}</h1>
        <p className="tr-deck">{stop.copy}</p>
        <button className="tr-primary" onClick={() => go(next)}>
          {stop.action}
          <Arrow />
        </button>
        <div className="tr-guide">
          {index === 2 ? (
            <button
              className="tr-portrait-label"
              onClick={() => examine("judge-overton")}
            >
              <SurveyImage file="archive/judge-overton.webp" alt="" />
              <span>
                <small className="tr-small">The custodian</small>Judge John
                Overton <span aria-hidden="true">↗</span>
              </span>
            </button>
          ) : (
            <span className="tr-small">From the custodian</span>
          )}
          <p>{stop.note}</p>
        </div>
      </div>
      <figure className="tr-figure">
        <div className={"tr-frame tr-frame-" + index}>
          {mode === "model" ? (
            <HouseModel model={model} turn={turn} enter={() => go(next)} />
          ) : (
            <SurveyImage
              file={mode === "reference" ? "southwest-room.webp" : stop.image}
              alt={
                mode === "reference"
                  ? "Survey photograph of the west fireplace, cabinet and door in the southwest room."
                  : stop.alt
              }
            />
          )}
          {mode === "model" && (
            <div className="tr-rotations">
              <button
                aria-label="Rotate left"
                onClick={() => setTurn((n) => n - 1)}
              >
                ↶
              </button>
              <button
                aria-label="Rotate right"
                onClick={() => setTurn((n) => n + 1)}
              >
                ↷
              </button>
            </div>
          )}
        </div>
        <figcaption>
          <div>
            <span className="tr-small">Plate {numerals[index]}</span>
            <strong>
              {mode === "model"
                ? index === 0
                  ? "The house in three dimensions"
                  : "The library in three dimensions"
                : mode === "reference"
                  ? "First floor, southwest room looking west"
                  : stop.plate}
            </strong>
            <small>
              {mode === "model"
                ? index === 0
                  ? "Drag to look around · Select the front door to enter"
                  : "Drag to look around · Select the writing table to read"
                : mode === "reference"
                  ? "Jack E. Boucher · Historic American Buildings Survey"
                  : stop.credit}
            </small>
          </div>
        </figcaption>
        {index < 2 && (
          <button
            className="tr-object-link"
            onClick={() => examine(index === 0 ? "house-color" : "center-hall")}
          >
            {index === 0
              ? "View the house in 2021"
              : "View the center hall photograph"}{" "}
            ↗
          </button>
        )}
        {index !== 1 && (
          <div className="tr-modes" aria-label="View this plate">
            <button
              aria-pressed={mode === "plate"}
              onClick={() => setMode("plate")}
            >
              {index === 0 ? "Survey photograph" : "Room study"}
            </button>
            {index === 2 && (
              <button
                aria-pressed={mode === "reference"}
                onClick={() => setMode("reference")}
              >
                Survey photograph
              </button>
            )}
            <button
              aria-pressed={mode === "model"}
              onClick={() => setMode("model")}
            >
              Explore in 3D
            </button>
          </div>
        )}
      </figure>
    </div>
  );
}

function HouseBook({
  n,
  examine,
}: {
  n: number;
  examine: (id: string) => void;
}) {
  const leaf = leaves[n];
  return (
    <div className="tr-reading">
      <div className="tr-book-title">
        <p className="tr-kicker">
          <i />
          At the writing table
        </p>
        <h1 tabIndex={-1}>The house book</h1>
        <p>A visitor’s companion to Travellers Rest</p>
      </div>
      <article className="tr-open-book">
        <div className="tr-verso">
          <span className="tr-small">Travellers Rest</span>
          <span className="tr-numeral">{numerals[n]}</span>
          <p>{leaf.subtitle}</p>
        </div>
        <div className="tr-recto">
          <span className="tr-small">
            A house companion · Leaf {n + 1} of 4
          </span>
          <h2>{leaf.title}</h2>
          <p>{leaf.text}</p>
          <button
            className="tr-object-link"
            onClick={() => examine(leaf.object)}
          >
            {leaf.objectLabel} ↗
          </button>
          <a href={sources[leaf.source].url} target="_blank" rel="noreferrer">
            {leaf.note} ↗
          </a>
        </div>
      </article>
      <div className="tr-book-nav">
        <button
          className="tr-plain"
          onClick={() => go(n === 0 ? "library" : "leaf-" + n)}
        >
          <Arrow reverse />
          {n === 0 ? "Back to the room" : "Previous leaf"}
        </button>
        <button
          className="tr-primary"
          onClick={() => go(n === 3 ? "cabinet" : "leaf-" + (n + 2))}
        >
          {n === 3 ? "Open the family cabinet" : "Turn the page"}
          <Arrow />
        </button>
      </div>
    </div>
  );
}

function Cabinet() {
  const [show, setShow] = useState<null | "desk" | "film">(null);
  const [screen, setScreen] = useState<"main" | "side">("main");
  const clip = getGame("wellington-mens-vs-royal-palm")?.clips.find(
    (c) => c.id === "free-kick-winner",
  );
  return (
    <div className="tr-cabinet">
      <p className="tr-kicker">
        <i />
        Present day · The owner’s collection
      </p>
      <h1 tabIndex={-1}>The family cabinet</h1>
      <p className="tr-deck">
        John Overton, the portfolio owner, identifies Judge Overton as a
        relative. This cabinet brings the visit forward to John’s own work and
        match film.
      </p>
      <div className="tr-drawers">
        <button
          onClick={() => {
            setScreen("main");
            setShow("desk");
          }}
        >
          <span className="tr-small">The work desk</span>
          <strong>Mission Control</strong>
          <span>
            Open two screens <Arrow />
          </span>
        </button>
        {clip && (
          <button onClick={() => setShow("film")}>
            <span className="tr-small">The projection room</span>
            <strong>The Royal Palm reel</strong>
            <span>
              Thread the projector <Arrow />
            </span>
          </button>
        )}
      </div>
      <button className="tr-plain" onClick={() => go("leaf-4")}>
        <Arrow reverse /> Return to the marked leaf
      </button>
      {show && (
        <Modal
          title={show === "desk" ? "The work desk" : "The projection room"}
          wide
          onClose={() => setShow(null)}
        >
          <div
            className={"tr-exhibit " + (show === "film" ? "tr-projection" : "")}
          >
            <span className="tr-small">
              {show === "desk" ? "The work desk" : "The projection room"} ·
              Present day
            </span>
            <h2>
              {show === "desk"
                ? "Mission Control"
                : "Wellington vs. Royal Palm"}
            </h2>
            {show === "desk" ? (
              <>
                <div className="tr-modes">
                  <button
                    aria-pressed={screen === "main"}
                    onClick={() => setScreen("main")}
                  >
                    Main screen · Reel
                  </button>
                  <button
                    aria-pressed={screen === "side"}
                    onClick={() => setScreen("side")}
                  >
                    Side screen · Case study
                  </button>
                </div>
                {screen === "main" ? (
                  <video
                    controls
                    playsInline
                    preload="none"
                    poster="/library/artwork/agentic-mission-control-reel-poster.webp"
                    src="/library/recordings/agentic-mission-control-reel.mp4"
                    aria-label="Mission Control project reel"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    alt="Mission Control project case study"
                    src="/library/artwork/agentic-mission-control-case-study.webp"
                  />
                )}
              </>
            ) : (
              clip && (
                <>
                  <video
                    controls
                    playsInline
                    preload="none"
                    src={clip.src}
                    poster={clip.poster}
                    aria-label="John Overton’s free-kick winner"
                  />
                  <p>
                    John Overton · The match-winning free kick, filmed under the
                    lights.
                  </p>
                </>
              )
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Visit() {
  const step = useSyncExternalStore(subscribe, locationStep, () => steps[0]);
  const [notes, setNotes] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const lastStep = useRef(step);
  useEffect(() => {
    if (lastStep.current !== step) {
      lastStep.current = step;
      content.current?.querySelector("h1")?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [step]);
  const index = steps.indexOf(step);
  return (
    <main className="tr-visit">
      <header className="tr-head">
        <div className="tr-wrap tr-head-in">
          <a href="#approach" className="tr-wordmark">
            <Portico />
            <span>
              Overton <em>House Archive</em>
            </span>
          </a>
          <nav aria-label="Visit resources">
            <a href="#approach">House visit</a>
            <button onClick={() => setArchiveId("judge-overton")}>
              Collection
            </button>
            <button onClick={() => setNotes(true)}>
              Sources <span aria-hidden="true">↗</span>
            </button>
          </nav>
        </div>
      </header>
      <div className="tr-wrap">
        <div className="tr-running">
          <span>John Overton’s portfolio</span>
          <span>Davidson County, Tennessee</span>
        </div>
        <div ref={content}>
          {index < 3 ? (
            <Station key={step} index={index} examine={setArchiveId} />
          ) : index < 7 ? (
            <HouseBook n={index - 3} examine={setArchiveId} />
          ) : (
            <Cabinet />
          )}
        </div>
        <nav className="tr-itinerary" aria-label="Visit stops">
          {[
            "The approach",
            "The entry hall",
            "The library",
            "The house book",
          ].map((s, i) => (
            <a
              key={s}
              href={"#" + steps[i]}
              aria-current={
                index === i || (i === 3 && index >= 3) ? "step" : undefined
              }
            >
              <span className="tr-small">{numerals[i]}</span>
              <span>{s}</span>
            </a>
          ))}
        </nav>
        <footer className="tr-foot">
          <span>Travellers Rest · A portfolio study</span>
          <button onClick={() => setNotes(true)}>
            Historical &amp; architectural notes ↗
          </button>
        </footer>
      </div>
      {archiveId && (
        <StudyCollection initial={archiveId} close={() => setArchiveId(null)} />
      )}
      {notes && (
        <Modal
          title="Sources and interpretation"
          wide
          onClose={() => setNotes(false)}
        >
          <div className="tr-sources">
            <p className="tr-small">Field notes</p>
            <h2>Sources and interpretation</h2>
            <p>
              This independent portfolio study follows the restored house
              recorded in the federal survey. The library’s location is
              documented. The desk, bindings, placement and colors are
              interpretive. The custodian’s likeness comes from Earl’s 1817
              portrait of Judge John Overton. Guide directions are written for
              this visit.
            </p>
            <ol>
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.title} ↗
                  </a>
                  <small>{s.org}</small>
                  <p>{s.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </Modal>
      )}
    </main>
  );
}
