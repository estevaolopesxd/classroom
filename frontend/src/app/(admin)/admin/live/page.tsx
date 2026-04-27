"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { LiveStreamBroadcaster } from "@/components/video/LiveStreamBroadcaster";
import { Plus, Radio, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  overlay: "rgba(26,10,18,0.45)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${S.border}`, background: S.white,
  fontSize: 14, color: S.ink, outline: "none", fontFamily: "inherit",
};

interface LiveStream {
  id: string;
  title: string;
  streamKey: string;
  hlsUrl?: string;
  status: "Scheduled" | "Live" | "Ended";
  createdAt: string;
  rtmpUrl?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminLivePage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [broadcastStream, setBroadcastStream] = useState<LiveStream | null>(null);

  const load = () => {
    adminApi.getStreams().then((data) => setStreams(data as LiveStream[])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createStream = async () => {
    if (!title) return;
    setCreating(true);
    try {
      const stream = await adminApi.createStream({ title }) as LiveStream;
      toast.success("Transmissão criada!");
      setModal(false);
      setTitle("");
      load();
      setBroadcastStream(stream);
    } catch {
      toast.error("Erro ao criar transmissão");
    } finally {
      setCreating(false);
    }
  };

  const endStream = async (id: string) => {
    if (!confirm("Encerrar esta transmissão?")) return;
    try {
      await adminApi.endStream(id);
      toast.success("Transmissão encerrada");
      if (broadcastStream?.id === id) setBroadcastStream(null);
      load();
    } catch {
      toast.error("Erro ao encerrar transmissão");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      Live: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Ao vivo" },
      Scheduled: { bg: "rgba(202,138,4,0.1)", color: "#ca8a04", label: "Agendado" },
      Ended: { bg: "rgba(0,0,0,0.06)", color: S.muted, label: "Encerrado" },
    };
    const s = map[status] ?? map.Ended;
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.ink, margin: 0, letterSpacing: "-0.03em" }}>Lives</h1>
          <p style={{ fontSize: 14, color: S.muted, margin: "4px 0 0" }}>Gerencie transmissões ao vivo</p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
            color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(212,67,124,0.35)", fontFamily: "inherit",
          }}
        >
          <Plus size={16} /> Nova transmissão
        </button>
      </div>

      {/* Active broadcaster */}
      {broadcastStream && (
        <div style={{
          background: "rgba(239,68,68,0.04)", borderRadius: 14,
          border: "1.5px solid rgba(239,68,68,0.25)", padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Radio size={16} color="#ef4444" style={{ animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: S.ink }}>{broadcastStream.title}</span>
            </div>
            <button
              onClick={() => endStream(broadcastStream.id)}
              style={{
                padding: "7px 16px", borderRadius: 9, border: "none",
                background: "#ef4444", color: "white", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Encerrar
            </button>
          </div>
          <LiveStreamBroadcaster
            streamId={broadcastStream.id}
            apiBaseUrl={API_BASE}
            onStarted={() => load()}
            onEnded={() => { load(); }}
          />
        </div>
      )}

      {/* Stream list */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
          <Loader2 size={28} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {streams.map(stream => (
            <div key={stream.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", background: S.white,
              borderRadius: 12, border: `1px solid ${S.border}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: S.ink }}>{stream.title}</span>
                  {statusBadge(stream.status)}
                </div>
                {stream.streamKey && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: S.muted, fontFamily: "monospace" }}>
                      Key: {stream.streamKey}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(stream.streamKey); toast.success("Copiado!"); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <Copy size={12} color={S.muted} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {stream.status === "Scheduled" && (
                  <button
                    onClick={() => setBroadcastStream(stream)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 9, border: "none",
                      background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                      color: "white", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <Radio size={13} /> Iniciar
                  </button>
                )}
                {stream.status === "Live" && (
                  <button
                    onClick={() => endStream(stream.id)}
                    style={{
                      padding: "7px 14px", borderRadius: 9, border: "none",
                      background: "#ef4444", color: "white", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Encerrar
                  </button>
                )}
              </div>
            </div>
          ))}

          {streams.length === 0 && (
            <div style={{
              textAlign: "center", padding: "64px 24px",
              border: `2px dashed ${S.border}`, borderRadius: 16, background: S.bg,
            }}>
              <Radio size={36} color={S.border} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: S.ink, marginBottom: 4 }}>Nenhuma transmissão criada</p>
              <p style={{ fontSize: 13, color: S.muted, marginBottom: 20 }}>Inicie uma live diretamente pelo navegador.</p>
              <button
                onClick={() => setModal(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                  color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(212,67,124,0.35)", fontFamily: "inherit",
                }}
              >
                <Plus size={16} /> Criar primeira live
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Create modal ── */}
      {modal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999, background: S.overlay,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}
        >
          <div style={{
            background: S.white, borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 440,
            boxShadow: "0 20px 60px rgba(26,10,18,0.18)",
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: S.ink, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Nova transmissão ao vivo
            </h2>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: S.ink, display: "block", marginBottom: 6 }}>
                Título da live
              </label>
              <input
                placeholder="Ex: Aula ao vivo — Técnicas de esmaltação"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createStream()}
                style={inputStyle}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={createStream}
                disabled={creating || !title}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: creating || !title ? "#d0bbc5" : `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                  color: "white", fontSize: 14, fontWeight: 700,
                  cursor: creating || !title ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {creating && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                Criar e transmitir
              </button>
              <button
                onClick={() => setModal(false)}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "10px 18px", borderRadius: 10,
                  border: `1.5px solid ${S.border}`, background: S.white,
                  color: S.ink, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
