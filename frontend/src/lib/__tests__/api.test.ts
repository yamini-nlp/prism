import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  getLastRefreshFailureReason: vi.fn(() => null),
}));

import { getAccessToken, refreshAccessToken, getLastRefreshFailureReason } from "@/lib/auth";
import {
  apiUrl,
  buildHeaders,
  apiFetch,
  ApiError,
  fetchAnalyticsSummary,
  fetchDocuments,
  fetchDocumentsList,
  deleteDocument,
  fetchJobStatus,
  uploadFile,
  uploadFileWithProgress,
  cancelJob,
  ingestUrl,
  ingestText,
  fetchSummary,
  fetchEvalReport,
  runEvalReport,
  resetDocuments,
  verifyClaims,
  streamGenerate,
} from "@/lib/api";

const mockedGetAccessToken = vi.mocked(getAccessToken);
const mockedRefreshAccessToken = vi.mocked(refreshAccessToken);
vi.mocked(getLastRefreshFailureReason).mockReturnValue(null);

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function errorResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

class MockXHR {
  static instances: MockXHR[] = [];
  method = "";
  url = "";
  status = 0;
  responseText = "";
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  private headers: Record<string, string> = {};
  private responseHeaders: Record<string, string> = {};
  private aborted = false;

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  setResponseHeader(key: string, value: string) {
    this.responseHeaders[key] = value;
  }

  getResponseHeader(key: string) {
    return this.responseHeaders[key] ?? null;
  }

  send() {
    MockXHR.instances.push(this);
  }

  abort() {
    this.aborted = true;
    if (this.onabort) this.onabort();
  }
}

beforeEach(() => {
  MockXHR.instances = [];
  vi.stubGlobal("XMLHttpRequest", MockXHR as unknown as typeof XMLHttpRequest);
  mockedGetAccessToken.mockReturnValue(null);
  mockedRefreshAccessToken.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("apiUrl", () => {
  it("prefixes versioned paths with the api version segment", () => {
    expect(apiUrl("/documents/")).toBe("http://localhost:8000/api/v1/documents/");
  });

  it("does not version unversioned paths", () => {
    expect(apiUrl("/health")).toBe("http://localhost:8000/health");
    expect(apiUrl("/metrics")).toBe("http://localhost:8000/metrics");
    expect(apiUrl("/eval-report")).toBe("http://localhost:8000/eval-report");
    expect(apiUrl("/eval-report/run")).toBe("http://localhost:8000/eval-report/run");
  });
});

describe("buildHeaders", () => {
  it("omits Authorization when there is no access token", () => {
    mockedGetAccessToken.mockReturnValue(null);
    expect(buildHeaders()).toEqual({});
  });

  it("adds a Bearer Authorization header when a token is present", () => {
    mockedGetAccessToken.mockReturnValue("token-123");
    expect(buildHeaders({ "X-Extra": "1" })).toEqual({
      "X-Extra": "1",
      Authorization: "Bearer token-123",
    });
  });
});

describe("apiFetch", () => {
  it("returns the response on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiFetch("/documents/");
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/documents/", expect.any(Object));
  });

  it("throws an ApiError built from the error envelope on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      errorResponse(404, { error: { code: "not_found", message: "Missing", request_id: "req-1", details: { id: "x" } } })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/documents/x")).rejects.toMatchObject({
      status: 404,
      code: "not_found",
      message: "Missing",
      requestId: "req-1",
    });
  });

  it("retries once after a successful token refresh on 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, { error: { code: "unauthorized", message: "Expired" } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    mockedRefreshAccessToken.mockResolvedValue("new-token");

    const res = await apiFetch("/documents/");
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockedRefreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("throws the original 401 error when refresh fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(401, { error: { code: "unauthorized", message: "Expired" } }));
    vi.stubGlobal("fetch", fetchMock);
    mockedRefreshAccessToken.mockResolvedValue(null);

    await expect(apiFetch("/documents/")).rejects.toMatchObject({ status: 401, code: "unauthorized" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the retried request after refresh still fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, { error: { code: "unauthorized", message: "Expired" } }))
      .mockResolvedValueOnce(errorResponse(500, { error: { code: "server_error", message: "Boom" } }));
    vi.stubGlobal("fetch", fetchMock);
    mockedRefreshAccessToken.mockResolvedValue("new-token");

    await expect(apiFetch("/documents/")).rejects.toMatchObject({ status: 500, code: "server_error" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("fetchAnalyticsSummary", () => {
  it("returns parsed analytics data", async () => {
    const summary = { documents: { total: 1, over_time: [] } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(summary)));
    await expect(fetchAnalyticsSummary()).resolves.toEqual(summary);
  });

  it("propagates an ApiError on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(500, { error: { code: "server_error", message: "Boom" } })));
    await expect(fetchAnalyticsSummary()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchDocuments", () => {
  it("returns the document list", async () => {
    const docs = [{ id: "1", title: "Paper" }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(docs)));
    await expect(fetchDocuments()).resolves.toEqual(docs);
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(403, { error: { code: "forbidden", message: "No" } })));
    await expect(fetchDocuments()).rejects.toMatchObject({ status: 403 });
  });
});

describe("fetchDocumentsList", () => {
  it("builds a query string and reads pagination headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ id: "1" }], {
        headers: {
          "Content-Type": "application/json",
          "X-Total-Count": "5",
          "X-Has-More": "true",
          "X-Next-Cursor": "cursor-2",
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDocumentsList({ q: "attention", limit: 1, offset: 0, sort_by: "title", sort_dir: "asc" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/documents/?q=attention&sort_by=title&sort_dir=asc&limit=1&offset=0"),
      expect.any(Object)
    );
    expect(result).toEqual({ items: [{ id: "1" }], total: 5, hasMore: true, nextCursor: "cursor-2" });
  });

  it("falls back to item length and no cursor when headers are absent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([{ id: "1" }, { id: "2" }])));
    const result = await fetchDocumentsList({});
    expect(result).toEqual({ items: [{ id: "1" }, { id: "2" }], total: 2, hasMore: false, nextCursor: null });
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(500, { error: { code: "server_error", message: "Boom" } })));
    await expect(fetchDocumentsList({})).rejects.toBeInstanceOf(ApiError);
  });
});

