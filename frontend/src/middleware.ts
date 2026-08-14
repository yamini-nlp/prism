import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/ingest",
  "/library",
  "/workspace",
  "/source-trace",
  "/verification",
  "/evaluation",
  "/settings",
];

function isPrefetchRequest(request: NextRequest): boolean {
  return (
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    (request.headers.get("sec-purpose") || "").includes("prefetch")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("prism_refresh_token");

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