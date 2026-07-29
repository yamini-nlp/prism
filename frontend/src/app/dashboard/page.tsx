"use client";

import { useEffect, useMemo, useState } from "react";
import { animate, motion } from "framer-motion";
import Link from "next/link";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line,
} from "recharts";
import { S, C } from "@/lib/styles";
import Skeleton from "@/components/ui/Skeleton";
import { useDocuments } from "@/lib/queries/documents";
import { useEvalReport } from "@/lib/queries/generations";
import { useAnalyticsSummary } from "@/lib/queries/analytics";
import {
  FileText, MessageSquare, ShieldCheck, Loader2,
  Plus, RefreshCw, AlertTriangle, Gauge, Activity,
} from "lucide-react";

function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

function cumulative(points: { date: string; count: number }[]) {
  let running = 0;
  return points.map((p) => {
    running += p.count;
    return { date: p.date, total: running };
  });
}

function formatDateLabel(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function parseEvalRows(md: string) {
  const rows: { index: string; supportedRate: number }[] = [];
  for (const line of md.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((_, i, arr) => i !== 0 && i !== arr.length - 1);
    if (cells.length !== 9) continue;
    if (!/^\d+$/.test(cells[0])) continue;
    const rate = parseFloat(cells[8]);
    if (Number.isNaN(rate)) continue;
    rows.push({ index: cells[0], supportedRate: rate });
  }
  return rows;
}

function parseEvalGroundedness(md: string): number | null {
  const match = md.match(/\*\*Groundedness rate\*\*:\s*\d+\/\d+ claims supported\s*=\s*([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
}

function ChartCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ ...S.card, padding: 22 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{title}</div>
        {hint && <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ width: "100%", height: 220 }}>{children}</div>
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12.5 }}>
      {label}
    </div>
  );
}

