"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, type Prisma, type DisplayState } from "@/lib/db";
import { getAdmin } from "@/lib/auth/session";
import { audit, emitSignal, snapshot } from "@/lib/admin/audit";
import {
  blocksFrom,
  publicMedia,
  publicImage,
  httpsUrl,
  templateNames,
} from "@/lib/library/policy";
import { validateHall } from "@/lib/library/scene-contract";
import { shelves, zones } from "@/lib/library/model";

class InputError extends Error {}
const issue = (message: string): never => {
  throw new InputError(message);
};
type Tx = Prisma.TransactionClient;
type State = { ok: boolean; message: string };
const field = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
function text(fd: FormData, k: string, limit = 240) {
  const value = field(fd, k);
  if (!value || value.length > limit)
    return issue("Check the " + k + " field.");
  return value;
}
function valueOf<T extends string>(value: string, choices: readonly T[]): T {
  if (!choices.includes(value as T)) return issue("Choose a supported value.");
  return value as T;
}
const visibility = (fd: FormData) =>
  valueOf<DisplayState>(field(fd, "display"), [
    "hidden",
    "unlisted",
    "published",
    "featured",
  ]);
function integer(fd: FormData, key: string, max: number) {
  const v = Number(field(fd, key));
  if (!Number.isInteger(v) || v < 1 || v > max)
    return issue("Choose a " + key + " between 1 and " + max + ".");
  return v;
}
function version(fd: FormData, actual: string) {
  if (field(fd, "version") !== actual)
    issue("This entry changed in another session. Reload before saving.");
}
async function bookForm(tx: Tx, fd: FormData, actor: string) {
  const id = field(fd, "id"),
    title = text(fd, "title"),
    slug = text(fd, "slug", 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    issue("Use a lowercase hyphenated slug.");
  const old = id ? await tx.book.findUniqueOrThrow({ where: { id } }) : null;
  if (old) version(fd, old.updatedAt.toISOString());
  const entityId = old ? old.entityId : field(fd, "project") || null;
  const entityType = old ? old.entityType : entityId ? "project" : null;
  if (!old && entityId) {
    if (
      !(await tx.project.findFirst({
        where: { id: entityId, deletedAt: null },
      }))
    )
      issue("That project is unavailable.");
    if (await tx.book.count({ where: { entityId, entityType: "project" } }))
      issue("This project already has a book.");
  }
  const display = old ? visibility(fd) : "hidden";
  const coverMediaId = field(fd, "coverMediaId") || null;
  if (coverMediaId) {
    const cover = await tx.mediaAsset.findFirst({ where: { id: coverMediaId, kind: "image", deletedAt: null } });
    if (!cover || !publicImage(cover.url)) issue("Choose an available Library image.");
  }
  const data = {
    title,
    slug,
    subtitle: field(fd, "subtitle").slice(0, 1200) || null,
    display,
    entityId,
    entityType,
    pageMode: valueOf(field(fd, "pageMode"), [
      "generated",
      "authored",
      "hybrid",
    ] as const),
    coverMediaId,
  };
  if (display !== "hidden" && entityType === "project" && entityId) {
    const target = await tx.project.findUnique({ where: { id: entityId } });
    if (
      !target ||
      target.deletedAt ||
      target.display === "hidden" ||
      (target.publishedAt && target.publishedAt > new Date())
    )
      issue("Review and publish the linked project before releasing its book.");
  }
  const row = old
    ? await tx.book.update({ where: { id }, data })
    : await tx.book.create({ data });
  await audit(actor, "library.book.save", "book", row.id, { display }, tx);
  await snapshot("book", row.id, row, actor, "Book presentation saved", tx);
  if (old && old.display !== row.display)
    await emitSignal(
      {
        typeCode: "admin.status",
        source: "admin",
        title: "Book visibility changed",
        visibility: "private",
        actor,
        projectId: entityType === "project" ? entityId : null,
      },
      tx,
    );
}
async function pageForm(tx: Tx, fd: FormData, actor: string) {
  const id = field(fd, "id"),
    bookId = text(fd, "bookId");
  await tx.book.findUniqueOrThrow({ where: { id: bookId } });
  const old = id
    ? await tx.bookPage.findFirstOrThrow({ where: { id, bookId } })
    : null;
  if (old) version(fd, old.updatedAt.toISOString());
  if (field(fd, "delete") === "yes") {
    if (!old) issue("Choose an existing page to remove.");
    await snapshot("book_page", id, old, actor, "Removed from book", tx);
    await tx.bookPage.delete({ where: { id } });
    await audit(actor, "library.page.remove", "book_page", id, { bookId }, tx);
    return;
  }
  const template = valueOf(field(fd, "template"), Object.keys(templateNames));
  const position = integer(fd, "position", 256);
  const component = valueOf(field(fd, "component") || "Prose", [
    "Prose",
    "Architecture",
    "Timeline",
    "Code",
    "Metric",
    "Link",
    "Image",
  ]);
  const raw = field(fd, "blocks");
  let blocks: Prisma.InputJsonValue;
  if (raw) {
    if (raw.length > 64000) issue("The advanced block list is too large.");
    try {
      blocks = JSON.parse(raw);
    } catch {
      return issue("The block list must be valid JSON.");
    }
  } else {
    const body = text(fd, "text", 16000);
    blocks = [
      {
        component,
        props: {
          text: body,
          ...(["Link", "Image"].includes(component)
            ? { url: field(fd, "url") }
            : {}),
        },
      },
    ];
  }
  if (
    !Array.isArray(blocks) ||
    !blocks.length ||
    blocks.length > 64 ||
    blocksFrom(blocks).length !== blocks.length
  )
    issue("Use supported blocks and valid HTTPS links or Library media.");
  if (old && field(fd, "duplicate") === "yes") {
    const last = await tx.bookPage.aggregate({
      where: { bookId },
      _max: { position: true },
    });
    const copy = await tx.bookPage.create({
      data: {
        bookId,
        position: (last._max.position ?? 0) + 1,
        templateCode: template,
        blocks,
      },
    });
    await snapshot("book_page", copy.id, copy, actor, "Page copied", tx);
    await audit(
      actor,
      "library.page.copy",
      "book_page",
      copy.id,
      { from: id, bookId },
      tx,
    );
    return;
  }
  const dest = await tx.bookPage.findUnique({
    where: { bookId_position: { bookId, position } },
  });
  if (dest && dest.id !== id) {
    if (!old || field(fd, "swap") !== dest.id)
      issue(
        "That page position is occupied. Choose another or confirm the swap.",
      );
    await tx.bookPage.update({ where: { id }, data: { position: -1 } });
    const moved = await tx.bookPage.update({
      where: { id: dest.id },
      data: { position: old!.position },
    });
    await snapshot(
      "book_page",
      moved.id,
      moved,
      actor,
      "Page order changed",
      tx,
    );
    await audit(
      actor,
      "library.page.move",
      "book_page",
      moved.id,
      { bookId },
      tx,
    );
  }
  const data = { bookId, position, templateCode: template, blocks };
  const row = id
    ? await tx.bookPage.update({ where: { id }, data })
    : await tx.bookPage.create({ data });
  await snapshot("book_page", row.id, row, actor, "Page saved", tx);
  await audit(actor, "library.page.save", "book_page", row.id, { bookId }, tx);
}
async function placeForm(tx: Tx, fd: FormData, actor: string) {
  const entityType = valueOf(field(fd, "targetType") || "book", [
    "book",
    "project",
  ] as const);
  const id = text(fd, "bookId");
  if (entityType === "book") {
    const book = await tx.book.findUniqueOrThrow({ where: { id } });
    if (
      book.entityId &&
      book.entityType &&
      (await tx.shelfSlot.count({
        where: { entityId: book.entityId, entityType: book.entityType },
      }))
    )
      issue("Move or remove the linked source placement first.");
  } else {
    await tx.project.findFirstOrThrow({ where: { id, deletedAt: null } });
    const wrappers = await tx.book.findMany({
      where: { entityId: id, entityType: "project" },
      select: { id: true },
    });
    if (
      wrappers.length > 1 ||
      (wrappers.length &&
        (await tx.shelfSlot.count({
          where: {
            entityType: "book",
            entityId: { in: wrappers.map((b) => b.id) },
          },
        })))
    )
      issue("Use the explicit book placement for this project.");
  }
  const placements = await tx.shelfSlot.findMany({
    where: { entityType, entityId: id },
  });
  if (placements.length > 1) issue("Multiple placements require review.");
  const old = placements[0];
  version(fd, old ? [old.id, old.shelfId, old.position].join("/") : "unplaced");
  const slug = field(fd, "shelf");
  if (!slug) {
    if (old) await tx.shelfSlot.delete({ where: { id: old.id } });
  } else {
    const s = await tx.shelf.findUniqueOrThrow({
      where: { slug },
      include: { zone: true },
    });
    if (
      !shelves.some(
        (a) =>
          a.slug === s.slug &&
          a.node === s.sceneNodeName &&
          a.zone === s.zone.slug,
      )
    )
      issue("This shelf has no matching scene anchor.");
    const position = integer(fd, "position", Math.min(s.capacity, 24));
    const occupant = await tx.shelfSlot.findUnique({
      where: { shelfId_position: { shelfId: s.id, position } },
    });
    if (occupant && occupant.id !== old?.id) {
      if (!old || field(fd, "swap") !== occupant.id)
        issue("That slot is occupied. Confirm a swap or choose an open slot.");
      await tx.shelfSlot.update({
        where: { id: old.id },
        data: { position: -1 },
      });
      await tx.shelfSlot.update({
        where: { id: occupant.id },
        data: { shelfId: old.shelfId, position: old.position },
      });
      await audit(
        actor,
        "library.placement.swap",
        "shelf",
        old.shelfId,
        { slotId: occupant.id, position: old.position },
        tx,
      );
    }
    const data = { shelfId: s.id, position, entityType, entityId: id };
    if (old) await tx.shelfSlot.update({ where: { id: old.id }, data });
    else await tx.shelfSlot.create({ data });
  }
  await audit(
    actor,
    "library.placement",
    entityType,
    id,
    {
      from: old ? { shelfId: old.shelfId, position: old.position } : null,
      to: slug || null,
      position: field(fd, "position"),
    },
    tx,
  );
}
async function shelfForm(tx: Tx, fd: FormData, actor: string) {
  const slug = field(fd, "slug");
  const old = await tx.shelf.findUniqueOrThrow({ where: { slug } });
  version(fd, old.title);
  const title = text(fd, "title", 64);
  if (title === old.title) return;
  const row = await tx.shelf.update({ where: { slug }, data: { title } });
  await snapshot("shelf", row.id, row, actor, "Shelf title changed", tx);
  await audit(actor, "library.shelf.rename", "shelf", row.id, { from: old.title, to: title }, tx);
}
async function zoneForm(tx: Tx, fd: FormData, actor: string) {
  const slug = field(fd, "slug"),
    old = await tx.libraryZone.findUniqueOrThrow({ where: { slug } });
  version(fd, JSON.stringify([old.display, old.cameraPreset]));
  if (!zones.some((z) => z.slug === slug && z.node === old.sceneNodeName))
    issue("The scene anchor does not match this room.");
  const camera = field(fd, "camera");
  let preset: { eye: number[]; target: number[] } | Record<string, never> = {};
  if (camera) {
    const coord = z.tuple([
      z.number().min(-10.5).max(10.5),
      z.number().min(0.25).max(7.8),
      z.number().min(-10.6).max(10.8),
    ]);
    try {
      preset = z
        .object({ eye: coord, target: coord })
        .parse(JSON.parse(camera));
    } catch {
      return issue("Enter valid eye and target positions inside the room.");
    }
  }
  const row = await tx.libraryZone.update({
    where: { slug },
    data: { display: visibility(fd), cameraPreset: preset },
  });
  await snapshot("library_zone", row.id, row, actor, "Zone settings saved", tx);
  await audit(actor, "library.zone.save", "library_zone", row.id, {}, tx);
}
async function screenForm(tx: Tx, fd: FormData, actor: string) {
  const slot = valueOf(field(fd, "slot"), ["main", "side"]);
  const old = await tx.computerScreen.findUniqueOrThrow({ where: { slot } });
  version(fd, old.updatedAt.toISOString());
  const mode = valueOf(field(fd, "mode"), [
    "feed",
    "terminal",
    "image",
    "video",
    "iframe",
  ] as const);
  const mediaId = ["image", "video"].includes(mode)
    ? field(fd, "mediaId") || null
    : null;
  const deploymentId =
    mode === "iframe" ? field(fd, "deploymentId") || null : null;
  if (mediaId) {
    const media = await tx.mediaAsset.findUnique({ where: { id: mediaId } });
    if (
      !media ||
      media.deletedAt ||
      media.kind !== mode ||
      !(mode === "image" ? publicImage : publicMedia)(media.url)
    )
      issue("Choose matching public Library media.");
  }
  if (deploymentId) {
    const d = await tx.deployment.findUnique({ where: { id: deploymentId } });
    if (!d || d.deletedAt || !d.iframeAllowed || !httpsUrl(d.url))
      issue("Choose a site approved for embedding.");
  }
  await tx.computerScreen.update({
    where: { slot },
    data: {
      mode,
      mediaId,
      deploymentId,
      config: {
        title: text(fd, "title"),
        enabled: field(fd, "enabled") === "on",
      },
    },
  });
  await audit(actor, "library.screen.save", null, old.id, { slot, mode }, tx);
}
async function sceneForm(tx: Tx, fd: FormData, actor: string) {
  const slug = "library-hall";
  const previous = await tx.sceneAsset.findMany({
    where: { slug, isActive: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  version(fd, previous.map((v) => v.id).join(","));
  const selected = field(fd, "assetId");
  let asset =
    selected && selected !== "builtin"
      ? await tx.sceneAsset.findFirstOrThrow({
          where: { id: selected, slug },
          include: { media: true },
        })
      : null;
  if (selected !== "builtin") {
    const media =
      asset?.media ??
      (await tx.mediaAsset.findUniqueOrThrow({
        where: { id: text(fd, "mediaId") },
      }));
    const url = publicMedia(media.url);
    if (!url || media.deletedAt || media.kind !== "model3d")
      issue("Choose a Library GLB.");
    const response = await fetch(url!, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (
      !response.ok ||
      Number(response.headers.get("content-length") ?? 0) > 8388608
    )
      issue("The GLB could not be validated.");
    const reader = response.body?.getReader();
    if (!reader) return issue("Empty scene response.");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 8388608) {
        await reader.cancel();
        issue("GLB exceeds eight MiB.");
      }
      chunks.push(chunk.value);
    }
    try {
      validateHall(Buffer.concat(chunks));
    } catch {
      return issue("The scene does not satisfy the Library GLB contract.");
    }
    if (!asset) {
      const last = await tx.sceneAsset.aggregate({
        where: { slug },
        _max: { version: true },
      });
      asset = await tx.sceneAsset.create({
        data: {
          slug,
          version: (last._max.version ?? 0) + 1,
          mediaId: media.id,
          isActive: false,
        },
        include: { media: true },
      });
    }
  }
  await tx.sceneAsset.updateMany({
    where: { slug, isActive: true },
    data: { isActive: false },
  });
  if (asset)
    await tx.sceneAsset.update({
      where: { id: asset.id },
      data: { isActive: true },
    });
  await audit(
    actor,
    "library.scene.activate",
    null,
    asset?.id ?? null,
    { previous, version: asset?.version ?? "builtin" },
    tx,
  );
}
const commands = {
  book: bookForm,
  page: pageForm,
  place: placeForm,
  shelf: shelfForm,
  zone: zoneForm,
  screen: screenForm,
  scene: sceneForm,
};
export async function saveLibrary(_state: State, fd: FormData): Promise<State> {
  const admin = await getAdmin();
  if (!admin || admin.mustChangePassword)
    return {
      ok: false,
      message:
        "Sign in or update your password in another tab. Your edits are still here.",
    };
  try {
    const command = valueOf(
      field(fd, "command"),
      Object.keys(commands) as (keyof typeof commands)[],
    );
    await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`select pg_advisory_xact_lock(81005214)::text`;
        await commands[command](tx, fd, admin.email);
      },
      { isolationLevel: "Serializable", timeout: 20000 },
    );
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof InputError
          ? e.message
          : "The save did not complete. Check for a conflicting slug, position or newer edit.",
    };
  }
  revalidatePath("/admin/library");
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved to the Library." };
}
