"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { coursesApi } from "@/lib/api/courses";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  borderRadius: 10,
  border: `1.5px solid ${S.border}`,
  background: S.white,
  fontSize: 14,
  color: S.ink,
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: S.ink,
  display: "block",
  marginBottom: 6,
};

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    level: "",
    price: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setLoading(true);
    try {
      const course = await coursesApi.create({
        title: form.title,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        level: form.level || undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        currency: "BRL",
      });
      toast.success("Curso criado com sucesso!");
      router.push(`/admin/courses/${course.id}`);
    } catch {
      toast.error("Erro ao criar curso");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !form.title;

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href="/admin/courses" style={{ textDecoration: "none" }}>
          <button
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: `1px solid ${S.border}`, background: S.white,
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowLeft size={16} color={S.ink} />
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: S.ink, margin: 0, letterSpacing: "-0.03em" }}>
            Novo Curso
          </h1>
          <p style={{ fontSize: 13, color: S.muted, margin: "2px 0 0" }}>
            Preencha as informações básicas
          </p>
        </div>
      </div>

      {/* Form card */}
      <div style={{
        background: S.white, borderRadius: 16,
        border: `1px solid ${S.border}`, padding: 28,
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Título do curso *</label>
            <input
              placeholder="Ex: Curso completo de manicure"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              style={inputStyle}
            />
          </div>

          {/* Short description */}
          <div>
            <label style={labelStyle}>Descrição curta</label>
            <input
              placeholder="Uma linha sobre o curso"
              value={form.shortDescription}
              onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Full description */}
          <div>
            <label style={labelStyle}>Descrição completa</label>
            <textarea
              placeholder="Descreva o que os alunos vão aprender..."
              rows={4}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Level + Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Nível</label>
              <select
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
              >
                <option value="">Selecionar...</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Preço (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00 = Gratuito"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={disabled}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 24px", borderRadius: 10, border: "none",
                background: disabled
                  ? "#ccc"
                  : `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                color: "white", fontSize: 14, fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer",
                boxShadow: disabled ? "none" : "0 4px 14px rgba(212,67,124,0.35)",
                fontFamily: "inherit", transition: "opacity 0.15s",
              }}
            >
              {loading && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Criando..." : "Criar curso"}
            </button>

            <Link href="/admin/courses" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "11px 20px", borderRadius: 10,
                  border: `1.5px solid ${S.border}`, background: S.white,
                  color: S.ink, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
