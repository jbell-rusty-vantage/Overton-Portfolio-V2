import type { MetadataRoute } from "next";
import { getCollection } from "@/lib/library/catalog";
import { detailHref } from "@/lib/library/paths";
import { publicOrigin } from "@/lib/library/origin";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Request-time publication projection; withdrawal takes effect immediately.
  const data = await getCollection({ database: true });
  const paths = ["/", "/library", "/resume", "/catalog", "/performances"];
  if (data.source === "database") paths.push(...data.volumes.filter(v => v.indexable).map(detailHref));
  return [...new Set(paths)].map(path => ({ url: new URL(path, publicOrigin).href }));
}
