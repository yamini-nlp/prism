"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { C } from "@/lib/styles";
import { subscribe, dismissToast, type ToastItem } from "@/lib/toast";

const ICONS: Record<ToastItem["variant"], typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS: Record<ToastItem["variant"], string> = {
  success: C.green,
  error: C.red,
  info: C.accent,
};

function ToastCard({ toast }: { toast: ToastItem }) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration]);

  const Icon = ICONS[toast.variant];
  const color = COLORS[toast.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      role="status"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: 320,
        padding: "13px 14px",
        borderRadius: 12,
        background: "var(--bg-surface)",
        border: `1px solid ${C.border}`,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <Icon size={17} color={color} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{toast.title}</div>
        {toast.description && (
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 3, lineHeight: 1.5 }}>
            {toast.description}
          </div>
        )}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.textMuted,
          display: "flex",
          flexShrink: 0,
          padding: 2,
        }}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribe(setToasts);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
