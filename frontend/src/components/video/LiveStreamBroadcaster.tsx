"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Square, Loader2, Wifi, WifiOff, Camera, Monitor } from "lucide-react";
import { toast } from "sonner";

interface LiveStreamBroadcasterProps {
  streamId: string;
  apiBaseUrl: string;
  onStarted?: () => void;
  onEnded?: () => void;
}

type BroadcastState = "idle" | "connecting" | "live" | "ended" | "error";

export function LiveStreamBroadcaster({ streamId, apiBaseUrl, onStarted, onEnded }: LiveStreamBroadcasterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<BroadcastState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const [source, setSource] = useState<"camera" | "screen">("camera");

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  };

  const startBroadcast = async (src: "camera" | "screen") => {
    setState("connecting");
    try {
      // Get media stream
      let stream: MediaStream;
      if (src === "camera") {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream = new MediaStream([...displayStream.getTracks(), ...audioStream.getAudioTracks()]);
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Connect WebSocket
      const wsUrl = `${apiBaseUrl.replace(/^http/, "ws")}/api/streams/${streamId}/broadcast`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Start MediaRecorder once WS is open
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
          }
        };

        recorder.start(250); // Chunk every 250ms for low-latency
        setState("live");
        onStarted?.();

        setElapsedSeconds(0);
        timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
        toast.success("Transmissão iniciada!");
      };

      ws.onerror = () => {
        setState("error");
        cleanup();
        toast.error("Erro na conexão WebSocket");
      };

      ws.onclose = () => {
        if (state === "live") {
          setState("ended");
        }
      };

    } catch (err) {
      setState("error");
      toast.error("Não foi possível acessar câmera/tela");
    }
  };

  const stopBroadcast = () => {
    cleanup();
    setState("ended");
    onEnded?.();
    toast.success("Transmissão encerrada");
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {state === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="size-16 text-white/20" />
          </div>
        )}
        {state === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Loader2 className="size-10 animate-spin mx-auto mb-2" />
              <p className="text-sm">Conectando...</p>
            </div>
          </div>
        )}
        {state === "live" && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            <div className="size-2 rounded-full bg-white animate-pulse" />
            AO VIVO {formatTime(elapsedSeconds)}
          </div>
        )}
        {state === "ended" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-white text-lg font-bold">Transmissão encerrada</p>
          </div>
        )}
        {state === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-red-400">
              <WifiOff className="size-12 mx-auto mb-2" />
              <p className="font-bold">Erro na transmissão</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {state === "idle" && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => { setSource("camera"); startBroadcast("camera"); }} className="gap-2">
            <Camera className="size-4" /> Câmera ao vivo
          </Button>
          <Button variant="outline" onClick={() => { setSource("screen"); startBroadcast("screen"); }} className="gap-2">
            <Monitor className="size-4" /> Tela ao vivo
          </Button>
        </div>
      )}

      {state === "connecting" && (
        <Button disabled className="w-full gap-2">
          <Loader2 className="size-4 animate-spin" /> Conectando...
        </Button>
      )}

      {state === "live" && (
        <Button onClick={stopBroadcast} variant="destructive" className="w-full gap-2">
          <Square className="size-4" /> Encerrar transmissão
        </Button>
      )}

      {(state === "ended" || state === "error") && (
        <Button onClick={() => setState("idle")} variant="outline" className="w-full">
          Nova transmissão
        </Button>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {state === "live" ? (
          <>
            <Wifi className="size-3 text-green-500" />
            <span className="text-green-500">Transmitindo via WebSocket → FFmpeg → RTMP</span>
          </>
        ) : state === "connecting" ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            <span>Iniciando pipeline de transmissão...</span>
          </>
        ) : (
          <>
            <WifiOff className="size-3" />
            <span>Aguardando início</span>
          </>
        )}
      </div>
    </div>
  );
}
