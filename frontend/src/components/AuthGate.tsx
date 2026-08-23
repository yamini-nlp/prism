"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bootstrapSession, getAuthStatus, subscribeAuth } from "@/lib/auth";
import { isAuthRoute, isProtectedPath, sanitizeRedirectPath } from "@/lib/routes";

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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

  useEffect(() => {
    if (status === "loading") {
      bootstrapSession();
    }
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
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
