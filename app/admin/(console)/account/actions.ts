"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAccountAdmin } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { audit } from "@/lib/admin/audit";

export type PasswordState = { error?: string; ok?: boolean };

export async function changePassword(_prev: PasswordState, fd: FormData): Promise<PasswordState> {
  const admin = await requireAccountAdmin(true);
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < 12) return { error: "Use at least 12 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(current, user.passwordHash))) return { error: "Current password is wrong." };
  await db.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false },
  });
  await audit(admin.email, "change_password", null, null);
  redirect("/admin?welcome=1");
}

export async function updateProfile(fd: FormData) {
  const admin = await requireAccountAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) return;
  await db.adminUser.update({ where: { id: admin.id }, data: { name, email } });
  await audit(admin.email, "update_profile", null, null, { email });
  redirect("/admin/account?saved=1");
}

export async function signOutEverywhere() {
  const admin = await requireAccountAdmin(true);
  await db.adminSession.deleteMany({ where: { userId: admin.id } });
  redirect("/admin/login");
}
