import Link from "next/link";
import { Suspense } from "react";
import LegacyArrival from "@/components/library/LegacyArrival";
import { getCollection } from "@/lib/library/catalog";
import Estate from "@/components/estate/Estate";
import { getEstate } from "@/lib/estate/catalog";

export const metadata = {
  alternates: { canonical: "/library" },
  title: { absolute: "Travellers Rest · John Overton Bell’s Portfolio" },
  description: "Visit Judge John Overton’s Tennessee library and explore the work of his descendant, John Overton Bell, in the family cabinet.",
};

async function Entrance({ searchParams }: PageProps<"/library">) {
  const params = await searchParams;
  const data = await getEstate();
  if (!["view", "book", "zone", "shelf"].some(key => typeof params[key] === "string")) return <Estate data={data} />;
  const collection = await getCollection();
  return <><LegacyArrival volumes={collection.volumes} placed={data.program?.world ? data.projects.map(v => v.slug) : []} /><Estate data={data} /></>;

}
export default function Home(props: PageProps<"/library">) {
  return (
    <Suspense
      fallback={
        <div className="ea-loading">
          <p>Opening the Overton Archive…</p>
          <Link prefetch={false} href="/catalog">
            Text catalog
          </Link>
        </div>
      }
    >
      <Entrance {...props} />
    </Suspense>
  );
}
