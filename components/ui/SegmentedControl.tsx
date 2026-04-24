"use client";

import type { ReactNode } from "react";

type Option<T extends string> = {
  value: T;
  label: ReactNode;
};

type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<Option<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex p-1 bg-zinc-100 rounded-full ${className}`}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
              selected
                ? "bg-white text-black shadow-sm"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
