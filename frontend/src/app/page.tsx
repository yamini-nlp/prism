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

const INK = "#0a0a0d";
const INK_RAISED = "#141419";
const INK_RAISED_2 = "#1a1a20";
const PAPER = "#f3f0e8";
const PAPER_CARD = "#fdfcf9";
const LINE_ON_INK = "rgba(255,255,255,0.09)";
const LINE_ON_PAPER = "rgba(10,10,13,0.1)";

const GOLD = "#e8c547";
const ROSE = "#ef6f8e";
const TEAL = "#2bbfa3";
const BLUE = "#5a8fef";
const SPECTRUM = [GOLD, ROSE, TEAL, BLUE];
const SPECTRUM_GRADIENT = `linear-gradient(100deg, ${GOLD}, ${ROSE} 38%, ${TEAL} 68%, ${BLUE})`;

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#pipeline" },
  { label: "Use cases", href: "#use-cases" },
];

const TRUST_STRIP = [
  { label: "Retrieval", value: "Dense + BM25, fused" },
  { label: "Generation", value: "Llama 3.3 70B · Groq" },
  { label: "Verification", value: "Per claim, per sentence" },
  { label: "Stages", value: "4, source to verified answer" },
];

const PROBLEMS = [
  { t: "Sources pile up, understanding doesn't", d: "Papers and long documents accumulate faster than anyone can read them, and the part that matters is usually buried on a page nobody reopens." },
  { t: "Generic chat answers aren't accountable", d: "An ordinary AI chat produces a fluent answer with no link back to a source, so every claim has to be manually re-checked before it can be trusted." },
  { t: "Keyword search misses the point", d: "Plain keyword search returns pages that contain the words but not the meaning, which means skimming by hand for the passage that actually answers the question." },
  { t: "Verification is left as homework", d: "Even when an answer looks right, checking it against the original material is a separate, tedious step most workflows quietly skip." },
];

const FEATURES = [
  { t: "Multi-format ingestion", d: "PDF, DOCX, DOC, TXT, URLs, and pasted text all flow through the same chunking and embedding pipeline, tracked through a background job.", icon: Upload, c: GOLD },
  { t: "Hybrid retrieval", d: "Dense embeddings and BM25 keyword search are fused with reciprocal rank fusion, then reordered by a cross-encoder reranker.", icon: SplitSquareVertical, c: ROSE },
  { t: "Claim-level verification", d: "Every sentence in an answer is scored against its retrieved evidence and labeled supported, uncertain, or unsupported.", icon: ShieldCheck, c: TEAL },
  { t: "Structured summarization", d: "TLDR, key concepts, methodology, results, and limitations returned as one brief instead of a wall of text.", icon: Layers, c: BLUE },
  { t: "Retrieval transparency", d: "Inspect the exact chunks, source documents, and similarity scores behind every answer, not just the final text.", icon: FileSearch, c: TEAL },
  { t: "Evaluation harness", d: "Run recall@5, mean reciprocal rank, and groundedness metrics against your own workspace whenever you need a check.", icon: BarChart3, c: ROSE },
];

const PIPELINE = [
  { n: "01", t: "Ingest", d: "Upload a PDF, DOCX, DOC, or TXT file, fetch a URL, or paste raw text. Content is verified against its file signature, chunked, and embedded with all-MiniLM-L6-v2.", icon: Upload, c: GOLD },
  { n: "02", t: "Retrieve", d: "A query runs against dense vector search and BM25 keyword search in parallel, merged with reciprocal rank fusion, then reordered by a cross-encoder.", icon: Search, c: ROSE },
  { n: "03", t: "Generate", d: "Llama 3.3 70B on Groq answers strictly from the retrieved chunks. Every fact carries an inline source marker tied to the exact chunk it came from.", icon: Sparkles, c: TEAL },
  { n: "04", t: "Verify", d: "The answer is split into individual claims and matched against the retrieved context, then labeled supported, uncertain, or unsupported with a confidence score.", icon: ShieldCheck, c: BLUE },
];

const PRODUCT_PAGES = [
  { label: "Dashboard", icon: LayoutDashboard, d: "Live metrics across documents, generations, and verifications." },
  { label: "Ingest", icon: Upload, d: "Add sources by upload, URL, or pasted text, with staged job tracking." },
  { label: "Library", icon: BookOpen, d: "Every ingested document, searchable and sortable by size and chunks." },
  { label: "Workspace", icon: MessageSquare, d: "Query your research in plain language, grounded in your documents." },
  { label: "Source Trace", icon: GitBranch, d: "See the retrieved chunks and similarity scores behind any answer." },
  { label: "Verification", icon: ShieldCheck, d: "Review each claim, labeled supported, uncertain, or unsupported." },
  { label: "Evaluation", icon: BarChart3, d: "Run recall, MRR, and groundedness metrics across your workspace." },
  { label: "Settings", icon: Settings, d: "Manage your account, profile, and password from one place." },
];

const USE_CASES = [
  { t: "Researchers", d: "Move through papers and reports faster, with every summary traceable back to the exact passage it came from.", c: GOLD },
  { t: "Students", d: "Ask direct questions about assigned readings and get answers that cite the source instead of a paraphrase to double-check.", c: ROSE },
  { t: "Knowledge workers", d: "Turn a folder of internal documents into a queryable workspace, with verification standing in for a manual re-read.", c: TEAL },
  { t: "Analysts & consultants", d: "Cross-reference client reports and source filings without losing track of which document a figure came from.", c: BLUE },
];