describe("deleteDocument", () => {
  it("returns the deletion status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: "deleted", document_id: "1" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(deleteDocument("1")).resolves.toEqual({ status: "deleted", document_id: "1" });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/documents/1", expect.objectContaining({ method: "DELETE" }));
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(404, { error: { code: "not_found", message: "Missing" } })));
    await expect(deleteDocument("1")).rejects.toMatchObject({ status: 404 });
  });
});

describe("fetchJobStatus", () => {
  it("returns job status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ status: "processing", stage: "parsing" })));
    await expect(fetchJobStatus("job-1")).resolves.toEqual({ status: "processing", stage: "parsing" });
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(404, { error: { code: "not_found", message: "Missing" } })));
    await expect(fetchJobStatus("job-1")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("uploadFile", () => {
  it("posts form data and returns the job response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ job_id: "job-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["hello"], "paper.pdf", { type: "application/pdf" });
    await expect(uploadFile(file)).resolves.toEqual({ job_id: "job-1" });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/upload/", expect.objectContaining({ method: "POST" }));
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(400, { error: { code: "bad_request", message: "Invalid file" } })));
    const file = new File(["hello"], "paper.pdf", { type: "application/pdf" });
    await expect(uploadFile(file)).rejects.toMatchObject({ status: 400 });
  });
});

describe("uploadFileWithProgress", () => {
  it("resolves with the job response and reports progress on success", async () => {
    const file = new File(["hello world"], "paper.pdf", { type: "application/pdf" });
    const onProgress = vi.fn();

    const promise = uploadFileWithProgress(file, onProgress);
    const xhr = MockXHR.instances[0];
    expect(xhr.method).toBe("POST");

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    xhr.status = 200;
    xhr.responseText = JSON.stringify({ job_id: "job-1" });
    xhr.onload?.();

    await expect(promise).resolves.toEqual({ job_id: "job-1" });
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it("retries once after a 401 and succeeds", async () => {
    mockedRefreshAccessToken.mockResolvedValue("new-token");
    const file = new File(["hello"], "paper.pdf", { type: "application/pdf" });

    const promise = uploadFileWithProgress(file, vi.fn());
    const first = MockXHR.instances[0];
    first.status = 401;
    first.responseText = JSON.stringify({ error: { code: "unauthorized", message: "Expired" } });
    first.onload?.();

    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
    }

    const second = MockXHR.instances[1];
    second.status = 200;
    second.responseText = JSON.stringify({ job_id: "job-2" });
    second.onload?.();

    await expect(promise).resolves.toEqual({ job_id: "job-2" });
  });

  it("rejects with an ApiError when the upload fails", async () => {
    const file = new File(["hello"], "paper.pdf", { type: "application/pdf" });
    const promise = uploadFileWithProgress(file, vi.fn());
    const xhr = MockXHR.instances[0];
    xhr.status = 500;
    xhr.responseText = JSON.stringify({ error: { code: "server_error", message: "Boom" } });
    xhr.onload?.();

    await expect(promise).rejects.toMatchObject({ status: 500, code: "server_error" });
  });

  it("rejects when the browser reports a network error", async () => {
    const file = new File(["hello"], "paper.pdf", { type: "application/pdf" });
    const promise = uploadFileWithProgress(file, vi.fn());
    const xhr = MockXHR.instances[0];
    xhr.onerror?.();

    await expect(promise).rejects.toThrow("Could not reach the Prism server.");
  });

  it("rejects when aborted via the provided signal", async () => {
    const file = new File(["hello"], "paper.pdf", { type: "application/pdf" });
    const controller = new AbortController();
    const promise = uploadFileWithProgress(file, vi.fn(), controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ code: "cancelled" });
  });
});

