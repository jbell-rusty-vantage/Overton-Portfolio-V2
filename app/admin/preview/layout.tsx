import Link from "next/link";
export const metadata = { title: { default: "Private preview", template: "%s · Private preview" }, robots: { index: false, follow: false } };
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <div className="preview-shell"><aside className="preview-label">Private draft preview · <Link href="/admin">Return to the office</Link></aside>{children}</div>;
}
