"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { S, C } from "@/lib/styles";
import { useGenerate } from "@/lib/queries/generations";
import { useDocuments } from "@/lib/queries/documents";
import CitationPopover, { type Citation } from "@/components/CitationPopover";
import { getCurrentUser } from "@/lib/auth";
import { conversationStorageKey, queryLogStorageKey, hashDocumentIds } from "@/lib/conversationStorage";
import {
  Send, Loader2, BookOpen, CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
  Settings, RefreshCw, MessageSquarePlus, Inbox, RotateCcw,
} from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "prism_settings";

type GroundingClaim = { claim: string; label: "supported" | "unsupported"; confidence: number; supporting_chunk: string | null };
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  query?: string;
  citations?: Citation[];
  confidence?: number;
  grounding?: GroundingClaim[];
  latency?: number;
  streaming?: boolean;
  errored?: boolean;
};

const DEFAULT_MODEL = "openai/gpt-oss-120b";
const VALID_MODELS = new Set(["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);

function getSettings() {
  if (typeof window === "undefined") return { model: DEFAULT_MODEL, topK: 5 };
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const model = VALID_MODELS.has(s.model) ? s.model : DEFAULT_MODEL;
    return { model, topK: s.topK || 5 };
  } catch { return { model: DEFAULT_MODEL, topK: 5 }; }
}

function logQuery(confidence: number, latency: number) {
  if (typeof window === "undefined") return;
  try {
    const key = queryLogStorageKey(getCurrentUser()?.id);
    const log = JSON.parse(localStorage.getItem(key) || "[]");
    log.push({ confidence, latency, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(log.slice(-200)));
  } catch {
  }
}

function loadConversation(docFingerprint: string | null): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const key = conversationStorageKey(getCurrentUser()?.id, docFingerprint);
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((m: Message) => ({ ...m, streaming: false }));
  } catch { return []; }
}

function saveConversation(messages: Message[], docFingerprint: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = conversationStorageKey(getCurrentUser()?.id, docFingerprint);
    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
  }
}

const MODEL_NAMES: Record<string, string> = {
  "openai/gpt-oss-120b": "GPT-OSS 120B",
  "openai/gpt-oss-20b":  "GPT-OSS 20B",
};

