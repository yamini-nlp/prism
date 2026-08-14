"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { isNoChromeRoute, pageTitleForPath } from "@/lib/navigation";
import { useUIStore } from "@/lib/store";
import BackendStatus from "@/components/BackendStatus";

export default function Topbar() {
  const pathname = usePathname();
  const mobileDrawerOpen = useUIStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useUIStore((s) => s.setMobileDrawerOpen);
  const title = pageTitleForPath(pathname || "/");

  if (isNoChromeRoute(pathname || "/")) return null;

  return (
    <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-glass)] px-4 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={() => setMobileDrawerOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileDrawerOpen}
        aria-controls="mobile-drawer"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] outline-none transition-colors hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <Menu size={17} aria-hidden="true" />
      </button>

      <h1 className="min-w-0 flex-1 truncate font-display text-base text-[var(--text-primary)]">
        {title}
      </h1>

      <BackendStatus compact />

      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--bg-base)] text-[11px] font-semibold text-[var(--text-secondary)]">
        <span aria-hidden="true">U</span>
        <span className="sr-only">User menu</span>
      </div>
    </header>
  );
}