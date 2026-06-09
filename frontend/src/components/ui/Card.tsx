import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-black/[0.06] bg-white/90 shadow-card backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
