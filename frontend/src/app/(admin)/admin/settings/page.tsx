"use client";

import { useEffect, useState } from "react";
import { themeApi } from "@/lib/api/theme";
import type { Theme } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Palette, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_THEME: Partial<Theme> = {
  primaryColor: "#6d28d9",
  secondaryColor: "#7c3aed",
  accentColor: "#a78bfa",
  backgroundColor: "#0f0f13",
  surfaceColor: "#1a1a24",
  textColor: "#f8fafc",
  fontFamily: "Inter",
};

export default function AdminSettingsPage() {
  const [theme, setTheme] = useState<Partial<Theme>>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    themeApi.getActive()
      .then((t) => setTheme(t))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const applyPreview = (t: Partial<Theme>) => {
    const root = document.documentElement;
    if (t.primaryColor) root.style.setProperty("--primary", hexToHsl(t.primaryColor));
    if (t.secondaryColor) root.style.setProperty("--secondary", hexToHsl(t.secondaryColor));
    if (t.accentColor) root.style.setProperty("--accent", hexToHsl(t.accentColor));
    if (t.backgroundColor) root.style.setProperty("--background", hexToHsl(t.backgroundColor));
    if (t.surfaceColor) root.style.setProperty("--card", hexToHsl(t.surfaceColor));
    if (t.textColor) root.style.setProperty("--foreground", hexToHsl(t.textColor));
  };

  const handleChange = (key: keyof Theme, value: string) => {
    const updated = { ...theme, [key]: value };
    setTheme(updated);
    if (key.includes("Color")) {
      try { applyPreview(updated); } catch {}
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await themeApi.update(theme);
      toast.success("Tema salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar tema");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
    applyPreview(DEFAULT_THEME);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  const colorFields: Array<{ key: keyof Theme; label: string; description: string }> = [
    { key: "primaryColor", label: "Cor primária", description: "Botões, links, destaques" },
    { key: "secondaryColor", label: "Cor secundária", description: "Elementos complementares" },
    { key: "accentColor", label: "Cor de destaque", description: "Badges, ícones ativos" },
    { key: "backgroundColor", label: "Fundo", description: "Cor de fundo da página" },
    { key: "surfaceColor", label: "Superfície", description: "Cards e painéis" },
    { key: "textColor", label: "Texto", description: "Cor principal do texto" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Personalize a aparência da plataforma</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="size-4" /> Tema de cores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            As cores são aplicadas em tempo real como pré-visualização. Clique em "Salvar" para persistir.
          </p>

          <div className="grid gap-4">
            {colorFields.map(({ key, label, description }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="size-8 rounded-full border-2 border-border/50 cursor-pointer shrink-0"
                    style={{ backgroundColor: (theme[key] as string) || "#000" }}
                    onClick={() => document.getElementById(`color-${key}`)?.click()}
                  />
                  <input
                    id={`color-${key}`}
                    type="color"
                    className="sr-only"
                    value={(theme[key] as string) || "#000000"}
                    onChange={e => handleChange(key, e.target.value)}
                  />
                  <Input
                    className="w-28 font-mono text-sm"
                    value={(theme[key] as string) || ""}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(val)) handleChange(key, val);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <Label>Fonte</Label>
            <Input
              value={theme.fontFamily || ""}
              onChange={e => setTheme(t => ({ ...t, fontFamily: e.target.value }))}
              placeholder="Ex: Inter, Roboto"
            />
          </div>

          <div className="space-y-2">
            <Label>URL do logotipo</Label>
            <Input
              value={theme.logoUrl || ""}
              onChange={e => setTheme(t => ({ ...t, logoUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          {/* Preview swatches */}
          <div className="p-4 rounded-xl border border-border/50 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pré-visualização</p>
            <div className="flex gap-2 flex-wrap">
              {colorFields.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="size-4 rounded-full border border-white/10" style={{ backgroundColor: (theme[key] as string) || "#000" }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: theme.primaryColor || "#6d28d9" }}
              >
                Botão primário
              </button>
              <button
                className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: theme.accentColor || "#a78bfa", color: theme.accentColor || "#a78bfa" }}
              >
                Botão outline
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: saving ? "#d0bbc5" : "linear-gradient(135deg, #D4437C, #8B1A42)",
                color: "white", fontSize: 14, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                boxShadow: saving ? "none" : "0 3px 12px rgba(212,67,124,0.3)",
              }}
            >
              {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
              Salvar tema
            </button>
            <button
              onClick={reset}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 10,
                border: "1.5px solid #EDCFDE", background: "#FFFFFF",
                color: "#1A0A12", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <RotateCcw size={14} /> Resetar padrão
            </button>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </CardContent>
      </Card>
    </div>
  );
}
