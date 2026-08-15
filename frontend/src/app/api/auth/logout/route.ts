import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/cookies";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
    }
  }

  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(REFRESH_COOKIE_NAME, "", refreshCookieOptions(request, 0));
  return response;
}