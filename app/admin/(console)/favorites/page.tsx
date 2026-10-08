import type { Metadata } from "next";
import Link from "next/link";
import { db, type Favorite } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, DISPLAY_STATES, Empty, Field, PageHeader, Select, fmtDate } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { createFavorite, deleteFavorite, setFavoriteDisplay, updateFavorite } from "./actions";
import { type AttrField, attrInputValue, attrLabel, parseAttributeSchema } from "./attributes";

export const metadata: Metadata = { title: "Favorites" };

const STATUSES = ["current", "past", "wishlist"] as const;
const RATINGS = [
  { value: "", label: "— unrated —" },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: "★".repeat(n) })),
];

const dateInput = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

function AttributeInputs({ fields, values }: { fields: AttrField[]; values: Record<string, unknown> }) {
  return fields.map((f) => {
    const name = `attr.${f.key}`;
    const v = attrInputValue(values[f.key]);
    const label = attrLabel(f.key);
    switch (f.type) {
      case "enum":
        return (
          <Field key={f.key} label={label}>
            <Select name={name} defaultValue={v} options={[{ value: "", label: "—" }, ...f.options.map((o) => ({ value: o, label: o }))]} />
          </Field>
        );
      case "number":
        return (
          <Field key={f.key} label={label}>
            <input name={name} type="number" step="any" defaultValue={v} className="input" />
          </Field>
        );
      case "date":
        return (
          <Field key={f.key} label={label}>
            <input name={name} type="date" defaultValue={v.slice(0, 10)} className="input" />
          </Field>
        );
      case "string[]":
        return (
          <Field key={f.key} label={label} hint="Comma-separated.">
            <input name={name} defaultValue={v} className="input" />
          </Field>
        );
      default:
        return (
          <Field key={f.key} label={label}>
            <input name={name} defaultValue={v} className="input" />
          </Field>
        );
    }
  });
}

function FavoriteFields({ fav, fields }: { fav?: Favorite; fields: AttrField[] }) {
  const attrs = (fav?.attributes && typeof fav.attributes === "object" && !Array.isArray(fav.attributes)
    ? fav.attributes
    : {}) as Record<string, unknown>;
  return (
    <>
      <Field label="Title"><input name="title" required defaultValue={fav?.title} className="input" /></Field>
      <Field label="Creator" hint="Author, brand, maker, vendor…"><input name="creator" defaultValue={fav?.creator ?? ""} className="input" /></Field>
      <Field label="Status"><Select name="status" options={STATUSES} defaultValue={fav?.status ?? "current"} /></Field>
      <Field label="URL"><input name="url" type="url" placeholder="https://…" defaultValue={fav?.url ?? ""} className="input" /></Field>
      <Field label="Affiliate URL"><input name="affiliateUrl" type="url" placeholder="https://…" defaultValue={fav?.affiliateUrl ?? ""} className="input" /></Field>
      <Field label="Rating"><Select name="rating" options={RATINGS} defaultValue={fav?.rating ? String(fav.rating) : ""} /></Field>
      <Field label="Started on"><input name="startedOn" type="date" defaultValue={dateInput(fav?.startedOn)} className="input" /></Field>
      <Field label="Ended on"><input name="endedOn" type="date" defaultValue={dateInput(fav?.endedOn)} className="input" /></Field>
      <Field label="Tags" hint="Comma-separated."><input name="tags" defaultValue={fav?.tags.join(", ") ?? ""} className="input" /></Field>
      <div className="md:col-span-3">
        <Field label="Summary"><textarea name="summary" rows={2} defaultValue={fav?.summary ?? ""} className="input" /></Field>
      </div>
      <Field label="Display"><Select name="display" options={DISPLAY_STATES} defaultValue={fav?.display ?? "hidden"} /></Field>
      <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={fav?.sortOrder ?? 0} className="input" /></Field>
      {fields.length ? (
        <div className="grid gap-4 border-t border-line pt-4 md:col-span-3 md:grid-cols-3">
          <p className="label md:col-span-3">Category details</p>
          <AttributeInputs fields={fields} values={attrs} />
        </div>
      ) : null}
    </>
  );
}

