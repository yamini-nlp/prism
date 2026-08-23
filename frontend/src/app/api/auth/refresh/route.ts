import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/cookies";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "no refresh token" }, { status: 401 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(55000),
    });
  } catch {
    return NextResponse.json({ error: "backend unreachable" }, { status: 503 });
  }

  if (backendResponse.status === 401) {
    const response = NextResponse.json({ error: "refresh failed" }, { status: 401 });
    response.cookies.set(REFRESH_COOKIE_NAME, "", refreshCookieOptions(request, 0));
    return response;
  }

  if (!backendResponse.ok) {
    return NextResponse.json({ error: "backend error" }, { status: 503 });
  }

  const data = await backendResponse.json();
  const response = NextResponse.json({ access_token: data.access_token, user: data.user ?? null });
  response.cookies.set(
    REFRESH_COOKIE_NAME,
    data.refresh_token,
    refreshCookieOptions(request, 60 * 60 * 24 * 30)
  );
  return response;
}