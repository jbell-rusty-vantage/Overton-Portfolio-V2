import { DetailRoute } from "@/components/library/Routes";
import { volumeMetadata } from "@/lib/library/metadata";
export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  return volumeMetadata((await params).slug, false, "Journal");
}
export default function Page({ params }: PageProps<"/blog/[slug]">) {
  return <DetailRoute params={params} kind="Journal" />;
}
