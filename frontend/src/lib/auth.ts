import { apiUrl } from "./api";

export interface CurrentUser {
  id: string;
  email: string;
  created_at: string;
}

let accessToken: string | null = null;
let currentUser: CurrentUser | null = null;
let refreshInFlight: Promise<string | null> | null = null;

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
  setAccessToken(data.access_token);
  setCurrentUser(data.user);
  try {
    await persistRefreshToken(data.refresh_token);
  } catch (err) {
    setAccessToken(null);
    setCurrentUser(null);
    throw err;
  }
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
  setAccessToken(data.access_token);
  setCurrentUser(data.user);
  try {
    await persistRefreshToken(data.refresh_token);
  } catch (err) {
    setAccessToken(null);
    setCurrentUser(null);
    throw err;
  }
  return data.user;
}

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) {
      setAccessToken(null);
      setCurrentUser(null);
      return null;
    }
    const data = await res.json();
    setAccessToken(data.access_token);
    if (data.user) {
      setCurrentUser(data.user);
    }
    return data.access_token;
  } catch {
    setAccessToken(null);
    setCurrentUser(null);
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
  setAccessToken(null);
  setCurrentUser(null);
}

export async function bootstrapSession(): Promise<CurrentUser | null> {
  const token = await refreshAccessToken();
  if (!token) {
    return null;
  }
  return getCurrentUser();
}