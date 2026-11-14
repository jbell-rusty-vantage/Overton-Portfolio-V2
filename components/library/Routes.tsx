import { Suspense } from "react";
import { notFound } from "next/navigation";
import CatalogView from "./Catalog";
import { FullReader } from "./Reading";
import { type VolumeKind } from "@/lib/library/types";
import { getCollection } from "@/lib/library/catalog";
import { estateBookLink } from "@/lib/estate/book-link";

async function Catalog({ kind }: { kind: string }) {
  return <CatalogView data={await getCollection()} startKind={kind} />;
}
export function CatalogRoute({ kind = "All" }: { kind?: string }) {
  return (
    <Suspense fallback={<p>Opening the catalog…</p>}>
      <Catalog kind={kind} />
    </Suspense>
  );
}
async function Read({
  params,
  project,
  kind,
}: {
  params: Promise<{ slug: string }>;
  project: boolean;
  kind?: VolumeKind;
}) {
  const { slug } = await params;
  const data = await getCollection({ direct: slug });
  if (data.source === "unavailable")
    return (
      <p className="library empty">
        The volume is unavailable. Reload to try again.
      </p>
    );
  const volume = data.volumes.find(
    (v) =>
      (v.slug === slug || (project && v.projectSlug === slug)) &&
      (!project || v.kind === "Project") &&
      (!kind || v.kind === kind),
  );
  if (!volume) notFound();
  const collection = volume.kind === "Project" ? await getCollection() : data;
  return <FullReader v={volume} source={data.source} volumes={collection.volumes} libraryHref={await estateBookLink(volume)} />;
}
export function DetailRoute({
  params,
  project = false,
  kind,
}: {
  params: Promise<{ slug: string }>;
  project?: boolean;
  kind?: VolumeKind;
}) {
  return (
    <Suspense fallback={<p>Opening the volume…</p>}>
      <Read params={params} project={project} kind={kind} />
    </Suspense>
  );
}
