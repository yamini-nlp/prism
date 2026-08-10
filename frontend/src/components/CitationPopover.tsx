"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { C } from "@/lib/styles";

export interface Citation {
  id: string;
  text: string;
  source: string;
  score: number;
  chunk_index: number;
}

export interface CitationPopoverProps {
  index: number;
  citation: Citation;
}

export default function CitationPopover({ index, citation }: CitationPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <span ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={`View source ${index}: ${citation.source}`}
        aria-expanded={open}
        aria-controls={panelId}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 17,
          height: 17,
          padding: "0 5px",
          borderRadius: 5,
          background: open ? "rgba(91,94,244,0.22)" : "rgba(91,94,244,0.14)",
          color: "#4547c4",
          fontSize: 10,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          verticalAlign: "super",
          lineHeight: "17px",
          fontFamily: "inherit",
          margin: "0 1px",
        }}
      >
        {index}
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={`Source ${index}: ${citation.source}`}
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            zIndex: 50,
            width: 290,
            padding: "13px 15px",
            borderRadius: 12,
            background: "#ffffff",
            border: `1px solid ${C.border}`,
            boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <BookOpen size={12} color={C.accent} aria-hidden="true" />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {citation.source}
            </span>
            <span style={{ fontSize: 10, color: C.textMuted, marginLeft: "auto", flexShrink: 0 }}>
              {Math.round(citation.score * 100)}% match
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.55, fontStyle: "italic", margin: "0 0 11px" }}>
            "{citation.text}"
          </p>
          <Link
            href={`/source-trace?citation=${encodeURIComponent(citation.id)}&source=${encodeURIComponent(citation.source)}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: C.accent, textDecoration: "none" }}
            onClick={() => setOpen(false)}
          >
            View in Source Trace <ExternalLink size={11} aria-hidden="true" />
          </Link>
        </div>
      )}
    </span>
  );
}