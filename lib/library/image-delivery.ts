import manifest from "@/content/library/image-delivery.json";
type Delivery = { width: number; height: number; variants: { width: number; url: string }[] };
const images: Record<string, Delivery> = manifest;
export function imageDelivery(url: string, sizes = "(max-width: 700px) 92vw, 900px") {
  const image = images[url];
  if (!image) return { src: url };
  return {
    src: image.variants[Math.min(1, image.variants.length - 1)].url,
    srcSet: image.variants.map(v => `${v.url} ${v.width}w`).join(", "),
    sizes,
    width: image.width,
    height: image.height,
  };
}
