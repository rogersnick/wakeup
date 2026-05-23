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
        "min-h-28 w-full rounded-md bg-muted px-3 py-2 text-sm text-foreground transition-all duration-200 placeholder:text-gray-500 focus:border-2 focus:border-primary focus:bg-background focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
