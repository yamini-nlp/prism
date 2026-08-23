"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { getAuthStatus, subscribeAuth } from "@/lib/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const previousStatusRef = useRef(getAuthStatus());

  useEffect(() => {
    const unsubscribe = subscribeAuth(() => {
      const status = getAuthStatus();
      if (status === "unauthenticated" && previousStatusRef.current !== "unauthenticated") {
        queryClient.clear();
      }
      previousStatusRef.current = status;
    });
    return unsubscribe;
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
