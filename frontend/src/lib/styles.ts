import { clsx, type ClassValue } from "clsx";

export const C = {
  bg:        "var(--bg-base)",
  surface:   "var(--bg-surface)",
  text:      "var(--text-primary)",
  textSec:   "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  border:    "var(--border)",
  borderMid: "var(--border-strong)",
  accent:    "var(--accent)",
  accentBg:  "var(--accent-light)",
  green:     "var(--accent-green)",
  greenBg:   "var(--accent-green-light)",
  orange:    "var(--accent-orange)",
  orangeBg:  "var(--accent-orange-light)",
  red:       "var(--accent-red)",
  redBg:     "var(--accent-red-light)",
  black:     "var(--text-primary)",
};

export const S = {
  btnPrimary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 7,
    padding: "11px 22px",
    background: "var(--text-primary)",
    color: "var(--bg-surface)",
    border: "none",
    borderRadius: 11,
    fontSize: 13.5,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    textDecoration: "none",
    transition: "opacity 0.18s",
    whiteSpace: "nowrap" as const,
  },
  btnPrimaryDisabled: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 7,
    padding: "11px 22px",
    background: "var(--text-primary)",
    color: "var(--bg-surface)",
    border: "none",
    borderRadius: 11,
    fontSize: 13.5,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "not-allowed",
    opacity: 0.45,
    whiteSpace: "nowrap" as const,
  },
  btnSecondary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 7,
    padding: "10px 20px",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    border: "1.5px solid var(--border-strong)",
    borderRadius: 11,
    fontSize: 13.5,
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap" as const,
  },
  btnGhost: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "7px 14px",
    background: "var(--accent-light)",
    color: "var(--accent)",
    border: "none",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
  },

  input: {
    width: "100%",
    background: "var(--bg-surface)",
    border: "1.5px solid var(--border-strong)",
    borderRadius: 11,
    padding: "12px 15px",
    fontSize: 14,
    color: "var(--text-primary)",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.18s",
  },
  textarea: {
    width: "100%",
    background: "var(--bg-surface)",
    border: "1.5px solid var(--border-strong)",
    borderRadius: 11,
    padding: "12px 15px",
    fontSize: 14,
    color: "var(--text-primary)",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical" as const,
    lineHeight: 1.65,
    minHeight: 180,
    transition: "border-color 0.18s",
  },

  card: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  },

  tagIndigo:  { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"var(--accent-light)", color:"var(--accent)" },
  tagGreen:   { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"var(--accent-green-light)", color:"var(--accent-green)" },
  tagOrange:  { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"var(--accent-orange-light)", color:"var(--accent-orange)" },
  tagRed:     { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"var(--accent-red-light)", color:"var(--accent-red)" },
  tagNeutral: { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"var(--border)", color:"var(--text-secondary)" },

  heading: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    color: "var(--text-primary)",
    letterSpacing: "-0.022em",
    lineHeight: 1.1,
  },
  label: {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
  },

  cbarWrap: { height:5, borderRadius:99, background:"var(--border)", overflow:"hidden" as const },
  cbarFill: { height:"100%", borderRadius:99, background:"linear-gradient(90deg,var(--accent),#818cf8)", transition:"width 0.7s cubic-bezier(.34,1.56,.64,1)" },

  divider: { height:1, background:"var(--border)", width:"100%" },
};

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type CardVariant = "flat" | "elevated" | "premium" | "outline";
export type InputState = "default" | "invalid" | "disabled";
export type BadgeTone = "brand" | "success" | "warning" | "danger" | "neutral";

const base = (...inputs: ClassValue[]) => clsx(inputs);

export function buttonVariants(opts: { variant?: ButtonVariant; size?: ButtonSize; className?: ClassValue } = {}) {
  const { variant = "primary", size = "md", className } = opts;

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5 rounded-sm",
    md: "px-5 py-2.5 text-sm gap-2 rounded-md",
    lg: "px-6 py-3.5 text-base gap-2.5 rounded-md",
    icon: "p-2.5 rounded-md",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--text-primary)] text-[var(--bg-surface)] hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm",
    secondary:
      "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:border-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed",
    outline:
      "bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-base)] disabled:opacity-40 disabled:cursor-not-allowed",
    ghost:
      "bg-[var(--accent-light)] text-[var(--accent)] hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed",
    danger:
      "bg-danger-500 text-white hover:bg-danger-600 disabled:opacity-40 disabled:cursor-not-allowed",
  };

  return base(
    "inline-flex items-center justify-center font-sans font-semibold whitespace-nowrap transition-all duration-150 ease-premium select-none",
    sizeClasses[size],
    variantClasses[variant],
    className
  );
}

export function cardVariants(opts: { variant?: CardVariant; padding?: boolean; interactive?: boolean; className?: ClassValue } = {}) {
  const { variant = "flat", padding = true, interactive = false, className } = opts;

  const variantClasses: Record<CardVariant, string> = {
    flat: "bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs",
    elevated: "bg-[var(--bg-surface)] border border-[var(--border)] shadow-md",
    premium: "bg-[var(--bg-surface)] border border-[var(--border)] shadow-premium",
    outline: "bg-transparent border border-[var(--border-strong)]",
  };

  return base(
    "rounded-lg",
    variantClasses[variant],
    padding && "p-6",
    interactive && "transition-all duration-200 ease-premium cursor-pointer hover:shadow-md hover:-translate-y-0.5",
    className
  );
}

export function inputVariants(opts: { state?: InputState; className?: ClassValue } = {}) {
  const { state = "default", className } = opts;

  const stateClasses: Record<InputState, string> = {
    default: "border-[var(--border-strong)] focus:border-[var(--accent)] focus:shadow-focus",
    invalid: "border-danger-500 focus:border-danger-600 focus:shadow-focus",
    disabled: "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-muted)] cursor-not-allowed",
  };

  return base(
    "w-full rounded-md border bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 placeholder:text-[var(--text-muted)]",
    stateClasses[state],
    className
  );
}

export function badgeVariants(opts: { tone?: BadgeTone; className?: ClassValue } = {}) {
  const { tone = "neutral", className } = opts;

  const toneClasses: Record<BadgeTone, string> = {
    brand: "bg-[var(--accent-light)] text-[var(--accent)]",
    success: "bg-[var(--accent-green-light)] text-[var(--accent-green)]",
    warning: "bg-[var(--accent-orange-light)] text-[var(--accent-orange)]",
    danger: "bg-[var(--accent-red-light)] text-[var(--accent-red)]",
    neutral: "bg-[var(--border)] text-[var(--text-secondary)]",
  };

  return base(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider",
    toneClasses[tone],
    className
  );
}
