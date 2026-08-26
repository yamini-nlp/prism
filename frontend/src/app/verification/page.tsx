"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { S, C } from "@/lib/styles";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import EvidenceCard from "@/components/EvidenceCard";
import {
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Inbox,
  ArrowRight,
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

type ClaimLabel = "supported" | "unsupported" | "uncertain";

type GroundingClaim = {
  claim: string;
  label: string;
  confidence?: number;
  supporting_chunk?: string | null;
  source_chunk_index?: number | null;
};

type GenerationRecord = {
  id: string;
  query: string;
  content: string;
  citations: Citation[];
  confidence?: number;
  grounding: GroundingClaim[];
};

type Phase = "loading" | "ready" | "empty" | "error";

const STATUS_CFG: Record<ClaimLabel, { color: string; bg: string; border: string; icon: typeof CheckCircle; label: string }> = {
  supported: { color: C.green, bg: C.greenBg, border: "rgba(61,153,112,0.28)", icon: CheckCircle, label: "Supported" },
  uncertain: { color: C.orange, bg: C.orangeBg, border: "rgba(212,98,42,0.28)", icon: HelpCircle, label: "Uncertain" },
  unsupported: { color: C.red, bg: C.redBg, border: "rgba(220,38,38,0.28)", icon: XCircle, label: "Unsupported" },
};

function normalizeLabel(label: string): ClaimLabel {
  if (label === "supported" || label === "uncertain" || label === "unsupported") return label;
  return "unsupported";
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
      grounding: Array.isArray(m.grounding) ? m.grounding : [],
    });
  }
  return records.reverse();
}

function LoadingSkeleton() {
  return (
    <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto", background: C.bg }}>
      <style>{`@keyframes pr-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }`}</style>
      <div style={{ height: 14, width: 140, borderRadius: 6, background: C.border, animation: "pr-pulse 1.4s ease-in-out infinite", marginBottom: 14 }} />
      <div style={{ height: 30, width: 320, borderRadius: 8, background: C.border, animation: "pr-pulse 1.4s ease-in-out infinite", marginBottom: 24 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ height: 64, borderRadius: 12, background: C.border, animation: `pr-pulse 1.4s ease-in-out ${i * 0.12}s infinite` }} />
        ))}
      </div>
    </main>
  );
}

