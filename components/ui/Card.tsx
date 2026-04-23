import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
