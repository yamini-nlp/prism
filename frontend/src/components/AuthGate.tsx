"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { applyUnauthenticated, bootstrapSession, getAuthStatus, subscribeAuth } from "@/lib/auth";
import { isAuthRoute, isProtectedPath, sanitizeRedirectPath } from "@/lib/routes";

const ATTEMPT_TIMEOUT_MS = 55000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 2000;

function LoadingScreen({ attempt, onRetry }: { attempt: number; onRetry?: () => void }) {
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
        padding: 24,
        textAlign: "center",
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 320 }}>
          Waking up the server. First load after a period of inactivity can take up to a minute.
        </span>
        {attempt > 1 && (
          <span style={{ fontSize: 12, color: "var(--text-secondary)", opacity: 0.7 }}>
            Attempt {attempt} of {MAX_ATTEMPTS}
          </span>
        )}
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
  const [attempt, setAttempt] = useState(1);
  const retryTokenRef = useRef(0);

  const withTimeout = useCallback(function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
    return Promise.race([
      promise,
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), ms)),
    ]);
  }, []);

  const runBootstrapLoop = useCallback(() => {
    const token = ++retryTokenRef.current;
    let currentAttempt = 1;
    setAttempt(1);

    async function attemptBootstrap() {
      if (retryTokenRef.current !== token) return;
      await withTimeout(bootstrapSession(), ATTEMPT_TIMEOUT_MS);
      if (retryTokenRef.current !== token) return;
      if (getAuthStatus() !== "loading") return;
      if (currentAttempt >= MAX_ATTEMPTS) {
        applyUnauthenticated();
        return;
      }
      currentAttempt += 1;
      setAttempt(currentAttempt);
      setTimeout(attemptBootstrap, RETRY_DELAY_MS);
    }

    attemptBootstrap();
  }, [withTimeout]);

  useEffect(() => {
    if (status !== "loading") return;
    runBootstrapLoop();
    return () => {
      retryTokenRef.current += 1;
    };
  }, [status, runBootstrapLoop]);

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
        attempt={attempt}
        onRetry={() => {
          runBootstrapLoop();
        }}
      />
    );
  }

  return <>{children}</>;
}