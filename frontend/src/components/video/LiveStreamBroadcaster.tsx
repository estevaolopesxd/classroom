"use client";

import { useRef, useState, useEffect } from "react";
import { Video, Square, Loader2, Wifi, WifiOff, Camera, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";

/* Fix WebSocket URL so the browser connects to the real server hostname */
function fixWsUrl(url: string): string {
  if (typeof window === "undefined") return url;
  try {
    const parsed = new URL(url);
    const currentHost = window.location.hostname;
    if (parsed.hostname !== currentHost) parsed.hostname = currentHost;
    return parsed.toString();
  } catch { return url; }
}

interface LiveStreamBroadcasterProps {
  streamId: string;
  apiBaseUrl: string;
  onStarted?: () => void;
  onEnded?: () => void;
}

type BroadcastState = "idle" | "connecting" | "live" | "ended" | "error";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  border: "#EDCFDE",
  ink: "#1A0A12",
  muted: "#8B6676",
  white: "#FFFFFF",
};

export function LiveStreamBroadcaster({ streamId, apiBaseUrl, onStarted, onEnded }: LiveStreamBroadcasterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<BroadcastState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  // Read token only on client to avoid SSR hydration mismatch
  const [accessToken, setAccessToken] = useState<string | null>(null);
  useEffect(() => {
    const token = useAuthStore.getState().accessToken ?? localStorage.getItem("accessToken");
    setAccessToken(token);
  }, []);

  useEffect(() => {
    return () => { cleanup(); };
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

      // Build WebSocket URL with runtime hostname correction + JWT token
      const rawWsUrl = `${apiBaseUrl.replace(/^http/, "ws")}/api/streams/${streamId}/broadcast`;
      const wsUrl = fixWsUrl(rawWsUrl);
      const token = accessToken ?? localStorage.getItem("accessToken") ?? "";
      const wsUrlWithToken = `${wsUrl}${wsUrl.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrlWithToken);
      wsRef.current = ws;

      ws.onopen = () => {
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

        recorder.start(250);
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
        if (state === "live") setState("ended");
      };

    } catch {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Video preview */}
      <div style={{ aspectRatio: "16/9", background: "#000", borderRadius: 14, overflow: "hidden", position: "relative" }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted playsInline />

        {state === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Video size={56} color="rgba(255,255,255,0.15)" />
          </div>
        )}
        {state === "connecting" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
            <div style={{ textAlign: "center", color: "white" }}>
              <Loader2 size={36} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13 }}>Conectando...</p>
            </div>
          </div>
        )}
        {state === "live" && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", alignItems: "center", gap: 6,
            background: "#ef4444", color: "white",
            padding: "4px 12px", borderRadius: 100,
            fontSize: 12, fontWeight: 700,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }} />
            AO VIVO {formatTime(elapsedSeconds)}
          </div>
        )}
        {state === "ended" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }}>
            <p style={{ color: "white", fontSize: 16, fontWeight: 700 }}>Transmissão encerrada</p>
          </div>
        )}
        {state === "error" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }}>
            <WifiOff size={40} color="#ef4444" style={{ marginBottom: 8 }} />
            <p style={{ color: "#ef4444", fontWeight: 700 }}>Erro na transmissão</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {state === "idle" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={() => startBroadcast("camera")}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
              color: S.white, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 3px 12px rgba(212,67,124,0.3)",
            }}
          >
            <Camera size={16} /> Câmera ao vivo
          </button>
          <button
            onClick={() => startBroadcast("screen")}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px", borderRadius: 10,
              border: `1.5px solid ${S.border}`, background: S.white,
              color: S.ink, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Monitor size={16} /> Tela ao vivo
          </button>
        </div>
      )}

      {state === "connecting" && (
        <button disabled style={{
          width: "100%", padding: "11px", borderRadius: 10, border: "none",
          background: "#d0bbc5", color: "white", fontSize: 14, fontWeight: 700,
          cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "inherit",
        }}>
          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Conectando...
        </button>
      )}

      {state === "live" && (
        <button
          onClick={stopBroadcast}
          style={{
            width: "100%", padding: "11px", borderRadius: 10, border: "none",
            background: "#ef4444", color: "white", fontSize: 14, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "inherit",
          }}
        >
          <Square size={15} fill="white" /> Encerrar transmissão
        </button>
      )}

      {(state === "ended" || state === "error") && (
        <button
          onClick={() => setState("idle")}
          style={{
            width: "100%", padding: "11px", borderRadius: 10,
            border: `1.5px solid ${S.border}`, background: S.white,
            color: S.ink, fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Nova transmissão
        </button>
      )}

      {/* Status indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: S.muted }}>
        {state === "live" ? (
          <><Wifi size={12} color="#16a34a" /><span style={{ color: "#16a34a" }}>Transmitindo via WebSocket → FFmpeg → RTMP</span></>
        ) : state === "connecting" ? (
          <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /><span>Iniciando pipeline de transmissão...</span></>
        ) : (
          <><WifiOff size={12} /><span>Aguardando início</span></>
        )}
      </div>
    </div>
  );
}
