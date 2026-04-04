"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Upload, BookOpen, MessageSquare,
  GitBranch, ShieldCheck, BarChart3, Settings, Zap,
} from "lucide-react";

const links = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/ingest",       label: "Ingest",       icon: Upload },
  { href: "/library",      label: "Library",      icon: BookOpen },
  { href: "/workspace",    label: "Workspace",    icon: MessageSquare },
  { href: "/source-trace", label: "Source Trace", icon: GitBranch },
  { href: "/verification", label: "Verification", icon: ShieldCheck },
  { href: "/evaluation",   label: "Evaluation",   icon: BarChart3 },
  { href: "/settings",     label: "Settings",     icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      minHeight: "100vh",
      background: "#ffffff",
      borderRight: "1px solid rgba(0,0,0,0.08)",
      padding: "28px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 28, paddingLeft: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30,
            background: "#111110",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 20,
            color: "#111110",
            letterSpacing: "-0.01em",
          }}>
            Prism
          </span>
        </div>
      </Link>

      {/* Nav label */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
        textTransform: "uppercase", color: "#999590",
        paddingLeft: 12, marginBottom: 6,
      }}>
        Navigation
      </div>

      {/* Links */}
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <motion.div
              whileHover={{ x: active ? 0 : 2 }}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? "#ffffff" : "#5c5a56",
                background: active ? "#111110" : "transparent",
                transition: "background 0.16s, color 0.16s",
                cursor: "pointer",
              }}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              {label}
            </motion.div>
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Footer tag */}
      <div style={{
        padding: "11px 13px",
        borderRadius: 8,
        background: "#f7f6f3",
        border: "1px solid rgba(0,0,0,0.07)",
        marginTop: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#5c5a56", marginBottom: 3 }}>
          Prism v1.0
        </div>
        <div style={{ fontSize: 10, color: "#999590", lineHeight: 1.5 }}>
          Research intelligence platform
        </div>
      </div>
    </aside>
  );
}