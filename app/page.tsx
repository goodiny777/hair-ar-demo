"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import {
  FaceAnalysis,
  AnalysisResultCard,
  type FaceAnalysisResult,
} from "@/components/FaceAnalysis";
import { HairRecolor } from "@/components/HairRecolor";
import { StyleGallery } from "@/components/StyleGallery";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  getRecommendations,
  STYLE_PRESETS,
  type FluxColor,
} from "@/lib/recommendations";
import { type Gender } from "@/lib/gender-detection";

type Step =
  | "intro"
  | "camera"
  | "analyzing"
  | "style"
  | "generating"
  | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("intro");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FaceAnalysisResult | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<FluxColor | null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetToCamera = () => {
    setImageDataUrl(null);
    setAnalysis(null);
    setSelectedStyleId(null);
    setSelectedColor(null);
    setSelectedGender(null);
    setGeneratedUrl(null);
    setErrorMsg(null);
    setStep("camera");
  };

  async function generate() {
    if (!imageDataUrl || !selectedStyleId) return;
    const preset = STYLE_PRESETS[selectedStyleId];
    if (!preset) return;

    setStep("generating");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/hair-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUrl,
          haircut: preset.haircut,
          hair_color: selectedColor ?? preset.defaultColor,
          gender: selectedGender ?? "none",
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { imageUrl: string; model: string };
      setGeneratedUrl(data.imageUrl);
      setStep("result");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Не удалось сгенерировать результат.",
      );
      setStep("style");
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center safe-top safe-bottom px-4 py-6 w-full">
      <header className="w-full max-w-xl flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Hair AR</h1>
        {step !== "intro" && step !== "generating" && (
          <button
            onClick={() => setStep("intro")}
            className="text-sm text-zinc-500 underline"
          >
            Начать заново
          </button>
        )}
      </header>

      {step === "intro" && (
        <section className="flex-1 w-full max-w-xl flex flex-col items-center justify-center gap-8 text-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight mb-3">
              Примерьте новую причёску
            </h2>
            <p className="text-zinc-600 max-w-md mx-auto">
              Сделайте селфи — мы определим форму лица, подберём стрижку и покажем, как вы будете выглядеть.
            </p>
          </div>
          <Button size="lg" onClick={() => setStep("camera")}>
            Начать
          </Button>
          <p className="text-xs text-zinc-400 max-w-xs">
            Работает в Safari (iPad) и Chrome (Android). Камера обрабатывается в браузере.
          </p>
        </section>
      )}

      {step === "camera" && (
        <section className="flex-1 w-full flex items-center justify-center">
          <CameraCapture
            onCapture={(_blob, dataUrl) => {
              setImageDataUrl(dataUrl);
              setStep("analyzing");
            }}
          />
        </section>
      )}

      {step === "analyzing" && imageDataUrl && (
        <section className="flex-1 w-full flex items-center justify-center">
          <FaceAnalysis
            imageDataUrl={imageDataUrl}
            onComplete={(result) => {
              setAnalysis(result);
              setSelectedGender(result.gender);
              setStep("style");
            }}
            onError={(msg) => {
              setErrorMsg(msg);
              setStep("camera");
            }}
          />
        </section>
      )}

      {step === "style" && imageDataUrl && analysis && (
        <section className="flex-1 w-full flex flex-col items-center gap-6">
          <AnalysisResultCard result={analysis} />

          <div className="w-full max-w-md flex items-center justify-between">
            <div className="text-sm text-zinc-600">Подбор под</div>
            <SegmentedControl<Gender>
              options={[
                { value: "female", label: "Женщина" },
                { value: "male", label: "Мужчина" },
              ]}
              value={selectedGender ?? analysis.gender}
              onChange={(g) => {
                setSelectedGender(g);
                // Selected style/color belongs to the old gender list — clear.
                setSelectedStyleId(null);
                setSelectedColor(null);
              }}
            />
          </div>

          <details className="w-full max-w-md">
            <summary className="text-sm text-zinc-500 cursor-pointer">
              Попробовать цвет прямо на фото (без генерации)
            </summary>
            <div className="mt-3">
              <HairRecolor imageDataUrl={imageDataUrl} />
            </div>
          </details>

          <StyleGallery
            styles={getRecommendations(analysis.shape, selectedGender ?? analysis.gender)}
            selectedStyleId={selectedStyleId}
            selectedColor={selectedColor}
            onSelectStyle={(id) => {
              setSelectedStyleId(id);
              const preset = STYLE_PRESETS[id];
              if (preset && !selectedColor) setSelectedColor(preset.defaultColor);
            }}
            onSelectColor={(c) => setSelectedColor(c)}
          />

          {errorMsg && (
            <div className="w-full max-w-md rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="sticky bottom-4 w-full max-w-md">
            <Button
              size="lg"
              onClick={generate}
              disabled={!selectedStyleId}
              className="w-full shadow-lg"
            >
              {selectedStyleId ? "Сгенерировать результат" : "Выберите стрижку"}
            </Button>
          </div>
        </section>
      )}

      {step === "generating" && imageDataUrl && (
        <section className="flex-1 w-full flex flex-col items-center justify-center gap-6">
          <div className="relative aspect-square w-full max-w-md rounded-3xl overflow-hidden bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Генерация"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm px-6 text-center">
                Генерируем... это может занять до 30 секунд
              </p>
            </div>
          </div>
        </section>
      )}

      {step === "result" && imageDataUrl && generatedUrl && (
        <section className="flex-1 w-full flex flex-col items-center gap-6">
          <BeforeAfterSlider beforeSrc={imageDataUrl} afterSrc={generatedUrl} />

          <div className="w-full max-w-md flex flex-col gap-3">
            <Button size="lg" onClick={() => setStep("style")}>
              Попробовать другую причёску
            </Button>
            <Button size="md" variant="secondary" onClick={resetToCamera}>
              Новое фото
            </Button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Button
                size="md"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: "Hair AR",
                      text: "Посмотри — новая причёска!",
                      url: generatedUrl,
                    });
                  } catch {
                    /* user cancelled */
                  }
                }}
              >
                Поделиться
              </Button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
