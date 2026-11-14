import { Suspense } from "react";
import { redirect } from "next/navigation";
import Portfolio from "@/components/portfolio/Portfolio";
import { getCollection } from "@/lib/library/catalog";
import LegacyArrival from "@/components/portfolio/LegacyArrival";
export const metadata = { title: { absolute: "John Overton Bell · Software Developer" }, description: "Software case studies: client platforms, commerce, research agents and the systems behind them.", alternates: { canonical: "/" } };
async function SelectedWork({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  if (["view", "book", "zone", "shelf"].some(key => typeof params[key] === "string")) {
    const query = new URLSearchParams();
    for (const key of ["view", "zone", "shelf", "book", "kind", "page", "tour"]) if (typeof params[key] === "string") query.set(key, params[key]);
    redirect("/library?" + query);
  }
  return <><LegacyArrival /><Portfolio data={await getCollection()} /></>;
}
export default function Home(props: PageProps<"/">) {
  return <Suspense fallback={<p className="library">Opening selected work… <a href="/resume">Read my résumé</a></p>}><SelectedWork {...props} /></Suspense>;
}
