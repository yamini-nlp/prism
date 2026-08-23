"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bootstrapSession, getAuthStatus, subscribeAuth } from "@/lib/auth";
import { isAuthRoute, isProtectedPath, sanitizeRedirectPath } from "@/lib/routes";

function LoadingScreen({ stuck, onRetry }: { stuck?: boolean; onRetry?: () => void }) {
  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <div
        role="status"
        aria-label="Loading"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px solid var(--border)",
          borderTopColor: "var(--text-primary)",
          animation: "prism-auth-gate-spin 0.8s linear infinite",
        }}
      />
      {stuck && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Still trying to reach the server. It may be waking up from sleep.
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              Retry now
            </button>
          )}
        </div>
      )}
      <style>{`
        @keyframes prism-auth-gate-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useSyncExternalStore(subscribeAuth, getAuthStatus, () => "loading" as const);
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      setStuck(false);
      return;
    }

    let cancelled = false;
    let attempt = 0;
    const MAX_ATTEMPTS = 8;

    function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
      return Promise.race([
        promise,
        new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), ms)),
      ]);
    }

    async function attemptBootstrap() {
      if (cancelled) return;
      await withTimeout(bootstrapSession(), 15000);
      if (cancelled) return;
      if (getAuthStatus() !== "loading") return;
      attempt += 1;
      if (attempt >= MAX_ATTEMPTS) {
        setStuck(true);
        return;
      }
      const delay = Math.min(2000 * attempt, 10000);
      setTimeout(attemptBootstrap, delay);
    }

    attemptBootstrap();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" && isProtectedPath(pathname)) {
      const params = new URLSearchParams({ from: sanitizeRedirectPath(pathname) });
      router.replace(`/login?${params.toString()}`);
      return;
    }

    if (status === "authenticated" && isAuthRoute(pathname)) {
      router.replace("/dashboard");
    }
  }, [status, pathname, router]);

  const isPendingProtectedAccess = isProtectedPath(pathname) && status !== "authenticated";
  const isPendingAuthRouteRedirect = isAuthRoute(pathname) && status === "authenticated";

  if (isPendingProtectedAccess || isPendingAuthRouteRedirect) {
    return (
      <LoadingScreen
        stuck={stuck}
        onRetry={() => {
          setStuck(false);
          bootstrapSession();
        }}
      />
    );
  }

  return <>{children}</>;
}