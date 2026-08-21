"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Braces,
  Check,
  Database,
  FileSearch,
  GitBranch,
  Layers,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Menu,
  Minus,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SplitSquareVertical,
  Upload,
  X,
} from "lucide-react";

const INK = "#111110";
const INK_RAISED = "#17171a";
const INK_RAISED_2 = "#1d1d20";
const PAPER = "#f7f6f3";
const PAPER_CARD = "#ffffff";
const ACCENT = "#8a8a85";
const ACCENT_LIGHT = "#b5b5b0";
const ACCENT_DEEP = "#5c5c58";
const ACCENT_SOFT = "rgba(138,138,133,0.16)";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#pipeline" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
];

const TRUST_STRIP = [
  { label: "Retrieval", value: "Dense + BM25, fused" },
  { label: "Generation", value: "Llama 3.3 70B · Groq" },
  { label: "Verification", value: "Per-claim, per sentence" },
  { label: "Pipeline stages", value: "4, start to verified answer" },
];

const PROBLEMS = [
  {
    n: "01",
    t: "Sources pile up, understanding doesn't",
    d: "Papers and long documents accumulate faster than anyone can read them, and the part that matters is usually buried on a page nobody reopens.",
  },
  {
    n: "02",
    t: "Generic chat answers aren't accountable",
    d: "An ordinary AI chat produces a fluent answer with no link back to a source, so every claim has to be manually re-checked before it can be trusted.",
  },
  {
    n: "03",
    t: "Keyword search misses the point",
    d: "Plain keyword search returns pages that contain the words but not the meaning, which means skimming by hand to find the passage that actually answers the question.",
  },
  {
    n: "04",
    t: "Verification is left as homework",
    d: "Even when an answer looks right, checking it against the original material is a separate, tedious step most workflows quietly skip.",
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
    t: "Hybrid retrieval",
    d: "Dense embeddings and BM25 keyword search are fused with reciprocal rank fusion, then reordered by a cross-encoder reranker before an answer is ever generated.",
    icon: SplitSquareVertical,
  },
  {
    t: "Claim-level verification",
    d: "Every sentence in an answer is scored against its retrieved evidence and labeled supported, uncertain, or unsupported.",
    icon: ShieldCheck,
  },
  {
    t: "Structured summarization",
    d: "TLDR, key concepts, methodology, results, and limitations returned as one structured brief instead of a wall of text.",
    icon: Layers,
  },
  {
    t: "Retrieval transparency",
    d: "Inspect the exact chunks, source documents, and similarity scores that produced every answer, not just the final text.",
    icon: FileSearch,
  },
  {
    t: "Evaluation harness",
    d: "Run recall@5, mean reciprocal rank, and groundedness metrics against your own workspace whenever you need a system-level check.",
    icon: BarChart3,
    big: true,
  },
];

const PIPELINE = [
  {
    n: "01",
    t: "Ingest",
    d: "Upload a PDF, DOCX, DOC, or TXT file, fetch a URL, or paste raw text. Content is verified against its file signature, chunked, and embedded with all-MiniLM-L6-v2 in a background job tracked stage by stage.",
    icon: Upload,
  },
  {
    n: "02",
    t: "Retrieve",
    d: "A query runs against dense vector search and BM25 keyword search in parallel. Results are merged with reciprocal rank fusion, then reordered by a cross-encoder for the final top-k chunks.",
    icon: Search,
  },
  {
    n: "03",
    t: "Generate",
    d: "Llama 3.3 70B on Groq answers strictly from the retrieved chunks. Every stated fact carries an inline source marker, such as [1][2], tied back to the exact chunk it came from.",
    icon: Sparkles,
  },
  {
    n: "04",
    t: "Verify",
    d: "The answer is split into individual claims and matched against the retrieved context by token overlap, then labeled supported, uncertain, or unsupported with a confidence score.",
    icon: ShieldCheck,
  },
];

const PRODUCT_PAGES = [
  { label: "Dashboard", icon: LayoutDashboard, d: "Live metrics across documents, generations, and verifications, with latency and pass-rate charts." },
  { label: "Ingest", icon: Upload, d: "Add sources by upload, URL, or pasted text, with background jobs tracked through each stage." },
  { label: "Library", icon: BookOpen, d: "Every ingested document, searchable by title and sortable by size and chunk count." },
  { label: "Workspace", icon: MessageSquare, d: "Query your research in plain language and get answers grounded in your documents." },
  { label: "Source Trace", icon: GitBranch, d: "See the retrieved chunks, their sources, and similarity scores behind any answer." },
  { label: "Verification", icon: ShieldCheck, d: "Review each claim in an answer, labeled supported, uncertain, or unsupported." },
  { label: "Evaluation", icon: BarChart3, d: "Run the evaluation harness for recall, MRR, and groundedness across your workspace." },
  { label: "Settings", icon: Settings, d: "Manage your account, profile, and password from one place." },
];

const USE_CASES = [
  { t: "Researchers", d: "Move through papers and reports faster, with every summary and answer traceable back to the exact passage it came from." },
  { t: "Students", d: "Ask direct questions about assigned readings and get answers that cite the source material instead of a paraphrase to double-check." },
  { t: "Knowledge workers", d: "Turn a folder of internal documents into a queryable workspace, with claim-level verification standing in for a manual re-read." },
  { t: "Analysts & consultants", d: "Cross-reference client reports and source filings without losing track of which document a figure actually came from." },
];

