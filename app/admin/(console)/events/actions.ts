"use server";

import { revalidatePath } from "next/cache";
import { db, type DatePrecision, type DisplayState, type SignalVisibility, type TimelineNodeKind } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { audit, emitSignal, snapshot } from "@/lib/admin/audit";
import { int, oneOf, reqStr, str } from "@/lib/admin/form";
import { DISPLAY_STATES } from "@/components/admin/ui";
import {
  NODE_KINDS,
  PRECISIONS,
  SIGNAL_VISIBILITIES,
  appendToTimelines,
  localDateTime,
  publishedAtFor,
  uniqueNodeSlug,
} from "./lib";

export type PostEventState = { ok?: string; error?: string; at?: number };

const DAY = 24 * 60 * 60 * 1000;

/** "Post a custom event": an admin-sourced signal. Returns errors instead of throwing so the form keeps its input. */
export async function postEvent(_prev: PostEventState, fd: FormData): Promise<PostEventState> {
  const admin = await requireAdmin();
  const at = Date.now();

  const typeCode = str(fd, "typeCode");
  const title = str(fd, "title");
  if (!typeCode || !title) return { error: "Type and title are required.", at };
  const type = await db.signalType.findUnique({ where: { code: typeCode } });
  if (!type || type.source !== "admin") return { error: `Unknown admin signal type: ${typeCode}`, at };

  let url: string | null = str(fd, "url");
  if (url) {
    try {
      url = new URL(url).toString();
    } catch {
      return { error: "URL is not valid (include https://).", at };
    }
  }

  let payload: Record<string, unknown> = {};
  const rawPayload = str(fd, "payload");
  if (rawPayload) {
    try {
      const parsed: unknown = JSON.parse(rawPayload);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { error: "Payload must be a JSON object, e.g. {\"key\": \"value\"}.", at };
      }
      payload = parsed as Record<string, unknown>;
    } catch (e) {
      return { error: `Payload is not valid JSON: ${(e as Error).message}`, at };
    }
  }

  const occurredAt = localDateTime(fd, "occurredAt") ?? new Date();
  const preset = str(fd, "expiresIn") ?? "none";
  let expiresAt: Date | null = null;
  if (preset === "custom") {
    expiresAt = localDateTime(fd, "expiresAt");
    if (!expiresAt) return { error: "Pick a custom expiry date or choose another preset.", at };
  } else if (preset !== "none") {
    const days = Number(preset);
    if (!Number.isFinite(days) || days <= 0) return { error: "Unknown expiry preset.", at };
    expiresAt = new Date(Date.now() + days * DAY);
  }
  if (expiresAt && expiresAt <= occurredAt) return { error: "Expiry must be after the event time.", at };

  const projectId = str(fd, "projectId");
  const event = await emitSignal({
    typeCode,
    source: "admin",
    title,
    summary: str(fd, "summary"),
    url,
    projectId,
    visibility: oneOf<SignalVisibility>(fd, "visibility", ["public", "private"], "public"),
    occurredAt,
    expiresAt,
    sceneEffect: str(fd, "sceneEffect"),
    payload,
    actor: admin.email,
  });
  await audit(admin.email, "post_event", "activity_event", event.id, { typeCode, title });
  revalidatePath("/admin/events");
  return { ok: `Posted “${title}”.`, at };
}

/** Signals are append-only; visibility is one of the two fields that may change. */
export async function setSignalVisibility(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const visibility = oneOf<SignalVisibility>(fd, "visibility", SIGNAL_VISIBILITIES, "private");
  const before = await db.activityEvent.findUniqueOrThrow({ where: { id }, select: { visibility: true } });
  if (before.visibility === visibility) return;
  await db.activityEvent.update({ where: { id }, data: { visibility } });
  await audit(admin.email, "set_visibility", "activity_event", id, { from: before.visibility, to: visibility });
  revalidatePath("/admin/events");
}

/** The other permitted change: expire a signal now (drops it from v_live_feed). */
export async function expireSignal(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const before = await db.activityEvent.findUniqueOrThrow({ where: { id }, select: { expiresAt: true } });
  const now = new Date();
  if (before.expiresAt && before.expiresAt <= now) return;
  await db.activityEvent.update({ where: { id }, data: { expiresAt: now } });
  await audit(admin.email, "expire", "activity_event", id, { previousExpiresAt: before.expiresAt });
  revalidatePath("/admin/events");
}

/**
 * Promote a signal to a hidden draft moment (Prisma port of portfolio_promote_signal):
 * links the signal as evidence and appends the moment to the global timeline and,
 * when one exists, the project's timeline.
 */
