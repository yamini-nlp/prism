import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/cookies";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WARMUP_BUDGET_MS = 35000;
const WARMUP_ATTEMPT_TIMEOUT_MS = 4000;
const WARMUP_POLL_DELAY_MS = 2500;
const REFRESH_ATTEMPT_TIMEOUT_MS = 20000;
const REFRESH_RETRY_DELAY_MS = 5000;

async function pingHealth(timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function warmUpBackend(): Promise<void> {
  const deadline = Date.now() + WARMUP_BUDGET_MS;
  if (await pingHealth(WARMUP_ATTEMPT_TIMEOUT_MS)) {
    return;
  }
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, WARMUP_POLL_DELAY_MS));
    if (await pingHealth(WARMUP_ATTEMPT_TIMEOUT_MS)) {
      return;
    }
  }
}

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

  await warmUpBackend();

  let backendResponse = await fetchBackendRefresh(refreshToken, REFRESH_ATTEMPT_TIMEOUT_MS);

  if (backendResponse === null) {
    await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
    backendResponse = await fetchBackendRefresh(refreshToken, REFRESH_ATTEMPT_TIMEOUT_MS);
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
