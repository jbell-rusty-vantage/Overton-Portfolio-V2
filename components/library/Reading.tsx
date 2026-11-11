import Link from "next/link";
import Image from "next/image";
import { Mark } from "./Marks";
import {
  type Volume,
  type Leaf,
  type ReadingScope,
  type Collection,
  detailHref,
  sceneHref,
  zoneFor,
  withinPreview,
} from "@/lib/library/model";

export function Cover({ volume }: { volume: Volume }) {
  return (
    <div className={"binding plate-" + volume.plate} aria-hidden="true">
      <Image
        src={volume.cover ?? "/library/plate-" + volume.plate + ".webp"}
        alt=""
        fill
        sizes="140px"
        unoptimized={!!volume.cover}
      />
      {!volume.cover && <span className="binding-title">{volume.title}</span>}
    </div>
  );
}
export function SourceNote({ source }: { source: Collection["source"] }) {
  if (source !== "fixtures" && source !== "review") return null;
  return (
    <span className="source-note">
      {source === "fixtures"
        ? "Sample collection · Demonstration content"
        : "Local draft preview"}
    </span>
  );
}
export function VolumeCard({
  v,
  admin = false,
  catalog = false,
  shelfTitle,
}: {
  v: Volume;
  admin?: ReadingScope;
  catalog?: boolean;
  shelfTitle?: string;
}) {
  const Heading = catalog ? "h2" : "h3";
  return (
    <a className="volume-card" href={withinPreview(detailHref(v), admin)}>
      <div className={"card-art art-" + v.plate}>
        <Cover volume={v} />
      </div>
      <div className="card-text">
        <span className="eyebrow">{shelfTitle ?? v.kind}</span>
        <Heading>{v.title}</Heading>
        <p>{v.summary}</p>
        <span className="card-action">
          Read volume <Mark name="arrow" size={15} />
        </span>
      </div>
    </a>
  );
}
export function LeafBody({
  page,
  admin = false,
}: {
  page: Leaf;
  admin?: ReadingScope;
}) {
  return (
    <div className="leaf-body">
      {page.blocks.map((b, i) => {
        if (b.kind === "heading") return <h3 key={i}>{b.text}</h3>;
        if (b.kind === "metric")
          return (
            <div key={i} className="leaf-metric">
              <strong>{b.text}</strong>
              <span>{b.label}</span>
            </div>
          );
        if (b.kind === "code")
          return (
            <pre key={i}>
              <code>{b.text}</code>
            </pre>
          );
        if (b.kind === "link" && b.url?.startsWith("/projects/"))
          return (
            <Link
              key={i}
              className="text-link"
              href={withinPreview(b.url, admin)}
            >
              {b.text} <Mark name="arrow" size={14} />
            </Link>
          );
        if (b.kind === "link")
          return (
            <a
              key={i}
              className="text-link"
              href={b.url}
              target="_blank"
              rel="noreferrer"
            >
              {b.text} <Mark name="external" size={14} />
            </a>
          );
        if (b.kind === "image" && b.url)
          return (
            <figure key={i}>
              <Image
                src={b.url}
                unoptimized
                width={720}
                height={480}
                alt={b.text}
              />
              <figcaption>{b.text}</figcaption>
            </figure>
          );
        if (b.kind === "video" && b.url)
          return (
            <figure key={i} className="leaf-video">
              <video
                src={b.url}
                poster={b.poster}
                controls
                muted
                playsInline
                preload={b.poster ? "none" : "metadata"}
                aria-label={b.text}
              />
              <figcaption>{b.text}</figcaption>
            </figure>
          );
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}
export function FullReader({
  v,
  source,
  admin = false,
}: {
  v: Volume;
  source: Collection["source"];
  admin?: ReadingScope;
}) {
  return (
    <main className="library full-reader">
      <div className="reader-top">
        <Link prefetch={false} href={withinPreview("/projects", admin)}>
          <Mark name="back" /> Catalog
        </Link>
        <SourceNote source={source} />
      </div>
      <article>
        <aside>
          <Cover volume={v} />
          <a
            href={withinPreview(
              sceneHref(zoneFor(v), v.shelf, v.slug, v.kind),
              admin,
            )}
            className="folio-button"
          >
            <Mark name="compass" />
            Open in library
          </a>
        </aside>
        <div>
          <span className="eyebrow">{v.kind} · Library collection</span>
          <h1>{v.title}</h1>
          {v.clientLabel && <p>Client · {v.clientLabel}</p>}
          <div className="tags">
            {v.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          {v.pages.map((p, i) => (
            <section key={i}>
              <h2>{p.title}</h2>
              <LeafBody page={p} admin={admin} />
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
