import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type AlertVariant = "success" | "error" | "info";

type AlertProps = HTMLAttributes<HTMLParagraphElement> & {
  variant?: AlertVariant;
};

const variantClasses: Record<AlertVariant, string> = {
  success: "text-quaternary",
  error:   "text-red-400",
  info:    "text-muted-foreground",
};

export function Alert({ className, variant = "info", ...props }: AlertProps) {
  return (
    <p
      className={cn("text-sm font-medium", variantClasses[variant], className)}
      {...props}
    />
  );
}
