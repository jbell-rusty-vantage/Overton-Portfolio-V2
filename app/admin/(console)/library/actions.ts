"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAdmin } from "@/lib/auth/session";
import { commands, field, valueOf, InputError } from "@/lib/admin/library-use-cases";
type State = { ok: boolean; message: string };
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
