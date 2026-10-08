"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { audit } from "@/lib/admin/audit";

export type LoginState = { error?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required.", email };

  const user = await db.adminUser.findUnique({ where: { email } });
  // Always run a hash comparison to keep timing similar for unknown emails.
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (!user || !ok) return { error: "Invalid email or password.", email };

  const ua = (await headers()).get("user-agent");
  await createSession(user.id, ua);
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(user.email, "login", null, null);
  redirect(user.mustChangePassword ? "/admin/account?first=1" : "/admin");
}
