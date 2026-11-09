import Link from "next/link";
import { Suspense } from "react";
import Experience from "@/components/library/Experience";
import { getCollection } from "@/lib/library/catalog";

import { entranceMetadata } from "@/lib/library/metadata";
export async function generateMetadata({ searchParams }: PageProps<"/">) {
  const [params, data] = await Promise.all([searchParams, getCollection()]);
  return entranceMetadata(
    params.view === "world",
    data.volumes.find((b) => b.slug === params.book),
    data.source,
  );
}

async function Entrance({ searchParams }: PageProps<"/">) {
  const [data, params] = await Promise.all([getCollection(), searchParams]);
  const q = new URLSearchParams();
  for (const key of ["view", "zone", "shelf", "book", "kind", "page", "tour"])
    if (typeof params[key] === "string") q.set(key, params[key]);
  return <Experience data={data} initialQuery={q.size ? "?" + q : ""} />;
}
export default function Home(props: PageProps<"/">) {
  return (
    <Suspense
      fallback={
        <div className="library initial-hall">
          <h1>The Library</h1>
          <p>Opening the collection…</p>
          <Link prefetch={false} href="/projects">
            Library catalog
          </Link>
        </div>
      }
    >
      <Entrance {...props} />
    </Suspense>
  );
}
