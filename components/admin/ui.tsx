import type { ReactNode } from "react";

export const DISPLAY_STATES = ["hidden", "unlisted", "published", "featured"] as const;
export const ACTIVATION_STATES = ["inactive", "tracking", "paused"] as const;

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        <h1 className="font-serif text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Select({
  name,
  options,
  defaultValue,
  className = "input",
}: {
  name: string;
  options: readonly string[] | { value: string; label: string }[];
  defaultValue?: string | null;
  className?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue ?? undefined} className={className}>
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  );
}

const tone: Record<string, string> = {
  hidden: "border-line text-muted",
  unlisted: "border-line text-foreground",
  published: "border-ok/50 text-ok",
  featured: "border-accent text-accent",
  inactive: "border-line text-muted",
  tracking: "border-ok/50 text-ok",
  paused: "border-accent/60 text-accent",
  public: "border-ok/50 text-ok",
  private: "border-line text-muted",
  redacted: "border-danger/50 text-danger",
};

export function Badge({ children, value }: { children?: ReactNode; value?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
        tone[value ?? ""] ?? "border-line text-muted"
      }`}
    >
      {children ?? value}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{children}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="font-serif text-3xl">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function fmtBytes(n: bigint | number | null | undefined) {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (v < 1024) return `${v} B`;
  if (v < 1024 ** 2) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 ** 3) return `${(v / 1024 ** 2).toFixed(1)} MB`;
  return `${(v / 1024 ** 3).toFixed(2)} GB`;
}