const BENEFITS = [
  { t: "Trust every answer", d: "Confidence scores and claim-level verification mean nothing gets cited without a traceable source behind it." },
  { t: "Read less, know more", d: "Structured summaries surface methodology, results, and limitations without a full read-through." },
  { t: "Full transparency", d: "Source Trace shows the exact chunks and similarity scores behind every answer, not just the final text." },
  { t: "Fast, grounded answers", d: "Hybrid retrieval and reranking run in the background so answers stay both quick and evidenced." },
];

const COMPARISON = [
  { cap: "Answer grounding", generic: "Opaque, trust the model", prism: "Every claim checked against retrieved evidence" },
  { cap: "Source visibility", generic: "Rarely shown", prism: "Full chunk-level similarity scores exposed" },
  { cap: "Retrieval method", generic: "Keyword or single-vector search", prism: "Dense + BM25 fused, then cross-encoder reranked" },
  { cap: "Summarization", generic: "One generic paragraph", prism: "Structured: TLDR, concepts, methods, results, limitations" },
  { cap: "Verification", generic: "None, or manual", prism: "Per-claim, per-sentence, built into the pipeline" },
];

const STACK = [
  { t: "Next.js", d: "Frontend application and routing", icon: Layers },
  { t: "FastAPI", d: "Backend API and job orchestration", icon: Database },
  { t: "PostgreSQL + pgvector", d: "Storage for documents, chunks, embeddings", icon: Database },
  { t: "all-MiniLM-L6-v2", d: "Sentence embeddings for dense retrieval", icon: SplitSquareVertical },
  { t: "BM25", d: "Lexical retrieval, fused with dense search", icon: Search },
  { t: "Cross-encoder", d: "Final relevance reordering of candidates", icon: Braces },
  { t: "Llama 3.3 70B", d: "Grounded generation via Groq", icon: Sparkles },
  { t: "JWT sessions", d: "Signed, session-scoped authentication", icon: Lock },
];

const SECURITY_POINTS = [
  "Session-scoped, signed JWT authentication on every request",
  "API keys for the inference provider never reach the browser",
  "Documents and chunks are isolated per account, not pooled globally",
  "No third-party tracking of ingested document content",
];

const PRICING = [
  {
    t: "Self-hosted",
    price: "$0",
    d: "Run Prism yourself. Bring your own Groq API key and Postgres instance.",
    features: ["Full ingestion pipeline", "Hybrid retrieval + reranking", "Claim-level verification", "Structured summarization", "Evaluation harness"],
    cta: "Get started on GitHub",
    highlighted: false,
  },
  {
    t: "Workspace",
    price: "Free",
    d: "The hosted workspace, for individual research use.",
    features: ["Everything in Self-hosted", "Managed Postgres + pgvector", "Background job dashboard", "Source Trace UI", "No infrastructure to maintain"],
    cta: "Try Prism free",
    highlighted: true,
  },
];

