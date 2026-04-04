"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BackendStatus() {
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

  if (status === "online") return null; // hide when online

  return (
    <div style={{
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
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
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
          <button onClick={check} style={{
            background: "none", border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 7, padding: "4px 8px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, color: "#dc2626", fontFamily: "inherit", fontWeight: 600,
          }}>
            <RefreshCw size={11} /> Retry
          </button>
        </>
      ) : (
        <>
          <CheckCircle size={16} color="#3d9970" />
          <span style={{ fontSize: 12, color: "#3d9970", fontWeight: 600 }}>Connecting…</span>
        </>
      )}
    </div>
  );
}