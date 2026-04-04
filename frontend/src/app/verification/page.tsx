"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { S, C } from "@/lib/styles";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Loader2, AlertCircle, Info } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Status = "grounded" | "partial" | "ungrounded";
type Claim  = { claim: string; status: Status; source: string | null; explanation: string; };

const CFG: Record<Status, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
  grounded:   { color: C.green,  bg: C.greenBg,  icon: CheckCircle,   label: "Grounded" },
  partial:    { color: C.orange, bg: C.orangeBg, icon: AlertTriangle,  label: "Partial" },
  ungrounded: { color: C.red,    bg: C.redBg,    icon: XCircle,        label: "Hallucination" },
};

export default function VerificationPage() {
  const [answer,    setAnswer]    = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [claims,    setClaims]    = useState<Claim[]>([]);
  const [error,     setError]     = useState("");

  const run = async () => {
    if (!answer.trim()) return;
    setAnalyzing(true); setClaims([]); setError("");
    try {
      const res = await fetch(`${API}/generate/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: answer, top_k: 5, verify: true }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.claim_analysis?.length > 0) {
        setClaims(data.claim_analysis);
      } else {
        setError("No claims extracted. Ingest documents first, then paste an AI-generated answer here to verify it.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch. Make sure the backend is running on port 8000.");
    } finally {
      setAnalyzing(false);
    }
  };

  const g = claims.filter(c => c.status === "grounded").length;
  const p = claims.filter(c => c.status === "partial").length;
  const u = claims.filter(c => c.status === "ungrounded").length;
  const total = claims.length || 1;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          <span style={{ ...S.tagIndigo, marginBottom: 12 }}>Verification</span>
          <h1 style={{ ...S.heading, fontSize: 38, marginTop: 10, marginBottom: 6 }}>Answer Verification</h1>
          <p style={{ color: C.textSec, fontSize: 15, marginBottom: 8 }}>
            Paste any AI-generated answer below. Prism will check each claim against your ingested documents.
          </p>

          {/* How to use hint */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 9,
            padding: "11px 15px", borderRadius: 10,
            background: "rgba(91,94,244,0.06)", border: "1px solid rgba(91,94,244,0.14)",
            marginBottom: 28,
          }}>
            <Info size={15} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.55 }}>
              <strong style={{ color: C.text }}>How to use:</strong> First ingest your research documents, then ask a question in Workspace, copy the answer, and paste it here to verify every claim against your sources.
            </p>
          </div>

          {/* Full-width input section */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", ...S.label, marginBottom: 10 }}>
              Answer to Verify
            </label>
            <textarea
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1.5px solid rgba(0,0,0,0.18)",
                borderRadius: 14,
                padding: "16px 18px",
                fontSize: 14.5,
                color: C.text,
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.7,
                minHeight: 180,
                transition: "border-color 0.18s",
              }}
              placeholder="Paste an AI-generated answer or any paragraph of claims you want verified against your ingested research…"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = "#5b5ef4"; }}
              onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(0,0,0,0.18)"; }}
            />

            {/* Char count + button row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>
                {answer.length} characters
                {answer.length > 0 && answer.length < 30 && " — paste a longer answer for better results"}
              </span>
              <motion.button
                whileHover={{ scale: analyzing ? 1 : 1.02 }}
                whileTap={{ scale: analyzing ? 1 : 0.97 }}
                onClick={run}
                disabled={analyzing || !answer.trim()}
                style={analyzing || !answer.trim() ? S.btnPrimaryDisabled : S.btnPrimary}
              >
                {analyzing
                  ? <><Loader2 size={14} className="spin" /> Analyzing claims…</>
                  : <><ShieldCheck size={14} /> Run Verification</>
                }
              </motion.button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: C.redBg, border: `1px solid rgba(220,38,38,0.2)`,
              display: "flex", alignItems: "center", gap: 9, marginBottom: 24,
            }}>
              <AlertCircle size={15} color={C.red} />
              <span style={{ fontSize: 13, color: C.red }}>{error}</span>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {claims.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

                {/* Summary bar */}
                <div style={{
                  ...S.card, padding: 24, marginBottom: 24,
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 20, alignItems: "center",
                }}>
                  {[
                    { label: "Grounded",    count: g, color: C.green,  bg: C.greenBg  },
                    { label: "Partial",     count: p, color: C.orange, bg: C.orangeBg },
                    { label: "Hallucinated",count: u, color: C.red,    bg: C.redBg    },
                  ].map(x => (
                    <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: x.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'DM Serif Display', Georgia, serif",
                        fontSize: 24, fontWeight: 700, color: x.color,
                        flexShrink: 0,
                      }}>
                        {x.count}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: x.color }}>{x.label}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>
                          {Math.round((x.count / total) * 100)}% of claims
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Overall score */}
                  <div style={{ textAlign: "center", padding: "0 12px" }}>
                    <div style={{
                      fontFamily: "'DM Serif Display', Georgia, serif",
                      fontSize: 36, color: g / total > 0.7 ? C.green : C.orange,
                      lineHeight: 1,
                    }}>
                      {Math.round((g / total) * 100)}%
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>grounded</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 99, overflow: "hidden", background: "rgba(0,0,0,0.07)", display: "flex", marginBottom: 28 }}>
                  <div style={{ width: `${(g / total) * 100}%`, background: C.green, transition: "width 0.6s ease" }} />
                  <div style={{ width: `${(p / total) * 100}%`, background: C.orange, transition: "width 0.6s ease" }} />
                  <div style={{ width: `${(u / total) * 100}%`, background: C.red,    transition: "width 0.6s ease" }} />
                </div>

                {/* Claim-by-claim */}
                <div style={{ ...S.label, marginBottom: 14 }}>Claim-by-Claim Analysis</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {claims.map((claim, i) => {
                    const c = CFG[claim.status];
                    const Icon = c.icon;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ padding: "16px 18px", borderRadius: 12, background: c.bg, border: `1px solid ${c.color}20` }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                          <Icon size={16} color={c.color} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 7 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text, fontStyle: "italic" }}>
                                "{claim.claim}"
                              </span>
                              <span style={{
                                display: "inline-flex", alignItems: "center", padding: "2px 9px",
                                borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                                background: c.bg, color: c.color, border: `1px solid ${c.color}28`,
                              }}>
                                {c.label}
                              </span>
                            </div>
                            <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.55 }}>
                              {claim.explanation}
                            </p>
                            {claim.source && (
                              <div style={{ marginTop: 8, fontSize: 11, color: c.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                <ShieldCheck size={11} /> {claim.source}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </main>
    </div>
  );
}