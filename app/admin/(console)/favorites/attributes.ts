import "server-only";
import { str } from "@/lib/admin/form";

// favorite_categories.attribute_schema is a flat object of key -> type string:
// "string" | "number" | "date" | "string[]" | "a|b|c" (enum). Inputs are named
// `attr.<key>` and assembled back into favorites.attributes.

export type AttrField =
  | { key: string; type: "string" | "number" | "date" | "string[]" }
  | { key: string; type: "enum"; options: string[] };

export function parseAttributeSchema(schema: unknown): AttrField[] {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return [];
  return Object.entries(schema as Record<string, unknown>).map(([key, raw]): AttrField => {
    const t = typeof raw === "string" ? raw.trim() : "string";
    if (t.includes("|")) return { key, type: "enum", options: t.split("|").map((o) => o.trim()).filter(Boolean) };
    if (t === "number" || t === "date" || t === "string[]") return { key, type: t };
    return { key, type: "string" };
  });
}

export const attrLabel = (key: string) => key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Current value of an attribute rendered as an input default. */
export function attrInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/**
 * Build the attributes object from `attr.<key>` inputs. Keys outside the schema
 * that were already stored are preserved; empty inputs remove the key.
 */
export function readAttributes(fd: FormData, fields: AttrField[], existing: unknown = {}): Record<string, unknown> {
  const out: Record<string, unknown> =
    existing && typeof existing === "object" && !Array.isArray(existing) ? { ...(existing as Record<string, unknown>) } : {};
  for (const f of fields) {
    const v = str(fd, `attr.${f.key}`);
    delete out[f.key];
    if (v === null) continue;
    switch (f.type) {
      case "number": {
        const n = Number(v);
        if (!Number.isFinite(n)) throw new Error(`${attrLabel(f.key)} must be a number`);
        out[f.key] = n;
        break;
      }
      case "string[]":
        out[f.key] = v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "enum":
        if (!f.options.includes(v)) throw new Error(`${attrLabel(f.key)} must be one of ${f.options.join(", ")}`);
        out[f.key] = v;
        break;
      default:
        out[f.key] = v;
    }
  }
  return out;
}
