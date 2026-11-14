import "server-only";
import { cache } from "react";
import starters from "@/assets/library/starters.json";
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
export const collectionRows = cache(async (admin: boolean, local: boolean) => {
  const { db } = await import("@/lib/db");
  if (admin) {
    const { requireAdmin } = await import("@/lib/auth/session");
    await requireAdmin();
  }
  const date = new Date();
  const publicStates: ("featured" | "published" | "unlisted")[] = ["featured", "published", "unlisted"];
  const publication = {
    deletedAt: null,
    OR: [{ publishedAt: null }, { publishedAt: { lte: date } }],
  };
  const ordinary = {
    ...publication,
    ...(admin ? {} : { display: { in: publicStates } }),
  };
  const projectWhere = admin
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
  return Promise.all([
    db.project.findMany({
      where: projectWhere,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        ...baseSelect,
        summary: true,
        bodyBlocks: true,
        tags: true,
        status: true,
        startedOn: true,
        endedOn: true,
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
        shelves: {
          select: {
            slug: true,
            title: true,
                capacity: true,
            slots: {
              orderBy: { position: "asc" },
              select: { position: true, entityId: true, entityType: true },
            },
          },
        },
      },
    }),

  ]);
});

