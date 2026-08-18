import { getAccessToken, refreshAccessToken } from "./auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const API_VERSION_PREFIX = "/api/v1";
const UNVERSIONED_PATHS = new Set(["/health", "/metrics", "/eval-report", "/eval-report/run"]);

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

export interface DocumentRecord {
  id: string;
  title: string;
  source_type: string;
  chunk_count: number;
  chunk_start_index: number;
  ingested_at: string;
  status: string;
  size_bytes: number;
  updated_at: string;
}

export type DocumentSortBy = "title" | "ingested_at" | "updated_at" | "chunk_count" | "size_bytes";
export type SortDir = "asc" | "desc";

export interface DocumentListParams {
  q?: string;
  source_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: DocumentSortBy;
  sort_dir?: SortDir;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface DocumentListResult {
  items: DocumentRecord[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface JobStatus {
  status: "pending" | "processing" | "complete" | "failed" | "cancelled" | string;
  stage?: "uploading" | "parsing" | "chunking" | "embedding" | "ready" | "error" | "cancelled" | string;
  result?: any;
  error?: string | null;
}

export interface UploadJobResponse {
  job_id: string;
}

export interface SummaryResult {
  tldr: string;
  key_concepts: string[];
  methodology: string;
  results: string;
  limitations: string;
}

export interface EvalReportResponse {
  content: string;
  generated_at: string;
}

export interface GenerateRequestBody {
  query: string;
  top_k: number;
  model?: string;
  verify?: boolean;
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

export interface AnalyticsSeriesPoint {
  date: string;
  count: number;
}

export interface AnalyticsRouteLatency {
  route: string;
  request_count: number;
  error_count: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
}

export interface AnalyticsSummary {
  documents: {
    total: number;
    over_time: AnalyticsSeriesPoint[];
  };
  generations: {
    total: number;
    average_confidence: number | null;
    over_time: AnalyticsSeriesPoint[];
  };
  verifications: {
    total: number;
    average_grounding_score: number | null;
    over_time: AnalyticsSeriesPoint[];
  };
  active_jobs: number;
  requests: {
    total_requests: number;
    average_latency_ms: number;
    by_route: AnalyticsRouteLatency[];
  };
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await apiFetch("/analytics/summary");
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const res = await apiFetch("/documents/");
  return res.json();
}

export async function fetchDocumentsList(params: DocumentListParams): Promise<DocumentListResult> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.source_type) search.set("source_type", params.source_type);
  if (params.status) search.set("status", params.status);
  if (params.date_from) search.set("date_from", params.date_from);
  if (params.date_to) search.set("date_to", params.date_to);
  if (params.sort_by) search.set("sort_by", params.sort_by);
  if (params.sort_dir) search.set("sort_dir", params.sort_dir);
  if (typeof params.limit === "number") search.set("limit", String(params.limit));
  if (typeof params.offset === "number") search.set("offset", String(params.offset));
  if (params.cursor) search.set("cursor", params.cursor);

  const qs = search.toString();
  const res = await apiFetch(`/documents/${qs ? `?${qs}` : ""}`);
  const items: DocumentRecord[] = await res.json();
  const totalHeader = res.headers.get("X-Total-Count");
  const hasMoreHeader = res.headers.get("X-Has-More");
  const nextCursor = res.headers.get("X-Next-Cursor");
  return {
    items,
    total: totalHeader !== null ? Number(totalHeader) : items.length,
    hasMore: hasMoreHeader === "true",
    nextCursor,
  };
}

export async function deleteDocument(documentId: string): Promise<{ status: string; document_id: string }> {
  const res = await apiFetch(`/documents/${documentId}`, { method: "DELETE" });
  return res.json();
}

export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  const res = await apiFetch(`/jobs/${jobId}`);
  return res.json();
}

export async function uploadFile(file: File): Promise<UploadJobResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch("/upload/", { method: "POST", headers: buildHeaders(), body: fd });
  return res.json();
}

