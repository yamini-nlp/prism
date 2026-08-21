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
  CheckCircle2,
  ChevronRight,
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
const INK_RAISED = "#121211";
const PAPER = "#f8f7f4";
const PAPER_CARD = "#ffffff";
const ACCENT = "#d4622a";
const ACCENT_LIGHT = "#e88a52";
const ACCENT_DEEP = "#b5491f";
const ACCENT_SOFT = "rgba(212, 98, 42, 0.12)";

const NAV_LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Architecture", href: "#architecture" },
  { label: "Inside Prism", href: "#product" },
  { label: "Stack", href: "#stack" },
];

const TRUST_STRIP = [
  { label: "Retrieval", value: "Dense + BM25 Fused" },
  { label: "Generation", value: "Llama 3.3 70B · Groq" },
  { label: "Verification", value: "Per-claim Scoring" },
  { label: "Pipeline", value: "4-Stage Verification" },
];

const PROBLEMS = [
  {
    n: "01",
    t: "Sources pile up, understanding doesn't",
    d: "Papers and long documents accumulate faster than anyone can read them. The critical insights remain buried deep within pages nobody has time to reopen.",
  },
  {
    n: "02",
    t: "Generic chat answers aren't accountable",
    d: "Ordinary AI models yield plausible prose without citations. Every generated claim requires manual double-checking before it can be cited or trusted.",
  },
  {
    n: "03",
    t: "Keyword search misses the context",
    d: "Standard lexical search finds literal word matches while missing underlying semantics, forcing painful manual skimming to find actual answers.",
  },
  {
    n: "04",
    t: "Verification is left as homework",
    d: "Even when an answer looks right, checking it against primary material is a tedious process that time-pressed workflows often quietly skip.",
  },
];

const STAGES = [
  {
    n: "01",
    t: "Ingest",
    d: "Upload PDF, DOCX, DOC, TXT, fetch URLs, or paste text. Content is validated against file signatures, chunked, and embedded with all-MiniLM-L6-v2 asynchronously.",
    icon: Upload,
  },
  {
    n: "02",
    t: "Retrieve",
    d: "Queries run through dense vector search and BM25 lexical search in parallel, fused via Reciprocal Rank Fusion, and reordered with a cross-encoder reranker.",
    icon: Search,
  },
  {
    n: "03",
    t: "Generate",
    d: "Llama 3.3 70B on Groq answers strictly from retrieved context. Every assertion carries explicit inline citation markers tied to source chunks.",
    icon: Sparkles,
  },
  {
    n: "04",
    t: "Verify",
    d: "Answers break down into individual atomic claims, evaluated against retrieved source chunks and labeled supported, uncertain, or unsupported with confidence scores.",
    icon: ShieldCheck,
  },
];

const FEATURES = [
  {
    t: "Multi-format Ingestion",
    d: "PDF, DOCX, DOC, TXT, web URLs, and plain text stream into unified chunking and vector embedding pipelines, processed via background workers.",
    icon: Upload,
    big: true,
  },
  {
    t: "Hybrid Retrieval Engine",
    d: "Combines dense semantic vectors with lexical BM25 keyword matching using Reciprocal Rank Fusion (RRF) and cross-encoder reordering.",
    icon: SplitSquareVertical,
  },
  {
    t: "Claim-Level Verification",
    d: "Automated factual validation checks each claim against retrieved evidence, classifying assertions as supported, uncertain, or unsupported.",
    icon: ShieldCheck,
  },
  {
    t: "Structured Summarization",
    d: "Extracts executive briefs, key technical concepts, methodology breakdowns, and research limitations into concise structured summaries.",
    icon: Layers,
  },
  {
    t: "Retrieval Transparency",
    d: "Exposes exact chunk rankings, source document origins, and vector cosine similarity scores behind every generated answer.",
    icon: FileSearch,
  },
  {
    t: "Built-In Evaluation Harness",
    d: "Measure Recall@5, Mean Reciprocal Rank (MRR), and Groundedness metrics across custom datasets directly inside your workspace.",
    icon: BarChart3,
    big: true,
  },
];

