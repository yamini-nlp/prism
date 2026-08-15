"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Database,
  FileSearch,
  GitBranch,
  Layers,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SplitSquareVertical,
  Upload,
  X,
  Zap,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Architecture", href: "#architecture" },
  { label: "Inside the app", href: "#product" },
];

const TRUST_STRIP = [
  { label: "Retrieval", value: "Hybrid dense + BM25" },
  { label: "Generation", value: "Llama 3.3 70B on Groq" },
  { label: "Verification", value: "Claim-level, per sentence" },
  { label: "Transparency", value: "Full source trace" },
];

const PROBLEMS = [
  {
    n: "01",
    t: "Sources pile up, understanding doesn't",
    d: "Papers, reports, and long documents accumulate faster than anyone can actually read them, and the useful parts are buried in the middle of pages nobody reopens.",
  },
  {
    n: "02",
    t: "Generic chat answers aren't accountable",
    d: "Ordinary AI chat produces fluent answers with no link back to a source, so every claim has to be manually re-verified before anyone can trust it.",
  },
  {
    n: "03",
    t: "Keyword search misses the point",
    d: "Plain keyword search returns pages that contain the words but not the meaning, forcing manual skimming to find the passage that actually answers the question.",
  },
  {
    n: "04",
    t: "Verification is left as homework",
    d: "Even when an answer looks right, checking it against the original material is a separate, tedious step most workflows quietly skip.",
  },
];

const STAGES = [
  {
    n: "01",
    t: "Ingest",
    d: "Upload a PDF, DOCX, DOC, or TXT file, fetch a URL, or paste raw text. Content is checked against its file signature, chunked, and embedded with all-MiniLM-L6-v2 in a background job you can track stage by stage.",
    icon: Upload,
  },
  {
    n: "02",
    t: "Retrieve",
    d: "A query runs against dense vector search and BM25 keyword search in parallel. Results are fused with reciprocal rank fusion, then reordered by a cross-encoder reranker for the final top-k chunks.",
    icon: Search,
  },
  {
    n: "03",
    t: "Generate",
    d: "Llama 3.3 70B on Groq answers strictly from the retrieved chunks. Every stated fact carries an inline source marker, e.g. [1][2], tied back to the exact chunk it came from.",
    icon: Sparkles,
  },
  {
    n: "04",
    t: "Verify",
    d: "The answer is split into individual claims and matched against the retrieved context by token overlap. Each claim is labeled supported, uncertain, or unsupported with a confidence score.",
    icon: ShieldCheck,
  },
];

const FEATURES = [
  {
    t: "Multi-format ingestion",
    d: "PDF, DOCX, DOC, TXT, URLs, and pasted text all flow through the same chunking and embedding pipeline, tracked through a background job so nothing blocks the interface while it runs.",
    icon: Upload,
    big: true,
  },
  {
    t: "Structured summarization",
    d: "TLDR, key concepts, methodology, results, and limitations returned as one structured summary instead of a wall of text.",
    icon: Layers,
  },
  {
    t: "Hybrid retrieval",
    d: "Dense embeddings and BM25 keyword search fused with reciprocal rank fusion, then reordered by a cross-encoder reranker.",
    icon: SplitSquareVertical,
  },
  {
    t: "Claim-level verification",
    d: "Every sentence in an answer is scored and labeled supported, uncertain, or unsupported against its retrieved evidence.",
    icon: ShieldCheck,
  },
  {
    t: "Retrieval transparency",
    d: "Inspect the exact chunks, source documents, and similarity scores that produced every answer, not just the final text.",
    icon: FileSearch,
  },
  {
    t: "Evaluation harness",
    d: "Run recall, groundedness, and MRR metrics against your own workspace whenever you need a system-level accuracy check.",
    icon: BarChart3,
    big: true,
  },
];

