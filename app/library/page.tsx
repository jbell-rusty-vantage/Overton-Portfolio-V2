import Link from "next/link";
import { Suspense } from "react";
import Experience from "@/components/library/Experience";
import { getCollection } from "@/lib/library/catalog";
import Estate from "@/components/estate/Estate";
import { getEstate } from "@/lib/estate/catalog";

import { entranceMetadata } from "@/lib/library/metadata";
export async function generateMetadata({ searchParams }: PageProps<"/library">) {
  const params = await searchParams;
  if (!params.view && !params.book)
    return {
      alternates: { canonical: "/library" },
      title: { absolute: "Travellers Rest · John Overton Bell’s Portfolio" },
      description:
        "Visit Judge John Overton’s Tennessee library and explore the work of his descendant, John Overton Bell, in the family cabinet.",
    };
  const data = await getCollection();
  return entranceMetadata(
    params.view === "world",
    data.volumes.find((b) => b.slug === params.book),
    data.source,
  );
}

async function Entrance({ searchParams }: PageProps<"/library">) {
  const params = await searchParams;
  if (!params.view && !params.book && !params.zone && !params.shelf)
    return <Estate data={await getEstate()} />;
  const data = await getCollection();
  const q = new URLSearchParams();
  for (const key of ["view", "zone", "shelf", "book", "kind", "page", "tour"])
    if (typeof params[key] === "string") q.set(key, params[key]);
  return <Experience data={data} initialQuery={q.size ? "?" + q : ""} />;
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