export default async function FavoritesPage({ searchParams }: PageProps<"/admin/favorites">) {
  await requireAdmin();
  const sp = await searchParams;
  const requested = Array.isArray(sp.category) ? sp.category[0] : sp.category;

  const [categories, counts] = await Promise.all([
    db.favoriteCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.favorite.groupBy({ by: ["categoryCode"], where: { deletedAt: null }, _count: { _all: true } }),
  ]);
  if (categories.length === 0) {
    return (
      <>
        <PageHeader title="Favorites" />
        <Empty>No favorite categories exist. Seed favorite_categories first.</Empty>
      </>
    );
  }
  const category = categories.find((c) => c.code === requested) ?? categories[0];
  const fields = parseAttributeSchema(category.attributeSchema);
  const countOf = (code: string) => counts.find((c) => c.categoryCode === code)?._count._all ?? 0;

  const favorites = await db.favorite.findMany({
    where: { categoryCode: category.code, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Favorites"
        description="Books, courses, tools, supplements, devices and labs for the Favorites Wing and Reading Room. Each category has its own detail fields."
      />

      <nav className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.code}
            href={`/admin/favorites?category=${c.code}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              c.code === category.code ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-foreground"
            }`}
          >
            {c.label} <span className="opacity-70">{countOf(c.code)}</span>
          </Link>
        ))}
      </nav>

      <details className="card mb-8" open={favorites.length === 0}>
        <summary className="cursor-pointer font-serif text-lg">Add to {category.label}</summary>
        {category.description ? <p className="mt-1 text-sm text-muted">{category.description}</p> : null}
        <form action={createFavorite} className="mt-5 grid gap-4 md:grid-cols-3">
          <input type="hidden" name="categoryCode" value={category.code} />
          <FavoriteFields fields={fields} />
          <div className="md:col-span-3"><SubmitButton>Add favorite</SubmitButton></div>
        </form>
      </details>

      {favorites.length === 0 ? (
        <Empty>Nothing in {category.label} yet.</Empty>
      ) : (
        <div className="space-y-3">
          {favorites.map((f) => {
            const attrs = (f.attributes && typeof f.attributes === "object" && !Array.isArray(f.attributes)
              ? f.attributes
              : {}) as Record<string, unknown>;
            const attrSummary = Object.entries(attrs)
              .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
              .map(([k, v]) => `${attrLabel(k)}: ${attrInputValue(v)}`);
            return (
              <div key={f.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-lg">{f.title}</h2>
                  {f.creator ? <span className="text-sm text-muted">— {f.creator}</span> : null}
                  <Badge value={f.display} />
                  <Badge>{f.status}</Badge>
                  {f.rating ? <span className="text-sm text-accent">{"★".repeat(f.rating)}</span> : null}
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
                      link
                    </a>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {f.startedOn || f.endedOn ? `${fmtDate(f.startedOn)} → ${f.endedOn ? fmtDate(f.endedOn) : "now"} · ` : ""}
                  {f.tags.length ? `#${f.tags.join(" #")} · ` : ""}
                  sort {f.sortOrder}
                </p>
                {attrSummary.length ? <p className="mt-1 text-xs text-muted">{attrSummary.join(" · ")}</p> : null}
                {f.summary ? <p className="mt-2 text-sm">{f.summary}</p> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={setFavoriteDisplay} className="flex gap-1">
                    <input type="hidden" name="id" value={f.id} />
                    <Select name="display" options={DISPLAY_STATES} defaultValue={f.display} className="input w-auto py-1 text-xs" />
                    <SubmitButton className="btn-ghost py-1 text-xs" pendingText="…">Set display</SubmitButton>
                  </form>
                  <form action={deleteFavorite}>
                    <input type="hidden" name="id" value={f.id} />
                    <SubmitButton className="btn-danger py-1 text-xs" confirm={`Remove ${f.title}?`}>Remove</SubmitButton>
                  </form>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-muted">Edit</summary>
                  <form action={updateFavorite} className="mt-4 grid gap-4 md:grid-cols-3">
                    <input type="hidden" name="id" value={f.id} />
                    <FavoriteFields fav={f} fields={fields} />
                    <div className="md:col-span-3"><SubmitButton>Save</SubmitButton></div>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
