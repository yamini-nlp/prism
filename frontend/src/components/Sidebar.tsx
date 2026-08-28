"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { bootstrapSession, getCurrentUser, logout, type CurrentUser } from "@/lib/auth";
import { isNoChromeRoute, navLinks } from "@/lib/navigation";
import { useUIStore } from "@/lib/store";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(getCurrentUser());
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      bootstrapSession().then((restored) => {
        if (restored) setUser(restored);
      });
    }
  }, [user]);

  async function handleLogout() {
    await logout();
    setUser(null);
    router.push("/login");
  }

  if (isNoChromeRoute(pathname || "/")) return null;

  function handleNavKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const items = navRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-nav-link]");
    if (!items || items.length === 0) return;
    const list = Array.from(items);
    const currentIndex = list.findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = list[(currentIndex + 1 + list.length) % list.length];
      next.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = list[(currentIndex - 1 + list.length) % list.length];
      prev.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      list[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      list[list.length - 1].focus();
    }
  }

  return (
    <aside
      aria-label="Sidebar"
      className={`hidden lg:flex lg:h-full lg:flex-shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-white/15 lg:bg-black lg:shadow-[4px_0_24px_rgba(0,0,0,0.35)] lg:transition-[width] lg:duration-200 lg:ease-premium ${
        collapsed ? "lg:w-[76px]" : "lg:w-72"
      }`}
    >
      <div
        className="flex h-20 flex-shrink-0 items-center border-b border-white/15"
        style={collapsed ? { justifyContent: "center", paddingLeft: 0, paddingRight: 0 } : { paddingLeft: 32, paddingRight: 32 }}
      >
        <Link
          href="/"
          prefetch={false}
          aria-label={collapsed ? "Prism — go to home" : undefined}
          className="flex items-center gap-3 no-underline"
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(100deg, #e8c547, #ef6f8e 38%, #2bbfa3 68%, #5a8fef)" }}
          >
            <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <polygon points="50,18 20,74 80,74" fill="#0a0a0d" />
              <line x1="4" y1="50" x2="20" y2="50" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-display text-2xl leading-none tracking-tight text-white">PRISM</span>
          )}
        </Link>
      </div>

      <div
        className="flex flex-1 flex-col overflow-y-auto py-8"
        style={collapsed ? { paddingLeft: 12, paddingRight: 12 } : { paddingLeft: 32, paddingRight: 16 }}
      >

        <nav id="sidebar-nav" aria-label="Primary navigation" className="relative flex flex-col gap-1.5">
          <div
            ref={navRef}
            onKeyDown={handleNavKeyDown}
            role="toolbar"
            aria-orientation="vertical"
            aria-label="Primary navigation links"
            className="contents"
          >
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  data-nav-link
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  style={collapsed ? { justifyContent: "center", paddingLeft: 0, paddingRight: 0 } : { paddingLeft: 16, paddingRight: 12 }}
                  className={`relative z-10 flex h-12 items-center gap-3.5 rounded-xl text-[14px] font-medium leading-none no-underline outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    active
                      ? "text-white"
                      : "text-white/95 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-0 -z-10 rounded-xl bg-[var(--accent-light)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={18} strokeWidth={active ? 2.25 : 2} aria-hidden="true" className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <div
        className="flex flex-shrink-0 flex-col gap-3 border-t border-white/15 py-5"
        style={collapsed ? { paddingLeft: 12, paddingRight: 12 } : { paddingLeft: 32, paddingRight: 24 }}
      >
        {user && !collapsed && (
          <div className="flex items-center justify-between gap-3 rounded-xl py-2.5" style={{ paddingLeft: 12, paddingRight: 12 }}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-[12.5px] font-semibold text-white">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 truncate text-[13px] font-medium text-white/95">
                {user.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-white/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {user && collapsed && (
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="flex h-11 w-full items-center justify-center rounded-xl text-white/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        )}

        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="sidebar-nav"
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-xl text-white/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          {collapsed ? <ChevronsRight size={15} aria-hidden="true" /> : <ChevronsLeft size={15} aria-hidden="true" />}
          {!collapsed && <span className="text-[12px] font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
