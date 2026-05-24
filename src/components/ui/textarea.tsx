import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full bg-card px-3 py-2 text-sm text-foreground",
        "border-2 border-border",
        "transition-colors duration-100",
        "placeholder:text-muted-foreground",
        "focus:border-b-4 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
