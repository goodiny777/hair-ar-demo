import type { NormalizedLandmark } from "./mediapipe-loader";

export type FaceShape =
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "oblong"
  | "diamond";

export const FACE_SHAPE_LABEL_RU: Record<FaceShape, string> = {
  oval: "Овальное",
  round: "Круглое",
  square: "Квадратное",
  heart: "Сердцевидное",
  oblong: "Продолговатое",
  diamond: "Ромбовидное",
};

export const FACE_SHAPE_DESCRIPTION_RU: Record<FaceShape, string> = {
  oval: "Универсальная форма — подходит почти любая стрижка.",
  round: "Лицо шире, чем длиннее. Стрижки с объёмом сверху и длиной визуально вытягивают.",
  square: "Выраженная челюсть. Мягкие волны и косые проборы смягчают углы.",
  heart: "Широкий лоб и узкий подбородок. Бобы на уровне подбородка балансируют пропорции.",
  oblong: "Лицо заметно длиннее, чем шире. Кудри и слои добавляют ширину.",
  diamond: "Узкий лоб и подбородок, широкие скулы. Боковая чёлка смягчает скулы.",
};

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// MediaPipe Face Mesh landmark indices (468 points).
// Reference: https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png
const IDX = {
  foreheadTop: 10,
  chinBottom: 152,
  cheekLeft: 234,
  cheekRight: 454,
  foreheadLeft: 127,
  foreheadRight: 356,
  jawLeft: 172,
  jawRight: 397,
};

export type FaceMeasurements = {
  faceHeight: number;
  cheekWidth: number;
  foreheadWidth: number;
  jawWidth: number;
  heightToWidth: number;
  foreheadToJaw: number;
  cheekToJaw: number;
  cheekToForehead: number;
};

export function measureFace(landmarks: NormalizedLandmark[]): FaceMeasurements {
  const faceHeight = dist(landmarks[IDX.foreheadTop], landmarks[IDX.chinBottom]);
  const cheekWidth = dist(landmarks[IDX.cheekLeft], landmarks[IDX.cheekRight]);
  const foreheadWidth = dist(landmarks[IDX.foreheadLeft], landmarks[IDX.foreheadRight]);
  const jawWidth = dist(landmarks[IDX.jawLeft], landmarks[IDX.jawRight]);

  return {
    faceHeight,
    cheekWidth,
    foreheadWidth,
    jawWidth,
    heightToWidth: faceHeight / cheekWidth,
    foreheadToJaw: foreheadWidth / jawWidth,
    cheekToJaw: cheekWidth / jawWidth,
    cheekToForehead: cheekWidth / foreheadWidth,
  };
}

export function classifyFaceShape(landmarks: NormalizedLandmark[]): {
  shape: FaceShape;
  measurements: FaceMeasurements;
} {
  const m = measureFace(landmarks);

  // Thresholds calibrated loosely. Order matters — first match wins.
  // Elongated face dominates other shapes.
  if (m.heightToWidth > 1.55) {
    return { shape: "oblong", measurements: m };
  }

  // Heart: forehead wider than jaw.
  if (m.foreheadToJaw > 1.12) {
    return { shape: "heart", measurements: m };
  }

  // Diamond: cheeks widest, both forehead and jaw narrower.
  if (m.cheekToForehead > 1.08 && m.cheekToJaw > 1.08) {
    return { shape: "diamond", measurements: m };
  }

  // Round vs square: both have similar width/height. Square has angular jaw.
  if (Math.abs(m.cheekToJaw - 1) < 0.1 && m.heightToWidth < 1.3) {
    // If jaw is almost as wide as cheeks → square. Otherwise round.
    return {
      shape: m.cheekToJaw < 1.05 ? "square" : "round",
      measurements: m,
    };
  }

  return { shape: "oval", measurements: m };
}
