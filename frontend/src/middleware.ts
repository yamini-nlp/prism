import { NextRequest, NextResponse } from "next/server";
import { isProtectedPath } from "@/lib/routes";
import { REFRESH_COOKIE_NAME } from "@/lib/cookies";

function isPrefetchRequest(request: NextRequest): boolean {
  return (
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    (request.headers.get("sec-purpose") || "").includes("prefetch")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME);

  if (isProtectedPath(pathname)) {
    if (!refreshToken) {
      if (isPrefetchRequest(request)) {
        return new NextResponse(null, { status: 204 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ingest/:path*",
    "/library/:path*",
    "/workspace/:path*",
    "/source-trace/:path*",
    "/verification/:path*",
    "/evaluation/:path*",
    "/settings/:path*",
  ],
};
