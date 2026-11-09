import { DetailRoute } from "@/components/library/Routes";
import { volumeMetadata } from "@/lib/library/metadata";
export async function generateMetadata({
  params,
}: PageProps<"/favorites/[slug]">) {
  return volumeMetadata((await params).slug, false, "Favorite");
}
export default function Page({ params }: PageProps<"/favorites/[slug]">) {
  return <DetailRoute params={params} kind="Favorite" />;
}
