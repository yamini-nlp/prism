"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { S, C } from "@/lib/styles";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import EvidenceCard from "@/components/EvidenceCard";
import {
  GitBranch,
  AlertCircle,
  RotateCcw,
  Inbox,
  ArrowUpRight,
  ArrowRight,
  FileText,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { conversationStorageKey } from "@/lib/conversationStorage";

type Citation = {
  id: string;
  text: string;
  source: string;
  score: number;
  chunk_index: number;
};

type GenerationRecord = {
  id: string;
  query: string;
  content: string;
  citations: Citation[];
  confidence?: number;
  latency?: number;
};

type Phase = "loading" | "ready" | "empty" | "error";

function tsFromId(id: string): number | null {
  const numeric = id.endsWith("r") ? id.slice(0, -1) : id;
  const n = Number(numeric);
  return Number.isFinite(n) ? n : null;
}

function formatTimestamp(id: string): string | null {
  const ms = tsFromId(id);
  if (ms === null) return null;
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function truncate(text: string, max: number): string {
  const trimmed = (text || "").trim();
  if (trimmed.length <= max) return trimmed || "Untitled query";
  return trimmed.slice(0, max).trim() + "…";
}

function readGenerations(): GenerationRecord[] {
  const raw = window.localStorage.getItem(conversationStorageKey(getCurrentUser()?.id));
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  const records: GenerationRecord[] = [];
  for (const m of parsed) {
    if (!m || typeof m !== "object") continue;
    if (m.role !== "assistant") continue;
    if (m.streaming || m.errored) continue;
    if (typeof m.content !== "string" || !m.content.trim()) continue;

    records.push({
      id: String(m.id ?? `gen-${records.length}`),
      query: typeof m.query === "string" ? m.query : "",
      content: m.content,
      citations: Array.isArray(m.citations) ? m.citations : [],
      confidence: typeof m.confidence === "number" ? m.confidence : undefined,
      latency: typeof m.latency === "number" ? m.latency : undefined,
    });
  }
  return records.reverse();
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: "22px 38px" }}>
      <style>{`@keyframes pr-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
        <div style={{ height: 14, width: 160, borderRadius: 6, background: C.border, animation: "pr-pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 38, width: "100%", borderRadius: 11, background: C.border, animation: "pr-pulse 1.4s ease-in-out infinite" }} />
      </div>
      <div className="pr-grid" style={{ marginTop: 26 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 92, borderRadius: 12, background: C.border, animation: `pr-pulse 1.4s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
        <div style={{ height: 320, borderRadius: 16, background: C.border, animation: "pr-pulse 1.4s ease-in-out 0.2s infinite" }} />
      </div>
    </div>
  );
}

