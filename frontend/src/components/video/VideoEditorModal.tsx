"use client";

/**
 * VideoEditorModal
 *
 * Modal de visualização e edição de vídeo no painel admin.
 * Features:
 *  - Player HLS completo
 *  - Timeline arrastável com handles de corte (in/out)
 *  - Botão "Aparar" → cria novo vídeo cortado via API
 *  - Polling do status do novo vídeo
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { videosApi } from "@/lib/api/videos";
import {
  X, Scissors, Play, Pause, Volume2, VolumeX,
  Loader2, CheckCircle, AlertCircle, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { VideoTutorial } from "./VideoTutorial";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  green: "#16a34a",
  overlay: "rgba(26,10,18,0.6)",
};

interface Props {
  videoId: string;
  lessonTitle: string;
  onClose: () => void;
  /** Chamado quando um vídeo cortado fica pronto — passa o novo videoId */
  onTrimReady?: (newVideoId: string) => void;
}

function fmt(s: number): string {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function VideoEditorModal({ videoId, lessonTitle, onClose, onTrimReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  // Pontos de corte
  const [trimIn, setTrimIn] = useState(0);
  const [trimOut, setTrimOut] = useState(0);
  const draggingRef = useRef<"in" | "out" | null>(null);

  // Estado do trim
  const [trimming, setTrimming] = useState(false);
  const [trimStatus, setTrimStatus] = useState<"idle" | "processing" | "done" | "failed">("idle");
  const [newVideoId, setNewVideoId] = useState<string | null>(null);
  const [trimTitle, setTrimTitle] = useState("");

  // 1. Busca a URL do vídeo
  useEffect(() => {
    videosApi.getPlayUrl(videoId)
      .then(({ url }) => setHlsUrl(url))
      .catch(() => toast.error("Não foi possível carregar o vídeo"));
  }, [videoId]);

  // 2. Carrega HLS.js
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;
    const video = videoRef.current;

    const load = async () => {
      const Hls = (await import("hls.js")).default;
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: false });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => setReady(true));
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        setReady(true);
      }
    };
    load();
    return () => { hlsRef.current?.destroy(); };
  }, [hlsUrl]);

  // 3. Quando vídeo está pronto, define duração e trimOut padrão
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMeta = () => {
      setDuration(video.duration);
      setTrimOut(video.duration);
      setTrimTitle(lessonTitle + " (cortado)");
    };
    const onTime = () => setCurrentTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [lessonTitle]);

  // 4. Drag handlers para os handles da timeline
  const getTimeFromEvent = useCallback((e: MouseEvent) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return pct * duration;
  }, [duration]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const t = getTimeFromEvent(e);
      if (draggingRef.current === "in")  setTrimIn(Math.min(t, trimOut - 0.5));
      if (draggingRef.current === "out") setTrimOut(Math.max(t, trimIn + 0.5));
    };
    const onUp = () => { draggingRef.current = null; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [getTimeFromEvent, trimIn, trimOut]);

  // Clique na timeline → seek
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggingRef.current) return;
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = pct * duration;
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  // Botões play/pause/mute
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    isPlaying ? v.pause() : v.play();
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };
  const seekTo = (t: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  // Dispara o trim
  const handleTrim = async () => {
    if (trimIn >= trimOut) { toast.error("Intervalo inválido"); return; }
    setTrimming(true);
    setTrimStatus("idle");
    try {
      const result = await videosApi.trimVideo(videoId, trimIn, trimOut, trimTitle || undefined);
      setNewVideoId(result.id);
      setTrimStatus("processing");
      toast.success("Corte iniciado! Processando...");

      // Polling de status
      const poll = setInterval(async () => {
        try {
          const v = await videosApi.getStatus(result.id);
          if (v.status === "Ready") {
            clearInterval(poll);
            setTrimStatus("done");
            toast.success("Vídeo cortado pronto! 🎉");
            onTrimReady?.(result.id);
          } else if (v.status === "Failed") {
            clearInterval(poll);
            setTrimStatus("failed");
            toast.error("Falha ao processar o corte");
          }
        } catch { /* ignora erros de polling */ }
      }, 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao cortar vídeo");
      setTrimStatus("failed");
    } finally {
      setTrimming(false);
    }
  };

  const trimDuration = trimOut - trimIn;
  const inPct  = duration > 0 ? (trimIn  / duration) * 100 : 0;
  const outPct = duration > 0 ? (trimOut / duration) * 100 : 100;
  const curPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: S.overlay,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ve-handle { cursor: ew-resize; position: absolute; top: -4px; bottom: -4px; width: 14px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; }
        .ve-handle::after { content: ""; width: 4px; height: 100%; border-radius: 3px; background: ${S.white}; box-shadow: 0 0 0 2px ${S.rose}; }
      `}</style>

      <div style={{
        background: S.white, borderRadius: 18, width: "100%", maxWidth: 780,
        maxHeight: "95vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px 14px", borderBottom: `1px solid ${S.border}`,
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: S.ink, margin: 0 }}>
              Visualizar &amp; Editar Vídeo
            </h2>
            <p style={{ fontSize: 12, color: S.muted, margin: "2px 0 0" }}>{lessonTitle}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border}`,
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} color={S.muted} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── PLAYER ── */}
          <div style={{ position: "relative", background: "#000", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", display: "block" }}
              playsInline
              preload="metadata"
            />
            {!ready && (
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center", background: "#000",
              }}>
                <Loader2 size={36} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
          </div>

          {/* Controles de playback */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={togglePlay} disabled={!ready}
              style={{
                width: 38, height: 38, borderRadius: "50%", border: "none",
                background: ready ? `linear-gradient(135deg, ${S.rose}, ${S.roseDark})` : S.border,
                cursor: ready ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: ready ? `0 4px 12px ${S.rose}40` : "none",
              }}
            >
              {isPlaying
                ? <Pause size={16} color="white" fill="white" />
                : <Play size={16} color="white" fill="white" />
              }
            </button>
            <span style={{ fontSize: 13, color: S.ink, fontVariantNumeric: "tabular-nums", minWidth: 80 }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>
            <button onClick={toggleMute} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {muted ? <VolumeX size={16} color={S.muted} /> : <Volume2 size={16} color={S.muted} />}
            </button>
          </div>

          {/* ── TIMELINE DE CORTE ── */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              ✂️ Linha do tempo — defina os pontos de corte
            </p>

            {/* Barra */}
            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              style={{
                position: "relative", height: 40, borderRadius: 8,
                background: "#e5d8e0", cursor: "pointer", userSelect: "none",
              }}
            >
              {/* Região selecionada */}
              <div style={{
                position: "absolute", top: 0, bottom: 0,
                left: `${inPct}%`, width: `${outPct - inPct}%`,
                background: `${S.rose}40`, borderRadius: 4,
              }} />

              {/* Linha da posição atual */}
              <div style={{
                position: "absolute", top: 0, bottom: 0, width: 2,
                left: `${curPct}%`, background: "white",
                boxShadow: "0 0 4px rgba(0,0,0,0.4)",
                pointerEvents: "none",
              }} />

              {/* Handle IN */}
              <div
                className="ve-handle"
                style={{ left: `${inPct}%` }}
                onMouseDown={(e) => { e.stopPropagation(); draggingRef.current = "in"; seekTo(trimIn); }}
              />

              {/* Handle OUT */}
              <div
                className="ve-handle"
                style={{ left: `${outPct}%` }}
                onMouseDown={(e) => { e.stopPropagation(); draggingRef.current = "out"; seekTo(trimOut); }}
              />
            </div>

            {/* Marcadores de tempo */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: S.muted }}>0:00</span>
              <span style={{ fontSize: 10, color: S.muted }}>{fmt(duration)}</span>
            </div>

            {/* Info dos pontos */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10,
            }}>
              {[
                { label: "▷ Início do corte", time: trimIn, action: () => { setTrimIn(currentTime); }, seek: () => seekTo(trimIn) },
                { label: "◁ Fim do corte",    time: trimOut, action: () => { setTrimOut(currentTime); }, seek: () => seekTo(trimOut) },
                { label: "⏱ Duração",          time: trimDuration, action: null, seek: null },
              ].map(({ label, time, action, seek }) => (
                <div key={label} style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: S.bg, border: `1px solid ${S.border}`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, color: S.muted, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: S.ink, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(time)}
                  </div>
                  {action && (
                    <button
                      onClick={action}
                      title="Definir aqui (posição atual)"
                      style={{
                        marginTop: 6, fontSize: 10, padding: "2px 8px", borderRadius: 6,
                        border: `1px solid ${S.border}`, background: S.white,
                        cursor: "pointer", color: S.rose, fontWeight: 600, fontFamily: "inherit",
                      }}
                    >
                      Definir aqui
                    </button>
                  )}
                  {seek && (
                    <button
                      onClick={seek}
                      title="Ir para este ponto"
                      style={{
                        marginTop: 2, fontSize: 10, padding: "2px 8px", borderRadius: 6,
                        border: `1px solid ${S.border}`, background: S.white,
                        cursor: "pointer", color: S.muted, fontFamily: "inherit",
                      }}
                    >
                      Ir até
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── AÇÃO DE CORTE ── */}
          <div style={{
            borderTop: `1px solid ${S.border}`, paddingTop: 18,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {trimStatus === "idle" && (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: S.ink, display: "block", marginBottom: 6 }}>
                    Nome do vídeo cortado
                  </label>
                  <input
                    value={trimTitle}
                    onChange={(e) => setTrimTitle(e.target.value)}
                    placeholder="Ex: Módulo 1 — Introdução (cortado)"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "9px 12px", borderRadius: 8,
                      border: `1.5px solid ${S.border}`, background: S.white,
                      fontSize: 13, color: S.ink, fontFamily: "inherit", outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    onClick={handleTrim}
                    disabled={trimming || !ready || trimIn >= trimOut}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "10px 20px", borderRadius: 10, border: "none",
                      background: (trimming || !ready || trimIn >= trimOut)
                        ? "#d0bbc5"
                        : `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                      color: "white", fontSize: 14, fontWeight: 700,
                      cursor: (trimming || !ready || trimIn >= trimOut) ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(212,67,124,0.3)",
                      fontFamily: "inherit",
                    }}
                  >
                    {trimming
                      ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</>
                      : <><Scissors size={15} /> Aparar vídeo ({fmt(trimIn)} → {fmt(trimOut)})</>
                    }
                  </button>
                  <button
                    onClick={() => { setTrimIn(0); setTrimOut(duration); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "10px 14px", borderRadius: 10, border: `1px solid ${S.border}`,
                      background: S.white, color: S.muted, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <RotateCcw size={13} /> Resetar
                  </button>
                </div>
                <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>
                  O vídeo original não é alterado. Será criado um novo vídeo cortado.
                </p>
              </>
            )}

            {trimStatus === "processing" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                borderRadius: 12, border: `1px solid ${S.border}`, background: S.bg,
              }}>
                <Loader2 size={20} color={S.rose} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: S.ink, margin: 0 }}>Processando corte...</p>
                  <p style={{ fontSize: 12, color: S.muted, margin: "2px 0 0" }}>O FFmpeg está gerando o novo vídeo HLS. Aguarde.</p>
                </div>
              </div>
            )}

            {trimStatus === "done" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                borderRadius: 12, border: "1px solid #86efac", background: "#f0fdf4",
              }}>
                <CheckCircle size={20} color={S.green} style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: S.green, margin: 0 }}>Vídeo cortado pronto!</p>
                  <p style={{ fontSize: 12, color: "#15803d", margin: "2px 0 0" }}>
                    Novo vídeo criado com sucesso. Você pode vinculá-lo a uma aula.
                  </p>
                </div>
                <button
                  onClick={() => { setTrimStatus("idle"); setTrimIn(0); setTrimOut(duration); }}
                  style={{
                    marginLeft: "auto", padding: "6px 12px", borderRadius: 8,
                    border: "1px solid #86efac", background: "transparent",
                    color: S.green, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Novo corte
                </button>
              </div>
            )}

            {trimStatus === "failed" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
              }}>
                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: S.ink, margin: 0 }}>Falha ao processar o corte. Tente novamente.</p>
                <button
                  onClick={() => setTrimStatus("idle")}
                  style={{
                    marginLeft: "auto", padding: "6px 12px", borderRadius: 8,
                    border: "1px solid rgba(239,68,68,0.3)", background: "transparent",
                    color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
          {/* Tutorial do editor */}
          <VideoTutorial defaultOpen="editor" />

        </div>
      </div>
    </div>
  );
}
