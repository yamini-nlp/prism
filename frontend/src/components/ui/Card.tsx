import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cardVariants, type CardVariant } from "@/lib/styles";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: boolean;
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "flat", padding = true, interactive = false, className, ...rest },
  ref
) {
  return <div ref={ref} className={cardVariants({ variant, padding, interactive, className })} {...rest} />;
});

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...rest }: CardHeaderProps) {
  return <div className={`mb-4 flex items-center justify-between gap-3 ${className ?? ""}`} {...rest} />;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...rest }: CardTitleProps) {
  return <h3 className={`font-display text-lg text-neutral-950 ${className ?? ""}`} {...rest} />;
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...rest }: CardDescriptionProps) {
  return <p className={`text-sm text-neutral-600 ${className ?? ""}`} {...rest} />;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...rest }: CardContentProps) {
  return <div className={className} {...rest} />;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, ...rest }: CardFooterProps) {
  return <div className={`mt-4 flex items-center gap-3 ${className ?? ""}`} {...rest} />;
}

export default Card;