export async function promoteSignal(fd: FormData) {
  const admin = await requireAdmin();
  const eventId = reqStr(fd, "id");
  const stageCode = str(fd, "stageCode");

  const node = await db.$transaction(async (tx) => {
    const e = await tx.activityEvent.findUniqueOrThrow({ where: { id: eventId } });
    const created = await tx.timelineNode.create({
      data: {
        slug: await uniqueNodeSlug(tx, e.title),
        title: e.title,
        summary: e.summary,
        occurredAt: e.occurredAt,
        kind: e.typeCode.includes("release") ? "release" : "progress",
        stageCode,
        projectId: e.projectId,
        display: "hidden",
      },
    });
    await tx.timelineNodeSignal.create({ data: { nodeId: created.id, eventId } });
    const timelines = await tx.timeline.findMany({
      where: {
        OR: [{ slug: "global" }, ...(e.projectId ? [{ kind: "project" as const, projectId: e.projectId }] : [])],
      },
      select: { id: true },
    });
    await appendToTimelines(
      tx,
      created.id,
      timelines.map((t) => t.id),
    );
    return tx.timelineNode.findUniqueOrThrow({
      where: { id: created.id },
      include: { signals: true, memberships: true },
    });
  });

  await snapshot("timeline_node", node.id, node, admin.email, "promoted from signal");
  await audit(admin.email, "promote_signal", "timeline_node", node.id, { eventId, stageCode });
  revalidatePath("/admin/events");
  revalidatePath("/admin/events/moments");
}

// ---------------------------------------------------------------------------
// Moments (timeline_nodes)
// ---------------------------------------------------------------------------

function timelineIds(fd: FormData) {
  return fd.getAll("timelineIds").filter((v): v is string => typeof v === "string" && v !== "");
}

function clampImportance(n: number | null) {
  return Math.min(5, Math.max(1, n ?? 3));
}

/** Hand-written moment (no signal), e.g. pre-GitHub history for the evolution timeline. */
export async function createMoment(fd: FormData) {
  const admin = await requireAdmin();
  const title = reqStr(fd, "title");
  const occurredAt = localDateTime(fd, "occurredAt");
  if (!occurredAt) throw new Error("Missing field: occurredAt");
  const display = oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden");

  const node = await db.$transaction(async (tx) => {
    const created = await tx.timelineNode.create({
      data: {
        slug: await uniqueNodeSlug(tx, title),
        title,
        summary: str(fd, "summary"),
        occurredAt,
        precision: oneOf<DatePrecision>(fd, "precision", PRECISIONS, "day"),
        kind: oneOf<TimelineNodeKind>(fd, "kind", NODE_KINDS, "milestone"),
        stageCode: str(fd, "stageCode"),
        projectId: str(fd, "projectId"),
        importance: clampImportance(int(fd, "importance")),
        display,
        publishedAt: publishedAtFor(display),
      },
    });
    await appendToTimelines(tx, created.id, timelineIds(fd));
    return tx.timelineNode.findUniqueOrThrow({ where: { id: created.id }, include: { memberships: true } });
  });

  await snapshot("timeline_node", node.id, node, admin.email, "created");
  await audit(admin.email, "create", "timeline_node", node.id, { title });
  revalidatePath("/admin/events/moments");
}

/** Edit a moment's curation fields and sync which timelines it sits on. */
export async function updateMoment(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const display = oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden");
  const wanted = timelineIds(fd);

  const node = await db.$transaction(async (tx) => {
    const current = await tx.timelineNode.findUniqueOrThrow({ where: { id }, include: { memberships: true } });
    await tx.timelineNode.update({
      where: { id },
      data: {
        title: str(fd, "title") ?? current.title,
        summary: str(fd, "summary"),
        occurredAt: localDateTime(fd, "occurredAt") ?? current.occurredAt,
        precision: oneOf<DatePrecision>(fd, "precision", PRECISIONS, current.precision),
        kind: oneOf<TimelineNodeKind>(fd, "kind", NODE_KINDS, current.kind),
        stageCode: str(fd, "stageCode"),
        projectId: str(fd, "projectId"),
        importance: clampImportance(int(fd, "importance")),
        display,
        publishedAt: publishedAtFor(display, current.publishedAt),
      },
    });
    if (fd.has("syncTimelines")) {
      await tx.timelineMembership.deleteMany({ where: { nodeId: id, timelineId: { notIn: wanted } } });
      await appendToTimelines(tx, id, wanted);
    }
    return tx.timelineNode.findUniqueOrThrow({ where: { id }, include: { memberships: true } });
  });

  await snapshot("timeline_node", id, node, admin.email, "updated");
  await audit(admin.email, "update", "timeline_node", id);
  revalidatePath("/admin/events/moments");
}

/** Quick inline curation from the moments list: display, stage, importance. */
export async function quickUpdateMoment(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const display = oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden");
  const current = await db.timelineNode.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
  const node = await db.timelineNode.update({
    where: { id },
    data: {
      display,
      stageCode: str(fd, "stageCode"),
      importance: clampImportance(int(fd, "importance")),
      publishedAt: publishedAtFor(display, current.publishedAt),
    },
  });
  await snapshot("timeline_node", id, node, admin.email, "curated");
  await audit(admin.email, "update", "timeline_node", id, {
    display: node.display,
    stageCode: node.stageCode,
    importance: node.importance,
  });
  revalidatePath("/admin/events/moments");
  revalidatePath("/admin/events");
}

export async function deleteMoment(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  await db.timelineNode.update({ where: { id }, data: { deletedAt: new Date(), display: "hidden" } });
  await audit(admin.email, "soft_delete", "timeline_node", id);
  revalidatePath("/admin/events/moments");
}
