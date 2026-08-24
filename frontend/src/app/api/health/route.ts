import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const backendResponse = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!backendResponse.ok) {
      return NextResponse.json({ status: "offline" }, { status: 503 });
    }
    return NextResponse.json({ status: "online" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "offline" }, { status: 503 });
  }
}