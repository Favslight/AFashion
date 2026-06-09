import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-fuchsiaBrand/15 bg-fuchsiaBrand/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsiaBrand",
        className,
      )}
      {...props}
    />
  );
}
