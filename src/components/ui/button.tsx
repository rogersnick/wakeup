import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Primary = "Candy Button": pill shape, hard offset shadow, translates on hover/active.
 * Secondary = outline pill, floods with yellow on hover.
 * Bounce easing applied globally via the duration-300 class.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-primary text-primary-foreground font-bold",
    "border-2 border-[#6d28d9]",
    "shadow-[4px_4px_0px_0px_#4c1d95]",
    "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#4c1d95]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#4c1d95]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ].join(" "),

  secondary: [
    "bg-transparent text-foreground font-bold",
    "border-2 border-border",
    "hover:bg-accent hover:text-accent-foreground hover:border-[#92400e]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ].join(" "),

  outline: [
    "bg-transparent text-primary font-bold",
    "border-2 border-primary",
    "shadow-[4px_4px_0px_0px_#4c1d95]",
    "hover:bg-primary hover:text-primary-foreground",
    "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#4c1d95]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#4c1d95]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ].join(" "),

  ghost: [
    "bg-transparent text-foreground",
    "hover:bg-muted",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ].join(" "),

  destructive: [
    "bg-red-950/60 text-red-400 font-bold",
    "border-2 border-red-800/60",
    "shadow-[4px_4px_0px_0px_#450a0a]",
    "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#450a0a]",
    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#450a0a]",
    "focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:      "h-9 px-4 text-sm",
  default: "h-11 px-5 text-sm",
  lg:      "h-14 px-7 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "default", type = "button", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
