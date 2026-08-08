"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";
import { S, C } from "@/lib/styles";
import Skeleton from "@/components/ui/Skeleton";
import { evalReportQueryKey, useEvalReport, useRunEvalReport } from "@/lib/queries/generations";
import { useJob } from "@/lib/queries/jobs";
import { toast } from "@/lib/toast";
import {
  RefreshCw, Target, CheckCircle2, Hash, TrendingUp,
  PlayCircle, Loader2, AlertTriangle, RotateCcw,
} from "lucide-react";

type ParsedSummary = {
  questionsEvaluated: string | null;
  recall: { hits: string; total: string; pct: string; ciLow: string; ciHigh: string } | null;
  mrr: string | null;
  groundedness: { supported: string; total: string; pct: string; ciLow: string; ciHigh: string } | null;
};

function parseSummary(md: string): ParsedSummary {
  const questionsMatch = md.match(/Questions evaluated:\s*(\d+)/);

  const recallMatch = md.match(
    /\*\*Recall@5\*\*:\s*(\d+)\/(\d+)\s*=\s*([\d.]+)%\s*\(95% Wilson CI:\s*([\d.]+)%\s*-\s*([\d.]+)%\)/
  );

  const mrrMatch = md.match(/\*\*Mean Reciprocal Rank \(MRR\)\*\*:\s*([\d.]+)/);

  const groundMatch = md.match(
    /\*\*Groundedness rate\*\*:\s*(\d+)\/(\d+) claims supported\s*=\s*([\d.]+)%\s*\(95% Wilson CI:\s*([\d.]+)%\s*-\s*([\d.]+)%\)/
  );

  return {
    questionsEvaluated: questionsMatch ? questionsMatch[1] : null,
    recall: recallMatch
      ? { hits: recallMatch[1], total: recallMatch[2], pct: recallMatch[3], ciLow: recallMatch[4], ciHigh: recallMatch[5] }
      : null,
    mrr: mrrMatch ? mrrMatch[1] : null,
    groundedness: groundMatch
      ? { supported: groundMatch[1], total: groundMatch[2], pct: groundMatch[3], ciLow: groundMatch[4], ciHigh: groundMatch[5] }
      : null,
  };
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 24, color: C.text, marginTop: 6, marginBottom: 14 }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 19, color: C.text, marginTop: 26, marginBottom: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 18, marginBottom: 8 }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.7, marginBottom: 10 }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: "6px 0 16px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>{children}</ul>
  ),
  li: ({ children }) => (
    <li style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.6 }}>{children}</li>
  ),
  strong: ({ children }) => <strong style={{ color: C.text, fontWeight: 700 }}>{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontWeight: 600, textDecoration: "underline" }}>
      {children}
    </a>
  ),
  hr: () => <div style={{ ...S.divider, margin: "18px 0" }} />,
  code: ({ children }) => (
    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 5, color: C.text }}>
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 18 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 640 }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={{ position: "sticky", top: 0, background: C.surface, zIndex: 1 }}>{children}</thead>,
  th: ({ children }) => (
    <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", color: C.textSec, verticalAlign: "top" }}>
      {children}
    </td>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
};

