"use client";

import { FileText, ArrowUpRight } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";

export interface EvidenceCardProps {
  title: string;
  meta?: string;
  score?: number;
  scoreLabel?: string;
  snippet: string;
  quote?: boolean;
  active?: boolean;
  onSelect?: () => void;
  onJump?: () => void;
  jumpLabel?: string;
}

export default function EvidenceCard({
  title,
  meta,
  score,
  scoreLabel = "Relevance",
  snippet,
  quote = false,
  active = false,
  onSelect,
  onJump,
  jumpLabel = "Jump to document",
}: EvidenceCardProps) {
  const clickable = typeof onSelect === "function";
  const normalizedScore = typeof score === "number" ? (score <= 1 ? score * 100 : score) : undefined;

  return (
    <div
      onClick={onSelect}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (onSelect) {
                  onSelect();
                }
              }
            }
          : undefined
      }
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: `1.5px solid ${active ? "rgba(91,94,244,0.4)" : "rgba(0,0,0,0.09)"}`,
        background: active ? "rgba(91,94,244,0.05)" : "#ffffff",
        cursor: clickable ? "pointer" : "default",
        transition: "border-color 0.15s, background 0.15s",
        outline: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
          <FileText size={14} color="#5b5ef4" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#111110",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 260,
              }}
            >
              {title}
            </div>
            {meta && <div style={{ fontSize: 11, color: "#9a9590", marginTop: 2 }}>{meta}</div>}
          </div>
        </div>
        {normalizedScore !== undefined && <ConfidenceBadge value={normalizedScore} label={scoreLabel} size="sm" />}
      </div>

      <p
        style={{
          fontSize: 12.5,
          color: "#5c5a56",
          lineHeight: 1.6,
          margin: 0,
          fontStyle: quote ? "italic" : "normal",
          wordBreak: "break-word",
        }}
      >
        {quote ? `"${snippet}"` : snippet}
      </p>

      {onJump && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJump();
          }}
          style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11.5,
            fontWeight: 600,
            color: "#4547c4",
            background: "rgba(91,94,244,0.09)",
            border: "none",
            borderRadius: 7,
            padding: "5px 10px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {jumpLabel} <ArrowUpRight size={12} />
        </button>
      )}
    </div>
  );
}