function xhrUploadOnce(
  file: File,
  headers: Record<string, string>,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<{ status: number; body: any; requestId: string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl("/upload/"), true);
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      resolve({ status: xhr.status, body, requestId: xhr.getResponseHeader("X-Request-ID") });
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new ApiError(0, "cancelled", "Upload cancelled.", null, null));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort());
    }

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

export async function uploadFileWithProgress(
  file: File,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<UploadJobResponse> {
  const first = await xhrUploadOnce(file, buildHeaders(), onProgress, signal);

  if (first.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      onProgress(0);
      const retry = await xhrUploadOnce(file, buildHeaders(), onProgress, signal);
      if (retry.status < 200 || retry.status >= 300) {
        throw apiErrorFromBody(retry.status, retry.body, retry.requestId);
      }
      return retry.body;
    }
  }

  if (first.status < 200 || first.status >= 300) {
    throw apiErrorFromBody(first.status, first.body, first.requestId);
  }
  return first.body;
}

function apiErrorFromBody(status: number, body: any, requestId: string | null): ApiError {
  const errorInfo = body && body.error ? body.error : null;
  return new ApiError(
    status,
    errorInfo?.code || "unknown_error",
    errorInfo?.message || `Request failed with status ${status}`,
    errorInfo?.request_id || requestId,
    errorInfo?.details ?? null
  );
}

export async function cancelJob(jobId: string): Promise<JobStatus> {
  const res = await apiFetch(`/jobs/${jobId}`, { method: "DELETE" });
  return res.json();
}

export async function ingestUrl(url: string): Promise<UploadJobResponse> {
  const res = await apiFetch("/ingest/url", {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function ingestText(text: string, source: string): Promise<UploadJobResponse> {
  const res = await apiFetch("/ingest/text", {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text, source }),
  });
  return res.json();
}

export async function fetchSummary(text: string, source: string): Promise<{ summary: SummaryResult }> {
  const res = await apiFetch("/summary/", {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text, source }),
  });
  return res.json();
}

export async function fetchEvalReport(): Promise<EvalReportResponse> {
  const res = await apiFetch("/eval-report");
  return res.json();
}

export async function runEvalReport(): Promise<UploadJobResponse> {
  const res = await apiFetch("/eval-report/run", {
    method: "POST",
    headers: buildHeaders(),
  });
  return res.json();
}

export interface ResetResponse {
  status: string;
}

export async function resetDocuments(): Promise<ResetResponse> {
  const res = await apiFetch("/reset/", { method: "DELETE" });
  return res.json();
}

export interface VerificationClaim {
  claim: string;
  status: "grounded" | "partial" | "ungrounded";
  source: string | null;
  explanation: string;
}

export interface VerificationResponse {
  claim_analysis: VerificationClaim[];
}

export async function verifyClaims(answer: string, topK = 5): Promise<VerificationResponse> {
  const res = await apiFetch("/generate/", {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ query: answer, top_k: topK, verify: true }),
  });
  return res.json();
}

async function openGenerateStream(body: GenerateRequestBody, signal?: AbortSignal): Promise<Response> {
  return fetch(apiUrl("/generate/"), {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    signal,
  });
}

export async function streamGenerate(
  body: GenerateRequestBody,
  onEvent: (event: string, data: any) => void,
  signal?: AbortSignal
): Promise<void> {
  let res = await openGenerateStream(body, signal);

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await openGenerateStream(body, signal);
    }
  }

  if (!res.ok || !res.body) {
    throw new Error(`Server error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const parsed = parseSSEEvent(rawEvent);
      if (!parsed) continue;

      let data: any;
      try {
        data = JSON.parse(parsed.data);
      } catch {
        continue;
      }
      onEvent(parsed.event, data);
    }
  }
}

function parseSSEEvent(raw: string): { event: string; data: string } | null {
  const lines = raw.split("\n");
  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}