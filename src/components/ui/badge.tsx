import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "accent" | "success" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-gray-700",
  primary: "bg-blue-100 text-blue-800",
  secondary: "bg-emerald-100 text-emerald-800",
  accent: "bg-amber-100 text-amber-900",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
