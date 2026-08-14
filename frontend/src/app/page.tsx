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

const TICKER_WORDS = ["Ingest", "Retrieve", "Generate", "Verify", "Cite", "Trace", "Evaluate", "Research"];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-950 font-sans text-white">
      <style>{`
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(255,255,255,0.18); }
        @keyframes prism-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-neutral-950/85 px-5 backdrop-blur-md sm:px-8 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white">
            <Zap size={15} color="#000000" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl tracking-tight text-white">Prism</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((l) => (
            
              key={l.label}
              href={l.href}
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-white/55 no-underline transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/login" className="no-underline">
            <button className="rounded-lg border border-white/20 bg-transparent px-[18px] py-2 text-[12.5px] font-semibold text-white transition-colors hover:border-white/40">
              Sign in
            </button>
          </Link>
          <Link href="/register" className="no-underline">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 rounded-lg bg-white px-5 py-2 text-[12.5px] font-bold text-black"
            >
              Get started <ArrowRight size={13} />
            </motion.button>
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
            
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-[15px] text-white no-underline"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-1 flex gap-2.5">
            <Link href="/login" className="flex-1 no-underline">
              <button className="w-full rounded-lg border border-white/20 bg-transparent py-2.5 text-[13px] font-semibold text-white">
                Sign in
              </button>
            </Link>
            <Link href="/register" className="flex-1 no-underline">
              <button className="w-full rounded-lg bg-white py-2.5 text-[13px] font-bold text-black">
                Get started
              </button>
            </Link>
          </div>
        </div>
      )}

      <section className="relative flex min-h-screen flex-col justify-center px-5 pb-20 pt-36 sm:px-8 lg:px-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <motion.div {...fadeUp(0)} className="relative mx-auto w-full max-w-[1180px]">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-white/70">
              Research intelligence platform
            </span>
          </div>

          <h1 className="max-w-[980px] font-display text-[clamp(42px,8vw,104px)] leading-[0.98] tracking-[-0.04em]">
            Read less.
            <br />
            Know <em className="text-white/40">more.</em>
          </h1>

          <p className="mt-7 max-w-[560px] text-[clamp(15px,1.6vw,18px)] leading-[1.7] text-white/55">
            Prism turns papers, reports, and raw text into grounded, citation-backed answers.
            Every claim is checked against its retrieved source and scored before it reaches you.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/register" className="no-underline">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-[15px] font-bold text-black"
              >
                Start Research <ArrowRight size={17} />
              </motion.button>
            </Link>
            <Link href="/login" className="no-underline">
              <motion.button
                whileHover={{ borderColor: "rgba(255,255,255,0.45)" }}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-transparent px-7 py-4 text-[15px] text-white"
              >
                Sign in <ArrowUpRight size={15} />
              </motion.button>
            </Link>
          </div>

          <div className="mt-16 grid max-w-[720px] grid-cols-2 gap-y-6 border-t border-white/[0.14] pt-6 sm:grid-cols-4">
            {NUMBERS.map(([val, label], i) => (
              <div key={label} className={i > 0 ? "border-white/10 pl-5 sm:border-l" : ""}>
                <div className="font-mono text-[21px] font-medium tracking-[-0.01em]">{val}</div>
                <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <div className="overflow-hidden border-y border-white/10 py-4">
        <div className="flex w-max animate-[prism-marquee_26s_linear_infinite] whitespace-nowrap">
          {[...Array(4)].flatMap(() => TICKER_WORDS).map((w, i) => (
            <span
              key={i}
              className={`px-9 font-mono text-[12px] uppercase tracking-[0.1em] ${
                i % 2 === 0 ? "text-white/50" : "text-white/15"
              }`}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      <section id="pipeline" className="mx-auto max-w-[1180px] px-5 py-28 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-14 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/35">
              How it works
            </div>
            <h2 className="max-w-[640px] font-display text-[clamp(30px,4.5vw,50px)] leading-[1.06] tracking-[-0.03em]">
              From raw source to verified insight.
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
          {STAGES.map((s, i) => (
            <motion.div key={s.n} {...fadeUp(i * 0.08)} className="flex min-h-[220px] flex-col gap-4 bg-neutral-950 p-8">
              <span className="font-mono text-[12.5px] text-white/30">{s.n}</span>
              <h3 className="font-display text-[25px] tracking-[-0.01em]">{s.t}</h3>
              <p className="text-[13.5px] leading-[1.7] text-white/45">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="mb-12">
          <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/35">
            Capabilities
          </div>
          <h2 className="max-w-[620px] font-display text-[clamp(26px,3.8vw,42px)] leading-[1.1] tracking-[-0.03em]">
            A complete research intelligence stack.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.t}
              {...fadeUp(i * 0.05)}
              className={`flex min-h-[150px] flex-col gap-3 bg-neutral-950 p-7 ${f.big ? "sm:col-span-2" : "sm:col-span-1"}`}
            >
              <Check size={16} className="text-white/50" />
              <div className="text-[15px] font-semibold">{f.t}</div>
              <div className="text-[13px] leading-[1.6] text-white/42">{f.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="product" className="border-t border-white/10 px-5 py-28 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1180px]">
          <motion.div {...fadeUp(0)} className="mb-12">
            <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/35">
              Inside the app
            </div>
            <h2 className="max-w-[620px] font-display text-[clamp(26px,3.8vw,42px)] leading-[1.1] tracking-[-0.03em]">
              Eight workspaces, one pipeline.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_PAGES.map((p, i) => (
              <motion.div key={p.label} {...fadeUp(i * 0.04)} className="flex flex-col gap-3 bg-neutral-950 p-6">
                <p.icon size={17} className="text-white/50" />
                <div className="text-[13.5px] font-semibold">{p.label}</div>
                <div className="text-[12px] leading-[1.6] text-white/42">{p.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="flex justify-center border-t border-white/10 px-5 py-28 text-center sm:px-8 lg:px-14">
        <motion.div {...fadeUp(0)} className="max-w-[780px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-white/70">
              Ready when you are
            </span>
          </div>
          <h2 className="mb-5 font-display text-[clamp(32px,5.5vw,60px)] leading-none tracking-[-0.04em]">
            Research shouldn&apos;t be a <em className="text-white/40">guessing game.</em>
          </h2>
          <p className="mb-9 text-[15px] text-white/42">
            Ingest your first document and see every answer traced back to its source.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className="no-underline">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-2xl bg-white px-9 py-4 text-[15px] font-bold text-black"
              >
                Create account <ArrowRight size={17} />
              </motion.button>
            </Link>
            <Link href="/login" className="no-underline">
              <motion.button
                whileHover={{ borderColor: "rgba(255,255,255,0.4)" }}
                className="rounded-2xl border border-white/20 bg-transparent px-7 py-4 text-[15px] text-white"
              >
                Sign in
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3.5 border-t border-white/10 px-5 py-6 sm:px-8 lg:px-14">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
            <Zap size={12} color="#000000" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[15px] text-white/50">Prism</span>
        </div>
        <div className="flex flex-wrap gap-6">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="font-mono text-[12.5px] text-white/35 no-underline">
              {l.label}
            </a>
          ))}
        </div>
        <span className="font-mono text-[11px] text-white/25">Research Intelligence Platform</span>
      </footer>
    </div>
  );
}