const FAQ = [
  { q: "What file formats does Prism support?", a: "PDF, DOCX, DOC, and TXT uploads, URLs, and pasted raw text — all through the same ingestion pipeline." },
  { q: "How does Prism prevent hallucinated answers?", a: "Every sentence in a generated answer is split out and matched against the retrieved evidence, then labeled supported, uncertain, or unsupported with a confidence score." },
  { q: "What retrieval method does Prism use?", a: "Dense vector search and BM25 keyword search run in parallel, are merged with reciprocal rank fusion, then reordered by a cross-encoder before the top-k chunks reach generation." },
  { q: "What LLM generates the answers?", a: "Llama 3.3 70B, served via Groq, constrained to answer strictly from retrieved chunks with inline source markers." },
  { q: "Can I see which passages an answer came from?", a: "Yes. Source Trace shows every retrieved chunk, its source document, and its similarity score for any given answer." },
  { q: "Is Prism multi-user?", a: "Yes. Accounts are session-scoped with signed JWT authentication, and documents are isolated per account." },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-72px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pl-root">
      <style>{`
        .pl-root {
          background: ${INK};
          color: #ffffff;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          font-family: var(--font-sans, 'Syne', system-ui, sans-serif);
        }
        .pl-root * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          .pl-root * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        .pl-header {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          height: 76px; padding: 0 24px;
          background: rgba(17,17,16,0.82);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .pl-header.scrolled { border-color: rgba(255,255,255,0.14); box-shadow: 0 18px 40px -28px rgba(0,0,0,0.8); }
        @media (min-width: 768px) { .pl-header { padding: 0 48px; } }
        @media (min-width: 1200px) { .pl-header { padding: 0 80px; } }

        .pl-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
        .pl-logo-mark { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP}); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pl-logo-text { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-size: 20px; letter-spacing: 0.02em; color: #ffffff; }

        .pl-nav { display: none; align-items: center; gap: 36px; }
        @media (min-width: 900px) { .pl-nav { display: flex; } }
        .pl-nav a { font-family: var(--font-mono, monospace); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.52); text-decoration: none; transition: color 0.2s ease; }
        .pl-nav a:hover { color: #ffffff; }

        .pl-header-actions { display: none; align-items: center; gap: 12px; }
        @media (min-width: 900px) { .pl-header-actions { display: flex; } }

        .pl-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 24px; border-radius: 11px; background: #ffffff; color: ${INK};
          font-size: 13.5px; font-weight: 700; text-decoration: none; border: none; cursor: pointer;
          transition: opacity 0.18s ease, transform 0.18s ease;
        }
        .pl-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .pl-btn-primary.on-light { background: ${INK}; color: #ffffff; }
        .pl-btn-primary.accent { background: ${ACCENT}; color: #ffffff; }

        .pl-btn-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 23px; border-radius: 11px; background: transparent; color: #ffffff;
          font-size: 13.5px; font-weight: 600; text-decoration: none; border: 1px solid rgba(255,255,255,0.18);
          transition: border-color 0.18s ease, background 0.18s ease;
        }
        .pl-btn-secondary:hover { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.04); }
        .pl-btn-secondary.on-light { color: ${INK}; border-color: rgba(17,17,16,0.18); }
        .pl-btn-secondary.on-light:hover { border-color: rgba(17,17,16,0.5); background: rgba(17,17,16,0.04); }

        .pl-menu-btn { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.16); background: transparent; color: #ffffff; cursor: pointer; }
        @media (min-width: 900px) { .pl-menu-btn { display: none; } }

        .pl-mobile-menu { position: fixed; inset: 76px 0 auto 0; z-index: 40; background: ${INK}; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 26px 24px 32px; display: flex; flex-direction: column; gap: 20px; }
        @media (min-width: 900px) { .pl-mobile-menu { display: none; } }
        .pl-mobile-menu a { color: #ffffff; font-size: 15px; text-decoration: none; }
        .pl-mobile-actions { display: flex; gap: 12px; margin-top: 6px; }
        .pl-mobile-actions > * { flex: 1; }

        .pl-hero { position: relative; padding: 64px 24px 56px; text-align: center; overflow: hidden; }
        @media (min-width: 768px) { .pl-hero { padding: 84px 48px 72px; } }
        .pl-hero-glow { position: absolute; top: -140px; left: 50%; transform: translateX(-50%); width: 900px; height: 500px; background: radial-gradient(ellipse at center, rgba(138,138,133,0.18), transparent 70%); pointer-events: none; }
        .pl-hero-inner { position: relative; max-width: 900px; margin: 0 auto; }

        .pl-eyebrow-row { display: inline-flex; align-items: center; gap: 9px; font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${ACCENT_LIGHT}; margin-bottom: 28px; }
        .pl-eyebrow-dot { width: 6px; height: 6px; border-radius: 999px; background: ${ACCENT}; }

        .pl-brand-name {
          font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
          font-weight: 400;
          font-size: clamp(76px, 13vw, 168px);
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0 0 20px;
        }
        .pl-h1 { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-weight: 400; font-size: clamp(26px, 3.4vw, 40px); line-height: 1.2; letter-spacing: -0.02em; color: rgba(255,255,255,0.92); max-width: 720px; margin: 0 auto; }
        .pl-h1 em { font-style: normal; color: ${ACCENT}; background: linear-gradient(135deg, ${ACCENT_LIGHT}, ${ACCENT}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

        .pl-lead { margin: 26px auto 0; max-width: 560px; font-size: 17px; line-height: 1.75; color: rgba(255,255,255,0.55); }

        .pl-cta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 38px; justify-content: center; }
        .pl-hero-note { margin-top: 20px; font-family: var(--font-mono, monospace); font-size: 11.5px; color: rgba(255,255,255,0.38); }

        .pl-mock { margin: 64px auto 0; max-width: 880px; text-align: left; border-radius: 18px; overflow: hidden; background: ${INK_RAISED}; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 44px 90px -30px rgba(0,0,0,0.75); }
        .pl-mock-top { display: flex; align-items: center; gap: 8px; padding: 15px 20px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .pl-mock-dot { width: 9px; height: 9px; border-radius: 999px; background: rgba(255,255,255,0.16); }
        .pl-mock-url { margin-left: 8px; padding: 5px 13px; border-radius: 999px; background: rgba(255,255,255,0.05); font-family: var(--font-mono, monospace); font-size: 10px; color: rgba(255,255,255,0.5); }
        .pl-mock-body { display: flex; flex-direction: column; gap: 18px; padding: 24px; }
        .pl-mock-user { margin-left: auto; max-width: 78%; border-radius: 14px 14px 3px 14px; background: #ffffff; color: ${INK}; padding: 11px 16px; font-size: 13px; font-weight: 600; }
        .pl-mock-ai { max-width: 94%; border-radius: 14px 14px 14px 3px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); color: rgba(255,255,255,0.82); padding: 15px 17px; font-size: 13px; line-height: 1.7; }
        .pl-mock-ai .mark { font-family: var(--font-mono, monospace); font-weight: 700; color: ${ACCENT_LIGHT}; opacity: 0.95; }
        .pl-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .pl-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); font-family: var(--font-mono, monospace); font-size: 10px; color: rgba(255,255,255,0.55); }
        .pl-verify-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
        .pl-verify-cell { border-radius: 10px; padding: 11px 13px; }
        .pl-verify-pct { font-family: var(--font-mono, monospace); font-size: 15px; font-weight: 700; }
        .pl-verify-label { margin-top: 4px; font-family: var(--font-mono, monospace); font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

        .pl-trust-strip { margin: 56px auto 0; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.09); display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 780px; }
        @media (min-width: 560px) { .pl-trust-strip { grid-template-columns: repeat(4, 1fr); } }
        .pl-trust-item { padding: 14px 15px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); text-align: left; }
        .pl-trust-value { font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 700; line-height: 1.4; color: #ffffff; }
        .pl-trust-label { margin-top: 8px; font-family: var(--font-mono, monospace); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); }

        .pl-section { padding: 88px 24px; }
        @media (min-width: 768px) { .pl-section { padding: 108px 48px; } }
        @media (min-width: 1200px) { .pl-section { padding: 140px 80px; } }
        .pl-section.tight { padding-top: 72px; padding-bottom: 72px; }
        @media (min-width: 768px) { .pl-section.tight { padding-top: 84px; padding-bottom: 84px; } }
        .pl-section.paper { background: ${PAPER}; color: ${INK}; }
        .pl-section.raised { background: ${INK_RAISED_2}; }
        .pl-section-inner { max-width: 1320px; margin: 0 auto; }

        .pl-section-head { max-width: 660px; margin-bottom: 72px; }
        .pl-section-head.center { margin-left: auto; margin-right: auto; text-align: center; }
        .pl-label { font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(255,255,255,0.42); margin-bottom: 18px; }
        .paper .pl-label { color: rgba(17,17,16,0.45); }
        .pl-h2 { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-weight: 400; font-size: clamp(29px, 3.8vw, 46px); line-height: 1.12; letter-spacing: -0.03em; color: #ffffff; margin: 0; }
        .paper .pl-h2 { color: ${INK}; }
        .pl-h2.small { font-size: clamp(27px, 3vw, 38px); }
        .pl-section-sub { margin-top: 22px; font-size: 15.5px; line-height: 1.75; color: rgba(255,255,255,0.52); }
        .paper .pl-section-sub { color: rgba(17,17,16,0.58); }

        .pl-grid { display: grid; gap: 24px; }
        .pl-grid.cols-2 { grid-template-columns: 1fr; }
        @media (min-width: 700px) { .pl-grid.cols-2 { grid-template-columns: 1fr 1fr; } }
        .pl-grid.cols-3 { grid-template-columns: 1fr; }
        @media (min-width: 700px) { .pl-grid.cols-3 { grid-template-columns: repeat(3, 1fr); } }
        .pl-grid.cols-4 { grid-template-columns: 1fr; }
        @media (min-width: 640px) { .pl-grid.cols-4 { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1050px) { .pl-grid.cols-4 { grid-template-columns: repeat(4, 1fr); } }

        .pl-card { background: ${INK_RAISED}; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px; display: flex; flex-direction: column; gap: 16px; transition: border-color 0.25s ease, transform 0.25s ease; }
        .pl-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-3px); }
        .paper .pl-card { background: ${PAPER_CARD}; border-color: rgba(17,17,16,0.09); }
        .paper .pl-card:hover { border-color: rgba(17,17,16,0.22); }
        .pl-card-num { font-family: var(--font-mono, monospace); font-size: 11.5px; color: rgba(255,255,255,0.28); }
        .paper .pl-card-num { color: rgba(17,17,16,0.32); }
        .pl-card-title { font-size: 16px; font-weight: 700; color: #ffffff; }
        .paper .pl-card-title { color: ${INK}; }
        .pl-card-title.serif { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-weight: 400; font-size: 23px; letter-spacing: -0.01em; }
        .pl-card-desc { font-size: 13.5px; line-height: 1.75; color: rgba(255,255,255,0.5); }
        .paper .pl-card-desc { color: rgba(17,17,16,0.58); }

        .pl-icon-badge { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: ${ACCENT_SOFT}; flex-shrink: 0; }
        .pl-icon-badge.plain { background: rgba(255,255,255,0.06); }
        .paper .pl-icon-badge.plain { background: rgba(17,17,16,0.06); }
        .pl-icon-badge.orange { background: ${ACCENT_SOFT}; }

        .pl-feature-span-2 { grid-column: span 1; }
        @media (min-width: 700px) { .pl-feature-span-2.big { grid-column: span 2; } }

        .pl-showcase { border-radius: 22px; overflow: hidden; background: ${INK_RAISED}; border: 1px solid rgba(255,255,255,0.1); max-width: 1100px; margin: 0 auto; }
        .pl-showcase-tabs { display: flex; gap: 4px; padding: 18px 24px 0; overflow-x: auto; }
        .pl-showcase-tab { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px 10px 0 0; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.42); white-space: nowrap; }
        .pl-showcase-tab.active { background: rgba(255,255,255,0.05); color: #ffffff; }
        .pl-showcase-body { padding: 32px; border-top: 1px solid rgba(255,255,255,0.08); display: grid; gap: 24px; grid-template-columns: 1fr; }
        @media (min-width: 800px) { .pl-showcase-body { grid-template-columns: repeat(4, 1fr); } }
        .pl-showcase-item { padding: 18px; border-radius: 12px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); }
        .pl-showcase-item p { margin-top: 8px; font-size: 12.5px; line-height: 1.6; color: rgba(255,255,255,0.48); }

        .pl-flow { max-width: 660px; margin: 0 auto; }
        .pl-flow-step { display: flex; gap: 24px; }
        .pl-flow-rail { display: flex; flex-direction: column; align-items: center; }
        .pl-flow-num { width: 40px; height: 40px; border-radius: 999px; background: rgba(17,17,16,0.04); border: 1px solid rgba(17,17,16,0.16); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono, monospace); font-size: 12.5px; font-weight: 700; color: ${INK}; flex-shrink: 0; }
        .pl-flow-line { width: 1px; flex: 1; background: rgba(17,17,16,0.12); min-height: 48px; }
        .pl-flow-body { flex: 1; padding-bottom: 44px; }
        .pl-flow-title { padding-top: 6px; font-size: 16px; font-weight: 700; color: ${INK}; }
        .pl-flow-desc { margin-top: 9px; font-size: 13.5px; line-height: 1.75; color: rgba(17,17,16,0.58); }

        .pl-stack-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; max-width: 1000px; margin: 0 auto; }
        .pl-stack-pill { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); }
        .pl-stack-pill-text { display: flex; flex-direction: column; }
        .pl-stack-pill-t { font-size: 12.5px; font-weight: 700; color: #ffffff; }
        .pl-stack-pill-d { font-family: var(--font-mono, monospace); font-size: 9.5px; color: rgba(255,255,255,0.4); }

        .pl-compare-table { width: 100%; border-collapse: collapse; max-width: 1100px; margin: 0 auto; }
        .pl-compare-table th, .pl-compare-table td { padding: 18px 20px; text-align: left; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .pl-compare-table th { font-family: var(--font-mono, monospace); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.42); font-weight: 700; }
        .pl-compare-table td { color: rgba(255,255,255,0.6); }
        .pl-compare-table td.cap { color: #ffffff; font-weight: 700; }
        .pl-compare-table td.prism-col { color: ${ACCENT_LIGHT}; font-weight: 600; }
        .pl-compare-table tr:last-child td { border-bottom: none; }

        .pl-security-row { display: flex; flex-direction: column; gap: 40px; max-width: 1100px; margin: 0 auto; }
        @media (min-width: 800px) { .pl-security-row { flex-direction: row; align-items: flex-start; justify-content: space-between; } }
        .pl-security-left { max-width: 460px; }
        .pl-security-list { list-style: none; margin-top: 28px; display: flex; flex-direction: column; gap: 16px; }
        .pl-security-list li { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.62); }
        .pl-security-check { width: 20px; height: 20px; border-radius: 6px; background: ${ACCENT_SOFT}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .pl-security-note { flex: 1; max-width: 400px; padding: 24px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09); font-size: 13px; line-height: 1.75; color: rgba(255,255,255,0.5); }

        .pl-pricing-grid { display: grid; gap: 24px; max-width: 820px; margin: 0 auto; grid-template-columns: 1fr; }
        @media (min-width: 700px) { .pl-pricing-grid { grid-template-columns: 1fr 1fr; } }
        .pl-price-card { border-radius: 20px; padding: 36px; background: ${PAPER_CARD}; border: 1px solid rgba(17,17,16,0.09); display: flex; flex-direction: column; }
        .pl-price-card.highlighted { background: ${INK}; border-color: ${INK}; }
        .pl-price-card.highlighted .pl-price-title, .pl-price-card.highlighted .pl-price-amount { color: #ffffff; }
        .pl-price-card.highlighted .pl-price-desc { color: rgba(255,255,255,0.55); }
        .pl-price-card.highlighted .pl-price-feature { color: rgba(255,255,255,0.72); }
        .pl-price-card.highlighted .pl-price-feature-check { background: ${ACCENT_SOFT}; }
        .pl-price-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(17,17,16,0.5); }
        .pl-price-amount { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-size: 44px; color: ${INK}; margin: 14px 0 8px; }
        .pl-price-desc { font-size: 13.5px; line-height: 1.6; color: rgba(17,17,16,0.55); margin-bottom: 24px; }
        .pl-price-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; flex: 1; }
        .pl-price-feature { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: rgba(17,17,16,0.68); }
        .pl-price-feature-check { width: 18px; height: 18px; border-radius: 5px; background: rgba(138,138,133,0.14); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .pl-faq-list { max-width: 760px; margin: 0 auto; }
        .pl-faq-item { border-bottom: 1px solid rgba(255,255,255,0.08); }
        .pl-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 24px 4px; background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; }
        .pl-faq-q-text { font-size: 16px; font-weight: 700; color: #ffffff; }
        .pl-faq-icon { width: 26px; height: 26px; border-radius: 999px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: rgba(255,255,255,0.6); }
        .pl-faq-a { padding: 0 4px 24px; font-size: 14px; line-height: 1.75; color: rgba(255,255,255,0.55); max-width: 640px; }

        .pl-final { display: flex; justify-content: center; text-align: center; position: relative; overflow: hidden; }
        .pl-final-glow { position: absolute; top: 50%; left: 50%; width: 900px; height: 500px; transform: translate(-50%, -50%); background: radial-gradient(ellipse at center, rgba(138,138,133,0.16), transparent 70%); pointer-events: none; }
        .pl-final-inner { max-width: 760px; position: relative; }
        .pl-eyebrow-pill { display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 999px; background: ${ACCENT_SOFT}; color: ${ACCENT_LIGHT}; font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 30px; }

        .pl-footer { padding: 64px 24px 32px; border-top: 1px solid rgba(255,255,255,0.08); }
        @media (min-width: 768px) { .pl-footer { padding: 72px 48px 32px; } }
        @media (min-width: 1200px) { .pl-footer { padding: 72px 80px 32px; } }
        .pl-footer-inner { max-width: 1320px; margin: 0 auto; }
        .pl-footer-top { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 56px; }
        @media (max-width: 900px) { .pl-footer-top { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .pl-footer-top { grid-template-columns: 1fr; } }
        .pl-footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .pl-footer-blurb { font-size: 13.5px; line-height: 1.7; color: rgba(255,255,255,0.42); max-width: 260px; }
        .pl-footer-col-h { font-family: var(--font-mono, monospace); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 18px; }
        .pl-footer-col a { display: block; font-size: 13.5px; color: rgba(255,255,255,0.55); text-decoration: none; margin-bottom: 13px; transition: color 0.2s ease; }
        .pl-footer-col a:hover { color: #ffffff; }
        .pl-footer-bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); }
        .pl-footer-tag { font-family: var(--font-mono, monospace); font-size: 11px; color: rgba(255,255,255,0.3); }
      `}</style>

      <header className={`pl-header ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="pl-logo">
          <span className="pl-logo-mark">
            <Sparkles size={15} color="#ffffff" strokeWidth={2.25} />
          </span>
          <span className="pl-logo-text">PRISM</span>
        </Link>

        <nav className="pl-nav">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </nav>

        <div className="pl-header-actions">
          <Link href="/login" className="pl-btn-secondary">Sign in</Link>
          <Link href="/register" className="pl-btn-primary">
            Get started <ArrowRight size={14} />
          </Link>
        </div>

        <button onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={menuOpen} className="pl-menu-btn">
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>

      {menuOpen && (
        <div className="pl-mobile-menu">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
          ))}
          <div className="pl-mobile-actions">
            <Link href="/login" className="pl-btn-secondary">Sign in</Link>
            <Link href="/register" className="pl-btn-primary">Get started</Link>
          </div>
        </div>
      )}

      <section className="pl-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <Reveal>
            <div className="pl-eyebrow-row">
              <span className="pl-eyebrow-dot" />
              Research intelligence platform
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="pl-brand-name">Prism</h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="pl-h1">
              Read less. Trust more. <em>Every answer traced back to its source.</em>
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="pl-lead">
              Prism turns papers, reports, and long documents into a queryable workspace — hybrid retrieval, grounded generation, and claim-level verification, in one pipeline.
            </p>
          </Reveal>

          <Reveal delay={0.22}>
            <div className="pl-cta-row">
              <Link href="/register" className="pl-btn-primary accent">
                Try Prism free <ArrowRight size={14} />
              </Link>
              <a href="#pipeline" className="pl-btn-secondary">See how it works</a>
            </div>
            <div className="pl-hero-note">No credit card required · Free Groq API tier available</div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="pl-mock">
              <div className="pl-mock-top">
                <span className="pl-mock-dot" />
                <span className="pl-mock-dot" />
                <span className="pl-mock-dot" />
                <span className="pl-mock-url">prism.app/workspace</span>
              </div>
              <div className="pl-mock-body">
                <div className="pl-mock-user">What methodology did the study use for sampling?</div>
                <div className="pl-mock-ai">
                  The study used stratified random sampling across three cohorts <span className="mark">[1][2]</span>, with a minimum sample size of 400 per stratum <span className="mark">[3]</span> to preserve statistical power.
                </div>
                <div className="pl-chip-row">
                  <span className="pl-chip"><FileSearch size={11} /> methods.pdf · chunk 14</span>
                  <span className="pl-chip"><FileSearch size={11} /> methods.pdf · chunk 15</span>
                  <span className="pl-chip"><FileSearch size={11} /> appendix-b.pdf · chunk 3</span>
                </div>
                <div className="pl-verify-row">
                  <div className="pl-verify-cell" style={{ background: "rgba(61,153,112,0.12)" }}>
                    <div className="pl-verify-pct" style={{ color: "#3d9970" }}>92%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(61,153,112,0.85)" }}>Supported</div>
                  </div>
                  <div className="pl-verify-cell" style={{ background: "rgba(138,138,133,0.14)" }}>
                    <div className="pl-verify-pct" style={{ color: ACCENT_LIGHT }}>6%</div>
                    <div className="pl-verify-label" style={{ color: ACCENT_LIGHT }}>Uncertain</div>
                  </div>
                  <div className="pl-verify-cell" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="pl-verify-pct" style={{ color: "rgba(255,255,255,0.7)" }}>2%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(255,255,255,0.4)" }}>Unsupported</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.36}>
            <div className="pl-trust-strip">
              {TRUST_STRIP.map((t) => (
                <div key={t.label} className="pl-trust-item">
                  <div className="pl-trust-value">{t.value}</div>
                  <div className="pl-trust-label">{t.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="problem" className="pl-section tight">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center">
              <div className="pl-label">The problem</div>
              <h2 className="pl-h2 small">Research workflows weren&apos;t built for how much you actually read</h2>
            </div>
          </Reveal>
          <div className="pl-grid cols-2">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.05}>
                <div className="pl-card">
                  <span className="pl-card-num">{p.n}</span>
                  <div className="pl-card-title">{p.t}</div>
                  <p className="pl-card-desc">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section raised tight">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center" style={{ marginBottom: 0 }}>
              <div className="pl-label">The solution</div>
              <h2 className="pl-h2 small">An auditable pipeline, not a black box</h2>
              <p className="pl-section-sub">
                Prism exposes the entire retrieval-to-generation pipeline — fused hybrid search, reranked chunks, inline citations, and per-claim verification — so every answer can be traced back to the exact passage it came from.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="features" className="pl-section">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head">
              <div className="pl-label">Key features</div>
              <h2 className="pl-h2">Everything needed to trust an AI answer</h2>
            </div>
          </Reveal>
          <div className="pl-grid cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 0.04} className={`pl-feature-span-2 ${f.big ? "big" : ""}`}>
                <div className="pl-card" style={{ height: "100%" }}>
                  <span className="pl-icon-badge orange">
                    <f.icon size={17} color={ACCENT_LIGHT} />
                  </span>
                  <div className="pl-card-title">{f.t}</div>
                  <p className="pl-card-desc">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section raised">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center">
              <div className="pl-label">Inside Prism</div>
              <h2 className="pl-h2 small">One workspace, every stage of the pipeline</h2>
              <p className="pl-section-sub">
                Eight pages, all connected — ingest a document and follow it through retrieval, generation, and verification.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="pl-showcase">
              <div className="pl-showcase-tabs">
                {PRODUCT_PAGES.slice(0, 5).map((p, i) => (
                  <div key={p.label} className={`pl-showcase-tab ${i === 3 ? "active" : ""}`}>
                    <p.icon size={13} /> {p.label}
                  </div>
                ))}
              </div>
              <div className="pl-showcase-body">
                {PRODUCT_PAGES.map((p) => (
                  <div key={p.label} className="pl-showcase-item">
                    <span className="pl-icon-badge plain" style={{ width: 32, height: 32 }}>
                      <p.icon size={15} color="#ffffff" />
                    </span>
                    <p style={{ color: "#ffffff", fontWeight: 700, fontSize: 13, marginTop: 12 }}>{p.label}</p>
                    <p>{p.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="pipeline" className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center">
              <div className="pl-label">How it works</div>
              <h2 className="pl-h2 small">From document to verified answer, four stages</h2>
            </div>
          </Reveal>
          <div className="pl-flow">
            {PIPELINE.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06}>
                <div className="pl-flow-step">
                  <div className="pl-flow-rail">
                    <div className="pl-flow-num">{s.n}</div>
                    {i < PIPELINE.length - 1 && <div className="pl-flow-line" />}
                  </div>
                  <div className="pl-flow-body">
                    <div className="pl-flow-title">{s.t}</div>
                    <p className="pl-flow-desc">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="pl-section">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head">
              <div className="pl-label">Use cases</div>
              <h2 className="pl-h2">Built for the way research actually happens</h2>
            </div>
          </Reveal>
          <div className="pl-grid cols-4">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.t} delay={i * 0.04}>
                <div className="pl-card" style={{ height: "100%" }}>
                  <div className="pl-card-title">{u.t}</div>
                  <p className="pl-card-desc">{u.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section raised">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center">
              <div className="pl-label">Outcomes</div>
              <h2 className="pl-h2 small">What you actually get</h2>
            </div>
          </Reveal>
          <div className="pl-grid cols-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.t} delay={i * 0.04}>
                <div className="pl-card" style={{ height: "100%" }}>
                  <span className="pl-icon-badge orange">
                    <Check size={16} color={ACCENT_LIGHT} />
                  </span>
                  <div className="pl-card-title">{b.t}</div>
                  <p className="pl-card-desc">{b.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center">
              <div className="pl-label">Stack &amp; integrations</div>
              <h2 className="pl-h2 small">Composed from proven, swappable pieces</h2>
              <p className="pl-section-sub">Every layer of the pipeline is a distinct, independently replaceable component.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="pl-stack-row">
              {STACK.map((s) => (
                <div key={s.t} className="pl-stack-pill">
                  <s.icon size={15} color={INK} />
                  <div className="pl-stack-pill-text">
                    <span className="pl-stack-pill-t" style={{ color: INK }}>{s.t}</span>
                    <span className="pl-stack-pill-d" style={{ color: "rgba(17,17,16,0.45)" }}>{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="product" className="pl-section">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center">
              <div className="pl-label">Why Prism</div>
              <h2 className="pl-h2 small">Not another chat-with-your-PDF wrapper</h2>
            </div>
          </Reveal>
          <Reveal>
            <table className="pl-compare-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Typical tool</th>
                  <th>Prism</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((c) => (
                  <tr key={c.cap}>
                    <td className="cap">{c.cap}</td>
                    <td>{c.generic}</td>
                    <td className="prism-col">{c.prism}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="pl-section raised">
        <div className="pl-section-inner">
          <div className="pl-security-row">
            <Reveal className="pl-security-left">
              <div className="pl-label">Security &amp; privacy</div>
              <h2 className="pl-h2 small">Your documents stay yours</h2>
              <ul className="pl-security-list">
                {SECURITY_POINTS.map((s) => (
                  <li key={s}>
                    <span className="pl-security-check"><Check size={12} color={ACCENT_LIGHT} /></span>
                    {s}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.08} className="pl-security-note">
              Every request is authenticated with a signed, session-scoped JWT. Inference provider keys live only on the backend and are never exposed to the browser. Documents and their embeddings are isolated per account.
            </Reveal>
          </div>
        </div>
      </section>

      <section id="pricing" className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center">
              <div className="pl-label">Pricing</div>
              <h2 className="pl-h2 small">Start free, run it your way</h2>
            </div>
          </Reveal>
          <div className="pl-pricing-grid">
            {PRICING.map((p, i) => (
              <Reveal key={p.t} delay={i * 0.06}>
                <div className={`pl-price-card ${p.highlighted ? "highlighted" : ""}`}>
                  <div className="pl-price-title">{p.t}</div>
                  <div className="pl-price-amount">{p.price}</div>
                  <p className="pl-price-desc">{p.d}</p>
                  <ul className="pl-price-features">
                    {p.features.map((f) => (
                      <li key={f} className="pl-price-feature">
                        <span className="pl-price-feature-check"><Check size={11} color={ACCENT_DEEP} /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={p.highlighted ? "pl-btn-primary accent" : "pl-btn-primary on-light"}>
                    {p.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-section-inner">
          <Reveal>
            <div className="pl-section-head center">
              <div className="pl-label">FAQ</div>
              <h2 className="pl-h2 small">Frequently asked questions</h2>
            </div>
          </Reveal>
          <div className="pl-faq-list">
            {FAQ.map((f, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={f.q} delay={i * 0.03} className="pl-faq-item">
                  <button className="pl-faq-q" onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open}>
                    <span className="pl-faq-q-text">{f.q}</span>
                    <span className="pl-faq-icon">{open ? <Minus size={13} /> : <Plus size={13} />}</span>
                  </button>
                  {open && <p className="pl-faq-a">{f.a}</p>}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pl-section pl-final">
        <div className="pl-final-glow" />
        <div className="pl-final-inner">
          <Reveal>
            <span className="pl-eyebrow-pill">Get started</span>
            <h2 className="pl-h2" style={{ fontSize: "clamp(30px, 4.4vw, 50px)" }}>
              Stop guessing whether your AI answers are true.
            </h2>
            <p className="pl-lead">
              Ingest your first document and watch the full retrieval, generation, and verification pipeline run end to end.
            </p>
            <div className="pl-cta-row">
              <Link href="/register" className="pl-btn-primary accent">
                Try Prism free <ArrowRight size={14} />
              </Link>
              <a
                href="https://github.com/yamini-nlp/prism"
                target="_blank"
                rel="noreferrer"
                className="pl-btn-secondary"
              >
                View on GitHub <ArrowUpRight size={14} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="pl-footer">
        <div className="pl-footer-inner">
          <div className="pl-footer-top">
            <div>
              <div className="pl-footer-brand">
                <span className="pl-logo-mark">
                  <Sparkles size={15} color="#ffffff" strokeWidth={2.25} />
                </span>
                <span className="pl-logo-text">PRISM</span>
              </div>
              <p className="pl-footer-blurb">
                A research intelligence platform built on hybrid retrieval, grounded generation, and claim-level verification.
              </p>
            </div>
            <div className="pl-footer-col">
              <div className="pl-footer-col-h">Product</div>
              <a href="#features">Features</a>
              <a href="#pipeline">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="/login">Sign in</a>
            </div>
            <div className="pl-footer-col">
              <div className="pl-footer-col-h">Resources</div>
              <a href="https://github.com/yamini-nlp/prism" target="_blank" rel="noreferrer">GitHub</a>
              <a href="#architecture">Architecture</a>
              <a href="#product">Comparison</a>
            </div>
            <div className="pl-footer-col">
              <div className="pl-footer-col-h">Company</div>
              <a href="https://github.com/yamini-nlp" target="_blank" rel="noreferrer">Built by Yamini G</a>
              <a href="#">Privacy policy</a>
              <a href="#">Terms of service</a>
            </div>
          </div>
          <div className="pl-footer-bottom">
            <span className="pl-footer-tag">© 2026 Prism. All rights reserved.</span>
            <span className="pl-footer-tag">Next.js · FastAPI · Llama 3.3 70B on Groq</span>
          </div>
        </div>
      </footer>
    </div>
  );
}