const BENEFITS = [
  { t: "Trust every answer", d: "Confidence scores and claim-level verification mean nothing gets cited without a traceable source.", c: GOLD },
  { t: "Read less, know more", d: "Structured summaries surface methodology, results, and limitations without a full read-through.", c: ROSE },
  { t: "Full transparency", d: "Source Trace shows the exact chunks and similarity scores behind every answer.", c: TEAL },
  { t: "Fast, grounded answers", d: "Hybrid retrieval and reranking run in the background, so answers stay quick and evidenced.", c: BLUE },
];

const COMPARISON = [
  { cap: "Answer grounding", generic: "Opaque, trust the model", prism: "Every claim checked against retrieved evidence" },
  { cap: "Source visibility", generic: "Rarely shown", prism: "Full chunk-level similarity scores exposed" },
  { cap: "Retrieval method", generic: "Keyword or single-vector search", prism: "Dense + BM25 fused, then cross-encoder reranked" },
  { cap: "Summarization", generic: "One generic paragraph", prism: "Structured: TLDR, concepts, methods, results, limitations" },
  { cap: "Verification", generic: "None, or manual", prism: "Per claim, per sentence, built into the pipeline" },
];

const STACK = [
  { t: "Next.js", d: "Frontend & routing", icon: Layers },
  { t: "FastAPI", d: "Backend & jobs", icon: Database },
  { t: "Postgres + pgvector", d: "Storage & embeddings", icon: Database },
  { t: "all-MiniLM-L6-v2", d: "Dense retrieval", icon: SplitSquareVertical },
  { t: "BM25", d: "Lexical retrieval", icon: Search },
  { t: "Cross-encoder", d: "Final reranking", icon: Braces },
  { t: "Llama 3.3 70B", d: "Generation via Groq", icon: Sparkles },
  { t: "JWT sessions", d: "Signed authentication", icon: Lock },
];

const SECURITY_POINTS = [
  "Session-scoped, signed JWT authentication on every request",
  "Inference provider keys never reach the browser",
  "Documents and chunks are isolated per account, never pooled",
  "No third-party tracking of ingested document content",
];

