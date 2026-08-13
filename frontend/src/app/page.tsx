"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Menu, X, Zap } from "lucide-react";

const SERIF = "var(--font-display, 'DM Serif Display', Georgia, serif)";
const SANS = "var(--font-sans, 'Syne', system-ui, sans-serif)";
const MONO = "var(--font-mono, 'JetBrains Mono', monospace)";

const NAV_LINKS = [
  { label: "Pipeline", href: "#pipeline" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Workflow", href: "#workflow" },
];

const STAGES = [
  { n: "01", t: "Ingest", d: "Drop in a PDF, DOCX, URL, or raw text. Prism extracts and chunks it automatically." },
  { n: "02", t: "Summarize", d: "TLDR, methodology, key concepts, and results surfaced in seconds, not skims." },
  { n: "03", t: "Query", d: "Ask anything. Every answer is RAG-grounded and cites the exact source chunk." },
  { n: "04", t: "Verify", d: "Claims are checked against context and scored for confidence before you trust them." },
];

const FEATURES = [
  { t: "Multi-source ingestion", d: "PDF, DOC, links, raw text — one pipeline for everything you read.", big: true },
  { t: "Structured summarization", d: "TLDR, methodology, results, limitations." },
  { t: "RAG-based querying", d: "Every answer grounded in your documents." },
  { t: "Retrieval transparency", d: "See exactly which chunk backs each claim." },
  { t: "Claim-level verification", d: "Confidence scores on every response." },
  { t: "Evaluation dashboard", d: "Real-time metrics from your sessions.", big: true },
];

const NUMBERS = [
  ["100%", "Source cited"],
  ["0%", "Hallucination tolerance"],
  ["RAG", "Core architecture"],
  ["NLI", "Claim verification"],
];

const TICKER_WORDS = ["Ingest", "Summarize", "Query", "Verify", "Cite", "Analyze", "Research", "Understand"];

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
    <div style={{ minHeight: "100vh", background: "#000000", color: "#ffffff", fontFamily: SANS, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(255,255,255,0.22); }
        a { color: inherit; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px, 5vw, 56px)",
          height: 68,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={14} color="#000000" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: SERIF, fontSize: 20, letterSpacing: "-0.01em" }}>Prism</span>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 36 }} className="prism-desktop-nav">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              style={{
                fontSize: 13,
                fontFamily: MONO,
                color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="prism-desktop-cta">
          <Link href="/login" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                borderRadius: 9,
                padding: "8px 18px",
                fontSize: 12.5,
                fontFamily: SANS,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign in
            </button>
          </Link>
          <Link href="/register" style={{ textDecoration: "none" }}>
            <motion.button
              whileHover={{ scale: 1.04 } as any}
              whileTap={{ scale: 0.96 } as any}
              style={{
                background: "#ffffff",
                color: "#000000",
                border: "none",
                borderRadius: 9,
                padding: "8px 20px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: SANS,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Get started <ArrowRight size={13} />
            </motion.button>
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="prism-mobile-toggle"
          style={{
            display: "none",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            width: 38,
            height: 38,
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 68,
            left: 0,
            right: 0,
            zIndex: 190,
            background: "#000000",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            padding: "20px clamp(20px, 5vw, 56px) 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
          className="prism-mobile-menu"
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: 15, fontFamily: SANS, color: "#ffffff", textDecoration: "none" }}
            >
              {l.label}
            </a>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Link href="/login" style={{ textDecoration: "none", flex: 1 }}>
              <button
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  borderRadius: 9,
                  padding: "10px 0",
                  fontSize: 13,
                  fontFamily: SANS,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign in
              </button>
            </Link>
            <Link href="/register" style={{ textDecoration: "none", flex: 1 }}>
              <button
                style={{
                  width: "100%",
                  background: "#ffffff",
                  color: "#000000",
                  border: "none",
                  borderRadius: 9,
                  padding: "10px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: SANS,
                }}
              >
                Get started
              </button>
            </Link>
          </div>
        </div>
      )}

      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "140px clamp(20px, 5vw, 56px) 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 10%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <motion.div {...fadeUp(0)} style={{ position: "relative", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 30,
              marginBottom: 32,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />
            <span
              style={{
                fontSize: 10.5,
                fontFamily: MONO,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Research intelligence platform
            </span>
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(42px, 8vw, 108px)",
              letterSpacing: "-0.04em",
              lineHeight: 0.98,
              maxWidth: 980,
            }}
          >
            Read less.
            <br />
            Know <em style={{ color: "rgba(255,255,255,0.4)" }}>more.</em>
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 1.6vw, 18px)",
              color: "rgba(255,255,255,0.5)",
              maxWidth: 560,
              lineHeight: 1.7,
              marginTop: 28,
            }}
          >
            Prism turns papers, reports, and raw text into grounded, citation-backed answers —
            every claim verified before it reaches you.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.03 } as any}
                whileTap={{ scale: 0.97 } as any}
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: "none",
                  borderRadius: 13,
                  padding: "16px 32px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: SANS,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                Start Research <ArrowRight size={17} />
              </motion.button>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ borderColor: "rgba(255,255,255,0.45)" } as any}
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 13,
                  padding: "16px 28px",
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: SANS,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Sign in <ArrowUpRight size={15} />
              </motion.button>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 0,
              borderTop: "1px solid rgba(255,255,255,0.14)",
              marginTop: 64,
              paddingTop: 26,
              maxWidth: 720,
            }}
          >
            {NUMBERS.map(([val, label], i) => (
              <div
                key={label}
                style={{
                  paddingRight: 20,
                  paddingLeft: i > 0 ? 20 : 0,
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.12)" : "none",
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: "-0.01em", fontWeight: 500 }}>{val}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.36)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: 5,
                    fontFamily: MONO,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "16px 0",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", width: "max-content", animation: "marquee 26s linear infinite", whiteSpace: "nowrap" }}>
          {[...Array(4)].flatMap(() => TICKER_WORDS).map((w, i) => (
            <span
              key={i}
              style={{
                padding: "0 34px",
                fontSize: 12,
                fontFamily: MONO,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: i % 2 === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)",
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      <section id="pipeline" style={{ padding: "120px clamp(20px, 5vw, 56px)", maxWidth: 1180, margin: "0 auto" }}>
        <motion.div {...fadeUp(0)} style={{ marginBottom: 64, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontFamily: MONO,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.34)",
                marginBottom: 14,
                fontWeight: 500,
              }}
            >
              How it works
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(30px, 4.5vw, 50px)", letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: 640 }}>
              From raw source to verified insight.
            </h2>
          </div>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 1,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {STAGES.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp(i * 0.08)}
              style={{ background: "#000000", padding: "34px 28px", display: "flex", flexDirection: "column", gap: 16, minHeight: 220 }}
            >
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: "rgba(255,255,255,0.32)" }}>{s.n}</span>
              <h3 style={{ fontFamily: SERIF, fontSize: 25, letterSpacing: "-0.01em" }}>{s.t}</h3>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.46)", lineHeight: 1.7 }}>{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="capabilities" style={{ padding: "0 clamp(20px, 5vw, 56px) 120px", maxWidth: 1180, margin: "0 auto" }}>
        <motion.div {...fadeUp(0)} style={{ marginBottom: 48 }}>
          <div
            style={{
              fontSize: 10.5,
              fontFamily: MONO,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.34)",
              marginBottom: 14,
              fontWeight: 500,
            }}
          >
            Capabilities
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(26px, 3.8vw, 42px)", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 620 }}>
            A complete research intelligence stack.
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(255,255,255,0.1)" }} className="prism-feature-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.t}
              {...fadeUp(i * 0.05)}
              style={{
                background: "#000000",
                padding: "30px 26px",
                gridColumn: f.big ? "span 2" : "span 1",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 150,
              }}
              className={f.big ? "prism-feature-big" : undefined}
            >
              <Check size={16} color="rgba(255,255,255,0.5)" />
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: SANS }}>{f.t}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 }}>{f.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="workflow"
        style={{
          padding: "110px clamp(20px, 5vw, 56px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <motion.div {...fadeUp(0)} style={{ maxWidth: 780 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 30,
              marginBottom: 28,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />
            <span
              style={{
                fontSize: 10.5,
                fontFamily: MONO,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Ready when you are
            </span>
          </div>
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(32px, 5.5vw, 60px)",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              marginBottom: 20,
            }}
          >
            Research shouldn't be a <em style={{ color: "rgba(255,255,255,0.4)" }}>guessing game.</em>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.42)", marginBottom: 36 }}>
            Build your research intelligence system today.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.04 } as any}
                whileTap={{ scale: 0.96 } as any}
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: "none",
                  borderRadius: 13,
                  padding: "15px 36px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: SANS,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                Create account <ArrowRight size={17} />
              </motion.button>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ borderColor: "rgba(255,255,255,0.4)" } as any}
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 13,
                  padding: "15px 26px",
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: SANS,
                }}
              >
                Sign in
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "26px clamp(20px, 5vw, 56px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={12} color="#000000" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 15, color: "rgba(255,255,255,0.5)" }}>Prism</span>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} style={{ textDecoration: "none", fontSize: 12.5, fontFamily: MONO, color: "rgba(255,255,255,0.34)" }}>
              {l.label}
            </a>
          ))}
        </div>
        <span style={{ fontSize: 11, fontFamily: MONO, color: "rgba(255,255,255,0.24)" }}>Research Intelligence Platform</span>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .prism-desktop-nav, .prism-desktop-cta { display: none !important; }
          .prism-mobile-toggle { display: flex !important; }
        }
        @media (max-width: 720px) {
          .prism-feature-grid { grid-template-columns: 1fr !important; }
          .prism-feature-big { grid-column: span 1 !important; }
        }
        @media (min-width: 901px) {
          .prism-mobile-menu { display: none !important; }
        }
      `}</style>
    </div>
  );
}