import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { isLocalOffice } from "@/lib/auth/local-office";

// Optimistic check only (cookie presence). Real verification happens in the
// Data Access Layer (lib/auth/session.ts → requireAdmin) on every page/action.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/samples" || pathname === "/dev" || pathname.startsWith("/dev/")) {
    if (process.env.NODE_ENV === "production")
      return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "private, no-store" } });
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (isLocalOffice(request.headers)) return NextResponse.next();
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dev/:path*", "/samples"],
};
