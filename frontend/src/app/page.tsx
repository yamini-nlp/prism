"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Zap } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
});

const PIPELINE = [
  { num: "I",   label: "Ingest",     desc: "PDF, DOCX, URLs, or raw text — extracted and chunked automatically." },
  { num: "II",  label: "Summarize",  desc: "TLDR, methodology, key concepts, results, surfaced in seconds." },
  { num: "III", label: "Query",      desc: "RAG-powered answers with inline citations, grounded in your sources." },
  { num: "IV",  label: "Verify",     desc: "Every claim checked against context. Confidence scored, not assumed." },
];

const CAPABILITIES = [
  { label: "Multi-source ingestion", sub: "PDF, DOC, links, raw text" },
  { label: "Structured summarization", sub: "TLDR, methodology, results, limitations" },
  { label: "RAG-based querying", sub: "Every answer grounded in your documents" },
  { label: "Retrieval transparency", sub: "See exactly which chunk backs each claim" },
  { label: "Claim-level verification", sub: "Confidence scores on every response" },
  { label: "Evaluation dashboard", sub: "Real-time metrics from your sessions" },
];

const STATS = [
  ["100%", "Source cited"],
  ["0%", "Hallucination"],
  ["RAG", "Architecture"],
  ["NLI", "Claim verified"],
];

const SERIF = "'DM Serif Display', Georgia, serif";
const SANS = "'Syne', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

