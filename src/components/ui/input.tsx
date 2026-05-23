import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-12 w-full rounded-md bg-muted px-3 text-sm text-foreground transition-all duration-200 placeholder:text-gray-500 focus:border-2 focus:border-primary focus:bg-background focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
