"use client";
/* The continuous library. One canvas stays mounted through travel, reading, close
   inspection and playback; the location hash is the single description of where the
   visitor stands and what they hold, so Back, reload and a shared link all resolve to
   the same room state. Everything selectable in the scene is also a real control here. */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { EstateData, ExhibitMedia } from "@/lib/estate/model";
import { detailHref, withinPreview, type Volume } from "@/lib/library/model";
import ProjectReport from "@/components/library/ProjectReport";
import { reportNeighbors, resolveReportSection } from "@/lib/library/report";
import { PortraitPanel } from "@/components/portrait/PortraitPanel";
import type { NavigationIntent, NavigationAck } from "@/lib/portrait/contracts";
import { portraitRoute } from "@/lib/estate/visitor-navigation";
import { prepaginateVolumes } from "./paginate";
import {
  companionSlug,
  formatRoute,
  houseShelves,
  objectCue,
  parseRoute,
  placeOrder,
  places,
  projectCue,
  type Focus,
  type Place,
  type Route,
  type ScreenSlot,
} from "@/lib/estate/world";
import { HouseMark, Icon } from "../Marks";
import { useReducedMotion } from "../Portrait";
import { Engine, type Target, type Reachable } from "./engine/engine";
import Inspector from "./Inspector";
import Reader, { type Mark } from "./Reader";
import { desktopPage, phonePage } from "./sheets";
import { useCustodian } from "./voice";
import Controls, { MoveHelp } from "./Controls";
import GuidedTour from "./GuidedTour";
import EnvironmentControls from "./EnvironmentControls";
import "./world.css";
import EstateHeader from "../EstateHeader";
import Folio from "./Folio";

