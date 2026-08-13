"use client";

import { Suspense, useState } from "react";
import type { CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { login } from "@/lib/auth";
import { toast } from "@/lib/toast";
import { loginSchema, type LoginFormValues } from "@/lib/validation/schemas";

const SERIF = "var(--font-display, 'DM Serif Display', Georgia, serif)";
const SANS = "var(--font-sans, 'Syne', system-ui, sans-serif)";
const MONO = "var(--font-mono, 'JetBrains Mono', monospace)";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.04)",
  color: "#ffffff",
  fontSize: 14,
  outline: "none",
  fontFamily: SANS,
};

const inputErrorStyle: CSSProperties = {
  ...inputStyle,
  borderColor: "rgba(255,90,90,0.6)",
};

const fieldErrorStyle: CSSProperties = {
  fontSize: 11.5,
  color: "#ff8080",
  fontWeight: 600,
};

function LoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email.trim(), values.password);
      toast.success("Signed in", "Welcome back to Prism.");
      const from = searchParams.get("from");
      window.location.href = from && from.startsWith("/") ? from : "/dashboard";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      toast.error("Could not sign in", message);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        color: "#ffffff",
        fontFamily: SANS,
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: rgba(255,255,255,0.22); }
        input::placeholder { color: rgba(255,255,255,0.32); }
        input:focus { border-color: rgba(255,255,255,0.5) !important; background: rgba(255,255,255,0.06) !important; }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 30%, black 10%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Link
        href="/"
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={14} color="#000000" strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: SERIF, fontSize: 19, color: "#ffffff" }}>Prism</span>
      </Link>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: "40px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 30, letterSpacing: "-0.02em", marginBottom: 8 }}>
            Sign in to Prism
          </div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.46)" }}>Access your research workspace.</div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span
            style={{
              fontSize: 10.5,
              fontFamily: MONO,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Email
          </span>
          <input
            type="email"
            style={errors.email ? inputErrorStyle : inputStyle}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          {errors.email && <span style={fieldErrorStyle}>{errors.email.message}</span>}
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span
            style={{
              fontSize: 10.5,
              fontFamily: MONO,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Password
          </span>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              style={{ ...(errors.password ? inputErrorStyle : inputStyle), paddingRight: 42 }}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                display: "flex",
                padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span style={fieldErrorStyle}>{errors.password.message}</span>}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: 6,
            padding: "13px 12px",
            borderRadius: 10,
            border: "none",
            background: "#ffffff",
            color: "#000000",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: SANS,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isSubmitting && <Loader2 size={15} className="prism-spin" />}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.46)", textAlign: "center" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "#ffffff", fontWeight: 700, textDecoration: "none" }}>
            Create one
          </Link>
        </div>
      </form>

      <style>{`
        .prism-spin { animation: prism-spin 0.8s linear infinite; }
        @keyframes prism-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}