/** Stable public and authenticated paths; no data authorization belongs in this module. */
export const libraryPath = (admin = false) => admin ? "/admin/preview/library" : "/library";
export const portfolioPath = (admin = false) => admin ? "/admin/preview/portfolio" : "/";
export function isWorldFragment(hash: string) {
  return /^#(?:approach|walk|entry|library|portrait|desk|cabinet|reports|drawers|map|collection|landing|leaf-\d+)$/.test(hash)
    || /^#(?:book|report|object|screen)\/[a-z0-9-]+(?:\/[a-z0-9-]+){0,3}$/.test(hash);
}
