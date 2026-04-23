"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
};

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "До",
  afterLabel = "После",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(0.5);
  const draggingRef = useRef(false);

  const move = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = (clientX - rect.left) / rect.width;
    setPosition(Math.max(0, Math.min(1, p)));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      move(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      if (e.touches.length === 0) return;
      move(e.touches[0].clientX);
    };
    const stop = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stop);
    };
  }, [move]);

  const pct = `${(position * 100).toFixed(1)}%`;

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full max-w-md rounded-3xl overflow-hidden bg-zinc-900 select-none touch-none"
      onMouseDown={(e) => {
        draggingRef.current = true;
        move(e.clientX);
      }}
      onTouchStart={(e) => {
        draggingRef.current = true;
        if (e.touches.length > 0) move(e.touches[0].clientX);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterSrc}
        alt="После"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position * 100}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt="До"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
        style={{ left: pct }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none"
        style={{ left: `calc(${pct} - 1.25rem)` }}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M8 5l-5 7 5 7v-14zM16 5l5 7-5 7V5z" />
        </svg>
      </div>
      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-white text-xs">
        {beforeLabel}
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-xs">
        {afterLabel}
      </div>
    </div>
  );
}
