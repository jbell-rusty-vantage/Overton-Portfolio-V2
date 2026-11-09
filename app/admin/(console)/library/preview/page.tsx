import { officePage } from "@/components/admin/office-page";
import { requireAdmin } from "@/lib/auth/session";
import { getCollection } from "@/lib/library/catalog";
import Experience from "@/components/library/Experience";
import { FullReader } from "@/components/library/Reading";
import { notFound } from "next/navigation";
async function Preview({
  searchParams,
}: PageProps<"/admin/library/preview">) {
  await requireAdmin();
  const params = await searchParams;
  const data = await getCollection({ admin: true });
  if (typeof params.read === "string") {
    const book = data.volumes.find(
      (b) => b.slug === params.read || b.projectSlug === params.read,
    );
    if (!book) notFound();
    return <FullReader v={book} source={data.source} admin />;
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
