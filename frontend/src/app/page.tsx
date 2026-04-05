"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, Search, ShieldCheck, Zap, CheckCircle, BookOpen } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
});

const FEATURES = [
  { icon: FileText,    label: "Ingest",    desc: "PDF, DOCX, URLs, raw text — extracted and indexed automatically.", accent: "#60a5fa" },
  { icon: Zap,         label: "Summarize", desc: "TLDR, methodology, key concepts, results — generated in seconds.",  accent: "#93c5fd" },
  { icon: Search,      label: "Query",     desc: "RAG-powered answers with inline citations. Zero hallucinations.",    accent: "#38bdf8" },
  { icon: ShieldCheck, label: "Verify",    desc: "Every claim traced to its source. Full confidence scores.",         accent: "#7dd3fc" },
];

const FEATURE_LIST = [
  { label: "Multi-source ingestion", sub: "PDF, DOC, links, raw text" },
  { label: "Automatic structured summarization", sub: "TLDR, methodology, results, limitations" },
  { label: "RAG-based querying with citations", sub: "Every answer grounded in your documents" },
  { label: "Retrieval transparency & source trace", sub: "See exactly which chunk backs each claim" },
  { label: "Claim-level hallucination detection", sub: "Confidence scores on every response" },
  { label: "System evaluation dashboard", sub: "Real-time metrics from your sessions" },
];

