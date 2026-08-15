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
import { buttonVariants, cardVariants } from "@/lib/styles";
import Badge from "@/components/ui/Badge";

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

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 font-sans text-neutral-950 dark:bg-neutral-950 dark:text-white">
      <style>{`
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-neutral-200 bg-neutral-50/85 px-5 backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/85 sm:px-8 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-950 dark:bg-white">
            <Zap size={15} className="text-white dark:text-neutral-950" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl tracking-tight text-neutral-950 dark:text-white">Prism</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((l) => (
            
              key={l.label}
              href={l.href}
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-neutral-500 no-underline transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/login" className={buttonVariants({ variant: "secondary", size: "md", className: "no-underline" })}>
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "primary", size: "md", className: "no-underline gap-1.5" })}>
            Get started <ArrowRight size={14} />
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-950 dark:border-white/20 dark:text-white md:hidden"
        >
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 flex flex-col gap-4 border-b border-neutral-200 bg-neutral-50 px-5 pb-7 pt-5 dark:border-white/10 dark:bg-neutral-950 sm:px-8 md:hidden">
          {NAV_LINKS.map((l) => (
            
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-[15px] text-neutral-950 no-underline dark:text-white"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-1 flex gap-2.5">
            <Link href="/login" className={buttonVariants({ variant: "secondary", size: "md", className: "no-underline flex-1 justify-center" })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonVariants({ variant: "primary", size: "md", className: "no-underline flex-1 justify-center" })}>
              Get started
            </Link>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden px-5 pb-24 pt-20 sm:px-8 lg:px-14 lg:pt-28">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
          style={{ background: "radial-gradient(ellipse 60% 55% at 50% 0%, rgba(91,94,244,0.10), transparent 70%)" }}
        />

        <div className="relative mx-auto grid max-w-[1220px] gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div {...fadeUp(0)}>
            <Badge tone="brand" className="mb-7">
              Research intelligence platform
            </Badge>

            <h1 className="max-w-[620px] font-display text-[clamp(38px,6vw,64px)] leading-[1.04] tracking-[-0.03em] text-neutral-950 dark:text-white">
              Read less.
              <br />
              Know <em className="text-brand-500">more.</em>
            </h1>

            <p className="mt-6 max-w-[490px] text-[16px] leading-[1.7] text-neutral-600 dark:text-neutral-300">
              Prism turns papers, reports, and raw text into grounded, citation-backed answers.
              Every claim is checked against its retrieved source and scored before it reaches you.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className={buttonVariants({ variant: "primary", size: "lg", className: "no-underline gap-2" })}>
                Start Research <ArrowRight size={16} />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "secondary", size: "lg", className: "no-underline gap-2" })}>
                Sign in <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="mt-14 grid max-w-[560px] grid-cols-2 gap-y-6 border-t border-neutral-200 pt-6 dark:border-white/10 sm:grid-cols-4">
              {NUMBERS.map(([val, label], i) => (
                <div key={label} className={i > 0 ? "border-neutral-200 pl-5 dark:border-white/10 sm:border-l" : ""}>
                  <div className="font-mono text-[19px] font-medium tracking-[-0.01em] text-neutral-950 dark:text-white">{val}</div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="relative">
            <div className={cardVariants({ variant: "premium", padding: false, className: "overflow-hidden" })}>
              <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-white/20" />
                <span className="ml-2 rounded-full bg-neutral-100 px-3 py-1 font-mono text-[10.5px] text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
                  prism.app/workspace
                </span>
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div className="ml-auto max-w-[78%] rounded-xl rounded-tr-sm bg-neutral-950 px-4 py-2.5 text-[13px] text-white dark:bg-white dark:text-neutral-950">
                  What did the ablation study find?
                </div>

                <div className="max-w-[92%] rounded-xl rounded-tl-sm border border-neutral-200 bg-neutral-0 px-4 py-3 text-[13px] leading-relaxed text-neutral-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200">
                  Removing the reranking stage reduced retrieval precision by a measurable margin
                  <span className="font-mono text-brand-600 dark:text-brand-300">[1]</span>, while the
                  hybrid dense and keyword setup outperformed either method alone
                  <span className="font-mono text-brand-600 dark:text-brand-300">[2]</span>.
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-0 px-2.5 py-1 font-mono text-[10.5px] text-neutral-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400">
                    [1] ablation_results.pdf · 0.91
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-0 px-2.5 py-1 font-mono text-[10.5px] text-neutral-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400">
                    [2] retrieval_ablation.pdf · 0.87
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-3 gap-2 border-t border-neutral-200 pt-4 dark:border-white/10">
                  <div className="rounded-lg bg-success-50 px-3 py-2 dark:bg-success-500/10">
                    <div className="font-mono text-[15px] font-semibold text-success-600 dark:text-success-500">82%</div>
                    <div className="font-mono text-[9px] uppercase tracking-wide text-success-600/80 dark:text-success-500/80">Supported</div>
                  </div>
                  <div className="rounded-lg bg-accent-50 px-3 py-2 dark:bg-accent-500/10">
                    <div className="font-mono text-[15px] font-semibold text-accent-600 dark:text-accent-400">12%</div>
                    <div className="font-mono text-[9px] uppercase tracking-wide text-accent-600/80 dark:text-accent-400/80">Uncertain</div>
                  </div>
                  <div className="rounded-lg bg-neutral-100 px-3 py-2 dark:bg-white/5">
                    <div className="font-mono text-[15px] font-semibold text-neutral-600 dark:text-neutral-300">6%</div>
                    <div className="font-mono text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Unsupported</div>
                  </div>
                </div>

                <div className="flex items-end gap-1.5 border-t border-neutral-200 pt-4 dark:border-white/10">
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
                <div className="font-mono text-[9.5px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
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
            <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              How it works
            </div>
            <h2 className="max-w-[640px] font-display text-[clamp(28px,4.2vw,44px)] leading-[1.08] tracking-[-0.03em] text-neutral-950 dark:text-white">
              From raw source to verified insight.
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp(i * 0.07)}
              className={cardVariants({ variant: "flat", className: "flex min-h-[210px] flex-col gap-3.5" })}
            >
              <span className="font-mono text-[12px] text-neutral-400 dark:text-neutral-500">{s.n}</span>
              <h3 className="font-display text-[22px] tracking-[-0.01em] text-neutral-950 dark:text-white">{s.t}</h3>
              <p className="text-[13px] leading-[1.65] text-neutral-600 dark:text-neutral-400">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1180px] px-5 pb-24 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-12">
          <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            Capabilities
          </div>
          <h2 className="max-w-[620px] font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-neutral-950 dark:text-white">
            A complete research intelligence stack.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.t}
              {...fadeUp(i * 0.05)}
              className={cardVariants({
                variant: "flat",
                className: `flex min-h-[150px] flex-col gap-3 ${f.big ? "sm:col-span-2" : "sm:col-span-1"}`,
              })}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-500/15">
                <Check size={15} className="text-brand-600 dark:text-brand-300" />
              </div>
              <div className="text-[14.5px] font-semibold text-neutral-950 dark:text-white">{f.t}</div>
              <div className="text-[13px] leading-[1.6] text-neutral-600 dark:text-neutral-400">{f.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="product" className="border-t border-neutral-200 px-5 py-24 dark:border-white/10 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1180px]">
          <motion.div {...fadeUp(0)} className="mb-12">
            <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              Inside the app
            </div>
            <h2 className="max-w-[620px] font-display text-[clamp(26px,3.6vw,38px)] leading-[1.1] tracking-[-0.03em] text-neutral-950 dark:text-white">
              Eight workspaces, one pipeline.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_PAGES.map((p, i) => (
              <motion.div
                key={p.label}
                {...fadeUp(i * 0.04)}
                className={cardVariants({ variant: "flat", className: "flex flex-col gap-3" })}
              >
                <p.icon size={16} className="text-neutral-500 dark:text-neutral-400" />
                <div className="text-[13.5px] font-semibold text-neutral-950 dark:text-white">{p.label}</div>
                <div className="text-[12px] leading-[1.6] text-neutral-600 dark:text-neutral-400">{p.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="flex justify-center border-t border-neutral-200 px-5 py-24 text-center dark:border-white/10 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="max-w-[760px]">
          <Badge tone="brand" className="mb-7">
            Ready when you are
          </Badge>
          <h2 className="mb-5 font-display text-[clamp(30px,5vw,52px)] leading-[1.06] tracking-[-0.03em] text-neutral-950 dark:text-white">
            Research shouldn&apos;t be a <em className="text-brand-500">guessing game.</em>
          </h2>
          <p className="mb-9 text-[15px] text-neutral-600 dark:text-neutral-400">
            Ingest your first document and see every answer traced back to its source.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonVariants({ variant: "primary", size: "lg", className: "no-underline gap-2" })}>
              Create account <ArrowRight size={16} />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "secondary", size: "lg", className: "no-underline" })}>
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3.5 border-t border-neutral-200 px-5 py-6 dark:border-white/10 sm:px-8 lg:px-14">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-950 dark:bg-white">
            <Zap size={12} className="text-white dark:text-neutral-950" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[15px] text-neutral-500 dark:text-neutral-400">Prism</span>
        </div>
        <div className="flex flex-wrap gap-6">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="font-mono text-[12.5px] text-neutral-400 no-underline dark:text-neutral-500">
              {l.label}
            </a>
          ))}
        </div>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600">Research Intelligence Platform</span>
      </footer>
    </div>
  );
}