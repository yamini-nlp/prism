import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  circle?: boolean;
}

export default function Skeleton({ circle = false, className, ...rest }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx("relative overflow-hidden bg-[var(--border)]", circle ? "rounded-full" : "rounded-sm", className)}
      {...rest}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--bg-surface)]/60 to-transparent" />
    </div>
  );
}
