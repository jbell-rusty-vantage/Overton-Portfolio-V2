import { Suspense } from "react";
import { requireLocalSamples } from "@/lib/library/local";
import { sampleCollection } from "@/lib/library/fixtures";
import SampleDesk from "@/components/library/SampleDesk";
export const metadata = {
  title: "Sample collection",
  robots: { index: false },
};
async function Samples({ searchParams }: PageProps<"/samples">) {
  await requireLocalSamples();
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (typeof v === "string") q.set(k, v);
  return (
    <SampleDesk
      base={sampleCollection()}
      initialQuery={q.size ? "?" + q : ""}
    />
  );
}
export default function Page(props: PageProps<"/samples">) {
  return (
    <Suspense fallback={<p>Opening sample collection…</p>}>
      <Samples {...props} />
    </Suspense>
  );
}