const SUGGESTIONS = [
  "What are the main findings?",
  "Summarize the methodology",
  "What limitations does the study acknowledge?",
  "What are the key contributions?",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 0" }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 99, background: C.textMuted,
            animation: `prism-typing 1.1s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 4 }}>Generating response…</span>
    </div>
  );
}

function RenderMarkdown({ text, citations }: { text: string; citations?: Citation[] }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 14, color: "#111110", lineHeight: 1.78, fontWeight: 500 }}>
      {lines.map((line, li) => {
        const parts: React.ReactNode[] = [];
        const rest = line;
        let key = 0;
        const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(\d+)\])/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(rest)) !== null) {
          if (m.index > last) parts.push(<span key={key++} style={{ color: "#111110" }}>{rest.slice(last, m.index)}</span>);
          if (m[0].startsWith("**")) {
            parts.push(<strong key={key++} style={{ fontWeight: 700, color: "#111110" }}>{m[2]}</strong>);
          } else if (m[4] !== undefined) {
            const num = parseInt(m[4], 10);
            const citation = citations && citations[num - 1];
            if (citation) {
              parts.push(<CitationPopover key={key++} index={num} citation={citation} />);
            } else {
              parts.push(<span key={key++} style={{ color: "#111110" }}>{m[0]}</span>);
            }
          } else {
            parts.push(<em key={key++} style={{ color: "#111110" }}>{m[3]}</em>);
          }
          last = m.index + m[0].length;
        }
        if (last < rest.length) parts.push(<span key={key++} style={{ color: "#111110" }}>{rest.slice(last)}</span>);
        const isNumbered = /^\d+\.\s/.test(line);
        const isBullet = /^[-•]\s/.test(line);

        if (isNumbered || isBullet) {
          return (
            <div key={li} style={{ display: "flex", gap: 9, marginBottom: 6 }}>
              <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0, minWidth: 18 }}>
                {isNumbered ? line.match(/^\d+/)?.[0] + "." : "•"}
              </span>
              <span style={{ color: "#111110" }}>{parts.length > 0 ? parts : rest.replace(/^(\d+\.|-|•)\s/, "")}</span>
            </div>
          );
        }

        if (line.trim() === "") return <div key={li} style={{ height: 8 }} />;
        return <p key={li} style={{ margin: "0 0 6px", color: "#111110" }}>{parts.length > 0 ? parts : line}</p>;
      })}
    </div>
  );
}

function CitationCard({ c }: { c: Citation }) {
  return (
    <div style={{ padding: "11px 14px", borderRadius: 10, background: "rgba(91,94,244,0.06)", border: "1px solid rgba(91,94,244,0.14)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <BookOpen size={12} color={C.accent} />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>{c.source}</span>
        <span style={{ fontSize: 10, color: C.textMuted, marginLeft: "auto" }}>{Math.round(c.score * 100)}% match</span>
      </div>
      <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.55, fontStyle: "italic" }}>"{c.text}"</p>
    </div>
  );
}

function GroundingBadge({ g }: { g: GroundingClaim }) {
  const supported = g.label === "supported";
  const color = supported ? C.green : C.orange;
  const bg = supported ? "rgba(22,163,74,0.08)" : "rgba(234,88,12,0.08)";
  const border = supported ? "rgba(22,163,74,0.2)" : "rgba(234,88,12,0.2)";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      padding: "9px 12px", borderRadius: 9,
      background: bg, border: `1px solid ${border}`,
    }}>
      {supported ? <CheckCircle size={13} color={color} style={{ marginTop: 2, flexShrink: 0 }} /> : <AlertTriangle size={13} color={color} style={{ marginTop: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.5, margin: 0 }}>{g.claim}</p>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {supported ? "Supported" : "Unsupported"}
          </span>
          <span style={{ fontSize: 10.5, color: C.textMuted }}>{g.confidence}% confidence</span>
        </div>
      </div>
    </div>
  );
}

function AiMessage({ msg, onRegenerate, canRegenerate }: { msg: Message; onRegenerate: (id: string) => void; canRegenerate: boolean }) {
  const [open, setOpen] = useState(false);
  const [groundingOpen, setGroundingOpen] = useState(false);
  const isEmptyStreaming = !!msg.streaming && msg.content.length === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ maxWidth: "86%", display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ ...S.card, padding: "16px 20px" }}>
        <style>{`@keyframes prism-typing { 0%, 60%, 100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }`}</style>
        {isEmptyStreaming ? (
          <TypingDots />
        ) : (
          <>
            <RenderMarkdown text={msg.content} citations={msg.citations} />
            {msg.streaming && (
              <span style={{ display: "inline-block", width: 7, height: 14, background: C.accent, marginLeft: 2, verticalAlign: "middle", animation: "prism-blink 1s steps(1) infinite" }} />
            )}
          </>
        )}
        {msg.confidence !== undefined && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Confidence</span>
            <div style={{ ...S.cbarWrap, flex: 1 }}>
              <div style={{ ...S.cbarFill, width: `${msg.confidence}%` }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textSec }}>{msg.confidence}%</span>
          </div>
        )}
        {msg.latency !== undefined && (
          <div style={{ marginTop: 6, fontSize: 11, color: C.textMuted }}>{msg.latency.toFixed(2)}s response time</div>
        )}
        {!msg.streaming && msg.grounding !== undefined && msg.grounding.length > 0 && (
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 6 }}>
            {msg.grounding.every(g => g.label === "supported") ? (
              <>
                <CheckCircle size={13} color={C.green} />
                <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Fully grounded · No hallucinations detected</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} color={C.orange} />
                <span style={{ fontSize: 11, color: C.orange, fontWeight: 600 }}>
                  {msg.grounding.filter(g => g.label === "unsupported").length} unsupported claim{msg.grounding.filter(g => g.label === "unsupported").length > 1 ? "s" : ""} detected
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {!msg.streaming && msg.grounding !== undefined && msg.grounding.length > 0 && (
        <div>
          <button onClick={() => setGroundingOpen(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, color: C.accent,
            background: "rgba(91,94,244,0.08)", border: "none",
            borderRadius: 8, padding: "6px 13px", cursor: "pointer", fontFamily: "inherit", marginBottom: 7,
          }}>
            <CheckCircle size={12} /> {msg.grounding.length} claim{msg.grounding.length > 1 ? "s" : ""} checked
            {groundingOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence>
            {groundingOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} style={{ display: "flex", flexDirection: "column", gap: 7, overflow: "hidden" }}>
                {msg.grounding.map((g, i) => <GroundingBadge key={i} g={g} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {msg.citations && msg.citations.length > 0 && (
        <div>
          {(() => {
            const seen = new Set<string>();
            const uniqueCitations: Citation[] = [];
            for (const c of msg.citations) {
              const dedupeKey = c.text.trim().toLowerCase();
              if (!seen.has(dedupeKey)) {
                seen.add(dedupeKey);
                uniqueCitations.push(c);
              }
            }
            return (
              <>
                <button onClick={() => setOpen(v => !v)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600, color: C.accent,
                  background: "rgba(91,94,244,0.08)", border: "none",
                  borderRadius: 8, padding: "6px 13px", cursor: "pointer", fontFamily: "inherit", marginBottom: 7,
                }}>
                  <BookOpen size={12} /> {uniqueCitations.length} source{uniqueCitations.length > 1 ? "s" : ""}
                  {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} style={{ display: "flex", flexDirection: "column", gap: 7, overflow: "hidden" }}>
                      {uniqueCitations.map(c => <CitationCard key={c.id} c={c} />)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            );
          })()}
        </div>
      )}

      {!msg.streaming && msg.query && (
        <button
          onClick={() => onRegenerate(msg.id)}
          disabled={!canRegenerate}
          style={{
            alignSelf: "flex-start",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, color: canRegenerate ? C.textSec : C.textMuted,
            background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "6px 12px",
            cursor: canRegenerate ? "pointer" : "default", fontFamily: "inherit",
          }}
        >
          <RefreshCw size={12} /> Regenerate
        </button>
      )}
    </motion.div>
  );
}

export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [error,    setError]    = useState("");
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [settings, setSettings] = useState({ model: DEFAULT_MODEL, topK: 5 });
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const generateMutation = useGenerate();
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const docFingerprint = documentsLoading ? null : hashDocumentIds((documents || []).map((d: { id: string }) => d.id));
  const loadedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    if (documentsLoading) return;
    if (loadedFingerprintRef.current === docFingerprint) return;
    loadedFingerprintRef.current = docFingerprint;
    setMessages(loadConversation(docFingerprint));
    setInput("");
    setError("");
    setLastQuery(null);
    setHydrated(true);
  }, [documentsLoading, docFingerprint]);

  useEffect(() => {
    if (!hydrated) return;
    if (loadedFingerprintRef.current !== docFingerprint) return;
    saveConversation(messages, docFingerprint);
  }, [messages, hydrated, docFingerprint]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generateMutation.isPending]);

  const runGeneration = useCallback((query: string, assistantId: string) => {
    const t0 = Date.now();
    setError("");
    setLastQuery(query);

    generateMutation.mutate(
      {
        query,
        top_k: settings.topK,
        model: settings.model,
        onEvent: (event, data) => {
          if (event === "retrieval") {
            setMessages(m => m.map(msg => msg.id === assistantId ? {
              ...msg,
              citations: data.citations,
              confidence: data.confidence_score,
            } : msg));
          } else if (event === "token") {
            setMessages(m => m.map(msg => msg.id === assistantId ? {
              ...msg,
              content: msg.content + (data.token || ""),
            } : msg));
          } else if (event === "error") {
            setError(data.message || "Something went wrong while generating the answer.");
          } else if (event === "done") {
            const latency = (Date.now() - t0) / 1000;
            const conf = data.confidence_score ?? 0;
            logQuery(conf, latency);
            setMessages(m => m.map(msg => msg.id === assistantId ? {
              ...msg,
              content: data.answer ?? msg.content,
              citations: data.citations ?? msg.citations,
              confidence: conf,
              grounding: data.grounding || [],
              latency,
              streaming: false,
              errored: !!data.error,
            } : msg));
          }
        },
      },
      {
        onError: (e: Error) => {
          setMessages(m => m.map(msg => msg.id === assistantId ? {
            ...msg,
            streaming: false,
            errored: true,
          } : msg));
          setError(e.message || "Failed to fetch. Make sure the backend is running on port 8000.");
        },
      }
    );
  }, [generateMutation, settings.model, settings.topK]);

  const send = () => {
    if (!input.trim() || generateMutation.isPending) return;
    const q = input.trim();
    setInput(""); setError("");
    setMessages(m => [...m, { id: Date.now().toString(), role: "user", content: q }]);

    const assistantId = Date.now().toString() + "r";
    setMessages(m => [...m, { id: assistantId, role: "assistant", content: "", streaming: true, query: q }]);

    runGeneration(q, assistantId);
  };

  const regenerate = (assistantId: string) => {
    if (generateMutation.isPending) return;
    const target = messages.find(m => m.id === assistantId);
    if (!target || !target.query) return;
    setMessages(m => m.map(msg => msg.id === assistantId ? {
      ...msg,
      content: "",
      citations: undefined,
      confidence: undefined,
      grounding: undefined,
      latency: undefined,
      streaming: true,
      errored: false,
    } : msg));
    runGeneration(target.query, assistantId);
  };

  const retryLast = () => {
    if (!lastQuery || generateMutation.isPending) return;
    const failing = [...messages].reverse().find(m => m.role === "assistant" && m.errored);
    if (failing) {
      regenerate(failing.id);
      return;
    }
    setError("");
    setMessages(m => [...m, { id: Date.now().toString(), role: "user", content: lastQuery }]);
    const assistantId = Date.now().toString() + "r";
    setMessages(m => [...m, { id: assistantId, role: "assistant", content: "", streaming: true, query: lastQuery }]);
    runGeneration(lastQuery, assistantId);
  };

  const newConversation = () => {
    if (generateMutation.isPending) return;
    setMessages([]);
    setInput("");
    setError("");
    setLastQuery(null);
    saveConversation([], docFingerprint);
  };

  const noDocuments = !documentsLoading && Array.isArray(documents) && documents.length === 0;

  return (
    <>
      <style>{`@keyframes prism-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: C.bg }}>

        <div style={{ padding: "20px 36px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ ...S.tagIndigo, marginBottom: 7, display: "inline-block" }}>Workspace</span>
              <h1 style={{ ...S.heading, fontSize: 26, marginTop: 8 }}>Query your research</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                Using <strong style={{ color: C.text }}>{MODEL_NAMES[settings.model] || settings.model}</strong> · Top-{settings.topK}
              </div>
              <button
                onClick={newConversation}
                disabled={messages.length === 0 || generateMutation.isPending}
                style={{ ...S.btnSecondary, padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5, cursor: messages.length === 0 ? "default" : "pointer", opacity: messages.length === 0 ? 0.5 : 1 }}
              >
                <MessageSquarePlus size={13} /> New conversation
              </button>
              <Link href="/settings" style={{ textDecoration: "none" }}>
                <button style={{ ...S.btnSecondary, padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  <Settings size={13} /> Settings
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "26px 36px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 && noDocuments && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", marginTop: 60 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Inbox size={22} color={C.textMuted} />
              </div>
              <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 24, color: C.text, marginBottom: 7 }}>No documents ingested yet</div>
              <p style={{ fontSize: 13.5, color: C.textMuted, maxWidth: 380, margin: "0 auto 22px" }}>
                Prism needs at least one document to ground its answers. Ingest a paper, URL, or note to get started.
              </p>
              <Link href="/ingest" style={{ textDecoration: "none" }}>
                <button style={{ ...S.btnPrimary }}>Go to Ingest</button>
              </Link>
            </motion.div>
          )}

          {messages.length === 0 && !noDocuments && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", marginTop: 60 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <BookOpen size={22} color={C.textMuted} />
              </div>
              <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 24, color: C.text, marginBottom: 7 }}>Ask anything</div>
              <p style={{ fontSize: 13.5, color: C.textMuted, maxWidth: 360, margin: "0 auto 26px" }}>
                Answers are grounded in your ingested documents. Every claim is cited.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setInput(s)} style={{
                    padding: "8px 14px", borderRadius: 9,
                    border: `1px solid ${C.border}`, background: C.surface,
                    color: C.textSec, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer",
                  }}>{s}</button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "user" ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
                  padding: "11px 16px", borderRadius: 13,
                  background: "#111110", color: "#fff",
                  fontSize: 14, fontWeight: 500, maxWidth: "75%", lineHeight: 1.5,
                }}>
                  {msg.content}
                </motion.div>
              ) : <AiMessage msg={msg} onRegenerate={regenerate} canRegenerate={!generateMutation.isPending} />}
            </div>
          ))}

          {error && (
            <div style={{ padding: "11px 15px", borderRadius: 10, background: C.redBg, border: `1px solid rgba(220,38,38,0.2)`, display: "flex", alignItems: "center", gap: 9, alignSelf: "flex-start" }}>
              <AlertTriangle size={15} color={C.red} />
              <span style={{ fontSize: 13, color: C.red }}>{error}</span>
              <button
                onClick={retryLast}
                disabled={generateMutation.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 12, fontWeight: 700, color: C.red,
                  background: "rgba(220,38,38,0.1)", border: "none",
                  borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "16px 36px 20px", background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.09)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              style={{
                flex: 1, resize: "none", minHeight: 48, maxHeight: 140,
                background: "#ffffff", border: "1.5px solid rgba(0,0,0,0.18)",
                borderRadius: 11, padding: "12px 15px",
                fontSize: 14, color: "#111110", fontFamily: "inherit",
                outline: "none", lineHeight: 1.6,
              }}
              placeholder="Ask a question grounded in your research…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = "#5b5ef4"; }}
              onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(0,0,0,0.18)"; }}
              rows={1}
            />
            <motion.button
              whileHover={{ scale: input.trim() && !generateMutation.isPending ? 1.07 : 1 }}
              whileTap={{ scale: 0.93 }}
              onClick={send}
              disabled={!input.trim() || generateMutation.isPending}
              style={{
                width: 48, height: 48, borderRadius: 11, flexShrink: 0,
                background: input.trim() && !generateMutation.isPending ? "#111110" : "rgba(0,0,0,0.10)",
                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !generateMutation.isPending ? "pointer" : "default",
                transition: "background 0.18s",
              }}
            >
              {generateMutation.isPending ? <Loader2 size={18} color="#ffffff" className="animate-spin" /> : <Send size={18} color={input.trim() ? "#ffffff" : "#9a9590"} />}
            </motion.button>
          </div>
          <div style={{ marginTop: 7, fontSize: 11, color: "#9a9590" }}>
            Grounded in ingested documents · Enter to send · Shift+Enter for new line
          </div>
        </div>
      </main>
    </>
  );
}
