"use client";

import { useEffect, useRef, useState } from "react";
import { getHairSegmenter } from "@/lib/mediapipe-loader";
import { COLOR_PALETTE_RU } from "@/lib/recommendations";

type HairRecolorProps = {
  imageDataUrl: string;
};

type MaskState = {
  mask: Uint8Array;
  width: number;
  height: number;
};

export function HairRecolor({ imageDataUrl }: HairRecolorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const maskRef = useRef<MaskState | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void init();
    return () => {
      cancelled = true;
    };

    async function init() {
      const img = await loadImage(imageDataUrl);
      if (cancelled) return;
      imgRef.current = img;

      const segmenter = await getHairSegmenter();
      if (cancelled) return;
      const segResult = segmenter.segment(img);
      const categoryMask = segResult.categoryMask;
      if (!categoryMask) {
        console.warn("No hair mask available");
        return;
      }
      maskRef.current = {
        mask: categoryMask.getAsUint8Array(),
        width: categoryMask.width,
        height: categoryMask.height,
      };
      categoryMask.close();
      drawOriginal();
      setReady(true);
    }
  }, [imageDataUrl]);

  function drawOriginal() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
  }

  function applyColor(hex: string) {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const maskState = maskRef.current;
    if (!canvas || !img || !maskState) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const [tr, tg, tb] = hexToRgb(hex);

    // Mask may be a different resolution than canvas — rescale with nearest-neighbor.
    const maskW = maskState.width;
    const maskH = maskState.height;
    const mask = maskState.mask;
    const MASK_VALUE = 1;

    const scaleX = maskW / canvas.width;
    const scaleY = maskH / canvas.height;

    for (let y = 0; y < canvas.height; y++) {
      const maskY = Math.min(maskH - 1, (y * scaleY) | 0);
      for (let x = 0; x < canvas.width; x++) {
        const maskX = Math.min(maskW - 1, (x * scaleX) | 0);
        if (mask[maskY * maskW + maskX] !== MASK_VALUE) continue;
        const p = (y * canvas.width + x) * 4;
        const r = pixels[p];
        const g = pixels[p + 1];
        const b = pixels[p + 2];
        // Preserve original lightness by using it as a multiplier on the target color.
        // L = 0.299r + 0.587g + 0.114b  (Rec.601 luma)
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Blend: 40% target base + 60% tinted-by-luma. Gives natural-looking dye rather than flat paint.
        const blend = 0.75;
        pixels[p] = clamp(tr * luma * blend + r * (1 - blend));
        pixels[p + 1] = clamp(tg * luma * blend + g * (1 - blend));
        pixels[p + 2] = clamp(tb * luma * blend + b * (1 - blend));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function reset() {
    drawOriginal();
    setSelectedColor(null);
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative aspect-square w-full max-w-md rounded-3xl overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
        {!ready && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-zinc-600">Попробовать цвет</div>
          {selectedColor && (
            <button
              onClick={reset}
              className="text-xs text-zinc-500 underline"
            >
              Сбросить
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {COLOR_PALETTE_RU.map(({ color, label, swatch }) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(swatch);
                applyColor(swatch);
              }}
              disabled={!ready}
              aria-label={label}
              className={`w-11 h-11 rounded-full transition-transform active:scale-90 disabled:opacity-40 ${
                selectedColor === swatch ? "ring-4 ring-offset-2 ring-black" : "ring-1 ring-zinc-300"
              }`}
              style={{ background: swatch }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load fail"));
    img.src = src;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}
