import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "John Overton — The Library",
    template: "%s · The Library",
  },
  description:
    "John Overton's portfolio, reimagined as a 3D library: projects, evolution, writing and favorites, guided by an AI librarian.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
