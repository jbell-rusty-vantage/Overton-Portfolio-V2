import { DetailRoute } from "@/components/library/Routes";
import { volumeMetadata } from "@/lib/library/metadata";
export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">) {
  return volumeMetadata((await params).slug, true);
}
export default function Page({ params }: PageProps<"/projects/[slug]">) {
  return <DetailRoute params={params} project />;
}
