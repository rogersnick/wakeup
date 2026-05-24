import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-12 w-full rounded-lg bg-card px-3 text-sm text-foreground",
          "border-2 border-border",
          "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "placeholder:text-muted-foreground",
          "focus:border-primary focus:outline-none focus:shadow-[4px_4px_0px_0px_#4c1d95]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
