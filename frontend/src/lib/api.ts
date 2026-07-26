import { getAccessToken, refreshAccessToken } from "./auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const API_VERSION_PREFIX = "/api/v1";
const UNVERSIONED_PATHS = new Set(["/health", "/metrics", "/eval-report"]);

export class ApiError extends Error {
  status: number;
  code: string;
  requestId: string | null;
  details: unknown;

  constructor(status: number, code: string, message: string, requestId: string | null, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

export function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function versionedPath(path: string): string {
  if (UNVERSIONED_PATHS.has(path)) {
    return path;
  }
  return `${API_VERSION_PREFIX}${path}`;
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${versionedPath(path)}`;
}

interface ErrorEnvelopeBody {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
    details?: unknown;
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  let code = "unknown_error";
  let message = `Request failed with status ${response.status}`;
  let requestId: string | null = response.headers.get("X-Request-ID");
  let details: unknown = null;

  try {
    const data = (await response.clone().json()) as ErrorEnvelopeBody;
    if (data && data.error) {
      code = data.error.code || code;
      message = data.error.message || message;
      requestId = data.error.request_id || requestId;
      details = data.error.details ?? null;
    }
  } catch {}

  return new ApiError(response.status, code, message, requestId, details);
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const extraHeaders = (options.headers as Record<string, string> | undefined) || {};

  const firstAttemptHeaders = { ...buildHeaders(), ...extraHeaders };
  const response = await fetch(apiUrl(path), { ...options, headers: firstAttemptHeaders });

  if (response.status !== 401) {
    if (!response.ok) {
      throw await toApiError(response);
    }
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    if (!response.ok) {
      throw await toApiError(response);
    }
    return response;
  }

  const retryHeaders = { ...buildHeaders(), ...extraHeaders };
  const retryResponse = await fetch(apiUrl(path), { ...options, headers: retryHeaders });
  if (!retryResponse.ok) {
    throw await toApiError(retryResponse);
  }
  return retryResponse;
}