import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type IconCircleProps = {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  size?: "default" | "lg";
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
        "flex items-center justify-center rounded-full bg-white transition-transform duration-200 group-hover:scale-110",
        size === "default" ? "h-14 w-14" : "h-16 w-16",
        className,
      )}
    >
      <Icon
        className={cn("text-primary", size === "default" ? "h-7 w-7" : "h-8 w-8", iconClassName)}
        strokeWidth={2.25}
      />
    </div>
  );
}
