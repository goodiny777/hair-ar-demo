"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/Button";

type CameraCaptureProps = {
  onCapture: (blob: Blob, dataUrl: string) => void;
};

type Phase = "idle" | "requesting" | "streaming" | "denied" | "error";

const TARGET_WIDTH = 1024;
const TARGET_HEIGHT = 1024;

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    setPhase("requesting");
    setErrorMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("error");
      setErrorMsg("Это устройство не поддерживает доступ к камере через браузер.");
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Safari can be strict with constraints; retry with looser config
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
      }
      streamRef.current = stream;
      // Move to streaming phase so the <video> element mounts; the effect
      // below attaches the srcObject once the ref is populated.
      setPhase("streaming");
    } catch (err) {
      console.warn("getUserMedia denied", err);
      setPhase("denied");
    }
  }, []);

  // Attach the stream once the <video> element is actually in the DOM.
  useEffect(() => {
    if (phase !== "streaming") return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    const tryPlay = () => {
      video.play().catch((err) => {
        console.warn("video.play() failed", err);
      });
    };
    if (video.readyState >= 1) {
      tryPlay();
    } else {
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
    }
  }, [phase]);

  const snap = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    // Center-crop to square, then scale to TARGET × TARGET.
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror so the selfie isn't flipped on capture (user sees it un-mirrored).
    ctx.save();
    ctx.translate(TARGET_WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, side, side, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        onCapture(blob, dataUrl);
      },
      "image/jpeg",
      0.92,
    );
  }, [onCapture, stop]);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="aspect-square w-full max-w-md bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-500">
          <CameraIcon />
        </div>
        <Button onClick={start} size="lg" className="w-full max-w-md">
          Включить камеру
        </Button>
        <p className="text-xs text-zinc-500 text-center max-w-md">
          Фото обрабатывается в браузере. На сервер уходит только выбранный стиль.
        </p>
      </div>
    );
  }

  if (phase === "requesting") {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="aspect-square w-full max-w-md bg-zinc-900 rounded-3xl flex items-center justify-center">
          <Spinner />
        </div>
        <p className="text-sm text-zinc-500">Запрашиваем доступ к камере...</p>
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="aspect-square w-full bg-zinc-100 rounded-3xl flex items-center justify-center text-zinc-400 p-6 text-center text-sm">
          Камера заблокирована.<br />
          <br />
          Safari: Настройки → Сайты → Камера → Разрешить.<br />
          Chrome: значок замка слева от адреса → Разрешения.
        </div>
        <Button onClick={start}>Попробовать ещё раз</Button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md text-center">
        <div className="aspect-square w-full bg-red-50 rounded-3xl flex items-center justify-center text-red-500 p-6 text-sm">
          {errorMsg ?? "Неизвестная ошибка камеры."}
        </div>
        <Button onClick={start}>Попробовать ещё раз</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="relative aspect-square w-full max-w-md bg-black rounded-3xl overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <div className="pointer-events-none absolute inset-6 border-2 border-white/40 rounded-full" />
      </div>
      <Button onClick={snap} size="lg" className="w-full max-w-md">
        Сфотографировать
      </Button>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin w-10 h-10 text-zinc-500"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      className="w-16 h-16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