const ARCHITECTURE_FLOW = [
  { t: "User query", d: "A question enters the workspace in plain language." },
  { t: "Dense + BM25 retrieval", d: "Vector similarity and keyword search run in parallel over the workspace's ingested chunks." },
  { t: "Reciprocal rank fusion", d: "The two ranked result sets are merged into a single fused ranking." },
  { t: "Cross-encoder reranking", d: "A cross-encoder scores the fused candidates directly against the query for the final top-k." },
  { t: "Grounded generation", d: "Llama 3.3 70B on Groq answers strictly from the retrieved chunks, with inline citation markers." },
  { t: "Claim verification", d: "Each sentence is split out and checked against the retrieved context, then labeled with a confidence score." },
];

const PRODUCT_PAGES = [
  { label: "Dashboard", icon: LayoutDashboard, d: "Live metrics across documents, generations, and verifications, plus latency and pass-rate charts." },
  { label: "Ingest", icon: Upload, d: "Add sources by upload, URL, or pasted text, with background jobs tracked through each stage." },
  { label: "Library", icon: BookOpen, d: "Every ingested document, searchable by title and sortable by size and chunk count." },
  { label: "Workspace", icon: MessageSquare, d: "Query your research in plain language and get answers grounded in your documents." },
  { label: "Source Trace", icon: GitBranch, d: "See the retrieved chunks, their sources, and similarity scores behind any answer." },
  { label: "Verification", icon: ShieldCheck, d: "Review each claim in an answer, labeled supported, uncertain, or unsupported." },
  { label: "Evaluation", icon: BarChart3, d: "Run the evaluation harness for recall, groundedness, and MRR across your workspace." },
  { label: "Settings", icon: Settings, d: "Manage your account, profile, and password from one place." },
];

const DIFFERENTIATORS = [
  {
    t: "Grounded, not generic",
    d: "Answers are constrained to what your ingested documents actually say, with every fact traceable to a chunk instead of the model's general knowledge.",
    icon: FileSearch,
  },
  {
    t: "Retrieval you can inspect",
    d: "Source Trace exposes the exact chunks, documents, and similarity scores behind an answer, so grounding is checkable, not just claimed.",
    icon: Search,
  },
  {
    t: "Verification built in, not bolted on",
    d: "Claim-level scoring runs as part of the pipeline itself, labeling each sentence supported, uncertain, or unsupported before you read it.",
    icon: ShieldCheck,
  },
  {
    t: "Measured, not assumed",
    d: "The built-in evaluation harness runs recall, groundedness, and MRR against your own workspace whenever you want a system-level check.",
    icon: BarChart3,
  },
];

const STACK = [
  { t: "Next.js", d: "Frontend application and routing", icon: Layers },
  { t: "FastAPI", d: "Backend API and job orchestration", icon: Database },
  { t: "PostgreSQL", d: "Persistent storage for documents, chunks, and results", icon: Database },
  { t: "all-MiniLM-L6-v2", d: "Sentence embeddings for dense retrieval", icon: SplitSquareVertical },
  { t: "BM25", d: "Lexical keyword retrieval, fused with dense search", icon: Search },
  { t: "Cross-encoder reranker", d: "Final relevance reordering of fused candidates", icon: SplitSquareVertical },
  { t: "Llama 3.3 70B / Groq", d: "Grounded answer generation from retrieved context", icon: Sparkles },
  { t: "JWT sessions", d: "Signed, session-scoped authentication on every request", icon: Lock },
];

const USE_CASES = [
  {
    t: "Researchers",
    d: "Move through papers and reports faster, with every summary and answer traceable back to the exact passage it came from.",
  },
  {
    t: "Students",
    d: "Ask direct questions about assigned readings and get answers that cite the source material instead of a paraphrase to double-check.",
  },
  {
    t: "Knowledge workers",
    d: "Turn a folder of internal documents into a queryable workspace, with claim-level verification standing in for a manual re-read.",
  },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  };
}

const PAGE_BG = "#08080a";
const SURFACE = "#0e0e11";
const SURFACE_RAISED = "#131317";
const HAIRLINE = "rgba(255,255,255,0.09)";
const HAIRLINE_STRONG = "rgba(255,255,255,0.16)";

const btnPrimary =
  "inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-[13.5px] font-semibold text-black no-underline transition-opacity hover:opacity-85";
