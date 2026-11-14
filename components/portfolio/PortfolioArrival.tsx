"use client";

import { useEffect } from "react";

/** Native fragment navigation can precede a streamed server-rendered collection. */
export default function PortfolioArrival() {
  useEffect(() => {
    const arrive = () => {
      let id: string;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      if (id !== "selected-work" && !id.startsWith("work-")) return;
      const target = document.getElementById(id);
      target?.scrollIntoView({ block: "start", behavior: "instant" });
    };
    const rememberSelection = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      const card = link?.closest<HTMLElement>(".pf-project[id]");
      if (!link || !card || link.target === "_blank") return;
      const target = new URL(link.href);
      if (target.origin !== location.origin) return;
      // Keep Next's history state intact; only mark this selected-work entry.
      // replaceState deliberately does not scroll or fire hashchange.
      history.replaceState(history.state, "", location.pathname + location.search + "#" + card.id);
    };
    arrive();
    window.addEventListener("hashchange", arrive);
    document.addEventListener("click", rememberSelection, true);
    return () => {
      window.removeEventListener("hashchange", arrive);
      document.removeEventListener("click", rememberSelection, true);
    };
  }, []);
  return null;
}
