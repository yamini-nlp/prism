"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { S, C } from "@/lib/styles";
import { uploadFileWithProgress, cancelJob as apiCancelJob, fetchJobStatus, ApiError, type SummaryResult, type JobStatus } from "@/lib/api";
import { useIngestUrl, useIngestText, useGenerateSummary, documentsQueryKey } from "@/lib/queries/documents";
import { toast } from "@/lib/toast";
import {
  Upload, FileText, Link as LinkIcon, Type, ArrowRight,
  AlertCircle, RotateCcw, Ban, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";

type Kind = "file" | "url" | "text";
type ItemStatus = "queued" | "uploading" | "processing" | "done" | "error" | "cancelled";
type Stage = "uploading" | "parsing" | "chunking" | "embedding" | "ready" | "error" | "cancelled";

const STAGES: Stage[] = ["uploading", "parsing", "chunking", "embedding", "ready"];
const STAGE_LABELS: Record<Stage, string> = {
  uploading: "Uploading",
  parsing: "Parsing",
  chunking: "Chunking",
  embedding: "Embedding",
  ready: "Ready",
  error: "Error",
  cancelled: "Cancelled",
};

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;
const POLL_INTERVAL_MS = 1200;

interface QueueItem {
  id: string;
  kind: Kind;
  label: string;
  detail: string;
  file: File | null;
  payload: string | null;
  status: ItemStatus;
  uploadProgress: number;
  stage: Stage;
  jobId: string | null;
  error: string | null;
  summary: SummaryResult | null;
  notified: boolean;
  abortController: AbortController | null;
  expanded: boolean;
}

function genId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported file type ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `File exceeds maximum size of ${formatBytes(MAX_UPLOAD_SIZE_BYTES)}.`;
  }
  return null;
}

