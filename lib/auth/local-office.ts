// Request policy shared by the optimistic proxy and the actual admin data layer.
// The office launcher binds to IPv4 loopback and passes its exact host:port.
type HeaderReader = Pick<Headers, "get" | "has">;

export function directLoopback(h: HeaderReader) {
  const host = h.get("host") ?? "";
  const address = h.get("x-forwarded-for");
  return /^127\.0\.0\.1:\d+$/.test(host) &&
    !h.has("forwarded") &&
    (!h.has("x-forwarded-host") || h.get("x-forwarded-host") === host) &&
    (address === null || ["127.0.0.1", "::ffff:127.0.0.1", "::1"].includes(address));
}

export function isLocalOffice(h: HeaderReader) {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL ||
      !directLoopback(h) || h.get("host") !== process.env.LIBRARY_OFFICE_HOST) return false;
  const origin = h.get("origin");
  const site = h.get("sec-fetch-site");
  return (origin === null || origin === "http://" + h.get("host")) &&
    (site === null || site === "same-origin" || site === "none");
}
