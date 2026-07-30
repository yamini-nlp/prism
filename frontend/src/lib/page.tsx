"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { S, C } from "@/lib/styles";
import { useUIStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import Skeleton from "@/components/ui/Skeleton";
import { useDocuments, useDocumentsList, useDeleteDocument } from "@/lib/queries/documents";
import type { DocumentRecord, DocumentListParams, DocumentSortBy, SortDir } from "@/lib/api";
import {
  FileText, Search, Plus, ArrowRight, BookOpen, Calendar, Loader2,
  LayoutGrid, List as ListIcon, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  Trash2, GitBranch, MessageSquare, AlertTriangle, Inbox, RefreshCw, HardDrive,
} from "lucide-react";

const PALETTE = ["#5b5ef4", "#3b82f6", "#d4622a", "#3d9970"];
const PAGE_SIZE = 12;

type ViewMode = "grid" | "list";

interface SortOption {
  value: DocumentSortBy;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "ingested_at", label: "Date ingested" },
  { value: "updated_at", label: "Last updated" },
  { value: "title", label: "Title" },
  { value: "chunk_count", label: "Chunk count" },
  { value: "size_bytes", label: "Size" },
];

function sourceLabel(sourceType: string) {
  if (sourceType === "pdf") return "PDF";
  if (sourceType === "url") return "URL";
  if (sourceType === "text") return "Text";
  return sourceType.charAt(0).toUpperCase() + sourceType.slice(1);
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTagStyle(status: string) {
  if (status === "ready") return S.tagGreen;
  if (status === "processing" || status === "pending") return S.tagOrange;
  if (status === "failed" || status === "error") return S.tagRed;
  return S.tagNeutral;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = unitIndex === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusable = container?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = container?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [active, containerRef, onClose]);
}

