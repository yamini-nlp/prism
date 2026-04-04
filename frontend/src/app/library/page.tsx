"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { S, C } from "@/lib/styles";
import { FileText, Search, Plus, ArrowRight, BookOpen, Calendar } from "lucide-react";

const DOCS = [
  { id:1, title:"Attention Is All You Need",                   authors:"Vaswani et al.", year:2017, library:"NLP Research 2024",       tldr:"Introduces the Transformer architecture based solely on attention mechanisms, dispensing recurrence and convolutions entirely.", concepts:["Transformer","Self-Attention","Multi-Head Attention"], color:"#5b5ef4", pages:15 },
  { id:2, title:"BERT: Pre-training of Deep Bidirectional Transformers", authors:"Devlin et al.", year:2018, library:"NLP Research 2024", tldr:"Proposes a bidirectional transformer pre-training approach that achieves SOTA on 11 NLP tasks.", concepts:["Pre-training","Bidirectional","Fine-tuning"], color:"#3b82f6", pages:16 },
  { id:3, title:"An Image is Worth 16x16 Words",               authors:"Dosovitskiy et al.", year:2020, library:"Computer Vision Papers", tldr:"Applies transformer architecture directly to image patches for classification at scale.", concepts:["ViT","Image Patches","Vision Transformer"], color:"#d4622a", pages:21 },
  { id:4, title:"Proximal Policy Optimization Algorithms",      authors:"Schulman et al.", year:2017, library:"Reinforcement Learning",  tldr:"Presents PPO, a family of policy gradient methods for RL that balances simplicity and performance.", concepts:["PPO","Policy Gradient","Clipping"], color:"#3d9970", pages:12 },
  { id:5, title:"GPT-4 Technical Report",                      authors:"OpenAI", year:2023, library:"NLP Research 2024",                tldr:"Describes GPT-4, a large-scale multimodal model capable of processing image and text inputs.", concepts:["LLM","Multimodal","RLHF"], color:"#5b5ef4", pages:98 },
  { id:6, title:"Denoising Diffusion Probabilistic Models",    authors:"Ho et al.", year:2020, library:"Computer Vision Papers",        tldr:"Introduces DDPM, connecting diffusion models with denoising score matching for high-quality image generation.", concepts:["Diffusion","Score Matching","Generative Models"], color:"#3b82f6", pages:24 },
];

const LIBRARIES = ["All", "NLP Research 2024", "Computer Vision Papers", "Reinforcement Learning"];

export default function LibraryPage() {
  const [search,    setSearch]    = useState("");
  const [activeLib, setActiveLib] = useState("All");

  const filtered = DOCS.filter(d => {
    const matchLib    = activeLib === "All" || d.library === activeLib;
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.authors.toLowerCase().includes(search.toLowerCase());
    return matchLib && matchSearch;
  });

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <Sidebar />
      <main style={{ flex:1, padding:"38px 46px", overflowY:"auto" }}>
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>

          {/* Header row */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:16 }}>
            <div>
              <span style={{ ...S.tagIndigo, marginBottom:10 }}>Library</span>
              <h1 style={{ ...S.heading, fontSize:38, marginTop:10, marginBottom:6 }}>Your Research Library</h1>
              <p style={{ fontSize:14, color:C.textSec }}>
                {DOCS.length} documents across {LIBRARIES.length - 1} collections
              </p>
            </div>
            <Link href="/ingest" style={{ textDecoration:"none", marginTop:4 }}>
              <button style={S.btnPrimary}>
                <Plus size={14} /> Add Document
              </button>
            </Link>
          </div>

          {/* Search + filter row — horizontal, clean */}
          <div style={{ display:"flex", gap:12, marginBottom:28, alignItems:"center", flexWrap:"wrap" }}>
            {/* Search */}
            <div style={{ position:"relative", width:280 }}>
              <Search size={14} color={C.textMuted} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
              <input
                style={{ ...S.input, paddingLeft:36, height:40 }}
                placeholder="Search by title or author…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#5b5ef4"; }}
                onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.15)"; }}
              />
            </div>

            {/* Vertical separator */}
            <div style={{ width:1, height:32, background:"rgba(0,0,0,0.1)" }} />

            {/* Filter pills */}
            <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
              {LIBRARIES.map(lib => (
                <button key={lib} onClick={() => setActiveLib(lib)} style={{
                  padding:"7px 15px", borderRadius:99,
                  border:`1.5px solid ${activeLib===lib ? "#111110" : "rgba(0,0,0,0.13)"}`,
                  background: activeLib===lib ? "#111110" : "#ffffff",
                  color: activeLib===lib ? "#fff" : C.textSec,
                  fontSize:12, fontWeight:600, fontFamily:"inherit",
                  cursor:"pointer", transition:"all 0.16s", whiteSpace:"nowrap",
                }}>
                  {lib}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(330px,1fr))", gap:18 }}>
            {filtered.map((doc, i) => (
              <motion.div key={doc.id}
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.06, duration:0.38 }}
                style={{
                  ...S.card, padding:24,
                  display:"flex", flexDirection:"column", gap:14,
                  transition:"box-shadow 0.2s, transform 0.2s",
                  cursor:"default",
                }}
                whileHover={{ y:-2, boxShadow:"0 8px 28px rgba(0,0,0,0.10)" }}
              >
                {/* Top */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:13 }}>
                  <div style={{
                    width:40, height:40, borderRadius:11,
                    background: doc.color + "14",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>
                    <FileText size={17} color={doc.color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14.5, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:3 }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize:12, color:C.textMuted }}>
                      {doc.authors} · {doc.year}
                    </div>
                  </div>
                </div>

                {/* TLDR */}
                <p style={{ fontSize:13, color:C.textSec, lineHeight:1.6 }}>{doc.tldr}</p>

                {/* Concepts */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {doc.concepts.map(c => (
                    <span key={c} style={{ ...S.tagIndigo, fontSize:10 }}>{c}</span>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height:1, background:C.border }} />

                {/* Footer */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", gap:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <BookOpen size={12} color={C.textMuted} />
                      <span style={{ fontSize:11, color:C.textMuted }}>{doc.pages}p</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <Calendar size={12} color={C.textMuted} />
                      <span style={{ fontSize:11, color:C.textMuted }}>{doc.library}</span>
                    </div>
                  </div>
                  <Link href="/workspace" style={{ textDecoration:"none" }}>
                    <button style={{
                      display:"flex", alignItems:"center", gap:5,
                      fontSize:12, fontWeight:600, color:doc.color,
                      background: doc.color + "12",
                      border:"none", borderRadius:8, padding:"6px 12px",
                      cursor:"pointer", fontFamily:"inherit",
                    }}>
                      Query <ArrowRight size={11} />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"70px 0", color:C.textMuted }}>
              <Search size={30} style={{ margin:"0 auto 14px", display:"block" }} />
              <div style={{ fontSize:15, fontWeight:600, marginBottom:5 }}>No documents found</div>
              <div style={{ fontSize:13 }}>Try adjusting your search or filter</div>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}