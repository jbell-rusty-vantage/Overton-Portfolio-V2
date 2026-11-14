import { notFound } from "next/navigation";
import { officePage } from "@/components/admin/office-page";
import { requireAdmin } from "@/lib/auth/session";
import { getCollection } from "@/lib/library/catalog";
import { FullReader } from "@/components/library/Reading";
import { detailHref } from "@/lib/library/model";
async function Preview({ params }: PageProps<"/admin/preview/[kind]/[slug]">) {
  await requireAdmin();
  const { kind, slug } = await params;
  if (!["projects", "books", "blog", "favorites", "evolution"].includes(kind)) notFound();
  const data = await getCollection({ admin: true });
  const volume = data.volumes.find(v => detailHref(v) === `/${kind}/${encodeURIComponent(slug)}`);
  if (!volume) notFound();
  return <FullReader v={volume} volumes={data.volumes} source={data.source} admin />;
}
export default officePage(Preview);
