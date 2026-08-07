"use client";

export type ConfidenceTone = "positive" | "neutral" | "caution" | "negative";

export interface ConfidenceBadgeProps {
  value: number;
  label?: string;
  tone?: ConfidenceTone;
  size?: "sm" | "md";
}

const TONE_STYLES: Record<ConfidenceTone, { color: string; bg: string; border: string }> = {
  positive: { color: "#2e7357", bg: "rgba(61,153,112,0.12)", border: "rgba(61,153,112,0.3)" },
  neutral: { color: "#4547c4", bg: "rgba(91,94,244,0.12)", border: "rgba(91,94,244,0.3)" },
  caution: { color: "#b5491f", bg: "rgba(212,98,42,0.12)", border: "rgba(212,98,42,0.3)" },
  negative: { color: "#b91c1c", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.3)" },
};

export function toneForScore(value: number): ConfidenceTone {
  if (value >= 80) return "positive";
  if (value >= 60) return "neutral";
  if (value >= 35) return "caution";
  return "negative";
}

export default function ConfidenceBadge({ value, label, tone, size = "md" }: ConfidenceBadgeProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const resolvedTone = tone || toneForScore(safeValue);
  const styles = TONE_STYLES[resolvedTone];
  const rounded = Math.round(safeValue);
  const fontSize = size === "sm" ? 10.5 : 12;
  const padding = size === "sm" ? "2px 8px" : "3px 11px";

  return (
    <span
      role="status"
      aria-label={`${label ? label + ": " : ""}${rounded} percent`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding,
        borderRadius: 999,
        fontSize,
        fontWeight: 700,
        color: styles.color,
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      {label && <span style={{ fontWeight: 600, opacity: 0.85 }}>{label}</span>}
      <span>{rounded}%</span>
    </span>
  );
}