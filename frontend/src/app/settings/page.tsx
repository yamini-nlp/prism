"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { S, C } from "@/lib/styles";
import { Cpu, Database, Sliders, CheckCircle, Save, Info } from "lucide-react";

const STORAGE_KEY = "prism_settings";

const MODELS = [
  { id:"llama-3.3-70b-versatile",   name:"LLaMA 3 70B",  desc:"Most capable. Best for complex reasoning.",     speed:"~1.4s avg" },
  { id:"llama-3.1-8b-instant",    name:"LLaMA 3 8B",   desc:"Faster. Good for simple factual queries.",      speed:"~0.6s avg" },
  { id:"llama3-8b-8192", name:"Mixtral 8×7B", desc:"Large context window. Good for long documents.",speed:"~1.1s avg" },
];

function loadSettings() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}

export default function SettingsPage() {
  const saved = typeof window !== "undefined" ? loadSettings() : null;

  const [model,        setModel]        = useState(saved?.model        || "llama-3.3-70b-versatile");
  const [topK,         setTopK]         = useState(saved?.topK         || 5);
  const [chunkSize,    setChunkSize]    = useState(saved?.chunkSize    || 512);
  const [chunkOverlap, setChunkOverlap] = useState(saved?.chunkOverlap || 64);
  const [temperature,  setTemperature]  = useState(saved?.temperature  || 0.1);
  const [vectorStore,  setVectorStore]  = useState(saved?.vectorStore  || "FAISS");
  const [savedOk,      setSavedOk]      = useState(false);

  const save = () => {
    const config = { model, topK, chunkSize, chunkOverlap, temperature, vectorStore };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2800);
  };

  const Slider = ({
    label, desc, value, min, max, step, onChange, fmt,
  }: {
    label: string; desc: string; value: number; min: number; max: number;
    step: number; onChange: (v: number) => void; fmt?: (v: number) => string;
  }) => (
    <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{desc}</div>
        </div>
        <div style={{
          minWidth: 56, padding: "4px 10px", borderRadius: 8,
          background: C.accentBg, border: `1px solid rgba(91,94,244,0.18)`,
          fontSize: 13, fontWeight: 700, color: C.accent,
          fontFamily: "'JetBrains Mono', monospace", textAlign: "center",
        }}>
          {fmt ? fmt(value) : value}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", marginTop: 10, accentColor: C.accent, cursor: "pointer", height: 4 }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>{fmt ? fmt(min) : min}</span>
        <span style={{ fontSize: 10, color: C.textMuted }}>{fmt ? fmt(max) : max}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          <span style={{ ...S.tagIndigo, marginBottom: 12 }}>Settings</span>
          <h1 style={{ ...S.heading, fontSize: 38, marginTop: 10, marginBottom: 6 }}>Configuration</h1>
          <p style={{ color: C.textSec, fontSize: 15, marginBottom: 16 }}>
            Tune model selection, retrieval parameters, and chunking strategy.
          </p>

          {/* Info note */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 9,
            padding: "11px 15px", borderRadius: 10,
            background: "rgba(91,94,244,0.06)", border: "1px solid rgba(91,94,244,0.14)",
            marginBottom: 28,
          }}>
            <Info size={15} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.55 }}>
              Settings are saved to your browser and applied to all subsequent Workspace queries. The model selection and top-K are passed directly to the backend API on each request.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>

            {/* Left col */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Model selection */}
              <div style={{ ...S.card, padding: 26 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
                  <Cpu size={17} color={C.accent} />
                  <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 19, color: C.text }}>
                    Model Selection
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {MODELS.map(m => {
                    const active = model === m.id;
                    return (
                      <div key={m.id} onClick={() => setModel(m.id)} style={{
                        padding: "13px 15px", borderRadius: 11, cursor: "pointer",
                        border: `1.5px solid ${active ? C.accent : C.border}`,
                        background: active ? C.accentBg : C.bg,
                        display: "flex", alignItems: "center", gap: 12,
                        transition: "all 0.18s",
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                          border: `2px solid ${active ? C.accent : C.borderMid}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 2 }}>{m.name}</div>
                          <div style={{ fontSize: 11.5, color: C.textMuted }}>{m.desc}</div>
                        </div>
                        <div style={{
                          fontSize: 10.5, fontWeight: 600,
                          color: active ? C.accent : C.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                          whiteSpace: "nowrap",
                        }}>
                          {m.speed}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vector store */}
              <div style={{ ...S.card, padding: 26 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
                  <Database size={17} color="#3b82f6" />
                  <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 19, color: C.text }}>
                    Vector Store
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["FAISS", "ChromaDB"].map(vs => {
                    const active = vectorStore === vs;
                    return (
                      <button key={vs} onClick={() => setVectorStore(vs)} style={{
                        flex: 1, padding: "13px 0", borderRadius: 10, textAlign: "center",
                        border: `1.5px solid ${active ? C.accent : C.border}`,
                        background: active ? C.accentBg : C.bg,
                        fontSize: 13, fontWeight: active ? 700 : 500,
                        color: active ? C.accent : C.textSec,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.18s",
                      }}>
                        {vs}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 10, lineHeight: 1.5 }}>
                  FAISS is recommended for local use. ChromaDB supports persistence and metadata filtering.
                </div>
              </div>
            </div>

            {/* Right col — sliders + save */}
            <div style={{ ...S.card, padding: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22 }}>
                <Sliders size={17} color={C.orange} />
                <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 19, color: C.text }}>
                  Retrieval Parameters
                </div>
              </div>

              <Slider label="Top-K Chunks"   desc="Number of chunks retrieved per query"          value={topK}         min={1}   max={20}   step={1}   onChange={setTopK} />
              <Slider label="Chunk Size"      desc="Tokens per document chunk"                     value={chunkSize}    min={128} max={2048} step={64}  onChange={setChunkSize}    fmt={v=>`${v}t`} />
              <Slider label="Chunk Overlap"   desc="Token overlap between adjacent chunks"          value={chunkOverlap} min={0}   max={256}  step={16}  onChange={setChunkOverlap} fmt={v=>`${v}t`} />
              <Slider label="Temperature"     desc="LLM generation randomness (0 = deterministic)" value={temperature}  min={0}   max={1}    step={0.05} onChange={setTemperature}  fmt={v=>v.toFixed(2)} />

              {/* Save button — fully explicit styling */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={save}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 0",
                  background: savedOk ? C.green : C.black,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 11,
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
              >
                {savedOk
                  ? <><CheckCircle size={16} /> Saved successfully!</>
                  : <><Save size={15} /> Save Configuration</>
                }
              </motion.button>

              <AnimatePresence>
                {savedOk && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: C.greenBg, border: `1px solid rgba(61,153,112,0.2)` }}
                  >
                    <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 3 }}>
                      Configuration saved to browser storage
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec }}>
                      Model: <strong>{MODELS.find(m => m.id === model)?.name}</strong> ·
                      Top-K: <strong>{topK}</strong> ·
                      Temp: <strong>{temperature.toFixed(2)}</strong>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}