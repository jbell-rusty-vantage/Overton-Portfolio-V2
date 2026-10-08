"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fmtBytes } from "@/components/admin/ui";

type Result =
  | { ok: true; status: "created" | "updated" | "unchanged"; postId: string; slug: string; messages: string[]; warnings: string[] }
  | { ok: false; error: string };

const LIMIT = 4.5 * 1024 * 1024;

export function PostUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [size, setSize] = useState(0);

  function measure() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    let total = 0;
    for (const v of fd.values()) total += typeof v === "string" ? new Blob([v]).size : v.size;
    setSize(total);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/posts", { method: "POST", body: new FormData(form) });
      const json = (await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}${res.status === 413 ? " — upload too large" : ""}` }))) as Result;
      setResult(json);
      if (json.ok) {
        form.reset();
        setSize(0);
        router.refresh();
      }
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} onChange={measure} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="label">MDX file</span>
          <input name="file" type="file" accept=".mdx,.md,.markdown,text/markdown" className="input" />
          <span className="mt-1 block text-xs text-muted">Or paste the MDX below. A chosen file wins over pasted text.</span>
        </label>
        <label className="block">
          <span className="label">Images referenced in the MDX</span>
          <input name="images" type="file" accept="image/*" multiple className="input" />
          <span className="mt-1 block text-xs text-muted">
            Files whose names match local paths like <code>./diagram.png</code> are uploaded to Blob and the paths rewritten.
          </span>
        </label>
      </div>
      <label className="block">
        <span className="label">Paste MDX</span>
        <textarea name="mdx" rows={10} className="input font-mono text-xs" placeholder={"---\ntitle: My post\ndisplay: hidden\n---\n\n# My post\n…"} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" disabled={pending || size > LIMIT}>
          {pending ? "Ingesting…" : "Upload post"}
        </button>
        <span className={`text-xs ${size > LIMIT ? "text-danger" : "text-muted"}`}>
          {fmtBytes(size)} of 4.5 MB — Vercel caps a single request at 4.5 MB (MDX + images). For bigger images, upload them in Media
          and reference their URLs instead.
        </span>
      </div>
      {result ? (
        result.ok ? (
          <div className="rounded-lg border border-ok/50 p-3 text-sm">
            {result.messages.map((m) => (
              <p key={m}>{m}</p>
            ))}
            {result.warnings.map((w) => (
              <p key={w} className="text-danger">Warning: {w}</p>
            ))}
            <Link href={`/admin/posts/${result.postId}`} className="mt-1 inline-block text-accent underline">
              Open post
            </Link>
          </div>
        ) : (
          <p className="rounded-lg border border-danger/50 p-3 text-sm text-danger">{result.error}</p>
        )
      ) : null}
    </form>
  );
}
