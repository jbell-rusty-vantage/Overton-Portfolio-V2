import "server-only";

import { type Prisma, type DisplayState } from "@/lib/db";
import { audit, emitSignal, snapshot } from "@/lib/admin/audit";
import {
  blocksFrom,
  publicMedia,
  publicImage,
  templateNames,
} from "@/lib/library/policy";
import { validateEstate } from "@/lib/library/scene-contract";
import { layoutSchema, roomAnchors } from "@/lib/estate/program";
import { shelves } from "@/lib/library/taxonomy";

export class InputError extends Error {}
const issue = (message: string): never => {
  throw new InputError(message);
};
type Tx = Prisma.TransactionClient;
export const field = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
function text(fd: FormData, k: string, limit = 240) {
  const value = field(fd, k);
  if (!value || value.length > limit)
    return issue("Check the " + k + " field.");
  return value;
}
export function valueOf<T extends string>(value: string, choices: readonly T[]): T {
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
    "Video",
    "Heading",
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
          ...(["Link", "Image", "Video"].includes(component)
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
      ![...shelves,{slug:"travellers-rest-writing-table",node:"desk.writing",zone:"travellers-rest-library"}].some(
        (a) =>
          a.slug === s.slug &&
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
async function verifyModel(url: string, validate: (bytes: Uint8Array) => void) {
  const response = await fetch(url, {
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
    validate(Buffer.concat(chunks));
  } catch {
    return issue("The scene does not satisfy the Library GLB contract.");
  }
}
async function estateForm(tx: Tx, fd: FormData, actor: string) {
  const layout = await tx.uiLayout.findUniqueOrThrow({
    where: { slug: "travellers-rest-visit" },
  });
  version(fd, layout.updatedAt.toISOString());
  const parsed = layoutSchema.parse(layout.blocks);
  const p = parsed[0].props;
  const publish =
    valueOf(field(fd, "release"), ["draft", "publish"] as const) === "publish";
  function schedule(key: string) {
    const v = field(fd, key);
    if (!v) return null;
    const time = Date.parse(v + "Z");
    if (!Number.isFinite(time)) return issue("Enter a UTC date and time.");
    return new Date(time).toISOString();
  }
  p.featuredFrom = schedule("start");
  p.featuredUntil = schedule("end");
  if (p.featuredFrom && p.featuredUntil && p.featuredFrom >= p.featuredUntil)
    issue("The end must follow the start.");
  const editions = await tx.sceneAsset.findMany({
    where: { slug: { in: Object.values(p.scenes) }, version: p.edition },
    include: { media: true },
  });
  if (publish) {
    if (editions.length !== 2) issue("Both house scene tiers are required.");
    const conflicting = await tx.sceneAsset.count({
      where: {
        slug: { in: Object.values(p.scenes) },
        version: { not: p.edition },
        isActive: true,
      },
    });
    if (conflicting)
      issue(
        "Another edition is active. Select the matching house program before releasing this visit.",
      );
    await Promise.all(
      editions.map((s) => {
        const url = publicMedia(s.media.url);
        if (!url || s.media.deletedAt || s.media.kind !== "model3d")
          return issue("A house scene is unavailable.");
        return verifyModel(url, (bytes) => validateEstate(bytes, p.edition));
      }),
    );
  }
  const display = publish ? "published" : "hidden";
  const book = await tx.book.findUniqueOrThrow({
    where: { slug: p.companion },
  });
  if (book.entityId || book.entityType)
    issue("The house book must be a standalone companion.");
  const rooms = await tx.libraryZone.findMany({
    where: { slug: { in: roomAnchors.map((r) => r.slug) } },
  });
  if (
    publish &&
    !roomAnchors.every((anchor) =>
      rooms.some(
        (r) => r.slug === anchor.slug && r.sceneNodeName === anchor.node,
      ),
    )
  )
    issue("The house room inventory or scene anchors are incomplete.");
  for (const s of editions) {
    if (s.isActive === publish) continue;
    await tx.sceneAsset.update({
      where: { id: s.id },
      data: { isActive: publish },
    });
    await audit(
      actor,
      "estate.scene.visibility",
      null,
      s.id,
      { active: publish },
      tx,
    );
  }
  for (const r of rooms) {
    if (r.display === display) continue;
    const row = await tx.libraryZone.update({
      where: { id: r.id },
      data: { display },
    });
    await snapshot(
      "library_zone",
      r.id,
      row,
      actor,
      "House visit visibility",
      tx,
    );
    await audit(
      actor,
      "estate.room.visibility",
      "library_zone",
      r.id,
      { display },
      tx,
    );
  }
  if (book.display !== display) {
    const row = await tx.book.update({
      where: { id: book.id },
      data: { display },
    });
    await snapshot(
      "book",
      book.id,
      row,
      actor,
      "House companion visibility",
      tx,
    );
    await audit(
      actor,
      "estate.book.visibility",
      "book",
      book.id,
      { display },
      tx,
    );
    await emitSignal(
      {
        typeCode: "admin.status",
        source: "admin",
        title: publish
          ? "Travellers Rest visit released"
          : "Travellers Rest visit withdrawn",
        visibility: "private",
        actor,
      },
      tx,
    );
  }
  const row = await tx.uiLayout.update({
    where: { id: layout.id },
    data: { blocks: parsed },
  });
  await snapshot("ui_layout", row.id, row, actor, "House program settings", tx);
  await audit(
    actor,
    "estate.program.save",
    "ui_layout",
    row.id,
    { display },
    tx,
  );
}
export const commands = {
  estate: estateForm,
  book: bookForm,
  page: pageForm,
  place: placeForm,
  shelf: shelfForm,
};
