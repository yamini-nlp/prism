"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#f7f6f3" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
          }}
        >
          <div style={{ maxWidth: 460, textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(220,38,38,0.09)",
                border: "1px solid rgba(220,38,38,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 10px",
                borderRadius: 99,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "rgba(220,38,38,0.09)",
                color: "#b91c1c",
                marginBottom: 12,
              }}
            >
              Application error
            </span>
            <h1
              style={{
                fontFamily: "Georgia, serif",
                color: "#111110",
                letterSpacing: "-0.022em",
                lineHeight: 1.1,
                fontSize: 28,
                marginTop: 12,
                marginBottom: 10,
              }}
            >
              Prism failed to load
            </h1>
            <p style={{ fontSize: 14, color: "#5c5a56", lineHeight: 1.6, marginBottom: 28 }}>
              {error?.message || "A critical error occurred while loading the application."} Try reloading the page.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => reset()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
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
                }}
              >
                Try again
              </button>
              <a href="/dashboard" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
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
                  }}
                >
                  Go to dashboard
                </button>
              </a>
            </div>
            {error?.digest && (
              <p style={{ fontSize: 11, color: "#9a9590", marginTop: 20 }}>Error reference: {error.digest}</p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}