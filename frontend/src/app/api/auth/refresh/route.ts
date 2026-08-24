import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/cookies";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const RETRY_DELAYS_MS = [3000, 6000, 10000, 15000];

async function fetchBackendRefresh(refreshToken: string, attemptTimeoutMs: number): Promise<Response | null> {
  try {
    return await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(attemptTimeoutMs),
    });
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "no refresh token" }, { status: 401 });
  }

  let backendResponse: Response | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    backendResponse = await fetchBackendRefresh(refreshToken, 12000);

    if (backendResponse !== null) {
      if (backendResponse.status === 401 || backendResponse.ok) {
        break;
      }
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }

  if (backendResponse === null) {
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
