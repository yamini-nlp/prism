"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { inputVariants } from "@/lib/styles";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, disabled, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const state = error ? "invalid" : disabled ? "disabled" : "default";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && <span className="pointer-events-none absolute left-3 flex items-center text-neutral-500">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={inputVariants({ state, className: [leftIcon ? "pl-9" : "", className] })}
          {...rest}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, disabled, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const state = error ? "invalid" : disabled ? "disabled" : "default";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={inputVariants({ state, className: ["min-h-[160px] resize-y leading-relaxed", className] })}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;