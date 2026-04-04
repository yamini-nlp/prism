"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle, FileText, Search, ShieldCheck, Zap } from "lucide-react";
import { S } from "@/lib/styles";

const steps = [
  { icon: FileText,    num: "01", label: "Ingest",     desc: "Upload papers, paste text, or add links. Prism extracts and structures everything.", color: "#5b5ef4" },
  { icon: Zap,         num: "02", label: "Understand", desc: "Auto-generates TLDR, key concepts, methodology and results in structured format.",   color: "#3b82f6" },
  { icon: Search,      num: "03", label: "Ask",        desc: "Query your knowledge base naturally. Get precise answers with inline citations.",     color: "#d4622a" },
  { icon: ShieldCheck, num: "04", label: "Verify",     desc: "Every claim is checked against sources. Hallucinations are detected and flagged.",   color: "#3d9970" },
];

const features = [
  "Multi-source ingestion (PDF, DOC, links, text)",
  "Automatic structured summarization",
  "RAG-based grounded querying with citations",
  "Retrieval transparency and source trace",
  "Claim-level hallucination detection",
  "System evaluation dashboard",
];

const orbitDots = [
  { size: 6, color: "#5b5ef4", delay: "0s",   duration: "8s",  radius: 130, startAngle: 0 },
  { size: 4, color: "#3b82f6", delay: "-3s",  duration: "8s",  radius: 130, startAngle: 180 },
  { size: 5, color: "#5b5ef4", delay: "-1s",  duration: "12s", radius: 170, startAngle: 90 },
  { size: 3, color: "#6366f1", delay: "-6s",  duration: "12s", radius: 170, startAngle: 270 },
  { size: 4, color: "#3b82f6", delay: "-2s",  duration: "18s", radius: 205, startAngle: 45 },
  { size: 5, color: "#5b5ef4", delay: "-9s",  duration: "18s", radius: 205, startAngle: 225 },
  { size: 3, color: "#818cf8", delay: "-4s",  duration: "18s", radius: 205, startAngle: 135 },
];

