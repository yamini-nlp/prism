"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { S, C } from "@/lib/styles";
import { Send, Loader2, BookOpen, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Settings } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const STORAGE_KEY = "prism_settings";
const LOG_KEY = "prism_query_log";

type Citation = { id: string; text: string; source: string; score: number; chunk_index: number };
type Message  = { id: string; role: "user" | "assistant"; content: string; citations?: Citation[]; confidence?: number; flags?: string[]; latency?: number };

function getSettings() {
  if (typeof window === "undefined") return { model: "llama-3.3-70b-versatile", topK: 5 };
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { model: s.model || "llama-3.3-70b-versatile", topK: s.topK || 5 };
  } catch { return { model: "llama-3.3-70b-versatile", topK: 5 }; }
}

function logQuery(confidence: number, latency: number) {
  if (typeof window === "undefined") return;
  try {
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    log.push({ confidence, latency, ts: Date.now() });
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-200)));
  } catch {}
}

const MODEL_NAMES: Record<string, string> = {
  "llama-3.3-70b-versatile": "LLaMA 3.3 70B",
  "llama-3.1-8b-instant":    "LLaMA 3.1 8B",
  "llama3-8b-8192":          "LLaMA 3 8B",
};

const SUGGESTIONS = [
  "What are the main findings?",
  "Summarize the methodology",
  "What limitations does the study acknowledge?",
  "What are the key contributions?",
];

// Renders **bold**, *italic*, and newlines — no external library needed
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 14, color: C.text, lineHeight: 1.78 }}>
      {lines.map((line, li) => {
        // Parse inline bold/italic
        const parts: React.ReactNode[] = [];
        let rest = line;
        let key = 0;

        // Replace **bold** and *italic*
        const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(rest)) !== null) {
          if (m.index > last) parts.push(<span key={key++}>{rest.slice(last, m.index)}</span>);
          if (m[0].startsWith("**")) {
            parts.push(<strong key={key++} style={{ fontWeight: 700, color: C.text }}>{m[2]}</strong>);
          } else {
            parts.push(<em key={key++}>{m[3]}</em>);
          }
          last = m.index + m[0].length;
        }
        if (last < rest.length) parts.push(<span key={key++}>{rest.slice(last)}</span>);

        // Numbered list lines
        const isNumbered = /^\d+\.\s/.test(line);
        const isBullet = /^[-•]\s/.test(line);

        if (isNumbered || isBullet) {
          return (
            <div key={li} style={{ display: "flex", gap: 9, marginBottom: 6 }}>
              <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0, minWidth: 18 }}>
                {isNumbered ? line.match(/^\d+/)?.[0] + "." : "•"}
              </span>
              <span>{parts.length > 0 ? parts : rest.replace(/^(\d+\.|-|•)\s/, "")}</span>
            </div>
          );
        }

        if (line.trim() === "") return <div key={li} style={{ height: 8 }} />;
        return <p key={li} style={{ margin: "0 0 6px" }}>{parts.length > 0 ? parts : line}</p>;
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

function AiMessage({ msg }: { msg: Message }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: "86%", display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ ...S.card, padding: "16px 20px" }}>
        <RenderMarkdown text={msg.content} />
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
        {msg.flags !== undefined && msg.flags.length === 0 && (
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={13} color={C.green} />
            <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Fully grounded · No hallucinations detected</span>
          </div>
        )}
        {msg.flags !== undefined && msg.flags.length > 0 && (
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={13} color={C.orange} />
            <span style={{ fontSize: 11, color: C.orange, fontWeight: 600 }}>{msg.flags.length} unsupported claim{msg.flags.length > 1 ? "s" : ""} detected</span>
          </div>
        )}
      </div>
      {msg.citations && msg.citations.length > 0 && (
        <div>
          <button onClick={() => setOpen(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, color: C.accent,
            background: "rgba(91,94,244,0.08)", border: "none",
            borderRadius: 8, padding: "6px 13px", cursor: "pointer", fontFamily: "inherit", marginBottom: 7,
          }}>
            <BookOpen size={12} /> {msg.citations.length} source{msg.citations.length > 1 ? "s" : ""}
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} style={{ display: "flex", flexDirection: "column", gap: 7, overflow: "hidden" }}>
                {msg.citations.map(c => <CitationCard key={c.id} c={c} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [settings, setSettings] = useState({ model: "llama-3.3-70b-versatile", topK: 5 });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSettings(getSettings()); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput(""); setError("");
    setMessages(m => [...m, { id: Date.now().toString(), role: "user", content: q }]);
    setLoading(true);
    const t0 = Date.now();
    try {
      const res = await fetch(`${API}/generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top_k: settings.topK, model: settings.model, verify: false }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const latency = (Date.now() - t0) / 1000;
      const conf = data.confidence_score ?? 0;
      logQuery(conf, latency);
      setMessages(m => [...m, {
        id: Date.now().toString() + "r", role: "assistant",
        content: data.answer,
        citations: data.citations,
        confidence: conf,
        flags: data.hallucination_flags || [],
        latency,
      }]);
    } catch (e: any) {
      setError(e.message || "Failed to fetch. Make sure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", maxHeight: "100vh", overflow: "hidden" }}>

        {/* Header */}
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
              <Link href="/settings" style={{ textDecoration: "none" }}>
                <button style={{ ...S.btnSecondary, padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  <Settings size={13} /> Settings
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 36px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 && (
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
              ) : <AiMessage msg={msg} />}
            </div>
          ))}

          {loading && (
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.4 }} style={{
              padding: "12px 16px", borderRadius: 13,
              background: C.surface, border: `1px solid ${C.border}`,
              display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
            }}>
              <Loader2 size={14} color={C.accent} />
              <span style={{ fontSize: 13, color: C.textMuted }}>Retrieving and generating…</span>
            </motion.div>
          )}

          {error && (
            <div style={{ padding: "11px 15px", borderRadius: 10, background: C.redBg, border: `1px solid rgba(220,38,38,0.2)`, display: "flex", alignItems: "center", gap: 9, alignSelf: "flex-start" }}>
              <AlertTriangle size={15} color={C.red} />
              <span style={{ fontSize: 13, color: C.red }}>{error}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
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
              whileHover={{ scale: input.trim() && !loading ? 1.07 : 1 }}
              whileTap={{ scale: 0.93 }}
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 48, height: 48, borderRadius: 11, flexShrink: 0,
                background: input.trim() && !loading ? "#111110" : "rgba(0,0,0,0.10)",
                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "default",
                transition: "background 0.18s",
              }}
            >
              <Send size={18} color={input.trim() && !loading ? "#ffffff" : "#9a9590"} />
            </motion.button>
          </div>
          <div style={{ marginTop: 7, fontSize: 11, color: "#9a9590" }}>
            Grounded in ingested documents · Enter to send · Shift+Enter for new line
          </div>
        </div>
      </main>
    </div>
  );
}