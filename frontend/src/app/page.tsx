"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Menu,
  Settings,
  ShieldCheck,
  Upload,
  X,
  Zap,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Pipeline", href: "#pipeline" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Inside the app", href: "#product" },
];

const STAGES = [
  {
    n: "01",
    t: "Ingest",
    d: "Upload a PDF, DOCX, DOC, or TXT file, fetch a URL, or paste raw text. Content is checked against its file signature, chunked, and embedded with all-MiniLM-L6-v2 in a background job you can track stage by stage.",
  },
  {
    n: "02",
    t: "Retrieve",
    d: "A query runs against dense vector search and BM25 keyword search in parallel. Results are fused with reciprocal rank fusion, then reordered by a cross-encoder reranker for the final top-k chunks.",
  },
  {
    n: "03",
    t: "Generate",
    d: "Llama 3.3 70B on Groq answers strictly from the retrieved chunks. Every stated fact carries an inline source marker, e.g. [1][2], tied back to the exact chunk it came from.",
  },
  {
    n: "04",
    t: "Verify",
    d: "The answer is split into individual claims and matched against the retrieved context by token overlap. Each claim is labeled supported, uncertain, or unsupported with a confidence score.",
  },
];

const FEATURES = [
  {
    t: "Multi-format ingestion",
    d: "PDF, DOCX, DOC, TXT, URLs, and pasted text all flow through the same chunking and embedding pipeline.",
    big: true,
  },
  { t: "Structured summarization", d: "TLDR, key concepts, methodology, results, and limitations returned as one structured summary." },
  { t: "Hybrid retrieval", d: "Dense embeddings and BM25 fused with reciprocal rank fusion, then cross-encoder reranked." },
  { t: "Claim-level verification", d: "Every claim in an answer scored and labeled against its supporting evidence." },
  { t: "Retrieval transparency", d: "Inspect the exact chunks, sources, and similarity scores behind every answer." },
  {
    t: "Evaluation harness",
    d: "Run recall, groundedness, and MRR metrics against your workspace whenever you need a system-level check.",
    big: true,
  },
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

const NUMBERS = [
  ["04", "Pipeline stages"],
  ["Hybrid", "Retrieval method"],
  ["Groq", "Inference runtime"],
  ["JWT", "Session security"],
];

const CHART_BARS = [38, 62, 46, 80, 58, 70, 90];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  };
}

