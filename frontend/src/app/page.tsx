"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, FileText, Search,
  ShieldCheck, Zap, Layers, CheckCircle, BookOpen, BarChart2
} from "lucide-react";

/* ── tiny spring helper ─────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
});

/* ── animated number counter ────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 60);
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(start);
    }, 18);
    return () => clearInterval(t);
  }, [to]);
  return <>{val}{suffix}</>;
}

/* ── marquee ────────────────────────────────────────────────────── */
const WORDS = ["Ingest","Summarize","Query","Verify","Cite","Analyze","Research","Understand"];
function Marquee() {
  const r = [...WORDS,...WORDS,...WORDS,...WORDS];
  return (
    <div style={{ overflow:"hidden", display:"flex", gap:0 }}>
      <style>{`@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display:"flex", gap:0, animation:"mq 18s linear infinite", whiteSpace:"nowrap" }}>
        {r.map((w,i)=>(
          <span key={i} style={{ padding:"0 32px", fontSize:"clamp(48px,6vw,80px)", fontFamily:"'DM Serif Display',Georgia,serif", fontStyle: i%2===0?"italic":"normal", color: i%2===0?"rgba(255,255,255,0.07)":"rgba(200,184,255,0.12)", letterSpacing:"-0.03em", userSelect:"none" }}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── pulsing dot ────────────────────────────────────────────────── */
function Dot({ color="#a0f0c8" }: { color?: string }) {
  return (
    <span style={{ position:"relative", display:"inline-block", width:8, height:8, flexShrink:0 }}>
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}`}</style>
      <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:color, animation:"ping 1.6s ease-out infinite" }} />
      <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:color }} />
    </span>
  );
}

