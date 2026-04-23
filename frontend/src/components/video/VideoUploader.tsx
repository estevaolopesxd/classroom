"use client";

import { useRef, useState } from "react";
import { videosApi } from "@/lib/api/videos";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VideoUploaderProps {
  onVideoReady: (videoId: string) => void;
}

type UploadState = "idle" | "uploading" | "processing" | "ready" | "error";

export function VideoUploader({ onVideoReady }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState("uploading");
    setProgress(0);

    try {
      const { videoId, uploadId, parts, chunkSize } = await videosApi.initiateUpload({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        title: file.name.replace(/\.[^/.]+$/, ""),
      });

      setVideoId(videoId);

      const completedParts: { partNumber: number; eTag: string }[] = [];

      for (const part of parts) {
        const start = (part.partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const response = await fetch(part.url, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": file.type },
        });

        const eTag = response.headers.get("ETag") ?? `"${part.partNumber}"`;
        completedParts.push({ partNumber: part.partNumber, eTag: eTag.replace(/"/g, "") });

        setProgress(Math.round((part.partNumber / parts.length) * 100));
      }

      setState("processing");
      await videosApi.completeUpload({ videoId, uploadId, parts: completedParts });
      toast.success("Upload concluído! Processando vídeo...");

      // Poll for processing status
      const poll = setInterval(async () => {
        try {
          const video = await videosApi.getStatus(videoId);
          if (video.status === "Ready") {
            clearInterval(poll);
            setState("ready");
            onVideoReady(videoId);
            toast.success("Vídeo pronto!");
          } else if (video.status === "Failed") {
            clearInterval(poll);
            setState("error");
            toast.error("Falha ao processar o vídeo");
          }
        } catch {}
      }, 3000);

    } catch (err) {
      setState("error");
      toast.error("Erro ao fazer upload do vídeo");
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {state === "idle" && (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group"
        >
          <Upload className="size-10 text-muted-foreground/50 group-hover:text-primary mx-auto mb-3 transition-colors" />
          <p className="font-medium">Clique para fazer upload</p>
          <p className="text-sm text-muted-foreground mt-1">MP4, MOV, AVI, WebM — máx. 2GB</p>
        </button>
      )}

      {state === "uploading" && (
        <div className="space-y-2 p-4 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enviando vídeo...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {state === "processing" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/50">
          <Loader2 className="size-5 text-primary animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium">Processando vídeo...</p>
            <p className="text-xs text-muted-foreground">Isso pode levar alguns minutos</p>
          </div>
        </div>
      )}

      {state === "ready" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
          <CheckCircle className="size-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-500">Vídeo pronto!</p>
            <p className="text-xs text-muted-foreground">O vídeo foi processado com sucesso</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setState("idle"); inputRef.current && (inputRef.current.value = ""); }}>
            Trocar
          </Button>
        </div>
      )}

      {state === "error" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertCircle className="size-5 text-destructive shrink-0" />
          <p className="text-sm">Erro no upload. Tente novamente.</p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setState("idle")}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
