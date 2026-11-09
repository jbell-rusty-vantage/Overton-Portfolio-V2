import { DetailRoute } from "@/components/library/Routes";
import { volumeMetadata } from "@/lib/library/metadata";
export async function generateMetadata({
  params,
}: PageProps<"/evolution/[slug]">) {
  return volumeMetadata((await params).slug, false, "Evolution");
}
export default function Page({ params }: PageProps<"/evolution/[slug]">) {
  return <DetailRoute params={params} kind="Evolution" />;
}
