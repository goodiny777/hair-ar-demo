import type { NormalizedLandmark } from "./mediapipe-loader";

export type Gender = "male" | "female";

export const GENDER_LABEL_RU: Record<Gender, string> = {
  male: "Мужчина",
  female: "Женщина",
};

/**
 * Heuristic gender estimate using the existing hair mask + face landmarks.
 * We look at the rectangle spanning the jaw just below the mouth. If it is
 * heavily covered by the "hair" mask it is almost always facial hair (beard,
 * stubble), which in our target demographic is a reliable proxy for male.
 * When the signal is weak we default to female — female is the more common
 * demographic for a salon tryout, so the default-off state for the toggle is
 * the one users will reach for less often.
 */
export function detectGender(
  mask: Uint8Array,
  maskWidth: number,
  maskHeight: number,
  landmarks: NormalizedLandmark[],
  maskValue = 1,
): Gender {
  // Landmark indices (MediaPipe Face Mesh):
  //   17  — bottom of lower lip
  //   152 — chin bottom
  //   172 — left jaw
  //   397 — right jaw
  const lipY = (landmarks[17]?.y ?? 0) * maskHeight;
  const chinY = (landmarks[152]?.y ?? 1) * maskHeight;
  const leftX = (landmarks[172]?.x ?? 0) * maskWidth;
  const rightX = (landmarks[397]?.x ?? 1) * maskWidth;

  const y0 = Math.max(0, Math.floor(lipY));
  const y1 = Math.min(maskHeight, Math.ceil(chinY));
  const x0 = Math.max(0, Math.floor(leftX));
  const x1 = Math.min(maskWidth, Math.ceil(rightX));

  if (y1 <= y0 || x1 <= x0) return "female";

  let hairPixels = 0;
  let totalPixels = 0;
  for (let y = y0; y < y1; y++) {
    const rowStart = y * maskWidth;
    for (let x = x0; x < x1; x++) {
      totalPixels++;
      if (mask[rowStart + x] === maskValue) hairPixels++;
    }
  }

  if (totalPixels === 0) return "female";
  const beardRatio = hairPixels / totalPixels;

  // Calibration: stubble/trimmed beards tend to hit 0.10–0.20, full beards
  // 0.30+. Clean-shaven stays under 0.04 (some MediaPipe noise around the
  // mouth). 0.12 is a safe threshold.
  return beardRatio > 0.12 ? "male" : "female";
}
