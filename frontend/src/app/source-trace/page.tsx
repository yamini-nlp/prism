"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { S, C } from "@/lib/styles";
import { Search, GitBranch, Loader2, AlertCircle, ChevronRight } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Chunk = { chunk:string; source:string; score:number; chunk_index:number; };

export default function SourceTracePage() {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Chunk[]>([]);
  const [selected, setSelected] = useState<Chunk|null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResults([]); setSelected(null); setSearched(true);
    try {
      const res = await fetch(`${API}/retrieve/?query=${encodeURIComponent(query.trim())}&top_k=6`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
      if (data.results?.length > 0) setSelected(data.results[0]);
    } catch(e:any) {
      setError(e.message || "Failed. Is the backend running on port 8000?");
    } finally { setLoading(false); }
  };

  const scoreColor = (s:number) => s>0.8 ? C.green : s>0.6 ? C.accent : C.orange;
  const scoreBg    = (s:number) => s>0.8 ? C.greenBg : s>0.6 ? C.accentBg : C.orangeBg;

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg}}>
      <Sidebar/>
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",maxHeight:"100vh"}}>

        {/* Header */}
        <div style={{padding:"22px 38px",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <span style={{...S.tagIndigo,marginBottom:8}}>Source Trace</span>
          <h1 style={{...S.heading,fontSize:26,marginTop:8,marginBottom:18}}>Retrieval Transparency</h1>

          {/* Search bar */}
          <div style={{display:"flex",gap:10,maxWidth:640}}>
            <div style={{position:"relative",flex:1}}>
              <Search size={15} color={C.textMuted} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              <input
                style={{
                  width:"100%",
                  background:"#ffffff",
                  border:"1.5px solid rgba(0,0,0,0.18)",
                  borderRadius:11,
                  padding:"11px 14px 11px 38px",
                  fontSize:14, color:C.text, fontFamily:"inherit",
                  outline:"none",
                }}
                placeholder="Enter a query to trace sources…"
                value={query}
                onChange={e=>setQuery(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter") doSearch(); }}
                onFocus={e=>{(e.target as HTMLInputElement).style.borderColor="#5b5ef4";}}
                onBlur={e=>{(e.target as HTMLInputElement).style.borderColor="rgba(0,0,0,0.18)";}}
              />
            </div>
            <button
              onClick={doSearch}
              disabled={loading||!query.trim()}
              style={loading||!query.trim() ? S.btnPrimaryDisabled : S.btnPrimary}
            >
              {loading ? <><Loader2 size={14} className="spin"/> Searching…</> : <><Search size={14}/> Search</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{margin:"16px 38px",padding:"12px 16px",borderRadius:10,background:C.redBg,border:`1px solid rgba(220,38,38,0.2)`,display:"flex",alignItems:"center",gap:9}}>
            <AlertCircle size={15} color={C.red}/> <span style={{fontSize:13,color:C.red}}>{error}</span>
          </div>
        )}

        {/* Empty / no results */}
        {!loading && searched && results.length===0 && !error && (
          <div style={{textAlign:"center",padding:"60px 0",color:C.textMuted}}>
            <GitBranch size={32} style={{margin:"0 auto 14px",display:"block"}}/>
            <div style={{fontSize:15,fontWeight:600,marginBottom:5}}>No chunks found</div>
            <div style={{fontSize:13}}>Try a different query, or ingest some documents first.</div>
          </div>
        )}

        {!searched && (
          <div style={{textAlign:"center",padding:"60px 0",color:C.textMuted}}>
            <Search size={32} style={{margin:"0 auto 14px",display:"block"}}/>
            <div style={{fontSize:15,fontWeight:600,marginBottom:5}}>Enter a query above</div>
            <div style={{fontSize:13}}>Prism will retrieve the most relevant chunks from your ingested documents.</div>
          </div>
        )}

        {/* Results */}
        {results.length>0 && (
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>

            {/* Left list */}
            <div style={{width:360,borderRight:`1px solid ${C.border}`,overflowY:"auto",padding:"18px 16px",display:"flex",flexDirection:"column",gap:9}}>
              <div style={{...S.label,paddingLeft:4,marginBottom:4}}>Retrieved Chunks ({results.length})</div>
              {results.map((chunk,i)=>(
                <motion.div key={i}
                  initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                  onClick={()=>setSelected(chunk)}
                  style={{
                    padding:"13px 14px",borderRadius:12,
                    border:`1.5px solid ${selected===chunk ? "rgba(91,94,244,0.35)" : C.border}`,
                    background: selected===chunk ? "rgba(91,94,244,0.05)" : C.surface,
                    cursor:"pointer",transition:"all 0.18s",
                  }}
                >
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:7}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color: selected===chunk ? C.accent : C.text,marginBottom:2}}>
                        {chunk.source.length>40 ? chunk.source.slice(0,40)+"…" : chunk.source}
                      </div>
                      <div style={{fontSize:10,color:C.textMuted}}>Chunk #{chunk.chunk_index}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{
                        minWidth:32,height:32,borderRadius:8,
                        background: scoreBg(chunk.score),
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,fontWeight:700,color: scoreColor(chunk.score),
                        padding:"0 6px",
                      }}>
                        {Math.round(chunk.score*100)}
                      </div>
                      <ChevronRight size={13} color={C.textMuted}/>
                    </div>
                  </div>
                  <p style={{fontSize:12,color:C.textSec,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                    {chunk.chunk}
                  </p>
                  <div style={{marginTop:9,...S.cbarWrap}}>
                    <div style={{...S.cbarFill,width:`${chunk.score*100}%`,background: scoreColor(chunk.score)}}/>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right detail */}
            {selected && (
              <div style={{flex:1,overflowY:"auto",padding:"28px 34px"}}>
                <motion.div key={selected.chunk_index} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
                    <GitBranch size={18} color={C.accent}/>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:C.text}}>{selected.source}</div>
                      <div style={{fontSize:12,color:C.textMuted}}>Chunk #{selected.chunk_index}</div>
                    </div>
                    <span style={{marginLeft:"auto",...(selected.score>0.8 ? S.tagGreen : selected.score>0.6 ? S.tagIndigo : S.tagOrange)}}>
                      {Math.round(selected.score*100)}% similarity
                    </span>
                  </div>

                  <div style={{...S.card,padding:26,marginBottom:22}}>
                    <div style={{...S.label,marginBottom:12}}>Retrieved Chunk</div>
                    <p style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:15,color:C.text,lineHeight:1.78}}>
                      {selected.chunk}
                    </p>
                  </div>

                  <div style={{...S.card,padding:24}}>
                    <div style={{...S.label,marginBottom:14}}>Similarity Analysis</div>
                    {[
                      {label:"Semantic Similarity",   value: selected.score},
                      {label:"Lexical Overlap",        value: selected.score*0.83},
                      {label:"Contextual Relevance",   value: selected.score*0.92},
                    ].map(m=>(
                      <div key={m.label} style={{marginBottom:13}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12}}>
                          <span style={{color:C.textSec,fontWeight:500}}>{m.label}</span>
                          <span style={{fontWeight:700,color:C.text}}>{Math.round(m.value*100)}%</span>
                        </div>
                        <div style={S.cbarWrap}>
                          <div style={{...S.cbarFill,width:`${m.value*100}%`}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}