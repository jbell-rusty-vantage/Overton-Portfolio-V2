"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPresigned } from "@vercel/blob/client";
import {
  MEDIA_PURPOSES,
  MULTIPART_THRESHOLD,
  inferMediaKind,
  mediaPathname,
  titleFromFilename,
  type MediaPurpose,
} from "@/lib/media";
import { fmtBytes } from "@/components/admin/ui";
import { registerUploadedMedia } from "./actions";

type Item = {
  id: string;
  file: File;
  title: string;
  purpose: MediaPurpose;
  alt: string;
  progress: number;
  status: "queued" | "uploading" | "registering" | "done" | "error";
  error?: string;
  url?: string;
};

function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img.naturalWidth && img.naturalHeight ? { width: img.naturalWidth, height: img.naturalHeight } : null);
      URL.revokeObjectURL(src);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(src);
    };
    img.src = src;
  });
}

let counter = 0;

export function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [defaultPurpose, setDefaultPurpose] = useState<MediaPurpose>("general");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const patch = (id: string, p: Partial<Item>) => setItems((cur) => cur.map((it) => (it.id === id ? { ...it, ...p } : it)));

  function addFiles(files: FileList | File[]) {
    const next = Array.from(files).map<Item>((file) => ({
      id: `f${++counter}`,
      file,
      title: titleFromFilename(file.name),
      purpose: defaultPurpose,
      alt: "",
      progress: 0,
      status: "queued",
    }));
    setItems((cur) => [...cur, ...next]);
  }

  async function uploadOne(it: Item) {
    const { file } = it;
    patch(it.id, { status: "uploading", progress: 0, error: undefined });
    try {
      const kind = inferMediaKind(file.type, file.name);
      const dims = kind === "image" ? await readImageSize(file) : null;
      const blob = await uploadPresigned(mediaPathname(it.purpose, file.name), file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob",
        contentType: file.type || undefined,
        multipart: file.size > MULTIPART_THRESHOLD,
        onUploadProgress: ({ percentage }) => patch(it.id, { progress: Math.round(percentage) }),
      });
      patch(it.id, { status: "registering", progress: 100 });
      await registerUploadedMedia({
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || file.type || null,
        size: file.size,
        title: it.title.trim() || file.name,
        kind,
        purpose: it.purpose,
        alt: it.alt.trim() || null,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
      });
      patch(it.id, { status: "done", url: blob.url });
    } catch (e) {
      patch(it.id, { status: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }

  async function uploadAll() {
    setBusy(true);
    // Sequential keeps progress readable and avoids saturating the uplink.
    for (const it of items) {
      if (it.status === "queued" || it.status === "error") await uploadOne(it);
    }
    setBusy(false);
    router.refresh();
  }

  const pending = items.filter((i) => i.status === "queued" || i.status === "error").length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center text-sm transition-colors ${
          dragging ? "border-accent bg-accent/5" : "border-line text-muted hover:border-accent"
        }`}
      >
        <p className="font-medium text-foreground">Drop files here or click to choose</p>
        <p className="mt-1 text-xs">
          Images, video, audio, GLB/GLTF models, PDFs… uploaded straight from your browser to Vercel Blob (up to 1 GB each; files over
          50 MB use multipart).
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="label">Default purpose for new files</span>
          <select className="input" value={defaultPurpose} onChange={(e) => setDefaultPurpose(e.target.value as MediaPurpose)}>
            {MEDIA_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" disabled={busy || pending === 0} onClick={uploadAll}>
          {busy ? "Uploading…" : pending ? `Upload ${pending} file${pending === 1 ? "" : "s"}` : "Upload"}
        </button>
        {items.some((i) => i.status === "done") ? (
          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={() => setItems((cur) => cur.filter((i) => i.status !== "done"))}
          >
            Clear finished
          </button>
        ) : null}
      </div>

      {items.length ? (
        <ul className="space-y-3">
          {items.map((it) => {
            const locked = it.status === "uploading" || it.status === "registering" || it.status === "done";
            return (
              <li key={it.id} className="rounded-lg border border-line p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span className="font-mono">
                    {it.file.name} · {fmtBytes(it.file.size)} · {inferMediaKind(it.file.type, it.file.name)}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className={it.status === "error" ? "text-danger" : it.status === "done" ? "text-ok" : ""}>{it.status}</span>
                    {!locked ? (
                      <button
                        type="button"
                        className="underline hover:text-foreground"
                        onClick={() => setItems((cur) => cur.filter((x) => x.id !== it.id))}
                      >
                        remove
                      </button>
                    ) : null}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    className="input"
                    placeholder="Title"
                    value={it.title}
                    disabled={locked}
                    onChange={(e) => patch(it.id, { title: e.target.value })}
                  />
                  <select
                    className="input"
                    value={it.purpose}
                    disabled={locked}
                    onChange={(e) => patch(it.id, { purpose: e.target.value as MediaPurpose })}
                  >
                    {MEDIA_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    placeholder="Alt text"
                    value={it.alt}
                    disabled={locked}
                    onChange={(e) => patch(it.id, { alt: e.target.value })}
                  />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full transition-all ${it.status === "error" ? "bg-danger" : it.status === "done" ? "bg-ok" : "bg-accent"}`}
                    style={{ width: `${it.status === "error" ? 100 : it.progress}%` }}
                  />
                </div>
                {it.error ? <p className="mt-1 text-xs text-danger">{it.error}</p> : null}
                {it.url ? (
                  <a href={it.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-accent underline">
                    {it.url}
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
