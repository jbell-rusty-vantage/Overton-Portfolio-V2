"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Modal from "@/components/library/Modal";
import { parseRoute, formatRoute, companionSlug } from "@/lib/estate/world";
import ProjectReport from "@/components/library/ProjectReport";
import { reportNeighbors } from "@/lib/library/report";
import { PortraitPanel } from "@/components/portrait/PortraitPanel";
import { portraitRoute } from "@/lib/estate/visitor-navigation";
import StudyCollection from "./StudyCollection";
import { base, type EstateData, type Room } from "@/lib/estate/model";
import Entrance from "./Entrance";
import Rooms from "./Rooms";
import Collection from "./Collection";
import Cabinet from "./Cabinet";
import HouseBook from "./HouseBook";
import Portrait from "./Portrait";
import { Icon } from "./Marks";
import "./estate.css";
import EstateHeader from "./EstateHeader";

// The continuous 3D library. Loaded only when a visitor enters it.
const World = dynamic(() => import("./world/World"), {
  ssr: false,
  loading: () => (
    <div className="ea-loading">
      <p>Opening the library…</p>
    </div>
  ),
});

const getHash = () => location.hash.slice(1) || "approach";
function onHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener("tw-route", cb);
  return () => { window.removeEventListener("hashchange", cb); window.removeEventListener("tw-route", cb); };
}
function onMemory(cb: () => void) {
  window.addEventListener("estate-memory", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("estate-memory", cb);
    window.removeEventListener("storage", cb);
  };
}
function memory(key: string) {
  try {
    return localStorage.getItem("overton-estate:" + key) ?? "";
  } catch {
    return "";
  }
}
function save(key: string, value: string) {
  try {
    if (memory(key) !== value) {
      localStorage.setItem("overton-estate:" + key, value);
      window.dispatchEvent(new Event("estate-memory"));
    }
  } catch {}
}
const shellHash = () => "approach";
function goToStop(stop: string) {
  window.location.assign(stop.startsWith("#") ? stop : "#" + stop);
}
const empty = () => "";
const getLeaf = () => memory("leaf");
// Where the visitor last stood inside the house, for returning from the entrance.
function getLastRoom() {
  try {
    return sessionStorage.getItem("overton-estate:room") ?? "";
  } catch {
    return "";
  }
}
const getScreen = () => memory("screen");
const guideStops = [
  {
    id: "entry",
    title: "The entry hall",
    note: "Follow the stair and find the southwest room.",
  },
  {
    id: "library",
    title: "The judge’s library",
    note: "Meet the custodian and examine the law reports.",
  },
  {
    id: "collection",
    title: "The historical collection",
    note: "Read maps, manuscripts and museum records.",
  },
  {
    id: "cabinet",
    title: "The family cabinet",
    note: "Visit my work desk and project volumes.",
  },
];

