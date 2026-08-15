import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/cookies";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const refreshToken = body?.refresh_token;

  if (!refreshToken || typeof refreshToken !== "string") {
    return NextResponse.json({ error: "refresh_token is required" }, { status: 400 });
  }

  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(
    REFRESH_COOKIE_NAME,
    refreshToken,
    refreshCookieOptions(request, 60 * 60 * 24 * 30)
  );
  return response;
}