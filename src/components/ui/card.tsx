import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type CardVariant = "default" | "muted" | "primary" | "secondary" | "accent" | "success";

type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  interactive?: boolean;
};

/**
 * "Sticker Card": chunky 2px border, hard offset shadow, wiggle+scale on hover.
 * Shadow color shifts with the variant to create a confetti effect.
 */
const variantClasses: Record<CardVariant, string> = {
  default:   "bg-card text-foreground border-2 border-border shadow-[6px_6px_0px_0px_var(--border)]",
  muted:     "bg-muted text-foreground border-2 border-border",
  primary:   "bg-card text-foreground border-2 border-primary shadow-[6px_6px_0px_0px_#4c1d95]",
  secondary: "bg-card text-foreground border-2 border-secondary shadow-[6px_6px_0px_0px_#9d174d]",
  accent:    "bg-card text-foreground border-2 border-accent shadow-[6px_6px_0px_0px_#92400e]",
  success:   "bg-card text-foreground border-2 border-quaternary shadow-[6px_6px_0px_0px_#064e3b]",
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
        "rounded-xl p-6",
        variantClasses[variant],
        interactive && [
          "group cursor-pointer",
          "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "hover:-rotate-1 hover:scale-[1.02]",
        ],
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
