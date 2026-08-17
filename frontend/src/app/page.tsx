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

const INK = "#111110";
const INK_RAISED = "#17171a";
const PAPER = "#f7f6f3";
const PAPER_CARD = "#ffffff";
const INDIGO = "#5b5ef4";
const INDIGO_DEEP = "#4547c4";
const INDIGO_SOFT = "rgba(91,94,244,0.14)";
const ORANGE_DEEP = "#b5491f";
const ORANGE_SOFT = "rgba(212,98,42,0.14)";

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
        .pl-logo-mark { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, ${INDIGO}, ${INDIGO_DEEP}); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
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

        .pl-hero { position: relative; padding: 56px 24px 80px; }
        @media (min-width: 768px) { .pl-hero { padding: 64px 48px 100px; } }
        @media (min-width: 1200px) { .pl-hero { padding: 84px 80px 128px; } }
        .pl-hero-grid { position: relative; max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 64px; }
        @media (min-width: 1100px) { .pl-hero-grid { grid-template-columns: 1.05fr 0.95fr; align-items: center; gap: 88px; } }

        .pl-hero-kicker { font-family: var(--font-sans, 'Syne', system-ui, sans-serif); font-size: 13px; font-weight: 800; letter-spacing: 0.32em; text-transform: uppercase; color: #ffffff; margin-bottom: 16px; }

        .pl-eyebrow-row { display: flex; align-items: center; gap: 9px; font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${INDIGO}; margin-bottom: 20px; }
        .pl-eyebrow-dot { width: 6px; height: 6px; border-radius: 999px; background: ${INDIGO}; }

        .pl-h1 { font-family: var(--font-display, 'DM Serif Display', Georgia, serif); font-weight: 400; font-size: clamp(38px, 5.6vw, 64px); line-height: 1.08; letter-spacing: -0.03em; color: #ffffff; max-width: 600px; margin: 0; }
        .pl-h1 em { font-style: normal; color: ${INDIGO}; background: linear-gradient(135deg, #a3a6f8, ${INDIGO}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

        .pl-lead { margin-top: 26px; max-width: 470px; font-size: 17px; line-height: 1.75; color: rgba(255,255,255,0.58); }

        .pl-cta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 38px; }

        .pl-trust-strip { margin-top: 60px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.09); display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 620px; }
        @media (min-width: 560px) { .pl-trust-strip { grid-template-columns: repeat(4, 1fr); } }
        .pl-trust-item { padding: 14px 15px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .pl-trust-value { font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 700; line-height: 1.4; color: #ffffff; }
        .pl-trust-label { margin-top: 8px; font-family: var(--font-mono, monospace); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); }

        .pl-mock { border-radius: 18px; overflow: hidden; background: ${INK_RAISED}; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 44px 90px -30px rgba(0,0,0,0.75); }
        .pl-mock-top { display: flex; align-items: center; gap: 8px; padding: 15px 20px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .pl-mock-dot { width: 9px; height: 9px; border-radius: 999px; background: rgba(255,255,255,0.16); }
        .pl-mock-url { margin-left: 8px; padding: 5px 13px; border-radius: 999px; background: rgba(255,255,255,0.05); font-family: var(--font-mono, monospace); font-size: 10px; color: rgba(255,255,255,0.5); }
        .pl-mock-body { display: flex; flex-direction: column; gap: 18px; padding: 24px; }
        .pl-mock-user { margin-left: auto; max-width: 78%; border-radius: 14px 14px 3px 14px; background: ${INDIGO}; color: #ffffff; padding: 11px 16px; font-size: 13px; }
        .pl-mock-ai { max-width: 94%; border-radius: 14px 14px 14px 3px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); color: rgba(255,255,255,0.82); padding: 15px 17px; font-size: 13px; line-height: 1.7; }
        .pl-mock-ai .mark { font-family: var(--font-mono, monospace); font-weight: 700; color: ${INDIGO}; opacity: 0.95; }
        .pl-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .pl-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); font-family: var(--font-mono, monospace); font-size: 10px; color: rgba(255,255,255,0.55); }
        .pl-verify-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
        .pl-verify-cell { border-radius: 10px; padding: 11px 13px; }
        .pl-verify-pct { font-family: var(--font-mono, monospace); font-size: 15px; font-weight: 700; }
        .pl-verify-label { margin-top: 4px; font-family: var(--font-mono, monospace); font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .pl-method-row { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 4px; }
        .pl-method-tag { font-family: var(--font-mono, monospace); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.42); padding: 5px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); }

        .pl-section { padding: 88px 24px; }
        @media (min-width: 768px) { .pl-section { padding: 108px 48px; } }
        @media (min-width: 1200px) { .pl-section { padding: 140px 80px; } }
        .pl-section.tight { padding-top: 72px; padding-bottom: 72px; }
        @media (min-width: 768px) { .pl-section.tight { padding-top: 84px; padding-bottom: 84px; } }
        .pl-section.paper { background: ${PAPER}; color: ${INK}; }
        .pl-section-inner { max-width: 1320px; margin: 0 auto; }

        .pl-section-head { max-width: 660px; margin-bottom: 72px; }
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

        .pl-icon-badge { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: ${INDIGO_SOFT}; flex-shrink: 0; }
        .pl-icon-badge.plain { background: rgba(255,255,255,0.06); }
        .paper .pl-icon-badge.plain { background: rgba(17,17,16,0.06); }
        .pl-icon-badge.orange { background: ${ORANGE_SOFT}; }

        .pl-feature-span-2 { grid-column: span 1; }
        @media (min-width: 700px) { .pl-feature-span-2.big { grid-column: span 2; } }

        .pl-two-col { display: grid; grid-template-columns: 1fr; gap: 56px; }
        @media (min-width: 900px) { .pl-two-col { grid-template-columns: 0.8fr 1.2fr; gap: 96px; align-items: start; } }
        .pl-editorial p { font-size: 17px; line-height: 1.9; color: rgba(255,255,255,0.64); margin: 0 0 28px; }
        .paper .pl-editorial p { color: rgba(17,17,16,0.68); }
        .pl-editorial p:last-child { margin-bottom: 0; }
        .pl-editorial strong { color: #ffffff; font-weight: 700; }
        .paper .pl-editorial strong { color: ${INK}; }

        .pl-flow { max-width: 660px; margin: 0 auto; }
        .pl-flow-step { display: flex; gap: 24px; }
        .pl-flow-rail { display: flex; flex-direction: column; align-items: center; }
        .pl-flow-num { width: 40px; height: 40px; border-radius: 999px; background: rgba(17,17,16,0.04); border: 1px solid rgba(17,17,16,0.16); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono, monospace); font-size: 12.5px; font-weight: 700; color: ${INK}; flex-shrink: 0; }
        .pl-flow-line { width: 1px; flex: 1; background: rgba(17,17,16,0.12); min-height: 48px; }
        .pl-flow-body { flex: 1; padding-bottom: 44px; }
        .pl-flow-title { padding-top: 6px; font-size: 16px; font-weight: 700; color: ${INK}; }
        .pl-flow-desc { margin-top: 9px; font-size: 13.5px; line-height: 1.75; color: rgba(17,17,16,0.58); }

        .pl-diff-card { display: flex; gap: 20px; }

        .pl-security-row { display: flex; flex-direction: column; gap: 26px; max-width: 1320px; margin: 0 auto; }
        @media (min-width: 700px) { .pl-security-row { flex-direction: row; align-items: center; justify-content: space-between; } }
        .pl-security-left { display: flex; align-items: flex-start; gap: 18px; max-width: 540px; }

        .pl-final { display: flex; justify-content: center; text-align: center; position: relative; overflow: hidden; }
        .pl-final-glow { position: absolute; top: 50%; left: 50%; width: 900px; height: 500px; transform: translate(-50%, -50%); background: radial-gradient(ellipse at center, rgba(91,94,244,0.16), transparent 70%); pointer-events: none; }
        .pl-final-inner { max-width: 760px; position: relative; }
        .pl-eyebrow-pill { display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 999px; background: ${INDIGO_SOFT}; color: #a3a6f8; font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 30px; }

        .pl-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding: 36px 24px; border-top: 1px solid rgba(255,255,255,0.08); }
        @media (min-width: 768px) { .pl-footer { padding: 36px 48px; } }
        @media (min-width: 1200px) { .pl-footer { padding: 36px 80px; } }
        .pl-footer-brand { display: flex; align-items: center; gap: 10px; }
        .pl-footer-links { display: flex; flex-wrap: wrap; gap: 28px; }
        .pl-footer-links a { font-family: var(--font-mono, monospace); font-size: 11.5px; color: rgba(255,255,255,0.38); text-decoration: none; transition: color 0.2s ease; }
        .pl-footer-links a:hover { color: rgba(255,255,255,0.8); }
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
        <div className="pl-hero-grid">
          <Reveal>
            <div className="pl-eyebrow-row">
              <span className="pl-eyebrow-dot" />
              Research intelligence platform
            </div>

            <h1 className="pl-h1">
              Read less.
              <br />
              Know <em>more.</em>
            </h1>

            <p className="pl-lead">
              Prism turns papers, reports, and raw text into grounded, citation-backed answers.
              Every claim is checked against its retrieved source and scored before it reaches you.
            </p>

            <div className="pl-cta-row">
              <Link href="/register" className="pl-btn-primary" style={{ padding: "14px 28px", fontSize: 14.5 }}>
                Start Research <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="pl-btn-secondary" style={{ padding: "13px 27px", fontSize: 14.5 }}>
                Sign in <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="pl-trust-strip">
              {TRUST_STRIP.map((s) => (
                <div key={s.label} className="pl-trust-item">
                  <div className="pl-trust-value">{s.value}</div>
                  <div className="pl-trust-label">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="pl-mock">
              <div className="pl-mock-top">
                <span className="pl-mock-dot" />
                <span className="pl-mock-dot" />
                <span className="pl-mock-dot" />
                <span className="pl-mock-url">prism.app/workspace</span>
              </div>

              <div className="pl-mock-body">
                <div className="pl-mock-user">What did the ablation study find?</div>

                <div className="pl-mock-ai">
                  Removing the reranking stage reduced retrieval precision by a measurable margin{" "}
                  <span className="mark">[1]</span>, while the hybrid dense and keyword setup outperformed
                  either method alone <span className="mark">[2]</span>.
                </div>

                <div className="pl-chip-row">
                  <span className="pl-chip">[1] ablation_results.pdf · 0.91</span>
                  <span className="pl-chip">[2] retrieval_ablation.pdf · 0.87</span>
                </div>

                <div className="pl-verify-row">
                  <div className="pl-verify-cell" style={{ background: "rgba(61,153,112,0.14)" }}>
                    <div className="pl-verify-pct" style={{ color: "#69d3a8" }}>82%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(105,211,168,0.8)" }}>Supported</div>
                  </div>
                  <div className="pl-verify-cell" style={{ background: "rgba(212,98,42,0.14)" }}>
                    <div className="pl-verify-pct" style={{ color: "#eea173" }}>12%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(238,161,115,0.8)" }}>Uncertain</div>
                  </div>
                  <div className="pl-verify-cell" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="pl-verify-pct" style={{ color: "rgba(255,255,255,0.75)" }}>6%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(255,255,255,0.4)" }}>Unsupported</div>
                  </div>
                </div>

                <div className="pl-method-row">
                  <span className="pl-method-tag">Dense search</span>
                  <span className="pl-method-tag">BM25</span>
                  <span className="pl-method-tag">RRF fusion</span>
                  <span className="pl-method-tag">Cross-encoder rerank</span>
                </div>
              </div>
            </div>
          </Reveal>
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

          <div className="pl-grid cols-2">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.05} className="pl-card">
                <span className="pl-card-num">{p.n}</span>
                <div className="pl-card-title">{p.t}</div>
                <div className="pl-card-desc">{p.d}</div>
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
              <h2 className="pl-h2 small">A research assistant that shows its work.</h2>
            </Reveal>

            <Reveal delay={0.08} className="pl-editorial">
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

          <div className="pl-grid cols-3">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.t}
                delay={i * 0.04}
                className={`pl-card pl-feature-span-2 ${f.big ? "big" : ""}`}
                style={{ minHeight: 184 }}
              >
                <span className="pl-icon-badge">
                  <f.icon size={17} color={INDIGO_DEEP} />
                </span>
                <div className="pl-card-title">{f.t}</div>
                <div className="pl-card-desc">{f.d}</div>
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
              <Reveal key={s.n} delay={i * 0.05} className="pl-card" style={{ minHeight: 240 }}>
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
          <Reveal className="pl-section-head" style={{ maxWidth: 700 }}>
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
      </section>

      <section id="product" className="pl-section">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head" style={{ marginBottom: 52 }}>
            <div className="pl-label">Inside the app</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Eight workspaces, one pipeline.</h2>
          </Reveal>

          <div className="pl-grid cols-4" style={{ gap: 20 }}>
            {PRODUCT_PAGES.map((p, i) => (
              <Reveal key={p.label} delay={i * 0.03} className="pl-card" style={{ padding: 24, gap: 13 }}>
                <p.icon size={17} color="rgba(255,255,255,0.55)" />
                <div className="pl-card-title" style={{ fontSize: 14 }}>{p.label}</div>
                <div className="pl-card-desc" style={{ fontSize: 12.5 }}>{p.d}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head" style={{ marginBottom: 52 }}>
            <div className="pl-label">Why Prism</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Different from a chat window pointed at your files.</h2>
          </Reveal>

          <div className="pl-grid cols-2">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.t} delay={i * 0.05} className="pl-card pl-diff-card">
                <span className="pl-icon-badge orange" style={{ width: 44, height: 44 }}>
                  <d.icon size={18} color={ORANGE_DEEP} />
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

          <div className="pl-grid cols-4" style={{ gap: 20 }}>
            {STACK.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.02} className="pl-card" style={{ padding: 22, gap: 13 }}>
                <s.icon size={16} color="rgba(255,255,255,0.48)" />
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12.5, fontWeight: 700, color: "#ffffff" }}>{s.t}</div>
                <div className="pl-card-desc" style={{ fontSize: 12 }}>{s.d}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head" style={{ marginBottom: 52 }}>
            <div className="pl-label">Who it&apos;s for</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Built for anyone who works from documents.</h2>
          </Reveal>

          <div className="pl-grid cols-3">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.t} delay={i * 0.05} className="pl-card">
                <div className="pl-card-title">{u.t}</div>
                <div className="pl-card-desc">{u.d}</div>
              </Reveal>
            ))}
          </div>
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
            Research shouldn&apos;t be a <em style={{ fontStyle: "normal", color: INDIGO }}>guessing game.</em>
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
          <span className="pl-logo-mark" style={{ width: 26, height: 26, borderRadius: 7 }}>
            <Sparkles size={12} color="#ffffff" strokeWidth={2.25} />
          </span>
          <span style={{ fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)", fontSize: 14.5, letterSpacing: "0.02em", color: "rgba(255,255,255,0.5)" }}>PRISM</span>
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