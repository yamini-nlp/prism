"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { S, C } from "@/lib/styles";
import { ArrowRight, FileText, MessageSquare, Clock, TrendingUp, Plus, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const STORAGE_KEY = "prism_query_log";

type QueryLog = { confidence: number; latency: number; ts: number }[];

function getQueryLog(): QueryLog {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

const quickLinks = [
  { href: "/ingest",       label: "Ingest a document",  desc: "Upload PDF, DOCX, or paste text",   color: "#5b5ef4", tag: "Start here" },
  { href: "/workspace",    label: "Ask a question",      desc: "Query your research library",        color: "#3b82f6", tag: "Core" },
  { href: "/verification", label: "Verify an answer",    desc: "Check for hallucinations",           color: "#3d9970", tag: "Safety" },
  { href: "/evaluation",   label: "View evaluation",     desc: "Metrics and system performance",     color: "#d4622a", tag: "Analytics" },
];

export default function DashboardPage() {
  const [docCount,    setDocCount]    = useState<number | null>(null);
  const [queryCount,  setQueryCount]  = useState(0);
  const [avgConf,     setAvgConf]     = useState<number | null>(null);
  const [avgLatency,  setAvgLatency]  = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  async function loadStats() {
    setRefreshing(true);
    try {
      const res = await fetch(`${API}/retrieve/?query=a&top_k=1`);
      if (res.ok) {
        const data = await res.json();
        setDocCount(data.count > 0 ? data.count : 0);
      }
    } catch {
      setDocCount(0);
    }
    const log = getQueryLog();
    setQueryCount(log.length);
    if (log.length > 0) {
      setAvgConf(Math.round(log.reduce((s, q) => s + q.confidence, 0) / log.length));
      setAvgLatency(+(log.reduce((s, q) => s + q.latency, 0) / log.length).toFixed(2));
    } else {
      setAvgConf(null);
      setAvgLatency(null);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadStats(); }, []);

  const stats = [
    {
      label: "Documents Ingested",
      value: loading ? "…" : docCount === null ? "0" : String(docCount),
      icon: FileText,
      hint: docCount === 0 || docCount === null ? "Add documents in Ingest" : `${docCount} chunk${docCount !== 1 ? "s" : ""} indexed`,
      color: "#5b5ef4",
    },
    {
      label: "Queries Run",
      value: String(queryCount),
      icon: MessageSquare,
      hint: queryCount === 0 ? "Ask questions in Workspace" : `${queryCount} total`,
      color: "#3b82f6",
    },
    {
      label: "Avg. Confidence",
      value: avgConf !== null ? `${avgConf}%` : "—",
      icon: TrendingUp,
      hint: avgConf === null ? "Run queries to see scores" : "Based on your queries",
      color: "#3d9970",
    },
    {
      label: "Avg. Latency",
      value: avgLatency !== null ? `${avgLatency}s` : "—",
      icon: Clock,
      hint: avgLatency === null ? "Tracked per query" : "Per query average",
      color: "#d4622a",
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <span style={{ ...S.tagIndigo, marginBottom: 12, display: "inline-block" }}>Dashboard</span>
              <h1 style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: 40, letterSpacing: "-0.022em",
                color: C.text, lineHeight: 1.1, marginBottom: 8,
              }}>
                Welcome to Prism
                <br />
                <span style={{ fontStyle: "italic", color: C.textSec }}>your research workspace.</span>
              </h1>
              <p style={{ fontSize: 14, color: C.textMuted }}>
                Start by ingesting a document, then query and verify your research.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              onClick={loadStats}
              disabled={refreshing}
              style={{ ...S.btnSecondary, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </motion.button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 36 }}>
            {stats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{ ...S.card, padding: 22 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: s.color + "14", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={13} color={s.color} />
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 38, color: C.text, letterSpacing: "-0.02em", marginBottom: 5 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{s.hint}</div>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: C.text, marginBottom: 4 }}>Quick Actions</h2>
          <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 18 }}>Jump into any part of the workflow</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 40 }}>
            {quickLinks.map((q, i) => (
              <motion.div key={q.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                <Link href={q.href} style={{ textDecoration: "none" }}>
                  <motion.div whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(0,0,0,0.09)" }}
                    style={{ ...S.card, padding: 22, cursor: "pointer", transition: "all 0.18s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: q.color + "14", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ArrowRight size={16} color={q.color} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: q.color, background: q.color + "12", padding: "3px 8px", borderRadius: 5 }}>{q.tag}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 5 }}>{q.label}</div>
                    <div style={{ fontSize: 12.5, color: C.textMuted }}>{q.desc}</div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Banner */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ padding: "28px 32px", borderRadius: 18, background: C.text, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#fff", marginBottom: 6 }}>Ready to start?</div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)" }}>Ingest your first document to unlock the full Prism workflow.</div>
            </div>
            <Link href="/ingest" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", background: "#fff", color: C.text, border: "none", borderRadius: 11, fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                <Plus size={15} /> Ingest Document
              </button>
            </Link>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}