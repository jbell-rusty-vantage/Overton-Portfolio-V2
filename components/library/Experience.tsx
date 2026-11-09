"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Mark } from "./Marks";
import { Cover, LeafBody, SourceNote, VolumeCard } from "./Reading";
import Modal from "./Modal";
import {
  type ReadingScope,
  type Collection,
  type Screen,
  type Volume,
  zones,
  collectionShelves,
  matchesCatalog,
  sceneHref,
  detailHref,
  withinPreview,
  zoneFor,
} from "@/lib/library/model";

const World = dynamic(() => import("./World"), {
  ssr: false,
  loading: () => <div className="world-loading">Preparing the 3D view…</div>,
});
class SceneBoundary extends Component<
  { children: ReactNode; fail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.fail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};
const querySnapshot = () => window.location.search;
function visit(href: string, replace = false, reader = false) {
  const path = new URL(href, location.origin);
  if (path.pathname + path.search === location.pathname + location.search)
    return;
  if (replace)
    history.replaceState({ ...history.state, libraryReader: reader }, "", href);
  else history.pushState({ libraryReader: reader }, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
function ScreenContent({
  screen,
  volumes,
  open,
}: {
  screen: Screen;
  volumes: Volume[];
  open: (v: Volume) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) video.current?.pause();
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  return (
    <>
      <span className="eyebrow">Computer station · {screen.mode}</span>
      <h2>{screen.title}</h2>
      {["feed", "terminal"].includes(screen.mode) ? (
        <div className="terminal">
          {screen.lines.length ? (
            screen.lines.map((line, i) => (
              <p key={i}>
                <span>› </span>
                {line}
              </p>
            ))
          ) : (
            <p>No entries are available.</p>
          )}
        </div>
      ) : !screen.url ? (
        <p>
          No {screen.mode === "iframe" ? "site" : "media"} is configured for
          this display.
        </p>
      ) : screen.mode === "iframe" ? (
        <>
          <a
            href={screen.url}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Open site <Mark name="external" />
          </a>
          {playing ? (
            <iframe
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              title={screen.title}
              src={screen.url}
            />
          ) : (
            <button className="folio-button" onClick={() => setPlaying(true)}>
              Load embedded site
            </button>
          )}
        </>
      ) : screen.mode === "video" ? (
        <video
          ref={video}
          src={screen.url}
          controls
          preload="none"
          aria-label={screen.title}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={screen.url} alt={screen.title} />
      )}
      {screen.mode === "feed" && !screen.lines.length && volumes.length > 0 && (
        <div className="guide-actions">
          <span className="eyebrow">From the catalog</span>
          {volumes.slice(0, 3).map((v) => (
            <button
              className="folio-button"
              key={v.kind + "/" + v.slug}
              onClick={() => open(v)}
            >
              {v.title}
              <Mark name="arrow" size={14} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
function Catalog({
  data,
  startKind,
  admin,
}: {
  data: Collection;
  startKind: string;
  admin: ReadingScope;
}) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState(startKind);
  const shelves = collectionShelves(data);
  const titleFor = (v: Volume) => shelves.find((s) => s.slug === v.shelf)?.title;
  const matches = data.volumes.filter(
    (v) =>
      (kind === "All" || v.kind === kind) &&
      matchesCatalog(v, search, titleFor(v)),
  );
  return (
    <main className="catalog-page">
      <span className="eyebrow">The collection</span>
      <h1>Library catalog</h1>
      <div className="catalog-input">
        <Mark name="search" />
        <input
          type="search"
          aria-label="Search the catalog"
          placeholder="Search titles, subjects, or shelves"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="filters">
        {["All", "Project", "Journal", "Evolution", "Favorite", "Book"].map(
          (k) => (
            <button
              key={k}
              aria-pressed={k === kind}
              onClick={() => setKind(k)}
            >
              {k === "All"
                ? "All volumes"
                : k === "Journal"
                  ? "Journal"
                  : k + "s"}
            </button>
          ),
        )}
      </div>
      <div className="catalog-status">
        <span aria-live="polite">
          {matches.length} {matches.length === 1 ? "volume" : "volumes"}
        </span>
        <SourceNote source={data.source} />
      </div>
      <div className="card-grid">
        {matches.map((v) => (
          <VolumeCard key={v.kind + "/" + v.slug} v={v} admin={admin} shelfTitle={titleFor(v)} catalog />
        ))}
      </div>
      {!matches.length && (
        <p className="empty">
          {data.source === "unavailable"
            ? "The collection could not be loaded. Reload to try again."
            : search
              ? "No volumes match this search."
              : "There are no volumes in this section yet."}
        </p>
      )}
    </main>
  );
}
const descriptions: Record<string, string> = {
  entrance: "The front desk and library guide",
  stacks: "Projects in four subject collections",
  "evolution-hall": "A chronology of work and learning",
  periodicals: "Writing and field notes",
  "favorites-wing": "Books, tools and references",
  "reading-room": "Courses, articles and reports",
  "computer-station": "Terminals and project displays",
};
export default function Experience({
  data,
  initialQuery = "",
  catalog = false,
  startKind = "All",
  admin = false,
}: {
  data: Collection;
  initialQuery?: string;
  catalog?: boolean;
  startKind?: string;
  admin?: ReadingScope;
}) {
  const search = useSyncExternalStore(
    subscribe,
    querySnapshot,
    () => initialQuery,
  );
  const q = new URLSearchParams(search);
  const shelves = collectionShelves(data);
  const inWorld = !catalog && q.get("view") === "world";
  const zone =
    zones.find(
      (z) => z.slug === q.get("zone") && data.zones.includes(z.slug),
    ) ??
    zones.find((z) => data.zones.includes(z.slug)) ??
    zones[0];
  const shelf = shelves.find(
    (s) => s.slug === q.get("shelf") && s.zone === zone.slug,
  );
  const matches = inWorld
    ? data.volumes.filter(
        (v) =>
          v.slug === q.get("book") &&
          (!q.has("kind") || v.kind === q.get("kind")),
      )
    : [];
  const book = matches.length === 1 ? matches[0] : undefined;
  const pageIndex = Math.max(
    0,
    book?.pages.findIndex((p) => p.key === q.get("page")) ?? 0,
  );
  const [panel, setPanel] = useState<"guide" | "map" | "settings" | null>(null);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [failed, setFailed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const fail = useCallback(() => setFailed(true), []);
  const systemMotion = useSyncExternalStore(
    subscribeMotion,
    getMotion,
    () => true,
  );
  const motionPreference = useSyncExternalStore(
    subscribePrefs,
    () => stored("library-reduce-motion"),
    () => null,
  );
  const low = useSyncExternalStore(
    subscribePrefs,
    () => {
      const saved = stored("library-low-quality");
      return saved === null
        ? matchMedia("(max-width: 720px)").matches
        : saved === "true";
    },
    () => false,
  );
  const reduced =
    motionPreference === null ? systemMotion : motionPreference === "true";
  function navigate(zoneId: string, shelfId?: string) {
    if (!data.zones.includes(zoneId)) return;
    setPanel(null);
    setScreen(null);
    const href = withinPreview(sceneHref(zoneId, shelfId), admin);
    if (catalog) {
      location.assign(href);
      return;
    }
    visit(href);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openBook(v: Volume) {
    setPanel(null);
    setScreen(null);
    const href = withinPreview(
      sceneHref(zoneFor(v), v.shelf, v.slug, v.kind),
      admin,
    );
    if (catalog) {
      location.assign(withinPreview(detailHref(v), admin));
      return;
    }
    visit(href, false, true);
  }
  function closeBook() {
    if (history.state?.libraryReader) {
      history.back();
      return;
    }
    visit(withinPreview(sceneHref(zone.slug, shelf?.slug), admin), true);
  }
  function leaf(index: number) {
    if (!book || !book.pages[index]) return;
    const next = new URL(location.href);
    next.searchParams.set("page", book.pages[index].key);
    visit(next.pathname + next.search, true, !!history.state?.libraryReader);
  }
  const featured = [...data.volumes]
    .filter((v) => v.kind === "Project")
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, 4);
  const tourStops = zones.filter((z) => data.zones.includes(z.slug));
  const tourIndex = tourStops.findIndex((z) => z.slug === zone.slug);
  const touring = inWorld && q.get("tour") === "guided" && tourIndex >= 0;
  function tourTo(index: number) {
    const stop = tourStops[index];
    if (!stop) return;
    setPanel(null);
    setScreen(null);
    const href = withinPreview(sceneHref(stop.slug) + "&tour=guided", admin);
    if (catalog) {
      location.assign(href);
      return;
    }
    visit(href);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const roomShelves = shelves.filter((s) => s.zone === zone.slug);
  const activeVolumes = data.volumes.filter((v) => v.shelf === shelf?.slug);
  function enter() {
    if (!data.zones.length) {
      location.assign(withinPreview("/projects", admin));
      return;
    }
    setFailed(false);
    navigate(data.zones.includes("entrance") ? "entrance" : zone.slug);
  }
  return (
    <div className="library">
      <header className="lib-masthead">
        <Link
          prefetch={false}
          href={withinPreview("/", admin)}
          className="wordmark"
        >
          <Mark name="book" size={31} />
          <span>The Library</span>
        </Link>
        <nav aria-label="Library navigation">
          <Link
            prefetch={false}
            href={withinPreview("/", admin)}
            className={!catalog ? "active" : ""}
          >
            <Mark name="compass" size={15} />
            Explore
          </Link>
          <Link
            prefetch={false}
            href={withinPreview("/projects", admin)}
            className={catalog ? "active" : ""}
          >
            <Mark name="catalog" size={15} />
            Catalog
          </Link>
          <button onClick={() => setPanel("guide")}>
            <Mark name="help" size={15} />
            Guide
          </button>
        </nav>
        <a
          className="owner-link"
          href="https://github.com/jbell-rusty-vantage"
          rel="noreferrer"
          target="_blank"
        >
          John Overton <Mark name="external" size={15} />
        </a>
      </header>
      {catalog ? (
        <Catalog data={data} startKind={startKind} admin={admin} />
      ) : (
        <main>
          {!inWorld ? (
            <>
              <section
                className="entrance-scene"
                aria-labelledby="entrance-title"
              >
                <div className="poster-frame" />
                <div className="hero-copy">
                  <span className="hero-kicker">
                    <i /> John Overton’s portfolio
                  </span>
                  <h1 id="entrance-title">
                    The <em>Library</em>
                  </h1>
                  <p>
                    A collection of projects, research, and field notes. Explore
                    the room and take a volume off the shelf.
                  </p>
                  <div className="hero-actions">
                    <button className="gold-button" onClick={enter}>
                      <Mark name="compass" />
                      Enter the library <Mark name="arrow" size={17} />
                    </button>
                    <Link
                      prefetch={false}
                      href={withinPreview("/projects", admin)}
                    >
                      Browse catalog <Mark name="external" size={14} />
                    </Link>
                  </div>
                </div>
                <div className="entrance-foot">
                  <span>
                    <i className="locator-dot" /> Entrance hall
                  </span>
                  <button onClick={() => setPanel("map")}>
                    <Mark name="map" size={16} /> Floor directory
                  </button>
                </div>
              </section>
              <section className="collection-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      <i /> From the stacks
                    </span>
                    <h2>Selected volumes</h2>
                  </div>
                  <Link
                    prefetch={false}
                    className="text-link"
                    href={withinPreview("/projects", admin)}
                  >
                    View catalog <Mark name="arrow" size={16} />
                  </Link>
                </div>
                <div className="card-grid">
                  {featured.map((v) => (
                    <VolumeCard
                      key={v.kind + "/" + v.slug}
                      v={v}
                      shelfTitle={shelves.find((s) => s.slug === v.shelf)?.title}
                      admin={admin}
                    />
                  ))}
                  {featured.length === 1 && (
                    <button
                      className="directory-card"
                      onClick={() => setPanel("map")}
                    >
                      <Mark name="map" size={42} />
                      <span>
                        <span className="eyebrow">Explore by location</span>
                        <strong>Floor directory</strong>
                        <small>Find a shelf in the library.</small>
                      </span>
                      <Mark name="arrow" />
                    </button>
                  )}
                </div>
                {featured.length === 0 && (
                  <p className="empty">
                    {data.source === "unavailable"
                      ? "The collection is unavailable. Reload to try again."
                      : "The project shelves are awaiting their first volumes."}
                  </p>
                )}
                <div className="collection-note">
                  <SourceNote source={data.source} />
                  {data.source === "review" &&
                    !admin &&
                    process.env.NODE_ENV === "development" && (
                      <Link href="/samples?view=world&zone=stacks">
                        Explore sample shelves <Mark name="arrow" size={13} />
                      </Link>
                    )}
                </div>
              </section>
            </>
          ) : (
            <section className="world-shell">
              <div className="scene-wrap">
                {failed ? (
                  <div className="fallback-view">
                    <div>
                      <span className="eyebrow">Library interior</span>
                      <h2>Illustrated view</h2>
                      <p>
                        3D graphics could not open. Use the directory and shelf
                        lists below to keep exploring.
                      </p>
                      <button
                        className="gold-button"
                        onClick={async () => {
                          const { retryScene } = await import("./World");
                          retryScene(data.sceneUrl);
                          setFailed(false);
                        }}
                      >
                        Retry 3D view
                      </button>
                    </div>
                  </div>
                ) : (
                  <SceneBoundary fail={fail}>
                    <World
                      key={resetKey}
                      collection={data}
                      zone={zone.slug}
                      shelf={shelf?.slug ?? null}
                      selected={book?.slug ?? null}
                      reduced={reduced}
                      low={low}
                      paused={!!book || !!panel || !!screen}
                      onZone={navigate}
                      onGuide={() => setPanel("guide")}
                      onShelf={(id) => {
                        const s = shelves.find((s) => s.slug === id);
                        if (s) navigate(s.zone, id);
                      }}
                      onBook={openBook}
                      onScreen={(id) =>
                        setScreen(
                          data.screens.find((s) => s.slot === id) ?? null,
                        )
                      }
                      onError={fail}
                    />
                  </SceneBoundary>
                )}
                <div className="world-top">
                  <button
                    onClick={() => {
                      visit(withinPreview("/", admin));
                      setFailed(false);
                    }}
                  >
                    <Mark name="back" size={16} /> Entrance page
                  </button>
                  <div>
                    <button onClick={() => setPanel("map")}>
                      <Mark name="map" size={16} /> Directory
                    </button>
                    <button
                      aria-label="View settings"
                      onClick={() => setPanel("settings")}
                    >
                      <Mark name="settings" size={16} />
                    </button>
                  </div>
                </div>
                <div className="location-plaque">
                  <i className="locator-dot" />
                  {shelf?.title ?? zone.title}
                </div>
              </div>
              <div className="room-info">
                <div>
                  <span className="eyebrow">Current location</span>
                  <h1>{shelf?.title ?? zone.title}</h1>
                  <p>
                    {shelf
                      ? activeVolumes.length +
                        " readable " +
                        (activeVolumes.length === 1 ? "volume" : "volumes")
                      : descriptions[zone.slug]}
                  </p>
                  <SourceNote source={data.source} />
                </div>
                <div className="room-links">
                  {touring && (
                    <div className="tour-controls">
                      <span>
                        Guided visit · {tourIndex + 1} of {tourStops.length}
                      </span>
                      {tourIndex > 0 && (
                        <button onClick={() => tourTo(tourIndex - 1)}>
                          Previous room
                        </button>
                      )}
                      {tourIndex + 1 < tourStops.length && (
                        <button onClick={() => tourTo(tourIndex + 1)}>
                          Next room <Mark name="arrow" />
                        </button>
                      )}
                      <button onClick={() => navigate(zone.slug)}>
                        End visit
                      </button>
                    </div>
                  )}
                  {q.has("book") && !book && (
                    <p role="status">That volume is unavailable.</p>
                  )}
                  {shelf ? (
                    <>
                      {activeVolumes.map((v) => (
                        <button
                          key={v.kind + "/" + v.slug}
                          onClick={() => openBook(v)}
                        >
                          <Mark name="book" />
                          {v.title}
                          <Mark name="arrow" />
                        </button>
                      ))}
                      <button onClick={() => navigate(zone.slug)}>
                        <Mark name="back" /> All shelves
                      </button>
                    </>
                  ) : zone.slug === "entrance" ? (
                    <>
                      <button onClick={() => navigate("stacks")}>
                        <Mark name="catalog" /> Visit project stacks{" "}
                        <Mark name="arrow" />
                      </button>
                      <button onClick={() => setPanel("map")}>
                        <Mark name="map" /> Choose a room
                      </button>
                    </>
                  ) : zone.slug === "computer-station" ? (
                    data.screens.map((s) => (
                      <button key={s.slot} onClick={() => setScreen(s)}>
                        <Mark name="monitor" />
                        {s.title}
                      </button>
                    ))
                  ) : (
                    roomShelves.map((s) => (
                      <button
                        key={s.slug}
                        onClick={() => navigate(s.zone, s.slug)}
                      >
                        <Mark name="catalog" />
                        {s.title}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      )}
      <footer className="library-footer">
        <span>
          <Mark name="book" size={16} /> The Library <b>/</b> John Overton
        </span>
        <Link prefetch={false} href={withinPreview("/projects", admin)}>
          Catalog <Mark name="external" size={13} />
        </Link>
      </footer>

      {panel === "map" && (
        <Modal title="Floor directory" onClose={() => setPanel(null)}>
          <span className="eyebrow">Spatial index</span>
          <h2>Floor directory</h2>
          <div className="directory-list">
            {zones
              .filter((z) => data.zones.includes(z.slug))
              .map((z) => (
                <button key={z.slug} onClick={() => navigate(z.slug)}>
                  <Mark
                    name={
                      z.slug === "computer-station"
                        ? "monitor"
                        : z.slug === "entrance"
                          ? "compass"
                          : "catalog"
                    }
                  />
                  <span>
                    <strong>{z.title}</strong>
                    <small>{descriptions[z.slug]}</small>
                  </span>
                  <Mark name="arrow" />
                </button>
              ))}
          </div>
          {!data.zones.length && <p>No rooms are currently available.</p>}
        </Modal>
      )}
      {panel === "guide" && (
        <Modal title="Library guide" onClose={() => setPanel(null)}>
          <span className="eyebrow">At the front desk</span>
          <h2>Library guide</h2>
          <p>
            Use the directory to move between rooms. In the project stacks,
            choose a shelf, then select a bound volume to open its pages.
          </p>
          <div className="guide-keys">
            <span>
              <kbd>Tab</kbd> Move between controls
            </span>
            <span>
              <kbd>Enter</kbd> Select a destination or book
            </span>
            <span>
              <kbd>Esc</kbd> Close an open panel
            </span>
          </div>
          <p>
            Drag the scene to look around. Every readable volume is also in the{" "}
            <Link prefetch={false} href={withinPreview("/projects", admin)}>
              HTML catalog
            </Link>
            .
          </p>
          <div className="guide-actions">
            {tourStops.length > 0 && (
              <button className="folio-button" onClick={() => tourTo(0)}>
                <Mark name="compass" /> Start guided visit
              </button>
            )}
            {data.zones.includes("stacks") && (
              <button
                className="folio-button"
                onClick={() => navigate("stacks", "stacks-ai-agents")}
              >
                Explore agent systems
              </button>
            )}
            {featured[0] && (
              <button
                className="folio-button"
                onClick={() => openBook(featured[0])}
              >
                Read {featured[0].title}
              </button>
            )}
            <Link
              className="folio-button"
              href={withinPreview("/projects", admin)}
            >
              Find a volume
            </Link>
            {data.source === "review" &&
              !admin &&
              process.env.NODE_ENV === "development" && (
                <Link href="/samples" className="folio-button">
                  Visit the sample collection
                </Link>
              )}
            {admin === "samples" && (
              <Link href="/dev/library-admin" className="folio-button">
                Sample placement desk
              </Link>
            )}
          </div>
        </Modal>
      )}
      {panel === "settings" && (
        <Modal title="View settings" onClose={() => setPanel(null)}>
          <span className="eyebrow">World controls</span>
          <h2>View settings</h2>
          <label className="setting">
            <input
              type="checkbox"
              checked={reduced}
              onChange={(e) =>
                savePref("library-reduce-motion", e.target.checked)
              }
            />{" "}
            Reduce camera motion
          </label>
          <label className="setting">
            <input
              type="checkbox"
              checked={low}
              onChange={(e) =>
                savePref("library-low-quality", e.target.checked)
              }
            />{" "}
            Use lower rendering resolution
          </label>
          <button
            className="folio-button"
            onClick={() => {
              setResetKey((k) => k + 1);
              navigate(
                data.zones.includes("entrance") ? "entrance" : zone.slug,
              );
            }}
          >
            <Mark name="reset" />
            Return to entrance
          </button>
        </Modal>
      )}
      {book && (
        <Modal wide title={book.title} onClose={closeBook}>
          <div className="open-volume">
            <aside>
              <Cover volume={book} />
              <SourceNote source={data.source} />
            </aside>
            <div className="reader-copy">
              <span className="eyebrow">
                {book.kind} ·{" "}
                {shelves.find((s) => s.slug === book.shelf)?.title ??
                  "Library collection"}
              </span>
              <h2>{book.title}</h2>
              <div className="mobile-source">
                <SourceNote source={data.source} />
              </div>
              <div className="tags">
                {book.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="book-leaf" key={pageIndex}>
                <span className="eyebrow">{book.pages[pageIndex].title}</span>
                <LeafBody page={book.pages[pageIndex]} admin={admin} />
              </div>
              <div className="pagination">
                <button
                  aria-label="Previous page"
                  disabled={pageIndex === 0}
                  onClick={() => leaf(pageIndex - 1)}
                >
                  <Mark name="back" />
                </button>
                <span>
                  Page {pageIndex + 1} of {book.pages.length}
                </span>
                <button
                  aria-label="Next page"
                  disabled={pageIndex === book.pages.length - 1}
                  onClick={() => leaf(pageIndex + 1)}
                >
                  <Mark name="arrow" />
                </button>
              </div>
              <a
                className="text-link"
                href={withinPreview(detailHref(book), admin)}
              >
                Full reading page <Mark name="external" size={13} />
              </a>
            </div>
          </div>
        </Modal>
      )}
      {screen && (
        <Modal title={screen.title} onClose={() => setScreen(null)}>
          <ScreenContent
            screen={screen}
            volumes={data.volumes}
            open={openBook}
          />
        </Modal>
      )}
    </div>
  );
}
function subscribeMotion(cb: () => void) {
  const q = matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
}
function getMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function subscribePrefs(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("library-preferences", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("library-preferences", cb);
  };
}
function savePref(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
  window.dispatchEvent(new Event("library-preferences"));
}