const ARCHITECTURE_FLOW = [
  { t: "User Query", d: "A natural language query is dispatched within the workspace context." },
  { t: "Dense + BM25 Retrieval", d: "Parallel execution across pgvector embeddings and lexical BM25 indexes." },
  { t: "Reciprocal Rank Fusion", d: "Mathematical fusion merges separate rank lists into a single unified candidate set." },
  { t: "Cross-Encoder Reranking", d: "A deep cross-encoder re-scores retrieved candidates directly against query semantics." },
  { t: "Grounded Generation", d: "Llama 3.3 70B generates answers strictly bound to top candidate context with citations." },
  { t: "Claim Verification", d: "NLP claim decomposition checks factual consistency and applies confidence metrics." },
];

const PRODUCT_PAGES = [
  { label: "Dashboard", icon: LayoutDashboard, d: "Live metrics tracking documents, generation volume, latencies, and verification pass-rates." },
  { label: "Ingest", icon: Upload, d: "Multi-source document upload with asynchronous background job tracking." },
  { label: "Library", icon: BookOpen, d: "Central repository of ingested documents, indexed by chunk counts and metadata." },
  { label: "Workspace", icon: MessageSquare, d: "Interactive research chat powered by grounded context retrieval." },
  { label: "Source Trace", icon: GitBranch, d: "Granular audit log showing chunks, similarity metrics, and source documents." },
  { label: "Verification", icon: ShieldCheck, d: "Claim-by-claim factual breakdown highlighting support confidence scores." },
  { label: "Evaluation", icon: BarChart3, d: "Integrated benchmark testing for workspace Recall, MRR, and Groundedness." },
  { label: "Settings", icon: Settings, d: "Manage workspace security, system parameters, and user preferences." },
];

const DIFFERENTIATORS = [
  {
    t: "Grounded, Not Generic",
    d: "Generations are strictly bound to your ingested documents. Hallucinations are mitigated by restricting model output to validated chunk data.",
    icon: FileSearch,
  },
  {
    t: "Inspectable Retrieval",
    d: "Source Trace opens up the black box, showing the exact text chunks, similarity metrics, and ranking logic behind every response.",
    icon: Search,
  },
  {
    t: "Native Verification Pipeline",
    d: "Verification isn't an afterthought. Every statement is evaluated at the claim level before the response is finalized.",
    icon: ShieldCheck,
  },
  {
    t: "Empirical System Metrics",
    d: "Validate system quality with real evaluation metrics like Recall@5 and MRR instead of relying on subjective impression.",
    icon: BarChart3,
  },
];

const STACK = [
  { t: "Next.js 15", d: "Modern App Router application framework", icon: Layers },
  { t: "FastAPI", d: "High-performance Python backend & job orchestrator", icon: Database },
  { t: "PostgreSQL + pgvector", d: "Vector storage, similarity index, and relational persistence", icon: Database },
  { t: "all-MiniLM-L6-v2", d: "Dense sentence embeddings for semantic retrieval", icon: SplitSquareVertical },
  { t: "BM25 Search", d: "Lexical scoring engine fused with vector retrieval", icon: Search },
  { t: "Cross-Encoder", d: "Deep learning model for high-precision candidate reranking", icon: Braces },
  { t: "Llama 3.3 70B", d: "Sub-second grounded LLM generation hosted on Groq", icon: Sparkles },
  { t: "JWT Session Security", d: "Stateless, signed token authentication architecture", icon: Lock },
];

