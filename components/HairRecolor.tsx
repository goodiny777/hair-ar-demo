"use client";

import { useEffect, useRef, useState } from "react";
import { getHairSegmenter } from "@/lib/mediapipe-loader";
import { COLOR_PALETTE_RU } from "@/lib/recommendations";

type HairRecolorProps = {
  imageDataUrl: string;
};

type MaskState = {
  /** Confidence per mask-resolution pixel, already smoothed and thresholded. */
  alpha: Float32Array;
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

      const alpha = extractHairAlpha(segResult);
      if (!alpha) {
        console.warn("No hair mask available");
        return;
      }
      maskRef.current = alpha;
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
    const [, ts, tl] = rgbToHsl(tr, tg, tb);
    const th = rgbToHsl(tr, tg, tb)[0];

    const maskW = maskState.width;
    const maskH = maskState.height;
    const alpha = maskState.alpha;

    const scaleX = maskW / canvas.width;
    const scaleY = maskH / canvas.height;

    for (let y = 0; y < canvas.height; y++) {
      const my = (y * scaleY) | 0;
      const clampedMy = my < maskH ? my : maskH - 1;
      for (let x = 0; x < canvas.width; x++) {
        const mx = (x * scaleX) | 0;
        const clampedMx = mx < maskW ? mx : maskW - 1;
        const a = alpha[clampedMy * maskW + clampedMx];
        if (a <= 0) continue;

        const p = (y * canvas.width + x) * 4;
        const r = pixels[p];
        const g = pixels[p + 1];
        const b = pixels[p + 2];
        const [, ss, sl] = rgbToHsl(r, g, b);

        // Stay in HSL: take the target hue, blend saturation, and KEEP source
        // lightness so strand-level shading survives. Give very dark pixels a
        // small lift so jet-black doesn't swallow bright target colors.
        const newH = th;
        const newS = Math.min(1, ts * 0.85 + ss * 0.15);
        const newL = sl < 0.18 ? sl + (tl - sl) * 0.35 : sl;

        const [nr, ng, nb] = hslToRgb(newH, newS, newL);
        pixels[p] = clamp(r * (1 - a) + nr * a);
        pixels[p + 1] = clamp(g * (1 - a) + ng * a);
        pixels[p + 2] = clamp(b * (1 - a) + nb * a);
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

// ── helpers ────────────────────────────────────────────────────────────

type SegmentationResultLike = {
  categoryMask?: { width: number; height: number; getAsUint8Array: () => Uint8Array; close: () => void } | null;
  confidenceMasks?: Array<{
    width: number;
    height: number;
    getAsFloat32Array: () => Float32Array;
    close: () => void;
  }> | null;
};

/**
 * Extracts a smooth, eroded alpha mask for the "hair" class.
 *
 * We prefer confidence masks (float probabilities) because the binary category
 * mask gives a jagged hairline that visibly stains skin on the other side of
 * the boundary. Steps:
 *   1. Find the mask closest to "hair". For 2-class segmenters (bg/hair) this
 *      is typically index 1, but some model versions return a single mask.
 *   2. Apply a steep smoothstep so only high-confidence pixels paint, and the
 *      transition between 0 and 1 happens over a narrow band (→ soft edge,
 *      not blocky and not smeared).
 *   3. 3×3 box blur for sub-pixel feather at the edge.
 */
function extractHairAlpha(segResult: unknown): MaskState | null {
  const r = segResult as SegmentationResultLike;
  const confidenceMasks = r.confidenceMasks;

  let raw: Float32Array | null = null;
  let width = 0;
  let height = 0;

  if (confidenceMasks && confidenceMasks.length > 0) {
    // For a 2-class model, index 1 == hair. If there's only one mask it's
    // the foreground (hair) probability already.
    const idx = confidenceMasks.length > 1 ? 1 : 0;
    const m = confidenceMasks[idx];
    raw = m.getAsFloat32Array();
    width = m.width;
    height = m.height;
    for (const mm of confidenceMasks) mm.close();
  } else if (r.categoryMask) {
    // Fallback: use binary mask as 0/1 floats.
    const cm = r.categoryMask;
    const u8 = cm.getAsUint8Array();
    raw = new Float32Array(u8.length);
    for (let i = 0; i < u8.length; i++) raw[i] = u8[i] === 1 ? 1 : 0;
    width = cm.width;
    height = cm.height;
    cm.close();
  }

  if (!raw) return null;

  // Smoothstep threshold. Pixels below LOW are zeroed (so skin at the
  // hairline stays untouched); above HIGH go fully opaque; in between is the
  // soft transition.
  const LOW = 0.55;
  const HIGH = 0.92;
  const range = HIGH - LOW;
  const stepped = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    const v = raw[i];
    if (v <= LOW) {
      stepped[i] = 0;
    } else if (v >= HIGH) {
      stepped[i] = 1;
    } else {
      const t = (v - LOW) / range;
      // Cubic smoothstep: 3t² − 2t³
      stepped[i] = t * t * (3 - 2 * t);
    }
  }

  // Small box blur — 3×3, two passes — for sub-pixel feathering.
  const blurred = boxBlur(boxBlur(stepped, width, height, 1), width, height, 1);

  return { alpha: blurred, width, height };
}

function boxBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const out = new Float32Array(src.length);
  // Horizontal
  const tmp = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        const sx = x + dx;
        if (sx < 0 || sx >= w) continue;
        sum += src[y * w + sx];
        count++;
      }
      tmp[y * w + x] = count > 0 ? sum / count : 0;
    }
  }
  // Vertical
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const sy = y + dy;
        if (sy < 0 || sy >= h) continue;
        sum += tmp[sy * w + x];
        count++;
      }
      out[y * w + x] = count > 0 ? sum / count : 0;
    }
  }
  return out;
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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R:
        h = (G - B) / d + (G < B ? 6 : 0);
        break;
      case G:
        h = (B - R) / d + 2;
        break;
      case B:
        h = (R - G) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}
