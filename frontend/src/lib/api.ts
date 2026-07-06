export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let inMemorySessionId: string | null = null;

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getSessionId(): string {
  if (!inMemorySessionId) {
    inMemorySessionId = generateSessionId();
  }
  return inMemorySessionId;
}

export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_APP_API_KEY || "";
}

export function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "X-Session-ID": getSessionId(),
    "X-API-Key": getApiKey(),
    ...extra,
  };
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}