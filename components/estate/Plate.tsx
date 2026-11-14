import { base } from "@/lib/estate/model";
export function Plate({
  name,
  alt,
  priority = false,
  size = "100vw",
}: {
  name: "approach" | "entry" | "library" | "reports" | "cabinet";
  alt: string;
  priority?: boolean;
  size?: string;
}) {
  // Both local delivery sizes are already encoded. Native srcset also works before hydration.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="ea-plate"
      src={base + "plates/" + name + ".webp"}
      srcSet={
        base +
        "plates/" +
        name +
        "-small.webp 800w, " +
        base +
        "plates/" +
        name +
        ".webp " +
        (name === "approach" ? "1914" : "1440") +
        "w"
      }
      sizes={size}
      width={name === "approach" ? 1914 : 1440}
      height={name === "approach" ? 822 : 810}
      alt={alt}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
