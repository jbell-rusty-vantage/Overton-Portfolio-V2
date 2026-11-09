import { DetailRoute } from "@/components/library/Routes";
import { volumeMetadata } from "@/lib/library/metadata";
export async function generateMetadata({ params }: PageProps<"/books/[slug]">) {
  return volumeMetadata((await params).slug, false);
}
export default function Page({ params }: PageProps<"/books/[slug]">) {
  return <DetailRoute params={params} />;
}
