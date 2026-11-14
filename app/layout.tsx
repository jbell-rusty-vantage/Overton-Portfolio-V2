import { publicOrigin } from "@/lib/library/origin";
import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";
import "./library.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: {
    default: "John Overton Bell — The Library",
    template: "%s · The Library",
  },
  description:
    "John Overton Bell's portfolio, kept in the library of his ancestor Judge John Overton: project volumes, letters and a guided visit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <noscript>
          <p style={{ padding: "1rem" }}>
            <Link prefetch={false} href="/catalog">
              Open the Library text catalog
            </Link>{" "}
            to browse and read without JavaScript.
          </p>
        </noscript>
        {children}
      </body>
    </html>
  );
}
