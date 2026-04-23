"use client";

import { useRef, useState } from "react";
import { videosApi } from "@/lib/api/videos";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Video, Square, Upload, CheckCircle, Loader2, Camera, Monitor } from "lucide-react";
import { toast } from "sonner";

interface VideoRecorderProps {
  onVideoReady: (videoId: string) => void;
}

type RecordState = "idle" | "recording" | "stopped" | "uploading" | "processing" | "ready";

export function VideoRecorder({ onVideoReady }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<RecordState>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const startRecording = async (source: "camera" | "screen") => {
    try {
      let stream: MediaStream;
      if (source === "camera") {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tracks = [...displayStream.getTracks(), ...audioStream.getAudioTracks()];
        stream = new MediaStream(tracks);
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm"
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setState("recording");

      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);

    } catch (err) {
      toast.error("Não foi possível acessar a câmera/tela");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current?.stop();
    setState("stopped");

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const uploadRecording = async () => {
    if (chunksRef.current.length === 0) return;

    setState("uploading");
    const blob = new Blob(chunksRef.current, { type: "video/webm" });

    try {
      const { videoId, uploadId, parts, chunkSize } = await videosApi.initiateUpload({
        fileName: `recording-${Date.now()}.webm`,
        fileSize: blob.size,
        contentType: "video/webm",
        title: `Gravação ${new Date().toLocaleDateString("pt-BR")}`,
      });

      const completedParts: { partNumber: number; eTag: string }[] = [];

      for (const part of parts) {
        const start = (part.partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, blob.size);
        const chunk = blob.slice(start, end);

        const response = await fetch(part.url, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": "video/webm" },
        });

        const eTag = response.headers.get("ETag") ?? `"${part.partNumber}"`;
        completedParts.push({ partNumber: part.partNumber, eTag: eTag.replace(/"/g, "") });
        setProgress(Math.round((part.partNumber / parts.length) * 100));
      }

      setState("processing");
      await videosApi.completeUpload({ videoId, uploadId, parts: completedParts });
      toast.success("Gravação enviada! Processando...");

      const poll = setInterval(async () => {
        const video = await videosApi.getStatus(videoId);
        if (video.status === "Ready") {
          clearInterval(poll);
          setState("ready");
          onVideoReady(videoId);
          toast.success("Gravação pronta!");
        } else if (video.status === "Failed") {
          clearInterval(poll);
          toast.error("Falha ao processar a gravação");
        }
      }, 3000);

    } catch {
      toast.error("Erro ao enviar a gravação");
      setState("stopped");
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
        <video ref={videoRef} className="w-full h-full" muted playsInline />
        {state === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="size-16 text-white/20" />
          </div>
        )}
        {state === "recording" && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="size-2 rounded-full bg-white animate-pulse" />
            REC {formatTime(elapsedSeconds)}
          </div>
        )}
      </div>

      {/* Controls */}
      {state === "idle" && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => startRecording("camera")} className="gap-2">
            <Camera className="size-4" />
            Câmera
          </Button>
          <Button variant="outline" onClick={() => startRecording("screen")} className="gap-2">
            <Monitor className="size-4" />
            Tela
          </Button>
        </div>
      )}

      {state === "recording" && (
        <Button onClick={stopRecording} variant="destructive" className="w-full gap-2">
          <Square className="size-4" />
          Parar gravação
        </Button>
      )}

      {state === "stopped" && (
        <div className="flex gap-2">
          <Button onClick={uploadRecording} className="flex-1 gap-2">
            <Upload className="size-4" />
            Enviar gravação
          </Button>
          <Button variant="outline" onClick={() => setState("idle")}>Nova gravação</Button>
        </div>
      )}

      {state === "uploading" && (
        <div className="space-y-2 p-4 rounded-xl border border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enviando...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {state === "processing" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50">
          <Loader2 className="size-5 text-primary animate-spin" />
          <p className="text-sm">Processando gravação...</p>
        </div>
      )}

      {state === "ready" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
          <CheckCircle className="size-5 text-green-500" />
          <p className="text-sm font-medium text-green-500">Gravação enviada com sucesso!</p>
        </div>
      )}
    </div>
  );
}
