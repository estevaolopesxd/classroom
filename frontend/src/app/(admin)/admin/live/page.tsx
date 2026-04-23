"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { LiveStreamBroadcaster } from "@/components/video/LiveStreamBroadcaster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Radio, Clock, CheckCircle, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

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
  const [createDialog, setCreateDialog] = useState(false);
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
      setCreateDialog(false);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const statusColor = (status: string) => {
    if (status === "Live") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (status === "Scheduled") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-muted text-muted-foreground";
  };

  const statusLabel = (status: string) => {
    if (status === "Live") return "Ao vivo";
    if (status === "Scheduled") return "Agendado";
    return "Encerrado";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lives</h1>
          <p className="text-muted-foreground">Gerencie transmissões ao vivo</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="gap-2">
          <Plus className="size-4" /> Nova transmissão
        </Button>
      </div>

      {/* Active broadcaster */}
      {broadcastStream && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="size-4 text-red-400 animate-pulse" />
                {broadcastStream.title}
              </CardTitle>
              <Button variant="destructive" size="sm" onClick={() => endStream(broadcastStream.id)}>
                Encerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <LiveStreamBroadcaster
              streamId={broadcastStream.id}
              apiBaseUrl={API_BASE}
              onStarted={() => load()}
              onEnded={() => { load(); }}
            />
          </CardContent>
        </Card>
      )}

      {/* Stream list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {streams.map(stream => (
            <Card key={stream.id} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{stream.title}</h3>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${statusColor(stream.status)}`}>
                      {statusLabel(stream.status)}
                    </Badge>
                  </div>
                  {stream.streamKey && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                        Key: {stream.streamKey}
                      </p>
                      <button onClick={() => copyToClipboard(stream.streamKey)} className="shrink-0">
                        <Copy className="size-3 text-muted-foreground hover:text-foreground transition-colors" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {stream.status === "Scheduled" && (
                    <Button size="sm" onClick={() => setBroadcastStream(stream)} className="gap-2">
                      <Radio className="size-3" /> Iniciar
                    </Button>
                  )}
                  {stream.status === "Live" && (
                    <Button size="sm" variant="destructive" onClick={() => endStream(stream.id)}>
                      Encerrar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {streams.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-xl">
              <Radio className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma transmissão criada.</p>
              <Button onClick={() => setCreateDialog(true)} className="mt-4 gap-2">
                <Plus className="size-4" /> Criar primeira live
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova transmissão ao vivo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da live</Label>
              <Input
                placeholder="Ex: Aula ao vivo — Técnicas de esmaltação"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createStream()}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button onClick={createStream} disabled={creating || !title}>
              {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Criar e transmitir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
