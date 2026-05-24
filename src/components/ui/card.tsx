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
  default: "bg-background text-foreground border-2 border-border",
  muted: "bg-muted text-foreground border-2 border-border",
  primary: "bg-background text-foreground border-2 border-primary",
  secondary: "bg-background text-foreground border-2 border-secondary",
  accent: "bg-background text-foreground border-2 border-accent",
  success: "bg-background text-foreground border-2 border-quaternary",
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
      className={cn("mt-1 text-sm leading-6 text-muted-foreground", className)}
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
        "grid gap-4 border-2 p-5 transition-colors duration-100",
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
        "grid gap-4 border-2 p-5 transition-colors duration-100",
        selected
          ? "border-foreground bg-foreground text-background"
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
