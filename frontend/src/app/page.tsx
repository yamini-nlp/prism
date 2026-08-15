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
  { t: "PostgreSQL", d: "Storage for documents, chunks, results", icon: Database },
  { t: "all-MiniLM-L6-v2", d: "Sentence embeddings for dense retrieval", icon: SplitSquareVertical },
  { t: "BM25", d: "Lexical retrieval, fused with dense search", icon: Search },
  { t: "Cross-encoder", d: "Final relevance reordering of candidates", icon: SplitSquareVertical },
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

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  };
}

const DISPLAY_FONT = "var(--font-display, 'DM Serif Display', Georgia, serif)";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="pl-root">
      <style>{`
        .pl-root {
          background: #07070a;
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
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 84px;
          padding: 0 24px;
          background: rgba(7,7,10,0.86);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        @media (min-width: 768px) { .pl-header { padding: 0 48px; } }
        @media (min-width: 1200px) { .pl-header { padding: 0 80px; } }

        .pl-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .pl-logo-mark { width: 34px; height: 34px; border-radius: 9px; background: #ffffff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pl-logo-text { font-family: ${JSON.stringify(DISPLAY_FONT).slice(0)}; font-size: 21px; letter-spacing: -0.02em; color: #ffffff; }

        .pl-nav { display: none; align-items: center; gap: 40px; }
        @media (min-width: 900px) { .pl-nav { display: flex; } }
        .pl-nav a { font-family: var(--font-mono, monospace); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s ease; }
        .pl-nav a:hover { color: #ffffff; }

        .pl-header-actions { display: none; align-items: center; gap: 14px; }
        @media (min-width: 900px) { .pl-header-actions { display: flex; } }

        .pl-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 26px; border-radius: 9px; background: #ffffff; color: #07070a;
          font-size: 14px; font-weight: 700; text-decoration: none; border: none; cursor: pointer;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .pl-btn-primary:hover { opacity: 0.86; transform: translateY(-1px); }
        .pl-btn-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 25px; border-radius: 9px; background: transparent; color: #ffffff;
          font-size: 14px; font-weight: 600; text-decoration: none; border: 1px solid rgba(255,255,255,0.18);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .pl-btn-secondary:hover { border-color: rgba(255,255,255,0.5); transform: translateY(-1px); }

        .pl-menu-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.16); background: transparent; color: #ffffff; cursor: pointer; }
        @media (min-width: 900px) { .pl-menu-btn { display: none; } }

        .pl-mobile-menu { position: fixed; inset: 84px 0 auto 0; z-index: 40; background: #07070a; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 28px 24px 36px; display: flex; flex-direction: column; gap: 22px; }
        @media (min-width: 900px) { .pl-mobile-menu { display: none; } }
        .pl-mobile-menu a { color: #ffffff; font-size: 16px; text-decoration: none; }
        .pl-mobile-actions { display: flex; gap: 12px; margin-top: 8px; }
        .pl-mobile-actions > * { flex: 1; }

        .pl-hero { position: relative; overflow: hidden; padding: 88px 24px 96px; }
        @media (min-width: 768px) { .pl-hero { padding: 100px 48px 120px; } }
        @media (min-width: 1200px) { .pl-hero { padding: 140px 80px 150px; } }
        .pl-hero-glow { position: absolute; inset: 0 0 auto 0; height: 760px; pointer-events: none;
          background: radial-gradient(ellipse 50% 45% at 50% 0%, rgba(91,94,244,0.16), transparent 70%),
                      radial-gradient(ellipse 35% 30% at 92% 6%, rgba(212,98,42,0.08), transparent 60%); }
        .pl-hero-grid { position: relative; max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 72px; }
        @media (min-width: 1100px) { .pl-hero-grid { grid-template-columns: 1.05fr 0.95fr; align-items: center; gap: 96px; } }

        .pl-eyebrow { display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 999px; background: rgba(125,128,246,0.14); color: #a3a6f8; font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 32px; }

        .pl-h1 { font-family: ${JSON.stringify(DISPLAY_FONT).slice(0)}; font-weight: 400; font-size: clamp(40px, 6vw, 68px); line-height: 1.05; letter-spacing: -0.03em; color: #ffffff; max-width: 600px; margin: 0; }
        .pl-h1 em { font-style: normal; color: #a3a6f8; }

        .pl-lead { margin-top: 32px; max-width: 470px; font-size: 17px; line-height: 1.75; color: rgba(255,255,255,0.56); }

        .pl-cta-row { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 44px; }

        .pl-trust-strip { margin-top: 80px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.09); display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px 24px; max-width: 580px; }
        @media (min-width: 560px) { .pl-trust-strip { grid-template-columns: repeat(4, 1fr); } }
        .pl-trust-item { padding-left: 0; }
        .pl-trust-item.bordered { border-left: 1px solid rgba(255,255,255,0.09); padding-left: 20px; }
        .pl-trust-value { font-family: var(--font-mono, monospace); font-size: 13px; font-weight: 600; line-height: 1.4; color: #ffffff; }
        .pl-trust-label { margin-top: 8px; font-family: var(--font-mono, monospace); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); }

        .pl-mock { border-radius: 16px; overflow: hidden; background: #0e0e12; border: 1px solid rgba(255,255,255,0.09); box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 44px 90px -26px rgba(0,0,0,0.75); }
        .pl-mock-top { display: flex; align-items: center; gap: 8px; padding: 16px 22px; background: #131317; border-bottom: 1px solid rgba(255,255,255,0.09); }
        .pl-mock-dot { width: 10px; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.16); }
        .pl-mock-url { margin-left: 10px; padding: 5px 14px; border-radius: 999px; background: rgba(255,255,255,0.05); font-family: var(--font-mono, monospace); font-size: 10.5px; color: rgba(255,255,255,0.5); }
        .pl-mock-body { display: flex; flex-direction: column; gap: 20px; padding: 26px; }
        .pl-mock-user { margin-left: auto; max-width: 78%; border-radius: 16px 16px 4px 16px; background: #ffffff; color: #07070a; padding: 12px 18px; font-size: 13.5px; }
        .pl-mock-ai { max-width: 92%; border-radius: 16px 16px 16px 4px; border: 1px solid rgba(255,255,255,0.09); background: #131317; color: rgba(255,255,255,0.8); padding: 15px 18px; font-size: 13.5px; line-height: 1.7; }
        .pl-mock-ai .mark { font-family: var(--font-mono, monospace); font-weight: 700; color: #a3a6f8; }
        .pl-chip-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .pl-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.09); font-family: var(--font-mono, monospace); font-size: 10.5px; color: rgba(255,255,255,0.55); }
        .pl-verify-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.09); }
        .pl-verify-cell { border-radius: 10px; padding: 12px 14px; }
        .pl-verify-pct { font-family: var(--font-mono, monospace); font-size: 16px; font-weight: 700; }
        .pl-verify-label { margin-top: 4px; font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .pl-bars { display: flex; align-items: flex-end; gap: 7px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.09); height: 46px; }
        .pl-bar { flex: 1; border-radius: 4px 4px 0 0; background: linear-gradient(180deg,#a3a6f8,#5b5ef4); opacity: 0.9; }
        .pl-bars-caption { margin-top: 12px; font-family: var(--font-mono, monospace); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.35); }

        .pl-section { padding: 96px 24px; }
        @media (min-width: 768px) { .pl-section { padding: 116px 48px; } }
        @media (min-width: 1200px) { .pl-section { padding: 150px 80px; } }
        .pl-section.tight { padding-top: 76px; padding-bottom: 76px; }
        @media (min-width: 768px) { .pl-section.tight { padding-top: 92px; padding-bottom: 92px; } }
        .pl-section.surface { background: #0c0c0f; }
        .pl-section-inner { max-width: 1320px; margin: 0 auto; }

        .pl-section-head { max-width: 660px; margin-bottom: 76px; }
        .pl-label { font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(255,255,255,0.42); margin-bottom: 20px; }
        .pl-h2 { font-family: ${JSON.stringify(DISPLAY_FONT).slice(0)}; font-weight: 400; font-size: clamp(30px, 4vw, 48px); line-height: 1.12; letter-spacing: -0.03em; color: #ffffff; margin: 0; }
        .pl-h2.small { font-size: clamp(28px, 3.2vw, 40px); }
        .pl-section-sub { margin-top: 24px; font-size: 16px; line-height: 1.75; color: rgba(255,255,255,0.5); }

        .pl-grid { display: grid; gap: 28px; }
        .pl-grid.cols-2 { grid-template-columns: 1fr; }
        @media (min-width: 700px) { .pl-grid.cols-2 { grid-template-columns: 1fr 1fr; } }
        .pl-grid.cols-3 { grid-template-columns: 1fr; }
        @media (min-width: 700px) { .pl-grid.cols-3 { grid-template-columns: repeat(3, 1fr); } }
        .pl-grid.cols-4 { grid-template-columns: 1fr; }
        @media (min-width: 640px) { .pl-grid.cols-4 { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1050px) { .pl-grid.cols-4 { grid-template-columns: repeat(4, 1fr); } }

        .pl-card { background: #0e0e12; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 34px; display: flex; flex-direction: column; gap: 18px; }
        .pl-card.raised { background: #131317; }
        .pl-card-num { font-family: var(--font-mono, monospace); font-size: 12px; color: rgba(255,255,255,0.28); }
        .pl-card-title { font-size: 16.5px; font-weight: 700; color: #ffffff; }
        .pl-card-title.serif { font-family: ${JSON.stringify(DISPLAY_FONT).slice(0)}; font-weight: 400; font-size: 24px; letter-spacing: -0.01em; }
        .pl-card-desc { font-size: 14px; line-height: 1.75; color: rgba(255,255,255,0.5); }

        .pl-icon-badge { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(125,128,246,0.13); flex-shrink: 0; }
        .pl-icon-badge.plain { background: rgba(255,255,255,0.055); }

        .pl-feature-span-2 { grid-column: span 1; }
        @media (min-width: 700px) { .pl-feature-span-2.big { grid-column: span 2; } }

        .pl-two-col { display: grid; grid-template-columns: 1fr; gap: 60px; }
        @media (min-width: 900px) { .pl-two-col { grid-template-columns: 0.8fr 1.2fr; gap: 100px; align-items: start; } }
        .pl-editorial p { font-size: 17px; line-height: 1.9; color: rgba(255,255,255,0.62); margin: 0 0 30px; }
        .pl-editorial p:last-child { margin-bottom: 0; }

        .pl-flow { max-width: 660px; margin: 0 auto; }
        .pl-flow-step { display: flex; gap: 26px; }
        .pl-flow-rail { display: flex; flex-direction: column; align-items: center; }
        .pl-flow-num { width: 42px; height: 42px; border-radius: 999px; background: #131317; border: 1px solid rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono, monospace); font-size: 13px; font-weight: 700; color: #ffffff; flex-shrink: 0; }
        .pl-flow-line { width: 1px; flex: 1; background: rgba(255,255,255,0.09); min-height: 52px; }
        .pl-flow-body { flex: 1; padding-bottom: 48px; }
        .pl-flow-title { padding-top: 8px; font-size: 16.5px; font-weight: 700; color: #ffffff; }
        .pl-flow-desc { margin-top: 10px; font-size: 14px; line-height: 1.75; color: rgba(255,255,255,0.5); }

        .pl-diff-card { display: flex; gap: 22px; }

        .pl-security-row { display: flex; flex-direction: column; gap: 28px; max-width: 1320px; margin: 0 auto; }
        @media (min-width: 700px) { .pl-security-row { flex-direction: row; align-items: center; justify-content: space-between; } }
        .pl-security-left { display: flex; align-items: flex-start; gap: 20px; max-width: 540px; }

        .pl-final { display: flex; justify-content: center; text-align: center; }
        .pl-final-inner { max-width: 760px; }

        .pl-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px; padding: 40px 24px; border-top: 1px solid rgba(255,255,255,0.08); }
        @media (min-width: 768px) { .pl-footer { padding: 40px 48px; } }
        @media (min-width: 1200px) { .pl-footer { padding: 40px 80px; } }
        .pl-footer-brand { display: flex; align-items: center; gap: 10px; }
        .pl-footer-links { display: flex; flex-wrap: wrap; gap: 30px; }
        .pl-footer-links a { font-family: var(--font-mono, monospace); font-size: 12px; color: rgba(255,255,255,0.36); text-decoration: none; }
        .pl-footer-tag { font-family: var(--font-mono, monospace); font-size: 11px; color: rgba(255,255,255,0.3); }
      `}</style>

      <header className="pl-header">
        <Link href="/" className="pl-logo">
          <span className="pl-logo-mark">
            <Zap size={16} color="#07070a" strokeWidth={2.5} />
          </span>
          <span className="pl-logo-text">Prism</span>
        </Link>

        <nav className="pl-nav">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </nav>

        <div className="pl-header-actions">
          <Link href="/login" className="pl-btn-secondary">Sign in</Link>
          <Link href="/register" className="pl-btn-primary">
            Get started <ArrowRight size={14} color="#07070a" />
          </Link>
        </div>

        <button onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu" className="pl-menu-btn">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
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
        <div className="pl-hero-grid">
          <motion.div {...fadeUp(0)}>
            <span className="pl-eyebrow">Research intelligence platform</span>

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
              <Link href="/register" className="pl-btn-primary" style={{ padding: "15px 30px", fontSize: 15 }}>
                Start Research <ArrowRight size={17} color="#07070a" />
              </Link>
              <Link href="/login" className="pl-btn-secondary" style={{ padding: "14px 29px", fontSize: 15 }}>
                Sign in <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="pl-trust-strip">
              {TRUST_STRIP.map((s, i) => (
                <div key={s.label} className={`pl-trust-item ${i > 0 ? "bordered" : ""}`}>
                  <div className="pl-trust-value">{s.value}</div>
                  <div className="pl-trust-label">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)}>
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
                  <div className="pl-verify-cell" style={{ background: "rgba(61,153,112,0.13)" }}>
                    <div className="pl-verify-pct" style={{ color: "#69d3a8" }}>82%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(105,211,168,0.8)" }}>Supported</div>
                  </div>
                  <div className="pl-verify-cell" style={{ background: "rgba(212,98,42,0.13)" }}>
                    <div className="pl-verify-pct" style={{ color: "#eea173" }}>12%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(238,161,115,0.8)" }}>Uncertain</div>
                  </div>
                  <div className="pl-verify-cell" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="pl-verify-pct" style={{ color: "rgba(255,255,255,0.75)" }}>6%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(255,255,255,0.4)" }}>Unsupported</div>
                  </div>
                </div>

                <div className="pl-bars">
                  {[38, 62, 46, 80, 58, 70, 90].map((h, i) => (
                    <div key={i} className="pl-bar" style={{ height: `${h * 0.46}px` }} />
                  ))}
                </div>
                <div className="pl-bars-caption">Generation volume, last 7 days</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="problem" className="pl-section">
        <div className="pl-section-inner">
          <motion.div {...fadeUp(0)} className="pl-section-head">
            <div className="pl-label">The problem</div>
            <h2 className="pl-h2">Research is slow because trust is expensive.</h2>
            <p className="pl-section-sub">
              Reading everything takes too long. Trusting a fluent AI answer without a source takes a
              different kind of too long, once you count the time spent checking it.
            </p>
          </motion.div>

          <div className="pl-grid cols-2">
            {PROBLEMS.map((p, i) => (
              <motion.div key={p.n} {...fadeUp(i * 0.06)} className="pl-card">
                <span className="pl-card-num">{p.n}</span>
                <div className="pl-card-title">{p.t}</div>
                <div className="pl-card-desc">{p.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-section-inner">
          <div className="pl-two-col">
            <motion.div {...fadeUp(0)}>
              <div className="pl-label">What is Prism?</div>
              <h2 className="pl-h2 small">A research assistant that shows its work.</h2>
            </motion.div>

            <motion.div {...fadeUp(0.08)} className="pl-editorial">
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
                same place: researchers, students, and knowledge workers moving through papers, reports,
                and long-form material.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="pl-section">
        <div className="pl-section-inner">
          <motion.div {...fadeUp(0)} className="pl-section-head" style={{ marginBottom: 56 }}>
            <div className="pl-label">Capabilities</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>A complete research intelligence stack.</h2>
          </motion.div>

          <div className="pl-grid cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.t}
                {...fadeUp(i * 0.05)}
                className={`pl-card pl-feature-span-2 ${f.big ? "big" : ""}`}
                style={{ minHeight: 190 }}
              >
                <span className="pl-icon-badge">
                  <f.icon size={17} color="#a3a6f8" />
                </span>
                <div className="pl-card-title">{f.t}</div>
                <div className="pl-card-desc">{f.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pipeline" className="pl-section surface">
        <div className="pl-section-inner">
          <motion.div {...fadeUp(0)} className="pl-section-head">
            <div className="pl-label">How it works</div>
            <h2 className="pl-h2">From raw source to verified insight.</h2>
          </motion.div>

          <div className="pl-grid cols-4">
            {STAGES.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.07)} className="pl-card raised" style={{ minHeight: 250 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="pl-card-num">{s.n}</span>
                  <span className="pl-icon-badge plain">
                    <s.icon size={15} color="rgba(255,255,255,0.65)" />
                  </span>
                </div>
                <div className="pl-card-title serif">{s.t}</div>
                <div className="pl-card-desc">{s.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="pl-section">
        <div className="pl-section-inner">
          <motion.div {...fadeUp(0)} className="pl-section-head" style={{ maxWidth: 700 }}>
            <div className="pl-label">Retrieval architecture</div>
            <h2 className="pl-h2 small">Engineered retrieval, not a wrapper around an LLM.</h2>
            <p className="pl-section-sub">
              Every answer passes through a fixed pipeline of retrieval and verification stages before it
              reaches the interface. Nothing here is a single prompt to a model.
            </p>
          </motion.div>

          <div className="pl-flow">
            {ARCHITECTURE_FLOW.map((step, i) => (
              <motion.div key={step.t} {...fadeUp(i * 0.05)} className="pl-flow-step">
                <div className="pl-flow-rail">
                  <div className="pl-flow-num">{i + 1}</div>
                  {i < ARCHITECTURE_FLOW.length - 1 && <div className="pl-flow-line" />}
                </div>
                <div className="pl-flow-body">
                  <div className="pl-flow-title">{step.t}</div>
                  <div className="pl-flow-desc">{step.d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="pl-section surface">
        <div className="pl-section-inner">
          <motion.div {...fadeUp(0)} className="pl-section-head" style={{ marginBottom: 56 }}>
            <div className="pl-label">Inside the app</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Eight workspaces, one pipeline.</h2>
          </motion.div>

          <div className="pl-grid cols-4" style={{ gap: 22 }}>
            {PRODUCT_PAGES.map((p, i) => (
              <motion.div key={p.label} {...fadeUp(i * 0.04)} className="pl-card raised" style={{ padding: 26, gap: 14 }}>
                <p.icon size={17} color="rgba(255,255,255,0.5)" />
                <div className="pl-card-title" style={{ fontSize: 14.5 }}>{p.label}</div>
                <div className="pl-card-desc" style={{ fontSize: 12.5 }}>{p.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-section-inner">
          <motion.div {...fadeUp(0)} className="pl-section-head" style={{ marginBottom: 56 }}>
            <div className="pl-label">Why Prism</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Different from a chat window pointed at your files.</h2>
          </motion.div>

          <div className="pl-grid cols-2">
            {DIFFERENTIATORS.map((d, i) => (
              <motion.div key={d.t} {...fadeUp(i * 0.06)} className="pl-card pl-diff-card">
                <span className="pl-icon-badge plain" style={{ width: 44, height: 44 }}>
                  <d.icon size={18} color="rgba(255,255,255,0.65)" />
                </span>
                <div>
                  <div className="pl-card-title">{d.t}</div>
                  <div className="pl-card-desc" style={{ marginTop: 8 }}>{d.d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section surface tight">
        <div className="pl-section-inner">
          <motion.div {...fadeUp(0)} className="pl-section-head" style={{ marginBottom: 48 }}>
            <div className="pl-label">Built on</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>A real pipeline underneath the interface.</h2>
          </motion.div>

          <div className="pl-grid cols-4" style={{ gap: 22 }}>
            {STACK.map((s, i) => (
              <motion.div key={s.t} {...fadeUp(i * 0.03)} className="pl-card raised" style={{ padding: 24, gap: 14 }}>
                <s.icon size={16} color="rgba(255,255,255,0.45)" />
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{s.t}</div>
                <div className="pl-card-desc" style={{ fontSize: 12 }}>{s.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-section-inner">
          <motion.div {...fadeUp(0)} className="pl-section-head" style={{ marginBottom: 56 }}>
            <div className="pl-label">Who it&apos;s for</div>
            <h2 className="pl-h2 small" style={{ maxWidth: 620 }}>Built for anyone who works from documents.</h2>
          </motion.div>

          <div className="pl-grid cols-3">
            {USE_CASES.map((u, i) => (
              <motion.div key={u.t} {...fadeUp(i * 0.06)} className="pl-card">
                <div className="pl-card-title">{u.t}</div>
                <div className="pl-card-desc">{u.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section surface tight">
        <div className="pl-security-row">
          <motion.div {...fadeUp(0)} className="pl-security-left">
            <span className="pl-icon-badge plain" style={{ width: 46, height: 46 }}>
              <Lock size={19} color="rgba(255,255,255,0.65)" />
            </span>
            <div>
              <div className="pl-card-title">Session-scoped by design</div>
              <p className="pl-card-desc" style={{ marginTop: 10 }}>
                Every request carries a signed JWT session, and protected workspace routes stay
                inaccessible until you&apos;re authenticated.
              </p>
            </div>
          </motion.div>
          <motion.div {...fadeUp(0.06)} style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
            Signed sessions · Protected routes
          </motion.div>
        </div>
      </section>

      <section id="workflow" className="pl-section pl-final">
        <motion.div {...fadeUp(0)} className="pl-final-inner">
          <span className="pl-eyebrow">Ready when you are</span>
          <h2 className="pl-h2" style={{ marginTop: 0, marginBottom: 28, fontSize: "clamp(32px,4.6vw,54px)" }}>
            Research shouldn&apos;t be a <em style={{ color: "#a3a6f8" }}>guessing game.</em>
          </h2>
          <p className="pl-section-sub" style={{ marginTop: 0, marginBottom: 44 }}>
            Ingest your first document and see every answer traced back to its source.
          </p>
          <div className="pl-cta-row" style={{ justifyContent: "center", marginTop: 0 }}>
            <Link href="/register" className="pl-btn-primary" style={{ padding: "15px 30px", fontSize: 15 }}>
              Create account <ArrowRight size={17} color="#07070a" />
            </Link>
            <Link href="/login" className="pl-btn-secondary" style={{ padding: "14px 29px", fontSize: 15 }}>
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="pl-footer">
        <div className="pl-footer-brand">
          <span className="pl-logo-mark" style={{ width: 26, height: 26, borderRadius: 7 }}>
            <Zap size={12} color="#07070a" strokeWidth={2.5} />
          </span>
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 15, color: "rgba(255,255,255,0.5)" }}>Prism</span>
        </div>
        <div className="pl-footer-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </div>
        <span className="pl-footer-tag">Research Intelligence Platform</span>
      </footer>
    </div>
  );
}