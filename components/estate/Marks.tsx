import type { CSSProperties } from "react";

export type IconName =
  | "arrow"
  | "diagonal"
  | "back"
  | "map"
  | "pin"
  | "book"
  | "grid"
  | "compass"
  | "volume"
  | "mute"
  | "close"
  | "menu"
  | "cube"
  | "image"
  | "play"
  | "pause"
  | "search"
  | "chevron"
  | "film"
  | "file"
  | "eye";
const marks: Record<IconName, React.ReactNode> = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  diagonal: <path d="M6 18 18 6M7 6h11v11" />,
  back: <path d="M20 12H5m6-6-6 6 6 6" />,
  map: <path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2zm6-2v15m6-12v15" />,
  pin: (
    <>
      <path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="9" r="2.4" />
    </>
  ),
  book: (
    <>
      <path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx=".5" />
      <rect x="14" y="3" width="7" height="7" rx=".5" />
      <rect x="3" y="14" width="7" height="7" rx=".5" />
      <rect x="14" y="14" width="7" height="7" rx=".5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16.5 7.5-3 6-6 3 3-6Z" />
    </>
  ),
  volume: (
    <>
      <path d="M3 10h4l5-4v12l-5-4H3zM16 8a6 6 0 0 1 0 8m2-11a9 9 0 0 1 0 14" />
    </>
  ),
  mute: <path d="M3 10h4l5-4v12l-5-4H3zm13 0 5 5m0-5-5 5" />,
  close: <path d="m5 5 14 14m0-14L5 19" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  cube: <path d="m12 2 9 5v10l-9 5-9-5V7zm-9 5 9 5 9-5m-9 5v10" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="m4 17 6-6 4 4 2-2 4 4" />
      <circle cx="16.5" cy="8" r="1" />
    </>
  ),
  play: <path d="m7 4 13 8-13 8Z" />,
  pause: <path d="M8 4v16M16 4v16" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M7 4v16m10-16v16M3 9h4m10 0h4M3 15h4m10 0h4" />
    </>
  ),
  file: <path d="M5 3h10l4 4v14H5zm10 0v5h4M8 12h8m-8 4h6" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
};
export function Icon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {marks[name]}
    </svg>
  );
}
export function HouseMark() {
  return (
    <svg
      aria-hidden="true"
      width="58"
      height="43"
      viewBox="0 0 68 50"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
    >
      <path d="M3 43h62M5 40h58M8 38V20h52v18M5 19l7-10h44l7 10Zm6-10V4h4v5m38 0V4h4v6M7 21h54M9 37h12m26 0h12M25 35V25m3 10V25m12 10V25m3 10V25m-21-1 12-8 12 8Zm3-1 9-5 9 5M22 36h24m-26 3h28m-17-4v-9h6v9" />
      {[12, 20, 44, 52].map((x) => (
        <g key={x}>
          <path d={`M${x} 22h4v6h-4z M${x} 30h4v6h-4z m2-6v6m-2-3h4`} />
        </g>
      ))}
      <path d="M12 15h44M16 12h37m-31 5h7m10 0h7" opacity=".55" />
    </svg>
  );
}
