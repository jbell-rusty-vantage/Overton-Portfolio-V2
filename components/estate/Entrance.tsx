"use client";
import { useState } from "react";
import entrance from "@/content/library/entrance-delivery.json";
import dynamic from "next/dynamic";
import type { EstateData } from "@/lib/estate/model";
const EntranceLive = dynamic(() => import("./EntranceLive"), { ssr: false });
import { Icon } from "./Marks";
import { Plate } from "./Plate";
import { portfolioHref } from "@/lib/library/portfolio";

const views = [
  {
    image: "approach",
    eyebrow: "Nashville, Tennessee",
    name: "Travellers",
    italic: "Rest",
    copy: "I’m John Overton Bell, a descendant of Judge John Overton. Walk through the house he began in 1799, meet him in his library, and find my work in the family cabinet.",
    action: "Enter the house",
    href: "#entry",
    caption: "The south front",
    alt: "An interpretive view of the white Federal house in late-afternoon light under an oak canopy.",
  },
  {
    image: "library",
    eyebrow: "The southwest room",
    name: "The judge’s",
    italic: "library",
    copy: "A portrait, a writing table and two volumes of Tennessee case law. Step inside the room marked Library on the federal survey.",
    action: "Visit the library",
    href: "#library",
    caption: "The southwest library",
    alt: "Afternoon light reaches the southwest library’s west mantel, writing table and books.",
  },
  {
    image: "cabinet",
    eyebrow: "John Overton Bell · Present day",
    name: "The family",
    italic: "cabinet",
    copy: "Open my work desk for software projects, engineering notes and recordings. The projection drawer holds a moment from the football pitch.",
    action: "Open my portfolio",
    href: "#cabinet",
    caption: "The family cabinet",
    alt: "A modern laptop and notebook inside a walnut writing cabinet.",
  },
] as const;
const destinations = [
  {
    category: "The house",
    title: "The southwest library",
    image: "library",
    href: "#library",
    description: "Meet the judge at his writing table.",
  },
  {
    category: "History & law",
    title: "The historical collection",
    image: "reports",
    href: "#collection",
    description: "Read the records behind the house.",
  },
  {
    category: "My portfolio",
    title: "The family cabinet",
    image: "cabinet",
    href: "#cabinet",
    description: "Browse my projects, recordings and field notes.",
  },
] as const;
export default function Entrance({
  map,
  world = false,
  resume = "",
  onEnter,
  data,
}: {
  map: () => void;
  data?: EstateData;
  /** The continuous 3D library is available: the principal action enters it. */
  world?: boolean;
  /** Where the visitor last stood inside the house in this session, as a hash. */
  resume?: string;
  /** Called before entering: true to walk in through the door, false to arrive directly. */
  onEnter?: (walk: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const view = views[index];
  const enter = world && index === 0;
  const back = world && resume && resume !== "#library" ? resume : "";
  return (
    <>
      <section
        className={"ea-hero ea-hero-" + index}
        aria-label="Featured views of the estate"
        aria-roledescription="carousel"
      >
        <Plate key={view.image} name={view.image} alt={view.alt} priority />
        {world && index === 0 && data && (process.env.NODE_ENV === "development" && typeof location !== "undefined" && new URLSearchParams(location.search).get("entrance") === "live"
          ? <EntranceLive data={data} />
          : <picture><source media="(max-width: 700px)" srcSet={entrance["390"].url} /><img className="ea-live-first-frame" data-ready="true" src={entrance["1440"].url} alt="" aria-hidden="true" fetchPriority="high" /></picture>)}
        <div className="ea-hero-shade" />
        <div className="ea-wrap ea-hero-content">
          <div className="ea-hero-copy" aria-live="polite" aria-atomic="true">
            <p className="ea-overline">
              <span className="ea-rule" /> {view.eyebrow}
              {index === 0 && " · House begun 1799"}
            </p>
            <h1 tabIndex={-1}>
              {view.name} <em>{view.italic}</em>
            </h1>
            <p className="ea-hero-intro">{view.copy}</p>
            <div className="ea-actions">
              <a
                className="ea-button gold"
                href={enter ? "#library" : view.href}
                onClick={() => onEnter?.(enter)}
              >
                {enter ? "Enter the library" : view.action}
                <Icon name="arrow" />
              </a>
              {enter && back && (
                <a
                  className="ea-button glass"
                  href={back}
                  onClick={() => onEnter?.(false)}
                >
                  <Icon name="back" size={16} />
                  Return to where I was
                </a>
              )}
              <a
                className="ea-button glass"
                href={portfolioHref(data?.admin)}
              >
                <Icon name={index === 2 ? "book" : "grid"} size={16} />
                Browse portfolio
              </a>
            </div>
          </div>
          <div className="ea-hero-bottom">
            <div
              className="ea-slide-controls"
              aria-label="Select an estate view"
            >
              <span className="ea-counter">
                0{index + 1} <i>/</i> 03
              </span>
              {views.map((v, i) => (
                <button
                  key={v.image}
                  type="button"
                  aria-label={"Show " + v.caption.toLowerCase()}
                  aria-pressed={i === index}
                  onClick={() => setIndex(i)}
                >
                  <span />
                </button>
              ))}
            </div>
            <span className="ea-photo-label">
              <Icon name="image" size={15} />
              {view.caption} <i /> Interpretive view
            </span>
          </div>
        </div>
      </section>
      <section className="ea-wrap ea-intro" aria-labelledby="intro-title">
        <figure className="ea-intro-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/travellers-rest/archive/judge-overton.webp"
            alt="Ralph E. W. Earl’s 1817 portrait of Judge John Overton."
            loading="lazy"
          />
          <figcaption>Judge John Overton · Ralph E. W. Earl, 1817</figcaption>
        </figure>
        <div>
          <p className="ea-overline">
            <span className="ea-rule" /> From John Overton Bell
          </p>
          <h2 id="intro-title">This was my ancestor’s house.</h2>
          <p className="ea-lede">
            I’m John Overton Bell. I am a descendant of Judge John Overton,
            and my middle name was chosen after him. Travellers Rest was his
            home, and I visited it many times when I was young.
          </p>
          <p>
            So I keep my portfolio in his library. His portrait will greet you
            and show you the room. The letters on the writing table are his.
            The books in the cabinet by the window are mine: each is a project
            you can take down, open and read.
          </p>
          <div className="ea-actions">
            <a
              className="ea-button dark"
              href={world ? "#library" : "#entry"}
              onClick={() => onEnter?.(world)}
            >
              {world ? "Enter the library" : "Enter the house"}
              <Icon name="arrow" />
            </a>
            <a
              className="ea-button outline"
              href={portfolioHref(data?.admin)}
            >
              <Icon name="grid" size={16} />
              Go straight to my projects
            </a>
          </div>
        </div>
      </section>
      <section
        className="ea-wrap ea-destinations"
        aria-labelledby="explore-title"
      >
        <div className="ea-section-heading">
          <div>
            <p className="ea-overline">
              <span className="ea-rule" /> Visit directory
            </p>
            <h2 id="explore-title">Explore the estate</h2>
          </div>
          <button className="ea-text-button" onClick={map}>
            <Icon name="map" />
            Estate map
            <Icon name="diagonal" size={14} />
          </button>
        </div>
        <div className="ea-cards">
          {destinations.map((d) => (
            <a
              key={d.href}
              href={d.href}
              className="ea-card"
              onClick={() => onEnter?.(false)}
            >
              <div className="ea-card-image">
                <Plate
                  name={d.image}
                  alt=""
                  size="(max-width: 700px) 94vw, 32vw"
                />
              </div>
              <div className="ea-card-body">
                <p className="ea-overline">{d.category}</p>
                <h3>{d.title}</h3>
                <p>{d.description}</p>
                <span className="ea-card-arrow">
                  <Icon name="diagonal" size={20} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