const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-[14px] font-medium no-underline transition-opacity hover:opacity-90";
const btnPrimaryStyle = { color: "#0a0a0a" };
const btnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] px-5 py-2.5 text-[14px] font-medium no-underline transition-colors hover:bg-white/[0.08]";
const btnSecondaryStyle = { color: "#ffffff" };

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-950 font-sans text-white">
      <style>{`
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-neutral-950/85 px-5 backdrop-blur-md sm:px-8 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white">
            <Zap size={15} className="text-neutral-950" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl tracking-tight text-white">Prism</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-neutral-400 no-underline transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/login" style={btnSecondaryStyle} className={btnSecondary}>
            Sign in
          </Link>
          <Link href="/register" style={btnPrimaryStyle} className={`${btnPrimary} gap-1.5`}>
            Get started <ArrowRight size={14} />
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white md:hidden"
        >
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 flex flex-col gap-4 border-b border-white/10 bg-neutral-950 px-5 pb-7 pt-5 sm:px-8 md:hidden">
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
            <Link href="/login" style={btnSecondaryStyle} className={`${btnSecondary} flex-1`}>
              Sign in
            </Link>
            <Link href="/register" style={btnPrimaryStyle} className={`${btnPrimary} flex-1`}>
              Get started
            </Link>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden px-5 pb-24 pt-20 sm:px-8 lg:px-14 lg:pt-28">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
          style={{ background: "radial-gradient(ellipse 60% 55% at 50% 0%, rgba(91,94,244,0.16), transparent 70%)" }}
        />

        <div className="relative mx-auto grid max-w-[1220px] gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div {...fadeUp(0)}>
            <span className="mb-7 inline-flex items-center rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-brand-300">
              Research intelligence platform
            </span>

            <h1 className="max-w-[620px] font-display text-[clamp(38px,6vw,64px)] leading-[1.04] tracking-[-0.03em] text-white">
              Read less.
              <br />
              Know <em className="text-brand-400 not-italic">more.</em>
            </h1>

            <p className="mt-6 max-w-[490px] text-[16px] leading-[1.7] text-neutral-300">
              Prism turns papers, reports, and raw text into grounded, citation-backed answers.
              Every claim is checked against its retrieved source and scored before it reaches you.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" style={btnPrimaryStyle} className={`${btnPrimary} gap-2 !px-6 !py-3 text-[15px]`}>
                Start Research <ArrowRight size={16} />
              </Link>
              <Link href="/login" style={btnSecondaryStyle} className={`${btnSecondary} gap-2 !px-6 !py-3 text-[15px]`}>
                Sign in <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="mt-14 grid max-w-[560px] grid-cols-2 gap-y-6 border-t border-white/10 pt-6 sm:grid-cols-4">
              {NUMBERS.map(([val, label], i) => (
                <div key={label} className={i > 0 ? "border-white/10 pl-5 sm:border-l" : ""}>
                  <div className="font-mono text-[19px] font-medium tracking-[-0.01em] text-white">{val}</div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-400">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ml-2 rounded-full bg-white/5 px-3 py-1 font-mono text-[10.5px] text-neutral-400">
                  prism.app/workspace
                </span>
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div className="ml-auto max-w-[78%] rounded-xl rounded-tr-sm bg-white px-4 py-2.5 text-[13px] text-neutral-950">
                  What did the ablation study find?
                </div>

                <div className="max-w-[92%] rounded-xl rounded-tl-sm border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] leading-relaxed text-neutral-200">
                  Removing the reranking stage reduced retrieval precision by a measurable margin
                  <span className="font-mono text-brand-300">[1]</span>, while the
                  hybrid dense and keyword setup outperformed either method alone
                  <span className="font-mono text-brand-300">[2]</span>.
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10.5px] text-neutral-400">
                    [1] ablation_results.pdf · 0.91
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10.5px] text-neutral-400">
                    [2] retrieval_ablation.pdf · 0.87
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                  <div className="rounded-lg bg-success-500/10 px-3 py-2">
                    <div className="font-mono text-[15px] font-semibold text-success-500">82%</div>
                    <div className="font-mono text-[9px] uppercase tracking-wide text-success-500/80">Supported</div>
                  </div>
                  <div className="rounded-lg bg-accent-500/10 px-3 py-2">
                    <div className="font-mono text-[15px] font-semibold text-accent-400">12%</div>
                    <div className="font-mono text-[9px] uppercase tracking-wide text-accent-400/80">Uncertain</div>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="font-mono text-[15px] font-semibold text-neutral-300">6%</div>
                    <div className="font-mono text-[9px] uppercase tracking-wide text-neutral-400">Unsupported</div>
                  </div>
                </div>

                <div className="flex items-end gap-1.5 border-t border-white/10 pt-4">
                  {CHART_BARS.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${h * 0.44}px`,
                        background: "linear-gradient(180deg,#7d80f6,#5b5ef4)",
                        opacity: 0.85,
                      }}
                    />
                  ))}
                </div>
                <div className="font-mono text-[9.5px] uppercase tracking-wide text-neutral-500">
                  Generation volume, last 7 days
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="pipeline" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-14 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              How it works
            </div>
            <h2 className="max-w-[640px] font-display text-[clamp(28px,4.2vw,44px)] leading-[1.08] tracking-[-0.03em] text-white">
              From raw source to verified insight.
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp(i * 0.07)}
              className="flex min-h-[210px] flex-col gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <span className="font-mono text-[12px] text-neutral-500">{s.n}</span>
              <h3 className="font-display text-[22px] tracking-[-0.01em] text-white">{s.t}</h3>
              <p className="text-[13px] leading-[1.65] text-neutral-400">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1180px] px-5 pb-24 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-12">
          <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            Capabilities
          </div>
          <h2 className="max-w-[620px] font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-white">
            A complete research intelligence stack.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.t}
              {...fadeUp(i * 0.05)}
              className={`flex min-h-[150px] flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 ${
                f.big ? "sm:col-span-2" : "sm:col-span-1"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500/15">
                <Check size={15} className="text-brand-300" />
              </div>
              <div className="text-[14.5px] font-semibold text-white">{f.t}</div>
              <div className="text-[13px] leading-[1.6] text-neutral-400">{f.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="product" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1180px]">
          <motion.div {...fadeUp(0)} className="mb-12">
            <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              Inside the app
            </div>
            <h2 className="max-w-[620px] font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-white">
              Eight workspaces, one pipeline.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_PAGES.map((p, i) => (
              <motion.div
                key={p.label}
                {...fadeUp(i * 0.04)}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p.icon size={16} className="text-neutral-400" />
                <div className="text-[13.5px] font-semibold text-white">{p.label}</div>
                <div className="text-[12px] leading-[1.6] text-neutral-400">{p.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="flex justify-center border-t border-white/10 px-5 py-24 text-center sm:px-8 lg:px-14"
      >
        <motion.div {...fadeUp(0)} className="max-w-[760px]">
          <span className="mb-7 inline-flex items-center rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-brand-300">
            Ready when you are
          </span>
          <h2 className="mb-5 font-display text-[clamp(30px,5vw,52px)] leading-[1.06] tracking-[-0.03em] text-white">
            Research shouldn&apos;t be a <em className="text-brand-400 not-italic">guessing game.</em>
          </h2>
          <p className="mb-9 text-[15px] text-neutral-400">
            Ingest your first document and see every answer traced back to its source.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" style={btnPrimaryStyle} className={`${btnPrimary} gap-2 !px-6 !py-3 text-[15px]`}>
              Create account <ArrowRight size={16} />
            </Link>
            <Link href="/login" style={btnSecondaryStyle} className={`${btnSecondary} !px-6 !py-3 text-[15px]`}>
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3.5 border-t border-white/10 px-5 py-6 sm:px-8 lg:px-14">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
            <Zap size={12} className="text-neutral-950" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[15px] text-neutral-400">Prism</span>
        </div>
        <div className="flex flex-wrap gap-6">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="font-mono text-[12.5px] text-neutral-500 no-underline">
              {l.label}
            </a>
          ))}
        </div>
        <span className="font-mono text-[11px] text-neutral-600">Research Intelligence Platform</span>
      </footer>
    </div>
  );
}