export default function EvaluationPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, isError, error, refetch } = useEvalReport();
  const runMutation = useRunEvalReport();
  const [jobId, setJobId] = useState<string | null>(null);
  const jobQuery = useJob(jobId, { enabled: jobId !== null });

  const summary = useMemo(() => (data ? parseSummary(data.content) : null), [data]);
  const loading = isLoading || isRefetching;
  const errorMessage = isError ? (error instanceof Error ? error.message : "Evaluation report not found.") : null;

  const jobStatus = jobQuery.data?.status ?? null;
  const isRunning =
    runMutation.isPending ||
    (jobId !== null && jobStatus !== "complete" && jobStatus !== "failed" && jobStatus !== "cancelled");

  useEffect(() => {
    if (!jobId || !jobQuery.data) return;
    if (jobQuery.data.status === "complete") {
      toast.success("Evaluation complete", "The report has been regenerated with fresh results.");
      queryClient.invalidateQueries({ queryKey: evalReportQueryKey });
      setJobId(null);
    } else if (jobQuery.data.status === "failed") {
      toast.error("Evaluation failed", jobQuery.data.error || "The evaluation run did not complete successfully.");
      setJobId(null);
    } else if (jobQuery.data.status === "cancelled") {
      toast.info("Evaluation cancelled");
      setJobId(null);
    }
  }, [jobQuery.data, jobId, queryClient]);

  async function handleRerun() {
    try {
      const res = await runMutation.mutateAsync();
      setJobId(res.job_id);
      toast.info("Evaluation started", "This ingests the sample dataset and runs the full harness. It can take a minute or two.");
    } catch (err) {
      toast.error("Could not start evaluation", err instanceof Error ? err.message : "Please try again.");
    }
  }

  const statCards = [
    {
      label: "Recall@5",
      value: summary?.recall ? `${summary.recall.pct}%` : "—",
      sub: summary?.recall ? `${summary.recall.hits}/${summary.recall.total} · CI ${summary.recall.ciLow}%–${summary.recall.ciHigh}%` : "no data",
      icon: Target,
    },
    {
      label: "Groundedness Rate",
      value: summary?.groundedness ? `${summary.groundedness.pct}%` : "—",
      sub: summary?.groundedness ? `${summary.groundedness.supported}/${summary.groundedness.total} claims · CI ${summary.groundedness.ciLow}%–${summary.groundedness.ciHigh}%` : "no data",
      icon: CheckCircle2,
    },
    {
      label: "Mean MRR",
      value: summary?.mrr ?? "—",
      sub: "reciprocal rank",
      icon: TrendingUp,
    },
    {
      label: "Questions Evaluated",
      value: summary?.questionsEvaluated ?? "—",
      sub: "from dataset.json",
      icon: Hash,
    },
  ];

  return (
    <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto", background: C.bg }}>
      <style>{`
        .pr-eval-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
        .pr-eval-actions { display:flex; gap:10px; margin-top:8px; flex-wrap:wrap; }
        .pr-eval-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
        @media (max-width: 900px) {
          .pr-eval-stats { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width: 560px) {
          .pr-eval-header { flex-direction:column; }
          .pr-eval-actions { width:100%; }
          .pr-eval-actions > button { flex:1; justify-content:center; }
          .pr-eval-stats { grid-template-columns:1fr; }
        }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <div className="pr-eval-header">
          <div>
            <span style={{ ...S.tagIndigo, marginBottom: 12, display: "inline-block" }}>Evaluation</span>
            <h1 style={{ ...S.heading, fontSize: 38, marginTop: 10, marginBottom: 6 }}>System Evaluation</h1>
            <p style={{ color: C.textSec, fontSize: 15 }}>
              Results from the backend evaluation harness{data?.generated_at ? ` · generated ${new Date(data.generated_at).toLocaleString()}` : ""}.
            </p>
          </div>
          <div className="pr-eval-actions">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              onClick={() => refetch()} disabled={loading || isRunning}
              style={{ ...S.btnSecondary, display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={13} style={{ animation: loading ? "spin 0.7s linear infinite" : "none" }} />
              Reload Report
            </motion.button>
            <motion.button whileHover={{ scale: isRunning ? 1 : 1.04 }} whileTap={{ scale: isRunning ? 1 : 0.95 }}
              onClick={handleRerun} disabled={isRunning}
              style={isRunning ? S.btnPrimaryDisabled : { ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
              {isRunning ? (
                <>
                  <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />
                  Running evaluation…
                </>
              ) : (
                <>
                  <PlayCircle size={13} />
                  Re-run Evaluation
                </>
              )}
            </motion.button>
          </div>
        </div>

        {isRunning && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px", borderRadius: 12, background: "rgba(91,94,244,0.06)", border: "1px solid rgba(91,94,244,0.15)", marginBottom: 28 }}>
            <Loader2 size={16} color={C.accent} style={{ animation: "spin 0.7s linear infinite" }} />
            <p style={{ fontSize: 13.5, color: C.textSec }}>
              Evaluation job {jobId ? <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>{jobId.slice(0, 8)}</code> : null} is {jobStatus ?? "starting"}. The report below will refresh automatically once it finishes.
            </p>
          </div>
        )}

        {loading && (
          <>
            <div className="pr-eval-stats">
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ ...S.card, padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  </div>
                  <Skeleton className="mb-2 h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
            <div style={{ ...S.card, padding: 26 }}>
              <Skeleton className="mb-3 h-5 w-40" />
              <Skeleton className="mb-6 h-3 w-72" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </>
        )}

        {!loading && errorMessage && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "18px 20px", borderRadius: 12, background: "rgba(212,98,42,0.06)", border: "1px solid rgba(212,98,42,0.15)", marginBottom: 28 }}>
            <AlertTriangle size={16} color={C.orange} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, color: C.textSec, marginBottom: 12 }}>
                <strong style={{ color: C.text }}>{errorMessage}</strong> Use the <strong style={{ color: C.text }}>Re-run Evaluation</strong> button above to generate a fresh report.
              </p>
              <button
                onClick={() => refetch()}
                disabled={loading || isRunning}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.orange, background: "rgba(212,98,42,0.1)", border: "none", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontFamily: "inherit" }}
              >
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !errorMessage && !data && (
          <div style={{ textAlign: "center", padding: "70px 24px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Target size={22} color={C.textMuted} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>No evaluation report yet</div>
            <p style={{ fontSize: 13.5, color: C.textMuted, maxWidth: 380, margin: "0 auto 20px" }}>
              Run the evaluation harness to generate recall, groundedness, and MRR metrics for your workspace.
            </p>
            <motion.button whileHover={{ scale: isRunning ? 1 : 1.04 }} whileTap={{ scale: isRunning ? 1 : 0.95 }}
              onClick={handleRerun} disabled={isRunning}
              style={isRunning ? S.btnPrimaryDisabled : { ...S.btnPrimary, margin: "0 auto", display: "inline-flex" }}>
              <PlayCircle size={13} />
              Run Evaluation
            </motion.button>
          </div>
        )}

        {!loading && !errorMessage && data && (
          <>
            <div className="pr-eval-stats">
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
                <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 20, color: C.text, marginBottom: 3 }}>Full Report</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>Rendered directly from the markdown produced by backend/eval/evaluate.py</div>
              </div>
              <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {data.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          </>
        )}

      </motion.div>
    </main>
  );
}