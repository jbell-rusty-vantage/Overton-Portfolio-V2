import Link from "next/link";

// Temporary public landing page while the 3D library is built.
// The 3D world (React Three Fiber + Blender GLB) replaces this — see docs/LIBRARY_3D.md.
export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 46px), repeating-linear-gradient(0deg, currentColor 0 2px, transparent 2px 120px)",
        }}
      />
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-muted">Under construction</p>
      <h1 className="max-w-3xl text-center font-serif text-5xl leading-tight sm:text-7xl">The Library</h1>
      <p className="mt-6 max-w-xl text-center text-lg text-muted">
        John Overton&apos;s portfolio is being rebuilt as a 3D library. Projects become books, an AI librarian
        guides you through the shelves, and the evolution from first code to production-grade agent systems gets its
        own hall.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
        <a className="btn-ghost" href="https://github.com/Overton77">GitHub</a>
        <Link className="btn-ghost" href="/admin">
          Librarian&apos;s office
        </Link>
      </div>
    </main>
  );
}
