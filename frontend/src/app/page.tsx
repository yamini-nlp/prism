"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Braces,
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
} from "lucide-react";

const INK = "#0a0a09";
const INK_RAISED = "#151513";
const INK_LINE = "rgba(255,255,255,0.09)";
const PAPER = "#f6f4ef";
const PAPER_CARD = "#ffffff";
const ACCENT = "#d4622a";
const ACCENT_LIGHT = "#e88a52";
const ACCENT_DEEP = "#9c3d16";
const ACCENT_SOFT = "rgba(212,98,42,0.13)";

const NAV_LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Architecture", href: "#architecture" },
  { label: "Inside Prism", href: "#product" },
];

const TRUST_STRIP = [
  { label: "Retrieval", value: "Dense + BM25, fused" },
  { label: "Generation", value: "Llama 3.3 70B · Groq" },
  { label: "Verification", value: "Per-claim, per sentence" },
  { label: "Pipeline stages", value: "4, start to verified answer" },
];

const RAG_FLOW = [
  { t: "Query", icon: Search },
  { t: "Retrieval", icon: FileSearch },
  { t: "Context", icon: Layers },
  { t: "Reasoning", icon: Sparkles },
  { t: "Answer", icon: ShieldCheck },
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

const STAGES = [
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

const FEATURES = [
  {
    t: "Multi-format ingestion",
    d: "PDF, DOCX, DOC, TXT, URLs, and pasted text all flow through the same chunking and embedding pipeline, tracked through a background job so nothing blocks the interface while it runs.",
    icon: Upload,
    size: "wide",
  },
  {
    t: "Hybrid retrieval",
    d: "Dense embeddings and BM25 keyword search are fused with reciprocal rank fusion, then reordered by a cross-encoder reranker before an answer is ever generated.",
    icon: SplitSquareVertical,
    size: "tall",
  },
  {
    t: "Claim-level verification",
    d: "Every sentence in an answer is scored against its retrieved evidence and labeled supported, uncertain, or unsupported.",
    icon: ShieldCheck,
    size: "normal",
  },
  {
    t: "Structured summarization",
    d: "TLDR, key concepts, methodology, results, and limitations returned as one structured brief instead of a wall of text.",
    icon: Layers,
    size: "normal",
  },
  {
    t: "Retrieval transparency",
    d: "Inspect the exact chunks, source documents, and similarity scores that produced every answer, not just the final text.",
    icon: FileSearch,
    size: "normal",
  },
  {
    t: "Evaluation harness",
    d: "Run recall@5, mean reciprocal rank, and groundedness metrics against your own workspace whenever you need a system-level check.",
    icon: BarChart3,
    size: "wide",
  },
];

const ARCHITECTURE_FLOW = [
  { t: "User query", d: "A question enters the workspace in plain language." },
  { t: "Dense + BM25 retrieval", d: "Vector similarity search and keyword search run in parallel over the workspace's ingested chunks." },
  { t: "Reciprocal rank fusion", d: "The two ranked result sets are merged into a single fused ranking, not just concatenated." },
  { t: "Cross-encoder reranking", d: "A cross-encoder scores the fused candidates directly against the query for the final top-k." },
  { t: "Grounded generation", d: "Llama 3.3 70B on Groq answers strictly from the retrieved chunks, with inline citation markers." },
  { t: "Claim verification", d: "Each sentence is split out and matched against the retrieved context, then labeled with a confidence score." },
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
    d: "Claim-level scoring runs as part of the pipeline itself, labeling each sentence before you ever read it.",
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
  { t: "PostgreSQL + pgvector", d: "Storage for documents, chunks, embeddings", icon: Database },
  { t: "all-MiniLM-L6-v2", d: "Sentence embeddings for dense retrieval", icon: SplitSquareVertical },
  { t: "BM25", d: "Lexical retrieval, fused with dense search", icon: Search },
  { t: "Cross-encoder", d: "Final relevance reordering of candidates", icon: Braces },
  { t: "Llama 3.3 70B", d: "Grounded generation via Groq", icon: Sparkles },
  { t: "JWT sessions", d: "Signed, session-scoped authentication", icon: Lock },
];

const USE_CASES = [
  {
    letter: "A",
    t: "Researchers",
    d: "Move through papers and reports faster, with every summary and answer traceable back to the exact passage it came from.",
  },
  {
    letter: "B",
    t: "Students",
    d: "Ask direct questions about assigned readings and get answers that cite the source material instead of a paraphrase to double-check.",
  },
  {
    letter: "C",
    t: "Knowledge workers",
    d: "Turn a folder of internal documents into a queryable workspace, with claim-level verification standing in for a manual re-read.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const growLine: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
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

        .pl-noise {
          position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.5;
          background-image: radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 26px 26px;
        }

        .pl-header {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          height: 72px; padding: 0 24px;
          background: rgba(10,10,9,0.78);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid ${INK_LINE};
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .pl-header.scrolled { border-color: rgba(255,255,255,0.16); box-shadow: 0 18px 40px -28px rgba(0,0,0,0.9); }
        @media (min-width: 768px) { .pl-header { padding: 0 48px; } }
        @media (min-width: 1200px) { .pl-header { padding: 0 80px; } }

        .pl-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .pl-logo-mark { width: 28px; height: 28px; border: 1px solid rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
        .pl-logo-mark::after { content: ""; position: absolute; inset: 4px; border: 1px solid ${ACCENT}; }
        .pl-logo-text { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-size: 18px; letter-spacing: 0.06em; color: #ffffff; }

        .pl-nav { display: none; align-items: center; gap: 34px; }
        @media (min-width: 900px) { .pl-nav { display: flex; } }
        .pl-nav a { position: relative; font-family: var(--font-mono, monospace); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s ease; padding-bottom: 3px; }
        .pl-nav a::after { content: ""; position: absolute; left: 0; right: 100%; bottom: 0; height: 1px; background: ${ACCENT}; transition: right 0.25s ease; }
        .pl-nav a:hover { color: #ffffff; }
        .pl-nav a:hover::after { right: 0; }

        .pl-header-actions { display: none; align-items: center; gap: 10px; }
        @media (min-width: 900px) { .pl-header-actions { display: flex; } }

        .pl-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 22px; background: #ffffff; color: ${INK};
          font-size: 13px; font-weight: 700; text-decoration: none; border: 1px solid #ffffff; cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .pl-btn-primary:hover { background: ${ACCENT}; border-color: ${ACCENT}; color: #ffffff; transform: translateY(-1px); }

        .pl-btn-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 21px; background: transparent; color: #ffffff;
          font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid rgba(255,255,255,0.2);
          transition: border-color 0.18s ease, background 0.18s ease;
        }
        .pl-btn-secondary:hover { border-color: #ffffff; background: rgba(255,255,255,0.04); }
        .pl-btn-secondary.on-light { color: ${INK}; border-color: rgba(10,10,9,0.2); }
        .pl-btn-secondary.on-light:hover { border-color: ${INK}; background: rgba(10,10,9,0.05); }

        .pl-menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.18); background: transparent; color: #ffffff; cursor: pointer; }
        @media (min-width: 900px) { .pl-menu-btn { display: none; } }

        .pl-mobile-menu { position: fixed; inset: 72px 0 auto 0; z-index: 40; background: ${INK}; border-bottom: 1px solid ${INK_LINE}; padding: 24px 24px 30px; display: flex; flex-direction: column; gap: 18px; }
        @media (min-width: 900px) { .pl-mobile-menu { display: none; } }
        .pl-mobile-menu a { color: #ffffff; font-size: 15px; text-decoration: none; }
        .pl-mobile-actions { display: flex; gap: 12px; margin-top: 6px; }
        .pl-mobile-actions > * { flex: 1; }

        .pl-hero { position: relative; padding: 60px 24px 0; overflow: hidden; }
        @media (min-width: 768px) { .pl-hero { padding: 76px 48px 0; } }
        @media (min-width: 1200px) { .pl-hero { padding: 96px 80px 0; } }

        .pl-hero-layout { position: relative; z-index: 2; max-width: 1360px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 60px; }
        @media (min-width: 1140px) { .pl-hero-layout { grid-template-columns: 1.15fr 0.85fr; gap: 40px; align-items: start; } }

        .pl-eyebrow-row { display: flex; align-items: center; gap: 9px; font-family: var(--font-mono, monospace); font-size: 11.5px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${ACCENT_LIGHT}; margin-bottom: 22px; }
        .pl-eyebrow-dot { width: 6px; height: 6px; background: ${ACCENT}; }

        .pl-h1 { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-weight: 400; font-size: clamp(46px, 7vw, 92px); line-height: 0.98; letter-spacing: -0.035em; color: #ffffff; margin: 0; }
        .pl-h1 .outline { -webkit-text-stroke: 1.5px rgba(255,255,255,0.65); color: transparent; }
        .pl-h1 em { font-style: normal; color: ${ACCENT}; }

        .pl-lead { margin-top: 30px; max-width: 430px; font-size: 16.5px; line-height: 1.75; color: rgba(255,255,255,0.55); border-left: 2px solid ${ACCENT}; padding-left: 20px; }

        .pl-cta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 36px; }

        .pl-hero-right { position: relative; min-height: 420px; }
        @media (max-width: 1139px) { .pl-hero-right { min-height: 0; } }

        .pl-float-card {
          position: relative; background: ${INK_RAISED}; border: 1px solid ${INK_LINE};
          box-shadow: 0 40px 90px -30px rgba(0,0,0,0.75);
        }

        .pl-panel-answer { padding: 22px; }
        .pl-panel-top { display: flex; align-items: center; gap: 8px; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid ${INK_LINE}; }
        .pl-panel-dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(255,255,255,0.16); }
        .pl-panel-url { margin-left: 6px; padding: 4px 12px; background: rgba(255,255,255,0.05); font-family: var(--font-mono, monospace); font-size: 9.5px; color: rgba(255,255,255,0.5); }

        .pl-query-pill {
          position: absolute; top: -18px; right: 6%; max-width: 250px; z-index: 3;
          background: #ffffff; color: ${INK}; padding: 12px 16px; font-size: 12.5px; font-weight: 600;
          transform: rotate(2deg);
        }
        @media (max-width: 1139px) { .pl-query-pill { position: static; transform: none; margin-bottom: -1px; max-width: none; } }

        .pl-verify-pill {
          position: absolute; bottom: -22px; left: -4%; z-index: 3; transform: rotate(-2deg);
          display: flex; gap: 1px; background: ${INK_LINE};
        }
        @media (max-width: 1139px) { .pl-verify-pill { position: static; transform: none; margin-top: -1px; } }
        .pl-verify-seg { background: ${INK_RAISED}; padding: 10px 14px; min-width: 78px; }
        .pl-verify-pct { font-family: var(--font-mono, monospace); font-size: 15px; font-weight: 700; }
        .pl-verify-label { margin-top: 2px; font-family: var(--font-mono, monospace); font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.4); }

        .pl-mock-ai { max-width: 96%; border: 1px solid ${INK_LINE}; background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.82); padding: 15px 17px; font-size: 13px; line-height: 1.7; }
        .pl-mock-ai .mark { font-family: var(--font-mono, monospace); font-weight: 700; color: ${ACCENT_LIGHT}; }
        .pl-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .pl-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border: 1px solid ${INK_LINE}; font-family: var(--font-mono, monospace); font-size: 9.5px; color: rgba(255,255,255,0.55); }
        .pl-method-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; padding-top: 18px; border-top: 1px solid ${INK_LINE}; }
        .pl-method-tag { font-family: var(--font-mono, monospace); font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.4); padding: 5px 10px; border: 1px solid ${INK_LINE}; }

        .pl-trust-rail { margin-top: 68px; padding-top: 26px; border-top: 1px solid ${INK_LINE}; display: flex; flex-wrap: wrap; gap: 0; }
        .pl-trust-item { flex: 1 1 150px; padding-right: 24px; }
        .pl-trust-value { font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 700; line-height: 1.4; color: #ffffff; }
        .pl-trust-label { margin-top: 8px; font-family: var(--font-mono, monospace); font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.38); }

        .pl-ragflow { position: relative; z-index: 2; max-width: 1360px; margin: 96px auto 0; padding: 0 24px 90px; }
        @media (min-width: 768px) { .pl-ragflow { padding: 0 48px 110px; } }
        @media (min-width: 1200px) { .pl-ragflow { padding: 0 80px 130px; } }
        .pl-ragflow-label { font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,0.4); margin-bottom: 26px; }
        .pl-ragflow-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0; }
        .pl-ragflow-node { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; width: 128px; }
        .pl-ragflow-icon { width: 52px; height: 52px; border: 1px solid ${INK_LINE}; display: flex; align-items: center; justify-content: center; background: ${INK_RAISED}; transition: border-color 0.25s ease, transform 0.25s ease; }
        .pl-ragflow-node:hover .pl-ragflow-icon { border-color: ${ACCENT}; transform: translateY(-3px); }
        .pl-ragflow-t { font-family: var(--font-mono, monospace); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.7); }
        .pl-ragflow-line { flex: 1; min-width: 24px; height: 1px; background: ${INK_LINE}; transform-origin: left; position: relative; top: -22px; }
        @media (max-width: 720px) { .pl-ragflow-row { justify-content: center; } .pl-ragflow-line { display: none; } }

        .pl-section { padding: 88px 24px; position: relative; z-index: 2; }
        @media (min-width: 768px) { .pl-section { padding: 108px 48px; } }
        @media (min-width: 1200px) { .pl-section { padding: 136px 80px; } }
        .pl-section.tight { padding-top: 70px; padding-bottom: 70px; }
        @media (min-width: 768px) { .pl-section.tight { padding-top: 82px; padding-bottom: 82px; } }
        .pl-section.paper { background: ${PAPER}; color: ${INK}; }
        .pl-section-inner { max-width: 1360px; margin: 0 auto; }

        .pl-section-head { max-width: 640px; margin-bottom: 68px; }
        .pl-label { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,0.4); margin-bottom: 20px; }
        .pl-label::before { content: ""; width: 14px; height: 1px; background: ${ACCENT}; }
        .paper .pl-label { color: rgba(10,10,9,0.42); }
        .pl-h2 { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-weight: 400; font-size: clamp(30px, 4vw, 50px); line-height: 1.08; letter-spacing: -0.03em; color: #ffffff; margin: 0; }
        .paper .pl-h2 { color: ${INK}; }
        .pl-h2.small { font-size: clamp(26px, 3vw, 36px); }
        .pl-section-sub { margin-top: 22px; font-size: 15.5px; line-height: 1.75; color: rgba(255,255,255,0.52); }
        .paper .pl-section-sub { color: rgba(10,10,9,0.58); }

        .pl-problem-list { display: flex; flex-direction: column; }
        .pl-problem-row { display: grid; grid-template-columns: 70px 1fr; gap: 24px; padding: 34px 0; border-top: 1px solid rgba(10,10,9,0.12); }
        .pl-problem-row:last-child { border-bottom: 1px solid rgba(10,10,9,0.12); }
        @media (min-width: 720px) { .pl-problem-row { grid-template-columns: 100px 1fr 1fr; gap: 40px; } }
        .pl-problem-n { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-size: 44px; line-height: 1; color: rgba(10,10,9,0.16); }
        .pl-problem-t { font-size: 19px; font-weight: 700; color: ${INK}; letter-spacing: -0.01em; }
        .pl-problem-d { font-size: 14.5px; line-height: 1.75; color: rgba(10,10,9,0.6); margin-top: 6px; }
        @media (min-width: 720px) { .pl-problem-t { margin-top: 6px; } .pl-problem-d { margin-top: 0; } }

        .pl-grid { display: grid; gap: 20px; }
        .pl-grid.cols-3 { grid-template-columns: 1fr; }
        @media (min-width: 700px) { .pl-grid.cols-3 { grid-template-columns: repeat(3, 1fr); } }
        .pl-grid.cols-4 { grid-template-columns: 1fr; }
        @media (min-width: 640px) { .pl-grid.cols-4 { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1050px) { .pl-grid.cols-4 { grid-template-columns: repeat(4, 1fr); } }

        .pl-bento { display: grid; grid-template-columns: 1fr; gap: 18px; }
        @media (min-width: 720px) { .pl-bento { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 190px; } }
        .pl-bento-card { grid-column: span 1; grid-row: span 1; }
        @media (min-width: 720px) {
          .pl-bento-card.wide { grid-column: span 2; }
          .pl-bento-card.tall { grid-row: span 2; }
        }

        .pl-card { background: ${INK_RAISED}; border: 1px solid ${INK_LINE}; padding: 28px; display: flex; flex-direction: column; gap: 14px; transition: border-color 0.25s ease, transform 0.25s ease; height: 100%; }
        .pl-card:hover { border-color: rgba(255,255,255,0.24); transform: translateY(-3px); }
        .paper .pl-card { background: ${PAPER_CARD}; border-color: rgba(10,10,9,0.1); }
        .paper .pl-card:hover { border-color: rgba(10,10,9,0.26); }
        .pl-card-num { font-family: var(--font-mono, monospace); font-size: 11px; color: rgba(255,255,255,0.28); }
        .paper .pl-card-num { color: rgba(10,10,9,0.3); }
        .pl-card-title { font-size: 16px; font-weight: 700; color: #ffffff; }
        .paper .pl-card-title { color: ${INK}; }
        .pl-card-title.serif { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-weight: 400; font-size: 22px; letter-spacing: -0.01em; }
        .pl-card-desc { font-size: 13.5px; line-height: 1.75; color: rgba(255,255,255,0.5); }
        .paper .pl-card-desc { color: rgba(10,10,9,0.58); }

        .pl-icon-badge { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: ${ACCENT_SOFT}; flex-shrink: 0; }
        .pl-icon-badge.plain { background: rgba(255,255,255,0.06); }
        .paper .pl-icon-badge.plain { background: rgba(10,10,9,0.06); }

        .pl-two-col { display: grid; grid-template-columns: 1fr; gap: 50px; }
        @media (min-width: 900px) { .pl-two-col { grid-template-columns: 0.7fr 1.3fr; gap: 90px; align-items: start; } }
        .pl-pullquote { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-weight: 400; font-size: clamp(24px, 2.6vw, 32px); line-height: 1.35; letter-spacing: -0.01em; color: #ffffff; margin: 0 0 30px; }
        .pl-pullquote em { font-style: normal; color: ${ACCENT_LIGHT}; }
        .pl-editorial p { font-size: 16px; line-height: 1.9; color: rgba(255,255,255,0.62); margin: 0 0 24px; }
        .pl-editorial p:last-child { margin-bottom: 0; }
        .pl-editorial strong { color: #ffffff; font-weight: 700; }

        .pl-stat-row { display: flex; flex-wrap: wrap; gap: 0; margin-top: 44px; border-top: 1px solid ${INK_LINE}; }
        .pl-stat-item { flex: 1 1 160px; padding: 20px 20px 0 0; }
        .pl-stat-value { font-family: var(--font-mono, monospace); font-size: 13px; font-weight: 700; color: ${ACCENT_LIGHT}; }
        .pl-stat-label { margin-top: 6px; font-family: var(--font-mono, monospace); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.4); }

        .pl-flow { max-width: 640px; }
        .pl-flow-step { display: flex; gap: 22px; }
        .pl-flow-rail { display: flex; flex-direction: column; align-items: center; }
        .pl-flow-num { width: 38px; height: 38px; background: rgba(10,10,9,0.04); border: 1px solid rgba(10,10,9,0.18); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 700; color: ${INK}; flex-shrink: 0; }
        .pl-flow-line { width: 1px; flex: 1; background: rgba(10,10,9,0.14); min-height: 44px; }
        .pl-flow-body { flex: 1; padding-bottom: 40px; }
        .pl-flow-title { padding-top: 5px; font-size: 15.5px; font-weight: 700; color: ${INK}; }
        .pl-flow-desc { margin-top: 8px; font-size: 13.5px; line-height: 1.75; color: rgba(10,10,9,0.58); }

        .pl-showcase-rail { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; margin: 0 -24px; padding-left: 24px; padding-right: 24px; scroll-snap-type: x proximity; }
        @media (min-width: 768px) { .pl-showcase-rail { margin: 0 -48px; padding-left: 48px; padding-right: 48px; } }
        @media (min-width: 1200px) { .pl-showcase-rail { margin: 0 -80px; padding-left: 80px; padding-right: 80px; } }
        .pl-showcase-rail::-webkit-scrollbar { height: 5px; }
        .pl-showcase-rail::-webkit-scrollbar-thumb { background: ${INK_LINE}; }
        .pl-showcase-card { scroll-snap-align: start; flex: 0 0 240px; background: ${INK_RAISED}; border: 1px solid ${INK_LINE}; padding: 22px; display: flex; flex-direction: column; gap: 12px; transition: border-color 0.25s ease; }
        .pl-showcase-card:hover { border-color: ${ACCENT}; }
        .pl-showcase-n { font-family: var(--font-mono, monospace); font-size: 10.5px; color: rgba(255,255,255,0.3); }

        .pl-diff-list { display: flex; flex-direction: column; }
        .pl-diff-row { display: grid; grid-template-columns: 52px 1fr; gap: 22px; padding: 30px 0; border-top: 1px solid rgba(10,10,9,0.12); }
        .pl-diff-row:last-child { border-bottom: 1px solid rgba(10,10,9,0.12); }
        @media (min-width: 700px) { .pl-diff-list { display: grid; grid-template-columns: 1fr 1fr; column-gap: 48px; } .pl-diff-row:nth-child(2n) { border-left: 1px solid rgba(10,10,9,0.12); padding-left: 24px; } }

        .pl-usecase-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background: rgba(10,10,9,0.12); }
        @media (min-width: 700px) { .pl-usecase-grid { grid-template-columns: repeat(3, 1fr); } }
        .pl-usecase-cell { background: ${PAPER}; padding: 36px 28px; }
        .pl-usecase-letter { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-size: 40px; color: rgba(10,10,9,0.18); line-height: 1; }

        .pl-security-row { display: flex; flex-direction: column; gap: 26px; max-width: 1360px; margin: 0 auto; }
        @media (min-width: 700px) { .pl-security-row { flex-direction: row; align-items: center; justify-content: space-between; } }
        .pl-security-left { display: flex; align-items: flex-start; gap: 18px; max-width: 540px; }

        .pl-final { display: flex; justify-content: center; text-align: center; position: relative; overflow: hidden; }
        .pl-final-glow { position: absolute; top: 50%; left: 50%; width: 900px; height: 500px; transform: translate(-50%, -50%); background: radial-gradient(ellipse at center, rgba(212,98,42,0.13), transparent 70%); pointer-events: none; }
        .pl-final-inner { max-width: 740px; position: relative; }
        .pl-eyebrow-pill { display: inline-flex; align-items: center; padding: 8px 16px; background: ${ACCENT_SOFT}; color: ${ACCENT_LIGHT}; font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 28px; border: 1px solid rgba(212,98,42,0.3); }

        .pl-footer { position: relative; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding: 34px 24px; border-top: 1px solid ${INK_LINE}; }
        @media (min-width: 768px) { .pl-footer { padding: 34px 48px; } }
        @media (min-width: 1200px) { .pl-footer { padding: 34px 80px; } }
        .pl-footer-brand { display: flex; align-items: center; gap: 10px; }
        .pl-footer-links { display: flex; flex-wrap: wrap; gap: 26px; }
        .pl-footer-links a { font-family: var(--font-mono, monospace); font-size: 11px; color: rgba(255,255,255,0.38); text-decoration: none; transition: color 0.2s ease; }
        .pl-footer-links a:hover { color: rgba(255,255,255,0.85); }
        .pl-footer-tag { font-family: var(--font-mono, monospace); font-size: 10.5px; color: rgba(255,255,255,0.3); }
      `}</style>

      <div className="pl-noise" />

      <header className={`pl-header ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="pl-logo">
          <span className="pl-logo-mark" />
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
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
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
        <div className="pl-hero-layout">
          <Reveal>
            <div className="pl-eyebrow-row">
              <span className="pl-eyebrow-dot" />
              Research intelligence platform
            </div>

            <h1 className="pl-h1">
              Read <span className="outline">less.</span>
              <br />
              Know <em>more.</em>
            </h1>

            <p className="pl-lead">
              Prism turns papers, reports, and raw text into grounded, citation-backed answers.
              Every claim is checked against its retrieved source and scored before it reaches you.
            </p>

            <div className="pl-cta-row">
              <Link href="/register" className="pl-btn-primary" style={{ padding: "14px 26px", fontSize: 14 }}>
                Start Research <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="pl-btn-secondary" style={{ padding: "13px 25px", fontSize: 14 }}>
                Sign in <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="pl-trust-rail">
              {TRUST_STRIP.map((s) => (
                <div key={s.label} className="pl-trust-item">
                  <div className="pl-trust-value">{s.value}</div>
                  <div className="pl-trust-label">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="pl-hero-right">
              <div className="pl-query-pill">What did the ablation study find?</div>

              <div className="pl-float-card pl-panel-answer">
                <div className="pl-panel-top">
                  <span className="pl-panel-dot" />
                  <span className="pl-panel-dot" />
                  <span className="pl-panel-dot" />
                  <span className="pl-panel-url">prism.app/workspace</span>
                </div>

                <div className="pl-mock-ai">
                  Removing the reranking stage reduced retrieval precision by a measurable margin{" "}
                  <span className="mark">[1]</span>, while the hybrid dense and keyword setup outperformed
                  either method alone <span className="mark">[2]</span>.
                </div>

                <div className="pl-chip-row">
                  <span className="pl-chip">[1] ablation_results.pdf · 0.91</span>
                  <span className="pl-chip">[2] retrieval_ablation.pdf · 0.87</span>
                </div>

                <div className="pl-method-row">
                  <span className="pl-method-tag">Dense search</span>
                  <span className="pl-method-tag">BM25</span>
                  <span className="pl-method-tag">RRF fusion</span>
                  <span className="pl-method-tag">Cross-encoder rerank</span>
                </div>
              </div>

              <div className="pl-verify-pill">
                <div className="pl-verify-seg">
                  <div className="pl-verify-pct" style={{ color: "#69d3a8" }}>82%</div>
                  <div className="pl-verify-label">Supported</div>
                </div>
                <div className="pl-verify-seg">
                  <div className="pl-verify-pct" style={{ color: ACCENT_LIGHT }}>12%</div>
                  <div className="pl-verify-label">Uncertain</div>
                </div>
                <div className="pl-verify-seg">
                  <div className="pl-verify-pct" style={{ color: "rgba(255,255,255,0.75)" }}>6%</div>
                  <div className="pl-verify-label">Unsupported</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="pl-ragflow">
          <Reveal className="pl-ragflow-label">Query to answer, in five stages</Reveal>
          <div className="pl-ragflow-row">
            {RAG_FLOW.map((step, i) => (
              <Fragment key={step.t}>
                <Reveal delay={i * 0.06} className="pl-ragflow-node">
                  <span className="pl-ragflow-icon">
                    <step.icon size={19} color={ACCENT_LIGHT} />
                  </span>
                  <span className="pl-ragflow-t">{step.t}</span>
                </Reveal>
                {i < RAG_FLOW.length - 1 && (
                  <motion.div
                    className="pl-ragflow-line"
                    variants={growLine}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 + 0.1 }}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section id="problem" className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head">
            <div className="pl-label">The problem</div>
            <h2 className="pl-h2">Research is slow because trust is expensive.</h2>
            <p className="pl-section-sub">
              Reading everything takes too long. Trusting a fluent AI answer without a source takes a
              different kind of too long, once you count the time spent checking it.
            </p>
          </Reveal>

          <div className="pl-problem-list">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.04} className="pl-problem-row">
                <span className="pl-problem-n">{p.n}</span>
                <span className="pl-problem-t">{p.t}</span>
                <span className="pl-problem-d">{p.d}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-section-inner">
          <div className="pl-two-col">
            <Reveal>
              <div className="pl-label">What is Prism?</div>
              <p className="pl-pullquote">
                A research assistant that <em>shows its work</em>, not one that expects you to trust it.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="pl-editorial">
                <p>
                  Prism is a retrieval-augmented research platform. You ingest documents, ask questions in
                  plain language, and get answers generated strictly from what you uploaded — not from the
                  model&apos;s general knowledge.
                </p>
                <p>
                  Every answer carries <strong>inline citations</strong> back to the exact chunk it was drawn
                  from, and every sentence in that answer is independently checked against the retrieved
                  evidence and labeled supported, uncertain, or unsupported.
                </p>
                <p>
                  It exists for anyone who works from documents and needs the answer and the receipt in the
                  same place: researchers, students, and knowledge workers moving through papers, reports,
                  and long-form material.
                </p>
              </div>

              <div className="pl-stat-row">
                {TRUST_STRIP.map((s) => (
                  <div key={s.label} className="pl-stat-item">
                    <div className="pl-stat-value">{s.value}</div>
                    <div className="pl-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="capabilities" className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head" style={{ marginBottom: 52 }}>
            <div className="pl-label">Capabilities</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>A complete research intelligence stack.</h2>
          </Reveal>

          <div className="pl-bento">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.t}
                delay={i * 0.04}
                className={`pl-bento-card ${f.size === "wide" ? "wide" : ""} ${f.size === "tall" ? "tall" : ""}`}
              >
                <div className="pl-card" style={{ justifyContent: f.size === "wide" || f.size === "tall" ? "flex-end" : "flex-start" }}>
                  <span className="pl-icon-badge">
                    <f.icon size={16} color={ACCENT_DEEP} />
                  </span>
                  <div className="pl-card-title">{f.t}</div>
                  <div className="pl-card-desc">{f.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="pipeline" className="pl-section">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head">
            <div className="pl-label">How it works</div>
            <h2 className="pl-h2">From raw source to verified insight.</h2>
          </Reveal>

          <div className="pl-grid cols-4">
            {STAGES.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05} className="pl-card" style={{ minHeight: 236 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="pl-card-num">{s.n}</span>
                  <span className="pl-icon-badge plain">
                    <s.icon size={15} color="rgba(255,255,255,0.68)" />
                  </span>
                </div>
                <div className="pl-card-title serif">{s.t}</div>
                <div className="pl-card-desc">{s.d}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="pl-section paper">
        <div className="pl-section-inner">
          <div className="pl-two-col">
            <Reveal className="pl-section-head" style={{ marginBottom: 0 }}>
              <div className="pl-label">Retrieval architecture</div>
              <h2 className="pl-h2 small">Engineered retrieval, not a wrapper around an LLM.</h2>
              <p className="pl-section-sub">
                Every answer passes through a fixed pipeline of retrieval and verification stages before it
                reaches the interface. Nothing here is a single prompt to a model.
              </p>
            </Reveal>

            <div className="pl-flow">
              {ARCHITECTURE_FLOW.map((step, i) => (
                <Reveal key={step.t} delay={i * 0.04} className="pl-flow-step">
                  <div className="pl-flow-rail">
                    <div className="pl-flow-num">{i + 1}</div>
                    {i < ARCHITECTURE_FLOW.length - 1 && <div className="pl-flow-line" />}
                  </div>
                  <div className="pl-flow-body">
                    <div className="pl-flow-title">{step.t}</div>
                    <div className="pl-flow-desc">{step.d}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="pl-section">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head" style={{ marginBottom: 46 }}>
            <div className="pl-label">Inside the app</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Eight workspaces, one pipeline.</h2>
          </Reveal>
        </div>

        <Reveal delay={0.06} className="pl-showcase-rail">
          {PRODUCT_PAGES.map((p, i) => (
            <div key={p.label} className="pl-showcase-card">
              <span className="pl-showcase-n">0{i + 1}</span>
              <p.icon size={18} color="rgba(255,255,255,0.6)" />
              <div className="pl-card-title" style={{ fontSize: 14.5 }}>{p.label}</div>
              <div className="pl-card-desc" style={{ fontSize: 12.5 }}>{p.d}</div>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head" style={{ marginBottom: 52 }}>
            <div className="pl-label">Why Prism</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Different from a chat window pointed at your files.</h2>
          </Reveal>

          <div className="pl-diff-list">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.t} delay={i * 0.05} className="pl-diff-row">
                <span className="pl-icon-badge" style={{ width: 46, height: 46 }}>
                  <d.icon size={19} color={ACCENT_DEEP} />
                </span>
                <div>
                  <div className="pl-card-title">{d.t}</div>
                  <div className="pl-card-desc" style={{ marginTop: 8 }}>{d.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section tight">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head" style={{ marginBottom: 44 }}>
            <div className="pl-label">Built on</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>A real pipeline underneath the interface.</h2>
          </Reveal>

          <div className="pl-grid cols-4" style={{ gap: 18 }}>
            {STACK.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.02} className="pl-card" style={{ padding: 22, gap: 12 }}>
                <s.icon size={16} color="rgba(255,255,255,0.48)" />
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12.5, fontWeight: 700, color: "#ffffff" }}>{s.t}</div>
                <div className="pl-card-desc" style={{ fontSize: 12 }}>{s.d}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section paper" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="pl-section-inner" style={{ padding: "0 24px" }}>
          <Reveal className="pl-section-head" style={{ marginBottom: 52 }}>
            <div className="pl-label">Who it&apos;s for</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Built for anyone who works from documents.</h2>
          </Reveal>
        </div>

        <div className="pl-usecase-grid">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.t} delay={i * 0.05} className="pl-usecase-cell">
              <div className="pl-usecase-letter">{u.letter}</div>
              <div className="pl-card-title" style={{ marginTop: 14 }}>{u.t}</div>
              <div className="pl-card-desc" style={{ marginTop: 10 }}>{u.d}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pl-section tight">
        <div className="pl-security-row">
          <Reveal className="pl-security-left">
            <span className="pl-icon-badge plain" style={{ width: 46, height: 46 }}>
              <Lock size={19} color="rgba(255,255,255,0.68)" />
            </span>
            <div>
              <div className="pl-card-title">Session-scoped by design</div>
              <p className="pl-card-desc" style={{ marginTop: 10 }}>
                Every request carries a signed JWT session, and protected workspace routes stay
                inaccessible until you&apos;re authenticated.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.06} style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.32)" }}>
            Signed sessions · Protected routes
          </Reveal>
        </div>
      </section>

      <section id="workflow" className="pl-section pl-final">
        <div className="pl-final-glow" />
        <Reveal className="pl-final-inner">
          <span className="pl-eyebrow-pill">Ready when you are</span>
          <h2 className="pl-h2" style={{ marginTop: 0, marginBottom: 26, fontSize: "clamp(30px,4.2vw,50px)" }}>
            Research shouldn&apos;t be a <em style={{ fontStyle: "normal", color: ACCENT }}>guessing game.</em>
          </h2>
          <p className="pl-section-sub" style={{ marginTop: 0, marginBottom: 40 }}>
            Ingest your first document and see every answer traced back to its source.
          </p>
          <div className="pl-cta-row" style={{ justifyContent: "center", marginTop: 0 }}>
            <Link href="/register" className="pl-btn-primary" style={{ padding: "14px 28px", fontSize: 14.5 }}>
              Create account <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="pl-btn-secondary" style={{ padding: "13px 27px", fontSize: 14.5 }}>
              Sign in
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="pl-footer">
        <div className="pl-footer-brand">
          <span className="pl-logo-mark" style={{ width: 22, height: 22 }} />
          <span style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)", fontSize: 14, letterSpacing: "0.04em", color: "rgba(255,255,255,0.5)" }}>PRISM</span>
        </div>
        <div className="pl-footer-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
          <a href="https://github.com/yamini-nlp/prism" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <span className="pl-footer-tag">Research Intelligence Platform</span>
      </footer>
    </div>
  );
}