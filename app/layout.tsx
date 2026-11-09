import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";
import "./library.css";

export const metadata: Metadata = {
  title: {
    default: "John Overton — The Library",
    template: "%s · The Library",
  },
  description:
    "John Overton's portfolio, reimagined as a 3D library: project volumes, field notes and a guided collection.",
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
