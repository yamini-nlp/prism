"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, Search, ShieldCheck, Zap, BookOpen, Layers, CheckCircle } from "lucide-react";

const TICKER_ITEMS = [
  "Semantic search across your research library",
  "Zero hallucination — every claim sourced",
  "RAG-powered research intelligence",
  "Structured summaries in seconds",
  "Claim-level verification engine",
  "Multi-format ingestion: PDF, DOC, URL",
];

const DEMO_QUERIES = [
  { q: "What is the effect of sleep deprivation on cognitive performance?", src: "neuroscience_review.pdf", conf: 94 },
  { q: "Summarize the methodology of transformer architectures", src: "attention_is_all_you_need.pdf", conf: 97 },
  { q: "What are the limitations of CRISPR gene editing?", src: "biotech_survey_2024.pdf", conf: 88 },
  { q: "How does monetary policy affect inflation expectations?", src: "fed_economics_paper.pdf", conf: 91 },
];

const FEATURES = [
  { icon: FileText,    label: "Ingest",     desc: "PDF, DOCX, URLs, raw text — Prism extracts and structures everything automatically.", accent: "#c8b8ff" },
  { icon: Zap,         label: "Summarize",  desc: "Instant structured summaries: TLDR, methodology, key concepts, results, limitations.", accent: "#ffd6a5" },
  { icon: Search,      label: "Query",      desc: "Ask anything. Get grounded answers with inline citations — no hallucinations.", accent: "#a0f0c8" },
  { icon: ShieldCheck, label: "Verify",     desc: "Every claim traced to its source. Confidence scores, retrieval transparency, full audit trail.", accent: "#ffa5b4" },
];

