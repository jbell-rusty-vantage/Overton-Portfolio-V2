import "server-only";
import { existsSync } from "node:fs";
import { connection } from "next/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { layoutSchema, roomAnchors } from "./program";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { directLoopback } from "@/lib/auth/local-office";
import { getCollection, isLocalReview } from "@/lib/library/catalog";
import { publicMedia, readable } from "@/lib/library/policy";
import { resolvePages } from "@/lib/library/pages";
import type { Volume } from "@/lib/library/model";
import type {
  EstateData,
  EstateProgram,
  ExhibitMedia,
  WorldProgram,
} from "./model";
import { objectFiles, roomObjects } from "./objects";
import localProgram from "@/content/travellers-rest/program.json";
import narration from "@/content/travellers-rest/narration.json";
import receipt from "@/content/travellers-rest/blob-manifest.json";
import companion from "@/content/travellers-rest/companion.json";

async function readProgram(
  projects: Volume[],
  draft: boolean,
): Promise<EstateProgram | null> {
  const layout = await db.uiLayout.findUnique({
    where: { slug: "travellers-rest-visit" },
    select: { blocks: true },
  });
  const parsed = layoutSchema.safeParse(layout?.blocks);
  if (!parsed.success) return null;
  const p = parsed.data[0].props;
  const now = Date.now();
  if (
    !draft &&
    ((p.featuredFrom && Date.parse(p.featuredFrom) > now) ||
      (p.featuredUntil && Date.parse(p.featuredUntil) <= now))
  )
    return null;
  const row = await db.book.findUnique({
    where: { slug: p.companion },
    include: { pages: { orderBy: { position: "asc" } } },
  });
  if (!row || row.entityId || row.entityType || !readable(row, false, draft))
    return null;
  if (!draft) {
    const rooms = await db.libraryZone.count({
      where: {
        slug: { in: roomAnchors.map((r) => r.slug) },
        display: { in: ["published", "featured"] },
      },
    });
    if (rooms !== roomAnchors.length) return null;
  }
  const media = await db.mediaAsset.findMany({
    where: { id: { in: Object.values(p.media) }, deletedAt: null },
    select: { id: true, url: true, kind: true, checksum: true },
  });
  function url(id: string | undefined, kind: string) {
    const asset = media.find((m) => m.id === id && m.kind === kind);
    if (!asset) return undefined;
    const safe = publicMedia(asset.url);
    if (!safe) return undefined;
    // Loopback rehearsals can serve the exact verified delivery bytes without a CDN round trip.
    return draft && process.env.NODE_ENV === "development"
      ? (receipt.find((m) => m.url === safe && m.sha256 === asset.checksum)
          ?.localUrl ?? safe)
      : safe;
  }
  function exhibit(
    c: { media: string; poster?: string; track?: string },
    kind: string,
  ): ExhibitMedia | undefined {
    const src = url(p.media[c.media], kind);
    if (!src) return undefined;
    return {
      src,
      poster: url(p.media[c.poster ?? ""], "image"),
      track: url(p.media[c.track ?? ""], "document"),
    };
  }
  let world: WorldProgram | null = null;
  if (p.edition === 2) {
    const keys = new Map(objectFiles().map((f) => [f.url, f.key]));
    const placed = new Set(p.objects.map((o) => o.id));
    const portrait = url(p.media[p.portrait], "image");
    const timeline = url(p.media[p.voice.timeline], "document");
    const audio: Record<string, string> = {};
    for (const c of p.voice.cues) {
      const src = url(p.media[c.audio], "audio");
      if (src) audio[c.id] = src;
    }
    const kitHigh = p.kit && url(p.media[p.kit.high], "model3d"),
      kitLow = p.kit && url(p.media[p.kit.low], "model3d");
    if (portrait)
      world = {
        scenes: { high: "", low: "" },
        portrait,
        kit: kitHigh && kitLow ? { high: kitHigh, low: kitLow } : null,
        objects: roomObjects((local) =>
          url(p.media[keys.get(local) ?? ""], "image"),
        ).filter((o) => o.form === "card" || placed.has(o.id)),
        voice: { timeline: timeline ?? null, audio },
        placements: p.placements,
      };
  }
  const rows = await db.sceneAsset.findMany({
    where: {
      slug: { in: Object.values(p.scenes) },
      ...(draft ? { version: p.edition } : { isActive: true }),
    },
    select: { slug: true, mediaId: true },
  });
  function scene(slug: string) {
    const matches = rows.filter((r) => r.slug === slug);
    return matches.length === 1
      ? url(matches[0].mediaId, "model3d")
      : undefined;
  }
  const high = scene(p.scenes.high),
    low = scene(p.scenes.low);
  const book: Volume = {
    slug: row.slug,
    title: row.title,
    summary: row.subtitle ?? "",
    kind: "Book",
    shelf: null,
    position: 1,
    plate: 0,
    tags: [],
    pages: resolvePages(row.pageMode, [], row.pages),
  };
  const spreads = p.cues.flatMap((c) => {
    if (c.kind !== "spread") return [];
    const leaf = companion.leaves[c.page - 1];
    return leaf ? [{ key: leaf.key, object: c.object, label: c.label }] : [];
  });
  let desk: EstateProgram["desk"] = null;
  let film: ExhibitMedia | null = null;
  for (const c of p.cues) {
    if (c.kind === "screen" && projects.some((v) => v.slug === c.project)) {
      desk ??= { project: c.project };
      if (c.project === desk.project)
        desk[c.slot] = exhibit(c, c.slot === "main" ? "video" : "image");
    }
    if (c.kind === "clip") film = exhibit(c, "video") ?? null;
  }
  if (world && high && low) world.scenes = { high, low };
  else if (world) world = null;
  // A kit that has been built but not yet imported is still shown in a loopback draft.
  if (
    world &&
    !world.kit &&
    draft &&
    process.env.NODE_ENV === "development" &&
    existsSync("public/travellers-rest/kit.glb")
  )
    world.kit = {
      high: "/travellers-rest/kit.glb",
      low: "/travellers-rest/kit-low.glb",
    };
  // Until the continuous edition has been imported, a loopback draft review reads the
  // same verified delivery files straight from the checkout.
  if (!world && draft && process.env.NODE_ENV === "development")
    world = checkoutWorld();
  return {
    book,
    spreads,
    scenes: high && low ? { high, low } : null,
    portrait: url(p.media.custodian, "video") ?? null,
    desk,
    film,
    world,
  };
}
function checkoutWorld(): WorldProgram | null {
  if (localProgram.edition !== 2) return null;
  const audio: Record<string, string> = {};
  for (const c of narration.cues)
    audio[c.id] = "/travellers-rest/voice/" + c.id + ".mp3";
  return {
    scenes: {
      high: "/travellers-rest/world-v2.glb",
      low: "/travellers-rest/world-v2-low.glb",
    },
    portrait: "/travellers-rest/archive/judge-overton.webp",
    kit: existsSync("public/travellers-rest/kit.glb")
      ? {
          high: "/travellers-rest/kit.glb",
          low: "/travellers-rest/kit-low.glb",
        }
      : null,
    objects: roomObjects((local) => local),
    voice: { timeline: "/travellers-rest/voice/timeline.json", audio },
    placements: localProgram.placements,
  };
}
export async function getEstate(
  scope: "visitor" | "local" | "admin" = "visitor",
): Promise<EstateData> {
  await connection();
  const admin = scope === "admin";
  if (admin) await requireAdmin();
  if (
    scope === "local" &&
    (process.env.NODE_ENV !== "development" || !directLoopback(await headers()))
  )
    notFound();
  const review = admin || scope === "local" || (await isLocalReview());
  const collection = await getCollection({ admin, database: true });
  const projects = collection.volumes.filter((v) => v.kind === "Project");
  const result = {
    projects,
    admin,
    review,
    unavailable: collection.source === "unavailable",
  };
  if (result.unavailable) return { ...result, program: null };
  try {
    return { ...result, program: await readProgram(projects, review) };
  } catch {
    console.error("Travellers Rest program unavailable");
    return { ...result, program: null, unavailable: true };
  }
}
