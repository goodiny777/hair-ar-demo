import {
  FilesetResolver,
  FaceLandmarker,
  ImageSegmenter,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";

const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const HAIR_SEGMENTER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite";

let visionPromise: Promise<Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>> | null = null;
let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null;
let hairSegmenterPromise: Promise<ImageSegmenter> | null = null;

function getVision() {
  if (!visionPromise) visionPromise = FilesetResolver.forVisionTasks(WASM_BASE);
  return visionPromise;
}

async function tryCreate<T>(
  label: string,
  create: (delegate: "GPU" | "CPU") => Promise<T>,
): Promise<T> {
  try {
    return await create("GPU");
  } catch (err) {
    console.warn(`[mediapipe] ${label} GPU delegate failed, trying CPU:`, err);
    return create("CPU");
  }
}

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarkerPromise) return faceLandmarkerPromise;
  faceLandmarkerPromise = (async () => {
    const vision = await getVision();
    return tryCreate("FaceLandmarker", (delegate) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: false,
      }),
    );
  })();
  return faceLandmarkerPromise;
}

export async function getHairSegmenter(): Promise<ImageSegmenter> {
  if (hairSegmenterPromise) return hairSegmenterPromise;
  hairSegmenterPromise = (async () => {
    const vision = await getVision();
    return tryCreate("ImageSegmenter", (delegate) =>
      ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HAIR_SEGMENTER_MODEL, delegate },
        runningMode: "IMAGE",
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      }),
    );
  })();
  return hairSegmenterPromise;
}

export type { NormalizedLandmark };
