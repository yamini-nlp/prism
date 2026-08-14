export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/ingest",
  "/library",
  "/workspace",
  "/source-trace",
  "/verification",
  "/evaluation",
  "/settings",
] as const;

export const AUTH_ROUTES = ["/login", "/register"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}