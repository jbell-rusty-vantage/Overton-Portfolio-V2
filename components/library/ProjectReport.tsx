"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { detailHref, withinPreview } from "@/lib/library/paths";
import { type Block, type Collection, type ReadingScope, type Volume } from "@/lib/library/types";
import { reportSectionId, reportSections, resolveReportSection } from "@/lib/library/report";
import { imageDelivery } from "@/lib/library/image-delivery";
import { portfolioHref } from "@/lib/library/portfolio";
import "./report.css";

export type ProjectReportProps = {
  volume: Volume;
  admin?: ReadingScope;
  source?: Collection["source"];
  section?: string | null;
  onSectionChange?: (section: string) => void;
  /** Providing onClose opens a native modal; omitting it renders the same report inline. */
  onClose?: () => void;
  neighbors?: { previous?: Volume; next?: Volume };
  onProject?: (volume: Volume) => void;
  /** Supplied only after the server validates this book against the estate projection. */
  libraryHref?: string;
};

export function FigureViewer({ url, text, close }: { url: string; text: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current!;
    node.showModal();
    return () => { node.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="project-report-picture" aria-label={text || "Enlarged figure"} onCancel={(event) => { event.preventDefault(); event.stopPropagation(); close(); }} onKeyDown={(event) => {
    event.stopPropagation();
    if (event.key === "Tab") { event.preventDefault(); dialog.current?.querySelector("button")?.focus(); }
  }}>
    <button autoFocus onClick={close} aria-label="Close enlarged figure">Close figure ×</button>
    <div className="report-picture-pan">
      {/* eslint-disable-next-line @next/next/no-img-element -- full natural image, browser zoom and panning */}
      <img src={url} alt={text} />
    </div>
    <p>{text}</p>
  </dialog>;
}

function ReportBlocks({ blocks, title, admin, enlarge }: { blocks: Block[]; title: string; admin: ReadingScope; enlarge: (url: string, text: string) => void }) {
  const output: React.ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.kind === "heading") {
      if (block.text.trim().toLowerCase() !== title.trim().toLowerCase()) output.push(<h3 key={i}>{block.text}</h3>);
    } else if (block.kind === "metric") {
      const metrics = [block];
      const key = i;
      while (blocks[i + 1]?.kind === "metric") metrics.push(blocks[++i]);
      output.push(<dl className="report-metrics" key={key}>{metrics.map((metric, at) => <div key={at}><dd>{metric.text}</dd><dt>{metric.label}</dt></div>)}</dl>);
    } else if (block.kind === "code") {
      output.push(<pre tabIndex={0} aria-label="Code example; scroll horizontally for long lines" key={i}><code>{block.text}</code></pre>);
    } else if (block.kind === "image" && block.url) {
      const url = block.detail ?? block.url;
      output.push(<figure key={i}><button className="report-figure" onClick={() => enlarge(url, block.text)} aria-label={"Enlarge: " + block.text}>
        {/* eslint-disable-next-line @next/next/no-img-element -- natural ratio is content, not a fixed thumbnail crop */}
        <img {...imageDelivery(block.url)} alt={block.text} loading="lazy" /><span>{block.detail ? "View detailed diagram" : "Enlarge"} ↗</span>
      </button><figcaption>{block.text}</figcaption></figure>);
    } else if (block.kind === "video" && block.url) {
      output.push(<figure className="report-video" key={i}><video controls playsInline preload="none" poster={block.poster} src={block.url} aria-label={block.text}>
        {block.captions && <track kind="captions" label="English" srcLang="en" src={block.captions} default />}
      </video><figcaption>{block.text}{block.transcript && <> · <a href={block.transcript} target="_blank" rel="noreferrer">Read transcript</a></>}</figcaption></figure>);
    } else if (block.kind === "link" && block.url) {
      const inside = block.url.startsWith("/");
      output.push(<p className="report-link" key={i}><a href={inside ? withinPreview(block.url, admin) : block.url} target={inside ? undefined : "_blank"} rel={inside ? undefined : "noreferrer"}>{block.text}<span aria-hidden="true"> ↗</span></a></p>);
    } else {
      output.push(<p key={i}>{block.text}</p>);
    }
  }
  return <div className="report-prose">{output}</div>;
}

