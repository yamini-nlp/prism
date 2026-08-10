"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BackendStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"checking"|"online"|"offline">("checking");

  const check = async () => {
    setStatus("checking");
    try {
      const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) });
      setStatus(res.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    }
  };

  useEffect(() => { check(); }, []);

  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        title={status === "online" ? "Backend online" : status === "offline" ? "Backend offline" : "Checking backend…"}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 9px", borderRadius: 99,
          background: status === "offline" ? "#fef2f2" : status === "online" ? "#eafaf3" : "#f7f6f3",
          border: `1px solid ${status === "offline" ? "rgba(220,38,38,0.25)" : status === "online" ? "rgba(61,153,112,0.25)" : "rgba(0,0,0,0.1)"}`,
          flexShrink: 0,
        }}
      >
        {status === "offline" ? (
          <button onClick={check} aria-label="Backend offline, retry connection" style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            <AlertTriangle size={11} color="#dc2626" aria-hidden="true" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626" }}>Offline</span>
          </button>
        ) : status === "online" ? (
          <>
            <CheckCircle size={11} color="#3d9970" aria-hidden="true" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#3d9970" }}>Online</span>
          </>
        ) : (
          <>
            <RefreshCw size={11} color="#5c5a56" aria-hidden="true" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#5c5a56" }}>Checking…</span>
          </>
        )}
      </div>
    );
  }

  if (status === "online") return null; 

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 9999,
      padding: "12px 16px",
      borderRadius: 12,
      background: status === "offline" ? "#fef2f2" : "#f7f6f3",
      border: `1px solid ${status === "offline" ? "rgba(220,38,38,0.25)" : "rgba(0,0,0,0.1)"}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 10,
      maxWidth: 360,
    }}>
      {status === "offline" ? (
        <>
          <AlertTriangle size={16} color="#dc2626" aria-hidden="true" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 2 }}>
              Backend offline
            </div>
            <div style={{ fontSize: 11, color: "#5c5a56", lineHeight: 1.4 }}>
              Run: <code style={{ background: "rgba(0,0,0,0.07)", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>
                uvicorn main:app --reload --port 8000
              </code>
            </div>
          </div>
          <button onClick={check} aria-label="Retry backend connection" style={{
            background: "none", border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 7, padding: "4px 8px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, color: "#dc2626", fontFamily: "inherit", fontWeight: 600,
          }}>
            <RefreshCw size={11} aria-hidden="true" /> Retry
          </button>
        </>
      ) : (
        <>
          <CheckCircle size={16} color="#3d9970" aria-hidden="true" />
          <span style={{ fontSize: 12, color: "#3d9970", fontWeight: 600 }}>Connecting…</span>
        </>
      )}
    </div>
  );
}