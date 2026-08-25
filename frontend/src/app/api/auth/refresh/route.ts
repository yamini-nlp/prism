import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/cookies";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOTAL_BUDGET_MS = 82000;
const HEALTH_ATTEMPT_TIMEOUT_MS = 5000;
const HEALTH_POLL_DELAY_MS = 3000;
const REFRESH_ATTEMPT_TIMEOUT_MS = 15000;
const REFRESH_RETRY_DELAY_MS = 2000;
const SAFETY_MARGIN_MS = 3000;

function msLeft(deadline: number): number {
  return deadline - Date.now();
}

async function pingHealth(timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function warmUpBackend(deadline: number): Promise<boolean> {
  while (msLeft(deadline) > SAFETY_MARGIN_MS) {
    const timeout = Math.max(1000, Math.min(HEALTH_ATTEMPT_TIMEOUT_MS, msLeft(deadline) - SAFETY_MARGIN_MS));
    if (await pingHealth(timeout)) {
      return true;
    }
    const delay = Math.min(HEALTH_POLL_DELAY_MS, Math.max(0, msLeft(deadline) - SAFETY_MARGIN_MS));
    if (delay <= 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return false;
}

async function fetchBackendRefresh(refreshToken: string, timeoutMs: number): Promise<Response | null> {
  try {
    return await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
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

  const deadline = Date.now() + TOTAL_BUDGET_MS;

  await warmUpBackend(deadline);

  let backendResponse: Response | null = null;

  while (backendResponse === null && msLeft(deadline) > SAFETY_MARGIN_MS) {
    const timeout = Math.max(2000, Math.min(REFRESH_ATTEMPT_TIMEOUT_MS, msLeft(deadline) - SAFETY_MARGIN_MS));
    backendResponse = await fetchBackendRefresh(refreshToken, timeout);
    if (backendResponse !== null) {
      break;
    }
    const delay = Math.min(REFRESH_RETRY_DELAY_MS, Math.max(0, msLeft(deadline) - SAFETY_MARGIN_MS));
    if (delay <= 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
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
