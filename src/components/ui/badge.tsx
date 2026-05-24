import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "accent" | "success" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "border border-border-light bg-muted text-muted-foreground",
  primary: "border border-[#ff6a00] bg-[#ff6a00]/10 text-[#ff6a00]",
  secondary: "border border-foreground bg-background text-foreground",
  accent: "border border-foreground bg-foreground text-background",
  success: "border border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]",
  warning: "border border-foreground bg-background text-foreground",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1",
        "font-mono text-xs font-medium uppercase tracking-widest",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
