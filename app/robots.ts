import type { MetadataRoute } from "next";
import { publicOrigin } from "@/lib/library/origin";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/dev", "/samples"] }, sitemap: new URL("/sitemap.xml", publicOrigin).href };
}