const tooltipStyle = {
  background: "#ffffff",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 12,
  color: C.text,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

export default function DashboardPage() {
  const documentsQuery = useDocuments();
  const analyticsQuery = useAnalyticsSummary();
  const evalQuery = useEvalReport();

  const isLoading = documentsQuery.isLoading || analyticsQuery.isLoading;
  const isRefetching = documentsQuery.isRefetching || analyticsQuery.isRefetching;
  const isError = documentsQuery.isError || analyticsQuery.isError;

  const analytics = analyticsQuery.data;

  const documentsSeries = useMemo(
    () => (analytics ? cumulative(analytics.documents.over_time).map((p) => ({ label: formatDateLabel(p.date), total: p.total })) : []),
    [analytics]
  );

  const generationSeries = useMemo(
    () => (analytics ? analytics.generations.over_time.map((p) => ({ label: formatDateLabel(p.date), count: p.count })) : []),
    [analytics]
  );

  const latencySeries = useMemo(() => {
    if (!analytics) return [];
    return analytics.requests.by_route
      .filter((r) => r.request_count > 0)
      .map((r) => ({
        label: r.route.replace("/api/v1", "").replace(/\/$/, "") || r.route,
        p50: r.p50_latency_ms,
        p95: r.p95_latency_ms,
      }));
  }, [analytics]);

  const liveVerificationSeries = useMemo(
    () => (analytics ? analytics.verifications.over_time.map((p) => ({ label: formatDateLabel(p.date), count: p.count })) : []),
    [analytics]
  );

  const evalRows = useMemo(() => (evalQuery.data ? parseEvalRows(evalQuery.data.content) : []), [evalQuery.data]);
  const evalGroundedness = useMemo(() => (evalQuery.data ? parseEvalGroundedness(evalQuery.data.content) : null), [evalQuery.data]);

  const hasLiveVerifications = (analytics?.verifications.total ?? 0) > 0;
  const hasDocuments = (analytics?.documents.total ?? documentsQuery.data?.length ?? 0) > 0;
  const hasGenerations = (analytics?.generations.total ?? 0) > 0;
  const showEmptyState = !isLoading && !isError && !hasDocuments && !hasGenerations;

  const statCards = [
    {
      label: "Total Documents",
      value: analytics?.documents.total ?? 0,
      decimals: 0,
      suffix: "",
      icon: FileText,
      color: "#5b5ef4",
    },
    {
      label: "Total Generations",
      value: analytics?.generations.total ?? 0,
      decimals: 0,
      suffix: "",
      icon: MessageSquare,
      color: "#3b82f6",
    },
    {
      label: "Avg. Verification Confidence",
      value: analytics?.verifications.average_grounding_score ?? evalGroundedness ?? 0,
      decimals: 1,
      suffix: "%",
      icon: ShieldCheck,
      color: "#3d9970",
      unavailable: analytics?.verifications.average_grounding_score == null && evalGroundedness == null,
    },
    {
      label: "Active Jobs",
      value: analytics?.active_jobs ?? 0,
      decimals: 0,
      suffix: "",
      icon: Gauge,
      color: "#d4622a",
    },
  ];

  return (
    <main style={{ flex: 1, padding: "40px 48px", overflowY: "auto", background: C.bg }}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ ...S.tagIndigo, marginBottom: 12, display: "inline-block" }}>Dashboard</span>
            <h1 style={{ ...S.heading, fontSize: 40, marginTop: 10, marginBottom: 8 }}>
              Welcome to Prism
              <br />
              <span style={{ fontStyle: "italic", color: C.textSec }}>your analytics overview.</span>
            </h1>
            <p style={{ fontSize: 14, color: C.textMuted }}>
              Live metrics from your documents, generations, and verifications.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
            onClick={() => { documentsQuery.refetch(); analyticsQuery.refetch(); evalQuery.refetch(); }}
            disabled={isRefetching}
            style={{ ...S.btnSecondary, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={13} style={{ animation: isRefetching ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </motion.button>
        </div>

        {isError && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderRadius: 12, background: C.redBg, border: "1px solid rgba(220,38,38,0.2)", marginBottom: 28 }}>
            <AlertTriangle size={16} color={C.red} />
            <div style={{ flex: 1, fontSize: 13.5, color: C.text }}>
              Couldn't load your analytics. The backend may be unreachable.
            </div>
            <button
              onClick={() => { documentsQuery.refetch(); analyticsQuery.refetch(); }}
              style={{ ...S.btnSecondary, padding: "7px 14px", fontSize: 12.5 }}
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ marginBottom: 36 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ ...S.card, padding: 22 }}>
                <Skeleton className="mb-4 h-3 w-24" />
                <Skeleton className="mb-2 h-9 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ marginBottom: 36 }}>
            {statCards.map((s, i) => (
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
                <div style={{ ...S.heading, fontSize: 38, marginBottom: 5 }}>
                  {s.unavailable ? "—" : <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} />}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {s.label === "Total Documents" && "Across your session"}
                  {s.label === "Total Generations" && "Queries answered"}
                  {s.label === "Avg. Verification Confidence" && (analytics?.verifications.average_grounding_score != null ? "From live verifications" : evalGroundedness != null ? "From offline eval report" : "Run a verification to see this")}
                  {s.label === "Active Jobs" && "Currently processing"}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {showEmptyState && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...S.card, padding: "50px 32px", textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Activity size={20} color={C.textMuted} />
            </div>
            <div style={{ ...S.heading, fontSize: 22, marginBottom: 8 }}>No activity yet</div>
            <p style={{ fontSize: 13.5, color: C.textMuted, maxWidth: 380, margin: "0 auto 22px" }}>
              Ingest your first document to start populating your analytics overview.
            </p>
            <Link href="/ingest" style={{ textDecoration: "none" }}>
              <button style={{ ...S.btnPrimary, margin: "0 auto" }}>
                <Plus size={15} /> Ingest Document
              </button>
            </Link>
          </motion.div>
        )}

        {!isLoading && !isError && !showEmptyState && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" style={{ marginBottom: 40 }}>

            <ChartCard title="Documents Ingested Over Time" hint="Cumulative total across your session">
              {documentsSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={documentsSeries} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="docGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5b5ef4" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#5b5ef4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="total" stroke="#5b5ef4" strokeWidth={2} fill="url(#docGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <ChartEmpty label="No documents ingested yet" />}
            </ChartCard>

            <ChartCard title="Generation Volume" hint="Queries answered per day">
              {generationSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generationSeries} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <ChartEmpty label="No generations run yet" />}
            </ChartCard>

            <ChartCard title="Request Latency by Route" hint="p50 / p95 latency in milliseconds since server start">
              {latencySeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latencySeries} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="p50" fill="#3d9970" radius={[6, 6, 0, 0]} name="p50 (ms)" />
                    <Bar dataKey="p95" fill="#d4622a" radius={[6, 6, 0, 0]} name="p95 (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <ChartEmpty label="No requests recorded yet" />}
            </ChartCard>

            <ChartCard
              title="Hallucination / Verification Pass Rate"
              hint={hasLiveVerifications ? "Verifications run per day" : evalRows.length > 0 ? "Supported claim rate per evaluation question" : undefined}
            >
              {hasLiveVerifications && liveVerificationSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={liveVerificationSeries} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#3d9970" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : evalRows.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evalRows} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="index" tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="supportedRate" stroke="#3d9970" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : evalQuery.isLoading ? (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.textMuted }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading evaluation report…
                </div>
              ) : (
                <ChartEmpty label="Run a verification or the offline eval harness to see this" />
              )}
            </ChartCard>

          </div>
        )}

      </motion.div>
    </main>
  );
}