const visuallyHiddenInput: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function IngestPage() {
  const [mode, setMode] = useState<Kind>("file");
  const [urlValue, setUrlValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [dragging, setDragging] = useState(false);
  const [dropError, setDropError] = useState("");
  const [items, setItems] = useState<QueueItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const ingestUrlMutation = useIngestUrl();
  const ingestTextMutation = useIngestText();
  const summaryMutation = useGenerateSummary();

  const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const runFileUpload = useCallback(
    (item: QueueItem) => {
      if (!item.file) return;
      const controller = new AbortController();
      updateItem(item.id, { status: "uploading", uploadProgress: 0, error: null, jobId: null, abortController: controller, notified: false });

      uploadFileWithProgress(
        item.file,
        (pct) => updateItem(item.id, { uploadProgress: pct }),
        controller.signal
      )
        .then((res) => {
          updateItem(item.id, { status: "processing", stage: "parsing", jobId: res.job_id, uploadProgress: 100 });
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.code === "cancelled") {
            updateItem(item.id, { status: "cancelled", stage: "cancelled" });
            return;
          }
          const message = err instanceof Error ? err.message : "Upload failed.";
          updateItem(item.id, { status: "error", stage: "error", error: message });
        });
    },
    [updateItem]
  );

  const runUrlIngest = useCallback(
    (item: QueueItem) => {
      if (!item.payload) return;
      updateItem(item.id, { status: "processing", stage: "parsing", error: null, jobId: null, notified: false });
      ingestUrlMutation.mutate(item.payload, {
        onSuccess: (data) => updateItem(item.id, { jobId: data.job_id }),
        onError: (err) => updateItem(item.id, { status: "error", stage: "error", error: err.message || "Failed to queue URL." }),
      });
    },
    [ingestUrlMutation, updateItem]
  );

  const runTextIngest = useCallback(
    (item: QueueItem) => {
      if (!item.payload) return;
      updateItem(item.id, { status: "processing", stage: "parsing", error: null, jobId: null, notified: false });
      ingestTextMutation.mutate(
        { text: item.payload, source: item.label },
        {
          onSuccess: (data) => updateItem(item.id, { jobId: data.job_id }),
          onError: (err) => updateItem(item.id, { status: "error", stage: "error", error: err.message || "Failed to queue text." }),
        }
      );
    },
    [ingestTextMutation, updateItem]
  );

  const startItem = useCallback(
    (item: QueueItem) => {
      if (item.kind === "file") runFileUpload(item);
      else if (item.kind === "url") runUrlIngest(item);
      else runTextIngest(item);
    },
    [runFileUpload, runUrlIngest, runTextIngest]
  );

  const addFiles = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;
      setDropError("");

      const newItems: QueueItem[] = files.map((file) => {
        const invalidReason = validateFile(file);
        return {
          id: genId(),
          kind: "file",
          label: file.name,
          detail: formatBytes(file.size),
          file,
          payload: null,
          status: invalidReason ? "error" : "queued",
          uploadProgress: 0,
          stage: invalidReason ? "error" : "uploading",
          jobId: null,
          error: invalidReason,
          summary: null,
          notified: Boolean(invalidReason),
          abortController: null,
          expanded: false,
        };
      });

      setItems((prev) => [...newItems, ...prev]);

      newItems.forEach((item) => {
        if (item.error) {
          toast.error(`${item.label} rejected`, item.error);
        } else {
          startItem(item);
        }
      });
    },
    [startItem]
  );

  const addUrl = useCallback(() => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    const item: QueueItem = {
      id: genId(),
      kind: "url",
      label: trimmed,
      detail: "URL source",
      file: null,
      payload: trimmed,
      status: "queued",
      uploadProgress: 100,
      stage: "uploading",
      jobId: null,
      error: null,
      summary: null,
      notified: false,
      abortController: null,
      expanded: false,
    };
    setItems((prev) => [item, ...prev]);
    startItem(item);
    setUrlValue("");
  }, [urlValue, startItem]);

  const addText = useCallback(() => {
    const trimmed = textValue.trim();
    if (trimmed.length < 50) {
      toast.error("Text too short", "Please provide at least 50 characters.");
      return;
    }
    const item: QueueItem = {
      id: genId(),
      kind: "text",
      label: "Manual Input",
      detail: `${trimmed.length} characters`,
      file: null,
      payload: trimmed,
      status: "queued",
      uploadProgress: 100,
      stage: "uploading",
      jobId: null,
      error: null,
      summary: null,
      notified: false,
      abortController: null,
      expanded: false,
    };
    setItems((prev) => [item, ...prev]);
    startItem(item);
    setTextValue("");
  }, [textValue, startItem]);

  const cancelItem = useCallback(
    (item: QueueItem) => {
      if (item.status === "uploading" && item.abortController) {
        item.abortController.abort();
        return;
      }
      if (item.status === "processing" && item.jobId) {
        apiCancelJob(item.jobId)
          .then(() => updateItem(item.id, { status: "cancelled", stage: "cancelled" }))
          .catch(() => updateItem(item.id, { status: "cancelled", stage: "cancelled" }));
        return;
      }
      updateItem(item.id, { status: "cancelled", stage: "cancelled" });
    },
    [updateItem]
  );

  const retryItem = useCallback(
    (item: QueueItem) => {
      startItem({ ...item, error: null, uploadProgress: 0, stage: "uploading" });
    },
    [startItem]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  useEffect(() => {
    const processing = items.filter((it) => it.status === "processing" && it.jobId);
    if (processing.length === 0) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    processing.forEach((item) => {
      async function poll() {
        try {
          const data: JobStatus = await fetchJobStatus(item.jobId as string);
          if (cancelled) return;
          if (data.status === "complete") {
            updateItem(item.id, { status: "done", stage: "ready" });
            const result = data.result || {};
            const srcText = result.preview || "";
            if (srcText) {
              summaryMutation.mutate(
                { text: srcText, source: result.source || item.label },
                { onSuccess: (res) => updateItem(item.id, { summary: res.summary }) }
              );
            }
            queryClient.invalidateQueries({ queryKey: documentsQueryKey });
          } else if (data.status === "failed") {
            updateItem(item.id, { status: "error", stage: "error", error: data.error || "Ingestion failed." });
          } else if (data.status === "cancelled") {
            updateItem(item.id, { status: "cancelled", stage: "cancelled" });
          } else {
            updateItem(item.id, { stage: (data.stage as Stage) || "parsing" });
            const timer = setTimeout(poll, POLL_INTERVAL_MS);
            timers.push(timer);
          }
        } catch (err) {
          if (cancelled) return;
          updateItem(item.id, { status: "error", stage: "error", error: err instanceof Error ? err.message : "Job status check failed." });
        }
      }
      poll();
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [items, updateItem, summaryMutation, queryClient]);

  useEffect(() => {
    items.forEach((item) => {
      if (item.notified) return;
      if (item.status === "done") {
        toast.success(`${item.label} ingested`, "Ready to query in your workspace.");
        updateItem(item.id, { notified: true });
      } else if (item.status === "error") {
        toast.error(`${item.label} failed`, item.error || "Ingestion failed.");
        updateItem(item.id, { notified: true });
      } else if (item.status === "cancelled") {
        toast.info(`${item.label} cancelled`);
        updateItem(item.id, { notified: true });
      }
    });
  }, [items, updateItem]);

  const stageIndex = (stage: Stage) => STAGES.indexOf(stage);

  return (
    <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto", background: C.bg }}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <span style={{ ...S.tagIndigo, marginBottom: 12 }}>Ingest</span>
        <h1 style={{ ...S.heading, fontSize: 38, marginTop: 10, marginBottom: 6 }}>Add sources</h1>
        <p style={{ color: C.textSec, fontSize: 15, marginBottom: 30 }}>
          Drag in files, paste a URL, or add raw text. Everything runs in the background so you can queue up more while it processes.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 26 }}>
          {(["file", "url", "text"] as Kind[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "9px 19px", borderRadius: 10,
                border: `1.5px solid ${mode === m ? "#111110" : "rgba(0,0,0,0.15)"}`,
                background: mode === m ? "#111110" : "#ffffff",
                color: mode === m ? "#ffffff" : C.textSec,
                fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                transition: "all 0.18s",
              }}
            >
              {m === "file" && <FileText size={13} />}
              {m === "url" && <LinkIcon size={13} />}
              {m === "text" && <Type size={13} />}
              {m === "file" ? "Upload File" : m === "url" ? "From URL" : "Raw Text"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "file" && (
            <motion.div key="file" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                style={{
                  border: `2px dashed ${dropError ? C.red : dragging ? "#5b5ef4" : "rgba(0,0,0,0.18)"}`,
                  borderRadius: 14, padding: "50px 32px", textAlign: "center",
                  background: dropError ? "rgba(220,38,38,0.03)" : dragging ? "rgba(91,94,244,0.04)" : "#ffffff",
                  transition: "all 0.2s",
                }}
              >
                <label htmlFor="ingest-file-input" style={{ cursor: "pointer", display: "block" }}>
                  <input
                    id="ingest-file-input"
                    ref={fileRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    style={visuallyHiddenInput}
                    onChange={(e) => {
                      if (e.target.files?.length) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <Upload size={30} color="#9a9590" style={{ margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 5 }}>
                    Drop files here, or click to browse
                  </div>
                  <div style={{ fontSize: 12.5, color: C.textMuted }}>
                    Supports PDF, DOC, DOCX, TXT · Max {formatBytes(MAX_UPLOAD_SIZE_BYTES)} per file · Multiple files supported
                  </div>
                </label>
              </div>
            </motion.div>
          )}

          {mode === "url" && (
            <motion.div key="url" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>Research Paper URL</label>
              <input
                style={S.input}
                type="url"
                placeholder="https://arxiv.org/abs/..."
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addUrl(); }}
              />
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 7, marginBottom: 16 }}>
                Supports arXiv, PubMed, ACL Anthology, and most research sites.
              </div>
              <button onClick={addUrl} disabled={!urlValue.trim()} style={urlValue.trim() ? S.btnPrimary : S.btnPrimaryDisabled}>
                Add to Queue <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {mode === "text" && (
            <motion.div key="text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>Paste your text</label>
              <textarea
                style={{ ...S.textarea, minHeight: 200, marginBottom: 16 }}
                placeholder="Paste abstract, excerpts, or full paper text…"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
              />
              <button onClick={addText} disabled={textValue.trim().length < 50} style={textValue.trim().length >= 50 ? S.btnPrimary : S.btnPrimaryDisabled}>
                Add to Queue <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ ...S.label }}>Queue {items.length > 0 && `(${items.length})`}</div>
          </div>

          {items.length === 0 ? (
            <div style={{ ...S.card, padding: 28, textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Upload size={20} color={C.textMuted} />
              </div>
              <div style={{ fontSize: 13.5, color: C.textSec, fontWeight: 500 }}>Nothing queued yet</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 5 }}>Added sources will appear here with live progress.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const idx = stageIndex(item.stage);
                  const isTerminal = item.status === "done" || item.status === "error" || item.status === "cancelled";
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      style={{ ...S.card, padding: 18 }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: item.status === "done" ? C.greenBg : item.status === "error" ? C.redBg : C.accentBg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {item.kind === "file" && <FileText size={15} color={item.status === "done" ? C.green : item.status === "error" ? C.red : C.accent} />}
                          {item.kind === "url" && <LinkIcon size={15} color={item.status === "done" ? C.green : item.status === "error" ? C.red : C.accent} />}
                          {item.kind === "text" && <Type size={15} color={item.status === "done" ? C.green : item.status === "error" ? C.red : C.accent} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.label}
                            </span>
                            <span style={
                              item.status === "done" ? S.tagGreen :
                              item.status === "error" ? S.tagRed :
                              item.status === "cancelled" ? S.tagNeutral :
                              S.tagIndigo
                            }>
                              {item.status === "uploading" ? "Uploading" :
                               item.status === "processing" ? STAGE_LABELS[item.stage] :
                               item.status === "queued" ? "Queued" :
                               item.status === "done" ? "Ready" :
                               item.status === "error" ? "Failed" : "Cancelled"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{item.detail}</div>

                          {item.status === "uploading" && (
                            <div style={{ marginTop: 10 }}>
                              <div style={S.cbarWrap}>
                                <div style={{ ...S.cbarFill, width: `${item.uploadProgress}%` }} />
                              </div>
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{item.uploadProgress}% uploaded</div>
                            </div>
                          )}

                          {(item.status === "processing" || item.status === "done") && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
                              {STAGES.map((s, i) => {
                                const done = idx > i || item.status === "done";
                                const active = idx === i && item.status !== "done";
                                return (
                                  <div key={s} title={STAGE_LABELS[s]} style={{
                                    flex: 1, height: 5, borderRadius: 99,
                                    background: done ? C.green : active ? C.accent : "rgba(0,0,0,0.08)",
                                    transition: "background 0.3s",
                                  }} />
                                );
                              })}
                            </div>
                          )}

                          {item.error && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                              <AlertCircle size={13} color={C.red} />
                              <span style={{ fontSize: 12, color: C.red }}>{item.error}</span>
                            </div>
                          )}

                          {item.summary && (
                            <div style={{ marginTop: 12 }}>
                              <button
                                onClick={() => updateItem(item.id, { expanded: !item.expanded })}
                                style={{ ...S.btnGhost, fontSize: 11.5 }}
                              >
                                {item.expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {item.expanded ? "Hide summary" : "View summary"}
                              </button>
                              <AnimatePresence>
                                {item.expanded && item.summary && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ overflow: "hidden" }}
                                  >
                                    <div style={{ marginTop: 12, padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
                                      <p style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontStyle: "italic", fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 12 }}>
                                        {item.summary.tldr}
                                      </p>
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                        {(item.summary.key_concepts || []).map((c) => (
                                          <span key={c} style={S.tagIndigo}>{c}</span>
                                        ))}
                                      </div>
                                      <div style={{ display: "flex", gap: 10 }}>
                                        <Link href="/workspace" style={{ textDecoration: "none" }}>
                                          <button style={{ ...S.btnPrimary, padding: "8px 16px", fontSize: 12 }}>Query Now <ArrowRight size={12} /></button>
                                        </Link>
                                        <Link href="/library" style={{ textDecoration: "none" }}>
                                          <button style={{ ...S.btnSecondary, padding: "8px 16px", fontSize: 12 }}>View Library</button>
                                        </Link>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {!isTerminal && (
                            <button
                              onClick={() => cancelItem(item)}
                              title="Cancel"
                              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", color: C.textSec, padding: 7, display: "flex" }}
                            >
                              <Ban size={14} />
                            </button>
                          )}
                          {(item.status === "error" || item.status === "cancelled") && (
                            <button
                              onClick={() => retryItem(item)}
                              title="Retry"
                              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", color: C.accent, padding: 7, display: "flex" }}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          {isTerminal && (
                            <button
                              onClick={() => removeItem(item.id)}
                              title="Remove"
                              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", color: C.textMuted, padding: 7, display: "flex" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </motion.div>
    </main>
  );
}