function PrismDiagram() {
  return (
    <svg viewBox="0 0 460 420" style={{ width: "100%", height: "auto", display: "block" }}>
      <line x1="0" y1="180" x2="150" y2="180" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <motion.polygon
        points="150,120 230,180 150,240"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      {[
        { y2: 30,  op: 0.95, w: 1.4 },
        { y2: 95,  op: 0.75, w: 1.1 },
        { y2: 165, op: 0.55, w: 1.1 },
        { y2: 240, op: 0.4,  w: 1 },
        { y2: 310, op: 0.28, w: 1 },
        { y2: 380, op: 0.18, w: 1 },
      ].map((b, i) => (
        <motion.line
          key={i}
          x1="190" y1="180" x2="440" y2={b.y2}
          stroke="#ffffff" strokeOpacity={b.op} strokeWidth={b.w}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.7 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      <line x1="440" y1="10" x2="440" y2="400" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      {[30, 95, 165, 240, 310, 380].map((y, i) => (
        <line key={i} x1="434" y1={y} x2="446" y2={y} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      ))}
      <text x="20" y="172" fontFamily={MONO} fontSize="9" letterSpacing="0.08em" fill="rgba(255,255,255,0.4)">INPUT</text>
      <text x="185" y="205" fontFamily={MONO} fontSize="9" letterSpacing="0.08em" fill="rgba(255,255,255,0.4)">λ</text>
      <text x="452" y="34" fontFamily={MONO} fontSize="9" fill="rgba(255,255,255,0.3)">01</text>
      <text x="452" y="384" fontFamily={MONO} fontSize="9" fill="rgba(255,255,255,0.3)">06</text>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#ffffff", fontFamily: SANS }}>
      <style>{`
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(255,255,255,0.22); }
        a { color: inherit; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 52px", height: 64,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={14} color="#000000" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: SERIF, fontSize: 20, letterSpacing: "-0.01em", color: "#ffffff" }}>Prism</span>
          </div>
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[{ label: "Dashboard", href: "/dashboard" }, { label: "Workspace", href: "/workspace" }, { label: "Ingest", href: "/ingest" }].map(({ label, href }) => (
            <Link key={label} href={href} style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ borderColor: "rgba(255,255,255,0.4)" } as any}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.7)", borderRadius: 9, padding: "7px 16px", fontSize: 12.5, fontFamily: SANS, fontWeight: 600, letterSpacing: "0.01em", cursor: "pointer" }}>
                {label}
              </motion.button>
            </Link>
          ))}
          <Link href="/ingest" style={{ textDecoration: "none" }}>
            <motion.button whileHover={{ scale: 1.04 } as any} whileTap={{ scale: 0.96 } as any}
              style={{ background: "#ffffff", color: "#000000", border: "none", borderRadius: 9, padding: "8px 20px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 6 }}>
              Start <ArrowRight size={13} />
            </motion.button>
          </Link>
        </div>
      </nav>

      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "110px 52px 60px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 64, maxWidth: 1240, margin: "0 auto", width: "100%" }}>
          <div style={{ flex: 1, maxWidth: 560 }}>
            <motion.div {...fadeUp(0.1)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 30, marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />
              <span style={{ fontSize: 10.5, fontFamily: MONO, color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Research Intelligence</span>
            </motion.div>

            <motion.h1 {...fadeUp(0.16)} style={{
              fontFamily: SERIF,
              fontSize: "clamp(72px, 10vw, 130px)",
              lineHeight: 0.88,
              letterSpacing: "-0.04em",
              color: "#ffffff",
              marginBottom: 20,
            }}>
              Prism
            </motion.h1>

            <motion.p {...fadeUp(0.24)} style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: "clamp(18px, 2.4vw, 25px)",
              color: "rgba(255,255,255,0.85)",
              marginBottom: 18,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}>
              Clarity, backed by sources.
            </motion.p>

            <motion.p {...fadeUp(0.3)} style={{
              fontSize: 15.5,
              color: "rgba(255,255,255,0.48)",
              lineHeight: 1.8,
              marginBottom: 36,
              maxWidth: 420,
            }}>
              Upload research papers, query your knowledge base, and receive verified answers — every claim traced to its exact source.
            </motion.p>

            <motion.div {...fadeUp(0.36)} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
              <Link href="/ingest" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.04 } as any} whileTap={{ scale: 0.96 } as any}
                  style={{ background: "#ffffff", color: "#000000", border: "none", borderRadius: 13, padding: "14px 32px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 8 }}>
                  Start Research <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href="/workspace" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ borderColor: "rgba(255,255,255,0.4)" } as any}
                  style={{ background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 13, padding: "14px 24px", fontSize: 14.5, cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 8 }}>
                  Open Workspace <ArrowUpRight size={15} />
                </motion.button>
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.44)} style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 24 }}>
              {STATS.map(([val, label], i) => (
                <div key={label} style={{ flex: 1, paddingRight: i < 3 ? 20 : 0, borderRight: i < 3 ? "1px solid rgba(255,255,255,0.12)" : "none", paddingLeft: i > 0 ? 20 : 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 19, color: "#ffffff", letterSpacing: "-0.01em", fontWeight: 500 }}>{val}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.36)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4, fontFamily: MONO }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexShrink: 0, width: "min(100%, 460px)" }}
          >
            <PrismDiagram />
          </motion.div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "14px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "ticker 24s linear infinite", width: "max-content", whiteSpace: "nowrap" }}>
          {[...Array(4)].flatMap(() => ["Ingest", "Summarize", "Query", "Verify", "Cite", "Analyze", "Research", "Understand"]).map((w, i) => (
            <span key={i} style={{ padding: "0 36px", fontSize: 12, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", color: i % 2 === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)" }}>
              {w}
            </span>
          ))}
        </div>
      </div>

      <section style={{ padding: "100px 52px", maxWidth: 1000, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 10.5, fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.34)", marginBottom: 14, fontWeight: 500 }}>Pipeline</div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4.5vw, 46px)", letterSpacing: "-0.03em", lineHeight: 1.08, color: "#ffffff" }}>
            From source to insight,{" "}
            <em style={{ color: "rgba(255,255,255,0.4)" }}>in four steps.</em>
          </h2>
        </motion.div>

        <div>
          {PIPELINE.map((p, i) => (
            <motion.div key={p.num}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{
                display: "flex", alignItems: "baseline", gap: 28,
                padding: "28px 0",
                borderTop: i === 0 ? "1px solid rgba(255,255,255,0.14)" : "none",
                borderBottom: "1px solid rgba(255,255,255,0.14)",
              }}>
              <span style={{ fontFamily: MONO, fontSize: 13, color: "rgba(255,255,255,0.32)", width: 32, flexShrink: 0 }}>{p.num}</span>
              <h3 style={{ fontFamily: SERIF, fontSize: 26, color: "#ffffff", letterSpacing: "-0.01em", width: 190, flexShrink: 0 }}>{p.label}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.46)", lineHeight: 1.7, flex: 1 }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 52px 100px", maxWidth: 1000, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10.5, fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.34)", marginBottom: 14, fontWeight: 500 }}>Capabilities</div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 3.6vw, 38px)", letterSpacing: "-0.03em", lineHeight: 1.1, color: "#ffffff" }}>
            A complete research<br /><em style={{ color: "rgba(255,255,255,0.4)" }}>intelligence stack.</em>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 1, background: "rgba(255,255,255,0.1)" }}>
          {CAPABILITIES.map((item, i) => (
            <motion.div key={item.label}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              style={{
                padding: "24px 26px",
                background: "#000000",
                display: "flex", alignItems: "flex-start", gap: 14,
              }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: "rgba(255,255,255,0.32)", marginTop: 3, flexShrink: 0 }}>—</span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "#ffffff", marginBottom: 5, fontFamily: SANS }}>{item.label}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{item.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "90px 52px 110px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 30, marginBottom: 26 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />
            <span style={{ fontSize: 10.5, fontFamily: MONO, color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Ready when you are</span>
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(34px, 5.5vw, 66px)", letterSpacing: "-0.04em", lineHeight: 0.98, marginBottom: 18, color: "#ffffff" }}>
            Research shouldn't<br /><em style={{ color: "rgba(255,255,255,0.4)" }}>be a guessing game.</em>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.42)", marginBottom: 38 }}>Build your research intelligence system today.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/ingest" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.04 } as any} whileTap={{ scale: 0.96 } as any}
                style={{ background: "#ffffff", color: "#000000", border: "none", borderRadius: 13, padding: "15px 38px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: SANS, display: "inline-flex", alignItems: "center", gap: 9 }}>
                Start Research <ArrowRight size={17} />
              </motion.button>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ borderColor: "rgba(255,255,255,0.4)" } as any}
                style={{ background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 13, padding: "15px 26px", fontSize: 15, cursor: "pointer", fontFamily: SANS }}>
                Dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "24px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={12} color="#000000" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 15, color: "rgba(255,255,255,0.5)" }}>Prism</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Dashboard", "/dashboard"], ["Workspace", "/workspace"], ["Ingest", "/ingest"], ["Evaluate", "/evaluation"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ textDecoration: "none", fontSize: 12.5, fontFamily: MONO, color: "rgba(255,255,255,0.34)" }}>{label}</Link>
          ))}
        </div>
        <span style={{ fontSize: 11, fontFamily: MONO, color: "rgba(255,255,255,0.24)" }}>Research Intelligence Platform</span>
      </footer>
    </div>
  );
}