const ROUTE = "tw-route";
function onRoute(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener(ROUTE, cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener(ROUTE, cb);
  };
}
const getHash = () => location.hash;
function onNarrow(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
const isNarrow = () => innerWidth <= 700 || innerWidth / innerHeight < 0.8;
function memory<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem("overton-estate:" + key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function remember(key: string, value: unknown) {
  try {
    localStorage.setItem("overton-estate:" + key, JSON.stringify(value));
  } catch {}
}
export default function World({
  data,
  walkIn,
  onPlain,
}: {
  data: EstateData;
  /** The visitor entered from the entrance in this session: walk through the door. */
  walkIn: boolean;
  onPlain: (failed?: boolean) => void;
}) {
  const program = data.program!;
  const world = program.world!;
  const reduced = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [floorLevel, setFloorLevel] = useState<"ground" | "stairs" | "landing">("ground");
  const [hover, setHover] = useState<{ label: string; hint: string; x: number; y: number } | null>(null);
  const [reach, setReach] = useState<Reachable[]>([]);
  const exiting = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [exitFade, setExitFade] = useState(false);
  const [arrived, setArrived] = useState<Place | null>(null);
  const [travelling, setTravelling] = useState(false);
  const [settled, setSettled] = useState("");
  const [missing, setMissing] = useState<{ id: string; pages: number[] }>({ id: "", pages: [] });
  const [panel, setPanel] = useState<"directory" | "help" | null>(null);
  const [query, setQuery] = useState("");
  const [card, setCard] = useState(false);
  const [cardExplicit, setCardExplicit] = useState(false);
  const [conversation, setConversation] = useState(false);
  const [mediaActive, setMediaActive] = useState(false);
  const [cancelKey, setCancelKey] = useState(0);
  const ownDestination = useRef<string | null>(null);
  const ownReport = useRef<string | null>(null);
  const currentVisit = useRef({ hash: "", settled: "" });
  const [say, setSay] = useState("");
  // A notice travels with the history entry it explains, so Back and reload agree.
  const noticeKind = useSyncExternalStore(
    onRoute,
    () => (history.state?.twNotice as string | undefined) ?? "",
    () => "",
  );
  const narrow = useSyncExternalStore(onNarrow, isNarrow, () => false);
  const hash = useSyncExternalStore(onRoute, getHash, () => "");
  const trigger = useRef<HTMLElement | null>(null);
  const first = useRef(true);
  const greeted = useRef(false);

  const volumes = useMemo(() => {
    const placed = new Map(world.placements.map((p) => [p.book, p]));
    return data.projects.map((v) => {
      const p = placed.get(v.slug);
      return p ? { ...v, shelf: p.shelf, position: p.position } : v;
    });
  }, [data.projects, world.placements]);
  const book = useCallback(
    (slug: string): Volume | null =>
      slug === program.book.slug ? program.book : (volumes.find((v) => v.slug === slug) ?? null),
    [volumes, program.book],
  );
  const home = useCallback(
    (f: NonNullable<Focus>): Place =>
      f.kind === "book"
        ? f.slug === companionSlug
          ? "desk"
          : "cabinet"
        : f.kind === "object"
          ? (world.objects.find((o) => o.id === f.id)?.home ?? "desk")
          : "cabinet",
    [world.objects],
  );
  const leaves = useMemo(() => program.book.pages.map((p) => p.key), [program.book]);
  const route: Route = useMemo(
    () => parseRoute(hash, home, leaves) ?? { place: "library", focus: null },
    [hash, home, leaves],
  );
  const focus = route.focus;
  const volume = focus?.kind === "book" ? book(focus.slug) : null;
  const report = volume && route.report ? resolveReportSection(volume, route.report.section) : null;
  const object = focus?.kind === "object" ? (world.objects.find((o) => o.id === focus.id) ?? null) : null;

  /* Navigation. Places push history; opening something pushes a marked entry so that
     putting it back is a real Back; page turns replace. */
  const engineNow = useRef<Engine | null>(null);
  useEffect(() => {
    engineNow.current = engine;
  }, [engine]);
  const navigate = useCallback((next: Route, mode: "push" | "focus" | "replace" = "push") => {
    const target = formatRoute(next);
    if (mode === "push") {
      if (location.hash !== target) location.hash = target;
      // Already the address, but the visitor may have wandered: walk back to the stop.
      else {
        engineNow.current?.setRoute(next, false);
        if (next.landing) engineNow.current?.visitLanding(false);
      }
      return;
    }
    if (mode === "focus") history.pushState({ ...(history.state ?? {}), tw: "focus" }, "", target);
    else history.replaceState(history.state, "", target);
    window.dispatchEvent(new Event(ROUTE));
  }, []);
  const putBack = useCallback(() => {
    if (history.state?.tw === "focus") history.back();
    else
      navigate(
        { place: route.place === "screen" ? "cabinet" : route.place, focus: null },
        "replace",
      );
  }, [navigate, route.place]);

  const custodian = useCustodian(engine, world.voice, reduced);
  const engaged = custodian.sound !== null;
  const stopCustodian = custodian.stop;
  const quiet = useCallback(() => {
    stopCustodian();
    document.querySelectorAll("video,audio").forEach(node => (node as HTMLMediaElement).pause());
    if (document.pointerLockElement) void document.exitPointerLock();
  }, [stopCustodian]);
  const closeFolio = useCallback(() => {
    quiet();
    navigate({ place: "cabinet", focus: null });
  }, [quiet, navigate]);
  useEffect(() => {
    engine?.suspendAtmosphere?.(conversation || !!report || mediaActive || custodian.speech?.status === "playing");
  }, [engine, conversation, report, mediaActive, custodian.speech?.status]);
  function openConversation() {
    quiet(); setCard(false); setPanel(null); setConversation(true);
    requestAnimationFrame(() => document.getElementById("portrait-question")?.focus());
  }
  function openReport(section: string, target = volume) {
    if (!target || !resolveReportSection(target, section)) return;
    quiet(); setConversation(false);
    const underlying: Route = target.slug === volume?.slug ? { place: route.place, focus } :
      { place: home({ kind: "book", slug: target.slug }), focus: { kind: "book", slug: target.slug } };
    history.pushState({ ...(history.state ?? {}), tw: "report", twReportReturn: target.slug === volume?.slug && !route.report ? formatRoute(underlying) : null }, "", formatRoute({ ...underlying, report: { section } }));
    window.dispatchEvent(new Event(ROUTE));
  }
  function closeReport() {
    const underlying = { place: route.place, focus };
    if (history.state?.tw === "report" && history.state.twReportReturn === formatRoute(underlying)) history.back();
    else navigate(underlying, "replace");
  }
  useEffect(() => {
    currentVisit.current = { hash, settled };
    if (ownDestination.current && focus?.kind === "book" && focus.slug === ownDestination.current && (ownReport.current ? route.report?.section === ownReport.current : !route.report)) return;
    setCancelKey(value => value + 1);
    // A route change outside a portrait action invalidates its pending guidance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);
  useEffect(() => { currentVisit.current.settled = settled; }, [settled]);
  async function showPortraitDestination(intent: NavigationIntent, signal: AbortSignal): Promise<NavigationAck> {
    const next = portraitRoute(intent, [program.book, ...volumes]);
    if (!next) return "unavailable";
    if (signal.aborted) return "cancelled";
    const previous = { place: route.place, focus, ...(route.report ? { report: route.report } : {}) };
    const target = formatRoute(next);
    quiet(); engine?.resume(); ownDestination.current = intent.targetId; ownReport.current = next.report?.section ?? null;
    navigate(next, "focus");
    return new Promise(resolve => {
      const start = performance.now();
      const finish = (ack: NavigationAck) => { clearInterval(timer); signal.removeEventListener("abort", abort); ownDestination.current = null; ownReport.current = null; resolve(ack); };
      const abort = () => { if (location.hash === target) navigate(previous, "replace"); finish("cancelled"); };
      const timer = window.setInterval(() => {
        if (signal.aborted) return abort();
        const current = parseRoute(location.hash, home);
        if (current?.focus?.kind !== "book" || current.focus.slug !== intent.targetId) return finish("cancelled");
        if (next.report && current.report?.section !== next.report.section) return finish("cancelled");
        if (currentVisit.current.settled === intent.targetId && (!next.report || document.querySelector('[data-report="' + intent.targetId + '"]'))) finish("success");
        else if (performance.now() - start > 30000) { navigate(previous, "replace"); finish("unavailable"); }
      }, 80);
      signal.addEventListener("abort", abort, { once: true });
    });
  }
  useEffect(() => {
    if (!engine || !ready) return;
    if (report && settled === volume?.slug) engine.pause();
    else { engine.resume(); engine.controller.suspend(conversation && !ownDestination.current); }
    return () => { engine.resume(); engine.controller.suspend(false); };
  }, [engine, ready, report, settled, volume?.slug, conversation, hash]);
  useEffect(() => {
    if (!route.report || !volume || report) return;
    history.replaceState({ ...(history.state ?? {}), twNotice: "report" }, "", location.hash);
    navigate({ place: route.place, focus }, "replace");
  }, [route, volume, report, focus, navigate]);
  useEffect(() => {
    if (arrived !== "cabinet" || focus) return;
    return prepaginateVolumes(volumes, narrow ? phonePage : desktopPage, v => ({
      single: narrow, author: "John Overton Bell", series: houseShelves.find(s => s.shelf === v.shelf)?.title ?? "Portfolio",
      detail: detailHref(v), markup: { slug: v.slug, volumeTitle: v.title, href: (url: string) => withinPreview(url, data.admin), report: true },
    }));
  }, [arrived, focus, volumes, narrow, data.admin]);

  const select = useCallback(
    (target: Target, from?: HTMLElement | null, resumeMark?: Mark) => {
      trigger.current = from ?? null;
      setCardExplicit(false);
      // Once the visitor has chosen how to hear him, the custodian names what is picked up.
      const introduce = (cue: string, fallback?: string) => {
        // An unanswered invitation steps aside for whatever the visitor picks up.
        if (!engaged) {
          setCard(false);
          return;
        }
        if (!custodian.play(cue) && fallback) custodian.play(fallback);
        setCard(true);
      };
      if (target.kind === "place") {
        navigate({ place: target.place, focus: null });
      } else if (target.kind === "portrait") {
        navigate({ place: "portrait", focus: null });
        setCard(true);
      } else if (target.kind === "screen") {
        engine?.rememberPose();
        navigate({ place: "screen", focus: { kind: "screen", slot: "main" } }, "focus");
      } else if (target.kind === "book") {
        if (focus?.kind === "book" && focus.slug === target.slug) return;
        engine?.rememberPose();
        // Fresh pickups start at page one. Only the explicit resume control supplies a mark.
        const next: Route = {
          place: home({ kind: "book", slug: target.slug }),
          focus: { kind: "book", slug: target.slug, leaf: resumeMark?.leaf, page: resumeMark?.part },
        };
        navigate(next, focus ? "replace" : "focus");
        introduce(
          target.slug === companionSlug ? "book-companion" : projectCue(target.slug),
          "project-generic",
        );
      } else {
        if (focus?.kind === "object" && focus.id === target.id) return;
        engine?.rememberPose();
        navigate(
          { place: home({ kind: "object", id: target.id }), focus: { kind: "object", id: target.id } },
          focus ? "replace" : "focus",
        );
        introduce(objectCue(target.id));
      }
    },
    [navigate, engine, focus, home, engaged, custodian],
  );
  // Engine callbacks outlive a render: they read what is current through this ref.
  const latest = useRef({ select, focus, custodian, book, objects: world.objects });
  useEffect(() => {
    latest.current = { select, focus, custodian, book, objects: world.objects };
  });

  // One engine for the life of the visit.
  useEffect(() => {
    const small = isNarrow();
    const made = new Engine({
      canvas: canvas.current!,
      tier: small ? "low" : "high",
      reduced,
      scene: small ? world.scenes.low : world.scenes.high,
      portrait: world.portrait,
      kit: world.kit ? (small ? world.kit.low : world.kit.high) : null,
      volumes: volumes.map((v) => ({
        slug: v.slug,
        title: v.title,
        shelf: v.shelf,
        position: v.position,
        leaves: v.pages.length,
        cover: v.cover,
      })),
      companion: {
        slug: program.book.slug,
        title: program.book.title,
        shelf: null,
        position: 1,
        leaves: program.book.pages.length,
      },
      objects: world.objects,
      metrics: small ? phonePage : desktopPage,
      events: {
        ready: () => setReady(true),
        progress: setProgress,
        failed: () => onPlain(true),
        select: (t) => latest.current.select(t),
        hover: setHover,
        travel: (active) => {
          setTravelling(active);
          // Arrival is reported synchronously after travel ends. Give it that turn,
          // then release a walk-out interrupted by the visitor's own input.
          if (!active) queueMicrotask(() => {
            if (exiting.current) { exiting.current = false; setLeaving(false); }
          });
        },
        arrive: (place) => {
          if (exiting.current && place === "approach") {
            exiting.current = false;
            setExitFade(true);
            window.setTimeout(() => { location.hash = "#approach"; }, 450);
            return;
          }
          const now = latest.current;
          const inside = !["approach", "entry", "map"].includes(place);
          setArrived(place);
          setSay("You are at " + places[place].title.replace(/^The /, "the ") + ".");
          // The portrait notices a first arrival; outside the room he falls silent.
          if (inside && !greeted.current && !now.focus) {
            greeted.current = true;
            setCard(true);
          }
          if (!inside) now.custodian.stop();
        },
        settled: (kind, id) => {
          setSettled(id);
          if (!id) return;
          const now = latest.current;
          const title =
            kind === "book" ? now.book(id)?.title : now.objects.find((o) => o.id === id)?.title;
          if (title) setSay(title + " is in your hands.");
        },
        scan: (id, page, ok) =>
          setMissing((m) => {
            const pages = m.id === id ? m.pages : [];
            return { id, pages: ok ? pages.filter((p) => p !== page) : [...new Set([...pages, page])] };
          }),
      },
    });
    setEngine(made);
    // Draft reviews expose the engine for measurement and scripted checks.
    if (data.review) (window as unknown as { estateEngine?: Engine }).estateEngine = made;
    return () => {
      made.dispose();
      const probe = window as unknown as { estateEngine?: Engine };
      if (probe.estateEngine === made) delete probe.estateEngine;
      setEngine(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the scene is built once from the collection it was opened with
  }, []);

  // Remember where the visitor stands, so the entrance can offer the way back.
  useEffect(() => {
    try {
      sessionStorage.setItem("overton-estate:room", formatRoute(route));
      window.dispatchEvent(new Event("estate-memory"));
    } catch {}
  }, [route]);
  // A volume or object that is no longer available resolves to its place in the room.
  useEffect(() => {
    if (!focus) return;
    const gone = (focus.kind === "book" && !volume) || (focus.kind === "object" && !object);
    if (!gone) return;
    history.replaceState(
      { ...(history.state ?? {}), twNotice: focus.kind },
      "",
      formatRoute({ place: route.place, focus: null }),
    );
    window.dispatchEvent(new Event(ROUTE));
  }, [focus, volume, object, route.place]);
  const notice =
    noticeKind === "report" ? "That report section is unavailable. Your book remains open." : noticeKind === "book"
      ? "That volume is not on the shelves at present. Here is the family cabinet."
      : noticeKind === "object"
        ? "That object is not in the room at present."
        : "";
  function dismissNotice() {
    const state = { ...(history.state ?? {}) };
    delete state.twNotice;
    history.replaceState(state, "", location.hash);
    window.dispatchEvent(new Event(ROUTE));
  }

  // The route drives the room.
  useEffect(() => {
    if (!engine) return;
    const instant = first.current && !walkIn;
    first.current = false;
    engine.resume();
    engine.setRoute({ place: route.place, focus: route.focus }, instant);
    if (route.landing) engine.visitLanding(instant);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formatRoute captures the whole route
  }, [engine, formatRoute({ place: route.place, focus: route.focus, landing: route.landing })]);
  useEffect(() => {
    if (!engine) return;
    const h = canvas.current?.clientHeight ?? 800;
    engine.setLayout(
      narrow,
      focus?.kind === "book"
        ? { top: 58, bottom: narrow ? 150 : 84, left: 0, right: 0 }
        : focus?.kind === "object"
          ? narrow
            ? { top: 56, bottom: Math.round(h * 0.47), left: 0, right: 0 }
            : { top: 60, bottom: 20, left: 0, right: 408 }
          : { top: 0, bottom: 0, left: 0, right: 0 },
    );
  }, [engine, narrow, focus?.kind]);
  useEffect(() => {
    if (object && focus?.kind === "object" && engine) engine.artifact(object.id)?.showPage((focus.page ?? 1) - 1);
  }, [object, focus, engine]);

  // The idle screen shows the project still; opening the screen swaps in the player.
  const slots = useMemo(() => {
    const out: Partial<Record<ScreenSlot, { label: string; media: ExhibitMedia; still?: boolean }>> = {};
    if (program.desk?.main) out.main = { label: "Project reel", media: program.desk.main };
    if (program.desk?.side) out.side = { label: "Case study", media: program.desk.side, still: true };
    return out;
  }, [program.desk]);
  // The custodian: an invitation on first arrival, then cues that answer the visitor.
  const inRoom = arrived && !["approach", "entry", "map"].includes(arrived);
  const cardVisible = card && (!focus || cardExplicit);
  const heldId = focus?.kind === "book" ? focus.slug : focus?.kind === "object" ? focus.id : "";
  // Putting something back returns focus to the control or the scene it came from.
  const wasHeld = useRef("");
  useEffect(() => {
    if (wasHeld.current && !heldId) {
      const t = trigger.current;
      if (t?.isConnected) t.focus({ preventScroll: true });
      else canvas.current?.focus({ preventScroll: true });
    }
    wasHeld.current = heldId;
  }, [heldId]);

  const marks = memory<Record<string, Mark>>("marks", {});
  const last = memory<string>("last", "");
  const lastVolume = last ? book(last) : null;
  function ask(id: string, then?: Route) {
    if (then) navigate(then);
    custodian.play(id);
    setCard(true);
  }
  const term = query.trim().toLowerCase();
  const found = term
    ? {
        places: placeOrder.filter((p) => (places[p].title + places[p].note).toLowerCase().includes(term)),
        volumes: [program.book, ...volumes].filter((v) =>
          [v.title, v.summary, ...v.tags].join(" ").toLowerCase().includes(term),
        ),
        objects: world.objects.filter((o) => (o.title + o.date + o.maker).toLowerCase().includes(term)),
      }
    : { places: placeOrder, volumes: [program.book, ...volumes], objects: world.objects };
  const shelfTitle = (v: Volume) =>
    v.slug === companionSlug ? "On the writing table" : (houseShelves.find((s) => s.shelf === v.shelf)?.title ?? "Portfolio");

  // Only publish a changed list, not a React render for every walking frame.
  useEffect(() => {
    if (!engine || !ready) return;
    let previous = "";
    return engine.controller.watch((position) => {
      setFloorLevel(current => current === position.level ? current : position.level);
      const next = engine.reachable();
      const key = next.map((item) => item.key).join("|");
      if (key !== previous) { previous = key; setReach(next); }
    });
  }, [engine, ready]);
  function walkOutside() {
    if (!engine || focus) return;
    exiting.current = true;
    custodian.stop();
    setCard(false);
    setLeaving(true);
    engine.controller.go("approach");
  }

  const here = floorLevel === "ground" ? places[arrived ?? route.place] : { title: floorLevel === "landing" ? "The upper landing" : "The stair" };
  const restName = object
    ? { desk: "Return to the desk", drawers: "Return to the drawer", map: "Return to the map table", entry: "Return to the wall" }[object.home as string] ?? "Put it back"
    : "";

  return (
    <div className="tw" onPlayCapture={() => { setMediaActive(true); custodian.yield(); setCancelKey(value => value + 1); }} onPauseCapture={() => setMediaActive([...document.querySelectorAll("video")].some(video => !video.paused))} onEndedCapture={() => setMediaActive(false)} data-held={focus?.kind ?? undefined} data-ready={ready || undefined} data-exit={exitFade || undefined}>
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label={
          "The library at Travellers Rest, " + here.title + ". Drag to look around. W, A, S and D or the arrow keys walk and turn wherever focus rests; Shift walks briskly and C takes fine steps. Every stop is on the plan, and everything that can be picked up is listed under Within reach."
        }
      />
      <div className="tw-vignette" aria-hidden="true" />
      {/* The same picture the visitor was just looking at, dissolving into the room. */}
      <div
        className="tw-loading"
        role="status"
        aria-hidden={ready || undefined}
        style={{
          backgroundImage:
            "url(/travellers-rest/plates/" +
            (walkIn ? "approach" : route.place === "cabinet" || route.place === "screen" ? "cabinet" : "library") +
            (narrow ? "-small" : "") +
            ".webp)",
        }}
      >
        {!ready && (
          <>
            <HouseMark />
            <p>
              {walkIn ? "Walking up to the house" : "Opening the library"}
              {progress ? " · " + progress + "%" : "…"}
            </p>
            <button className="tw-link" onClick={() => onPlain()}>
              Continue without 3D
            </button>
          </>
        )}
      </div>
      <EstateHeader world subtitle={here.title} active={route.place} actions={<>
          <button className="tw-pill" onClick={openConversation}>Ask Judge Overton</button>
          {travelling && !reduced && (
            <button className="tw-pill" onClick={() => engine?.skipTravel()}>
              Skip travel <Icon name="arrow" size={14} />
            </button>
          )}
          <button
            className="tw-pill"
            aria-pressed={cardVisible}
            onClick={() => {
              if (card) custodian.stop();
              setCard(!card);
              if (!card && arrived && !inRoom) navigate({ place: "portrait", focus: null });
            }}
          >
            <Icon name={custodian.sound ? "volume" : "mute"} size={15} />
            <span>The custodian</span>
          </button>
          <button className="tw-pill" aria-label="Directory" aria-expanded={panel === "directory"} onClick={() => setPanel(panel === "directory" ? null : "directory")}>
            <Icon name="compass" size={15} />
            <span>Directory</span>
          </button>
          <button className="tw-icon" aria-label="How to move" aria-expanded={panel === "help"} onClick={() => setPanel(panel === "help" ? null : "help")}>
            ?
          </button>
        </>} />
      {hover && !focus && (
        <div className="tw-tip" style={{ left: hover.x, top: hover.y }} aria-hidden="true">
          <strong>{hover.label}</strong>
          <span>{hover.hint}</span>
        </div>
      )}
      {notice && (
        <p className="tw-notice" role="status">
          {notice}{" "}
          <button aria-label="Dismiss" onClick={dismissNotice}>
            <Icon name="close" size={13} />
          </button>
        </p>
      )}
      {volume && engine && ready && focus?.kind === "book" && (
        <Reader
          key={volume.slug + (narrow ? "-s" : "-d")}
          volume={volume}
          engine={engine}
          metrics={narrow ? phonePage : desktopPage}
          single={narrow}
          settled={settled === volume.slug}
          start={focus.leaf ? { leaf: focus.leaf, part: focus.page ?? 1 } : null}
          admin={data.admin}
          shelfName={volume.slug === companionSlug ? "Return to the table" : "Return to the shelf"}
          sound={custodian.sound === true}
          suspended={!!report}
          onReport={section => openReport(section)}
          onMark={(mark) => {
            if (route.report) return;
            remember("marks", { ...memory<Record<string, Mark>>("marks", {}), [volume.slug]: mark });
            remember("last", volume.slug);
            if (mark.leaf === "front" && mark.part === 1) navigate({ place: route.place, focus: { kind: "book", slug: volume.slug } }, "replace");
            else navigate({ place: route.place, focus: { kind: "book", slug: volume.slug, leaf: mark.leaf, page: mark.part } }, "replace");
          }}
          onClose={putBack}
        />
      )}
      {report && volume && <ProjectReport key={volume.slug + "-report"} volume={volume} admin={data.admin}
        section={report.id} neighbors={reportNeighbors(volume, volumes)} onClose={closeReport}
        onSectionChange={section => navigate({ ...route, report: { section } }, "replace")}
        onProject={target => openReport(resolveReportSection(target)!.id, target)} />}
      {conversation && <div className="tw-conversation" onKeyDown={event => event.stopPropagation()}>
        <PortraitPanel scene={{ place: route.place, volumeId: volume?.slug, sectionId: report?.id, returnMarker: hash }}
          onNavigate={showPortraitDestination} onCancelMedia={quiet} cancelKey={cancelKey} onVoiceLevel={level => engine?.speakLive(level)}
          onVoiceStart={() => {
            // A live conversation is his greeting: the recorded welcome card must not compete with it.
            greeted.current = true; setCard(false);
            if (!focus && !report && route.place !== "portrait") {
              navigate({ place: "portrait", focus: null });
              // Face him at once rather than walking the house while he begins to speak.
              requestAnimationFrame(() => requestAnimationFrame(() => engine?.skipTravel()));
            }
          }}
          onClose={() => { setConversation(false); canvas.current?.focus(); }} />
      </div>}
      {object && engine && ready && focus?.kind === "object" && (
        <Inspector
          key={object.id}
          object={object}
          engine={engine}
          page={Math.min(Math.max(0, (focus.page ?? 1) - 1), Math.max(0, object.pages.length - 1))}
          settled={settled === object.id}
          missing={missing.id === object.id ? missing.pages : []}
          returnLabel={restName}
          onPage={(p) => navigate({ place: route.place, focus: { kind: "object", id: object.id, page: p + 1 } }, "replace")}
          onClose={putBack}
        />
      )}
      {focus?.kind === "screen" && engine && ready && (
        <Folio
          slots={slots}
          slot={focus.slot}
          clipId={focus.clip}
          onSelect={(slot, clip) => { quiet(); navigate({ place: "screen", focus: { kind: "screen", slot, ...(clip ? { clip } : {}) } }, "focus"); }}
          onClose={closeFolio}
          onPlay={custodian.yield}
        />
      )}
      {cardVisible && (
        <section className="tw-panel tw-custodian" aria-label="Judge John Overton, the custodian">
          <header>
            <p className="tw-over">The custodian · interpretive guide</p>
            <button className="tw-icon" aria-label="Close the custodian" onClick={() => { custodian.stop(); setCard(false); }}>
              <Icon name="close" size={15} />
            </button>
          </header>
          <h2>Judge John Overton</h2>
          <button className="tw-pill solid" onClick={openConversation}>Ask a question</button>
          {custodian.speech ? (
            <>
              <p className="tw-line" aria-live="polite">
                {reduced || !custodian.captions || custodian.speech.status === "done"
                  ? custodian.speech.text
                  : custodian.line || " "}
              </p>
              {custodian.speech.quote && <p className="tw-quote">{custodian.speech.quote}</p>}
              <div className="tw-transport">
                {custodian.speech.status === "playing" && (
                  <button className="tw-icon solid" aria-label="Pause the custodian" onClick={custodian.pause}>
                    <Icon name="pause" />
                  </button>
                )}
                {custodian.speech.status === "paused" && (
                  <button className="tw-icon solid" aria-label="Resume the custodian" onClick={custodian.resume}>
                    <Icon name="play" />
                  </button>
                )}
                <button className="tw-chip" onClick={custodian.replay}>
                  Replay
                </button>
                <button className="tw-chip" aria-pressed={custodian.sound === true} onClick={() => custodian.choose(custodian.sound !== true)}>
                  <Icon name={custodian.sound ? "volume" : "mute"} size={14} />
                  {custodian.sound ? "Sound on" : "Sound off"}
                </button>
                <button className="tw-chip" aria-pressed={custodian.captions} onClick={() => custodian.setCaptions(!custodian.captions)}>
                  Captions
                </button>
              </div>
            </>
          ) : (
            <p className="tw-line">
              {engaged
                ? "Ask me about the room, or choose where to go."
                : "The portrait above the mantel has noticed you. Judge Overton can introduce the room in his own voice, or you can read his words in silence."}
            </p>
          )}
          {(custodian.notice || !engaged) && custodian.notice && (
            <p className="tw-error" role="status">
              {custodian.notice}
            </p>
          )}
          <div className="tw-choices">
            {!engaged ? (
              <>
                <button
                  className="tw-pill solid"
                  onClick={() => {
                    custodian.choose(true);
                    setTimeout(() => custodian.play("greeting"), 0);
                  }}
                >
                  <Icon name="volume" size={15} />
                  Hear his welcome
                </button>
                <button
                  className="tw-pill"
                  onClick={() => {
                    custodian.choose(false);
                    setTimeout(() => custodian.play("greeting"), 0);
                  }}
                >
                  <Icon name="book" size={15} />
                  Read his welcome in silence
                </button>
              </>
            ) : (
              <>
                <button className="tw-pill" onClick={() => ask("projects", { place: "cabinet", focus: null })}>
                  Show me John’s projects
                </button>
                <button className="tw-pill" onClick={() => ask("letters", { place: "desk", focus: null })}>
                  Show me the letters
                </button>
                <button className="tw-pill" onClick={() => ask("room")}>
                  Tell me about this room
                </button>
                {lastVolume && marks[lastVolume.slug] && !focus && (
                  <button
                    className="tw-pill"
                    onClick={(e) => {
                      custodian.play("bookmark");
                      select({ kind: "book", slug: lastVolume.slug }, e.currentTarget, marks[lastVolume.slug]);
                    }}
                  >
                    Return to my place in {lastVolume.title}
                  </button>
                )}
              </>
            )}
            <button
              className="tw-pill"
              onClick={() => {
                if (engaged) custodian.play("explore");
                else custodian.stop();
                setTimeout(() => setCard(false), engaged ? 6500 : 0);
              }}
            >
              Let me explore
            </button>
          </div>
          <details className="tw-credit">
            <summary>About this portrait and voice</summary>
            <p>
              The likeness is a photographic copy of Ralph E. W. Earl’s 1817
              painting (Nell Savage Mahoney Papers, Tennessee Historical
              Society). The movement is an animated interpretation of that
              photograph. The words were newly written for this visit and are
              spoken by a synthetic voice; they are not historical quotations
              unless a source is named.
            </p>
            <a href="https://teva.contentdm.oclc.org/digital/collection/p15138coll33/id/285/" target="_blank" rel="noreferrer">
              Original photographic record ↗
            </a>
          </details>
        </section>
      )}
      {engine && <GuidedTour available={ready && !focus && !conversation && !leaving} arrived={arrived} travelling={travelling} speech={custodian.speech}
        begin={() => { quiet(); setCard(false); setPanel(null); if (custodian.sound === null) custodian.choose(false); }}
        go={place => { engine.resume(); navigate({ place, focus: null }, "focus"); }}
        speak={cue => { custodian.play(cue); setCard(true); }}
        stop={() => { custodian.stop(); engine.resume(); engine.controller.cancelTravel(); }}
        pause={() => { custodian.pause(); engine.pause(); }} resume={() => { engine.resume(); custodian.resume(); }} />}
      {!focus && ready && !leaving && (
        floorLevel === "ground" ? <button className="tw-walk-out tw-pill solid" onClick={walkOutside}>Walk back outside</button> :
        <aside className="tw-landing-note" aria-label="Upper landing reconstruction"><p>A reconstructed landing. The upper rooms remain closed; no upper-floor plan is available.</p><button className="tw-pill solid" onClick={() => { quiet(); navigate({ place: "entry", focus: null }); }}>Return downstairs</button></aside>
      )}
      {leaving && <p className="tw-exit-note" role="status">Walking back to the entrance…</p>}
      {!focus && ready && !travelling && reach.length > 0 && (
        <nav className="tw-reach" aria-label={"Within reach at " + here.title}>
          <span className="tw-over">Within reach</span>
          <div>
            {reach.some(r => r.target.kind === "screen") && <button onClick={() => {
              quiet(); setCard(false); navigate({ place: "screen", focus: { kind: "screen", slot: "soccer" } }, "focus");
            }}><strong>Soccer highlights</strong><small>All nine clips · two matches</small></button>}
            {reach.map((r) => (
              <button
                key={r.key}
                onClick={(e) => select(r.target, e.currentTarget)}
                onFocus={() => engine?.focusTarget(r.target)}
                onBlur={() => engine?.focusTarget(null)}
                onPointerEnter={() => engine?.focusTarget(r.target)}
                onPointerLeave={() => engine?.focusTarget(null)}
              >
                <strong>{r.label}</strong>
                {r.hint && <small>{r.hint}</small>}
              </button>
            ))}
          </div>
        </nav>
      )}
      {panel === "directory" && (
        <aside className="tw-panel tw-directory" aria-label="Directory">
          <header>
            <p className="tw-over">Directory</p>
            <button className="tw-icon" aria-label="Close the directory" onClick={() => setPanel(null)}>
              <Icon name="close" size={15} />
            </button>
          </header>
          <label className="tw-search">
            <Icon name="search" size={15} />
            <input type="search" placeholder="Find a room, project or document" aria-label="Find a room, project or document" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          </label>
          <div className="tw-scroll">
            {(!query || /soccer|football|highlights|match|goal|film/i.test(query)) && <button onClick={() => {
              quiet(); setPanel(null); setCard(false); navigate({ place: "screen", focus: { kind: "screen", slot: "soccer" } }, "focus");
            }}><strong>Soccer highlights</strong><small>All nine clips from Gun Club and Wellington</small></button>}
            {found.places.length > 0 && <h3>Rooms and stops</h3>}
            {(!query || /landing|stair|upper/i.test(query)) && <button onClick={() => { quiet(); setPanel(null); navigate({ place: "entry", focus: null, landing: true }); }}><strong>The upper landing</strong><small>Climb the stair to the reconstructed landing.</small></button>}
            {found.places.map((p) => (
              <button
                key={p}
                aria-current={route.place === p && !focus ? "location" : undefined}
                onClick={() => {
                  setPanel(null);
                  navigate({ place: p, focus: null });
                }}
              >
                <strong>{places[p].title}</strong>
                <small>{places[p].note}</small>
              </button>
            ))}
            {found.volumes.length > 0 && <h3>Volumes</h3>}
            {found.volumes.map((v) => (
              <button
                key={v.slug}
                onClick={(e) => {
                  setPanel(null);
                  select({ kind: "book", slug: v.slug }, e.currentTarget);
                }}
              >
                <strong>{v.title}</strong>
                <small>{shelfTitle(v)}</small>
              </button>
            ))}
            {found.objects.length > 0 && <h3>Letters, maps and records</h3>}
            {found.objects.map((o) => (
              <button
                key={o.id}
                onClick={(e) => {
                  setPanel(null);
                  select({ kind: "object", id: o.id }, e.currentTarget);
                }}
              >
                <strong>{o.title}</strong>
                <small>{o.date}</small>
              </button>
            ))}
            {!found.places.length && !found.volumes.length && !found.objects.length && <p>Nothing in the house matches “{query}”.</p>}
          </div>
          <footer>
            <a href="/catalog">
              Text catalog <Icon name="diagonal" size={13} />
            </a>
            <button onClick={() => setPanel("help")}>Light and seasons</button>
            <button onClick={() => onPlain()}>Plain page view</button>
          </footer>
        </aside>
      )}
      {panel === "help" && (
        <aside className="tw-panel tw-help" aria-label="How to move">
          <header>
            <p className="tw-over">How to move</p>
            <button className="tw-icon" aria-label="Close" onClick={() => setPanel(null)}>
              <Icon name="close" size={15} />
            </button>
          </header>
          <MoveHelp engine={engine} />
          {engine && <EnvironmentControls engine={engine} />}
        </aside>
      )}
      {!focus && ready && engine && (
        <Controls
          engine={engine}
          place={route.place}
          level={floorLevel}
          onPlace={(p) => {
            // The address may already name this stop while the visitor has wandered off.
            if (p === route.place) engine.controller.go(p);
            else navigate({ place: p, focus: null });
          }}
        />
      )}
      <p className="tw-sr" aria-live="polite">
        {say}
      </p>
    </div>
  );
}
