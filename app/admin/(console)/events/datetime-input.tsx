"use client";

// <input type="datetime-local"> has no time zone, so the browser fills it in
// local time and sends its UTC offset alongside (`<name>.tz`, minutes as
// returned by getTimezoneOffset). The server converts back with
// localDateTime() in ./lib.ts. Values are written to `defaultValue` from a ref
// so React's post-action form reset keeps them and SSR/hydration never differ.

const pad = (n: number) => String(n).padStart(2, "0");

function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimeInput({
  name,
  iso,
  defaultNow = false,
  required = false,
  className = "input",
}: {
  name: string;
  /** Initial value as an ISO string (rendered in the viewer's local time). */
  iso?: string | null;
  /** Prefill with the current local time when no `iso` is given. */
  defaultNow?: boolean;
  required?: boolean;
  className?: string;
}) {
  return (
    <>
      <input
        type="datetime-local"
        name={name}
        required={required}
        className={className}
        ref={(el) => {
          if (!el) return;
          const v = iso ? new Date(iso) : defaultNow ? new Date() : null;
          if (v && !Number.isNaN(v.getTime())) el.defaultValue = toLocalInput(v);
        }}
      />
      <input
        type="hidden"
        name={`${name}.tz`}
        ref={(el) => {
          if (el) el.defaultValue = String(new Date().getTimezoneOffset());
        }}
      />
    </>
  );
}
