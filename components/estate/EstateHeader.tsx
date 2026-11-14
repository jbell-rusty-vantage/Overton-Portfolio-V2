import type { ReactNode } from "react";
import { HouseMark } from "./Marks";

/** One navigation vocabulary and header for the entrance, plain pages and world. */
export default function EstateHeader({ world = false, subtitle, active, actions, menu = false, onNavigate }: {
  world?: boolean; subtitle: string; active: string; actions: ReactNode; menu?: boolean; onNavigate?: () => void;
}) {
  const links = <>
    <a href="#approach" aria-current={active === "approach" ? "page" : undefined} onClick={onNavigate}>The estate</a>
    <a href={world ? "#desk" : "#collection"} aria-current={["desk", "drawers", "collection", "reports"].includes(active) ? "page" : undefined} onClick={onNavigate}>Historical collection</a>
    <a href="#cabinet" aria-current={["cabinet", "screen"].includes(active) ? "page" : undefined} onClick={onNavigate}>My portfolio</a>
    <a href="/resume" onClick={onNavigate}>Résumé</a>
  </>;
  const content = <>
    <a className={world ? "tw-brand" : "ea-brand"} href="#approach" title="Back to the entrance" onClick={onNavigate}>
      <HouseMark /><span><strong>Overton Archive</strong><small>{subtitle}</small></span>
    </a>
    <nav className={world ? "tw-nav" : "ea-desktop-nav"} aria-label="Main navigation">{links}</nav>
    <div className={world ? "tw-actions" : "ea-mast-tools"}>{actions}</div>
  </>;
  return <header className={world ? "tw-top" : "ea-mast"}>
    {world ? content : <div className="ea-wrap ea-mast-inner">{content}</div>}
    {!world && menu && <nav className="ea-mobile-nav" aria-label="Mobile navigation">{links}</nav>}
  </header>;
}
