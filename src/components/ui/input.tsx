import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-12 w-full bg-card px-3 text-sm text-foreground",
          "border-2 border-border",
          "transition-colors duration-100",
          "placeholder:text-muted-foreground",
          "focus:border-b-4 focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
