import { Suspense } from "react";
import { requireLocalSamples } from "@/lib/library/local";
import { sampleCollection } from "@/lib/library/fixtures";
import SampleDesk from "@/components/library/SampleDesk";
export const metadata = {
  title: "Sample placement desk",
  robots: { index: false },
};
async function Desk() {
  await requireLocalSamples();
  return <SampleDesk base={sampleCollection()} initialQuery="" editor />;
}
export default function Page() {
  return (
    <Suspense fallback={<p>Opening sample desk…</p>}>
      <Desk />
    </Suspense>
  );
}
