"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { videosApi } from "@/lib/api/videos";
import {
  Video, Square, Upload, CheckCircle, Loader2,
  Camera, Monitor, PictureInPicture2, Mic, MicOff,
  RotateCcw, Maximize2, Minimize2
} from "lucide-react";
import { toast } from "sonner";

interface VideoRecorderProps {
  onVideoReady: (videoId: string) => void;
}

type RecordMode = "camera" | "screen" | "pip";
type RecordState = "idle" | "preview" | "recording" | "stopped" | "uploading" | "processing" | "ready";
type PipPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const C = {
  rose: "#c9476e",
  blush: "#fdf0f5",
  border: "#f0d5e2",
  black: "#1a1014",
  muted: "#8a6070",
};

export function VideoRecorder({ onVideoReady }: VideoRecorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);   // single-source preview
  const cameraVideoRef = useRef<HTMLVideoElement>(null);    // hidden camera feed for PiP
  const screenVideoRef = useRef<HTMLVideoElement>(null);    // hidden screen feed for PiP
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [state, setState] = useState<RecordState>("idle");
  const [mode, setMode] = useState<RecordMode>("pip");
  const [pipPosition, setPipPosition] = useState<PipPosition>("bottom-right");
  const [pipSize, setPipSize] = useState<"small" | "large">("small");
  const [micEnabled, setMicEnabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  // Draw PiP composite to canvas every animation frame
  const drawPip = useCallback(() => {
    const canvas = canvasRef.current;
    const screenVid = screenVideoRef.current;
    const cameraVid = cameraVideoRef.current;
    if (!canvas || !screenVid || !cameraVid) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = screenVid.videoWidth || 1280;
    canvas.height = screenVid.videoHeight || 720;

    // Draw screen
    ctx.drawImage(screenVid, 0, 0, canvas.width, canvas.height);

    // PiP camera overlay
    const camW = pipSize === "small" ? canvas.width * 0.22 : canvas.width * 0.32;
    const camH = camW * (cameraVid.videoHeight / (cameraVid.videoWidth || 1));
    const pad = 16;

    let camX = 0, camY = 0;
    if (pipPosition === "bottom-right") { camX = canvas.width - camW - pad; camY = canvas.height - camH - pad; }
    if (pipPosition === "bottom-left")  { camX = pad; camY = canvas.height - camH - pad; }
    if (pipPosition === "top-right")    { camX = canvas.width - camW - pad; camY = pad; }
    if (pipPosition === "top-left")     { camX = pad; camY = pad; }

    // Shadow + rounded clip
    ctx.save();
    const r = 12;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(camX + r, camY);
    ctx.lineTo(camX + camW - r, camY);
    ctx.quadraticCurveTo(camX + camW, camY, camX + camW, camY + r);
    ctx.lineTo(camX + camW, camY + camH - r);
    ctx.quadraticCurveTo(camX + camW, camY + camH, camX + camW - r, camY + camH);
    ctx.lineTo(camX + r, camY + camH);
    ctx.quadraticCurveTo(camX, camY + camH, camX, camY + camH - r);
    ctx.lineTo(camX, camY + r);
    ctx.quadraticCurveTo(camX, camY, camX + r, camY);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(cameraVid, camX, camY, camW, camH);

    // Rose border
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = C.rose;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    animFrameRef.current = requestAnimationFrame(drawPip);
  }, [pipPosition, pipSize]);

  // Start camera preview (always on for PiP and camera modes)
  const startCameraPreview = async () => {
    if (!navigator.mediaDevices) {
      toast.error("Câmera exige HTTPS. Acesse a plataforma via https://.", { duration: 8000 });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: micEnabled,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      toast.error("Não foi possível acessar a câmera");
    }
  };

  const startRecording = async () => {
    // navigator.mediaDevices is only available in secure contexts (HTTPS or localhost)
    if (!navigator.mediaDevices) {
      toast.error("Câmera/tela exige HTTPS. Acesse a plataforma via https:// ou use localhost.", { duration: 8000 });
      return;
    }
    try {
      let recordStream: MediaStream;
      let displayStream: MediaStream | undefined;

      if (mode === "camera") {
        // Camera only
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraStreamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          await previewVideoRef.current.play();
        }
        recordStream = stream;

      } else if (mode === "screen") {
        // Screen capture requires HTTPS
        if (typeof navigator.mediaDevices.getDisplayMedia !== "function") {
          toast.error("Gravação de tela requer HTTPS. Configure SSL no servidor ou acesse via localhost.", { duration: 10000 });
          return;
        }
        // Screen only + mic
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: true,
        });
        let audioTracks: MediaStreamTrack[] = [];
        if (micEnabled) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioTracks = micStream.getAudioTracks();
          } catch {}
        }
        screenStreamRef.current = displayStream;
        const tracks = [...displayStream.getTracks(), ...audioTracks];
        recordStream = new MediaStream(tracks);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = displayStream;
          await previewVideoRef.current.play();
        }

      } else {
        // PiP mode: screen capture requires HTTPS
        if (typeof navigator.mediaDevices.getDisplayMedia !== "function") {
          toast.error("Gravação de tela requer HTTPS. Configure SSL no servidor ou acesse via localhost.", { duration: 10000 });
          return;
        }
        // PiP: Screen + Camera composite via canvas
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: false,
        });
        screenStreamRef.current = displayStream;

        if (!cameraStreamRef.current || !cameraReady) {
          await startCameraPreview();
        }

        // Hook up hidden video elements
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = displayStream;
          await screenVideoRef.current.play();
        }

        // Start canvas compositing
        cancelAnimationFrame(animFrameRef.current);
        drawPip();

        // Get canvas stream
        const canvas = canvasRef.current!;
        const canvasStream = canvas.captureStream(30);

        // Add mic audio
        let audioTracks: MediaStreamTrack[] = [];
        if (cameraStreamRef.current) {
          audioTracks = cameraStreamRef.current.getAudioTracks();
        }
        if (audioTracks.length === 0 && micEnabled) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioTracks = micStream.getAudioTracks();
          } catch {}
        }

        recordStream = new MediaStream([...canvasStream.getTracks(), ...audioTracks]);
      }

      // Setup MediaRecorder
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(recordStream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      setState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);

      // Stop when screen share ends
      displayStream?.getVideoTracks()[0]?.addEventListener("ended", stopRecording);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const lmsg = msg.toLowerCase();
      if (lmsg.includes("secure") || lmsg.includes("https") || lmsg.includes("not a function")) {
        toast.error("Gravação de tela requer HTTPS. Configure SSL no servidor.", { duration: 10000 });
      } else if (lmsg.includes("permission denied") || lmsg.includes("notallowed") || lmsg.includes("abort") || lmsg.includes("cancel")) {
        // User cancelled the screen picker — do nothing
      } else {
        toast.error("Não foi possível iniciar a gravação: " + msg);
      }
    }
  };

  // Reference stable stop function
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);

    mediaRecorderRef.current?.stop();
    screenStreamRef.current?.getTracks().forEach(t => t.stop());

    if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;

    setState("stopped");
  }, []);

  const resetAll = () => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current = null;
    setCameraReady(false);
    chunksRef.current = [];
    setProgress(0);
    setElapsed(0);
    setState("idle");
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
        const chunk = blob.slice(start, Math.min(start + chunkSize, blob.size));
        // Upload via API proxy — avoids browser→MinIO SSL/CORS issues
        const eTag = await videosApi.uploadPart(videoId, uploadId, part.partNumber, chunk);
        completedParts.push({ partNumber: part.partNumber, eTag: eTag.replace(/"/g, "") });
        setProgress(Math.round((part.partNumber / parts.length) * 100));
      }

      setState("processing");
      await videosApi.completeUpload({ videoId, uploadId, parts: completedParts });
      toast.success("Gravação enviada! Processando vídeo...");

      const poll = setInterval(async () => {
        const video = await videosApi.getStatus(videoId);
        if (video.status === "Ready") {
          clearInterval(poll);
          setState("ready");
          onVideoReady(videoId);
          toast.success("Vídeo pronto! 🎉");
        } else if (video.status === "Failed") {
          clearInterval(poll);
          toast.error("Falha ao processar o vídeo");
        }
      }, 3000);
    } catch {
      toast.error("Erro ao enviar a gravação");
      setState("stopped");
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const modeOptions: { id: RecordMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "pip", label: "Tela + Câmera", desc: "Grava a tela com seu rosto em PiP", icon: <PictureInPicture2 size={18} color={C.rose} /> },
    { id: "screen", label: "Só a Tela", desc: "Grava apenas a tela do computador", icon: <Monitor size={18} color={C.muted} /> },
    { id: "camera", label: "Só a Câmera", desc: "Grava apenas a câmera", icon: <Camera size={18} color={C.muted} /> },
  ];

  const pipPositions: { id: PipPosition; label: string }[] = [
    { id: "bottom-right", label: "↘ Inferior direito" },
    { id: "bottom-left",  label: "↙ Inferior esquerdo" },
    { id: "top-right",    label: "↗ Superior direito" },
    { id: "top-left",     label: "↖ Superior esquerdo" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Mode selector ── */}
      {state === "idle" && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Modo de gravação
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {modeOptions.map(({ id, label, desc, icon }) => (
              <button key={id} onClick={() => setMode(id)} style={{
                padding: "12px 10px",
                borderRadius: 12,
                border: `2px solid ${mode === id ? C.rose : C.border}`,
                background: mode === id ? C.blush : "white",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: mode === id ? C.rose : C.black, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PiP options (idle only, pip mode) ── */}
      {state === "idle" && mode === "pip" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Posição da câmera
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pipPositions.map(({ id, label }) => (
                <button key={id} onClick={() => setPipPosition(id)} style={{
                  padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${pipPosition === id ? C.rose : C.border}`,
                  background: pipPosition === id ? C.blush : "white",
                  color: pipPosition === id ? C.rose : C.muted,
                  fontSize: 12, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Tamanho da câmera
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { id: "small" as const, label: "Pequena (22%)", icon: <Minimize2 size={13} /> },
                { id: "large" as const, label: "Grande (32%)", icon: <Maximize2 size={13} /> },
              ].map(({ id, label, icon }) => (
                <button key={id} onClick={() => setPipSize(id)} style={{
                  padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${pipSize === id ? C.rose : C.border}`,
                  background: pipSize === id ? C.blush : "white",
                  color: pipSize === id ? C.rose : C.muted,
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Microfone
              </p>
              <button onClick={() => setMicEnabled(!micEnabled)} style={{
                padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${micEnabled ? C.rose : C.border}`,
                background: micEnabled ? C.blush : "white",
                color: micEnabled ? C.rose : C.muted,
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
              }}>
                {micEnabled ? <Mic size={13} /> : <MicOff size={13} />}
                {micEnabled ? "Microfone ativo" : "Microfone desativado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Canvas preview (PiP mode while recording) ── */}
      {mode === "pip" && (state === "recording") && (
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", alignItems: "center", gap: 6,
            background: C.rose, color: "white",
            padding: "4px 12px", borderRadius: 100,
            fontSize: 12, fontWeight: 700,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }} />
            REC {fmt(elapsed)}
          </div>
        </div>
      )}

      {/* ── Single-source preview (camera or screen mode) ── */}
      {(mode !== "pip" || state === "idle" || state === "stopped") && (
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#111", aspectRatio: "16/9" }}>
          <video ref={previewVideoRef} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} muted playsInline />
          {(state === "idle" || state === "stopped") && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Video size={48} color="rgba(255,255,255,0.15)" />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                {state === "stopped" ? "Gravação concluída" : "Clique em Iniciar para gravar"}
              </span>
            </div>
          )}
          {state === "recording" && (
            <div style={{
              position: "absolute", top: 12, left: 12,
              display: "flex", alignItems: "center", gap: 6,
              background: C.rose, color: "white",
              padding: "4px 12px", borderRadius: 100,
              fontSize: 12, fontWeight: 700,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />
              REC {fmt(elapsed)}
            </div>
          )}
        </div>
      )}

      {/* ── Hidden video elements for PiP compositing ── */}
      <video ref={screenVideoRef} style={{ display: "none" }} muted playsInline />
      <video ref={cameraVideoRef} style={{ display: "none" }} muted playsInline />

      {/* ── Camera preview thumbnail (PiP idle) ── */}
      {mode === "pip" && state === "idle" && (
        <div>
          {!cameraReady ? (
            <button onClick={startCameraPreview} style={{
              width: "100%", padding: "10px", borderRadius: 10,
              border: `1.5px dashed ${C.border}`,
              background: C.blush, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              color: C.rose, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            }}>
              <Camera size={16} />
              Testar câmera antes de gravar
            </button>
          ) : (
            <div style={{ position: "relative", width: 160, borderRadius: 10, overflow: "hidden", border: `2px solid ${C.rose}` }}>
              <video
                ref={(el) => { if (el && cameraStreamRef.current) { el.srcObject = cameraStreamRef.current; el.play(); } }}
                style={{ width: "100%", display: "block" }}
                autoPlay muted playsInline
              />
              <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "white", background: "rgba(0,0,0,0.4)", padding: "2px 0" }}>
                Câmera ativa ✓
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Start button */}
        {state === "idle" && (
          <button onClick={startRecording} style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
            color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: `0 6px 20px ${C.rose}35`, fontFamily: "inherit",
          }}>
            <Video size={18} />
            {mode === "pip" ? "Iniciar gravação (Tela + Câmera)" : mode === "screen" ? "Iniciar gravação de tela" : "Iniciar gravação de câmera"}
          </button>
        )}

        {/* Stop button */}
        {state === "recording" && (
          <button onClick={stopRecording} style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: "#dc2626", color: "white", fontSize: 15, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "inherit",
          }}>
            <Square size={16} fill="white" />
            Parar gravação
          </button>
        )}

        {/* Stopped — upload or redo */}
        {state === "stopped" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={uploadRecording} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
              color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: `0 4px 16px ${C.rose}30`, fontFamily: "inherit",
            }}>
              <Upload size={16} />
              Enviar gravação
            </button>
            <button onClick={resetAll} style={{
              padding: "12px 16px", borderRadius: 12,
              border: `1.5px solid ${C.border}`, background: "white",
              color: C.black, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            }}>
              <RotateCcw size={15} />
              Nova
            </button>
          </div>
        )}

        {/* Upload progress */}
        {state === "uploading" && (
          <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.blush }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Enviando gravação...</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.rose }}>{progress}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.rose}, #e8729a)`, width: `${progress}%`, transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* Processing */}
        {state === "processing" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: 16,
            borderRadius: 12, border: `1px solid ${C.border}`, background: C.blush,
          }}>
            <Loader2 size={18} color={C.rose} style={{ animation: "spin 1s linear infinite" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.black }}>Processando vídeo...</div>
              <div style={{ fontSize: 12, color: C.muted }}>Convertendo para streaming HLS. Aguarde.</div>
            </div>
          </div>
        )}

        {/* Ready */}
        {state === "ready" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: 16,
            borderRadius: 12, border: "1px solid #86efac", background: "#f0fdf4",
          }}>
            <CheckCircle size={20} color="#16a34a" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Vídeo pronto! 🎉</div>
              <div style={{ fontSize: 12, color: "#16a34a" }}>Gravação enviada com sucesso.</div>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      {state === "idle" && mode === "pip" && (
        <div style={{ padding: "12px 14px", borderRadius: 10, background: C.blush, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 6 }}>💡 Dica para gravação Tela + Câmera</p>
          <ul style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, paddingLeft: 14, margin: 0 }}>
            <li>Você vai escolher qual janela ou aba compartilhar</li>
            <li>Seu rosto aparece como overlay no canto da tela</li>
            <li>Ajuste a posição e o tamanho da câmera acima</li>
            <li>Clique em "Testar câmera" para verificar antes de gravar</li>
          </ul>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
