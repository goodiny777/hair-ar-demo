export type HairLength = "short" | "medium" | "long";

export const HAIR_LENGTH_LABEL_RU: Record<HairLength, string> = {
  short: "Короткие",
  medium: "Средние",
  long: "Длинные",
};

/**
 * Estimate hair length from mask bbox relative to face height.
 * Needs: the hair mask plus approximate face bounds (from face landmarks).
 *
 * faceHeight is the pixel distance from the top of the forehead (landmark 10)
 * to the chin (landmark 152). When hair extends significantly below the chin
 * it is long; around the chin it is medium; above it is short.
 */
export function estimateHairLength(
  mask: Uint8Array,
  width: number,
  height: number,
  faceTopY: number,
  faceBottomY: number,
  maskValue = 1,
): HairLength {
  let minY = height;
  let maxY = 0;
  let foundAny = false;

  for (let y = 0; y < height; y++) {
    const rowStart = y * width;
    let rowHas = false;
    for (let x = 0; x < width; x++) {
      if (mask[rowStart + x] === maskValue) {
        rowHas = true;
        break;
      }
    }
    if (rowHas) {
      foundAny = true;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (!foundAny) return "short";

  const faceHeight = faceBottomY - faceTopY;
  if (faceHeight <= 0) return "medium";

  // How far below the chin does hair extend, in units of face-height?
  const belowChin = Math.max(0, maxY - faceBottomY);
  const ratio = belowChin / faceHeight;

  if (ratio < 0.1) return "short";
  if (ratio < 0.6) return "medium";
  return "long";
}
