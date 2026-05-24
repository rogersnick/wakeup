import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type CardVariant = "default" | "muted" | "primary" | "secondary" | "accent" | "success";

type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  interactive?: boolean;
};

/**
 * Voice-card style: square corners, 2px border, no hard offset shadow,
 * fast color transitions. Variants use tinted borders instead of sticker shadows.
 */
const variantClasses: Record<CardVariant, string> = {
  default: "bg-background text-foreground border border-border-light",
  muted: "bg-muted text-foreground border border-border-light",
  primary: "bg-background text-foreground border-2 border-border",
  secondary: "bg-background text-foreground border border-border-light",
  accent: "bg-background text-foreground border border-border-light",
  success: "bg-background text-foreground border border-border-light",
};

export function Card({
  className,
  variant = "default",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        "p-6 transition-colors duration-100",
        variantClasses[variant],
        interactive && ["group cursor-pointer", "hover:border-foreground"],
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-sans text-lg font-bold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-base leading-7 text-muted-foreground", className)}
      {...props}
    />
  );
}

type CardPanelProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
};

/** Bordered inner panel matching the voice-card grid spacing. */
export function CardPanel({
  className,
  variant = "default",
  ...props
}: CardPanelProps) {
  return (
    <div
      className={cn(
        "grid gap-4 border p-5 transition-colors duration-100",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

type SelectableCardProps = HTMLAttributes<HTMLElement> & {
  selected?: boolean;
};

/** Selectable card with full foreground/background inversion when active. */
export function SelectableCard({
  className,
  selected = false,
  ...props
}: SelectableCardProps) {
  return (
    <div
      className={cn(
        "grid gap-4 border p-5 transition-colors duration-100",
        selected
          ? "border-brand bg-brand/12 text-foreground"
          : "border-border bg-background text-foreground hover:border-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardEyebrow({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "block font-sans text-xs font-bold uppercase tracking-widest opacity-70",
        className,
      )}
      {...props}
    />
  );
}
