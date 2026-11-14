import "server-only";
import { collectionRows } from "./collection-query";
import { applyShowcaseDraft } from "./showcase-draft";
import { applyShowcaseWritingDraft } from "./showcase-writing";
import { cache } from "react";
import { headers } from "next/headers";
import { directLoopback } from "@/lib/auth/local-office";
import { connection } from "next/server";
import starters from "@/assets/library/starters.json";
import { resolvePages } from "./pages";
import { sampleCollection } from "./fixtures";
import { type Block, type Collection, type Leaf, type Volume, type VolumeKind } from "./types";
import { shelves, zones } from "./taxonomy";
import {
  blocksFrom,
  httpsUrl,
  publicImage,
  readable,
  safeManuscript,
  type Visibility,
} from "./policy";

type Options = { direct?: string; admin?: boolean; database?: boolean };
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
  status?: string;
  startedOn?: Date | null;
  endedOn?: Date | null;
};
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
export async function isLocalReview() {
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
  const mode = options.database ? "database" :
    process.env.LIBRARY_CONTENT_SOURCE ??
    (process.env.NODE_ENV === "development" ? "fixtures" : "database");
  if (mode === "fixtures") return sampleCollection();
  if (mode !== "database") throw Error("Unknown Library content source");
  const local = await isLocalReview();
  try {
    const collection = await requestCollection(
      options.direct ?? "",
      !!options.admin,
      local,
    );
    return options.admin || local ? { ...collection, volumes: applyShowcaseDraft(options.admin ? applyShowcaseWritingDraft(collection.volumes) : collection.volumes) } : collection;
  } catch {
    console.error("Library database collection unavailable");
    return {
      source: "unavailable",
      volumes: [],
      zones: [],
    };
  }
}
const requestCollection = cache(
  (direct: string, admin: boolean, local: boolean) =>
    databaseCollection({ direct: direct || undefined, admin }, local),
);
// Raw rows are shared only within this request. Public and direct projections
// still apply their own visibility policy; no authorized data crosses requests.

async function databaseCollection(options: Options, local: boolean): Promise<Collection> {
  const allowed = (id: string, type: "project" | "book") =>
    options.admin ||
    (local &&
      starters.some((s) => (type === "book" ? s.bookId : s.projectId) === id));
  const [
    projects,
    posts,
    favorites,
    moments,
    books,
    room,
  ] = await collectionRows(!!options.admin, local);
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
      zones.some((a) => a.slug === z.slug),
  );
  const anchoredShelves = enabled.flatMap((z) =>
    z.shelves.filter((s) =>
      shelves.some((a) => a.zone === z.slug && a.slug === s.slug)),
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
      ...(target?.kind === "Project" ? {
        role: pages.flatMap((page) => page.blocks).find((block) => block.kind === "metric" && /^(my )?role$/i.test(block.label ?? ""))?.text,
        status: pages.flatMap((page) => page.blocks).find((block) => block.kind === "metric" && block.label === "Status")?.text ?? target.tags.find((tag) => /^(live|in development|early stage|earlier work|launching)$/i.test(tag)) ?? target.status,
        startedOn: target.startedOn?.toISOString().slice(0, 10),
        endedOn: target.endedOn?.toISOString().slice(0, 10),
      } : {}),
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
  return { shelfTitles, source: local || options.admin ? "review" : "database", volumes, zones: enabled.map((z) => z.slug) };
}