function PrismVisual() {
  return (
    <div style={{ position: "relative", width: 440, height: 440, flexShrink: 0 }}>
      <style>{`
        @keyframes orbit0  { from { transform: rotate(0deg)   translateX(130px) rotate(0deg);   } to { transform: rotate(360deg)   translateX(130px) rotate(-360deg);   } }
        @keyframes orbit1  { from { transform: rotate(180deg) translateX(130px) rotate(-180deg);} to { transform: rotate(540deg)  translateX(130px) rotate(-540deg); } }
        @keyframes orbit2  { from { transform: rotate(90deg)  translateX(170px) rotate(-90deg); } to { transform: rotate(450deg)  translateX(170px) rotate(-450deg); } }
        @keyframes orbit3  { from { transform: rotate(270deg) translateX(170px) rotate(-270deg);} to { transform: rotate(630deg)  translateX(170px) rotate(-630deg);} }
        @keyframes orbit4  { from { transform: rotate(45deg)  translateX(205px) rotate(-45deg); } to { transform: rotate(405deg)  translateX(205px) rotate(-405deg); } }
        @keyframes orbit5  { from { transform: rotate(225deg) translateX(205px) rotate(-225deg);} to { transform: rotate(585deg)  translateX(205px) rotate(-585deg);} }
        @keyframes orbit6  { from { transform: rotate(135deg) translateX(205px) rotate(-135deg);} to { transform: rotate(495deg)  translateX(205px) rotate(-495deg);} }
        @keyframes floatUp { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.18; transform: scale(1); } 50% { opacity: 0.28; transform: scale(1.06); } }
        @keyframes arcDraw1 { 0% { stroke-dashoffset: 400; opacity:0; } 10% { opacity:1; } 80% { opacity:1; } 100% { stroke-dashoffset: 0; opacity:0; } }
        @keyframes arcDraw2 { 0% { stroke-dashoffset: 350; opacity:0; } 15% { opacity:1; } 75% { opacity:1; } 100% { stroke-dashoffset: 0; opacity:0; } }
        @keyframes arcDraw3 { 0% { stroke-dashoffset: 380; opacity:0; } 12% { opacity:1; } 78% { opacity:1; } 100% { stroke-dashoffset: 0; opacity:0; } }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinSlowRev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes dotPulse { 0%,100% { r: 3; opacity: 0.7; } 50% { r: 5; opacity: 1; } }
      `}</style>

      {/* Outer ambient glow */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "radial-gradient(circle at 50% 50%, rgba(91,94,244,0.18) 0%, rgba(91,94,244,0.06) 45%, transparent 70%)",
        animation: "pulseGlow 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* SVG globe + arcs layer */}
      <svg
        width="440" height="440"
        viewBox="0 0 440 440"
        style={{ position: "absolute", inset: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer rings */}
        <circle cx="220" cy="220" r="205" fill="none" stroke="rgba(91,94,244,0.07)" strokeWidth="1" style={{ animation: "spinSlow 60s linear infinite", transformOrigin: "220px 220px" }} />
        <circle cx="220" cy="220" r="205" fill="none" stroke="rgba(91,94,244,0.05)" strokeWidth="0.5" strokeDasharray="4 12" style={{ animation: "spinSlowRev 40s linear infinite", transformOrigin: "220px 220px" }} />
        <circle cx="220" cy="220" r="170" fill="none" stroke="rgba(91,94,244,0.06)" strokeWidth="0.8" strokeDasharray="3 8" style={{ animation: "spinSlow 50s linear infinite", transformOrigin: "220px 220px" }} />
        <circle cx="220" cy="220" r="130" fill="none" stroke="rgba(91,94,244,0.09)" strokeWidth="0.8" />

        {/* Globe sphere */}
        <defs>
          <radialGradient id="sphereGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="40%" stopColor="rgba(240,241,255,0.4)" />
            <stop offset="100%" stopColor="rgba(91,94,244,0.12)" />
          </radialGradient>
          <radialGradient id="sphereShadow" cx="60%" cy="65%" r="55%">
            <stop offset="0%" stopColor="rgba(91,94,244,0.15)" />
            <stop offset="100%" stopColor="rgba(91,94,244,0)" />
          </radialGradient>
          <clipPath id="sphereClip">
            <circle cx="220" cy="220" r="98" />
          </clipPath>
        </defs>

        {/* Sphere base */}
        <circle cx="220" cy="220" r="98" fill="url(#sphereGrad)" stroke="rgba(91,94,244,0.18)" strokeWidth="1" />
        <circle cx="220" cy="220" r="98" fill="url(#sphereShadow)" />

        {/* Lat lines on sphere */}
        {[-50, -25, 0, 25, 50].map((lat, i) => {
          const y = 220 + (lat / 90) * 98;
          const halfW = Math.sqrt(Math.max(0, 98 * 98 - (y - 220) * (y - 220)));
          return halfW > 2 ? (
            <ellipse key={i} cx="220" cy={y} rx={halfW} ry={halfW * 0.28}
              fill="none" stroke="rgba(91,94,244,0.09)" strokeWidth="0.7" clipPath="url(#sphereClip)" />
          ) : null;
        })}

        {/* Lon lines on sphere */}
        {[0, 30, 60, 90, 120, 150].map((lon, i) => (
          <ellipse key={i} cx="220" cy="220" rx={Math.abs(Math.cos(lon * Math.PI / 180)) * 98 + 2}
            ry="98" fill="none" stroke="rgba(91,94,244,0.07)" strokeWidth="0.7"
            clipPath="url(#sphereClip)"
            transform={`rotate(${lon}, 220, 220)`} />
        ))}

        {/* Sphere highlight */}
        <ellipse cx="198" cy="195" rx="28" ry="18"
          fill="rgba(255,255,255,0.22)" style={{ filter: "blur(4px)" }} />

        {/* Animated arcs */}
        <path d="M 155 160 Q 180 120 260 145" fill="none" stroke="rgba(91,94,244,0.55)" strokeWidth="1.5"
          strokeDasharray="400" style={{ animation: "arcDraw1 4s ease-in-out infinite" }} />
        <circle r="3.5" fill="#5b5ef4" opacity="0.9">
          <animateMotion dur="4s" repeatCount="indefinite"
            path="M 155 160 Q 180 120 260 145" />
        </circle>

        <path d="M 270 280 Q 200 310 148 255" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"
          strokeDasharray="350" style={{ animation: "arcDraw2 5.5s ease-in-out infinite 1.5s" }} />
        <circle r="3" fill="#3b82f6" opacity="0.9">
          <animateMotion dur="5.5s" begin="1.5s" repeatCount="indefinite"
            path="M 270 280 Q 200 310 148 255" />
        </circle>

        <path d="M 130 210 Q 175 170 240 190 Q 290 205 310 250" fill="none" stroke="rgba(99,102,241,0.45)" strokeWidth="1.2"
          strokeDasharray="380" style={{ animation: "arcDraw3 7s ease-in-out infinite 2.8s" }} />
        <circle r="2.5" fill="#6366f1" opacity="0.9">
          <animateMotion dur="7s" begin="2.8s" repeatCount="indefinite"
            path="M 130 210 Q 175 170 240 190 Q 290 205 310 250" />
        </circle>

        {/* Scattered dots */}
        {[
          [160,175],[245,158],[290,200],[275,260],[195,290],[148,250],[310,230],
          [175,130],[255,130],[320,175],[330,240],[290,310],[220,315],[155,305],
          [128,240],[135,175],[185,108],[265,108],[335,160],[350,225],[330,295],
          [265,340],[195,345],[138,310],[112,255],[108,185],[148,130],[210,102],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.5 : i % 3 === 1 ? 1.8 : 1.4}
            fill="#5b5ef4" opacity={0.25 + (i % 5) * 0.1} />
        ))}
      </svg>

      {/* Orbiting dots using CSS */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {orbitDots.map((dot, i) => (
          <div key={i} style={{
            position: "absolute",
            width: dot.size, height: dot.size,
            borderRadius: "50%",
            background: dot.color,
            boxShadow: `0 0 ${dot.size * 2}px ${dot.color}`,
            animation: `orbit${i} ${dot.duration} linear infinite`,
            animationDelay: dot.delay,
          }} />
        ))}
      </div>

      {/* Floating label chips */}
      <motion.div
        animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: 52, right: 20,
          background: "rgba(255,255,255,0.92)", border: "1px solid rgba(91,94,244,0.2)",
          borderRadius: 10, padding: "7px 13px",
          fontSize: 11.5, fontWeight: 600, color: "#5b5ef4",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 20px rgba(91,94,244,0.12)",
          display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5b5ef4" }} />
        RAG-powered
      </motion.div>

      <motion.div
        animate={{ y: [0, 9, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          position: "absolute", bottom: 68, left: 12,
          background: "rgba(255,255,255,0.92)", border: "1px solid rgba(61,153,112,0.25)",
          borderRadius: 10, padding: "7px 13px",
          fontSize: 11.5, fontWeight: 600, color: "#3d9970",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 20px rgba(61,153,112,0.1)",
          display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3d9970" }} />
        Verified sources
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute", bottom: 90, right: 18,
          background: "rgba(255,255,255,0.92)", border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: 10, padding: "7px 13px",
          fontSize: 11.5, fontWeight: 600, color: "#3b82f6",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 20px rgba(59,130,246,0.1)",
          display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
        0% hallucination
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f7f6f3" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 52px",
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, background: "#111110", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 21, color: "#111110" }}>Prism</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={S.btnSecondary}>Dashboard</button>
          </Link>
          <Link href="/ingest" style={{ textDecoration: "none" }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={S.btnPrimary}>
              Start Research <ArrowRight size={14} />
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: "0 52px 0 64px",
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 32,
        background: "#f7f6f3",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 8% 55%, rgba(91,94,244,0.09) 0%, transparent 50%), radial-gradient(ellipse at 80% 25%, rgba(59,130,246,0.05) 0%, transparent 50%)",
        }} />

        {/* Left text */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ maxWidth: 520, flexShrink: 0, position: "relative", zIndex: 2 }}
        >
          <motion.span
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ ...S.tagIndigo, marginBottom: 24, display: "inline-block" }}
          >
            Research Intelligence
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.65 }}
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(80px, 10vw, 128px)",
              lineHeight: 0.88,
              letterSpacing: "-0.035em",
              color: "#111110",
              margin: "0 0 14px",
            }}
          >
            Prism
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.55 }}
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(20px, 2.6vw, 30px)",
              fontStyle: "italic",
              color: "#6b6865",
              margin: "0 0 26px",
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
            }}
          >
            Clarity, backed by sources.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            style={{ fontSize: 16, color: "#6b6865", lineHeight: 1.75, marginBottom: 36, maxWidth: 420 }}
          >
            Upload research papers, ask questions, and get verified answers —
            every claim traced back to its source.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}
          >
            <Link href="/ingest" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ ...S.btnPrimary, padding: "13px 28px", fontSize: 15 }}>
                Start Research <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.02 }}
                style={{ ...S.btnSecondary, padding: "13px 24px", fontSize: 15 }}>
                View Dashboard
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ display: "flex", gap: 28, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.08)" }}
          >
            {[["RAG", "Powered"], ["0%", "Hallucination"], ["∞", "Documents"]].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111110", fontFamily: "'DM Serif Display', Georgia, serif" }}>{val}</div>
                <div style={{ fontSize: 11.5, color: "#9a9590", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right visual */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <PrismVisual />
        </motion.div>
      </section>

      {/* How it works */}
      <section style={{ padding: "80px 52px", background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 52 }}>
          <span style={{ ...S.tagIndigo, marginBottom: 14, display: "inline-block" }}>How It Works</span>
          <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: "clamp(28px,4vw,48px)", color: "#111110", letterSpacing: "-0.02em", marginTop: 12 }}>
            From source to insight,{" "}
            <span style={{ fontStyle: "italic", color: "#6b6865" }}>in four steps.</span>
          </h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, maxWidth: 1080, margin: "0 auto" }}>
          {steps.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.09 }}
              style={{ ...S.card, padding: 26 }}
              whileHover={{ y: -3, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <s.icon size={19} color={s.color} strokeWidth={2} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9a9590", marginBottom: 6 }}>Step {s.num}</div>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 21, color: "#111110", marginBottom: 9 }}>{s.label}</h3>
              <p style={{ fontSize: 13.5, color: "#6b6865", lineHeight: 1.65 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: "80px 52px", borderTop: "1px solid rgba(0,0,0,0.07)",
        background: "radial-gradient(ellipse at 30% 50%, rgba(91,94,244,0.05) 0%, transparent 55%), #f7f6f3",
        display: "flex", gap: 72, alignItems: "center", flexWrap: "wrap", justifyContent: "center",
      }}>
        <motion.div initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ maxWidth: 420 }}>
          <span style={{ ...S.tagGreen, marginBottom: 14, display: "inline-block" }}>Everything You Need</span>
          <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: "clamp(22px,3.2vw,38px)", color: "#111110", letterSpacing: "-0.02em", marginTop: 12, marginBottom: 16 }}>
            A complete research intelligence stack.
          </h2>
          <p style={{ color: "#6b6865", fontSize: 15, lineHeight: 1.75 }}>
            Prism combines ingestion, semantic search, LLM generation, and verification into one cohesive research tool.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {features.map((f, i) => (
            <motion.div key={f} initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <CheckCircle size={17} color="#3d9970" strokeWidth={2.5} />
              <span style={{ fontSize: 14.5, color: "#111110", fontWeight: 500 }}>{f}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 52px", textAlign: "center", background: "#111110" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(28px,4vw,52px)", color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>
            Start using Prism
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, marginBottom: 32 }}>Research shouldn't be a guessing game.</p>
          <Link href="/ingest" style={{ textDecoration: "none" }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              style={{ background: "#fff", color: "#111110", border: "none", borderRadius: 12, padding: "13px 32px", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Let's Start <ArrowRight size={16} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

    </div>
  );
}