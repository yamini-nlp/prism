"use client";

import { Suspense } from "react";
import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/lib/auth";
import { toast } from "@/lib/toast";
import { loginSchema, type LoginFormValues } from "@/lib/validation/schemas";

const inputStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};

const inputErrorStyle: CSSProperties = {
  ...inputStyle,
  borderColor: "#b3261e",
};

const buttonStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "none",
  background: "#111110",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const fieldErrorStyle: CSSProperties = {
  fontSize: 11.5,
  color: "#b3261e",
  fontWeight: 600,
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
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
      router.push(from && from.startsWith("/") ? from : "/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      toast.error("Could not sign in", message);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f6f3", padding: 24 }}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ width: 360, background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#111110" }}>
          Sign in to Prism
        </div>
        <div style={{ fontSize: 13, color: "#5c5a56" }}>Access your research workspace.</div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#5c5a56" }}>Email</span>
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

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#5c5a56" }}>Password</span>
          <input
            type="password"
            style={errors.password ? inputErrorStyle : inputStyle}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          {errors.password && <span style={fieldErrorStyle}>{errors.password.message}</span>}
        </label>

        <button type="submit" disabled={isSubmitting || !isValid} style={{ ...buttonStyle, opacity: isSubmitting || !isValid ? 0.7 : 1, cursor: isSubmitting || !isValid ? "not-allowed" : "pointer" }}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <div style={{ fontSize: 12, color: "#5c5a56" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "#111110", fontWeight: 600 }}>
            Create one
          </Link>
        </div>
      </form>
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