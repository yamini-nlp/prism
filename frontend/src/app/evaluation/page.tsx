"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { S, C } from "@/lib/styles";
import { RefreshCw, Target, CheckCircle2, Hash, TrendingUp, HelpCircle, Loader2, AlertTriangle } from "lucide-react";
import { apiUrl, buildHeaders } from "@/lib/api";

type EvalRow = {
  index: string;
  question: string;
  expectedSource: string;
  hit: string;
  rank: string;
  mrr: string;
  claims: string;
  supported: string;
  supportedRate: string;
};

type ParsedReport = {
  questionsEvaluated: string | null;
  recall: { hits: string; total: string; pct: string; ciLow: string; ciHigh: string } | null;
  mrr: string | null;
  groundedness: { supported: string; total: string; pct: string; ciLow: string; ciHigh: string } | null;
  rows: EvalRow[];
};

function parseReport(md: string): ParsedReport {
  const questionsMatch = md.match(/Questions evaluated:\s*(\d+)/);

  const recallMatch = md.match(
    /\*\*Recall@5\*\*:\s*(\d+)\/(\d+)\s*=\s*([\d.]+)%\s*\(95% Wilson CI:\s*([\d.]+)%\s*-\s*([\d.]+)%\)/
  );

  const mrrMatch = md.match(/\*\*Mean Reciprocal Rank \(MRR\)\*\*:\s*([\d.]+)/);

  const groundMatch = md.match(
    /\*\*Groundedness rate\*\*:\s*(\d+)\/(\d+) claims supported\s*=\s*([\d.]+)%\s*\(95% Wilson CI:\s*([\d.]+)%\s*-\s*([\d.]+)%\)/
  );

  const rows: EvalRow[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i !== 0 && i !== arr.length - 1);
    if (cells.length !== 9) continue;
    if (!/^\d+$/.test(cells[0])) continue;
    rows.push({
      index: cells[0],
      question: cells[1],
      expectedSource: cells[2],
      hit: cells[3],
      rank: cells[4],
      mrr: cells[5],
      claims: cells[6],
      supported: cells[7],
      supportedRate: cells[8],
    });
  }

  return {
    questionsEvaluated: questionsMatch ? questionsMatch[1] : null,
    recall: recallMatch
      ? { hits: recallMatch[1], total: recallMatch[2], pct: recallMatch[3], ciLow: recallMatch[4], ciHigh: recallMatch[5] }
      : null,
    mrr: mrrMatch ? mrrMatch[1] : null,
    groundedness: groundMatch
      ? { supported: groundMatch[1], total: groundMatch[2], pct: groundMatch[3], ciLow: groundMatch[4], ciHigh: groundMatch[5] }
      : null,
    rows,
  };
}

export default function EvaluationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [report, setReport] = useState<ParsedReport | null>(null);

  const fetchReport = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(apiUrl("/eval-report"), { headers: buildHeaders() })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || "Evaluation report not found.");
        }
        return res.json();
      })
      .then((data) => {
        setReport(parseReport(data.content));
        setGeneratedAt(data.generated_at);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const statCards = [
    {
      label: "Recall@5",
      value: report?.recall ? `${report.recall.pct}%` : "—",
      sub: report?.recall ? `${report.recall.hits}/${report.recall.total} · CI ${report.recall.ciLow}%–${report.recall.ciHigh}%` : "no data",
      icon: Target,
    },
    {
      label: "Groundedness Rate",
      value: report?.groundedness ? `${report.groundedness.pct}%` : "—",
      sub: report?.groundedness ? `${report.groundedness.supported}/${report.groundedness.total} claims · CI ${report.groundedness.ciLow}%–${report.groundedness.ciHigh}%` : "no data",
      icon: CheckCircle2,
    },
    {
      label: "Mean MRR",
      value: report?.mrr ?? "—",
      sub: "reciprocal rank",
      icon: TrendingUp,
    },
    {
      label: "Questions Evaluated",
      value: report?.questionsEvaluated ?? "—",
      sub: "from dataset.json",
      icon: Hash,
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <span style={{ ...S.tagIndigo, marginBottom: 12, display: "inline-block" }}>Evaluation</span>
              <h1 style={{ ...S.heading, fontSize: 38, marginTop: 10, marginBottom: 6 }}>System Evaluation</h1>
              <p style={{ color: C.textSec, fontSize: 15 }}>
                Results from the backend evaluation harness{generatedAt ? ` · generated ${new Date(generatedAt).toLocaleString()}` : ""}.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                onClick={fetchReport} disabled={loading}
                style={{ ...S.btnSecondary, display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={13} style={{ animation: loading ? "spin 0.7s linear infinite" : "none" }} />
                Reload Report
              </motion.button>
              <button
                disabled
                title="Evaluation is run via the backend script (python backend/eval/evaluate.py), not from this UI, in this version."
                style={{ ...S.btnPrimaryDisabled, display: "flex", alignItems: "center", gap: 6 }}>
                <HelpCircle size={13} />
                Re-run Evaluation
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px", borderRadius: 12, background: "rgba(91,94,244,0.06)", border: "1px solid rgba(91,94,244,0.15)", marginBottom: 28 }}>
              <Loader2 size={16} color={C.accent} style={{ animation: "spin 0.7s linear infinite" }} />
              <p style={{ fontSize: 13.5, color: C.textSec }}>Loading evaluation report…</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "18px 20px", borderRadius: 12, background: "rgba(212,98,42,0.06)", border: "1px solid rgba(212,98,42,0.15)", marginBottom: 28 }}>
              <AlertTriangle size={16} color={C.orange} style={{ marginTop: 1 }} />
              <p style={{ fontSize: 13.5, color: C.textSec }}>
                <strong style={{ color: C.text }}>{error}</strong> Run <code>python backend/eval/evaluate.py</code> from the backend directory to generate a report, then reload.
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
                {statCards.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ ...S.card, padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                      <m.icon size={13} color={C.textMuted} />
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 32, color: C.text, letterSpacing: "-0.02em", marginBottom: 5 }}>
                      {m.value}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{m.sub}</div>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                style={{ ...S.card, padding: 26 }}>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 20, color: C.text, marginBottom: 3 }}>Per-Question Results</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Retrieval hit and groundedness detail for each evaluation question</div>
                </div>

                {report && report.rows.length > 0 ? (
                  <div style={{ maxHeight: 460, overflowY: "auto", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                      <thead style={{ position: "sticky", top: 0, background: C.surface, zIndex: 1 }}>
                        <tr>
                          {["#", "Question", "Expected Source", "Hit@5", "Rank", "RR", "Claims", "Supported", "Supported %"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.08)", color: C.textMuted, fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.rows.map((row) => (
                          <tr key={row.index}>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.textSec }}>{row.index}</td>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.text, maxWidth: 320 }}>{row.question}</td>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.textSec }}>{row.expectedSource}</td>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                              <span style={row.hit === "yes" ? S.tagGreen : S.tagRed}>{row.hit}</span>
                            </td>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.textSec }}>{row.rank}</td>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.textSec }}>{row.mrr}</td>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.textSec }}>{row.claims}</td>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.textSec }}>{row.supported}</td>
                            <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.textSec }}>{row.supportedRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: C.textMuted }}>No per-question rows found in the report.</p>
                )}
              </motion.div>
            </>
          )}

        </motion.div>
      </main>
    </div>
  );
}