function Ticker() {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "14px 0" }}>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }`}</style>
      <div style={{ display: "flex", animation: "ticker 28s linear infinite", width: "max-content" }}>
        {repeated.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 20, padding: "0 40px", fontSize: 12.5, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", fontFamily: "Georgia, serif" }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#c8b8ff", display: "inline-block", flexShrink: 0 }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function LiveDemo() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [typing, setTyping] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const query = DEMO_QUERIES[activeIdx].q;
    let i = 0;
    setTyping("");
    setIsTyping(true);
    const interval = setInterval(() => {
      i++;
      setTyping(query.slice(0, i));
      if (i >= query.length) {
        clearInterval(interval);
        setIsTyping(false);
        setTimeout(() => setActiveIdx(prev => (prev + 1) % DEMO_QUERIES.length), 2800);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [activeIdx]);

  const current = DEMO_QUERIES[activeIdx];

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, overflow: "hidden", width: "100%", maxWidth: 560 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 7 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginLeft: 8, fontFamily: "Georgia, monospace" }}>prism — workspace</span>
      </div>
      <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.22)", marginBottom: 10, fontWeight: 600, fontFamily: "Georgia, serif" }}>Query</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.82)", lineHeight: 1.6, minHeight: 48, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
          {typing}
          {isTyping && <span style={{ display: "inline-block", width: 2, height: "1em", background: "#c8b8ff", marginLeft: 2, verticalAlign: "middle" }}>|</span>}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {!isTyping && (
          <motion.div key={activeIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.22)", marginBottom: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Georgia, serif" }}>
              <span>Answer</span>
              <span style={{ color: "#a0f0c8" }}>↑ {current.conf}% confidence</span>
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 16, fontFamily: "Georgia, serif" }}>
              Based on the ingested research, the evidence suggests a strong causal relationship. Multiple peer-reviewed sources corroborate this finding with consistent methodology...
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(200,184,255,0.06)", borderRadius: 10, border: "1px solid rgba(200,184,255,0.12)" }}>
              <BookOpen size={13} color="#c8b8ff" />
              <span style={{ fontSize: 12, color: "#c8b8ff", fontFamily: "Georgia, monospace" }}>{current.src}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", color: "#fff", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: rgba(200,184,255,0.3); }
        @keyframes shimmer { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        @keyframes gradShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 56px", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 50, background: "rgba(13,13,15,0.88)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #c8b8ff, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers size={16} color="#0d0d0f" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#fff", letterSpacing: "-0.02em" }}>Prism</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.65)", borderRadius: 10, padding: "9px 20px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Dashboard</button>
          </Link>
          <Link href="/ingest" style={{ textDecoration: "none" }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ background: "#c8b8ff", border: "none", color: "#0d0d0f", borderRadius: 10, padding: "9px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7 }}>
              Start Research <ArrowRight size={14} />
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 56px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: -140, left: "38%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,184,255,0.07) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", top: 60, right: "8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(160,240,200,0.04) 0%, transparent 65%)" }} />
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.035 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2, flexWrap: "wrap" }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 300, maxWidth: 580 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(200,184,255,0.1)", border: "1px solid rgba(200,184,255,0.2)", borderRadius: 30, marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c8b8ff", animation: "shimmer 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, color: "#c8b8ff", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Research Intelligence</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.65 }}
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(56px, 8vw, 96px)", lineHeight: 0.92, letterSpacing: "-0.04em", marginBottom: 20, color: "#fff" }}>
              Research,<br />
              <span style={{ fontStyle: "italic", background: "linear-gradient(120deg, #c8b8ff, #a5b4fc, #c8b8ff)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradShift 4s ease infinite" }}>Refined.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "rgba(255,255,255,0.42)", lineHeight: 1.8, marginBottom: 36, maxWidth: 420 }}>
              Upload research papers, query your knowledge base, and receive verified answers — every claim traced to its exact source.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
              <Link href="/ingest" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ background: "#c8b8ff", color: "#0d0d0f", border: "none", borderRadius: 12, padding: "14px 30px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                  Start Research <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href="/workspace" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ background: "rgba(255,255,255,0.07)" }}
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 24px", fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                  Try Workspace <ArrowUpRight size={15} />
                </motion.button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 28 }}>
              {[["RAG","Architecture"],["0%","Hallucination"],["∞","Documents"],["100%","Cited"]].map(([val, label], i) => (
                <div key={label} style={{ flex: 1, paddingRight: i < 3 ? 24 : 0, borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", paddingLeft: i > 0 ? 24 : 0 }}>
                  <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#fff", letterSpacing: "-0.02em" }}>{val}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right live demo */}
          <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            style={{ flexShrink: 0, width: "min(100%, 560px)" }}>
            <LiveDemo />
          </motion.div>
        </div>
      </section>

      <Ticker />

      {/* Features grid */}
      <section style={{ padding: "100px 56px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 60 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", fontWeight: 600, marginBottom: 16 }}>How It Works</div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(32px, 5vw, 58px)", color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: 520 }}>
              From source to insight,{" "}
              <em style={{ color: "rgba(255,255,255,0.35)" }}>in four steps.</em>
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 2 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ background: "rgba(255,255,255,0.04)" }}
                style={{ padding: "36px 32px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: i === 0 ? "16px 0 0 16px" : i === FEATURES.length - 1 ? "0 16px 16px 0" : 0, transition: "background 0.2s", cursor: "default" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.accent + "14", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <f.icon size={20} color={f.accent} strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: 10 }}>0{i + 1}</div>
                <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>{f.label}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", lineHeight: 1.72 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature list */}
      <section style={{ padding: "0 56px 100px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {["Multi-source ingestion — PDF, DOC, links, text","Automatic structured summarization","RAG-based querying with citations","Retrieval transparency & source trace","Claim-level hallucination detection","System evaluation dashboard"].map((item, i) => (
            <motion.div key={item}
              initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              whileHover={{ paddingLeft: 10 }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "22px 0", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "padding 0.2s", cursor: "default" }}>
              <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(17px, 2.2vw, 26px)", color: "rgba(255,255,255,0.65)", letterSpacing: "-0.01em" }}>{item}</span>
              <CheckCircle size={17} color="#a0f0c8" strokeWidth={2} style={{ flexShrink: 0, marginLeft: 16 }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 56px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(200,184,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-block", padding: "7px 18px", background: "rgba(200,184,255,0.1)", border: "1px solid rgba(200,184,255,0.2)", borderRadius: 30, marginBottom: 28 }}>
            <span style={{ fontSize: 12, color: "#c8b8ff", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Ready to start?</span>
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(38px, 6vw, 72px)", color: "#fff", letterSpacing: "-0.035em", marginBottom: 16, lineHeight: 1 }}>
            Build your research<br /><em style={{ color: "rgba(255,255,255,0.32)" }}>intelligence system.</em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 17, marginBottom: 36 }}>Research shouldn't be a guessing game.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/ingest" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{ background: "#c8b8ff", color: "#0d0d0f", border: "none", borderRadius: 12, padding: "15px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 9 }}>
                Start Research <ArrowRight size={17} />
              </motion.button>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ background: "rgba(255,255,255,0.07)" }}
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "15px 28px", fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
                Dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "24px 56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #c8b8ff, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers size={12} color="#0d0d0f" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 16, color: "rgba(255,255,255,0.35)" }}>Prism</span>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>Research Intelligence Platform</span>
      </footer>
    </div>
  );
}