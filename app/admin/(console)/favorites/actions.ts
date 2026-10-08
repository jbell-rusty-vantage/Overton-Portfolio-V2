"use server";

import { revalidatePath } from "next/cache";
import { db, type DisplayState, type FavoriteStatus, type Prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { audit, snapshot } from "@/lib/admin/audit";
import { date, int, list, oneOf, reqStr, str } from "@/lib/admin/form";
import { slugify } from "@/lib/slug";
import { DISPLAY_STATES } from "@/components/admin/ui";
import { parseAttributeSchema, readAttributes } from "./attributes";

const STATUSES = ["current", "past", "wishlist"] as const satisfies readonly FavoriteStatus[];

function optionalUrl(fd: FormData, key: string) {
  const v = str(fd, key);
  if (!v) return null;
  try {
    return new URL(v).toString();
  } catch {
    throw new Error(`${key} is not a valid URL (include https://)`);
  }
}

function favoriteFields(fd: FormData) {
  const rating = int(fd, "rating");
  return {
    title: reqStr(fd, "title"),
    creator: str(fd, "creator"),
    url: optionalUrl(fd, "url"),
    affiliateUrl: optionalUrl(fd, "affiliateUrl"),
    rating: rating === null ? null : Math.min(5, Math.max(1, rating)),
    status: oneOf<FavoriteStatus>(fd, "status", STATUSES, "current"),
    startedOn: date(fd, "startedOn"),
    endedOn: date(fd, "endedOn"),
    summary: str(fd, "summary"),
    tags: list(fd, "tags"),
    sortOrder: int(fd, "sortOrder") ?? 0,
    display: oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden"),
  };
}

async function uniqueFavoriteSlug(title: string) {
  const base = slugify(title) || "favorite";
  const taken = new Set(
    (await db.favorite.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((f) => f.slug),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

const isShown = (d: DisplayState) => d === "published" || d === "featured";

export async function createFavorite(fd: FormData) {
  const admin = await requireAdmin();
  const category = await db.favoriteCategory.findUniqueOrThrow({ where: { code: reqStr(fd, "categoryCode") } });
  const fields = favoriteFields(fd);
  const fav = await db.favorite.create({
    data: {
      ...fields,
      slug: await uniqueFavoriteSlug(fields.title),
      categoryCode: category.code,
      attributes: readAttributes(fd, parseAttributeSchema(category.attributeSchema)) as Prisma.InputJsonValue,
      publishedAt: isShown(fields.display) ? new Date() : null,
    },
  });
  await snapshot("favorite", fav.id, fav, admin.email, "created");
  await audit(admin.email, "create", "favorite", fav.id, { title: fav.title, category: fav.categoryCode });
  revalidatePath("/admin/favorites");
}

export async function updateFavorite(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const current = await db.favorite.findUniqueOrThrow({ where: { id }, include: { category: true } });
  const fields = favoriteFields(fd);
  const fav = await db.favorite.update({
    where: { id },
    data: {
      ...fields,
      attributes: readAttributes(fd, parseAttributeSchema(current.category.attributeSchema), current.attributes) as Prisma.InputJsonValue,
      publishedAt: current.publishedAt ?? (isShown(fields.display) ? new Date() : null),
    },
  });
  await snapshot("favorite", id, fav, admin.email, "updated");
  await audit(admin.email, "update", "favorite", id);
  revalidatePath("/admin/favorites");
}

export async function setFavoriteDisplay(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const display = oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden");
  const current = await db.favorite.findUniqueOrThrow({ where: { id }, select: { publishedAt: true, display: true } });
  if (current.display === display) return;
  const fav = await db.favorite.update({
    where: { id },
    data: { display, publishedAt: current.publishedAt ?? (isShown(display) ? new Date() : null) },
  });
  await snapshot("favorite", id, fav, admin.email, `display → ${display}`);
  await audit(admin.email, "set_display", "favorite", id, { from: current.display, to: display });
  revalidatePath("/admin/favorites");
}

export async function deleteFavorite(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  await db.favorite.update({ where: { id }, data: { deletedAt: new Date(), display: "hidden" } });
  await audit(admin.email, "soft_delete", "favorite", id);
  revalidatePath("/admin/favorites");
}
