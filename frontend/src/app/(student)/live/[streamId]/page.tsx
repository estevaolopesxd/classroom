"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Hls from "hls.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Users, ArrowLeft, Loader2, WifiOff } from "lucide-react";
import Link from "next/link";

interface StreamInfo {
  id: string;
  title: string;
  hlsUrl?: string;
  status: "Scheduled" | "Live" | "Ended";
  viewerCount?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function LiveViewerPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    // Fetch stream info
    fetch(`${API_BASE}/api/streams/${streamId}`)
      .then(r => r.json())
      .then((data: StreamInfo) => {
        setStream(data);
        setLoading(false);
        if (data.hlsUrl && data.status === "Live") {
          initHls(data.hlsUrl);
        }
      })
      .catch(() => setLoading(false));

    // Poll for viewer count and stream status
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/streams/${streamId}`);
        const data: StreamInfo = await r.json();
        setStream(data);
        if (data.viewerCount !== undefined) setViewerCount(data.viewerCount);
        if (data.hlsUrl && data.status === "Live" && !hlsRef.current) {
          initHls(data.hlsUrl);
        }
      } catch {}
    }, 5000);

    return () => {
      clearInterval(poll);
      hlsRef.current?.destroy();
    };
  }, [streamId]);

  const initHls = (hlsUrl: string) => {
    if (!videoRef.current) return;
    const fullUrl = hlsUrl.startsWith("http") ? hlsUrl : `${API_BASE}/${hlsUrl.replace(/^\//, "")}`;

    if (Hls.isSupported()) {
      const hls = new Hls({ liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 5 });
      hls.loadSource(fullUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => videoRef.current?.play().catch(() => {}));
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = fullUrl;
      videoRef.current.play().catch(() => {});
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (!stream) return (
    <div className="text-center py-20">
      <WifiOff className="size-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">Transmissão não encontrada.</p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-xl truncate">{stream.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            {stream.status === "Live" ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                <div className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                Ao vivo
              </Badge>
            ) : stream.status === "Scheduled" ? (
              <Badge variant="secondary">Em breve</Badge>
            ) : (
              <Badge variant="secondary">Encerrado</Badge>
            )}
            {viewerCount > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="size-3" /> {viewerCount} assistindo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Video player */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          playsInline
        />

        {stream.status === "Scheduled" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <Radio className="size-12 text-white/30 mb-3" />
            <p className="text-white font-semibold">Transmissão em breve</p>
            <p className="text-white/60 text-sm mt-1">Aguarde o início da live</p>
          </div>
        )}

        {stream.status === "Ended" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <WifiOff className="size-12 text-white/30 mb-3" />
            <p className="text-white font-semibold">Transmissão encerrada</p>
          </div>
        )}
      </div>

      {stream.status === "Scheduled" && (
        <div className="p-4 rounded-xl border border-border/50 bg-card/50 text-center text-sm text-muted-foreground">
          A transmissão ainda não começou. Esta página será atualizada automaticamente quando iniciar.
        </div>
      )}
    </div>
  );
}
