"use client";

import { useEffect, useRef } from "react";
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

function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 420;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R = 160;

    // Dots uniformly on sphere
    const NUM_DOTS = 280;
    const origDots: [number, number, number][] = [];
    for (let i = 0; i < NUM_DOTS; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      origDots.push([
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      ]);
    }

    // Arcs
    type Arc = { ai: number; bi: number; t: number; speed: number };
    const arcs: Arc[] = [];
    for (let i = 0; i < 14; i++) {
      arcs.push({
        ai: Math.floor(Math.random() * NUM_DOTS),
        bi: Math.floor(Math.random() * NUM_DOTS),
        t: Math.random(),
        speed: 0.0025 + Math.random() * 0.003,
      });
    }

    let angle = 0;

    function ry(x: number, y: number, z: number, a: number): [number, number, number] {
      return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
    }

    function proj(x: number, y: number, z: number): [number, number, number] {
      const s = (z + 3) / 4;
      return [cx + x * R * s, cy - y * R * s, z];
    }

    function slerp(a: [number,number,number], b: [number,number,number], t: number): [number,number,number] {
      let nx = a[0] + (b[0] - a[0]) * t;
      let ny = a[1] + (b[1] - a[1]) * t;
      let nz = a[2] + (b[2] - a[2]) * t;
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
      return [nx/len, ny/len, nz/len];
    }

    function drawFrame() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      angle += 0.0035;

      // Project all dots
      const projected = origDots.map(([ox, oy, oz]) => {
        const [rx, ry2, rz] = ry(ox, oy, oz, angle);
        const [px, py, pz] = proj(rx, ry2, rz);
        return { px, py, pz, visible: pz > -0.1 };
      });

      // Lat lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const pts: [number, number][] = [];
        for (let lon = 0; lon <= 360; lon += 4) {
          const phi = (90 - lat) * Math.PI / 180;
          const theta2 = lon * Math.PI / 180;
          const ox = Math.sin(phi) * Math.cos(theta2);
          const oy2 = Math.cos(phi);
          const oz = Math.sin(phi) * Math.sin(theta2);
          const [rx2, ry3, rz2] = ry(ox, oy2, oz, angle);
          if (rz2 > 0) {
            const [px2, py2] = proj(rx2, ry3, rz2);
            pts.push([px2, py2]);
          }
        }
        if (pts.length > 2) {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (const [px2, py2] of pts) ctx.lineTo(px2, py2);
          ctx.strokeStyle = "rgba(91,94,244,0.08)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      // Lon lines
      for (let lon = 0; lon < 180; lon += 30) {
        const pts: [number, number][] = [];
        for (let lat2 = -90; lat2 <= 90; lat2 += 4) {
          const phi = (90 - lat2) * Math.PI / 180;
          const theta2 = lon * Math.PI / 180;
          const ox = Math.sin(phi) * Math.cos(theta2);
          const oy2 = Math.cos(phi);
          const oz = Math.sin(phi) * Math.sin(theta2);
          const [rx2, ry3, rz2] = ry(ox, oy2, oz, angle);
          if (rz2 > 0) {
            const [px2, py2] = proj(rx2, ry3, rz2);
            pts.push([px2, py2]);
          }
        }
        if (pts.length > 2) {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (const [px2, py2] of pts) ctx.lineTo(px2, py2);
          ctx.strokeStyle = "rgba(91,94,244,0.08)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      // Dots
      for (const p of projected) {
        if (!p.visible) continue;
        const depth = (p.pz + 1) / 2;
        const size = 1 + depth * 2;
        const alpha = 0.25 + depth * 0.6;
        ctx.beginPath();
        ctx.arc(p.px, p.py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(91,94,244,${alpha})`;
        ctx.fill();
      }

      // Arcs
      for (const arc of arcs) {
        arc.t += arc.speed;
        if (arc.t > 1.4) {
          arc.t = 0;
          arc.ai = Math.floor(Math.random() * NUM_DOTS);
          arc.bi = Math.floor(Math.random() * NUM_DOTS);
        }

        const a = origDots[arc.ai];
        const b = origDots[arc.bi];
        const STEPS = 20;
        const endStep = Math.floor(Math.min(arc.t, 1) * STEPS);
        if (endStep < 1) continue;

        const pts2: [number, number, number][] = [];
        for (let s = 0; s <= endStep; s++) {
          const interp = slerp(a, b, s / STEPS);
          const [rx2, ry3, rz2] = ry(interp[0], interp[1], interp[2], angle);
          pts2.push(proj(rx2, ry3, rz2));
        }

        const visible = pts2.every(p => p[2] > 0);
        if (!visible) continue;

        ctx.beginPath();
        ctx.moveTo(pts2[0][0], pts2[0][1]);
        for (let s = 1; s < pts2.length; s++) ctx.lineTo(pts2[s][0], pts2[s][1]);
        ctx.strokeStyle = "rgba(91,94,244,0.55)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Head dot
        const head = pts2[pts2.length - 1];
        ctx.beginPath();
        ctx.arc(head[0], head[1], 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(91,94,244,0.9)";
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 420, height: 420, display: "block" }}
    />
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
              Start Researching <ArrowRight size={14} />
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
        {/* Subtle bg gradient */}
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
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <Link href="/ingest" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ ...S.btnPrimary, padding: "13px 28px", fontSize: 15 }}>
                Start Researching <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.02 }}
                style={{ ...S.btnSecondary, padding: "13px 24px", fontSize: 15 }}>
                View Dashboard
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Globe */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            flexShrink: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Glow */}
          <div style={{
            position: "absolute",
            width: 340, height: 340,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(91,94,244,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <Globe />
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