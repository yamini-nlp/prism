export type BackendHealthStatus = "checking" | "online" | "offline";

let status: BackendHealthStatus = "checking";
let pollToken = 0;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeBackendHealth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBackendHealthStatus(): BackendHealthStatus {
  return status;
}

async function pingOnce(timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetch("/api/health", {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function cancelBackendWait(): void {
  pollToken += 1;
}

export async function waitForBackend(
  maxWaitMs = 100000,
  intervalMs = 3000,
  attemptTimeoutMs = 8000
): Promise<boolean> {
  const token = ++pollToken;
  status = "checking";
  notify();

  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    if (token !== pollToken) return false;
    const ok = await pingOnce(attemptTimeoutMs);
    if (token !== pollToken) return false;
    if (ok) {
      status = "online";
      notify();
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  if (token !== pollToken) return false;
  status = "offline";
  notify();
  return false;
}