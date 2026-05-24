import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "accent" | "success" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default:   "bg-border text-muted-foreground border border-border",
  primary:   "bg-primary/20 text-primary border border-primary/40",
  secondary: "bg-secondary/20 text-secondary border border-secondary/40",
  accent:    "bg-accent/20 text-accent border border-accent/40",
  success:   "bg-quaternary/20 text-quaternary border border-quaternary/40",
  warning:   "bg-accent/20 text-accent border border-accent/40",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1",
        "text-xs font-bold uppercase tracking-wider",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
