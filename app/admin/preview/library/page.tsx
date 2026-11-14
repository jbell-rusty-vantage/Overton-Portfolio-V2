import { officePage } from "@/components/admin/office-page";
import { requireAdmin } from "@/lib/auth/session";
import { getCollection } from "@/lib/library/catalog";
import Catalog from "@/components/library/Catalog";
import LegacyArrival from "@/components/library/LegacyArrival";
import { FullReader } from "@/components/library/Reading";
import { notFound } from "next/navigation";
import Estate from "@/components/estate/Estate";
import { getEstate } from "@/lib/estate/catalog";
import Portfolio from "@/components/portfolio/Portfolio";
import { estateBookLink } from "@/lib/estate/book-link";
async function Preview({ searchParams }: PageProps<"/admin/preview/library">) {
  await requireAdmin();
  const params = await searchParams;
  if (params.portfolio === "1") return <Portfolio data={await getCollection({ admin: true })} admin />;
  const data = await getCollection({ admin: true });
  if (typeof params.read === "string") {
    const book = data.volumes.find(
      (b) => b.slug === params.read || b.projectSlug === params.read,
    );
    if (!book) notFound();
    return <FullReader v={book} volumes={data.volumes} source={data.source} libraryHref={await estateBookLink(book, true)} admin />;
  }
  if (params.catalog === "1") return <><p>Private draft collection</p><Catalog data={data} admin /></>;
  const estate = await getEstate("admin");
  if (!["view", "book", "zone", "shelf"].some(key => typeof params[key] === "string")) return <Estate data={estate} />;
  return <><LegacyArrival volumes={data.volumes} placed={estate.program?.world ? estate.projects.map(v => v.slug) : []} admin /><Estate data={estate} /></>;

}

export default officePage(Preview);