/* ── bento card wrapper ─────────────────────────────────────────── */
function Card({ children, style={}, delay=0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }} transition={{ delay, duration:0.65, ease:[0.22,1,0.36,1] }}
      whileHover={{ scale:1.012 }}
      style={{
        background:"rgba(255,255,255,0.03)",
        border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:20,
        padding:32,
        position:"relative",
        overflow:"hidden",
        transition:"border-color 0.25s",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [hovered, setHovered] = useState<number|null>(null);

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0c", color:"#fff", fontFamily:"Georgia,'Times New Roman',serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:rgba(200,184,255,0.25)}
        @keyframes gradPulse{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 48px", height:64, background:"rgba(10,10,12,0.8)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#c8b8ff,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Layers size={15} color="#0a0a0c" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:20, letterSpacing:"-0.02em" }}>Prism</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {[{label:"Dashboard",href:"/dashboard"},{label:"Workspace",href:"/workspace"},{label:"Ingest",href:"/ingest"}].map(({label,href})=>(
            <Link key={label} href={href} style={{ textDecoration:"none" }}>
              <motion.button whileHover={{ background:"rgba(255,255,255,0.07)" }}
                style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", borderRadius:9, padding:"7px 16px", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                {label}
              </motion.button>
            </Link>
          ))}
          <Link href="/ingest" style={{ textDecoration:"none" }}>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              style={{ background:"#c8b8ff", color:"#0a0a0c", border:"none", borderRadius:9, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
              Start <ArrowRight size={13} />
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* ── FULL-SCREEN HERO ─────────────────────────────────────── */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 48px 80px", position:"relative", overflow:"hidden" }}>

        {/* bg rings */}
        {[400,600,800].map((r,i)=>(
          <div key={r} style={{ position:"absolute", width:r, height:r, borderRadius:"50%", border:`1px solid rgba(200,184,255,${0.05-i*0.012})`, top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />
        ))}
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(200,184,255,0.1) 0%,transparent 70%)", pointerEvents:"none" }} />

        {/* badge */}
        <motion.div {...fadeUp(0.1)} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", background:"rgba(200,184,255,0.08)", border:"1px solid rgba(200,184,255,0.18)", borderRadius:30, marginBottom:32 }}>
          <Dot />
          <span style={{ fontSize:12, color:"#c8b8ff", fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase" }}>Research Intelligence Platform</span>
        </motion.div>

        {/* headline */}
        <motion.h1 {...fadeUp(0.2)} style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(52px,10vw,130px)", lineHeight:0.9, letterSpacing:"-0.045em", marginBottom:28, maxWidth:900 }}>
          Clarity,<br/>
          <em style={{ background:"linear-gradient(100deg,#c8b8ff 0%,#a5b4fc 40%,#c8b8ff 100%)", backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"gradPulse 3s ease infinite" }}>
            backed by sources.
          </em>
        </motion.h1>

        {/* sub */}
        <motion.p {...fadeUp(0.3)} style={{ fontSize:"clamp(15px,2vw,20px)", color:"rgba(255,255,255,0.38)", lineHeight:1.8, maxWidth:520, marginBottom:44 }}>
          Upload research papers, query your knowledge base, and receive verified answers — every claim traced to its exact source.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.4)} style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:64 }}>
          <Link href="/ingest" style={{ textDecoration:"none" }}>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              style={{ background:"#c8b8ff", color:"#0a0a0c", border:"none", borderRadius:14, padding:"16px 38px", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:9 }}>
              Start Research <ArrowRight size={17} />
            </motion.button>
          </Link>
          <Link href="/workspace" style={{ textDecoration:"none" }}>
            <motion.button whileHover={{ background:"rgba(255,255,255,0.06)" }}
              style={{ background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"16px 28px", fontSize:16, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}>
              Open Workspace <ArrowUpRight size={15} />
            </motion.button>
          </Link>
        </motion.div>

        {/* stat strip */}
        <motion.div {...fadeUp(0.5)} style={{ display:"flex", gap:0, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
          {[
            { val:100, suffix:"%", label:"Source cited" },
            { val:0,   suffix:"%", label:"Hallucination" },
            { val:128, suffix:"K", label:"Context window" },
            { val:4,   suffix:"x", label:"Faster research" },
          ].map(({val,suffix,label},i)=>(
            <div key={label} style={{ padding:"18px 36px", borderRight: i<3 ? "1px solid rgba(255,255,255,0.07)" : "none", textAlign:"center" }}>
              <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, color:"#fff", letterSpacing:"-0.03em" }}>
                <Counter to={val} suffix={suffix} />
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:4 }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── SCROLLING MARQUEE ────────────────────────────────────── */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"20px 0", overflow:"hidden" }}>
        <Marquee />
      </div>

      {/* ── BENTO GRID ───────────────────────────────────────────── */}
      <section style={{ padding:"100px 48px", maxWidth:1240, margin:"0 auto" }}>
        <motion.div initial={{ opacity:0,y:14 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }}
          style={{ marginBottom:56, display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
          <div>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.25)", marginBottom:12, fontWeight:600 }}>The System</div>
            <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(30px,5vw,56px)", letterSpacing:"-0.03em", lineHeight:1 }}>
              Everything you need<br/><em style={{ color:"rgba(255,255,255,0.3)" }}>to research smarter.</em>
            </h2>
          </div>
          <Link href="/ingest" style={{ textDecoration:"none" }}>
            <motion.button whileHover={{ scale:1.04 }}
              style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.55)", borderRadius:12, padding:"11px 22px", fontSize:14, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:7 }}>
              Explore all features <ArrowUpRight size={14} />
            </motion.button>
          </Link>
        </motion.div>

        {/* row 1 */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12, marginBottom:12 }}>

          {/* big ingest card */}
          <Card delay={0.05}>
            <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(200,184,255,0.08) 0%,transparent 70%)", pointerEvents:"none" }} />
            <div style={{ width:48, height:48, borderRadius:14, background:"rgba(200,184,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
              <FileText size={22} color="#c8b8ff" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.2)", marginBottom:10, fontWeight:600 }}>01 — Ingest</div>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(22px,3vw,34px)", letterSpacing:"-0.025em", marginBottom:14 }}>Drop anything.<br/>Prism handles it.</h3>
            <p style={{ fontSize:14.5, color:"rgba(255,255,255,0.38)", lineHeight:1.75, maxWidth:360 }}>PDFs, Word docs, URLs, raw text — Prism extracts, chunks, embeds and indexes every word into a searchable semantic knowledge base ready for querying.</p>
            <div style={{ marginTop:24, display:"flex", gap:8, flexWrap:"wrap" }}>
              {["PDF","DOCX","URL","Plain text"].map(tag=>(
                <span key={tag} style={{ padding:"5px 12px", background:"rgba(200,184,255,0.07)", border:"1px solid rgba(200,184,255,0.14)", borderRadius:20, fontSize:12, color:"rgba(200,184,255,0.7)", fontWeight:600 }}>{tag}</span>
              ))}
            </div>
          </Card>

          {/* summarize card */}
          <Card delay={0.1} style={{ display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
            <div>
              <div style={{ width:44, height:44, borderRadius:13, background:"rgba(255,214,165,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
                <Zap size={20} color="#ffd6a5" strokeWidth={1.8} />
              </div>
              <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.2)", marginBottom:10, fontWeight:600 }}>02 — Summarize</div>
              <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(20px,2.5vw,28px)", letterSpacing:"-0.02em", marginBottom:12 }}>Structured insight, instantly.</h3>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.36)", lineHeight:1.72 }}>TLDR, methodology, key concepts, results, limitations — generated in seconds.</p>
            </div>
            <div style={{ marginTop:24, padding:"14px 18px", background:"rgba(255,214,165,0.05)", border:"1px solid rgba(255,214,165,0.1)", borderRadius:12 }}>
              <div style={{ fontSize:11, color:"rgba(255,214,165,0.5)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>TLDR</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.65, fontStyle:"italic" }}>"Transformer architectures achieve state-of-the-art results by replacing recurrence with self-attention mechanisms..."</div>
            </div>
          </Card>
        </div>

        {/* row 2 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>

          {/* query */}
          <Card delay={0.15}>
            <div style={{ width:44, height:44, borderRadius:13, background:"rgba(160,240,200,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
              <Search size={20} color="#a0f0c8" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.2)", marginBottom:10, fontWeight:600 }}>03 — Query</div>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(18px,2vw,24px)", letterSpacing:"-0.02em", marginBottom:12 }}>Ask in plain English.</h3>
            <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.36)", lineHeight:1.72 }}>RAG-powered answers with inline citations. No hallucinations — every claim grounded in your documents.</p>
            <div style={{ marginTop:20, display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(160,240,200,0.05)", border:"1px solid rgba(160,240,200,0.1)", borderRadius:10 }}>
              <Dot color="#a0f0c8" />
              <span style={{ fontSize:12, color:"rgba(160,240,200,0.7)" }}>94% confidence · 3 sources</span>
            </div>
          </Card>

          {/* verify */}
          <Card delay={0.2}>
            <div style={{ width:44, height:44, borderRadius:13, background:"rgba(255,165,180,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
              <ShieldCheck size={20} color="#ffa5b4" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.2)", marginBottom:10, fontWeight:600 }}>04 — Verify</div>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(18px,2vw,24px)", letterSpacing:"-0.02em", marginBottom:12 }}>Trust, but verify.</h3>
            <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.36)", lineHeight:1.72 }}>Hallucination flags, retrieval transparency, confidence scores — every answer is auditable.</p>
            <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:6 }}>
              {["Source match","Confidence score","Chunk trace"].map(l=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <CheckCircle size={13} color="#ffa5b4" strokeWidth={2} />
                  <span style={{ fontSize:12.5, color:"rgba(255,255,255,0.38)" }}>{l}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* eval */}
          <Card delay={0.25}>
            <div style={{ width:44, height:44, borderRadius:13, background:"rgba(160,200,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
              <BarChart2 size={20} color="#a0c8ff" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.2)", marginBottom:10, fontWeight:600 }}>05 — Evaluate</div>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(18px,2vw,24px)", letterSpacing:"-0.02em", marginBottom:12 }}>Measure everything.</h3>
            <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.36)", lineHeight:1.72 }}>Live dashboard: queries run, avg confidence, latency, ingested docs — real data, not demos.</p>
            <div style={{ marginTop:20, display:"flex", gap:6 }}>
              {[78,91,65,88,94,72,96].map((h,i)=>(
                <div key={i} style={{ flex:1, height: h*0.5, background:`rgba(160,200,255,${0.15+i*0.07})`, borderRadius:4, alignSelf:"flex-end" }} />
              ))}
            </div>
          </Card>
        </div>

        {/* row 3 — wide citation card */}
        <Card delay={0.3} style={{ display:"flex", alignItems:"center", gap:48, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:260 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"rgba(200,184,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
              <BookOpen size={22} color="#c8b8ff" strokeWidth={1.8} />
            </div>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(22px,3vw,36px)", letterSpacing:"-0.025em", marginBottom:14 }}>Every answer, fully cited.</h3>
            <p style={{ fontSize:14.5, color:"rgba(255,255,255,0.38)", lineHeight:1.75, maxWidth:400 }}>Prism doesn't just answer — it shows you exactly which chunk of which document backs each claim, with similarity scores and page context.</p>
          </div>
          <div style={{ flex:1, minWidth:260, display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { src:"transformer_paper.pdf", score:96, text:"Self-attention allows the model to attend to all positions..." },
              { src:"survey_nlp_2024.pdf",   score:88, text:"Large language models demonstrate emergent capabilities..." },
              { src:"attention_mechanisms.pdf", score:81, text:"The key-query-value formulation enables parallelization..." },
            ].map((c,i)=>(
              <motion.div key={i}
                initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }}
                viewport={{ once:true }} transition={{ delay: 0.3 + i*0.1 }}
                style={{ padding:"12px 16px", background:"rgba(200,184,255,0.04)", border:"1px solid rgba(200,184,255,0.1)", borderRadius:12, display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#c8b8ff", minWidth:32 }}>{c.score}%</div>
                <div>
                  <div style={{ fontSize:11, color:"rgba(200,184,255,0.5)", marginBottom:4, fontFamily:"Georgia,monospace" }}>{c.src}</div>
                  <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.45)", lineHeight:1.6, fontStyle:"italic" }}>"{c.text}"</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{ padding:"80px 48px 120px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 40%,rgba(200,184,255,0.07) 0%,transparent 65%)", pointerEvents:"none" }} />
        {[300,500].map(r=>(
          <div key={r} style={{ position:"absolute", width:r, height:r, borderRadius:"50%", border:"1px solid rgba(200,184,255,0.05)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />
        ))}
        <motion.div initial={{ opacity:0, scale:0.93 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", background:"rgba(200,184,255,0.08)", border:"1px solid rgba(200,184,255,0.15)", borderRadius:30, marginBottom:28 }}>
            <Dot />
            <span style={{ fontSize:12, color:"#c8b8ff", fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase" }}>Ready when you are</span>
          </div>
          <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(40px,7vw,80px)", letterSpacing:"-0.04em", lineHeight:0.95, marginBottom:20 }}>
            Research shouldn't<br/>
            <em style={{ color:"rgba(255,255,255,0.28)" }}>be a guessing game.</em>
          </h2>
          <p style={{ fontSize:17, color:"rgba(255,255,255,0.3)", marginBottom:40 }}>Build your research intelligence system today.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/ingest" style={{ textDecoration:"none" }}>
              <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                style={{ background:"#c8b8ff", color:"#0a0a0c", border:"none", borderRadius:14, padding:"16px 40px", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:9 }}>
                Start Research <ArrowRight size={17} />
              </motion.button>
            </Link>
            <Link href="/dashboard" style={{ textDecoration:"none" }}>
              <motion.button whileHover={{ background:"rgba(255,255,255,0.06)" }}
                style={{ background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"16px 28px", fontSize:16, cursor:"pointer", fontFamily:"inherit" }}>
                Dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"24px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:8, background:"linear-gradient(135deg,#c8b8ff,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Layers size={13} color="#0a0a0c" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:17, color:"rgba(255,255,255,0.35)" }}>Prism</span>
        </div>
        <div style={{ display:"flex", gap:24 }}>
          {[["Dashboard","/dashboard"],["Workspace","/workspace"],["Ingest","/ingest"],["Evaluate","/evaluation"]].map(([label,href])=>(
            <Link key={label} href={href} style={{ textDecoration:"none", fontSize:13, color:"rgba(255,255,255,0.22)" }}>{label}</Link>
          ))}
        </div>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.15)" }}>Research Intelligence Platform</span>
      </footer>
    </div>
  );
}