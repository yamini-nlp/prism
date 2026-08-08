"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S, C } from "@/lib/styles";
import Skeleton from "@/components/ui/Skeleton";
import { useDocuments } from "@/lib/queries/documents";
import { libraryFilterSchema, type LibraryFilterFormValues } from "@/lib/validation/schemas";
import { FileText, Search, Plus, ArrowRight, BookOpen, Calendar, AlertTriangle, RotateCcw } from "lucide-react";

const PALETTE = ["#5b5ef4", "#3b82f6", "#d4622a", "#3d9970"];

function sourceLabel(sourceType: string) {
  if (sourceType === "pdf") return "PDF";
  if (sourceType === "url") return "URL";
  if (sourceType === "text") return "Text";
  return sourceType.charAt(0).toUpperCase() + sourceType.slice(1);
}

export default function LibraryPage() {
  const { data: documents, isLoading, isError, error, refetch, isRefetching } = useDocuments();

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LibraryFilterFormValues>({
    resolver: zodResolver(libraryFilterSchema),
    mode: "onChange",
    defaultValues: { search: "", library: "All" },
  });

  const search = watch("search") || "";
  const activeLib = watch("library") || "All";

  const docs = documents ?? [];

  const libraries = useMemo(() => {
    const unique = Array.from(new Set(docs.map(d => sourceLabel(d.source_type))));
    return ["All", ...unique];
  }, [docs]);

  const filtered = docs.filter(d => {
    const label = sourceLabel(d.source_type);
    const matchLib = activeLib === "All" || label === activeLib;
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    return matchLib && matchSearch;
  });

  const errorMessage = isError ? (error instanceof Error ? error.message : "Could not load your library.") : null;

  return (
    <main style={{ flex:1, padding:"38px 46px", overflowY:"auto", background:C.bg }}>
      <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:16 }}>
          <div>
            <span style={{ ...S.tagIndigo, marginBottom:10 }}>Library</span>
            <h1 style={{ ...S.heading, fontSize:38, marginTop:10, marginBottom:6 }}>Your Research Library</h1>
            <p style={{ fontSize:14, color:C.textSec }}>
              {docs.length} document{docs.length !== 1 ? "s" : ""} across {Math.max(libraries.length - 1, 0)} source{libraries.length - 1 !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/ingest" style={{ textDecoration:"none", marginTop:4 }}>
            <button style={S.btnPrimary}>
              <Plus size={14} /> Add Document
            </button>
          </Link>
        </div>

        <div style={{ display:"flex", gap:12, marginBottom:8, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ position:"relative", width:280 }}>
            <Search size={14} color={C.textMuted} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
            <input
              style={{ ...S.input, paddingLeft:36, height:40, borderColor: errors.search ? C.red : undefined }}
              placeholder="Search by title…"
              aria-invalid={errors.search ? true : undefined}
              {...register("search")}
            />
          </div>

          <div style={{ width:1, height:32, background:"rgba(0,0,0,0.1)" }} />

          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {libraries.map(lib => (
              <button key={lib} type="button" onClick={() => setValue("library", lib, { shouldValidate: true })} style={{
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

        {errors.search ? (
          <div style={{ fontSize:11.5, color:C.red, fontWeight:600, marginBottom:20 }}>{errors.search.message}</div>
        ) : (
          <div style={{ marginBottom:20 }} />
        )}

        {isError && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 20px", borderRadius:12, background:C.redBg, border:"1px solid rgba(220,38,38,0.2)", marginBottom:28 }}>
            <AlertTriangle size={16} color={C.red} />
            <div style={{ flex:1, fontSize:13.5, color:C.text }}>
              {errorMessage || "Couldn't load your library. The backend may be unreachable."}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              style={{ ...S.btnSecondary, padding:"7px 14px", fontSize:12.5, display:"flex", alignItems:"center", gap:6 }}
            >
              <RotateCcw size={12} style={{ animation: isRefetching ? "spin 0.7s linear infinite" : "none" }} /> Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(330px,1fr))", gap:18 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ ...S.card, padding:24, display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:13 }}>
                  <Skeleton className="h-10 w-10 rounded-[11px]" />
                  <div style={{ flex:1 }}>
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-px w-full" />
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(330px,1fr))", gap:18 }}>
            {filtered.map((doc, i) => {
              const color = PALETTE[i % PALETTE.length];
              return (
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
                  <div style={{ display:"flex", alignItems:"flex-start", gap:13 }}>
                    <div style={{
                      width:40, height:40, borderRadius:11,
                      background: color + "14",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                    }}>
                      <FileText size={17} color={color} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14.5, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:3 }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize:12, color:C.textMuted }}>
                        {sourceLabel(doc.source_type)} · {new Date(doc.ingested_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize:13, color:C.textSec, lineHeight:1.6 }}>
                    {doc.chunk_count} chunk{doc.chunk_count !== 1 ? "s" : ""} indexed and ready to query.
                  </p>

                  <div style={{ height:1, background:C.border }} />

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", gap:14 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <BookOpen size={12} color={C.textMuted} />
                        <span style={{ fontSize:11, color:C.textMuted }}>{doc.chunk_count} chunks</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <Calendar size={12} color={C.textMuted} />
                        <span style={{ fontSize:11, color:C.textMuted }}>{sourceLabel(doc.source_type)}</span>
                      </div>
                    </div>
                    <Link href="/workspace" style={{ textDecoration:"none" }}>
                      <button style={{
                        display:"flex", alignItems:"center", gap:5,
                        fontSize:12, fontWeight:600, color:color,
                        background: color + "12",
                        border:"none", borderRadius:8, padding:"6px 12px",
                        cursor:"pointer", fontFamily:"inherit",
                      }}>
                        Query <ArrowRight size={11} />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"70px 0", color:C.textMuted }}>
            <Search size={30} style={{ margin:"0 auto 14px", display:"block" }} />
            <div style={{ fontSize:15, fontWeight:600, marginBottom:5 }}>No documents found</div>
            <div style={{ fontSize:13, marginBottom: docs.length === 0 ? 20 : 0 }}>
              {docs.length === 0 ? "Ingest your first document to build your library" : "Try adjusting your search or filter"}
            </div>
            {docs.length === 0 && (
              <Link href="/ingest" style={{ textDecoration:"none" }}>
                <button style={{ ...S.btnPrimary, margin:"0 auto" }}>
                  <Plus size={14} /> Ingest Document
                </button>
              </Link>
            )}
          </div>
        )}

      </motion.div>
    </main>
  );
}