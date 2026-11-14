import { Suspense } from "react";
import { requireLocalSamples } from "@/lib/library/local";
import Visit from "./Visit";
import Estate from "@/components/estate/Estate";
import { getEstate } from "@/lib/estate/catalog";
import "./visit.css";

export const metadata = {
  title: "Travellers Rest · A house visit",
  robots: { index: false },
};

async function LocalVisit({ searchParams }: PageProps<"/dev/travellers-rest">) {
  await requireLocalSamples();
  if ((await searchParams).study === "1") return <Visit />;
  return <Estate data={await getEstate("local")} />;
}

export default function Page(props: PageProps<"/dev/travellers-rest">) {
  return (
    <Suspense fallback={<p>Opening the house…</p>}>
      <LocalVisit {...props} />
    </Suspense>
  );
}
