import "server-only";
import { createHash } from "node:crypto";
import { db, type Prisma } from "@/lib/db";
import { audit, emitSignal, snapshot } from "@/lib/admin/audit";
import { putPublic } from "@/lib/blob";
import { inferMediaKind, safeFileName } from "@/lib/media";
import { findLocalImageRefs, isLocalRef, parsePostSource, refBasename, rewriteLocalRefs } from "@/lib/mdx-ingest";

// MDX -> Post pipeline shared by the upload Route Handler and the edit-page
// Server Action. MDX is the source of truth: frontmatter keys that are present
// overwrite the row; keys that are absent keep the existing value.

export type IngestResult = {
  status: "created" | "updated" | "unchanged";
  postId: string;
  slug: string;
  title: string;
  messages: string[];
  warnings: string[];
};

const isPublic = (display: string, publishedAt: Date | null, now: Date) =>
  (display === "published" || display === "featured") && publishedAt !== null && publishedAt <= now;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function ingestPost(opts: {
  source: string;
  images?: File[];
  actor: string;
  /** When re-saving from the edit page: the post being edited. */
  postId?: string;
}): Promise<IngestResult> {
  const source = opts.source.replace(/^﻿/, "");
  const images = (opts.images ?? []).filter((f) => f.size > 0);
  const parsed = parsePostSource(source);
  const messages: string[] = [];
  const warnings: string[] = [];
  const now = new Date();

  const bySlug = await db.post.findUnique({ where: { slug: parsed.slug }, include: { assets: { include: { media: true } } } });
  let existing = bySlug;
  if (opts.postId) {
    if (bySlug && bySlug.id !== opts.postId) {
      throw new Error(`Another post already uses the slug "${parsed.slug}".`);
    }
    existing = await db.post.findUniqueOrThrow({ where: { id: opts.postId }, include: { assets: { include: { media: true } } } });
  }

  const sourceHash = sha256(source);
  if (existing && !existing.deletedAt && existing.sourceHash === sourceHash && images.length === 0) {
    return {
      status: "unchanged",
      postId: existing.id,
      slug: existing.slug,
      title: existing.title,
      messages: [`"${existing.title}" is unchanged (same MDX hash) — nothing to do.`],
      warnings,
    };
  }

  // ---- resolve local image references -------------------------------------
  const refs = findLocalImageRefs(parsed.body);
  const coverRef = parsed.cover && isLocalRef(parsed.cover) ? parsed.cover : null;
  const allRefs = coverRef && !refs.includes(coverRef) ? [...refs, coverRef] : refs;

  const filesByName = new Map<string, File>();
  for (const f of images) filesByName.set(f.name, f);
  const fileFor = (ref: string) => {
    const base = refBasename(ref);
    return (
      filesByName.get(base) ??
      [...filesByName.values()].find((f) => f.name.toLowerCase() === base.toLowerCase()) ??
      null
    );
  };

  const uploaded = new Map<File, { id: string; url: string }>();
  const refToMedia = new Map<string, { id: string; url: string }>();
  const unmatched: string[] = [];
  let reused = 0;

  for (const ref of allRefs) {
    const file = fileFor(ref);
    if (file) {
      let media = uploaded.get(file);
      if (!media) {
        const blob = await putPublic(`blog/${parsed.slug}/${safeFileName(file.name)}`, file, file.type);
        const row = await db.mediaAsset.create({
          data: {
            kind: inferMediaKind(file.type, file.name),
            provider: "blob",
            url: blob.url,
            blobPathname: blob.pathname,
            mimeType: file.type || blob.contentType || null,
            bytes: BigInt(file.size),
            title: `${parsed.title} — ${file.name}`,
            purpose: "blog-image",
            checksum: createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex"),
          },
        });
        media = { id: row.id, url: row.url };
        uploaded.set(file, media);
      }
      refToMedia.set(ref, media);
      continue;
    }
    const prior = existing?.assets.find((a) => a.originalPath === ref && !a.media.deletedAt);
    if (prior) {
      refToMedia.set(ref, { id: prior.mediaId, url: prior.media.url });
      reused++;
      continue;
    }
    unmatched.push(ref);
  }

  if (uploaded.size) messages.push(`Uploaded ${uploaded.size} image${uploaded.size === 1 ? "" : "s"} to Blob.`);
  if (reused > 0) messages.push(`Reused ${reused} previously uploaded image${reused === 1 ? "" : "s"}.`);
  if (unmatched.length) {
    warnings.push(`No uploaded file for local reference${unmatched.length === 1 ? "" : "s"}: ${unmatched.join(", ")}`);
  }
  const unused = images.filter((f) => !uploaded.has(f)).map((f) => f.name);
  if (unused.length) warnings.push(`Not referenced in the MDX (skipped): ${unused.join(", ")}`);

  const urlMap = new Map([...refToMedia].map(([ref, m]) => [ref, m.url]));
  const mdxSource = rewriteLocalRefs(source, urlMap);

  // ---- cover --------------------------------------------------------------
  let coverMediaId: string | null | undefined = undefined; // undefined = keep
  if (parsed.cover) {
    if (coverRef) {
      coverMediaId = refToMedia.get(coverRef)?.id ?? null;
    } else {
      const known = await db.mediaAsset.findFirst({ where: { url: parsed.cover, deletedAt: null }, select: { id: true } });
      coverMediaId =
        known?.id ??
        (
          await db.mediaAsset.create({
            data: { kind: "image", provider: "external", url: parsed.cover, title: `${parsed.title} — cover`, purpose: "blog-image" },
          })
        ).id;
    }
  }

  // ---- series / projects ------------------------------------------------------
  let seriesId: string | null | undefined = undefined;
  if (parsed.seriesSlug) {
    const series = await db.postSeries.upsert({
      where: { slug: parsed.seriesSlug },
      update: parsed.seriesTitle ? { title: parsed.seriesTitle } : {},
      create: {
        slug: parsed.seriesSlug,
        title: parsed.seriesTitle ?? parsed.seriesSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      },
    });
    seriesId = series.id;
  } else if ("series" in parsed.frontmatter) {
    seriesId = null;
  }

  let projectIds: string[] | null = null;
  if (parsed.projectSlugs) {
    const projects = await db.project.findMany({
      where: { slug: { in: parsed.projectSlugs }, deletedAt: null },
      select: { id: true, slug: true },
    });
    projectIds = projects.map((p) => p.id);
    const missing = parsed.projectSlugs.filter((s) => !projects.some((p) => p.slug === s));
    if (missing.length) warnings.push(`Unknown project slug${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  }

  // ---- display / publish time ----------------------------------------------
  const display = parsed.display ?? (existing && !existing.deletedAt ? existing.display : "hidden");
  let publishedAt = parsed.publishedAt ?? existing?.publishedAt ?? null;
  if ((display === "published" || display === "featured") && !publishedAt) publishedAt = now;
  const wasPublic = existing && !existing.deletedAt ? isPublic(existing.display, existing.publishedAt, now) : false;

  const fields = {
    slug: parsed.slug,
    title: parsed.title,
    excerpt: parsed.excerpt,
    mdxSource,
    frontmatter: parsed.frontmatter as Prisma.InputJsonValue,
    sourceHash,
    readingMinutes: parsed.readingMinutes,
    canonicalUrl: parsed.canonicalUrl,
    display,
    publishedAt,
    deletedAt: null,
    ...(parsed.tags ? { tags: parsed.tags } : {}),
    ...(seriesId !== undefined ? { seriesId } : {}),
    ...(coverMediaId !== undefined ? { coverMediaId } : {}),
  };

  const post = await db.$transaction(async (tx) => {
    const row = existing
      ? await tx.post.update({ where: { id: existing.id }, data: fields })
      : await tx.post.create({ data: { ...fields, tags: parsed.tags ?? [] } });

    if (projectIds) {
      await tx.postProject.deleteMany({ where: { postId: row.id, projectId: { notIn: projectIds } } });
      if (projectIds.length) {
        await tx.postProject.createMany({
          data: projectIds.map((projectId) => ({ postId: row.id, projectId })),
          skipDuplicates: true,
        });
      }
    }
    for (const [originalPath, media] of refToMedia) {
      await tx.postAsset.upsert({
        where: { postId_originalPath: { postId: row.id, originalPath } },
        update: { mediaId: media.id },
        create: { postId: row.id, originalPath, mediaId: media.id },
      });
    }
    return row;
  });

  const status: IngestResult["status"] = existing ? "updated" : "created";
  await snapshot("post", post.id, post, opts.actor, `${status} from MDX`);
  await audit(opts.actor, status === "created" ? "create" : "update", "post", post.id, {
    slug: post.slug,
    sourceHash,
    images: uploaded.size,
    unmatched,
  });

  if (!wasPublic && isPublic(post.display, post.publishedAt, now)) {
    await emitSignal({
      typeCode: "system.post_published",
      source: "system",
      title: `New blog post: ${post.title}`,
      summary: post.excerpt,
      postId: post.id,
      visibility: "public",
      url: `/blog/${post.slug}`,
      dedupeKey: `post_published:${post.id}`,
      actor: opts.actor,
    });
    messages.push("Published — emitted a public “New blog post” signal.");
  } else if ((post.display === "published" || post.display === "featured") && post.publishedAt && post.publishedAt > now) {
    messages.push(`Scheduled for ${post.publishedAt.toISOString()}.`);
  }

  messages.unshift(`${status === "created" ? "Created" : "Updated"} “${post.title}” (/${post.slug}, ${post.display}).`);
  return { status, postId: post.id, slug: post.slug, title: post.title, messages, warnings };
}

/** Quick display change from the post list. Emits the publish signal when it goes live. */
export async function setPostDisplay(id: string, display: "hidden" | "unlisted" | "published" | "featured", actor: string) {
  const now = new Date();
  const before = await db.post.findUniqueOrThrow({ where: { id } });
  const wasPublic = isPublic(before.display, before.publishedAt, now);
  const goingPublic = display === "published" || display === "featured";
  const post = await db.post.update({
    where: { id },
    data: { display, ...(goingPublic && !before.publishedAt ? { publishedAt: now } : {}) },
  });
  await snapshot("post", id, post, actor, `display → ${display}`);
  await audit(actor, "update", "post", id, { display });
  if (!wasPublic && isPublic(post.display, post.publishedAt, now)) {
    await emitSignal({
      typeCode: "system.post_published",
      source: "system",
      title: `New blog post: ${post.title}`,
      summary: post.excerpt,
      postId: post.id,
      visibility: "public",
      url: `/blog/${post.slug}`,
      dedupeKey: `post_published:${post.id}`,
      actor,
    });
  }
  return post;
}
