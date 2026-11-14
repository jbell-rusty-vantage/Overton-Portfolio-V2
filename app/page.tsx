import { Suspense } from "react";
import Arrival from "@/components/library/LegacyArrival";
import { getEstate } from "@/lib/estate/catalog";
import Portfolio from "@/components/portfolio/Portfolio";
import { getCollection } from "@/lib/library/catalog";
import LegacyArrival from "@/components/portfolio/LegacyArrival";
export const metadata = { title: { absolute: "John Overton Bell · Software Developer" }, description: "Software case studies: client platforms, commerce, research agents and the systems behind them.", alternates: { canonical: "/" } };
async function SelectedWork({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  if (["view", "book", "zone", "shelf"].some(key => typeof params[key] === "string")) {
    const [collection, estate] = await Promise.all([getCollection(), getEstate()]);
    return <><Arrival volumes={collection.volumes} placed={estate.program?.world ? estate.projects.map(v => v.slug) : []} /><p className="library">Opening Travellers Rest… <a href="/catalog">Read the text catalog</a></p></>;

  }
  return <><LegacyArrival /><Portfolio data={await getCollection()} /></>;
}
export default function Home(props: PageProps<"/">) {
  return <Suspense fallback={<p className="library">Opening selected work… <a href="/resume">Read my résumé</a></p>}><SelectedWork {...props} /></Suspense>;
}
