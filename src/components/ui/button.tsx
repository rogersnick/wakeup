import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground",
  secondary: "border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background",
  outline: "border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
  ghost: "border-2 border-transparent bg-transparent text-foreground underline-offset-4 hover:underline",
  destructive: "border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-xs",
  default: "min-h-12 px-6 text-sm",
  lg: "min-h-14 px-8 text-sm",
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
          "inline-flex items-center justify-center",
          "font-mono font-medium uppercase tracking-widest",
          "transition-colors duration-100",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-3 focus-visible:outline-offset-3",
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
