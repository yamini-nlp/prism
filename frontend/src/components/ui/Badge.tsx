import type { HTMLAttributes } from "react";
import { badgeVariants, type BadgeTone } from "@/lib/styles";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export default function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return <span className={badgeVariants({ tone, className })} {...rest} />;
}