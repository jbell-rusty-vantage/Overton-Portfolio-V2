import { officePage } from "@/components/admin/office-page";
import { requireAdmin } from "@/lib/auth/session";
import { getCollection } from "@/lib/library/catalog";
import Experience from "@/components/library/Experience";
import { FullReader } from "@/components/library/Reading";
import { notFound } from "next/navigation";
import Estate from "@/components/estate/Estate";
import { getEstate } from "@/lib/estate/catalog";
import Portfolio from "@/components/portfolio/Portfolio";
async function Preview({ searchParams }: PageProps<"/admin/preview/library">) {
  await requireAdmin();
  const params = await searchParams;
  if (params.portfolio === "1") return <Portfolio data={await getCollection({ admin: true })} admin />;
  if (
    !params.view &&
    !params.catalog &&
    !params.read &&
    !params.book &&
    !params.zone
  )
    return <Estate data={await getEstate("admin")} />;
  const data = await getCollection({ admin: true });
  if (typeof params.read === "string") {
    const book = data.volumes.find(
      (b) => b.slug === params.read || b.projectSlug === params.read,
    );
    if (!book) notFound();
    return <FullReader v={book} volumes={data.volumes} source={data.source} admin />;
  }
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (typeof v === "string") q.set(k, v);
  return (
    <Experience
      data={data}
      initialQuery={q.size ? "?" + q : ""}
      catalog={params.catalog === "1"}
      admin
    />
  );
}

export default officePage(Preview);
