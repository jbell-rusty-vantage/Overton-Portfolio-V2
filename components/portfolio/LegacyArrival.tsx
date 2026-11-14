"use client";
import { useEffect } from "react";
import { isWorldFragment } from "@/lib/library/paths";
export default function LegacyArrival() {
  useEffect(() => {
    const arrive = () => {
      if (isWorldFragment(location.hash)) { location.replace("/library" + location.hash); return; }
      if (new URLSearchParams(location.search).get("from") === "projects") {
        const hash = /^#work-[a-z0-9-]+$/.test(location.hash) ? location.hash : "#selected-work";
        history.replaceState(history.state, "", "/" + hash);
        document.getElementById(hash.slice(1))?.scrollIntoView();
      }
    };
    arrive();
    window.addEventListener("hashchange", arrive);
    return () => window.removeEventListener("hashchange", arrive);
  }, []);
  return null;
}
