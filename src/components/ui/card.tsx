import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type CardVariant = "default" | "muted" | "primary" | "secondary" | "accent" | "success";

type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  interactive?: boolean;
};

const variantClasses: Record<CardVariant, string> = {
  default: "bg-background text-foreground",
  muted: "bg-muted text-foreground",
  primary: "bg-blue-50 text-foreground hover:bg-blue-100",
  secondary: "bg-emerald-50 text-foreground hover:bg-emerald-100",
  accent: "bg-amber-50 text-foreground hover:bg-amber-100",
  success: "bg-emerald-50 text-emerald-900",
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
        "rounded-lg p-6 shadow-none",
        variantClasses[variant],
        interactive &&
          "group cursor-pointer transition-all duration-200 hover:scale-[1.02]",
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
      className={cn("text-lg font-bold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm leading-6 text-gray-600", className)} {...props} />
  );
}
