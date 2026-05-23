import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-blue-600 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  secondary:
    "bg-muted text-foreground hover:bg-gray-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  outline:
    "border-4 border-primary bg-transparent text-primary hover:bg-primary hover:text-white hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 hover:scale-105 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  default: "h-12 px-5 text-sm",
  lg: "h-14 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
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