export default function VerificationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
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
  const claims = selected?.grounding ?? [];

  const supported = claims.filter(c => normalizeLabel(c.label) === "supported").length;
  const uncertain = claims.filter(c => normalizeLabel(c.label) === "uncertain").length;
  const unsupported = claims.length - supported - uncertain;
  const total = claims.length || 1;
  const groundingPct = Math.round((supported / total) * 100);

  const jumpToDocument = (source: string) => {
    router.push(`/library?doc=${encodeURIComponent(source)}`);
  };

  const evidenceSourceFor = (claim: GroundingClaim): Citation | null => {
    if (!selected || claim.source_chunk_index === null || claim.source_chunk_index === undefined) return null;
    return selected.citations[claim.source_chunk_index] || null;
  };

  if (phase === "loading") return <LoadingSkeleton />;

  return (
    <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto", background: C.bg }}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <span style={{ ...S.tagIndigo, marginBottom: 12 }}>Verification</span>
        <h1 style={{ ...S.heading, fontSize: 34, marginTop: 10, marginBottom: 8 }}>Answer Verification</h1>
        <p style={{ color: C.textSec, fontSize: 14.5, marginBottom: 24, maxWidth: 640 }}>
          Claim-by-claim grounding for a generated answer, with confidence scores and the exact source span backing each supported claim.
        </p>

        {phase === "error" && (
          <div style={{ padding: "16px 18px", borderRadius: 12, background: C.redBg, border: "1px solid rgba(220,38,38,0.2)", display: "flex", alignItems: "flex-start", gap: 10, maxWidth: 560 }}>
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
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Inbox size={22} color={C.textMuted} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>No generation selected yet</div>
            <p style={{ fontSize: 13.5, color: C.textMuted, maxWidth: 380, margin: "0 auto 20px" }}>
              Ask a question in Workspace first. Once Prism generates a grounded answer, its claim-by-claim verification will show up here.
            </p>
            <Link href="/workspace" style={{ textDecoration: "none" }}>
              <button style={S.btnPrimary}>
                Go to Workspace <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        )}

        {phase === "ready" && selected && (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 26, maxWidth: 720 }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <label htmlFor="verification-generation" style={{ ...S.label, display: "block", marginBottom: 6 }}>Generation</label>
                <select
                  id="verification-generation"
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
            </div>

            {claims.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 24px" }}>
                <ShieldCheck size={30} color={C.textMuted} style={{ margin: "0 auto 14px", display: "block" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 5 }}>No verification data recorded for this generation</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>Try regenerating the answer in Workspace to capture claim-level grounding.</div>
              </div>
            ) : (
              <>
                <div
                  className="ver-summary"
                  style={{
                    ...S.card,
                    padding: 24,
                    marginBottom: 24,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 20,
                    alignItems: "center",
                  }}
                >
                  <style>{`
                    @media (max-width: 720px) {
                      .ver-summary { grid-template-columns: 1fr 1fr !important; }
                    }
                  `}</style>
                  {[
                    { label: "Supported", count: supported, color: C.green, bg: C.greenBg },
                    { label: "Uncertain", count: uncertain, color: C.orange, bg: C.orangeBg },
                    { label: "Unsupported", count: unsupported, color: C.red, bg: C.redBg },
                  ].map(x => (
                    <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: x.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'DM Serif Display', Georgia, serif",
                          fontSize: 24,
                          fontWeight: 700,
                          color: x.color,
                          flexShrink: 0,
                        }}
                      >
                        {x.count}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: x.color }}>{x.label}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{Math.round((x.count / total) * 100)}% of claims</div>
                      </div>
                    </div>
                  ))}

                  <div style={{ textAlign: "center", padding: "0 12px" }}>
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 34, color: groundingPct >= 70 ? C.green : C.orange, lineHeight: 1 }}>
                      {groundingPct}%
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>grounded</div>
                  </div>
                </div>

                <div style={{ height: 6, borderRadius: 99, overflow: "hidden", background: "rgba(0,0,0,0.07)", display: "flex", marginBottom: 28, maxWidth: 720 }}>
                  <div style={{ width: `${(supported / total) * 100}%`, background: C.green }} />
                  <div style={{ width: `${(uncertain / total) * 100}%`, background: C.orange }} />
                  <div style={{ width: `${(unsupported / total) * 100}%`, background: C.red }} />
                </div>

                <div style={{ ...S.label, marginBottom: 14 }}>Claim-by-Claim Analysis</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 780 }}>
                  {claims.map((claim, i) => {
                    const label = normalizeLabel(claim.label);
                    const cfg = STATUS_CFG[label];
                    const Icon = cfg.icon;
                    const evidenceSource = evidenceSourceFor(claim);
                    const confidence = typeof claim.confidence === "number" ? claim.confidence : 0;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ padding: "16px 18px", borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                          <Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 8 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text, fontStyle: "italic" }}>"{claim.claim}"</span>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "2px 9px",
                                  borderRadius: 99,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  background: cfg.bg,
                                  color: cfg.color,
                                  border: `1px solid ${cfg.border}`,
                                }}
                              >
                                {cfg.label}
                              </span>
                              <ConfidenceBadge value={confidence} label="Confidence" size="sm" />
                            </div>

                            {evidenceSource && claim.supporting_chunk && (
                              <div style={{ marginTop: 8 }}>
                                <EvidenceCard
                                  title={evidenceSource.source}
                                  meta={`Chunk #${evidenceSource.chunk_index}`}
                                  score={evidenceSource.score}
                                  scoreLabel="Relevance"
                                  snippet={claim.supporting_chunk}
                                  quote
                                  onJump={() => jumpToDocument(evidenceSource.source)}
                                />
                              </div>
                            )}

                            {!evidenceSource && claim.supporting_chunk && (
                              <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.55, marginTop: 6, fontStyle: "italic" }}>
                                "{claim.supporting_chunk}"
                              </p>
                            )}

                            {label === "unsupported" && (
                              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                                No matching source span was found for this claim.
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </motion.div>
    </main>
  );
}
