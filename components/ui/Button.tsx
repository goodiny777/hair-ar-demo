"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-black text-white hover:bg-zinc-800 active:bg-zinc-900 disabled:bg-zinc-400",
  secondary:
    "bg-white text-black border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 disabled:text-zinc-400",
  ghost:
    "bg-transparent text-white hover:bg-white/10 active:bg-white/20 disabled:text-white/40",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:cursor-not-allowed select-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  );
}
