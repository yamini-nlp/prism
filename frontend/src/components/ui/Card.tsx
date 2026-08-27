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

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...rest }: CardHeaderProps) {
  return <div className={`mb-4 flex items-center justify-between gap-3 ${className ?? ""}`} {...rest} />;
}

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className, children, ...rest }: CardTitleProps) {
  return (
    <h3 className={`font-display text-lg text-[var(--text-primary)] ${className ?? ""}`} {...rest}>
      {children}
    </h3>
  );
}

export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, ...rest }: CardDescriptionProps) {
  return <p className={`text-sm text-[var(--text-secondary)] ${className ?? ""}`} {...rest} />;
}

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...rest }: CardContentProps) {
  return <div className={className} {...rest} />;
}

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, ...rest }: CardFooterProps) {
  return <div className={`mt-4 flex items-center gap-3 ${className ?? ""}`} {...rest} />;
}

export default Card;