export default function ProjectReport({ volume, admin = false, source, section, onSectionChange, onClose, neighbors, onProject, libraryHref }: ProjectReportProps) {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const sections = useMemo(() => reportSections(volume), [volume]);
  const [active, setActive] = useState(section ?? sections[0]?.id ?? "");
  const [picture, setPicture] = useState<{ url: string; text: string } | null>(null);
  const modal = !!onClose;
  const callback = useRef(onSectionChange);
  useEffect(() => { callback.current = onSectionChange; }, [onSectionChange]);
  useEffect(() => {
    if (!modal) return;
    const node = dialog.current!;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node.querySelectorAll("video").forEach((video) => video.pause());
      node.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [modal]);
  useEffect(() => {
    let requested = section;
    if (!requested && !modal && location.hash.startsWith("#report-section-")) {
      try { requested = decodeURIComponent(location.hash.slice(16)); } catch { return; }
    }
    if (!requested) return;
    const target = resolveReportSection(volume, requested);
    if (target) document.getElementById(reportSectionId(target.id))?.scrollIntoView({ block: "start" });
  }, [section, volume, modal]);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      const id = (visible?.target as HTMLElement | undefined)?.dataset.section;
      if (id) setActive(id);
    }, { root: modal ? node : null, rootMargin: "-100px 0px -55% 0px", threshold: 0 });
    node.querySelectorAll("[data-section]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections, modal]);
  const jump = (id: string) => {
    setActive(id);
    document.getElementById(reportSectionId(id))?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    if (callback.current) callback.current(id);
    else history.replaceState(history.state, "", "#" + reportSectionId(id));
  };
  const status = volume.status ?? volume.tags.find((tag) => /^(live|in development|early stage|earlier work|launching)$/i.test(tag));
  const links = volume.pages.flatMap((page) => page.blocks).filter((block) => block.kind === "link" && block.url).slice(0, 3);
  const date = (value: string) => new Date(value + (value.length === 10 ? "T12:00:00Z" : "")).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const content = <div ref={root} className={"project-report" + (modal ? " report-modal-content" : "")} data-report={volume.slug}>
    <div className="report-top">
      {onClose ? <button autoFocus onClick={onClose} aria-label="Close report and return to book">← Return to book</button> : <a href={portfolioHref(admin, volume.slug)}>← Selected Work</a>}
      <span>{source === "fixtures" ? "Sample collection" : admin || source === "review" ? "Private draft" : "John Overton Bell"}</span>
      {!modal && libraryHref && <a href={libraryHref}>Open book ↗</a>}
    </div>
    <header className="report-header">
      <div className="report-heading"><p className="report-eyebrow">Project report{status ? " · " + status : ""}</p><h1>{volume.title}</h1><p className="report-deck">{volume.summary}</p>
        <dl className="report-facts">
          {volume.role && <div><dt>Role</dt><dd>{volume.role}</dd></div>}
          {volume.clientLabel && <div><dt>Client</dt><dd>{volume.clientLabel}</dd></div>}
          {volume.startedOn && <div><dt>Period</dt><dd>{date(volume.startedOn)}{volume.endedOn ? " — " + date(volume.endedOn) : " — present"}</dd></div>}
        </dl>
        <ul className="report-tags" aria-label="Technologies and context">{volume.tags.filter((tag) => tag !== status).map((tag) => <li key={tag}>{tag}</li>)}</ul>
        {links.length > 0 && <div className="report-primary-links">{links.map((link, i) => <a key={i} href={link.url!.startsWith("/") ? withinPreview(link.url!, admin) : link.url} target={link.url!.startsWith("/") ? undefined : "_blank"} rel="noreferrer">{link.text} ↗</a>)}</div>}
      </div>
      {volume.cover && <figure className="report-poster">
        {/* eslint-disable-next-line @next/next/no-img-element -- display the entire authored poster */}
        <img {...imageDelivery(volume.cover)} alt={volume.title + " project poster"} fetchPriority="high" />
      </figure>}
    </header>
    <div className="report-layout">
      <nav className="report-contents" aria-label="Report sections"><p>In this report</p><ol>{sections.map((item, i) => <li key={item.id}><a href={"#" + reportSectionId(item.id)} aria-current={active === item.id ? "location" : undefined} onClick={(event) => { event.preventDefault(); jump(item.id); }}><span>{String(i + 1).padStart(2, "0")}</span>{item.title}</a></li>)}</ol></nav>
      <article className="report-body" aria-label={volume.title + " report"}>{sections.map((item, i) => <section key={item.id} id={reportSectionId(item.id)} data-section={item.id}><p className="report-section-number">{String(i + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}</p><h2>{item.title}</h2><ReportBlocks blocks={item.page.blocks} title={item.title} admin={admin} enlarge={(url, text) => setPicture({ url, text })} /></section>)}</article>
    </div>
    <footer className="report-footer"><p>Continue through the collection</p><div>{(["previous", "next"] as const).map((direction) => {
      const adjacent = neighbors?.[direction];
      return adjacent && <a key={direction} href={withinPreview(detailHref(adjacent), admin)} onClick={onProject ? (event) => { event.preventDefault(); onProject(adjacent); } : undefined}><span>{direction === "previous" ? "← Previous project" : "Next project →"}</span><strong>{adjacent.title}</strong></a>;
    })}{onClose && <button onClick={onClose}>Return to the marked page ↗</button>}</div></footer>
    {picture && <FigureViewer {...picture} close={() => setPicture(null)} />}
  </div>;
  return modal ? <dialog ref={dialog} className="project-report-dialog" aria-label={volume.title + " full report"} onCancel={(event) => { event.preventDefault(); onClose?.(); }} onKeyDown={(event) => event.stopPropagation()}>{content}</dialog> : content;
}
