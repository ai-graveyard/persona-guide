"use client";

import * as React from "react";
import {
  Download,
  Maximize2,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const maxImageSize = 12 * 1024 * 1024;
const minPreviewZoom = 0.25;
const maxPreviewZoom = 5;
const generatingStatuses = [
  {
    buttonLabel: "正在开始生成...",
    title: "正在识别人像与风格特征",
    description: "照片已经收到，正在读取五官、轮廓和整体气质信息。",
  },
  {
    buttonLabel: "正在生成图卡...",
    title: "正在整理形象建议",
    description: "正在把分析结果整理成清晰、可保存的个人形象建议。",
  },
  {
    buttonLabel: "快好了，请稍等一下",
    title: "正在生成最终图卡",
    description: "最后一步正在合成 3:4 图卡，马上就会显示在这里。",
  },
];

function clampPreviewZoom(value: number) {
  return Math.min(maxPreviewZoom, Math.max(minPreviewZoom, value));
}

export default function Home() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isResultPreviewOpen, setIsResultPreviewOpen] = React.useState(false);
  const [previewZoom, setPreviewZoom] = React.useState(1);
  const [previewPan, setPreviewPan] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [generatingStatusIndex, setGeneratingStatusIndex] = React.useState(0);
  const panStartRef = React.useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });
  const generatingStatus = generatingStatuses[generatingStatusIndex];

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  React.useEffect(() => {
    if (!isResultPreviewOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsResultPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isResultPreviewOpen]);

  React.useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setGeneratingStatusIndex((currentIndex) =>
        Math.min(currentIndex + 1, generatingStatuses.length - 1),
      );
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [isGenerating]);

  function selectFile(file: File | null) {
    setError(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("请上传 JPG、PNG、WebP 等图片格式。");
      return;
    }

    if (file.size > maxImageSize) {
      setError("图片过大，请上传 12MB 以内的照片。");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
  }

  function openResultPreview() {
    setPreviewZoom(1);
    setPreviewPan({ x: 0, y: 0 });
    setIsResultPreviewOpen(true);
  }

  function downloadUrl(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function handleSaveResult() {
    if (!resultUrl) {
      return;
    }

    try {
      const response = await fetch(resultUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch generated image.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      downloadUrl(objectUrl, "persona-analysis.png");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      downloadUrl(resultUrl, "persona-analysis.png");
    }
  }

  function zoomResultBy(delta: number) {
    setPreviewZoom((currentZoom) =>
      Number(clampPreviewZoom(currentZoom + delta).toFixed(2)),
    );
  }

  function resetResultPreview() {
    setPreviewZoom(1);
    setPreviewPan({ x: 0, y: 0 });
  }

  async function handleGenerate() {
    if (!selectedFile) {
      setError("请先上传一张清晰的人像照片。");
      return;
    }

    setIsGenerating(true);
    setGeneratingStatusIndex(0);
    setError(null);
    setResultUrl(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        imageUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "生成失败，请稍后重试。");
      }

      if (!payload.imageUrl) {
        throw new Error("生成完成，但没有收到图片结果。");
      }

      setResultUrl(payload.imageUrl);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f7ede1_0,#fafafa_34%,#f5f5f5_100%)] px-4 py-6 text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,#2a2118_0,#09090b_36%,#050505_100%)] dark:text-zinc-50 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-8 lg:py-12">
        <div className="flex flex-col gap-5 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
            <Sparkles className="size-4" />
            上传照片，生成你的形象分析卡
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              一张照片，获得清晰的个人形象分析
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              上传人像照片后直接生成「个人形象分析图卡」。
            </p>
          </div>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          <Card className="relative flex h-full flex-col">
            <CardHeader>
              <div className="mb-1 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                  1
                </span>
                <CardTitle>上传照片</CardTitle>
              </div>
              <CardDescription>
                建议使用正脸、自然光、无遮挡的人像照片，生成结果会更稳定。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-5">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (isGenerating) {
                    return;
                  }
                  selectFile(event.dataTransfer.files.item(0));
                }}
                className={cn(
                  "group relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 text-left transition hover:border-zinc-500 hover:bg-white disabled:cursor-wait dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-500 dark:hover:bg-zinc-900",
                  previewUrl && "border-solid bg-zinc-100 dark:bg-zinc-900",
                  isGenerating && "border-zinc-400 bg-zinc-100 dark:border-zinc-600",
                )}
              >
                {previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- The preview uses a local blob URL from the user's file. */}
                    <img
                      src={previewUrl}
                      alt="上传照片预览"
                      className={cn(
                        "h-full max-h-[360px] w-full object-contain transition duration-500",
                        isGenerating && "scale-[1.01] opacity-70 blur-[1px]",
                      )}
                    />
                    {isGenerating ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20 px-6 backdrop-blur-[2px]">
                        <span className="inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-white shadow-lg">
                          <Loader2 className="size-4 animate-spin" />
                          已收到照片，预计约 5 分钟
                        </span>
                      </span>
                    ) : (
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                        点击更换照片
                      </span>
                    )}
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-4 px-8 text-center">
                    <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-zinc-950">
                      <ImagePlus className="size-7 text-zinc-500" />
                    </span>
                    <span>
                      <span className="block text-lg font-medium text-zinc-900 dark:text-zinc-50">
                        点击上传，或拖拽照片到这里
                      </span>
                      <span className="mt-2 block text-sm text-zinc-500">
                        支持常见图片格式，最大 12MB
                      </span>
                    </span>
                  </span>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => selectFile(event.target.files?.item(0) ?? null)}
              />

              {selectedFile ? (
                <div className="flex items-center justify-between rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <span className="truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setResultUrl(null);
                    }}
                    className="ml-3 rounded-full p-1 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-800"
                    aria-label="移除照片"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : null}

              {error ? <Alert>{error}</Alert> : null}

              <Button
                type="button"
                size="lg"
                className="mt-auto w-full"
                disabled={isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {generatingStatus.buttonLabel}
                  </>
                ) : (
                  <>
                    <Upload />
                    开始生成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-full min-h-[320px] flex-col">
            <CardHeader>
              <div className="mb-1 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                  2
                </span>
                <CardTitle>生成结果</CardTitle>
              </div>
              <CardDescription>完成后可直接保存图片。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {resultUrl ? (
                <div className="result-enter flex flex-1 flex-col space-y-4">
                  <div className="flex flex-1 items-center overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Generated images can be data URLs or arbitrary provider URLs. */}
                    <img
                      src={resultUrl}
                      alt="形象分析结果"
                      className="h-auto max-h-[360px] w-full object-contain"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={openResultPreview}
                    >
                      <Maximize2 />
                      查看大图
                    </Button>
                    <Button type="button" className="w-full" onClick={handleSaveResult}>
                      <Download />
                      保存图片
                    </Button>
                  </div>
                </div>
              ) : isGenerating ? (
                <div
                  className="relative flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 px-6 py-6 text-center shadow-inner dark:border-zinc-800 dark:bg-zinc-900/70"
                  role="status"
                  aria-live="polite"
                >
                  <div className="relative flex flex-1 flex-col items-center justify-center">
                    <div className="relative mb-6 flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-zinc-950">
                      <Sparkles className="size-7 text-zinc-700 dark:text-zinc-200" />
                      <span className="absolute -right-1 -top-1 flex size-4">
                        <span className="status-ping absolute inline-flex size-full rounded-full bg-zinc-900 opacity-30 dark:bg-white" />
                        <span className="relative inline-flex size-4 rounded-full bg-zinc-900 dark:bg-white" />
                      </span>
                    </div>
                    <div className="loading-swing mb-7 flex h-3 w-28 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <span className="size-3 rounded-full bg-zinc-950 shadow-sm dark:bg-zinc-50" />
                    </div>
                    <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                      {generatingStatus.title}
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                      {generatingStatus.description}
                    </p>
                    <p className="mt-5 text-xs text-zinc-400">
                      预计需要约 5 分钟，生成期间请保持页面打开，完成后会自动显示结果。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                  <Sparkles className="mb-4 size-7 text-zinc-400" />
                  <p className="text-sm leading-6 text-zinc-500">
                    上传照片并点击生成后，分析图会显示在这里。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {isResultPreviewOpen && resultUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="查看生成结果大图"
          className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <div>
              <p className="text-sm font-medium">生成结果大图</p>
              <p className="text-xs text-zinc-400">滚轮、拖拽或使用下方控制条缩放查看细节</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setIsResultPreviewOpen(false)}
              aria-label="关闭大图预览"
            >
              <X />
            </Button>
          </div>

          <div
            className={cn(
              "relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#27272a_0,#09090b_58%,#000_100%)]",
              isPanning ? "cursor-grabbing" : "cursor-grab",
            )}
            style={{ touchAction: "none" }}
            onWheel={(event) => {
              event.preventDefault();
              zoomResultBy(-event.deltaY / 500);
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              panStartRef.current = {
                pointerX: event.clientX,
                pointerY: event.clientY,
                panX: previewPan.x,
                panY: previewPan.y,
              };
              setIsPanning(true);
            }}
            onPointerMove={(event) => {
              if (!isPanning) {
                return;
              }

              setPreviewPan({
                x: panStartRef.current.panX + event.clientX - panStartRef.current.pointerX,
                y: panStartRef.current.panY + event.clientY - panStartRef.current.pointerY,
              });
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              setIsPanning(false);
            }}
            onPointerCancel={() => setIsPanning(false)}
            onDoubleClick={resetResultPreview}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Generated images can be data URLs or arbitrary provider URLs. */}
            <img
              src={resultUrl}
              alt="形象分析结果大图"
              draggable={false}
              className="max-h-[86vh] max-w-[94vw] select-none object-contain shadow-2xl shadow-black/50"
              style={{
                transform: `translate3d(${previewPan.x}px, ${previewPan.y}px, 0) scale(${previewZoom})`,
                transformOrigin: "center",
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 bg-black/70 px-4 py-3 backdrop-blur sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => zoomResultBy(-0.25)}
              aria-label="缩小"
            >
              <ZoomOut />
            </Button>
            <input
              type="range"
              min={minPreviewZoom}
              max={maxPreviewZoom}
              step="0.05"
              value={previewZoom}
              onChange={(event) => {
                setPreviewZoom(clampPreviewZoom(Number(event.target.value)));
              }}
              className="h-2 w-48 accent-white sm:w-72"
              aria-label="缩放比例"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => zoomResultBy(0.25)}
              aria-label="放大"
            >
              <ZoomIn />
            </Button>
            <span className="min-w-14 text-center text-sm text-zinc-300">
              {Math.round(previewZoom * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={resetResultPreview}
            >
              <RotateCcw />
              重置
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveResult}>
              <Download />
              保存图片
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
