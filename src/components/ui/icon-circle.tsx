import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type IconCircleSize = "default" | "lg";

type IconCircleVariant = "primary" | "secondary" | "accent" | "quaternary" | "muted";

type IconCircleProps = {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  size?: IconCircleSize;
  variant?: IconCircleVariant;
};

const variantClasses: Record<IconCircleVariant, { wrap: string; icon: string }> = {
  primary:    { wrap: "bg-primary/20 border-2 border-primary/50",    icon: "text-primary" },
  secondary:  { wrap: "bg-secondary/20 border-2 border-secondary/50", icon: "text-secondary" },
  accent:     { wrap: "bg-accent/20 border-2 border-accent/50",       icon: "text-accent" },
  quaternary: { wrap: "bg-quaternary/20 border-2 border-quaternary/50", icon: "text-quaternary" },
  muted:      { wrap: "bg-muted border-2 border-border",               icon: "text-muted-foreground" },
};

export function IconCircle({
  icon: Icon,
  className,
  iconClassName,
  size = "default",
  variant = "primary",
}: IconCircleProps) {
  const v = variantClasses[variant];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full",
        "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "group-hover:scale-110 group-hover:rotate-12",
        size === "default" ? "h-14 w-14" : "h-16 w-16",
        v.wrap,
        className,
      )}
    >
      <Icon
        className={cn(
          size === "default" ? "h-7 w-7" : "h-8 w-8",
          v.icon,
          iconClassName,
        )}
        strokeWidth={2.5}
      />
    </div>
  );
}
