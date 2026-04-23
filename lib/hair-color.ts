export type HairColorBucket =
  | "black"
  | "brunette"
  | "brown"
  | "blonde"
  | "red"
  | "gray";

export const HAIR_COLOR_LABEL_RU: Record<HairColorBucket, string> = {
  black: "Чёрный",
  brunette: "Тёмный шатен",
  brown: "Русый",
  blonde: "Блонд",
  red: "Рыжий",
  gray: "Седой",
};

export const HAIR_COLOR_SWATCH: Record<HairColorBucket, string> = {
  black: "#1A1A1A",
  brunette: "#3B2314",
  brown: "#6B4423",
  blonde: "#D4B27C",
  red: "#B8481F",
  gray: "#A9A9A9",
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s, l];
}

export function classifyHairColorFromPixels(
  pixels: Uint8ClampedArray,
  mask: Uint8Array,
  maskValue = 1,
): HairColorBucket {
  let count = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === maskValue) {
      const p = i * 4;
      sumR += pixels[p];
      sumG += pixels[p + 1];
      sumB += pixels[p + 2];
      count++;
    }
  }

  if (count === 0) return "brown"; // default when no hair detected

  const r = sumR / count;
  const g = sumG / count;
  const b = sumB / count;
  const [h, s, l] = rgbToHsl(r, g, b);

  // Low saturation + low lightness → black.
  if (l < 0.18) return "black";
  // Very high lightness + low saturation → gray.
  if (s < 0.15 && l > 0.55) return "gray";
  // Low saturation, mid lightness → gray-ish old hair.
  if (s < 0.12 && l >= 0.35 && l <= 0.55) return "gray";
  // Hue in the red/orange band with meaningful saturation → red.
  if ((h < 25 || h > 340) && s > 0.3 && l > 0.2 && l < 0.6) return "red";
  // Orange/yellow hue + light → blonde.
  if (h >= 25 && h < 55 && l > 0.45) return "blonde";
  // Dark brown range.
  if (l < 0.3) return "brunette";
  // Everything else → brown (русый).
  return "brown";
}

/** Extracts ImageData for a given canvas source and returns the hair color bucket. */
export function classifyHairColor(
  imageData: ImageData,
  mask: Uint8Array,
  maskValue = 1,
): HairColorBucket {
  return classifyHairColorFromPixels(imageData.data, mask, maskValue);
}
