import {
  LayoutDashboard, Upload, BookOpen, MessageSquare,
  GitBranch, ShieldCheck, BarChart3, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navLinks: NavLink[] = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/ingest",       label: "Ingest",       icon: Upload },
  { href: "/library",      label: "Library",      icon: BookOpen },
  { href: "/workspace",    label: "Workspace",    icon: MessageSquare },
  { href: "/source-trace", label: "Source Trace", icon: GitBranch },
  { href: "/verification", label: "Verification", icon: ShieldCheck },
  { href: "/evaluation",   label: "Evaluation",   icon: BarChart3 },
  { href: "/settings",     label: "Settings",     icon: Settings },
];

export function pageTitleForPath(pathname: string): string {
  const match = navLinks.find(l => l.href === pathname);
  if (match) return match.label;
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/paper-summary")) return "Paper Summary";
  if (pathname.startsWith("/login")) return "Log In";
  if (pathname.startsWith("/register")) return "Register";
  return "Prism";
}