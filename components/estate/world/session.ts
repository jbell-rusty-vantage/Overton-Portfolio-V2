/** Browser visit state. Keep storage keys and event names stable across releases. */
export const ROUTE = "tw-route";
export function onRoute(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener(ROUTE, cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener(ROUTE, cb);
  };
}
export const getHash = () => location.hash;
export function onNarrow(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
export const isNarrow = () => innerWidth <= 700 || innerWidth / innerHeight < 0.8;
export function memory<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem("overton-estate:" + key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function remember(key: string, value: unknown) {
  try {
    localStorage.setItem("overton-estate:" + key, JSON.stringify(value));
  } catch {}
}
