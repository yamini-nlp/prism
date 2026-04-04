"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { S, C } from "@/lib/styles";
import { Upload, FileText, Link as LinkIcon, Type, CheckCircle, ArrowRight, Loader2, X, AlertCircle } from "lucide-react";

type Mode  = "file" | "url" | "text";
type Stage = "idle" | "uploading" | "extracting" | "chunking" | "embedding" | "done" | "error";
const STAGES: Stage[] = ["uploading","extracting","chunking","embedding","done"];
const STAGE_LABELS = ["Uploading source","Extracting content","Chunking text","Generating embeddings","Complete"];
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function IngestPage() {
  const [mode,     setMode]     = useState<Mode>("file");
  const [stage,    setStage]    = useState<Stage>("idle");
  const [url,      setUrl]      = useState("");
  const [text,     setText]     = useState("");
  const [file,     setFile]     = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [summary,  setSummary]  = useState<any>(null);
  const [errMsg,   setErrMsg]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const stageIdx   = STAGES.indexOf(stage);
  const isRunning  = stage !== "idle" && stage !== "done" && stage !== "error";

  const runIngest = useCallback(async () => {
    setStage("uploading"); setSummary(null); setErrMsg("");
    try {
      let res: Response;
      if (mode === "file" && file) {
        const fd = new FormData(); fd.append("file", file);
        setStage("extracting");
        res = await fetch(`${API}/upload/`, { method: "POST", body: fd });
      } else if (mode === "url" && url.trim()) {
        setStage("extracting");
        res = await fetch(`${API}/ingest/url`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: url.trim() }) });
      } else if (mode === "text" && text.trim()) {
        setStage("extracting");
        res = await fetch(`${API}/ingest/text`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: text.trim(), source: "Manual Input" }) });
      } else {
        setErrMsg("Please provide a file, URL, or text first."); setStage("error"); return;
      }
      if (!res!.ok) { const e = await res!.json().catch(()=>({})); throw new Error(e.detail || `Error ${res!.status}`); }
      const data = await res!.json();
      setStage("chunking"); await new Promise(r=>setTimeout(r,400));
      setStage("embedding"); await new Promise(r=>setTimeout(r,500));
      setStage("done");
      const srcText = data.preview || (mode === "text" ? text.trim() : "");
      const srcName = data.source || "Document";
      if (srcText) {
        const sr = await fetch(`${API}/summary/`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: srcText, source: srcName }) });
        if (sr.ok) { const sd = await sr.json(); setSummary(sd.summary); }
      }
    } catch(e:any) { setErrMsg(e.message || "Failed. Is the backend running on port 8000?"); setStage("error"); }
  }, [mode, file, url, text]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  }, []);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background: C.bg }}>
      <Sidebar />
      <main style={{ flex:1, padding:"38px 46px", overflowY:"auto" }}>
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>

          <span style={{ ...S.tagIndigo, marginBottom:12 }}>Ingest</span>
          <h1 style={{ ...S.heading, fontSize:38, marginTop:10, marginBottom:6 }}>Add a source</h1>
          <p style={{ color: C.textSec, fontSize:15, marginBottom:30 }}>Upload a document, paste a URL, or add raw text to begin.</p>

          {/* Mode tabs */}
          <div style={{ display:"flex", gap:8, marginBottom:26 }}>
            {(["file","url","text"] as Mode[]).map(m => (
              <button key={m} onClick={()=>setMode(m)} style={{
                padding:"9px 19px", borderRadius:10,
                border: `1.5px solid ${mode===m ? "#111110" : "rgba(0,0,0,0.15)"}`,
                background: mode===m ? "#111110" : "#ffffff",
                color: mode===m ? "#ffffff" : C.textSec,
                fontSize:13, fontWeight:600, fontFamily:"inherit",
                cursor:"pointer", display:"flex", alignItems:"center", gap:7,
                transition:"all 0.18s",
              }}>
                {m==="file" && <FileText size={13}/>}
                {m==="url"  && <LinkIcon size={13}/>}
                {m==="text" && <Type size={13}/>}
                {m==="file" ? "Upload File" : m==="url" ? "From URL" : "Raw Text"}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 290px", gap:22, alignItems:"start" }}>

            {/* Left — input area */}
            <div>
              <AnimatePresence mode="wait">

                {mode==="file" && (
                  <motion.div key="file" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                    <div
                      onDragOver={e=>{e.preventDefault();setDragging(true);}}
                      onDragLeave={()=>setDragging(false)}
                      onDrop={onDrop}
                      onClick={()=>fileRef.current?.click()}
                      style={{
                        border:`2px dashed ${dragging?"#5b5ef4":"rgba(0,0,0,0.18)"}`,
                        borderRadius:14, padding:"50px 32px", textAlign:"center",
                        cursor:"pointer",
                        background: dragging ? "rgba(91,94,244,0.04)" : "#ffffff",
                        transition:"all 0.2s",
                      }}
                    >
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt"
                        style={{display:"none"}}
                        onChange={e=>e.target.files?.[0] && setFile(e.target.files[0])} />
                      <Upload size={30} color="#9a9590" style={{margin:"0 auto 12px"}} />
                      <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:5}}>
                        {file ? file.name : "Drop your file here, or click to browse"}
                      </div>
                      <div style={{fontSize:12.5,color:C.textMuted}}>Supports PDF, DOC, DOCX, TXT · Max 50 MB</div>
                    </div>
                    {file && (
                      <div style={{
                        marginTop:10, padding:"11px 14px", borderRadius:10,
                        background:"rgba(91,94,244,0.07)", border:"1px solid rgba(91,94,244,0.18)",
                        display:"flex", alignItems:"center", gap:9,
                      }}>
                        <FileText size={15} color="#5b5ef4"/>
                        <span style={{flex:1,fontSize:13,fontWeight:600,color:C.text}}>{file.name}</span>
                        <button onClick={()=>setFile(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,display:"flex"}}>
                          <X size={14}/>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {mode==="url" && (
                  <motion.div key="url" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                    <label style={{display:"block",fontSize:13,fontWeight:600,color:C.textSec,marginBottom:8}}>Research Paper URL</label>
                    <input style={S.input} type="url"
                      placeholder="https://arxiv.org/abs/..."
                      value={url} onChange={e=>setUrl(e.target.value)}
                      onFocus={e=>{(e.target as HTMLInputElement).style.borderColor="#5b5ef4";}}
                      onBlur={e=>{(e.target as HTMLInputElement).style.borderColor="rgba(0,0,0,0.15)";}}
                    />
                    <div style={{fontSize:12,color:C.textMuted,marginTop:7}}>Supports arXiv, PubMed, ACL Anthology, and most research sites.</div>
                  </motion.div>
                )}

                {mode==="text" && (
                  <motion.div key="text" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                    <label style={{display:"block",fontSize:13,fontWeight:600,color:C.textSec,marginBottom:8}}>Paste your text</label>
                    <textarea style={{ ...S.textarea, minHeight:240 }}
                      placeholder="Paste abstract, excerpts, or full paper text…"
                      value={text} onChange={e=>setText(e.target.value)}
                      onFocus={e=>{(e.target as HTMLTextAreaElement).style.borderColor="#5b5ef4";}}
                      onBlur={e=>{(e.target as HTMLTextAreaElement).style.borderColor="rgba(0,0,0,0.15)";}}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {stage==="error" && (
                <div style={{
                  marginTop:14,padding:"12px 16px",borderRadius:10,
                  background:"rgba(220,38,38,0.07)",border:"1px solid rgba(220,38,38,0.2)",
                  display:"flex",alignItems:"center",gap:9,
                }}>
                  <AlertCircle size={16} color={C.red}/> <span style={{fontSize:13,color:C.red}}>{errMsg}</span>
                </div>
              )}

              {/* CTA button */}
              <div style={{marginTop:20}}>
                <motion.button
                  whileHover={{ scale: isRunning ? 1 : 1.02 }}
                  whileTap={{ scale: isRunning ? 1 : 0.97 }}
                  onClick={runIngest}
                  disabled={isRunning}
                  style={isRunning ? S.btnPrimaryDisabled : S.btnPrimary}
                >
                  {isRunning
                    ? <><Loader2 size={15} className="spin"/> Processing…</>
                    : <>Start Ingestion <ArrowRight size={15}/></>
                  }
                </motion.button>
              </div>
            </div>

            {/* Right — pipeline */}
            <div style={{ ...S.card, padding:22 }}>
              {(stage==="idle"||stage==="error") ? (
                <div style={{textAlign:"center",padding:"18px 0"}}>
                  <div style={{width:44,height:44,borderRadius:12,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                    <Upload size={20} color={C.textMuted}/>
                  </div>
                  <div style={{fontSize:13.5,color:C.textSec,fontWeight:500}}>Processing pipeline</div>
                  <div style={{fontSize:12,color:C.textMuted,marginTop:5}}>Appears after you click Ingest</div>
                </div>
              ) : (
                <div>
                  <div style={{...S.label,marginBottom:16}}>Processing Pipeline</div>
                  {STAGES.map((s,i) => {
                    const done   = stageIdx > i || stage==="done";
                    const active = stageIdx===i && stage!=="done";
                    return (
                      <motion.div key={s}
                        initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                        style={{display:"flex",alignItems:"center",gap:10,marginBottom:13}}
                      >
                        <div style={{
                          width:26,height:26,borderRadius:"50%",flexShrink:0,
                          background: done ? C.green : active ? C.accent : "rgba(0,0,0,0.07)",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          transition:"background 0.3s",
                        }}>
                          {done   ? <CheckCircle size={14} color="#fff"/>
                           : active ? <Loader2 size={13} color="#fff" className="spin"/>
                           : <span style={{fontSize:10,color:C.textMuted,fontWeight:700}}>{i+1}</span>}
                        </div>
                        <span style={{
                          fontSize:13, fontWeight: done||active ? 600 : 400,
                          color: done ? C.green : active ? C.accent : C.textMuted,
                          transition:"color 0.25s",
                        }}>
                          {STAGE_LABELS[i]}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <AnimatePresence>
            {summary && stage==="done" && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}} style={{marginTop:34}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <CheckCircle size={18} color={C.green}/>
                  <h2 style={{...S.heading,fontSize:24}}>Summary Preview</h2>
                </div>
                <div style={{...S.card,padding:28}}>
                  <div style={{marginBottom:18}}>
                    <span style={{...S.tagIndigo,marginBottom:10}}>TLDR</span>
                    <p style={{fontFamily:"'DM Serif Display',Georgia,serif",fontStyle:"italic",fontSize:16,color:C.text,lineHeight:1.65,marginTop:8}}>
                      {summary.tldr}
                    </p>
                  </div>
                  <div style={{height:1,background:C.border,marginBottom:18}}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
                    <div>
                      <div style={{...S.label,marginBottom:9}}>Key Concepts</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {(summary.key_concepts||[]).map((c:string)=>(
                          <span key={c} style={S.tagIndigo}>{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{...S.label,marginBottom:9}}>Methodology</div>
                      <p style={{fontSize:13,color:C.textSec,lineHeight:1.65}}>{summary.methodology}</p>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                    <div>
                      <div style={{...S.label,marginBottom:9}}>Results</div>
                      <p style={{fontSize:13,color:C.textSec,lineHeight:1.65}}>{summary.results}</p>
                    </div>
                    <div>
                      <div style={{...S.label,marginBottom:9}}>Limitations</div>
                      <p style={{fontSize:13,color:C.textSec,lineHeight:1.65}}>{summary.limitations}</p>
                    </div>
                  </div>
                </div>
                <div style={{marginTop:16,display:"flex",gap:12}}>
                  <Link href="/workspace" style={{textDecoration:"none"}}>
                    <button style={S.btnPrimary}>Query Now <ArrowRight size={14}/></button>
                  </Link>
                  <Link href="/library" style={{textDecoration:"none"}}>
                    <button style={S.btnSecondary}>View Library</button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </main>
    </div>
  );
}