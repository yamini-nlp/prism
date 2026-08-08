import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { S, C } from "@/lib/styles";

export default function NotFound() {
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
            background: C.accentBg,
            border: "1px solid rgba(91,94,244,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Compass size={24} color={C.accent} />
        </div>
        <span style={{ ...S.tagIndigo, marginBottom: 12 }}>404</span>
        <h1 style={{ ...S.heading, fontSize: 34, marginTop: 12, marginBottom: 10 }}>Page not found</h1>
        <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, marginBottom: 28 }}>
          The page you're looking for doesn't exist or may have moved. Check the URL, or head back to your dashboard.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ ...S.btnPrimary, display: "inline-flex" }}>
              <Home size={14} /> Go to dashboard
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}