const FAQ = [
  { q: "What file formats does Prism support?", a: "PDF, DOCX, DOC, and TXT uploads, URLs, and pasted raw text, all through the same ingestion pipeline." },
  { q: "How does Prism prevent hallucinated answers?", a: "Every sentence in a generated answer is split out and matched against the retrieved evidence, then labeled supported, uncertain, or unsupported with a confidence score." },
  { q: "What retrieval method does Prism use?", a: "Dense vector search and BM25 keyword search run in parallel, are merged with reciprocal rank fusion, then reordered by a cross-encoder before the top-k chunks reach generation." },
  { q: "What LLM generates the answers?", a: "Llama 3.3 70B, served via Groq, constrained to answer strictly from retrieved chunks with inline source markers." },
  { q: "Can I see which passages an answer came from?", a: "Yes. Source Trace shows every retrieved chunk, its source document, and its similarity score for any given answer." },
  { q: "Is Prism multi-user?", a: "Yes. Accounts are session-scoped with signed JWT authentication, and documents are isolated per account." },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function Reveal({ children, delay = 0, className, style }: { children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div className={className} style={style} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-72px" }} transition={{ delay }}>
      {children}
    </motion.div>
  );
}

function ToneDots({ tone }: { tone: "dark" | "light" }) {
  return (
    <span className="pz-tone-dots">
      <span className="pz-tone-dot" style={{ background: tone === "dark" ? PAPER : INK }} />
      <span
        className="pz-tone-dot"
        style={{
          background: tone === "dark" ? INK_RAISED_2 : "rgba(10,10,13,0.32)",
          border: tone === "dark" ? `1px solid ${LINE_ON_INK}` : "none",
        }}
      />
    </span>
  );
}

function SpectrumPrism() {
  return (
    <svg viewBox="0 0 520 340" width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="beamOut" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GOLD} />
          <stop offset="38%" stopColor={ROSE} />
          <stop offset="68%" stopColor={TEAL} />
          <stop offset="100%" stopColor={BLUE} />
        </linearGradient>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.line x1="10" y1="150" x2="200" y2="150" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5"
        initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut" }} />

      <motion.polygon points="200,60 320,150 200,240" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }} />

      {SPECTRUM.map((c, i) => (
        <motion.line
          key={c}
          x1="255" y1="150"
          x2="510" y2={70 + i * 60}
          stroke={c}
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.95 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 + i * 0.09, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pz-root">
      <style>{`
        .pz-root { background: ${INK}; color: #fff; min-height: 100vh; width: 100%; overflow-x: hidden; font-family: var(--font-sans, 'Syne', system-ui, sans-serif); }
        .pz-root * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) { .pz-root * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }

        .pz-header { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; height: 76px; padding: 0 24px; background: rgba(10,10,13,0.82); backdrop-filter: blur(14px); border-bottom: 1px solid ${LINE_ON_INK}; transition: border-color .3s, box-shadow .3s; }
        .pz-header.scrolled { border-color: rgba(255,255,255,0.16); box-shadow: 0 18px 40px -28px rgba(0,0,0,0.85); }
        @media (min-width:768px){ .pz-header{ padding:0 48px; } }
        @media (min-width:1200px){ .pz-header{ padding:0 80px; } }

        .pz-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .pz-logo-mark { width:30px; height:30px; border-radius:8px; background:${SPECTRUM_GRADIENT}; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pz-logo-text { font-family: var(--font-display,'DM Serif Display',Georgia,serif); font-size:19px; letter-spacing:0.01em; color:#fff; }

        .pz-nav { display:none; align-items:center; gap:34px; }
        @media (min-width:900px){ .pz-nav{ display:flex; } }
        .pz-nav a { font-family: var(--font-mono, monospace); font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.5); text-decoration:none; transition:color .2s; }
        .pz-nav a:hover { color:#fff; }

        .pz-header-actions { display:none; align-items:center; gap:12px; }
        @media (min-width:900px){ .pz-header-actions{ display:flex; } }

        .pz-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 24px; border-radius:10px; font-size:13.5px; font-weight:700; text-decoration:none; border:none; cursor:pointer; transition:transform .18s, box-shadow .18s, opacity .18s; }
        .pz-btn-primary { background:#fff; color:${INK}; }
        .pz-btn-primary:hover { transform:translateY(-1px); opacity:0.92; }
        .pz-btn-spectrum { background:${SPECTRUM_GRADIENT}; color:${INK}; box-shadow:0 10px 30px -10px rgba(232,197,71,0.35); }
        .pz-btn-spectrum:hover { transform:translateY(-1px); box-shadow:0 14px 36px -10px rgba(239,111,142,0.45); }
        .pz-btn-ghost { background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.18); }
        .pz-btn-ghost:hover { border-color:rgba(255,255,255,0.5); background:rgba(255,255,255,0.04); }
        .pz-btn-ghost.on-light { color:${INK}; border-color:rgba(10,10,13,0.18); }
        .pz-btn-ghost.on-light:hover { border-color:rgba(10,10,13,0.5); background:rgba(10,10,13,0.04); }
        .pz-btn-dark { background:${INK}; color:#fff; }
        .pz-btn-dark:hover { transform:translateY(-1px); opacity:0.9; }

        .pz-menu-btn { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:9px; border:1px solid rgba(255,255,255,0.16); background:transparent; color:#fff; cursor:pointer; }
        @media (min-width:900px){ .pz-menu-btn{ display:none; } }
        .pz-mobile-menu { position:fixed; inset:76px 0 auto 0; z-index:40; background:${INK}; border-bottom:1px solid ${LINE_ON_INK}; padding:26px 24px 32px; display:flex; flex-direction:column; gap:20px; }
        @media (min-width:900px){ .pz-mobile-menu{ display:none; } }
        .pz-mobile-menu a { color:#fff; font-size:15px; text-decoration:none; }
        .pz-mobile-actions { display:flex; gap:12px; margin-top:6px; }
        .pz-mobile-actions > * { flex:1; }

        .pz-hero { position:relative; padding:72px 24px 40px; overflow:hidden; }
        @media (min-width:768px){ .pz-hero{ padding:96px 48px 40px; } }
        @media (min-width:1200px){ .pz-hero{ padding:96px 80px 40px; } }
        .pz-hero-noise { position:absolute; inset:0; background: radial-gradient(ellipse 900px 500px at 15% 0%, rgba(232,197,71,0.09), transparent 60%), radial-gradient(ellipse 800px 460px at 100% 20%, rgba(90,143,239,0.10), transparent 60%); pointer-events:none; }
        .pz-hero-grid { position:relative; max-width:1360px; margin:0 auto; display:grid; grid-template-columns:1fr; gap:48px; }
        @media (min-width:1080px){ .pz-hero-grid{ grid-template-columns:1.05fr 0.95fr; align-items:center; gap:40px; } }

        .pz-eyebrow { display:inline-flex; align-items:center; gap:10px; font-family: var(--font-mono, monospace); font-size:11.5px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.5); margin-bottom:22px; }
        .pz-eyebrow-rule { width:26px; height:2px; background:${SPECTRUM_GRADIENT}; border-radius:2px; }

        .pz-brand { font-family: var(--font-display,'DM Serif Display',Georgia,serif); font-weight:400; font-size:clamp(64px,9.2vw,124px); line-height:0.92; letter-spacing:-0.01em; color:#fff; margin:0 0 22px; text-transform:uppercase; }
        .pz-h1 { font-family: var(--font-display,'DM Serif Display',Georgia,serif); font-weight:400; font-size:clamp(24px,2.6vw,32px); line-height:1.28; letter-spacing:-0.01em; color:rgba(255,255,255,0.9); max-width:520px; margin:0; }
        .pz-h1 .spec { background:${SPECTRUM_GRADIENT}; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .pz-lead { margin-top:24px; max-width:480px; font-size:16.5px; line-height:1.75; color:rgba(255,255,255,0.5); }
        .pz-cta-row { display:flex; flex-wrap:wrap; gap:14px; margin-top:34px; }
        .pz-hero-note { margin-top:20px; font-family: var(--font-mono, monospace); font-size:11px; color:rgba(255,255,255,0.34); }

        .pz-hero-visual { position:relative; display:flex; align-items:center; justify-content:center; min-height:280px; }
        .pz-visual-frame { position:relative; width:100%; max-width:480px; aspect-ratio:1/1; border-radius:28px; background:linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012)); border:1px solid ${LINE_ON_INK}; overflow:hidden; display:flex; align-items:center; justify-content:center; padding:36px; }
        .pz-visual-glow { position:absolute; inset:-20%; background: radial-gradient(circle at 28% 26%, rgba(232,197,71,0.18), transparent 55%), radial-gradient(circle at 76% 72%, rgba(90,143,239,0.18), transparent 55%); filter:blur(42px); pointer-events:none; }
        .pz-visual-corner { position:absolute; width:20px; height:20px; border-color:rgba(255,255,255,0.28); pointer-events:none; }
        .pz-visual-corner.tl { top:16px; left:16px; border-top:1.5px solid; border-left:1.5px solid; border-radius:6px 0 0 0; }
        .pz-visual-corner.br { bottom:16px; right:16px; border-bottom:1.5px solid; border-right:1.5px solid; border-radius:0 0 6px 0; }
        .pz-visual-content { position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; z-index:1; }
        .pz-visual-content img, .pz-visual-content svg { width:100%; height:100%; object-fit:contain; }
        .pz-visual-caption { position:absolute; left:18px; bottom:18px; font-family: var(--font-mono, monospace); font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.32); z-index:1; }

        .pz-trust-strip { margin:64px auto 0; padding-top:28px; border-top:1px solid ${LINE_ON_INK}; display:grid; grid-template-columns:repeat(2,1fr); gap:1px; max-width:1360px; background:${LINE_ON_INK}; }
        @media (min-width:640px){ .pz-trust-strip{ grid-template-columns:repeat(4,1fr); } }
        .pz-trust-item { padding:18px 20px; background:${INK}; }
        .pz-trust-value { font-family: var(--font-mono, monospace); font-size:12.5px; font-weight:700; color:#fff; }
        .pz-trust-label { margin-top:7px; font-family: var(--font-mono, monospace); font-size:9.5px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.4); }

        .pz-section { padding:100px 24px; }
        @media (min-width:768px){ .pz-section{ padding:120px 48px; } }
        @media (min-width:1200px){ .pz-section{ padding:150px 80px; } }
        .pz-section.tight { padding-top:80px; padding-bottom:80px; }
        .pz-section.paper { background:${PAPER}; color:${INK}; }
        .pz-section.raised { background:${INK_RAISED}; }
        .pz-section-inner { max-width:1360px; margin:0 auto; }

        .pz-section-head { max-width:640px; margin-bottom:64px; }
        .pz-section-head.center { margin-left:auto; margin-right:auto; text-align:center; }
        .pz-label { display:inline-flex; align-items:center; gap:10px; font-family: var(--font-mono, monospace); font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:rgba(255,255,255,0.42); margin-bottom:18px; }
        .paper .pz-label { color:rgba(10,10,13,0.45); }
        .pz-label-rule { width:22px; height:2px; background:${SPECTRUM_GRADIENT}; border-radius:2px; }
        .pz-tone-dots { display:inline-flex; align-items:center; gap:5px; }
        .pz-tone-dot { width:7px; height:7px; border-radius:999px; flex-shrink:0; }
        .pz-h2 { font-family: var(--font-display,'DM Serif Display',Georgia,serif); font-weight:400; font-size:clamp(30px,3.6vw,44px); line-height:1.1; letter-spacing:-0.02em; color:#fff; margin:0; }
        .paper .pz-h2 { color:${INK}; }
        .pz-h2.small { font-size:clamp(26px,2.8vw,36px); }
        .pz-section-sub { margin-top:20px; font-size:15px; line-height:1.75; color:rgba(255,255,255,0.5); }
        .paper .pz-section-sub { color:rgba(10,10,13,0.58); }

        .pz-bento { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        @media (max-width:900px){ .pz-bento{ grid-template-columns:repeat(2,1fr); } }
        @media (max-width:560px){ .pz-bento{ grid-template-columns:1fr; } }

        .pz-tile { position:relative; border-radius:18px; padding:28px; background:${INK_RAISED_2}; border:1px solid ${LINE_ON_INK}; display:flex; flex-direction:column; gap:14px; overflow:hidden; transition:transform .3s ease, border-color .3s ease; height:100%; min-height:230px; }
        .pz-tile:hover { transform:translateY(-4px); }
        .pz-tile-glow { position:absolute; top:-40%; right:-30%; width:60%; height:180%; opacity:0.12; filter:blur(30px); pointer-events:none; border-radius:50%; }
        .pz-tile-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; position:relative; z-index:1; }
        .pz-tile-title { font-size:16.5px; font-weight:700; color:#fff; position:relative; z-index:1; }
        .pz-tile-desc { font-size:13.5px; line-height:1.7; color:rgba(255,255,255,0.5); position:relative; z-index:1; }

        .pz-card { background:${INK_RAISED}; border:1px solid ${LINE_ON_INK}; border-radius:16px; padding:30px; display:flex; flex-direction:column; gap:14px; transition:transform .25s, border-color .25s; }
        .pz-card:hover { transform:translateY(-3px); border-color:rgba(255,255,255,0.2); }
        .paper .pz-card { background:${PAPER_CARD}; border-color:${LINE_ON_PAPER}; }
        .paper .pz-card:hover { border-color:rgba(10,10,13,0.22); }
        .pz-card-title { font-size:16px; font-weight:700; color:#fff; }
        .paper .pz-card-title { color:${INK}; }
        .pz-card-desc { font-size:13.5px; line-height:1.72; color:rgba(255,255,255,0.5); }
        .paper .pz-card-desc { color:rgba(10,10,13,0.58); }

        .pz-grid { display:grid; gap:22px; }
        .pz-grid.cols-2 { grid-template-columns:1fr; }
        @media (min-width:700px){ .pz-grid.cols-2{ grid-template-columns:1fr 1fr; } }
        .pz-grid.cols-4 { grid-template-columns:1fr; }
        @media (min-width:640px){ .pz-grid.cols-4{ grid-template-columns:1fr 1fr; } }
        @media (min-width:1050px){ .pz-grid.cols-4{ grid-template-columns:repeat(4,1fr); } }

        .pz-strip-card { border-top:3px solid; padding-top:18px; }

        .pz-showcase { border-radius:22px; overflow:hidden; background:${INK_RAISED}; border:1px solid ${LINE_ON_INK}; max-width:1140px; margin:0 auto; }
        .pz-showcase-tabs { display:flex; gap:4px; padding:18px 24px 0; overflow-x:auto; }
        .pz-showcase-tab { display:flex; align-items:center; gap:8px; padding:10px 16px; border-radius:10px 10px 0 0; font-size:12.5px; font-weight:600; color:rgba(255,255,255,0.42); white-space:nowrap; }
        .pz-showcase-tab.active { background:rgba(255,255,255,0.05); color:#fff; }
        .pz-showcase-body { padding:32px; border-top:1px solid ${LINE_ON_INK}; display:grid; gap:20px; grid-template-columns:1fr; }
        @media (min-width:800px){ .pz-showcase-body{ grid-template-columns:repeat(4,1fr); } }
        .pz-showcase-item { padding:18px; border-radius:12px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); }
        .pz-showcase-item p { margin-top:8px; font-size:12.5px; line-height:1.6; color:rgba(255,255,255,0.48); }

        .pz-pipe { position:relative; max-width:1160px; margin:0 auto; }
        .pz-pipe-track { position:relative; display:grid; grid-template-columns:repeat(4,1fr); gap:0; }
        @media (max-width:860px){ .pz-pipe-track{ grid-template-columns:1fr; gap:36px; } }
        .pz-pipe-line { position:absolute; top:24px; left:6%; right:6%; height:2px; background:${SPECTRUM_GRADIENT}; opacity:0.55; }
        @media (max-width:860px){ .pz-pipe-line{ display:none; } }
        .pz-pipe-step { position:relative; padding:0 18px; }
        .pz-pipe-node { width:50px; height:50px; border-radius:999px; display:flex; align-items:center; justify-content:center; font-family: var(--font-mono, monospace); font-weight:700; font-size:13px; color:${INK}; position:relative; z-index:1; margin-bottom:22px; }
        .pz-pipe-title { font-size:17px; font-weight:700; color:${INK}; margin-bottom:9px; }
        .pz-pipe-desc { font-size:13.5px; line-height:1.72; color:rgba(10,10,13,0.58); }

        .pz-stack-row { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; max-width:1020px; margin:0 auto; }
        .pz-stack-pill { display:flex; align-items:center; gap:10px; padding:12px 18px; border-radius:999px; background:${INK}; border:1px solid ${LINE_ON_INK}; }
        .pz-stack-pill-t { font-size:12.5px; font-weight:700; color:#fff; }
        .pz-stack-pill-d { font-family: var(--font-mono, monospace); font-size:9.5px; color:rgba(255,255,255,0.4); }

        .pz-compare { max-width:1080px; margin:0 auto; display:flex; flex-direction:column; gap:10px; }
        .pz-compare-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; padding:20px 22px; border-radius:14px; background:rgba(255,255,255,0.025); border:1px solid ${LINE_ON_INK}; align-items:center; }
        @media (max-width:700px){ .pz-compare-row{ grid-template-columns:1fr; gap:6px; } }
        .pz-compare-cap { font-size:13.5px; font-weight:700; color:#fff; }
        .pz-compare-generic { font-size:13px; color:rgba(255,255,255,0.4); }
        .pz-compare-prism { font-size:13.5px; font-weight:600; color:#fff; display:flex; align-items:center; gap:8px; }
        .pz-compare-head { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; padding:0 22px 4px; max-width:1080px; margin:0 auto; }
        @media (max-width:700px){ .pz-compare-head{ display:none; } }
        .pz-compare-head span { font-family: var(--font-mono, monospace); font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:rgba(255,255,255,0.38); }

        .pz-security-row { display:flex; flex-direction:column; gap:40px; max-width:1080px; margin:0 auto; }
        @media (min-width:800px){ .pz-security-row{ flex-direction:row; align-items:flex-start; justify-content:space-between; } }
        .pz-security-left { max-width:440px; }
        .pz-security-list { list-style:none; margin-top:26px; display:flex; flex-direction:column; gap:15px; }
        .pz-security-list li { display:flex; align-items:flex-start; gap:12px; font-size:13.5px; line-height:1.6; color:rgba(255,255,255,0.6); }
        .pz-security-check { width:20px; height:20px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
        .pz-security-note { flex:1; max-width:380px; padding:24px; border-radius:16px; background:${PAPER}; color:${INK}; border:1px solid ${LINE_ON_INK}; font-size:13px; line-height:1.75; }

        .pz-faq-list { max-width:740px; margin:0 auto; }
        .pz-faq-item { border-bottom:1px solid ${LINE_ON_INK}; }
        .pz-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:23px 4px; background:none; border:none; cursor:pointer; text-align:left; font-family:inherit; }
        .pz-faq-q-text { font-size:15.5px; font-weight:700; color:#fff; }
        .pz-faq-icon { width:26px; height:26px; border-radius:999px; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:rgba(255,255,255,0.6); }
        .pz-faq-a { padding:0 4px 23px; font-size:13.5px; line-height:1.75; color:rgba(255,255,255,0.55); max-width:620px; }

        .pz-final { display:flex; justify-content:center; text-align:center; position:relative; overflow:hidden; }
        .pz-final-glow { position:absolute; top:50%; left:50%; width:900px; height:500px; transform:translate(-50%,-50%); background: radial-gradient(ellipse at center, rgba(232,197,71,0.10), transparent 55%), radial-gradient(ellipse at 70% 50%, rgba(90,143,239,0.10), transparent 55%); pointer-events:none; }
        .pz-final-inner { max-width:740px; position:relative; }

        .pz-footer { padding:64px 24px 32px; border-top:1px solid ${LINE_ON_INK}; }
        @media (min-width:768px){ .pz-footer{ padding:72px 48px 32px; } }
        @media (min-width:1200px){ .pz-footer{ padding:72px 80px 32px; } }
        .pz-footer-inner { max-width:1360px; margin:0 auto; }
        .pz-footer-top { display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr; gap:40px; margin-bottom:52px; }
        @media (max-width:900px){ .pz-footer-top{ grid-template-columns:1fr 1fr; } }
        @media (max-width:560px){ .pz-footer-top{ grid-template-columns:1fr; } }
        .pz-footer-brand { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .pz-footer-blurb { font-size:13.5px; line-height:1.7; color:rgba(255,255,255,0.42); max-width:260px; }
        .pz-footer-col-h { font-family: var(--font-mono, monospace); font-size:10.5px; text-transform:uppercase; letter-spacing:0.1em; color:rgba(255,255,255,0.35); margin-bottom:18px; }
        .pz-footer-col a { display:block; font-size:13.5px; color:rgba(255,255,255,0.55); text-decoration:none; margin-bottom:13px; transition:color .2s; }
        .pz-footer-col a:hover { color:#fff; }
        .pz-footer-bottom { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:18px; padding-top:26px; border-top:1px solid ${LINE_ON_INK}; }
        .pz-footer-tag { font-family: var(--font-mono, monospace); font-size:11px; color:rgba(255,255,255,0.3); }
      `}</style>

      <header className={`pz-header ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="pz-logo">
          <span className="pz-logo-mark"><Sparkles size={14} color={INK} strokeWidth={2.4} /></span>
          <span className="pz-logo-text">PRISM</span>
        </Link>
        <nav className="pz-nav">{NAV_LINKS.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}</nav>
        <div className="pz-header-actions">
          <Link href="/login" className="pz-btn pz-btn-ghost">Sign in</Link>
          <Link href="/register" className="pz-btn pz-btn-primary">Get started <ArrowRight size={14} /></Link>
        </div>
        <button onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={menuOpen} className="pz-menu-btn">
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>

      {menuOpen && (
        <div className="pz-mobile-menu">
          {NAV_LINKS.map((l) => <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>)}
          <div className="pz-mobile-actions">
            <Link href="/login" className="pz-btn pz-btn-ghost">Sign in</Link>
            <Link href="/register" className="pz-btn pz-btn-primary">Get started</Link>
          </div>
        </div>
      )}

      <section className="pz-hero">
        <div className="pz-hero-noise" />
        <div className="pz-hero-grid">
          <div>
            <Reveal><div className="pz-eyebrow"><span className="pz-eyebrow-rule" />Research intelligence platform</div></Reveal>
            <Reveal delay={0.05}><h1 className="pz-brand">PRISM</h1></Reveal>
            <Reveal delay={0.1}>
              <p className="pz-h1">Every document, <span className="spec">refracted into a verified answer.</span></p>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="pz-lead">Prism turns papers, reports, and long documents into a queryable workspace — hybrid retrieval, grounded generation, and claim-level verification, in one pipeline.</p>
            </Reveal>
            <Reveal delay={0.22}>
              <div className="pz-cta-row">
                <Link href="/register" className="pz-btn pz-btn-spectrum">Try Prism free <ArrowRight size={14} /></Link>
                <a href="#pipeline" className="pz-btn pz-btn-ghost">See how it works</a>
              </div>
              <div className="pz-hero-note">No credit card required · Free Groq API tier available</div>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="pz-hero-visual">
            <div className="pz-visual-frame">
              <div className="pz-visual-glow" />
              <span className="pz-visual-corner tl" />
              <span className="pz-visual-corner br" />
              <div className="pz-visual-content">
                <SpectrumPrism />
              </div>
              <span className="pz-visual-caption">Retrieval → generation → verification</span>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.3}>
          <div className="pz-trust-strip">
            {TRUST_STRIP.map((t) => (
              <div key={t.label} className="pz-trust-item">
                <div className="pz-trust-value">{t.value}</div>
                <div className="pz-trust-label">{t.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="problem" className="pz-section tight">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head center"><div className="pz-label"><span className="pz-label-rule" />The problem<ToneDots tone="dark" /></div><h2 className="pz-h2 small">Research workflows weren&apos;t built for how much you actually read</h2></div></Reveal>
          <div className="pz-grid cols-2">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.t} delay={i * 0.05}>
                <div className="pz-card"><div className="pz-card-title">{p.t}</div><p className="pz-card-desc">{p.d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pz-section raised tight">
        <div className="pz-section-inner">
          <Reveal>
            <div className="pz-section-head center" style={{ marginBottom: 0 }}>
              <div className="pz-label" style={{ justifyContent: "center" }}><span className="pz-label-rule" />The solution<ToneDots tone="dark" /></div>
              <h2 className="pz-h2 small">An auditable pipeline, not a black box</h2>
              <p className="pz-section-sub">Prism exposes the entire retrieval-to-generation pipeline — fused hybrid search, reranked chunks, inline citations, and per-claim verification — so every answer can be traced back to the exact passage it came from.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="features" className="pz-section">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head"><div className="pz-label"><span className="pz-label-rule" />Key features<ToneDots tone="dark" /></div><h2 className="pz-h2">Everything needed to trust an AI answer</h2></div></Reveal>
          <div className="pz-bento">
            {FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 0.04}>
                <div className="pz-tile">
                  <div className="pz-tile-glow" style={{ background: f.c }} />
                  <span className="pz-tile-icon" style={{ background: `${f.c}22` }}><f.icon size={17} color={f.c} /></span>
                  <div className="pz-tile-title">{f.t}</div>
                  <p className="pz-tile-desc">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pz-section raised">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head center"><div className="pz-label" style={{ justifyContent: "center" }}><span className="pz-label-rule" />Inside Prism<ToneDots tone="dark" /></div><h2 className="pz-h2 small">One workspace, every stage of the pipeline</h2><p className="pz-section-sub">Eight pages, all connected — ingest a document and follow it through retrieval, generation, and verification.</p></div></Reveal>
          <Reveal>
            <div className="pz-showcase">
              <div className="pz-showcase-tabs">{PRODUCT_PAGES.slice(0, 5).map((p, i) => <div key={p.label} className={`pz-showcase-tab ${i === 3 ? "active" : ""}`}><p.icon size={13} /> {p.label}</div>)}</div>
              <div className="pz-showcase-body">
                {PRODUCT_PAGES.map((p) => (
                  <div key={p.label} className="pz-showcase-item">
                    <span className="pz-tile-icon" style={{ background: "rgba(255,255,255,0.06)", width: 32, height: 32 }}><p.icon size={15} color="#fff" /></span>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginTop: 12 }}>{p.label}</p>
                    <p>{p.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="pipeline" className="pz-section paper">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head center"><div className="pz-label" style={{ justifyContent: "center" }}><span className="pz-label-rule" />How it works<ToneDots tone="light" /></div><h2 className="pz-h2 small">From document to verified answer, four stages</h2></div></Reveal>
          <div className="pz-pipe">
            <div className="pz-pipe-line" />
            <div className="pz-pipe-track">
              {PIPELINE.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.08} className="pz-pipe-step">
                  <div className="pz-pipe-node" style={{ background: s.c }}>{s.n}</div>
                  <div className="pz-pipe-title">{s.t}</div>
                  <p className="pz-pipe-desc">{s.d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="use-cases" className="pz-section">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head"><div className="pz-label"><span className="pz-label-rule" />Use cases<ToneDots tone="dark" /></div><h2 className="pz-h2">Built for the way research actually happens</h2></div></Reveal>
          <div className="pz-grid cols-4">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.t} delay={i * 0.04}>
                <div className="pz-card pz-strip-card" style={{ height: "100%", borderTopColor: u.c }}>
                  <div className="pz-card-title">{u.t}</div>
                  <p className="pz-card-desc">{u.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pz-section raised">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head center"><div className="pz-label" style={{ justifyContent: "center" }}><span className="pz-label-rule" />Outcomes<ToneDots tone="dark" /></div><h2 className="pz-h2 small">What you actually get</h2></div></Reveal>
          <div className="pz-grid cols-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.t} delay={i * 0.04}>
                <div className="pz-card" style={{ height: "100%" }}>
                  <span className="pz-tile-icon" style={{ background: `${b.c}22` }}><Check size={16} color={b.c} /></span>
                  <div className="pz-card-title">{b.t}</div>
                  <p className="pz-card-desc">{b.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="pz-section paper">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head center"><div className="pz-label" style={{ justifyContent: "center" }}><span className="pz-label-rule" />Stack &amp; integrations<ToneDots tone="light" /></div><h2 className="pz-h2 small">Composed from proven, swappable pieces</h2><p className="pz-section-sub">Every layer of the pipeline is a distinct, independently replaceable component.</p></div></Reveal>
          <Reveal>
            <div className="pz-stack-row">
              {STACK.map((s) => (
                <div key={s.t} className="pz-stack-pill">
                  <s.icon size={15} color="#fff" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="pz-stack-pill-t">{s.t}</span>
                    <span className="pz-stack-pill-d">{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="product" className="pz-section">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head center"><div className="pz-label" style={{ justifyContent: "center" }}><span className="pz-label-rule" />Why Prism<ToneDots tone="dark" /></div><h2 className="pz-h2 small">Not another chat-with-your-PDF wrapper</h2></div></Reveal>
          <Reveal>
            <div className="pz-compare-head"><span>Capability</span><span>Typical tool</span><span>Prism</span></div>
            <div className="pz-compare">
              {COMPARISON.map((c, i) => (
                <div key={c.cap} className="pz-compare-row">
                  <div className="pz-compare-cap">{c.cap}</div>
                  <div className="pz-compare-generic">{c.generic}</div>
                  <div className="pz-compare-prism"><span style={{ width: 6, height: 6, borderRadius: 999, background: SPECTRUM[i % SPECTRUM.length], flexShrink: 0 }} />{c.prism}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pz-section raised">
        <div className="pz-section-inner">
          <div className="pz-security-row">
            <Reveal className="pz-security-left">
              <div className="pz-label"><span className="pz-label-rule" />Security &amp; privacy<ToneDots tone="dark" /></div>
              <h2 className="pz-h2 small">Your documents stay yours</h2>
              <ul className="pz-security-list">
                {SECURITY_POINTS.map((s, i) => (
                  <li key={s}><span className="pz-security-check" style={{ background: `${SPECTRUM[i % SPECTRUM.length]}22` }}><Check size={12} color={SPECTRUM[i % SPECTRUM.length]} /></span>{s}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.08} className="pz-security-note">
              Every request is authenticated with a signed, session-scoped JWT. Inference provider keys live only on the backend and are never exposed to the browser. Documents and their embeddings are isolated per account.
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pz-section">
        <div className="pz-section-inner">
          <Reveal><div className="pz-section-head center"><div className="pz-label" style={{ justifyContent: "center" }}><span className="pz-label-rule" />FAQ<ToneDots tone="dark" /></div><h2 className="pz-h2 small">Frequently asked questions</h2></div></Reveal>
          <div className="pz-faq-list">
            {FAQ.map((f, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={f.q} delay={i * 0.03} className="pz-faq-item">
                  <button className="pz-faq-q" onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open}>
                    <span className="pz-faq-q-text">{f.q}</span>
                    <span className="pz-faq-icon">{open ? <Minus size={13} /> : <Plus size={13} />}</span>
                  </button>
                  {open && <p className="pz-faq-a">{f.a}</p>}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pz-section pz-final">
        <div className="pz-final-glow" />
        <div className="pz-final-inner">
          <Reveal>
            <div className="pz-label" style={{ justifyContent: "center" }}><span className="pz-label-rule" />Get started<ToneDots tone="dark" /></div>
            <h2 className="pz-h2" style={{ fontSize: "clamp(28px,4vw,46px)" }}>Stop guessing whether your AI answers are true.</h2>
            <p className="pz-lead" style={{ margin: "18px auto 0" }}>Ingest your first document and watch the full retrieval, generation, and verification pipeline run end to end.</p>
            <div className="pz-cta-row" style={{ justifyContent: "center" }}>
              <Link href="/register" className="pz-btn pz-btn-spectrum">Try Prism free <ArrowRight size={14} /></Link>
              <a href="https://github.com/yamini-nlp/prism" target="_blank" rel="noreferrer" className="pz-btn pz-btn-ghost">View on GitHub <ArrowUpRight size={14} /></a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="pz-footer">
        <div className="pz-footer-inner">
          <div className="pz-footer-top">
            <div>
              <div className="pz-footer-brand"><span className="pz-logo-mark"><Sparkles size={14} color={INK} strokeWidth={2.4} /></span><span className="pz-logo-text">PRISM</span></div>
              <p className="pz-footer-blurb">A research intelligence platform built on hybrid retrieval, grounded generation, and claim-level verification.</p>
            </div>
            <div className="pz-footer-col">
              <div className="pz-footer-col-h">Product</div>
              <a href="#features">Features</a><a href="#pipeline">How it works</a><a href="#use-cases">Use cases</a><a href="/login">Sign in</a>
            </div>
            <div className="pz-footer-col">
              <div className="pz-footer-col-h">Resources</div>
              <a href="https://github.com/yamini-nlp/prism" target="_blank" rel="noreferrer">GitHub</a><a href="#architecture">Architecture</a><a href="#product">Comparison</a>
            </div>
            <div className="pz-footer-col">
              <div className="pz-footer-col-h">Company</div>
              <a href="https://github.com/yamini-nlp" target="_blank" rel="noreferrer">Built by Yamini G</a><a href="#">Privacy policy</a><a href="#">Terms of service</a>
            </div>
          </div>
          <div className="pz-footer-bottom">
            <span className="pz-footer-tag">© 2026 Prism. All rights reserved.</span>
            <span className="pz-footer-tag">Next.js · FastAPI · Llama 3.3 70B on Groq</span>
          </div>
        </div>
      </footer>
    </div>
  );
}