function SkeletonCard() {
  return (
    <div style={{ ...S.card, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
        <Skeleton className="h-10 w-10 rounded-[11px]" />
        <div style={{ flex: 1 }}>
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div style={{ height: 1, background: C.border }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const setActiveDocumentId = useUIStore((s) => s.setActiveDocumentId);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [sourceType, setSourceType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<DocumentSortBy>("ingested_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allDocumentsQuery = useDocuments();

  const hasFilters = Boolean(
    debouncedSearch.trim() || sourceType !== "all" || statusFilter !== "all" || dateFrom || dateTo
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sourceType, statusFilter, dateFrom, dateTo, sortBy, sortDir]);

  const listParams: DocumentListParams = useMemo(() => {
    const params: DocumentListParams = {
      sort_by: sortBy,
      sort_dir: sortDir,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    };
    if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
    if (sourceType !== "all") params.source_type = sourceType;
    if (statusFilter !== "all") params.status = statusFilter;
    if (dateFrom) params.date_from = `${dateFrom}T00:00:00`;
    if (dateTo) params.date_to = `${dateTo}T23:59:59`;
    return params;
  }, [debouncedSearch, sourceType, statusFilter, dateFrom, dateTo, sortBy, sortDir, page]);

  const listQuery = useDocumentsList(listParams);
  const deleteMutation = useDeleteDocument();

  const docs = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const typeOptions = useMemo(() => {
    const source = allDocumentsQuery.data ?? [];
    return Array.from(new Set(source.map((d) => d.source_type))).sort();
  }, [allDocumentsQuery.data]);

  const statusOptions = useMemo(() => {
    const source = allDocumentsQuery.data ?? [];
    return Array.from(new Set(source.map((d) => d.status))).sort();
  }, [allDocumentsQuery.data]);

  const isFirstLoad = listQuery.isLoading;
  const isBackgroundFetching = listQuery.isFetching && !listQuery.isLoading;
  const showEmptyLibrary = !isFirstLoad && !listQuery.isError && total === 0 && !hasFilters;
  const showNoMatches = !isFirstLoad && !listQuery.isError && total === 0 && hasFilters;

  const closeDrawer = useCallback(() => setSelectedDoc(null), []);
  const closeDialog = useCallback(() => setDeleteTarget(null), []);

  useFocusTrap(Boolean(selectedDoc), drawerRef, closeDrawer);
  useFocusTrap(Boolean(deleteTarget), dialogRef, closeDialog);

  const clearFilters = () => {
    setSearch("");
    setSourceType("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const openWorkspace = (doc: DocumentRecord) => {
    setActiveDocumentId(doc.id);
  };

  const openSourceTrace = (doc: DocumentRecord) => {
    setActiveDocumentId(doc.id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        toast.success("Document deleted", `"${target.title}" was removed from your library.`);
        setDeleteTarget(null);
        if (selectedDoc?.id === target.id) setSelectedDoc(null);
        if (docs.length === 1 && page > 1) setPage((p) => p - 1);
      },
      onError: (err) => {
        toast.error("Delete failed", err.message || "Could not delete this document.");
      },
    });
  };

  return (
    <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto", background: C.bg }}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ ...S.tagIndigo, marginBottom: 10 }}>Library</span>
            <h1 style={{ ...S.heading, fontSize: 38, marginTop: 10, marginBottom: 6 }}>Your Research Library</h1>
            <p style={{ fontSize: 14, color: C.textSec }}>
              {total} document{total !== 1 ? "s" : ""}
              {hasFilters ? " matching your filters" : ""}
            </p>
          </div>
          <Link href="/ingest" style={{ textDecoration: "none", marginTop: 4 }}>
            <button style={S.btnPrimary}>
              <Plus size={14} /> Add Document
            </button>
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 26 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", width: 280, maxWidth: "100%" }}>
              <label htmlFor="library-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                Search documents
              </label>
              <Search size={14} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="library-search"
                ref={searchInputRef}
                style={{ ...S.input, paddingLeft: 36, paddingRight: search ? 32 : 15, height: 40 }}
                placeholder="Search title or content…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#5b5ef4"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.15)"; }}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}
                >
                  <X size={13} color={C.textMuted} />
                </button>
              )}
            </div>

            <div>
              <label htmlFor="library-type-filter" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                Filter by type
              </label>
              <select
                id="library-type-filter"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                style={{ ...S.input, height: 40, width: 150, cursor: "pointer" }}
              >
                <option value="all">All types</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{sourceLabel(t)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="library-status-filter" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                Filter by status
              </label>
              <select
                id="library-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...S.input, height: 40, width: 150, cursor: "pointer" }}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label htmlFor="library-date-from" style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>From</label>
              <input
                id="library-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ ...S.input, height: 40, width: 150 }}
              />
              <label htmlFor="library-date-to" style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>To</label>
              <input
                id="library-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ ...S.input, height: 40, width: 150 }}
              />
            </div>

            {hasFilters && (
              <button type="button" onClick={clearFilters} style={{ ...S.btnGhost, height: 40 }}>
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label htmlFor="library-sort-by" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                Sort by
              </label>
              <select
                id="library-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as DocumentSortBy)}
                style={{ ...S.input, height: 36, width: 170, cursor: "pointer", fontSize: 13 }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                aria-label={sortDir === "asc" ? "Sort ascending, click to sort descending" : "Sort descending, click to sort ascending"}
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                style={{ ...S.btnSecondary, height: 36, width: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </button>
              {isBackgroundFetching && (
                <Loader2 size={14} color={C.textMuted} style={{ animation: "spin 1s linear infinite" }} aria-label="Updating results" />
              )}
            </div>

            <div role="group" aria-label="View mode" style={{ display: "flex", gap: 4, background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 3 }}>
              <button
                type="button"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", borderRadius: 7,
                  border: "none", background: view === "grid" ? "#111110" : "transparent", color: view === "grid" ? "#fff" : C.textMuted,
                  cursor: "pointer",
                }}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", borderRadius: 7,
                  border: "none", background: view === "list" ? "#111110" : "transparent", color: view === "list" ? "#fff" : C.textMuted,
                  cursor: "pointer",
                }}
              >
                <ListIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {isFirstLoad && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: 18 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!isFirstLoad && listQuery.isError && (
          <div style={{ textAlign: "center", padding: "70px 0", color: C.textMuted }}>
            <AlertTriangle size={30} color={C.red} style={{ margin: "0 auto 14px", display: "block" }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5, color: C.text }}>Couldn't load your library</div>
            <div style={{ fontSize: 13, marginBottom: 18 }}>
              {(listQuery.error as Error)?.message || "Something went wrong while fetching documents."}
            </div>
            <button type="button" onClick={() => listQuery.refetch()} style={{ ...S.btnSecondary, margin: "0 auto" }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {showEmptyLibrary && (
          <div style={{ textAlign: "center", padding: "70px 0", color: C.textMuted }}>
            <Inbox size={30} style={{ margin: "0 auto 14px", display: "block" }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5, color: C.text }}>Your library is empty</div>
            <div style={{ fontSize: 13, marginBottom: 18 }}>Ingest your first document to build your library</div>
            <Link href="/ingest" style={{ textDecoration: "none" }}>
              <button style={{ ...S.btnPrimary, margin: "0 auto" }}>
                <Plus size={14} /> Add Document
              </button>
            </Link>
          </div>
        )}

        {showNoMatches && (
          <div style={{ textAlign: "center", padding: "70px 0", color: C.textMuted }}>
            <Search size={30} style={{ margin: "0 auto 14px", display: "block" }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5, color: C.text }}>No documents found</div>
            <div style={{ fontSize: 13, marginBottom: 18 }}>Try adjusting your search or filters</div>
            <button type="button" onClick={clearFilters} style={{ ...S.btnSecondary, margin: "0 auto" }}>
              <X size={13} /> Clear filters
            </button>
          </div>
        )}

        {!isFirstLoad && !listQuery.isError && docs.length > 0 && view === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: 18, opacity: isBackgroundFetching ? 0.65 : 1, transition: "opacity 0.15s" }}>
            {docs.map((doc, i) => {
              const color = PALETTE[i % PALETTE.length];
              return (
                <motion.div key={doc.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.32 }}
                  style={{ ...S.card, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
                  whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(0,0,0,0.10)" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: color + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={17} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        style={{
                          fontSize: 14.5, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 3,
                          background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer",
                          fontFamily: "inherit", display: "block", width: "100%",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                      >
                        {doc.title}
                      </button>
                      <div style={{ fontSize: 12, color: C.textMuted }}>
                        {sourceLabel(doc.source_type)} · {formatDate(doc.ingested_at)}
                      </div>
                    </div>
                    <span style={statusTagStyle(doc.status)}>{statusLabel(doc.status)}</span>
                  </div>

                  <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
                    {doc.chunk_count} chunk{doc.chunk_count !== 1 ? "s" : ""} indexed · {formatBytes(doc.size_bytes)}
                  </p>

                  <div style={{ height: 1, background: C.border }} />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <BookOpen size={12} color={C.textMuted} />
                        <span style={{ fontSize: 11, color: C.textMuted }}>{doc.chunk_count} chunks</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={12} color={C.textMuted} />
                        <span style={{ fontSize: 11, color: C.textMuted }}>{sourceLabel(doc.source_type)}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        aria-label={`Delete ${doc.title}`}
                        onClick={() => setDeleteTarget(doc)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, border: "none", background: C.redBg, color: C.red, cursor: "pointer" }}
                      >
                        <Trash2 size={12} />
                      </button>
                      <Link href="/workspace" onClick={() => openWorkspace(doc)} style={{ textDecoration: "none" }}>
                        <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color, background: color + "12", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                          Query <ArrowRight size={11} />
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isFirstLoad && !listQuery.isError && docs.length > 0 && view === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: isBackgroundFetching ? 0.65 : 1, transition: "opacity 0.15s" }}>
            {docs.map((doc, i) => {
              const color = PALETTE[i % PALETTE.length];
              return (
                <motion.div key={doc.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.28 }}
                  style={{ ...S.card, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={16} color={color} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    style={{ flex: 1, minWidth: 180, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      {sourceLabel(doc.source_type)} · {formatDate(doc.ingested_at)} · {doc.chunk_count} chunks · {formatBytes(doc.size_bytes)}
                    </div>
                  </button>
                  <span style={statusTagStyle(doc.status)}>{statusLabel(doc.status)}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      aria-label={`Delete ${doc.title}`}
                      onClick={() => setDeleteTarget(doc)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, border: "none", background: C.redBg, color: C.red, cursor: "pointer" }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <Link href="/workspace" onClick={() => openWorkspace(doc)} style={{ textDecoration: "none" }}>
                      <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color, background: color + "12", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
                        Query <ArrowRight size={11} />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isFirstLoad && !listQuery.isError && total > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28, flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12.5, color: C.textMuted }}>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ ...S.btnSecondary, height: 34, padding: "0 12px", opacity: page <= 1 ? 0.45 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: 12.5, color: C.textSec, fontWeight: 600 }}>Page {page} of {totalPages}</span>
              <button
                type="button"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ ...S.btnSecondary, height: 34, padding: "0 12px", opacity: page >= totalPages ? 0.45 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </motion.div>

      <AnimatePresence>
        {selectedDoc && (
          <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              onClick={closeDrawer} aria-hidden="true"
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
            />
            <motion.div
              ref={drawerRef}
              role="dialog" aria-modal="true" aria-label={`Document details for ${selectedDoc.title}`}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)", background: "#fff", padding: 28, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <h2 style={{ ...S.heading, fontSize: 22 }}>{selectedDoc.title}</h2>
                <button
                  type="button" aria-label="Close details" onClick={closeDrawer}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#fff", cursor: "pointer", flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={statusTagStyle(selectedDoc.status)}>{statusLabel(selectedDoc.status)}</span>
                <span style={S.tagNeutral}>{sourceLabel(selectedDoc.source_type)}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <BookOpen size={15} color={C.textMuted} />
                  <div>
                    <div style={S.label}>Chunks</div>
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{selectedDoc.chunk_count}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <HardDrive size={15} color={C.textMuted} />
                  <div>
                    <div style={S.label}>Size</div>
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{formatBytes(selectedDoc.size_bytes)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar size={15} color={C.textMuted} />
                  <div>
                    <div style={S.label}>Ingested</div>
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{formatDate(selectedDoc.ingested_at)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar size={15} color={C.textMuted} />
                  <div>
                    <div style={S.label}>Last updated</div>
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{formatDate(selectedDoc.updated_at)}</div>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: C.border }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={S.label}>Quick actions</div>
                <Link href="/workspace" onClick={() => openWorkspace(selectedDoc)} style={{ textDecoration: "none" }}>
                  <button style={{ ...S.btnSecondary, width: "100%", justifyContent: "flex-start" }}>
                    <MessageSquare size={14} /> View in Workspace
                  </button>
                </Link>
                <Link href="/source-trace" onClick={() => openSourceTrace(selectedDoc)} style={{ textDecoration: "none" }}>
                  <button style={{ ...S.btnSecondary, width: "100%", justifyContent: "flex-start" }}>
                    <GitBranch size={14} /> View Source Trace
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => { setDeleteTarget(selectedDoc); }}
                  style={{ ...S.btnSecondary, width: "100%", justifyContent: "flex-start", color: C.red, borderColor: "rgba(220,38,38,0.3)" }}
                >
                  <Trash2 size={14} /> Delete document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              onClick={() => { if (!deleteMutation.isPending) closeDialog(); }} aria-hidden="true"
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
            />
            <motion.div
              ref={dialogRef}
              role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-desc"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              style={{ position: "relative", ...S.card, width: "min(420px, 100%)", padding: 26, display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: C.redBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle size={17} color={C.red} />
                </div>
                <h2 id="delete-dialog-title" style={{ ...S.heading, fontSize: 19 }}>Delete document?</h2>
              </div>
              <p id="delete-dialog-desc" style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.6 }}>
                This will permanently delete <strong>{deleteTarget.title}</strong> and its {deleteTarget.chunk_count} indexed chunk{deleteTarget.chunk_count !== 1 ? "s" : ""}. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button" onClick={closeDialog} disabled={deleteMutation.isPending}
                  style={{ ...S.btnSecondary, opacity: deleteMutation.isPending ? 0.6 : 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button" onClick={confirmDelete} disabled={deleteMutation.isPending}
                  style={{ ...S.btnPrimary, background: C.red, opacity: deleteMutation.isPending ? 0.7 : 1 }}
                >
                  {deleteMutation.isPending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}