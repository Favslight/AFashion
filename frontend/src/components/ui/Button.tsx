import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "dark" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-fuchsiaBrand text-white shadow-pink hover:-translate-y-0.5 hover:bg-[#de0876] focus-visible:outline-fuchsiaBrand",
  secondary:
    "border border-black/10 bg-white text-charcoal shadow-soft hover:-translate-y-0.5 hover:border-fuchsiaBrand/30 focus-visible:outline-fuchsiaBrand",
  dark:
    "bg-charcoal text-white shadow-soft hover:-translate-y-0.5 hover:bg-black focus-visible:outline-white",
  ghost:
    "bg-transparent text-charcoal hover:bg-black/[0.04] focus-visible:outline-fuchsiaBrand",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />;
}
