"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { S, C } from "@/lib/styles";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        flex: 1,
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: C.bg,
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: C.redBg,
            border: "1px solid rgba(220,38,38,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <AlertTriangle size={24} color={C.red} />
        </div>
        <span style={{ ...S.tagRed, marginBottom: 12 }}>Something went wrong</span>
        <h1 style={{ ...S.heading, fontSize: 28, marginTop: 12, marginBottom: 10 }}>
          This page hit an unexpected error
        </h1>
        <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, marginBottom: 28 }}>
          {error?.message || "Something went wrong while rendering this page."} You can try again, or head back to your dashboard.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => reset()} style={{ ...S.btnPrimary, display: "inline-flex" }}>
            <RotateCcw size={14} /> Try again
          </button>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ ...S.btnSecondary, display: "inline-flex" }}>
              <Home size={14} /> Go to dashboard
            </button>
          </Link>
        </div>
        {error?.digest && (
          <p style={{ fontSize: 11, color: C.textMuted, marginTop: 20 }}>Error reference: {error.digest}</p>
        )}
      </div>
    </main>
  );
}