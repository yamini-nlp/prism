"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { applyUnauthenticated, bootstrapSession, getAuthStatus, subscribeAuth } from "@/lib/auth";
import { isAuthRoute, isProtectedPath, sanitizeRedirectPath } from "@/lib/routes";
import { waitForBackend } from "@/lib/backend-health";

const BACKEND_WAIT_MS = 100000;
const BOOTSTRAP_ATTEMPT_TIMEOUT_MS = 20000;
const BOOTSTRAP_MAX_ATTEMPTS = 3;
const BOOTSTRAP_RETRY_DELAY_MS = 1500;

type Phase = "waking" | "signing-in" | "unreachable";

function LoadingScreen({ phase, onRetry }: { phase: Phase; onRetry: () => void }) {
  const message =
    phase === "waking"
      ? "Waking up the server. First load after a period of inactivity can take up to a minute."
      : phase === "signing-in"
      ? "Server is up — signing you in…"
      : "Can't reach the Prism server right now. It may still be waking up — please try again in a moment.";

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
          animation: phase === "unreachable" ? "none" : "prism-auth-gate-spin 0.8s linear infinite",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 320 }}>{message}</span>
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
  const [phase, setPhase] = useState<Phase>("waking");
  const runTokenRef = useRef(0);

  const withTimeout = useCallback(function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
    return Promise.race([
      promise,
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), ms)),
    ]);
  }, []);

  const runAuthFlow = useCallback(async () => {
    const token = ++runTokenRef.current;
    setPhase("waking");

    const backendUp = await waitForBackend(BACKEND_WAIT_MS);
    if (runTokenRef.current !== token) return;

    if (!backendUp) {
      setPhase("unreachable");
      return;
    }

    setPhase("signing-in");

    for (let attempt = 1; attempt <= BOOTSTRAP_MAX_ATTEMPTS; attempt += 1) {
      if (runTokenRef.current !== token) return;
      await withTimeout(bootstrapSession(), BOOTSTRAP_ATTEMPT_TIMEOUT_MS);
      if (runTokenRef.current !== token) return;
      if (getAuthStatus() !== "loading") return;
      if (attempt < BOOTSTRAP_MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, BOOTSTRAP_RETRY_DELAY_MS));
      }
    }

    if (runTokenRef.current !== token) return;
    if (getAuthStatus() === "loading") {
      setPhase("unreachable");
    }
  }, [withTimeout]);

  useEffect(() => {
    if (status !== "loading") return;
    runAuthFlow();
    return () => {
      runTokenRef.current += 1;
    };
  }, [status, runAuthFlow]);

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
        phase={phase}
        onRetry={() => {
          runAuthFlow();
        }}
      />
    );
  }

  return <>{children}</>;
}