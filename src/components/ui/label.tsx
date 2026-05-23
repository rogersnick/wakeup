import { cn } from "@/lib/utils";
import type { LabelHTMLAttributes } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-semibold uppercase tracking-wider text-foreground",
        className,
      )}
      {...props}
    />
  );
}
