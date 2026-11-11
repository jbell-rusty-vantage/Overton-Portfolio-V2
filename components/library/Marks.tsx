export type MarkName =
  | "book"
  | "arrow"
  | "external"
  | "compass"
  | "catalog"
  | "map"
  | "help"
  | "close"
  | "search"
  | "settings"
  | "github"
  | "back"
  | "chevron"
  | "pin"
  | "globe"
  | "monitor"
  | "menu"
  | "reset"
  | "ball";
const paths: Record<MarkName, React.ReactNode> = {
  book: (
    <>
      <path d="M3 4.5c3.5-.8 6.5.1 9 2.3 2.5-2.2 5.5-3.1 9-2.3v13c-3.5-.7-6.5.2-9 2.4-2.5-2.2-5.5-3.1-9-2.4z" />
      <path d="M12 7v12M6 8l3 1M15 9l3-1" />
    </>
  ),
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 8 3.8 2.8-1.5 4.4H9.7l-1.5-4.4zM12 8V3.5M15.8 10.8l4.3-1.4M14.3 15.2l2.6 3.7M9.7 15.2l-2.6 3.7M8.2 10.8 3.9 9.4" />
    </>
  ),
  external: <path d="M6 18 18 6M7 6h11v11" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16.5 7.5-3 6-6 3 3-6z" />
    </>
  ),
  catalog: (
    <>
      <path d="M3 4h4v16H3zM10 4h4v16h-4zM16 5l3-1 4 15-3 1z" />
    </>
  ),
  map: (
    <>
      <path d="m2 5 7-2 6 3 7-2v15l-7 2-6-3-7 2zM9 3v15M15 6v15" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2.5-3 5m0 2v.3" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="10" cy="10" r="6.5" />
      <path d="m15 15 5 5" />
    </>
  ),
  settings: (
    <>
      <path d="M3 6h6m4 0h8M3 12h11m4 0h3M3 18h3m4 0h11" />
      <circle cx="11" cy="6" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </>
  ),
  github: (
    <>
      <path d="M9 20c-4 .8-4-2-6-2m12 4v-3c0-1-.4-1.5-.8-1.8 3.3-.4 6.8-1.6 6.8-7A5.2 5.2 0 0 0 19.6 7c.2-.7.4-2-.2-3-1.6-.2-3 1-3.6 1.3a12.5 12.5 0 0 0-7.5 0C7.7 5 6.3 3.8 4.7 4c-.6 1-.4 2.3-.2 3a5.2 5.2 0 0 0-1.3 3.4c0 5.3 3.5 6.6 6.8 7-.5.3-.9 1-.9 1.9V22" />
    </>
  ),
  back: <path d="M20 12H5m6-6-6 6 6 6" />,
  chevron: <path d="m8 4 8 8-8 8" />,
  pin: (
    <>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="1" />
      <path d="M12 17v4m-4 0h8" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  reset: (
    <>
      <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
    </>
  ),
};
export function Mark({ name, size = 18 }: { name: MarkName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