export default function SourceTracePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedChunkId, setSelectedChunkId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(() => {
    setPhase("loading");
    setErrorMsg("");
    const timer = window.setTimeout(() => {
      try {
        const records = readGenerations();
        setGenerations(records);
        if (records.length === 0) {
          setPhase("empty");
        } else {
          setSelectedId(prev => (records.some(r => r.id === prev) ? prev : records[0].id));
          setPhase("ready");
        }
      } catch (e: any) {
        setErrorMsg(e?.message || "Could not read generation history from this browser.");
        setPhase("error");
      }
    }, 260);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  const selected = generations.find(g => g.id === selectedId) || null;
  const results = selected?.citations ?? [];

  useEffect(() => {
    if (results.length > 0) {
      setSelectedChunkId(prev => (results.some(r => r.id === prev) ? prev : results[0].id));
    } else {
      setSelectedChunkId("");
    }
  }, [selectedId]);

  const selectedChunk = results.find(r => r.id === selectedChunkId) || results[0] || null;

  const jumpToDocument = (source: string) => {
    router.push(`/library?doc=${encodeURIComponent(source)}`);
  };

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto", background: C.bg }}>
      <style>{`
        .pr-grid { display:flex; flex:1; overflow:hidden; }
        .pr-sidebar { width:380px; flex-shrink:0; border-right:1px solid ${C.border}; overflow-y:auto; padding:18px 16px; display:flex; flex-direction:column; gap:9px; }
        .pr-detail { flex:1; overflow-y:auto; padding:28px 34px; }
        @media (max-width: 880px) {
          .pr-grid { flex-direction:column; overflow:visible; }
          .pr-sidebar { width:100%; border-right:none; border-bottom:1px solid ${C.border}; max-height:420px; }
          .pr-detail { padding:22px 20px; }
        }
      `}</style>

      <div style={{ padding: "22px 38px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ ...S.tagIndigo, marginBottom: 8 }}>Source Trace</span>
        <h1 style={{ ...S.heading, fontSize: 26, marginTop: 8, marginBottom: 8 }}>Retrieval Transparency</h1>
        <p style={{ fontSize: 13.5, color: C.textSec, marginBottom: phase === "ready" ? 18 : 0, maxWidth: 640 }}>
          Every retrieved chunk behind a generated answer, with its exact relevance score and originating document.
        </p>

        {phase === "ready" && generations.length > 0 && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", maxWidth: 720 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label htmlFor="source-trace-generation" style={{ ...S.label, display: "block", marginBottom: 6 }}>Generation</label>
              <select
                id="source-trace-generation"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1.5px solid rgba(0,0,0,0.18)",
                  borderRadius: 11,
                  padding: "10px 13px",
                  fontSize: 13.5,
                  color: C.text,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              >
                {generations.map(g => (
                  <option key={g.id} value={g.id}>
                    {truncate(g.query || g.content, 70)}
                  </option>
                ))}
              </select>
            </div>
            {selected && typeof selected.confidence === "number" && (
              <div>
                <div style={{ ...S.label, marginBottom: 6 }}>Answer confidence</div>
                <ConfidenceBadge value={selected.confidence} />
              </div>
            )}
          </div>
        )}
      </div>

      {phase === "loading" && <LoadingSkeleton />}

      {phase === "error" && (
        <div style={{ margin: "24px 38px", padding: "16px 18px", borderRadius: 12, background: C.redBg, border: "1px solid rgba(220,38,38,0.2)", display: "flex", alignItems: "flex-start", gap: 10, maxWidth: 560 }}>
          <AlertCircle size={16} color={C.red} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: C.red, fontWeight: 600, marginBottom: 4 }}>Couldn't load generation history</div>
            <div style={{ fontSize: 12.5, color: C.red, marginBottom: 10 }}>{errorMsg}</div>
            <button
              onClick={load}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.red, background: "rgba(220,38,38,0.1)", border: "none", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontFamily: "inherit" }}
            >
              <RotateCcw size={12} /> Retry
            </button>
          </div>
        </div>
      )}

      {phase === "empty" && (
        <div style={{ textAlign: "center", padding: "70px 24px" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Inbox size={22} color={C.textMuted} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>No generation selected yet</div>
          <p style={{ fontSize: 13.5, color: C.textMuted, maxWidth: 380, margin: "0 auto 20px" }}>
            Ask a question in Workspace first. Once Prism generates a grounded answer, its retrieved chunks will show up here.
          </p>
          <Link href="/workspace" style={{ textDecoration: "none" }}>
            <button style={S.btnPrimary}>
              Go to Workspace <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      )}

      {phase === "ready" && selected && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <GitBranch size={30} color={C.textMuted} style={{ margin: "0 auto 14px", display: "block" }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 5 }}>No chunks recorded for this generation</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>This answer wasn't grounded in any retrieved chunks.</div>
        </div>
      )}

      {phase === "ready" && selected && results.length > 0 && (
        <div className="pr-grid">
          <div className="pr-sidebar">
            <div style={{ ...S.label, paddingLeft: 4, marginBottom: 2 }}>Retrieved Chunks ({results.length})</div>
            {results.map((chunk, i) => (
              <motion.div key={chunk.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <EvidenceCard
                  title={chunk.source}
                  meta={`Chunk #${chunk.chunk_index} · Rank ${i + 1} of ${results.length}`}
                  score={chunk.score}
                  scoreLabel="Similarity"
                  snippet={chunk.text}
                  active={chunk.id === selectedChunkId}
                  onSelect={() => setSelectedChunkId(chunk.id)}
                />
              </motion.div>
            ))}
          </div>

          <div className="pr-detail">
            {selectedChunk && (
              <motion.div key={selectedChunk.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  <FileText size={18} color={C.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{selectedChunk.source}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      Chunk #{selectedChunk.chunk_index} · Rank {results.findIndex(r => r.id === selectedChunk.id) + 1} of {results.length}
                    </div>
                  </div>
                  <ConfidenceBadge value={selectedChunk.score <= 1 ? selectedChunk.score * 100 : selectedChunk.score} label="Similarity" />
                  <button
                    onClick={() => jumpToDocument(selectedChunk.source)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#4547c4", background: "rgba(91,94,244,0.09)", border: "none", borderRadius: 9, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Jump to document <ArrowUpRight size={13} />
                  </button>
                </div>

                <div style={{ ...S.card, padding: 26, marginBottom: 22 }}>
                  <div style={{ ...S.label, marginBottom: 12 }}>Retrieved Chunk</div>
                  <p style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 15, color: C.text, lineHeight: 1.78 }}>
                    {selectedChunk.text}
                  </p>
                </div>

                <div style={{ ...S.card, padding: 24 }}>
                  <div style={{ ...S.label, marginBottom: 14 }}>Retrieval Detail</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9, fontSize: 12.5 }}>
                    <span style={{ color: C.textSec }}>Similarity score</span>
                    <span style={{ fontWeight: 700, color: C.text }}>{Math.round((selectedChunk.score <= 1 ? selectedChunk.score * 100 : selectedChunk.score))}%</span>
                  </div>
                  <div style={S.cbarWrap}>
                    <div style={{ ...S.cbarFill, width: `${Math.min(selectedChunk.score <= 1 ? selectedChunk.score * 100 : selectedChunk.score, 100)}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 12.5 }}>
                    <span style={{ color: C.textSec }}>Originating document</span>
                    <span style={{ fontWeight: 600, color: C.text }}>{selectedChunk.source}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5 }}>
                    <span style={{ color: C.textSec }}>Chunk index</span>
                    <span style={{ fontWeight: 600, color: C.text }}>#{selectedChunk.chunk_index}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5 }}>
                    <span style={{ color: C.textSec }}>Retrieval rank</span>
                    <span style={{ fontWeight: 600, color: C.text }}>
                      {results.findIndex(r => r.id === selectedChunk.id) + 1} of {results.length}
                    </span>
                  </div>
                  {selected && formatTimestamp(selected.id) && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5 }}>
                      <span style={{ color: C.textSec }}>Generated</span>
                      <span style={{ fontWeight: 600, color: C.text }}>{formatTimestamp(selected.id)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}