function Dot({ color = "#60a5fa" }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 8, height: 8, flexShrink: 0 }}>
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}`}</style>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "ping 1.6s ease-out infinite" }} />
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
    </span>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#fff", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(62, 197, 255, 0.25); }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 52px", height: 64,
        background: "rgba(10,10,12,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg,#66d9ff,#44c7ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={15} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 20, letterSpacing: "-0.02em", color: "#fff" }}>Prism</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[{ label: "Dashboard", href: "/dashboard" }, { label: "Workspace", href: "/workspace" }, { label: "Ingest", href: "/ingest" }].map(({ label, href }) => (
            <Link key={label} href={href} style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ background: "rgba(255,255,255,0.07)" } as any}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 9, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {label}
              </motion.button>
            </Link>
          ))}
          <Link href="/ingest" style={{ textDecoration: "none" }}>
            <motion.button whileHover={{ scale: 1.04 } as any} whileTap={{ scale: 0.96 } as any}
              style={{ background: "#44c7ff", color: "#fff", border: "none", borderRadius: 9, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
              Start <ArrowRight size={13} />
            </motion.button>
          </Link>
        </div>
      </nav>

      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "100px 52px 60px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "30%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 64, maxWidth: 1200, margin: "0 auto", width: "100%" }}>

          <div style={{ flex: 1, maxWidth: 560 }}>
            <motion.div {...fadeUp(0.1)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(59, 184, 246, 0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 30, marginBottom: 28 }}>
              <Dot color="#60a5fa" />
              <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>Research Intelligence</span>
            </motion.div>

            <motion.h1 {...fadeUp(0.15)} style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(72px, 11vw, 140px)",
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
              color: "#ffffff",
              marginBottom: 20,
            }}>
              Prism
            </motion.h1>

            <motion.p {...fadeUp(0.22)} style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(18px, 2.5vw, 26px)",
              fontStyle: "italic",
              color: "rgb(116, 209, 255)",
              marginBottom: 18,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}>
              Clarity, backed by sources.
            </motion.p>

            <motion.p {...fadeUp(0.28)} style={{
              fontSize: "clamp(14px, 1.6vw, 17px)",
              color: "rgba(255,255,255,0.38)",
              lineHeight: 1.8,
              marginBottom: 36,
              maxWidth: 420,
            }}>
              Upload research papers, query your knowledge base, and receive verified answers — every claim traced to its exact source.
            </motion.p>

            <motion.div {...fadeUp(0.34)} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
              <Link href="/ingest" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.04 } as any} whileTap={{ scale: 0.96 } as any}
                  style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 13, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                  Start Research <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href="/workspace" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ background: "rgba(255,255,255,0.07)" } as any}
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: "14px 24px", fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                  Open Workspace <ArrowUpRight size={15} />
                </motion.button>
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.42)} style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24 }}>
              {[["100%", "Source cited"], ["0%", "Hallucination"], ["∞", "Documents"], ["RAG", "Architecture"]].map(([val, label], i) => (
                <div key={label} style={{ flex: 1, paddingRight: i < 3 ? 20 : 0, borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", paddingLeft: i > 0 ? 20 : 0 }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#fff", letterSpacing: "-0.02em" }}>{val}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexShrink: 0, width: "min(100%, 480px)" }}
          >
            <img
              src="/images/hero.jpeg"
              alt="Prism Research Platform"
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 20,
                objectFit: "cover",
                display: "block",
              }}
            />
          </motion.div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "ticker 22s linear infinite", width: "max-content", whiteSpace: "nowrap" }}>
          {[...Array(4)].flatMap(() => ["Ingest", "Summarize", "Query", "Verify", "Cite", "Analyze", "Research", "Understand"]).map((w, i) => (
            <span key={i} style={{ padding: "0 36px", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: i % 2 === 0 ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.15)", fontFamily: "Georgia, serif", fontStyle: i % 2 === 0 ? "italic" : "normal" }}>
              {w}
            </span>
          ))}
        </div>
      </div>

      <section style={{ padding: "90px 52px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 52 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginBottom: 12, fontWeight: 600 }}>How It Works</div>
          <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            From source to insight,{" "}
            <em style={{ color: "rgba(255,255,255,0.3)" }}>in four steps.</em>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 2 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ background: "rgba(255,255,255,0.04)" } as any}
              style={{ padding: "36px 32px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: i === 0 ? "16px 0 0 16px" : i === FEATURES.length - 1 ? "0 16px 16px 0" : 0, transition: "background 0.2s" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.accent + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <f.icon size={20} color={f.accent} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: 10 }}>0{i + 1}</div>
              <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 24, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>{f.label}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", lineHeight: 1.72 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 52px 90px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginBottom: 12, fontWeight: 600 }}>Everything You Need</div>
          <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(24px, 4vw, 42px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            A complete research<br /><em style={{ color: "rgba(255,255,255,0.3)" }}>intelligence stack.</em>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {FEATURE_LIST.map((item, i) => (
            <motion.div key={item.label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{
                padding: "22px 24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                display: "flex", alignItems: "flex-start", gap: 14,
              }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(59, 174, 246, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <CheckCircle size={15} color="#60a5fa" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "#fff", marginBottom: 4, fontFamily: "Georgia, serif" }}>{item.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>{item.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "70px 52px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(59, 187, 246, 0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(59, 187, 246, 0.1)", border: "1px solid rgba(70, 192, 252, 0.25)", borderRadius: 30, marginBottom: 24 }}>
            <Dot color="#60a5fa" />
            <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>Ready when you are</span>
          </div>
          <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(36px, 6vw, 72px)", letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: 16 }}>
            Research shouldn't<br /><em style={{ color: "rgba(255,255,255,0.28)" }}>be a guessing game.</em>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", marginBottom: 36 }}>Build your research intelligence system today.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/ingest" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.04 } as any} whileTap={{ scale: 0.96 } as any}
                style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 13, padding: "15px 38px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 9 }}>
                Start Research <ArrowRight size={17} />
              </motion.button>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ background: "rgba(255,255,255,0.07)" } as any}
                style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: "15px 26px", fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
                Dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "22px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,rgb(96, 183, 250),rgb(59, 181, 246))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={13} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 16, color: "rgba(255,255,255,0.3)" }}>Prism</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Dashboard", "/dashboard"], ["Workspace", "/workspace"], ["Ingest", "/ingest"], ["Evaluate", "/evaluation"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ textDecoration: "none", fontSize: 13, color: "rgba(255,255,255,0.22)" }}>{label}</Link>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>Research Intelligence Platform</span>
      </footer>
    </div>
  );
}