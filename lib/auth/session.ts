import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";

// Data Access Layer for admin auth. Sessions are DB-backed: the cookie holds a
// random token; admin_sessions stores only its SHA-256. No signing secret needed.

export type Admin = { id: string; email: string; name: string; mustChangePassword: boolean };

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.adminSession.create({
    data: { userId, tokenHash: sha256(token), expiresAt, userAgent: userAgent ?? null },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Returns the signed-in admin or null. Never cached across requests. */
export async function getAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const { user } = session;
  return { id: user.id, email: user.email, name: user.name, mustChangePassword: user.mustChangePassword };
}

/**
 * Gate for every admin page, Server Action and Route Handler.
 * Redirects to /admin/login when signed out and to /admin/account when the
 * bootstrap password still has to be changed.
 */
export async function requireAdmin(opts: { allowPasswordChange?: boolean } = {}): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !opts.allowPasswordChange) redirect("/admin/account?first=1");
  return admin;
}