describe("cancelJob", () => {
  it("returns the cancelled job status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: "cancelled" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(cancelJob("job-1")).resolves.toEqual({ status: "cancelled" });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/jobs/job-1", expect.objectContaining({ method: "DELETE" }));
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(404, { error: { code: "not_found", message: "Missing" } })));
    await expect(cancelJob("job-1")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("ingestUrl", () => {
  it("posts the url and returns the job response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ job_id: "job-3" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(ingestUrl("https://example.com/paper")).resolves.toEqual({ job_id: "job-3" });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ url: "https://example.com/paper" });
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(422, { error: { code: "invalid_url", message: "Bad url" } })));
    await expect(ingestUrl("not-a-url")).rejects.toMatchObject({ status: 422 });
  });
});

describe("ingestText", () => {
  it("posts the text and source and returns the job response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ job_id: "job-4" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(ingestText("hello world", "Manual Input")).resolves.toEqual({ job_id: "job-4" });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ text: "hello world", source: "Manual Input" });
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(400, { error: { code: "bad_request", message: "Too short" } })));
    await expect(ingestText("hi", "Manual Input")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchSummary", () => {
  it("returns the generated summary", async () => {
    const summary = { summary: { tldr: "TLDR", key_concepts: [], methodology: "", results: "", limitations: "" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(summary)));
    await expect(fetchSummary("text", "source")).resolves.toEqual(summary);
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(500, { error: { code: "server_error", message: "Boom" } })));
    await expect(fetchSummary("text", "source")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchEvalReport", () => {
  it("returns the eval report", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ content: "# report", generated_at: "2024-01-01" })));
    await expect(fetchEvalReport()).resolves.toEqual({ content: "# report", generated_at: "2024-01-01" });
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(500, { error: { code: "server_error", message: "Boom" } })));
    await expect(fetchEvalReport()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("runEvalReport", () => {
  it("triggers a new eval run", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ job_id: "job-5" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(runEvalReport()).resolves.toEqual({ job_id: "job-5" });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/eval-report/run", expect.objectContaining({ method: "POST" }));
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(500, { error: { code: "server_error", message: "Boom" } })));
    await expect(runEvalReport()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("resetDocuments", () => {
  it("returns the reset status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: "ok" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(resetDocuments()).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/reset/", expect.objectContaining({ method: "DELETE" }));
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(500, { error: { code: "server_error", message: "Boom" } })));
    await expect(resetDocuments()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("verifyClaims", () => {
  it("posts the answer for verification and returns claim analysis", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ claim_analysis: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyClaims("The answer", 3)).resolves.toEqual({ claim_analysis: [] });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ query: "The answer", top_k: 3, verify: true });
  });

  it("throws on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(500, { error: { code: "server_error", message: "Boom" } })));
    await expect(verifyClaims("The answer")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("streamGenerate", () => {
  it("parses SSE events and invokes the callback for each one", async () => {
    const sse =
      `event: retrieval\ndata: {"citations":[],"confidence_score":80}\n\n` +
      `event: token\ndata: {"token":"Hello"}\n\n` +
      `event: done\ndata: {"answer":"Hello world","confidence_score":92}\n\n`;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(sse, { status: 200, headers: { "Content-Type": "text/event-stream" } })
      )
    );

    const events: Array<{ event: string; data: any }> = [];
    await streamGenerate({ query: "hi", top_k: 5 }, (event, data) => events.push({ event, data }));

    expect(events).toEqual([
      { event: "retrieval", data: { citations: [], confidence_score: 80 } },
      { event: "token", data: { token: "Hello" } },
      { event: "done", data: { answer: "Hello world", confidence_score: 92 } },
    ]);
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(streamGenerate({ query: "hi", top_k: 5 }, vi.fn())).rejects.toThrow("Request failed with status 500");
  });
});
