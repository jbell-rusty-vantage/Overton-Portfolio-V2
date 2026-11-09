import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
export async function requireLocalSamples() {
  const h = await headers();
  if (
    process.env.NODE_ENV !== "development" ||
    !/^(127\.0\.0\.1|localhost):\d+$/.test(h.get("host") ?? "")
  )
    notFound();
}