export default function Estate({ data }: { data: EstateData }) {
  const step = useSyncExternalStore(onHash, getHash, shellHash);
  const saved = useSyncExternalStore(onMemory, getLeaf, empty);
  const screen =
    useSyncExternalStore(onMemory, getScreen, empty) === "side"
      ? "side"
      : "main";
  const [mode, setMode] = useState<
    "guide" | "map" | "sources" | "portrait" | null
  >(null);
  const [conversation, setConversation] = useState(false);
  const [conversationCancel, setConversationCancel] = useState(0);
  const ownPlainDestination = useRef("");
  const [object, setObject] = useState<string | null>(null);
  const [walk, setWalk] = useState(false),
    [awake, setAwake] = useState(false),
    [sound, setSound] = useState(false),
    [menu, setMenu] = useState(false);
  // Plain page view: chosen by the visitor, or the fallback when 3D is unavailable.
  const [plain, setPlain] = useState<false | "chosen" | "failed">(false);
  // Choosing "Enter the library" walks in through the south door. Every other way in
  // (a destination, a link, a reload, returning to where you were) arrives directly.
  const [walkIn, setWalkIn] = useState(false);
  const lastRoom = useSyncExternalStore(onMemory, getLastRoom, empty);
  const region = useRef<HTMLDivElement>(null);
  const previous = useRef(step);
  const count = data.program?.book.pages.length ?? 0;
  const rememberedIndex =
    data.program?.book.pages.findIndex((p) => p.key === saved) ?? -1;
  const mark =
    rememberedIndex >= 0
      ? rememberedIndex + 1
      : Math.min(count, Math.max(1, Number(saved) || 1));
  const marked = count ? "#leaf-" + mark : null;
  const leaf = /^leaf-(\d+)$/.exec(step);
  const index = leaf ? Number(leaf[1]) - 1 : -1;
  const reading = !!data.program && index >= 0 && index < count;
  const room: Room | null =
    step === "walk"
      ? "approach"
      : ["entry", "library", "desk"].includes(step)
        ? (step as Room)
        : reading && walk
          ? "desk"
          : null;
  const plainRoute = parseRoute("#" + step, f => f.kind === "book" && f.slug !== companionSlug ? "cabinet" : "desk");
  const plainVolume = plainRoute?.focus?.kind === "book" ? [...data.projects, ...(data.program ? [data.program.book] : [])].find(v => v.slug === (plainRoute.focus as { slug: string }).slug) : undefined;
  useEffect(() => {
    if (ownPlainDestination.current === step) { ownPlainDestination.current = ""; return; }
    setConversationCancel(value => value + 1);
  }, [step]);
  const home = !plainVolume && (
    step === "approach" ||
    (!room && !leaf && !["cabinet", "collection", "landing"].includes(step)));
  const world = data.program?.world ?? null;
  const inWorld =
    !!world && !plain && parseRoute("#" + step, () => "desk") !== null;
  // The older pages keep working without the continuous model.
  const program =
    data.program && world ? { ...data.program, scenes: null } : data.program;
  // The entrance is a captured frame. Scene loading begins only on explicit entry.
  const read = () => {
    setMode(null);
    if (marked) goToStop(marked);
    else setObject("murfree-leeper");
  };
  function openReports() {
    setMode(null);
    const report =
      data.program?.book.pages.findIndex((p) => p.key === "reports") ?? -1;
    if (report < 0) setObject("murfree-leeper");
    else goToStop("leaf-" + (report + 1));
  }
  function destination(href: string) {
    setMode(null);
    setObject(null);
    setMenu(false);
    goToStop(href);
  }
  useEffect(() => {
    function enterStop() {
      if (getHash() === "walk") setWalk(true);
      setMode(null);
      setObject(null);
      setMenu(false);
    }
    if (getHash() === "walk") enterStop();
    return onHash(enterStop);
  }, []);
  const leafKey = reading ? data.program?.book.pages[index].key : null;
  useEffect(() => {
    if (leafKey) save("leaf", leafKey);
    if (previous.current !== step) {
      previous.current = step;
      const heading = region.current?.querySelector<HTMLElement>(
        reading ? ".ea-reading h1" : "h1",
      );
      heading?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [step, reading, leafKey]);
  if (inWorld)
    return (
      <main className="ea ea-in-world">
        <World
          data={data}
          walkIn={walkIn}
          onPlain={(failed) => setPlain(failed ? "failed" : "chosen")}
        />
      </main>
    );
  return (
    <main className="ea">
      <a
        className="ea-skip"
        href="#estate-content"
        onClick={(e) => {
          e.preventDefault();
          region.current?.focus();
        }}
      >
        Skip to content
      </a>
      <EstateHeader subtitle="John Overton Bell’s portfolio" active={step} menu={menu} onNavigate={() => setMenu(false)} actions={<>
            <button className="ea-guide-toggle" onClick={() => { setMode(null); setSound(false); setConversation(true); }}>Ask Judge Overton</button>
            <button
              className="ea-guide-toggle"
              onClick={() => setMode("guide")}
            >
              <Icon name="compass" size={17} />
              Visit guide
            </button>
            <button
              className="ea-mobile-toggle"
              aria-label={menu ? "Close navigation" : "Open navigation"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Icon name={menu ? "close" : "menu"} />
            </button>
          </>} />
      <div ref={region} id="estate-content" tabIndex={-1}>
        {plain && world && (
          <p className="ea-wrap ea-plain-note" role="status">
            {plain === "failed"
              ? "The 3D library could not be opened on this device. The same rooms, books and records are below."
              : "You are reading the plain page view."}{" "}
            <button
              className="ea-text-button"
              onClick={() => {
                setPlain(false);
                if (home) goToStop("library");
              }}
            >
              <Icon name="cube" size={16} />
              Enter the 3D library
            </button>
          </p>
        )}
        {plainVolume && <ProjectReport volume={plainVolume} admin={data.admin} section={plainRoute?.report?.section ?? (plainRoute?.focus?.kind === "book" ? plainRoute.focus.leaf : undefined)}
          neighbors={reportNeighbors(plainVolume, data.projects)}
          onSectionChange={section => goToStop(formatRoute({ place: plainRoute!.place, focus: plainRoute!.focus, report: { section } }))}
          onProject={target => goToStop("book/" + target.slug)} />}
        {plain && step === "landing" && <section className="ea-wrap"><h1>The upper landing</h1><p>The 3D visit offers a reconstructed stair landing. The upper rooms remain closed because no upper-floor plan is available.</p><button className="ea-button dark" onClick={() => goToStop("entry")}>Return downstairs</button></section>}
        {home && (
          <Entrance
            data={data}
            map={() => setMode("map")}
            world={!!world && !plain}
            resume={world && !plain ? lastRoom : ""}
            onEnter={setWalkIn}
          />
        )}
        {step === "collection" && (
          <Collection examine={setObject} book={marked} />
        )}
        {step === "cabinet" && (
          <Cabinet
            data={data}
            marked={marked}
            remembered={screen}
            remember={(s) => save("screen", s)}
          />
        )}
        {(room || reading) && (
          <div className={reading && room ? "ea-reading-in-room" : undefined}>
            {room && (
              <Rooms
                room={room}
                program={program}
                walk={walk || step === "walk"}
                setWalk={(v) => {
                  setWalk(v);
                  if (step === "walk" && !v) goToStop("approach");
                }}
                awake={awake}
                meet={() => setMode("portrait")}
                read={read}
                examine={(id) =>
                  id === "murfree-leeper" ? openReports() : setObject(id)
                }
                map={() => setMode("map")}
                leaf={reading ? data.program?.book.pages[index] : undefined}
              />
            )}
            {reading && data.program && (
              <HouseBook
                program={data.program}
                index={index}
                examine={setObject}
              />
            )}
          </div>
        )}
        {leaf && !reading && (
          <section className="ea-wrap ea-section">
            <p className="ea-overline">At the writing table</p>
            <h1 tabIndex={-1}>This leaf is unavailable</h1>
            <a className="ea-text-button" href="#collection">
              Explore the historical collection <Icon name="arrow" />
            </a>
          </section>
        )}
      </div>
      <footer className="ea-footer">
        <div className="ea-wrap">
          <div>
            <span className="ea-footer-name">Overton Archive</span>
            <p>John Overton Bell’s independent portfolio</p>
          </div>
          <nav aria-label="Archive information">
            <a href="/resume">Résumé</a>
            <button onClick={() => setMode("sources")}>
              Sources &amp; credits
            </button>
            <a href="/catalog">
              Text catalog <Icon name="diagonal" size={13} />
            </a>
          </nav>
        </div>
      </footer>
      {conversation && <div className="ea-conversation" onKeyDown={event => event.stopPropagation()}>
        <PortraitPanel scene={{ place: plainRoute?.place, volumeId: plainVolume?.slug }} cancelKey={conversationCancel}
          onClose={() => setConversation(false)} onCancelMedia={() => { setSound(false); document.querySelectorAll("video,audio").forEach(node => (node as HTMLMediaElement).pause()); }}
          onNavigate={async (intent, signal) => {
            const next = portraitRoute(intent, data.projects);
            if (!next) return "unavailable";
            if (signal.aborted) return "cancelled";
            ownPlainDestination.current = formatRoute(next).slice(1);
            goToStop(formatRoute(next));
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            return signal.aborted ? "cancelled" : document.querySelector('[data-report="' + intent.targetId + '"]') ? "success" : "unavailable";
          }} />
      </div>}
      {object && (
        <StudyCollection initial={object} close={() => setObject(null)} />
      )}
      {mode === "portrait" && (
        <Portrait
          src={data.program?.portrait ?? null}
          close={() => setMode(null)}
          read={read}
          record={openReports}
          onAwake={() => setAwake(true)}
          sound={sound}
          setSound={setSound}
          hasBook={!!count}
        />
      )}
      {(mode === "guide" || mode === "map") && (
        <Modal
          wide
          title={mode === "map" ? "Estate map" : "Visit guide"}
          onClose={() => setMode(null)}
        >
          <div className="ea-guide-panel">
            <p className="ea-overline">
              <Icon name={mode === "map" ? "map" : "compass"} size={16} />{" "}
              Travellers Rest
            </p>
            <h2>{mode === "map" ? "Estate map" : "Visit guide"}</h2>
            {mode === "map" ? (
              <figure className="ea-guide-map">
                <a
                  href={base + "survey-plan.webp"}
                  target="_blank"
                  rel="noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={base + "survey-plan.webp"}
                    alt="First-floor survey plan, with Library to the west of Entry and the south doorway at right."
                  />
                </a>
                <figcaption>
                  First-floor plan · HABS TN-14, printed page 8 · Select to
                  enlarge
                </figcaption>
              </figure>
            ) : (
              <p>
                Enter through the south door, or choose a destination. The book
                remembers your place on this device.
              </p>
            )}
            <div className="ea-guide-list">
              {guideStops.map((d) => (
                <button key={d.id} onClick={() => destination(d.id)}>
                  <span>
                    <strong>{d.title}</strong>
                    <small>{d.note}</small>
                  </span>
                  <Icon name="arrow" />
                </button>
              ))}
            </div>
            <div className="ea-actions">
              {world ? (
                <button
                  className="ea-button dark"
                  onClick={() => {
                    setPlain(false);
                    destination("library");
                  }}
                >
                  <Icon name="cube" />
                  Enter the 3D library
                </button>
              ) : (
                data.program?.scenes && (
                  <button
                    className="ea-button dark"
                    onClick={() => {
                      setWalk(true);
                      destination("walk");
                    }}
                  >
                    <Icon name="cube" />
                    Start the 3D walk
                  </button>
                )
              )}
              {marked && (
                <button className="ea-button outline" onClick={read}>
                  <Icon name="book" />
                  {saved ? "Resume marked leaf" : "Open the house book"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
      {mode === "sources" && (
        <Modal wide title="Sources and credits" onClose={() => setMode(null)}>
          <div className="ea-guide-panel ea-sources">
            <p className="ea-overline">About the archive</p>
            <h2>Sources and credits</h2>
            <p>
              John Overton Bell is a descendant of Judge John Overton, and his
              middle name was chosen after him. This
              independent portfolio interprets the enlarged house recorded in
              the 1970 architectural survey. The house was begun in 1799.
            </p>
            <h3>The building</h3>
            <p>
              The federal survey locates the library, hearth and stair. The
              photographic-style room views were created with AI using survey
              references. Furniture placement, light, color and the family
              cabinet are interpretive choices.
            </p>
            <a
              href="https://www.loc.gov/item/tn0036/"
              target="_blank"
              rel="noreferrer"
            >
              Historic American Buildings Survey · TN-14 ↗
            </a>
            <h3>The custodian</h3>
            <p>
              The guide begins with a photographic copy of Ralph E. W. Earl’s
              1817 portrait. The facial movement and spoken directions were
              created for this visit.
            </p>
            <a
              href="https://teva.contentdm.oclc.org/digital/collection/p15138coll33/id/285/"
              target="_blank"
              rel="noreferrer"
            >
              Tennessee Virtual Archive · Nell Savage Mahoney Papers ↗
            </a>
            <h3>People, law and politics</h3>
            <a
              href="https://www.historictravellersrest.org/history/the-first-residents-of-historic-travellers-rest"
              target="_blank"
              rel="noreferrer"
            >
              Travellers Rest Historic House Museum · First Residents ↗
            </a>
            <a
              href="https://www.historictravellersrest.org/history/a-past-uncovered"
              target="_blank"
              rel="noreferrer"
            >
              Travellers Rest Historic House Museum · A Past Uncovered ↗
            </a>
            <a
              href="https://tennesseeencyclopedia.net/entries/john-overton/"
              target="_blank"
              rel="noreferrer"
            >
              Tennessee Historical Society · John Overton ↗
            </a>
            <button
              className="ea-object-link"
              onClick={() => destination("collection")}
            >
              Open the catalog records <Icon name="arrow" size={16} />
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
