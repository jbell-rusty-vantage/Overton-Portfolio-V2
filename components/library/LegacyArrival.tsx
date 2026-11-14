"use client";
import { useEffect } from "react";
import { resolveLegacyArrival } from "@/lib/library/paths";
import { type Volume } from "@/lib/library/types";
export default function LegacyArrival({ volumes, placed, admin = false }: { volumes: Volume[]; placed: string[]; admin?: boolean }) {
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (!["view", "zone", "shelf", "book"].some(k => query.has(k))) return;
    const target = resolveLegacyArrival(query, location.hash, volumes, placed, admin);
    const url = new URL(target, location.origin);
    if (url.pathname === location.pathname) {
      history.replaceState(history.state, "", target);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else location.replace(target);
  }, [volumes, placed, admin]);
  return <noscript><p>Legacy links now open Travellers Rest. <a href={admin ? "/admin/preview/library?catalog=1" : "/catalog"}>Read the collection without 3D</a>.</p></noscript>;
}
