import { clsx, type ClassValue } from "clsx";

export const C = {
  bg:        "#f7f6f3",
  surface:   "#ffffff",
  text:      "#111110",
  textSec:   "#5c5a56",
  textMuted: "#9a9590",
  border:    "rgba(0,0,0,0.09)",
  borderMid: "rgba(0,0,0,0.15)",
  accent:    "#5b5ef4",
  accentBg:  "rgba(91,94,244,0.09)",
  green:     "#3d9970",
  greenBg:   "rgba(61,153,112,0.09)",
  orange:    "#d4622a",
  orangeBg:  "rgba(212,98,42,0.09)",
  red:       "#dc2626",
  redBg:     "rgba(220,38,38,0.09)",
  black:     "#111110",
};

export const S = {
  btnPrimary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 7,
    padding: "11px 22px",
    background: "#111110",
    color: "#ffffff",
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
    background: "rgba(0,0,0,0.25)",
    color: "#ffffff",
    border: "none",
    borderRadius: 11,
    fontSize: 13.5,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "not-allowed",
    whiteSpace: "nowrap" as const,
  },
  btnSecondary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 7,
    padding: "10px 20px",
    background: "#ffffff",
    color: "#111110",
    border: "1.5px solid rgba(0,0,0,0.15)",
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
    background: "rgba(91,94,244,0.09)",
    color: "#4547c4",
    border: "none",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
  },

  input: {
    width: "100%",
    background: "#ffffff",
    border: "1.5px solid rgba(0,0,0,0.15)",
    borderRadius: 11,
    padding: "12px 15px",
    fontSize: 14,
    color: "#111110",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.18s",
  },
  textarea: {
    width: "100%",
    background: "#ffffff",
    border: "1.5px solid rgba(0,0,0,0.15)",
    borderRadius: 11,
    padding: "12px 15px",
    fontSize: 14,
    color: "#111110",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical" as const,
    lineHeight: 1.65,
    minHeight: 180,
    transition: "border-color 0.18s",
  },

  card: {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    boxShadow: "0 1px 6px rgba(0,0,0,0.055)",
  },

  tagIndigo:  { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"rgba(91,94,244,0.09)", color:"#4547c4" },
  tagGreen:   { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"rgba(61,153,112,0.09)", color:"#2e7357" },
  tagOrange:  { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"rgba(212,98,42,0.09)", color:"#b5491f" },
  tagRed:     { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"rgba(220,38,38,0.09)", color:"#b91c1c" },
  tagNeutral: { display:"inline-flex" as const, alignItems:"center" as const, padding:"3px 10px", borderRadius:99, fontSize:10.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" as const, background:"rgba(0,0,0,0.06)", color:"#5c5a56" },

  heading: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    color: "#111110",
    letterSpacing: "-0.022em",
    lineHeight: 1.1,
  },
  label: {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#9a9590",
  },

  cbarWrap: { height:5, borderRadius:99, background:"rgba(0,0,0,0.07)", overflow:"hidden" as const },
  cbarFill: { height:"100%", borderRadius:99, background:"linear-gradient(90deg,#5b5ef4,#818cf8)", transition:"width 0.7s cubic-bezier(.34,1.56,.64,1)" },

  divider: { height:1, background:"rgba(0,0,0,0.08)", width:"100%" },
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
      "bg-neutral-950 text-neutral-0 hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm",
    secondary:
      "bg-neutral-0 text-neutral-950 border border-neutral-300 hover:border-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed",
    outline:
      "bg-transparent text-neutral-950 border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed",
    ghost:
      "bg-brand-50 text-brand-600 hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed",
    danger:
      "bg-danger-500 text-neutral-0 hover:bg-danger-600 disabled:opacity-40 disabled:cursor-not-allowed",
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
    flat: "bg-neutral-0 border border-neutral-200 shadow-xs",
    elevated: "bg-neutral-0 border border-neutral-200 shadow-md",
    premium: "bg-neutral-0 border border-neutral-200 shadow-premium",
    outline: "bg-transparent border border-neutral-300",
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
    default: "border-neutral-300 focus:border-brand-500 focus:shadow-focus",
    invalid: "border-danger-500 focus:border-danger-600 focus:shadow-focus",
    disabled: "border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed",
  };

  return base(
    "w-full rounded-md border bg-neutral-0 px-3.5 py-2.5 text-sm text-neutral-950 outline-none transition-colors duration-150 placeholder:text-neutral-500",
    stateClasses[state],
    className
  );
}

export function badgeVariants(opts: { tone?: BadgeTone; className?: ClassValue } = {}) {
  const { tone = "neutral", className } = opts;

  const toneClasses: Record<BadgeTone, string> = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-accent-50 text-accent-600",
    danger: "bg-danger-50 text-danger-600",
    neutral: "bg-neutral-100 text-neutral-700",
  };

  return base(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider",
    toneClasses[tone],
    className
  );
}