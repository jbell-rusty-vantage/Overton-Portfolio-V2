import { officePage } from "@/components/admin/office-page";
import { requireAdmin } from "@/lib/auth/session";
import { getCollection } from "@/lib/library/catalog";
import { detailHref } from "@/lib/library/model";
import CompatibilityRedirect from "@/components/library/CompatibilityRedirect";
import { notFound } from "next/navigation";
async function Preview({ searchParams }: PageProps<"/admin/library/preview">) {
  await requireAdmin();
  const params = await searchParams;
  let destination = "/admin/preview/library";
  if (params.portfolio === "1") destination = "/admin/preview/portfolio";
  else if (typeof params.read === "string") {
    const data = await getCollection({ admin: true });
    const volume = data.volumes.find(v => v.slug === params.read || v.projectSlug === params.read);
    if (!volume) notFound();
    destination = "/admin/preview" + detailHref(volume);
  } else {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (typeof value === "string") query.set(key, value);
    if (query.size) destination += "?" + query;
  }
  return <CompatibilityRedirect destination={destination} />;
}
export default officePage(Preview);