const btnSecondary =
  "inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-[13.5px] font-medium text-white no-underline transition-colors hover:border-white/40";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden font-sans text-white"
      style={{ background: PAGE_BG, colorScheme: "dark" }}
    >
      <style>{`
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        .prism-noise::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `}</style>

      <header
        className="sticky top-0 z-50 flex h-16 items-center justify-between px-5 backdrop-blur-md sm:px-8 lg:px-14"
        style={{ background: "rgba(8,8,10,0.82)", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white">
            <Zap size={15} color="#08080a" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl tracking-tight text-white">Prism</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-white/55 no-underline transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/login" style={{ borderColor: HAIRLINE_STRONG }} className={btnSecondary}>
            Sign in
          </Link>
          <Link href="/register" className={`${btnPrimary} gap-1.5`}>
            Get started <ArrowRight size={14} color="#08080a" />
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white md:hidden"
        >
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-x-0 top-16 z-40 flex flex-col gap-4 px-5 pb-7 pt-5 sm:px-8 md:hidden"
          style={{ background: PAGE_BG, borderBottom: `1px solid ${HAIRLINE}` }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-[15px] text-white no-underline"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-1 flex gap-2.5">
            <Link href="/login" style={{ borderColor: HAIRLINE_STRONG }} className={`${btnSecondary} flex-1`}>
              Sign in
            </Link>
            <Link href="/register" className={`${btnPrimary} flex-1`}>
              Get started
            </Link>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:px-8 lg:px-14 lg:pt-28">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[680px]"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 50% 0%, rgba(91,94,244,0.16), transparent 70%), radial-gradient(ellipse 40% 35% at 92% 10%, rgba(212,98,42,0.08), transparent 60%)",
          }}
        />

        <div className="relative mx-auto grid max-w-[1220px] gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div {...fadeUp(0)}>
            <span
              className="mb-7 inline-flex items-center rounded-full px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ background: "rgba(125,128,246,0.14)", color: "#a3a6f8" }}
            >
              Research intelligence platform
            </span>

            <h1
              style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
              className="max-w-[620px] font-display text-[clamp(38px,6vw,64px)] leading-[1.04] tracking-[-0.03em] text-white"
            >
              Read less.
              <br />
              Know <em className="not-italic" style={{ color: "#a3a6f8" }}>more.</em>
            </h1>

            <p className="mt-6 max-w-[490px] text-[16px] leading-[1.7] text-white/60">
              Prism turns papers, reports, and raw text into grounded, citation-backed answers.
              Every claim is checked against its retrieved source and scored before it reaches you.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className={`${btnPrimary} gap-2 !px-6 !py-3 text-[15px]`}>
                Start Research <ArrowRight size={16} color="#08080a" />
              </Link>
              <Link href="/login" style={{ borderColor: HAIRLINE_STRONG }} className={`${btnSecondary} gap-2 !px-6 !py-3 text-[15px]`}>
                Sign in <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="mt-14 grid max-w-[560px] grid-cols-2 gap-y-6 pt-6 sm:grid-cols-4" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
              {TRUST_STRIP.map((s, i) => (
                <div key={s.label} className={i > 0 ? "pl-5 sm:border-l" : ""} style={i > 0 ? { borderColor: HAIRLINE } : undefined}>
                  <div className="font-mono text-[12.5px] font-medium leading-snug tracking-[-0.01em] text-white">{s.value}</div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white/45">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="relative">
            <div
              className="overflow-hidden rounded-lg"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 30px 70px -20px rgba(0,0,0,0.7)" }}
            >
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${HAIRLINE}`, background: SURFACE_RAISED }}>
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-2 rounded-full px-3 py-1 font-mono text-[10.5px] text-white/50" style={{ background: "rgba(255,255,255,0.05)" }}>
                  prism.app/workspace
                </span>
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div className="ml-auto max-w-[78%] rounded-xl rounded-tr-sm bg-white px-4 py-2.5 text-[13px] text-black">
                  What did the ablation study find?
                </div>

                <div
                  className="max-w-[92%] rounded-xl rounded-tl-sm px-4 py-3 text-[13px] leading-relaxed text-white/80"
                  style={{ border: `1px solid ${HAIRLINE}`, background: SURFACE_RAISED }}
                >
                  Removing the reranking stage reduced retrieval precision by a measurable margin
                  <span className="font-mono font-semibold" style={{ color: "#a3a6f8" }}>[1]</span>, while the
                  hybrid dense and keyword setup outperformed either method alone
                  <span className="font-mono font-semibold" style={{ color: "#a3a6f8" }}>[2]</span>.
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10.5px] text-white/55"
                    style={{ border: `1px solid ${HAIRLINE}` }}
                  >
                    [1] ablation_results.pdf · 0.91
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10.5px] text-white/55"
                    style={{ border: `1px solid ${HAIRLINE}` }}
                  >
                    [2] retrieval_ablation.pdf · 0.87
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-3 gap-2 pt-4" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
                  <div className="rounded-md px-3 py-2" style={{ background: "rgba(61,153,112,0.14)" }}>
                    <div className="font-mono text-[15px] font-bold" style={{ color: "#69d3a8" }}>82%</div>
                    <div className="font-mono text-[9px] font-bold uppercase tracking-wide" style={{ color: "rgba(105,211,168,0.8)" }}>Supported</div>
                  </div>
                  <div className="rounded-md px-3 py-2" style={{ background: "rgba(212,98,42,0.14)" }}>
                    <div className="font-mono text-[15px] font-bold" style={{ color: "#eea173" }}>12%</div>
                    <div className="font-mono text-[9px] font-bold uppercase tracking-wide" style={{ color: "rgba(238,161,115,0.8)" }}>Uncertain</div>
                  </div>
                  <div className="rounded-md px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="font-mono text-[15px] font-bold text-white/75">6%</div>
                    <div className="font-mono text-[9px] font-bold uppercase tracking-wide text-white/45">Unsupported</div>
                  </div>
                </div>

                <div className="flex items-end gap-1.5 pt-4" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
                  {[38, 62, 46, 80, 58, 70, 90].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{ height: `${h * 0.44}px`, background: "linear-gradient(180deg,#a3a6f8,#5b5ef4)", opacity: 0.9 }}
                    />
                  ))}
                </div>
                <div className="font-mono text-[9.5px] uppercase tracking-wide text-white/40">
                  Generation volume, last 7 days
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="problem" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-14 max-w-[640px]">
          <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
            The problem
          </div>
          <h2
            style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
            className="font-display text-[clamp(28px,4.2vw,44px)] leading-[1.08] tracking-[-0.03em] text-white"
          >
            Research is slow because trust is expensive.
          </h2>
          <p className="mt-5 text-[15px] leading-[1.7] text-white/55">
            Reading everything takes too long. Trusting a fluent AI answer without a source takes a
            different kind of too long, once you count the time spent checking it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.n}
              {...fadeUp(i * 0.06)}
              className="flex flex-col gap-3 rounded-lg p-6"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE}` }}
            >
              <span className="font-mono text-[12px] text-white/30">{p.n}</span>
              <h3 className="text-[15.5px] font-semibold text-white">{p.t}</h3>
              <p className="text-[13px] leading-[1.65] text-white/55">{p.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        className="px-5 py-24 sm:px-8 lg:px-14"
        style={{ background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <motion.div {...fadeUp(0)}>
            <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
              What is Prism?
            </div>
            <h2
              style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
              className="font-display text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-0.03em] text-white"
            >
              A research assistant that shows its work.
            </h2>
          </motion.div>

          <motion.div {...fadeUp(0.08)} className="flex flex-col gap-6 text-[15px] leading-[1.75] text-white/65">
            <p>
              Prism is a retrieval-augmented research platform. You ingest documents, ask questions in
              plain language, and get answers generated strictly from what you uploaded, not from the
              model&apos;s general knowledge.
            </p>
            <p>
              Every answer carries inline citations back to the exact chunk it was drawn from, and every
              sentence in that answer is independently checked against the retrieved evidence and labeled
              supported, uncertain, or unsupported.
            </p>
            <p>
              It exists for anyone who works from documents and needs the answer and the receipt in the
              same place: researchers, students, and knowledge workers moving through papers, reports, and
              long-form material.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-12">
          <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
            Capabilities
          </div>
          <h2
            style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
            className="max-w-[620px] font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-white"
          >
            A complete research intelligence stack.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.t}
              {...fadeUp(i * 0.05)}
              className={`flex min-h-[160px] flex-col gap-3.5 rounded-lg p-6 ${f.big ? "sm:col-span-2" : "sm:col-span-1"}`}
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE}` }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: "rgba(125,128,246,0.14)" }}>
                <f.icon size={15} style={{ color: "#a3a6f8" }} />
              </div>
              <div className="text-[14.5px] font-semibold text-white">{f.t}</div>
              <div className="text-[13px] leading-[1.6] text-white/55">{f.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pipeline" className="px-5 py-24 sm:px-8 lg:px-14" style={{ background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="mx-auto max-w-[1180px]">
          <motion.div {...fadeUp(0)} className="mb-14 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
                How it works
              </div>
              <h2
                style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
                className="max-w-[640px] font-display text-[clamp(28px,4.2vw,44px)] leading-[1.08] tracking-[-0.03em] text-white"
              >
                From raw source to verified insight.
              </h2>
            </div>
          </motion.div>

          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="pointer-events-none absolute left-0 right-0 top-[52px] hidden lg:block"
              style={{ height: 1, background: HAIRLINE }}
            />
            {STAGES.map((s, i) => (
              <motion.div
                key={s.n}
                {...fadeUp(i * 0.07)}
                className="relative flex min-h-[220px] flex-col gap-3.5 rounded-lg p-6"
                style={{ background: SURFACE_RAISED, border: `1px solid ${HAIRLINE}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] text-white/30">{s.n}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <s.icon size={14} className="text-white/70" />
                  </div>
                </div>
                <h3
                  style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
                  className="font-display text-[22px] tracking-[-0.01em] text-white"
                >
                  {s.t}
                </h3>
                <p className="text-[13px] leading-[1.65] text-white/55">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-14 max-w-[680px]">
          <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
            Retrieval architecture
          </div>
          <h2
            style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
            className="font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-white"
          >
            Engineered retrieval, not a wrapper around an LLM.
          </h2>
          <p className="mt-5 text-[15px] leading-[1.7] text-white/55">
            Every answer passes through a fixed pipeline of retrieval and verification stages before it
            reaches the interface. Nothing here is a single prompt to a model.
          </p>
        </motion.div>

        <div className="mx-auto flex max-w-[640px] flex-col">
          {ARCHITECTURE_FLOW.map((step, i) => (
            <motion.div key={step.t} {...fadeUp(i * 0.05)} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold text-white"
                  style={{ background: SURFACE_RAISED, border: `1px solid ${HAIRLINE_STRONG}` }}
                >
                  {i + 1}
                </div>
                {i < ARCHITECTURE_FLOW.length - 1 && (
                  <div className="w-px flex-1" style={{ background: HAIRLINE, minHeight: 34 }} />
                )}
              </div>
              <div className="flex-1 pb-9">
                <div className="pt-1 text-[15px] font-semibold text-white">{step.t}</div>
                <div className="mt-1.5 text-[13px] leading-[1.65] text-white/55">{step.d}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="product" className="px-5 py-24 sm:px-8 lg:px-14" style={{ background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="mx-auto max-w-[1180px]">
          <motion.div {...fadeUp(0)} className="mb-12">
            <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
              Inside the app
            </div>
            <h2
              style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
              className="max-w-[620px] font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-white"
            >
              Eight workspaces, one pipeline.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_PAGES.map((p, i) => (
              <motion.div
                key={p.label}
                {...fadeUp(i * 0.04)}
                className="flex flex-col gap-3 rounded-lg p-6"
                style={{ background: SURFACE_RAISED, border: `1px solid ${HAIRLINE}` }}
              >
                <p.icon size={16} className="text-white/55" />
                <div className="text-[13.5px] font-semibold text-white">{p.label}</div>
                <div className="text-[12px] leading-[1.6] text-white/50">{p.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-12 max-w-[620px]">
          <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
            Why Prism
          </div>
          <h2
            style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
            className="font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-white"
          >
            Different from a chat window pointed at your files.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {DIFFERENTIATORS.map((d, i) => (
            <motion.div
              key={d.t}
              {...fadeUp(i * 0.06)}
              className="flex gap-4 rounded-lg p-6"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE}` }}
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md" style={{ background: "rgba(255,255,255,0.06)" }}>
                <d.icon size={16} className="text-white/70" />
              </div>
              <div>
                <div className="text-[14.5px] font-semibold text-white">{d.t}</div>
                <div className="mt-1.5 text-[13px] leading-[1.6] text-white/55">{d.d}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:px-14" style={{ background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="mx-auto max-w-[1180px]">
          <motion.div {...fadeUp(0)} className="mb-12 max-w-[620px]">
            <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
              Built on
            </div>
            <h2
              style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
              className="font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-white"
            >
              A real pipeline underneath the interface.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.map((s, i) => (
              <motion.div
                key={s.t}
                {...fadeUp(i * 0.03)}
                className="flex flex-col gap-3 rounded-lg p-5"
                style={{ background: SURFACE_RAISED, border: `1px solid ${HAIRLINE}` }}
              >
                <s.icon size={15} className="text-white/50" />
                <div className="font-mono text-[12.5px] font-semibold text-white">{s.t}</div>
                <div className="text-[11.5px] leading-[1.55] text-white/45">{s.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-12 max-w-[620px]">
          <div className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
            Who it&apos;s for
          </div>
          <h2
            style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
            className="font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-white"
          >
            Built for anyone who works from documents.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {USE_CASES.map((u, i) => (
            <motion.div
              key={u.t}
              {...fadeUp(i * 0.06)}
              className="flex flex-col gap-3 rounded-lg p-6"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE}` }}
            >
              <div className="text-[15px] font-semibold text-white">{u.t}</div>
              <div className="text-[13px] leading-[1.65] text-white/55">{u.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:px-14" style={{ background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <motion.div {...fadeUp(0)} className="flex items-start gap-4 sm:max-w-[520px]">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md" style={{ background: "rgba(255,255,255,0.06)" }}>
              <Lock size={17} className="text-white/70" />
            </div>
            <div>
              <div className="text-[15.5px] font-semibold text-white">Session-scoped by design</div>
              <p className="mt-1.5 text-[13px] leading-[1.65] text-white/55">
                Every request carries a signed JWT session, and protected workspace routes stay
                inaccessible until you&apos;re authenticated.
              </p>
            </div>
          </motion.div>
          <motion.div {...fadeUp(0.06)} className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/35">
            Signed sessions · Protected routes
          </motion.div>
        </div>
      </section>

      <section
        id="workflow"
        className="flex justify-center px-5 py-24 text-center sm:px-8 lg:px-14"
      >
        <motion.div {...fadeUp(0)} className="max-w-[760px]">
          <span
            className="mb-7 inline-flex items-center rounded-full px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]"
            style={{ background: "rgba(125,128,246,0.14)", color: "#a3a6f8" }}
          >
            Ready when you are
          </span>
          <h2
            style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)" }}
            className="mb-5 font-display text-[clamp(30px,5vw,52px)] leading-[1.06] tracking-[-0.03em] text-white"
          >
            Research shouldn&apos;t be a <em className="not-italic" style={{ color: "#a3a6f8" }}>guessing game.</em>
          </h2>
          <p className="mb-9 text-[15px] text-white/55">
            Ingest your first document and see every answer traced back to its source.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className={`${btnPrimary} gap-2 !px-6 !py-3 text-[15px]`}>
              Create account <ArrowRight size={16} color="#08080a" />
            </Link>
            <Link href="/login" style={{ borderColor: HAIRLINE_STRONG }} className={`${btnSecondary} !px-6 !py-3 text-[15px]`}>
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      <footer
        className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-6 sm:px-8 lg:px-14"
        style={{ borderTop: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
            <Zap size={12} color="#08080a" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[15px] text-white/55">Prism</span>
        </div>
        <div className="flex flex-wrap gap-6">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="font-mono text-[12px] text-white/40 no-underline">
              {l.label}
            </a>
          ))}
        </div>
        <span className="font-mono text-[11px] text-white/35">Research Intelligence Platform</span>
      </footer>
    </div>
  );
}