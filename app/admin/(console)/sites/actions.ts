"use server";

import { revalidatePath } from "next/cache";
import { db, type ActivationState, type DisplayState } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { audit, emitSignal, snapshot } from "@/lib/admin/audit";
import { bool, int, oneOf, reqStr, str } from "@/lib/admin/form";
import { slugify } from "@/lib/slug";
import { ACTIVATION_STATES, DISPLAY_STATES } from "@/components/admin/ui";

function siteFields(fd: FormData) {
  const url = new URL(reqStr(fd, "url")).toString();
  return {
    title: reqStr(fd, "title"),
    url,
    description: str(fd, "description"),
    provider: str(fd, "provider") ?? "vercel",
    vercelProjectId: str(fd, "vercelProjectId"),
    environment: str(fd, "environment") ?? "production",
    iframeAllowed: bool(fd, "iframeAllowed"),
    healthCheckUrl: str(fd, "healthCheckUrl"),
    sortOrder: int(fd, "sortOrder") ?? 0,
    display: oneOf<DisplayState>(fd, "display", DISPLAY_STATES, "hidden"),
    activation: oneOf<ActivationState>(fd, "activation", ACTIVATION_STATES, "tracking"),
  };
}

export async function createSite(fd: FormData) {
  const admin = await requireAdmin();
  const data = siteFields(fd);
  const site = await db.deployment.create({
    data: { ...data, slug: str(fd, "slug") ?? slugify(data.title) },
  });
  const projectId = str(fd, "projectId");
  if (projectId) {
    await db.projectDeployment.create({ data: { projectId, deploymentId: site.id, isPrimary: true } });
  }
  await snapshot("deployment", site.id, site, admin.email, "created");
  await audit(admin.email, "create", "deployment", site.id, { url: site.url });
  revalidatePath("/admin/sites");
}

export async function updateSite(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const site = await db.deployment.update({ where: { id }, data: siteFields(fd) });
  await snapshot("deployment", id, site, admin.email, "updated");
  await audit(admin.email, "update", "deployment", id);
  revalidatePath("/admin/sites");
}

export async function deleteSite(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  await db.deployment.update({ where: { id }, data: { deletedAt: new Date(), display: "hidden" } });
  await audit(admin.email, "soft_delete", "deployment", id);
  revalidatePath("/admin/sites");
}

/** Ping the site and store status code + latency (used later by the computer station). */
export async function checkSite(fd: FormData) {
  const admin = await requireAdmin();
  const id = reqStr(fd, "id");
  const site = await db.deployment.findUniqueOrThrow({ where: { id } });
  const target = site.healthCheckUrl ?? site.url;
  const started = Date.now();
  let status: number | null = null;
  let frameable: boolean | null = null;
  try {
    const res = await fetch(target, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10_000), cache: "no-store" });
    status = res.status;
    const xfo = res.headers.get("x-frame-options");
    const csp = res.headers.get("content-security-policy") ?? "";
    frameable = !xfo && !/frame-ancestors\s+('none'|'self')/i.test(csp);
  } catch {
    status = null;
  }
  const latency = Date.now() - started;
  const ok = status !== null && status < 400;
  await db.deployment.update({
    where: { id },
    data: {
      lastStatusCode: status,
      lastStatusOk: ok,
      lastLatencyMs: latency,
      lastCheckedAt: new Date(),
      ...(frameable === null ? {} : { iframeAllowed: frameable }),
    },
  });
  if (!ok && site.lastStatusOk !== false) {
    await emitSignal({
      typeCode: "admin.status",
      source: "system",
      title: `${site.title} health check failed`,
      summary: status ? `HTTP ${status}` : "No response",
      deploymentId: id,
      visibility: "private",
      actor: admin.email,
    });
  }
  revalidatePath("/admin/sites");
}
