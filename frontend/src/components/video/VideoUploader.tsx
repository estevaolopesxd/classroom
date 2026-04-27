"use client";

import { useRef, useState } from "react";
import { videosApi } from "@/lib/api/videos";
import { Upload, CheckCircle, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

/* ── Fix presigned MinIO URLs so the browser can reach MinIO ──────────────────
   The backend generates presigned URLs using the internal Docker hostname
   (e.g. "minio:9000" or "localhost:9000"). The browser cannot resolve
   those names when accessing the platform from another machine.
   We replace the hostname with the current browser hostname at runtime.
──────────────────────────────────────────────────────────────────────────── */
function fixMinioUrl(url: string): string {
  if (typeof window === "undefined") return url;
  try {
    const parsed = new URL(url);
    const currentHost = window.location.hostname;
    if (parsed.hostname !== currentHost) {
      parsed.hostname = currentHost;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

interface VideoUploaderProps {
  onVideoReady: (videoId: string) => void;
}

type UploadState = "idle" | "uploading" | "processing" | "ready" | "error";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  border: "#EDCFDE",
  ink: "#1A0A12",
  muted: "#8B6676",
  green: "#16a34a",
  greenBg: "#f0fdf4",
  greenBorder: "#86efac",
};

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

        // Fix hostname so the browser can reach MinIO from any network
        const uploadUrl = fixMinioUrl(part.url);

        const response = await fetch(uploadUrl, {
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
        } catch { /* ignore polling errors */ }
      }, 3000);

    } catch {
      setState("error");
      toast.error("Erro ao fazer upload do vídeo");
    }
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
    setVideoId(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Idle — drop zone */}
      {state === "idle" && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%", padding: "32px 16px", borderRadius: 14,
            border: `2px dashed ${S.border}`, background: "transparent",
            cursor: "pointer", textAlign: "center", fontFamily: "inherit",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = S.rose + "80";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,67,124,0.04)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = S.border;
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <Upload size={36} color={S.border} style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: S.ink, margin: "0 0 4px" }}>
            Clique para fazer upload
          </p>
          <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>
            MP4, MOV, AVI, WebM — máx. 2GB
          </p>
        </button>
      )}

      {/* Uploading */}
      {state === "uploading" && (
        <div style={{
          padding: "16px 18px", borderRadius: 12,
          border: `1px solid ${S.border}`, background: S.bg,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: S.muted, fontWeight: 500 }}>Enviando vídeo...</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: S.rose }}>{progress}%</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 4, background: S.border, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: `linear-gradient(90deg, ${S.rose}, ${S.roseDark})`,
              width: `${progress}%`, transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      )}

      {/* Processing */}
      {state === "processing" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 18px", borderRadius: 12,
          border: `1px solid ${S.border}`, background: S.bg,
        }}>
          <Loader2 size={18} color={S.rose} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: S.ink, margin: 0 }}>Processando vídeo...</p>
            <p style={{ fontSize: 12, color: S.muted, margin: "2px 0 0" }}>Isso pode levar alguns minutos</p>
          </div>
        </div>
      )}

      {/* Ready */}
      {state === "ready" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 18px", borderRadius: 12,
          border: `1px solid ${S.greenBorder}`, background: S.greenBg,
        }}>
          <CheckCircle size={18} color={S.green} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: S.green, margin: 0 }}>Vídeo pronto!</p>
            <p style={{ fontSize: 12, color: "#15803d", margin: "2px 0 0" }}>Processado com sucesso</p>
          </div>
          <button onClick={reset} style={{
            padding: "6px 12px", borderRadius: 8, border: `1px solid ${S.greenBorder}`,
            background: "transparent", color: S.green, fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit",
          }}>
            <RotateCcw size={12} /> Trocar
          </button>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 18px", borderRadius: 12,
          border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
        }}>
          <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: S.ink, flex: 1, margin: 0 }}>Erro no upload. Tente novamente.</p>
          <button onClick={reset} style={{
            padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)",
            background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
