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

export function IconCircle({
  icon: Icon,
  className,
  iconClassName,
  size = "default",
}: IconCircleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center border border-foreground bg-background text-foreground",
        "transition-colors duration-100 group-hover:bg-foreground group-hover:text-background",
        size === "default" ? "h-12 w-12" : "h-14 w-14",
        className,
      )}
    >
      <Icon
        className={cn(size === "default" ? "h-5 w-5" : "h-6 w-6", iconClassName)}
        strokeWidth={1.5}
      />
    </div>
  );
}
