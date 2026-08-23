import { apiUrl } from "./api";

export interface CurrentUser {
  id: string;
  email: string;
  created_at: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

let accessToken: string | null = null;
let currentUser: CurrentUser | null = null;
let authStatus: AuthStatus = "loading";
let refreshInFlight: Promise<string | null> | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeAuth(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAuthStatus(): AuthStatus {
  return authStatus;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getCurrentUser(): CurrentUser | null {
  return currentUser;
}

export function setCurrentUser(user: CurrentUser | null): void {
  currentUser = user;
}

function applyAuthenticated(token: string, user: CurrentUser | null): void {
  accessToken = token;
  if (user) {
    currentUser = user;
  }
  authStatus = "authenticated";
  notify();
}

function applyUnauthenticated(): void {
  accessToken = null;
  currentUser = null;
  authStatus = "unauthenticated";
  notify();
}

async function persistRefreshToken(refreshToken: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/auth/set-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: "same-origin",
    });
  } catch {
    throw new Error("Could not start your session. Check your connection and try again.");
  }

  if (!res.ok) {
    throw new Error("Could not start your session. Please try again.");
  }
}

async function parseErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error?.message === "string") {
      return data.error.message;
    }
    if (typeof data?.detail === "string") {
      return data.detail;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function toAuthError(err: unknown): Error {
  if (err instanceof TypeError) {
    return new Error("Can't reach the server right now. Check your connection and try again.");
  }
  return err instanceof Error ? err : new Error("Something went wrong. Please try again.");
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  let res: Response;
  try {
    res = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw toAuthError(err);
  }

  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Login failed."));
  }

  const data = await res.json();
  try {
    await persistRefreshToken(data.refresh_token);
  } catch (err) {
    applyUnauthenticated();
    throw err;
  }
  applyAuthenticated(data.access_token, data.user);
  return data.user;
}

export async function register(email: string, password: string): Promise<CurrentUser> {
  let res: Response;
  try {
    res = await fetch(apiUrl("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw toAuthError(err);
  }

  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Registration failed."));
  }

  const data = await res.json();
  try {
    await persistRefreshToken(data.refresh_token);
  } catch (err) {
    applyUnauthenticated();
    throw err;
  }
  applyAuthenticated(data.access_token, data.user);
  return data.user;
}

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST", signal: AbortSignal.timeout(12000) });
    if (res.status === 401) {
      applyUnauthenticated();
      return null;
    }
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    applyAuthenticated(data.access_token, data.user ?? null);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
  }
  applyUnauthenticated();
}

export async function bootstrapSession(): Promise<CurrentUser | null> {
  if (authStatus === "authenticated" && currentUser) {
    return currentUser;
  }
  const token = await refreshAccessToken();
  if (!token) {
    return null;
  }
  return getCurrentUser();
}