"use client";

import { useEffect, useRef, useState } from "react";
import { getFaceLandmarker, getHairSegmenter } from "@/lib/mediapipe-loader";
import {
  classifyFaceShape,
  FACE_SHAPE_DESCRIPTION_RU,
  FACE_SHAPE_LABEL_RU,
  type FaceShape,
} from "@/lib/face-shape";
import {
  classifyHairColor,
  HAIR_COLOR_LABEL_RU,
  type HairColorBucket,
} from "@/lib/hair-color";
import {
  estimateHairLength,
  HAIR_LENGTH_LABEL_RU,
  type HairLength,
} from "@/lib/hair-length";

export type FaceAnalysisResult = {
  shape: FaceShape;
  hairColor: HairColorBucket;
  hairLength: HairLength;
};

type FaceAnalysisProps = {
  imageDataUrl: string;
  onComplete: (result: FaceAnalysisResult) => void;
  onError: (message: string) => void;
};

type Stage =
  | "loading-models"
  | "detecting-face"
  | "analyzing-hair"
  | "done"
  | "error";

const STAGE_LABEL: Record<Stage, string> = {
  "loading-models": "Загружаем AI-модели...",
  "detecting-face": "Определяем черты лица...",
  "analyzing-hair": "Анализируем причёску...",
  done: "Готово",
  error: "Ошибка",
};

export function FaceAnalysis({ imageDataUrl, onComplete, onError }: FaceAnalysisProps) {
  const [stage, setStage] = useState<Stage>("loading-models");
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function run() {
      try {
        setStage("loading-models");
        const [faceLandmarker, hairSegmenter] = await Promise.all([
          getFaceLandmarker(),
          getHairSegmenter(),
        ]);
        if (cancelledRef.current) return;

        const img = await loadImage(imageDataUrl);
        if (cancelledRef.current) return;

        setStage("detecting-face");
        const faceResult = faceLandmarker.detect(img);
        const landmarks = faceResult.faceLandmarks?.[0];
        if (!landmarks || landmarks.length < 400) {
          onError(
            "Не удалось распознать лицо. Подойдите к свету и попробуйте ещё раз.",
          );
          setStage("error");
          return;
        }
        const { shape } = classifyFaceShape(landmarks);

        setStage("analyzing-hair");
        const segResult = hairSegmenter.segment(img);
        const categoryMask = segResult.categoryMask;
        if (!categoryMask) {
          onError("Не удалось проанализировать волосы. Попробуйте другое фото.");
          setStage("error");
          return;
        }

        const width = categoryMask.width;
        const height = categoryMask.height;
        const maskData = categoryMask.getAsUint8Array();

        // MediaPipe hair segmenter: category 1 = hair.
        const MASK_VALUE = 1;

        // Extract pixels from the source image at the mask's resolution.
        const pixelCanvas = document.createElement("canvas");
        pixelCanvas.width = width;
        pixelCanvas.height = height;
        const pixelCtx = pixelCanvas.getContext("2d", { willReadFrequently: true });
        if (!pixelCtx) {
          onError("Канвас недоступен в этом браузере.");
          setStage("error");
          return;
        }
        pixelCtx.drawImage(img, 0, 0, width, height);
        const imageData = pixelCtx.getImageData(0, 0, width, height);

        const hairColor = classifyHairColor(imageData, maskData, MASK_VALUE);

        // Face bounds in mask pixel coords for hair-length estimate.
        const faceTopY = (landmarks[10]?.y ?? 0) * height;
        const faceBottomY = (landmarks[152]?.y ?? 1) * height;

        const hairLength = estimateHairLength(
          maskData,
          width,
          height,
          faceTopY,
          faceBottomY,
          MASK_VALUE,
        );

        categoryMask.close();

        if (cancelledRef.current) return;
        setStage("done");
        onComplete({ shape, hairColor, hairLength });
      } catch (err) {
        console.error(err);
        if (cancelledRef.current) return;
        onError(err instanceof Error ? err.message : "Неизвестная ошибка анализа.");
        setStage("error");
      }
    }

    void run();

    return () => {
      cancelledRef.current = true;
    };
  }, [imageDataUrl, onComplete, onError]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageDataUrl}
          alt="Захваченное фото"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">{STAGE_LABEL[stage]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalysisResultCard({
  result,
}: {
  result: FaceAnalysisResult;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-zinc-200 w-full max-w-md">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-zinc-500 text-xs uppercase">Форма</div>
          <div className="font-medium">{FACE_SHAPE_LABEL_RU[result.shape]}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs uppercase">Длина</div>
          <div className="font-medium">{HAIR_LENGTH_LABEL_RU[result.hairLength]}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs uppercase">Цвет</div>
          <div className="font-medium">{HAIR_COLOR_LABEL_RU[result.hairColor]}</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-600">
        {FACE_SHAPE_DESCRIPTION_RU[result.shape]}
      </p>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}
