import { Suspense } from "react";
import { requireLocalSamples } from "@/lib/library/local";
import Lab from "./Lab";

export const metadata = { title: "World lab", robots: { index: false } };
async function Gate() {
  await requireLocalSamples();
  return <Lab />;
}
export default function Page() {
  return (
    <Suspense fallback={<p>Opening…</p>}>
      <Gate />
    </Suspense>
  );
}