const USE_CASES = [
  {
    t: "Researchers & Academics",
    d: "Digest literature and systematic reviews rapidly, with every summary anchored to verifiable primary sources.",
  },
  {
    t: "Legal & Compliance",
    d: "Navigate vast regulatory frameworks and contracts with sentence-level factual precision and strict provenance.",
  },
  {
    t: "Knowledge Workers",
    d: "Convert corporate repositories into interactive search engines with built-in truth verification.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
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
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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
          font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
          -webkit-font-smoothing: antialiased;
        }
        .pl-root * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        /* Ambient Glow Backgrounds */
        .glow-bg {
          position: absolute;
          border-radius: 9999px;
          filter: blur(140px);
          pointer-events: none;
          z-index: 0;
        }

        /* Navigation Header */
        .pl-header {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          height: 76px; padding: 0 24px;
          background: rgba(10, 10, 9, 0.78);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
        }
        .pl-header.scrolled {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(10, 10, 9, 0.92);
          box-shadow: 0 16px 36px -18px rgba(0, 0, 0, 0.8);
        }
        @media (min-width: 768px) { .pl-header { padding: 0 48px; } }
        @media (min-width: 1200px) { .pl-header { padding: 0 80px; } }

        .pl-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .pl-logo-mark {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, ${ACCENT_LIGHT}, ${ACCENT_DEEP});
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px ${ACCENT_SOFT};
        }
        .pl-logo-text {
          font-family: var(--font-display, Georgia, serif);
          font-size: 21px; font-weight: 700; letter-spacing: 0.05em; color: #ffffff;
        }

        .pl-nav { display: none; align-items: center; gap: 32px; }
        @media (min-width: 900px) { .pl-nav { display: flex; } }
        .pl-nav a {
          font-family: var(--font-mono, monospace);
          font-size: 12px; text-transform: uppercase; letter-spacing: 0.09em;
          color: rgba(255, 255, 255, 0.6); text-decoration: none;
          transition: color 0.2s ease;
        }
        .pl-nav a:hover { color: #ffffff; }

        .pl-header-actions { display: none; align-items: center; gap: 12px; }
        @media (min-width: 900px) { .pl-header-actions { display: flex; } }

        /* Buttons */
        .pl-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 24px; border-radius: 10px; background: #ffffff; color: ${INK};
          font-size: 14px; font-weight: 700; text-decoration: none; border: none; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 10px rgba(255, 255, 255, 0.1);
        }
        .pl-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2); opacity: 0.95; }
        .pl-btn-primary.accent {
          background: linear-gradient(135deg, ${ACCENT_LIGHT}, ${ACCENT});
          color: #ffffff;
          box-shadow: 0 4px 16px ${ACCENT_SOFT};
        }
        .pl-btn-primary.accent:hover {
          box-shadow: 0 8px 24px rgba(212, 98, 42, 0.35);
        }

        .pl-btn-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 22px; border-radius: 10px; background: transparent; color: #ffffff;
          font-size: 14px; font-weight: 600; text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.18);
          transition: all 0.2s ease;
        }
        .pl-btn-secondary:hover { border-color: rgba(255, 255, 255, 0.45); background: rgba(255, 255, 255, 0.05); }

        .pl-menu-btn {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.15); background: transparent; color: #ffffff; cursor: pointer;
        }
        @media (min-width: 900px) { .pl-menu-btn { display: none; } }

        .pl-mobile-menu {
          position: fixed; inset: 76px 0 auto 0; z-index: 40;
          background: ${INK}; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 28px 24px; display: flex; flex-direction: column; gap: 18px;
        }
        @media (min-width: 900px) { .pl-mobile-menu { display: none; } }
        .pl-mobile-menu a { color: #ffffff; font-size: 16px; text-decoration: none; font-weight: 500; }
        .pl-mobile-actions { display: flex; gap: 12px; margin-top: 10px; }
        .pl-mobile-actions > * { flex: 1; }

        /* Hero Section */
        .pl-hero { position: relative; padding: 60px 24px 90px; }
        @media (min-width: 768px) { .pl-hero { padding: 80px 48px 120px; } }
        @media (min-width: 1200px) { .pl-hero { padding: 100px 80px 140px; } }
        .pl-hero-grid { position: relative; z-index: 1; max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 56px; }
        @media (min-width: 1100px) { .pl-hero-grid { grid-template-columns: 1.05fr 0.95fr; align-items: center; gap: 72px; } }

        .pl-eyebrow-row {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          background: ${ACCENT_SOFT}; border: 1px solid rgba(212, 98, 42, 0.28);
          font-family: var(--font-mono, monospace); font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase; color: ${ACCENT_LIGHT}; margin-bottom: 24px;
        }
        .pl-eyebrow-dot { width: 6px; height: 6px; border-radius: 999px; background: ${ACCENT}; }

        .pl-h1 {
          font-family: var(--font-display, Georgia, serif); font-weight: 400;
          font-size: clamp(40px, 5.8vw, 68px); line-height: 1.06; letter-spacing: -0.03em; color: #ffffff; margin: 0;
        }
        .pl-h1 em {
          font-style: normal;
          background: linear-gradient(135deg, ${ACCENT_LIGHT}, ${ACCENT});
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }

        .pl-lead { margin-top: 24px; max-width: 520px; font-size: 17.5px; line-height: 1.7; color: rgba(255, 255, 255, 0.65); }
        .pl-cta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 36px; }

        .pl-trust-strip {
          margin-top: 56px; padding-top: 28px; border-top: 1px solid rgba(255, 255, 255, 0.09);
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 620px;
        }
        @media (min-width: 560px) { .pl-trust-strip { grid-template-columns: repeat(4, 1fr); } }
        .pl-trust-item { padding: 14px 16px; border-radius: 12px; background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.07); }
        .pl-trust-value { font-family: var(--font-mono, monospace); font-size: 12.5px; font-weight: 700; color: #ffffff; }
        .pl-trust-label { margin-top: 6px; font-family: var(--font-mono, monospace); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.4); }

        /* Mock UI */
        .pl-mock {
          border-radius: 18px; overflow: hidden; background: ${INK_RAISED};
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .pl-mock-top { display: flex; align-items: center; gap: 8px; padding: 14px 18px; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
        .pl-mock-dot { width: 10px; height: 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.18); }
        .pl-mock-url { margin-left: 8px; padding: 4px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.05); font-family: var(--font-mono, monospace); font-size: 11px; color: rgba(255, 255, 255, 0.5); }
        .pl-mock-body { display: flex; flex-direction: column; gap: 18px; padding: 24px; }
        .pl-mock-user { margin-left: auto; max-width: 82%; border-radius: 14px 14px 2px 14px; background: #ffffff; color: ${INK}; padding: 12px 18px; font-size: 13.5px; font-weight: 600; }
        .pl-mock-ai { max-width: 95%; border-radius: 14px 14px 14px 2px; border: 1px solid rgba(255, 255, 255, 0.09); background: rgba(255, 255, 255, 0.03); color: rgba(255, 255, 255, 0.88); padding: 16px 18px; font-size: 13.5px; line-height: 1.7; }
        .pl-mock-ai .mark { font-family: var(--font-mono, monospace); font-weight: 700; color: ${ACCENT_LIGHT}; margin: 0 2px; }
        .pl-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .pl-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.09); background: rgba(255, 255, 255, 0.02); font-family: var(--font-mono, monospace); font-size: 10.5px; color: rgba(255, 255, 255, 0.6); }
        .pl-verify-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.08); }
        .pl-verify-cell { border-radius: 10px; padding: 12px 14px; }
        .pl-verify-pct { font-family: var(--font-mono, monospace); font-size: 16px; font-weight: 700; }
        .pl-verify-label { margin-top: 4px; font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .pl-method-row { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 4px; }
        .pl-method-tag { font-family: var(--font-mono, monospace); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255, 255, 255, 0.45); padding: 5px 11px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.08); }

        /* General Section Layouts */
        .pl-section { position: relative; padding: 88px 24px; }
        @media (min-width: 768px) { .pl-section { padding: 112px 48px; } }
        @media (min-width: 1200px) { .pl-section { padding: 140px 80px; } }
        .pl-section.paper { background: ${PAPER}; color: ${INK}; }
        .pl-section-inner { position: relative; z-index: 1; max-width: 1320px; margin: 0 auto; }

        .pl-section-head { max-width: 680px; margin-bottom: 64px; }
        .pl-label { font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: ${ACCENT_LIGHT}; margin-bottom: 16px; }
        .paper .pl-label { color: ${ACCENT_DEEP}; }
        .pl-h2 { font-family: var(--font-display, Georgia, serif); font-weight: 400; font-size: clamp(30px, 4vw, 48px); line-height: 1.1; letter-spacing: -0.02em; color: #ffffff; margin: 0; }
        .paper .pl-h2 { color: ${INK}; }
        .pl-section-sub { margin-top: 20px; font-size: 16.5px; line-height: 1.7; color: rgba(255, 255, 255, 0.6); }
        .paper .pl-section-sub { color: rgba(17, 17, 16, 0.65); }

        /* Grid Framework */
        .pl-grid { display: grid; gap: 24px; }
        .pl-grid.cols-2 { grid-template-columns: 1fr; }
        @media (min-width: 768px) { .pl-grid.cols-2 { grid-template-columns: repeat(2, 1fr); } }
        .pl-grid.cols-3 { grid-template-columns: 1fr; }
        @media (min-width: 768px) { .pl-grid.cols-3 { grid-template-columns: repeat(3, 1fr); } }
        .pl-grid.cols-4 { grid-template-columns: 1fr; }
        @media (min-width: 640px) { .pl-grid.cols-4 { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1100px) { .pl-grid.cols-4 { grid-template-columns: repeat(4, 1fr); } }

        /* Component Cards */
        .pl-card {
          background: ${INK_RAISED}; border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px; padding: 32px; display: flex; flex-direction: column; gap: 16px;
          transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }
        .pl-card:hover { border-color: rgba(255, 255, 255, 0.22); transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5); }
        .paper .pl-card { background: ${PAPER_CARD}; border-color: rgba(17, 17, 16, 0.09); box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
        .paper .pl-card:hover { border-color: rgba(17, 17, 16, 0.25); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08); }

        .pl-card-num { font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 700; color: ${ACCENT_LIGHT}; }
        .paper .pl-card-num { color: ${ACCENT_DEEP}; }
        .pl-card-title { font-size: 17px; font-weight: 700; color: #ffffff; line-height: 1.3; }
        .paper .pl-card-title { color: ${INK}; }
        .pl-card-desc { font-size: 14px; line-height: 1.7; color: rgba(255, 255, 255, 0.55); }
        .paper .pl-card-desc { color: rgba(17, 17, 16, 0.62); }

        .pl-icon-badge {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: ${ACCENT_SOFT}; color: ${ACCENT_LIGHT}; flex-shrink: 0;
        }
        .paper .pl-icon-badge { color: ${ACCENT_DEEP}; }

        .pl-feature-span-2 { grid-column: span 1; }
        @media (min-width: 768px) { .pl-feature-span-2.big { grid-column: span 2; } }

        /* Interactive Architecture Component */
        .pl-arch-container {
          display: grid; grid-template-columns: 1fr; gap: 32px; margin-top: 40px;
        }
        @media (min-width: 900px) {
          .pl-arch-container { grid-template-columns: 0.9fr 1.1fr; align-items: center; gap: 48px; }
        }
        .pl-arch-list { display: flex; flex-direction: column; gap: 12px; }
        .pl-arch-item {
          padding: 18px 20px; border-radius: 14px; border: 1px solid rgba(17, 17, 16, 0.1);
          background: rgba(17, 17, 16, 0.02); cursor: pointer; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: space-between;
        }
        .pl-arch-item:hover { background: rgba(17, 17, 16, 0.05); border-color: rgba(17, 17, 16, 0.2); }
        .pl-arch-item.active {
          background: ${INK}; color: #ffffff; border-color: ${INK};
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .pl-arch-item-title { font-size: 15px; font-weight: 700; }
        .pl-arch-detail-box {
          background: #ffffff; border: 1px solid rgba(17, 17, 16, 0.12);
          border-radius: 18px; padding: 36px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
          min-height: 280px; display: flex; flex-direction: column; justify-content: center;
        }

        /* Stack Grid */
        .pl-stack-card {
          padding: 24px; border-radius: 14px; background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07); display: flex; gap: 16px; align-items: flex-start;
        }

        /* Product Showcase Grid */
        .pl-product-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 48px;
        }
        .pl-product-card {
          padding: 24px; border-radius: 14px; background: ${INK_RAISED};
          border: 1px solid rgba(255, 255, 255, 0.08); transition: border-color 0.2s ease;
        }
        .pl-product-card:hover { border-color: rgba(255, 255, 255, 0.2); }

        /* Use Cases / Security Row */
        .pl-usecase-card {
          padding: 32px; border-radius: 16px; background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; gap: 14px;
        }

        /* Final CTA */
        .pl-final { text-align: center; position: relative; padding: 120px 24px; overflow: hidden; }
        .pl-final-inner { max-width: 760px; margin: 0 auto; position: relative; z-index: 1; }

        /* Footer */
        .pl-footer {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px;
          padding: 40px 24px; border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: ${INK};
        }
        @media (min-width: 768px) { .pl-footer { padding: 40px 48px; } }
        @media (min-width: 1200px) { .pl-footer { padding: 40px 80px; } }
        .pl-footer-links { display: flex; flex-wrap: wrap; gap: 28px; }
        .pl-footer-links a { font-family: var(--font-mono, monospace); font-size: 12px; color: rgba(255, 255, 255, 0.45); text-decoration: none; transition: color 0.2s ease; }
        .pl-footer-links a:hover { color: #ffffff; }
      `}</style>

      {/* Navigation */}
      <header className={`pl-header ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="pl-logo">
          <span className="pl-logo-mark">
            <Sparkles size={17} color="#ffffff" strokeWidth={2.5} />
          </span>
          <span className="pl-logo-text">PRISM</span>
        </Link>

        <nav className="pl-nav">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="pl-header-actions">
          <Link href="/login" className="pl-btn-secondary">
            Sign in
          </Link>
          <Link href="/register" className="pl-btn-primary accent">
            Get started <ArrowRight size={14} />
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="pl-menu-btn"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {menuOpen && (
        <div className="pl-mobile-menu">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="pl-mobile-actions">
            <Link href="/login" className="pl-btn-secondary">
              Sign in
            </Link>
            <Link href="/register" className="pl-btn-primary accent">
              Get started
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pl-hero">
        <div className="glow-bg" style={{ top: "-10%", right: "10%", width: "500px", height: "500px", background: "rgba(212, 98, 42, 0.15)" }} />
        <div className="pl-hero-grid">
          <Reveal>
            <div className="pl-eyebrow-row">
              <span className="pl-eyebrow-dot" />
              Next-Gen Research Engine
            </div>

            <h1 className="pl-h1">
              Read less.
              <br />
              Know <em>more.</em>
            </h1>

            <p className="pl-lead">
              Prism transforms research papers, dense reports, and complex documents into citation-backed answers with sentence-level claim verification.
            </p>

            <div className="pl-cta-row">
              <Link href="/register" className="pl-btn-primary accent" style={{ padding: "14px 28px", fontSize: "15px" }}>
                Start Research <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="pl-btn-secondary" style={{ padding: "13px 26px", fontSize: "15px" }}>
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
                  <span className="mark">[1]</span>, while the hybrid dense and keyword setup outperformed either method alone <span className="mark">[2]</span>.
                </div>

                <div className="pl-chip-row">
                  <span className="pl-chip">[1] ablation_results.pdf · 0.91 match</span>
                  <span className="pl-chip">[2] retrieval_ablation.pdf · 0.87 match</span>
                </div>

                <div className="pl-verify-row">
                  <div className="pl-verify-cell" style={{ background: "rgba(61, 153, 112, 0.15)" }}>
                    <div className="pl-verify-pct" style={{ color: "#69d3a8" }}>82%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(105,211,168,0.8)" }}>Supported</div>
                  </div>
                  <div className="pl-verify-cell" style={{ background: "rgba(212, 98, 42, 0.15)" }}>
                    <div className="pl-verify-pct" style={{ color: "#eea173" }}>12%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(238,161,115,0.8)" }}>Uncertain</div>
                  </div>
                  <div className="pl-verify-cell" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                    <div className="pl-verify-pct" style={{ color: "rgba(255, 255, 255, 0.75)" }}>6%</div>
                    <div className="pl-verify-label" style={{ color: "rgba(255, 255, 255, 0.4)" }}>Unsupported</div>
                  </div>
                </div>

                <div className="pl-method-row">
                  <span className="pl-method-tag">Dense Search</span>
                  <span className="pl-method-tag">BM25 Lexical</span>
                  <span className="pl-method-tag">RRF Fusion</span>
                  <span className="pl-method-tag">Cross-Encoder</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Section 1: Problem */}
      <section id="problem" className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head">
            <div className="pl-label">The Problem</div>
            <h2 className="pl-h2">Research is slow because trust is expensive.</h2>
            <p className="pl-section-sub">
              Reading everything manually takes days. Accepting standard ungrounded AI answers without source references leads to costly errors and manual audit overhead.
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

      {/* Section 2: Pipeline / Features */}
      <section id="pipeline" className="pl-section">
        <div className="glow-bg" style={{ bottom: "10%", left: "-5%", width: "450px", height: "450px", background: "rgba(212, 98, 42, 0.1)" }} />
        <div className="pl-section-inner">
          <Reveal className="pl-section-head">
            <div className="pl-label">The Pipeline</div>
            <h2 className="pl-h2">Designed for absolute citation accuracy.</h2>
            <p className="pl-section-sub">
              A 4-stage pipeline handles document parsing, hybrid retrieval execution, grounded generation, and sentence-level claim evaluation.
            </p>
          </Reveal>

          <div className="pl-grid cols-2" style={{ marginBottom: "64px" }}>
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.n} delay={i * 0.06} className="pl-card">
                  <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", width: "100%" }}>
                    <div className="pl-icon-badge">
                      <Icon size={20} />
                    </div>
                    <span className="pl-card-num" style={{ marginLeft: "auto" }}>STAGE {s.n}</span>
                  </div>
                  <div className="pl-card-title">{s.t}</div>
                  <div className="pl-card-desc">{s.d}</div>
                </Reveal>
              );
            })}
          </div>

          <div className="pl-grid cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.t} delay={i * 0.05} className={`pl-card ${f.big ? "pl-feature-span-2" : ""}`}>
                  <div className="pl-icon-badge">
                    <Icon size={20} />
                  </div>
                  <div className="pl-card-title">{f.t}</div>
                  <div className="pl-card-desc">{f.d}</div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Architecture Interactivity */}
      <section id="architecture" className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head">
            <div className="pl-label">Architecture</div>
            <h2 className="pl-h2">How information flows through Prism.</h2>
            <p className="pl-section-sub">
              Click through the processing sequence to inspect how input queries are matched, fused, reranked, and validated.
            </p>
          </Reveal>

          <div className="pl-arch-container">
            <div className="pl-arch-list">
              {ARCHITECTURE_FLOW.map((step, idx) => (
                <div
                  key={step.t}
                  className={`pl-arch-item ${activeTab === idx ? "active" : ""}`}
                  onClick={() => setActiveTab(idx)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", opacity: 0.6 }}>0{idx + 1}</span>
                    <span className="pl-arch-item-title">{step.t}</span>
                  </div>
                  <ChevronRight size={16} opacity={activeTab === idx ? 1 : 0.4} />
                </div>
              ))}
            </div>

            <div className="pl-arch-detail-box">
              <span className="pl-label" style={{ marginBottom: "12px" }}>STAGE 0{activeTab + 1} SPECIFICATION</span>
              <h3 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 12px 0", color: INK }}>
                {ARCHITECTURE_FLOW[activeTab].t}
              </h3>
              <p style={{ fontSize: "15.5px", lineHeight: 1.7, color: "rgba(17, 17, 16, 0.7)", margin: 0 }}>
                {ARCHITECTURE_FLOW[activeTab].d}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Product Pages */}
      <section id="product" className="pl-section">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head">
            <div className="pl-label">Inside Prism</div>
            <h2 className="pl-h2">A complete workspace for research control.</h2>
            <p className="pl-section-sub">
              An enterprise research platform built with full visibility into source mechanics and empirical system performance.
            </p>
          </Reveal>

          <div className="pl-product-grid">
            {PRODUCT_PAGES.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.label} delay={i * 0.04} className="pl-product-card">
                  <div className="pl-icon-badge" style={{ marginBottom: "16px" }}>
                    <Icon size={19} />
                  </div>
                  <div className="pl-card-title" style={{ fontSize: "16px", marginBottom: "8px" }}>
                    {p.label}
                  </div>
                  <div className="pl-card-desc" style={{ fontSize: "13px" }}>
                    {p.d}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5: Stack & Differentiators */}
      <section id="stack" className="pl-section paper">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head">
            <div className="pl-label">Technical Stack</div>
            <h2 className="pl-h2">Engineered for performance & reliability.</h2>
            <p className="pl-section-sub">
              Built on production-grade infrastructure designed for low latency, secure session isolation, and vector search scalability.
            </p>
          </Reveal>

          <div className="pl-grid cols-4" style={{ marginBottom: "80px" }}>
            {STACK.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.t} delay={i * 0.04} className="pl-stack-card">
                  <div className="pl-icon-badge plain">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: INK }}>{item.t}</div>
                    <div style={{ fontSize: "12.5px", color: "rgba(17,17,16,0.6)", marginTop: "4px", lineHeight: 1.5 }}>
                      {item.d}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <div className="pl-grid cols-2">
            {DIFFERENTIATORS.map((diff, i) => {
              const Icon = diff.icon;
              return (
                <Reveal key={diff.t} delay={i * 0.05} className="pl-card">
                  <div className="pl-icon-badge">
                    <Icon size={20} />
                  </div>
                  <div className="pl-card-title">{diff.t}</div>
                  <div className="pl-card-desc">{diff.d}</div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6: Target Use Cases */}
      <section className="pl-section">
        <div className="pl-section-inner">
          <Reveal className="pl-section-head">
            <div className="pl-label">Target Applications</div>
            <h2 className="pl-h2">Tailored for complex information tasks.</h2>
          </Reveal>

          <div className="pl-grid cols-3">
            {USE_CASES.map((uc, i) => (
              <Reveal key={uc.t} delay={i * 0.06} className="pl-usecase-card">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: ACCENT_LIGHT }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontWeight: 700, fontSize: "16px", color: "#ffffff" }}>{uc.t}</span>
                </div>
                <div className="pl-card-desc">{uc.d}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="pl-final">
        <div className="glow-bg" style={{ top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "400px", background: "rgba(212, 98, 42, 0.18)" }} />
        <div className="pl-final-inner">
          <Reveal>
            <h2 className="pl-h1" style={{ fontSize: "clamp(34px, 5vw, 56px)" }}>
              Ready for verified research?
            </h2>
            <p className="pl-lead" style={{ margin: "20px auto 36px", maxWidth: "560px" }}>
              Start parsing complex documents with hybrid vector retrieval and sentence-level claim verification today.
            </p>
            <div style={{ display: "flex", justifyCenter: "center", gap: "14px", flexWrap: "wrap" }}>
              <Link href="/register" className="pl-btn-primary accent" style={{ padding: "15px 32px", fontSize: "15.5px" }}>
                Get Started Now <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="pl-footer">
        <div className="pl-logo">
          <span className="pl-logo-mark" style={{ width: "28px", height: "28px" }}>
            <Sparkles size={14} color="#ffffff" />
          </span>
          <span className="pl-logo-text" style={{ fontSize: "17px" }}>PRISM</span>
        </div>

        <div className="pl-footer-links">
          <a href="#problem">Problem</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#architecture">Architecture</a>
          <a href="#product">Inside Prism</a>
          <a href="#stack">Stack</a>
        </div>

        <div style={{ fontFamily: "monospace", fontSize: "11.5px", color: "rgba(255,255,255,0.35)" }}>
          © {new Date().getFullYear()} Prism Intelligence Platform.
        </div>
      </footer>
    </div>
  );
}