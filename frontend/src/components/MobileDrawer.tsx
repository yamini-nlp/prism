"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Zap } from "lucide-react";
import { isNoChromeRoute, navLinks } from "@/lib/navigation";
import { useUIStore } from "@/lib/store";

export default function MobileDrawer() {
  const pathname = usePathname();
  const open = useUIStore((s) => s.mobileDrawerOpen);
  const setOpen = useUIStore((s) => s.setMobileDrawerOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [open, setOpen]);

  if (isNoChromeRoute(pathname || "/")) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
            className="absolute inset-0 bg-black/40"
          />
          <motion.div
            ref={panelRef}
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="absolute inset-y-0 left-0 flex w-[80vw] max-w-[280px] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-surface)] px-4 py-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-sm bg-[var(--text-primary)]">
                  <Zap size={15} color="var(--bg-surface)" strokeWidth={2.5} aria-hidden="true" />
                </div>
                <span className="font-display text-xl tracking-tight text-[var(--text-primary)]">Prism</span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Primary navigation" className="flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-[13px] font-medium no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 ${
                      active
                        ? "bg-[var(--text-primary)] font-semibold text-[var(--bg-surface)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
                    }`}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}