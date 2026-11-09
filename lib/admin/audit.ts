import "server-only";
import { db, type EntityType, Prisma } from "@/lib/db";

/** Record an admin/agent write in audit_log. */
export async function audit(
  actor: string,
  action: string,
  entityType: EntityType | null,
  entityId: string | null,
  detail: Record<string, unknown> = {},
  client: Prisma.TransactionClient = db,
) {
  await client.auditLog.create({
    data: { actor, action, entityType, entityId, detail: detail as Prisma.InputJsonValue },
  });
}

/** Append the next version of an entity to revisions (full snapshot). */
export async function snapshot(
  entityType: EntityType,
  entityId: string,
  row: unknown,
  author = "john",
  message?: string,
  client: Prisma.TransactionClient = db,
) {
  const last = await client.revision.findFirst({
    where: { entityType, entityId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  await client.revision.create({
    data: {
      entityType,
      entityId,
      version: (last?.version ?? 0) + 1,
      author,
      message,
      snapshot: JSON.parse(JSON.stringify(row, (_k, v) => (typeof v === "bigint" ? v.toString() : v))),
    },
  });
}

/** Emit a signal (activity_events row). */
export async function emitSignal(input: {
  typeCode: string;
  source: "github" | "vercel" | "admin" | "system" | "agent";
  title: string;
  summary?: string | null;
  url?: string | null;
  visibility?: "public" | "private" | "redacted";
  projectId?: string | null;
  postId?: string | null;
  repoId?: string | null;
  deploymentId?: string | null;
  actor?: string | null;
  payload?: Record<string, unknown>;
  dedupeKey?: string | null;
  occurredAt?: Date;
  expiresAt?: Date | null;
  sceneEffect?: string | null;
}, client: Prisma.TransactionClient = db) {
  const data = {
    typeCode: input.typeCode,
    source: input.source,
    title: input.title,
    summary: input.summary ?? null,
    url: input.url ?? null,
    visibility: input.visibility ?? "private",
    projectId: input.projectId ?? null,
    postId: input.postId ?? null,
    repoId: input.repoId ?? null,
    deploymentId: input.deploymentId ?? null,
    actor: input.actor ?? "john",
    payload: (input.payload ?? {}) as Prisma.InputJsonValue,
    dedupeKey: input.dedupeKey ?? null,
    occurredAt: input.occurredAt ?? new Date(),
    expiresAt: input.expiresAt ?? null,
    sceneEffect: input.sceneEffect ?? null,
  };
  if (!input.dedupeKey) return client.activityEvent.create({ data });
  return client.activityEvent.upsert({ where: { dedupeKey: input.dedupeKey }, update: {}, create: data });
}
