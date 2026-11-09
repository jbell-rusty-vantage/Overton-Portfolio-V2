import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { directLoopback } from "@/lib/auth/local-office";
import { connection } from "next/server";
import starters from "@/assets/library/starters.json";
import { resolvePages } from "./pages";
import { sampleCollection } from "./fixtures";
import {
  type Block,
  type Collection,
  type Leaf,
  type Screen,
  type Volume,
  type VolumeKind,
  shelves,
  zones,
} from "./model";
import {
  blocksFrom,
  httpsUrl,
  publicMedia,
  publicImage,
  readable,
  safeManuscript,
  type Visibility,
} from "./policy";

type Options = { direct?: string; admin?: boolean };
type Target = Visibility & {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: VolumeKind;
  clientLabel?: string;
  tags: string[];
  blocks: Block[];
  links: Block[];
  cover?: string;
};
const baseSelect = {
  id: true,
  slug: true,
  title: true,
  display: true,
  publishedAt: true,
  deletedAt: true,
} as const;
const coverSelect = {
  select: { url: true, deletedAt: true, kind: true },
} as const;
const baseScene = "/library/hall.glb";
const getCover = (
  m: { url: string; kind: string; deletedAt: Date | null } | null,
) => (m && !m.deletedAt && m.kind === "image" ? publicImage(m.url) : undefined);
function prose(text: string): Block {
  return { kind: "text", text };
}
function safeLink(value: unknown, label: string): Block[] {
  const url = httpsUrl(value);
  return url ? [{ kind: "link", text: label, url }] : [];
}
async function isLocalReview() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.LIBRARY_LOCAL_REVIEW !== "loopback"
  )
    return false;
  return directLoopback(await headers());
}
export async function getCollection(
  options: Options = {},
): Promise<Collection> {
  await connection();
  const mode =
    process.env.LIBRARY_CONTENT_SOURCE ??
    (process.env.NODE_ENV === "development" ? "fixtures" : "database");
  if (mode === "fixtures") return sampleCollection();
  if (mode !== "database") throw Error("Unknown Library content source");
  const local = await isLocalReview();
  try {
    return await requestCollection(
      options.direct ?? "",
      !!options.admin,
      local,
    );
  } catch {
    console.error("Library database collection unavailable");
    return {
      source: "unavailable",
      sceneUrl: baseScene,
      volumes: [],
      zones: [],
      screens: [],
    };
  }
}
const requestCollection = cache(
  (direct: string, admin: boolean, local: boolean) =>
    databaseCollection({ direct: direct || undefined, admin }, local),
);
async function databaseCollection(
  options: Options,
  local: boolean,
): Promise<Collection> {
  const { db } = await import("@/lib/db");
  if (options.admin) {
    const { requireAdmin } = await import("@/lib/auth/session");
    await requireAdmin();
  }
  const allowed = (id: string, type: "project" | "book") =>
    options.admin ||
    (local &&
      starters.some((s) => (type === "book" ? s.bookId : s.projectId) === id));
  const date = new Date();
  const publicStates: ("featured" | "published" | "unlisted")[] = options.direct
    ? ["featured", "published", "unlisted"]
    : ["featured", "published"];
  const publication = {
    deletedAt: null,
    OR: [{ publishedAt: null }, { publishedAt: { lte: date } }],
  };
  const ordinary = {
    ...publication,
    ...(options.admin ? {} : { display: { in: publicStates } }),
  };
  const projectWhere = options.admin
    ? publication
    : {
        ...publication,
        AND: [
          {
            OR: [
              { display: { in: publicStates } },
              ...(local
                ? [{ id: { in: starters.map((s) => s.projectId) } }]
                : []),
            ],
          },
        ],
      };
  const [
    projects,
    posts,
    favorites,
    moments,
    books,
    room,
    monitors,
    asset,
    events,
  ] = await Promise.all([
    db.project.findMany({
      where: projectWhere,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        ...baseSelect,
        summary: true,
        bodyBlocks: true,
        tags: true,
        clientId: true,
        client: { select: { name: true, publicAlias: true, showName: true } },
        cover: coverSelect,
        links: {
          select: { url: true, label: true },
          orderBy: { sortOrder: "asc" },
        },
        repos: {
          select: {
            repo: {
              select: {
                id: true,
                githubId: true,
                isPrivate: true,
                redactionPolicy: true,
                display: true,
                deletedAt: true,
                htmlUrl: true,
              },
            },
          },
        },
      },
    }),
    db.post.findMany({
      where: ordinary,
      select: {
        ...baseSelect,
        excerpt: true,
        mdxSource: true,
        tags: true,
        cover: coverSelect,
      },
    }),
    db.favorite.findMany({
      where: ordinary,
      select: {
        ...baseSelect,
        summary: true,
        tags: true,
        url: true,
        whyBlocks: true,
        cover: coverSelect,
      },
    }),
    db.timelineNode.findMany({
      where: ordinary,
      orderBy: { occurredAt: "asc" },
      select: {
        ...baseSelect,
        summary: true,
        stageCode: true,
        bodyBlocks: true,
        projectId: true,
      },
    }),
    db.book.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        entityId: true,
        entityType: true,
        pageMode: true,
        display: true,
        cover: coverSelect,
        pages: {
          orderBy: { position: "asc" },
          select: { templateCode: true, position: true, blocks: true },
        },
      },
    }),
    db.libraryZone.findMany({
      select: {
        slug: true,
        display: true,
        cameraPreset: true,
        sceneNodeName: true,
        shelves: {
          select: {
            slug: true,
            title: true,
            sceneNodeName: true,
            capacity: true,
            slots: {
              orderBy: { position: "asc" },
              select: { position: true, entityId: true, entityType: true },
            },
          },
        },
      },
    }),
    db.computerScreen.findMany({
      select: {
        slot: true,
        mode: true,
        config: true,
        media: coverSelect,
        deployment: {
          select: {
            url: true,
            title: true,
            iframeAllowed: true,
            display: true,
            deletedAt: true,
          },
        },
      },
    }),
    db.sceneAsset.findMany({
      where: { slug: "library-hall", isActive: true },
      take: 2,
      select: { media: coverSelect },
    }),
    db.activityEvent.findMany({
      where: {
        visibility: "public",
        occurredAt: { lte: new Date() },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { occurredAt: "desc" },
      take: 40,
      select: {
        source: true,
        typeCode: true,
        title: true,
        projectId: true,
        postId: true,
        repo: {
          select: {
            display: true,
            deletedAt: true,
            isPrivate: true,
            redactionPolicy: true,
          },
        },
        deployment: { select: { display: true, deletedAt: true } },
      },
    }),
  ]);
  const now = Date.now();
  const direct = !!options.direct;
  const targets: Target[] = [
    ...projects.map((p) => ({
      ...p,
      kind: "Project" as const,
      clientLabel: p.client
        ? p.client.showName
          ? p.client.name
          : (p.client.publicAlias ?? undefined)
        : undefined,
      blocks: blocksFrom(p.bodyBlocks),
      cover: getCover(p.cover),
      links: p.clientId
        ? []
        : [
            ...p.links.flatMap((l) => safeLink(l.url, l.label)),
            ...p.repos.flatMap(({ repo }) => {
              const seeded =
                local &&
                starters.some(
                  (s) =>
                    s.projectId === p.id &&
                    s.githubId === repo.githubId?.toString(),
                );
              return !repo.isPrivate &&
                repo.redactionPolicy === "none" &&
                readable(repo, direct, seeded, now)
                ? safeLink(repo.htmlUrl, "Source repository")
                : [];
            }),
          ],
    })),
    ...posts
      .filter((p) => p.publishedAt || options.admin)
      .map((p) => ({
        ...p,
        summary: p.excerpt,
        kind: "Journal" as const,
        blocks: safeManuscript(p.mdxSource),
        links: [],
        cover: getCover(p.cover),
      })),
    ...favorites.map((p) => ({
      ...p,
      kind: "Favorite" as const,
      blocks: blocksFrom(p.whyBlocks),
      links: safeLink(p.url, "Reference"),
      cover: getCover(p.cover),
    })),
    ...moments
      .filter(
        (m) =>
          !m.projectId ||
          projects.some(
            (p) =>
              p.id === m.projectId &&
              readable(p, direct, allowed(p.id, "project"), now) &&
              books
                .filter(
                  (b) => b.entityType === "project" && b.entityId === p.id,
                )
                .every((b) => readable(b, direct, allowed(b.id, "book"), now)),
          ),
      )
      .map((p) => ({
        ...p,
        kind: "Evolution" as const,
        tags: p.stageCode ? [p.stageCode] : [],
        blocks: blocksFrom(p.bodyBlocks),
        links: [],
      })),
  ];
  const typeMap = {
    Project: "project",
    Journal: "post",
    Favorite: "favorite",
    Evolution: "timeline_node",
    Book: "book",
  };
  const enabled = room.filter(
    (z) =>
      readable(z, false, options.admin, now) &&
      zones.some((a) => a.slug === z.slug && a.node === z.sceneNodeName),
  );
  const cameras: NonNullable<Collection["cameras"]> = {};
  for (const z of enabled) {
    const p = z.cameraPreset;
    if (!p || typeof p !== "object" || Array.isArray(p)) continue;
    const xyz = (v: unknown): v is number[] =>
      Array.isArray(v) &&
      v.length === 3 &&
      v.every(
        (n) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 22,
      );
    if (xyz(p.eye) && xyz(p.target))
      cameras[z.slug] = { eye: p.eye, target: p.target };
  }
  const anchoredShelves = enabled.flatMap((z) =>
    z.shelves.filter((s) =>
      shelves.some((a) => a.zone === z.slug && a.slug === s.slug && a.node === s.sceneNodeName)),
  );
  const shelfTitles = Object.fromEntries(anchoredShelves.map((s) => [s.slug, s.title]));
  const slots = anchoredShelves.flatMap((s) =>
    s.slots.filter((p) => p.position >= 1 && p.position <= Math.min(s.capacity, 24))
      .map((p) => ({ ...p, shelf: s.slug })),
  );
  const volumes: Volume[] = [];
  function resolve(
    target: Target | null,
    wrapper: (typeof books)[number] | null,
    sourceAlias = true,
  ) {
    const slug = wrapper?.slug ?? target!.slug;
    if (
      options.direct &&
      ![slug, sourceAlias ? target?.slug : undefined].includes(options.direct)
    )
      return;
    if (
      target &&
      !readable(
        target,
        direct,
        options.admin ||
          (target.kind === "Project" && allowed(target.id, "project")),
        now,
      )
    )
      return;
    if (wrapper && !readable(wrapper, direct, allowed(wrapper.id, "book"), now))
      return;
    const summary = target?.summary ?? wrapper?.subtitle ?? "";
    const generated: Leaf[] = [
      {
        key: "overview",
        title: "Overview",
        blocks: [
          ...(summary ? [prose(summary)] : []),
          ...(target?.blocks ?? []),
        ],
      },
    ];
    if (target?.links.length)
      generated.push({ key: "links", title: "Sources", blocks: target.links });
    const pages = resolvePages(
      wrapper?.pageMode,
      generated,
      wrapper?.pages ?? [],
    );
    const slot =
      slots.find(
        (p) => p.entityType === "book" && p.entityId === wrapper?.id,
      ) ??
      slots.find(
        (p) =>
          target &&
          p.entityType === typeMap[target.kind] &&
          p.entityId === target.id,
      );
    const plate =
      Math.max(
        0,
        shelves.findIndex((s) => s.slug === slot?.shelf),
      ) % 4;
    volumes.push({
      slug,
      clientLabel: target?.clientLabel,
      indexable:
        !local &&
        !options.admin &&
        target?.display !== "unlisted" &&
        wrapper?.display !== "unlisted",
      projectSlug:
        target?.kind === "Project"
          ? sourceAlias
            ? target.slug
            : slug
          : undefined,
      title: wrapper?.title ?? target!.title,
      summary,
      kind: target?.kind ?? "Book",
      tags: target?.tags ?? [],
      shelf: slot?.shelf ?? null,
      position: slot?.position ?? 1,
      plate,
      cover: getCover(wrapper?.cover ?? null) ?? target?.cover,
      pages: pages.length
        ? pages
        : [
            {
              key: "overview",
              title: "Overview",
              blocks: [
                prose(summary || "This volume has no authored pages yet."),
              ],
            },
          ],
      featured:
        target?.display === "featured" || wrapper?.display === "featured",
    });
  }
  for (const target of targets) {
    const wrappers = books.filter(
      (b) => b.entityId === target.id && b.entityType === typeMap[target.kind],
    );
    if (wrappers.length < 2) resolve(target, wrappers[0] ?? null);
    else
      for (const w of wrappers.filter((w) =>
        slots.some((s) => s.entityType === "book" && s.entityId === w.id),
      ))
        resolve(target, w, false);
  }
  for (const b of books.filter((b) => !b.entityId && !b.entityType))
    resolve(null, b);
  // Raw payloads, actors, commit messages, URLs and source counts never enter the DTO.
  const activity = events
    .flatMap((e) => {
      if (
        e.repo &&
        (!readable(e.repo, false) ||
          e.repo.isPrivate ||
          e.repo.redactionPolicy !== "none")
      )
        return [];
      if (e.deployment && !readable(e.deployment, false)) return [];
      const refs = [
        { id: e.projectId, type: "project" },
        { id: e.postId, type: "post" },
      ].filter((r) => r.id);
      const titles: string[] = [];
      for (const ref of refs) {
        const target = targets.find(
          (t) => t.id === ref.id && typeMap[t.kind] === ref.type,
        );
        const wrappers = books.filter(
          (b) => b.entityId === ref.id && b.entityType === ref.type,
        );
        if (
          !target ||
          !readable(target, false) ||
          wrappers.length > 1 ||
          wrappers.some((b) => !readable(b, false))
        )
          return [];
        titles.push(wrappers[0]?.title ?? target.title);
      }
      if (titles.length) return ["Collection update · " + titles.join(" / ")];
      // Only explicitly authored, unlinked public notices can display their own titles.
      return !e.repo &&
        !e.deployment &&
        e.source === "admin" &&
        e.typeCode === "admin.custom"
        ? [e.title]
        : [];
    })
    .slice(0, 12);
  const screens: Screen[] = enabled.some((z) => z.slug === "computer-station")
    ? monitors.flatMap((m) => {
        const config =
          m.config && typeof m.config === "object" && !Array.isArray(m.config)
            ? m.config
            : {};
        if (config.enabled === false || !["main", "side"].includes(m.slot))
          return [];
        const site =
          m.deployment &&
          readable(m.deployment, false) &&
          m.deployment.iframeAllowed
            ? httpsUrl(m.deployment.url)
            : undefined;
        const media =
          m.media && !m.media.deletedAt && m.media.kind === m.mode
            ? (m.mode === "image" ? publicImage : publicMedia)(m.media.url)
            : undefined;
        return [
          {
            slot: m.slot,
            mode: m.mode,
            title:
              typeof config.title === "string"
                ? config.title
                : m.slot === "main"
                  ? "Catalog terminal"
                  : "Reference display",
            lines: m.mode === "feed" || m.mode === "terminal" ? activity : [],
            url: m.mode === "iframe" ? site : media,
          },
        ];
      })
    : [];
  const active =
    asset.length === 1 &&
    !asset[0].media.deletedAt &&
    asset[0].media.kind === "model3d"
      ? publicMedia(asset[0].media.url)
      : undefined;
  return {
    cameras,
    shelfTitles,
    source: local || options.admin ? "review" : "database",
    volumes,
    zones: enabled.map((z) => z.slug),
    screens,
    sceneUrl: active ?? baseScene,
  };
}
