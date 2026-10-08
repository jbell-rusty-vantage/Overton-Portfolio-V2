import "server-only";

// Tiny FormData helpers for Server Actions. Empty strings become null.
export const str = (fd: FormData, key: string): string | null => {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
};

export const reqStr = (fd: FormData, key: string): string => {
  const v = str(fd, key);
  if (!v) throw new Error(`Missing field: ${key}`);
  return v;
};

export const int = (fd: FormData, key: string): number | null => {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

export const bool = (fd: FormData, key: string): boolean => {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
};

export const date = (fd: FormData, key: string): Date | null => {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const list = (fd: FormData, key: string): string[] =>
  (str(fd, key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function oneOf<T extends string>(fd: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const v = str(fd, key);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
