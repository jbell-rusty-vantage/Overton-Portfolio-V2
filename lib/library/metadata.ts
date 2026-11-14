import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getCollection } from "./catalog";
import { detailHref } from "./paths";
import { type VolumeKind } from "./types";

async function canonical(path: string) {
  if (process.env.LIBRARY_PUBLIC_ORIGIN) {
    try {
      const origin = new URL(process.env.LIBRARY_PUBLIC_ORIGIN);
      if (origin.protocol === "https:" && !origin.username && !origin.password)
        return new URL(path, origin).href;
    } catch {}
  }
  const host = (await headers()).get("host") ?? "";
  if (/^(127\.0\.0\.1|localhost):\d+$/.test(host))
    return "http://" + host + path;
}
export async function volumeMetadata(
  slug: string,
  project = false,
  kind?: VolumeKind,
): Promise<Metadata> {
  const data = await getCollection({ direct: slug });
  const volume = data.volumes.find(
    (v) =>
      (v.slug === slug || (project && v.projectSlug === slug)) &&
      (!project || v.kind === "Project") &&
      (!kind || v.kind === kind),
  );
  if (!volume) return { title: "Volume unavailable", robots: { index: false } };
  return {
    title: volume.title,
    description: volume.summary,
    alternates: { canonical: await canonical(detailHref(volume)) },
    robots: { index: data.source === "database" && !!volume.indexable },
  };
}
