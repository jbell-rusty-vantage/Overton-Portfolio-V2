import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="card w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">The Library</p>
        <h1 className="mb-6 mt-1 font-serif text-2xl">Librarian&apos;s office</h1>
        <LoginForm />
      </div>
    </main>
  );
}
