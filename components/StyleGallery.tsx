"use client";

import type { StylePreset, FluxColor } from "@/lib/recommendations";
import { COLOR_PALETTE_RU } from "@/lib/recommendations";

type StyleGalleryProps = {
  styles: StylePreset[];
  selectedStyleId: string | null;
  selectedColor: FluxColor | null;
  onSelectStyle: (id: string) => void;
  onSelectColor: (color: FluxColor) => void;
};

export function StyleGallery({
  styles,
  selectedStyleId,
  selectedColor,
  onSelectStyle,
  onSelectColor,
}: StyleGalleryProps) {
  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      <div>
        <div className="text-sm font-medium text-zinc-700 mb-3">Рекомендуемые стрижки</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {styles.map((s) => {
            const selected = s.id === selectedStyleId;
            return (
              <button
                key={s.id}
                onClick={() => onSelectStyle(s.id)}
                className={`text-left p-3 rounded-2xl border transition-colors ${
                  selected
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 bg-white hover:border-zinc-400"
                }`}
              >
                <div className="font-medium text-sm">{s.title}</div>
                <div
                  className={`text-xs mt-1 ${
                    selected ? "text-white/70" : "text-zinc-500"
                  }`}
                >
                  {s.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-zinc-700 mb-3">Цвет волос</div>
        <div className="flex flex-wrap gap-3">
          {COLOR_PALETTE_RU.map(({ color, label, swatch }) => {
            const selected = color === selectedColor;
            return (
              <button
                key={color}
                onClick={() => onSelectColor(color)}
                aria-label={label}
                title={label}
                className={`w-11 h-11 rounded-full transition-transform active:scale-90 ${
                  selected
                    ? "ring-4 ring-offset-2 ring-black"
                    : "ring-1 ring-zinc-300"
                }`}
                style={{ background: swatch }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
