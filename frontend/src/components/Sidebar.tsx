"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut, Zap } from "lucide-react";
import { bootstrapSession, getCurrentUser, logout, type CurrentUser } from "@/lib/auth";
import { navLinks } from "@/lib/navigation";
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
      className={`hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-neutral-200 lg:bg-neutral-0 lg:py-7 lg:transition-[width] lg:duration-200 lg:ease-premium ${
        collapsed ? "lg:w-[76px] lg:px-2" : "lg:w-[220px] lg:px-3.5"
      }`}
    >
      <Link
        href="/"
        className={`mb-7 flex items-center gap-2.5 no-underline ${collapsed ? "justify-center px-0" : "pl-3"}`}
      >
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-sm bg-neutral-950">
          <Zap size={15} color="#fff" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-display text-xl tracking-tight text-neutral-950">Prism</span>
        )}
      </Link>

      {!collapsed && (
        <div className="mb-1.5 pl-3 text-[10px] font-bold uppercase tracking-[0.10em] text-neutral-500">
          Navigation
        </div>
      )}

      <div ref={navRef} onKeyDown={handleNavKeyDown} className="relative flex flex-col gap-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              data-nav-link
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={`relative z-10 flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-[13px] font-medium no-underline outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-400 ${
                collapsed ? "justify-center px-0" : ""
              } ${active ? "font-semibold text-neutral-0" : "text-neutral-700 hover:text-neutral-950"}`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 -z-10 rounded-sm bg-neutral-950"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              {!collapsed && label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />

      {user && !collapsed && (
        <div className="mb-2 flex items-center justify-between rounded-sm border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <div className="max-w-[132px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-neutral-700">
            {user.email}
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-xs border-none bg-transparent text-neutral-700 outline-none transition-colors hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}

      {user && collapsed && (
        <button
          onClick={handleLogout}
          title="Log out"
          className="mb-2 flex h-[34px] items-center justify-center rounded-sm border border-neutral-200 bg-neutral-50 text-neutral-700 outline-none transition-colors hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <LogOut size={14} />
        </button>
      )}

      {!collapsed && (
        <div className="mt-3 rounded-sm border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
          <div className="mb-0.5 text-[11px] font-semibold text-neutral-700">Prism v1.0</div>
          <div className="text-[10px] leading-normal text-neutral-500">Research intelligence platform</div>
        </div>
      )}

      <button
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className="mt-3 flex h-[30px] w-full items-center justify-center rounded-sm border border-neutral-200 bg-neutral-0 text-neutral-500 outline-none transition-colors hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
      </button>
    </aside>
  );
}