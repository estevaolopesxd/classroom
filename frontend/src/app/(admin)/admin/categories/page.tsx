"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  bg: "#F8F3F6",
  white: "#FFFFFF",
};

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  order: number;
}

const PRESET_COLORS = [
  "#D4437C","#8B1A42","#E07B39","#F59E0B","#16a34a",
  "#0891b2","#6366f1","#7c3aed","#db2777","#374151",
];

const emptyForm = { name: "", color: "#D4437C", icon: "", order: 0 };

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Category[]>("/api/categories");
      setCategories(res.data);
    } catch { /* silencioso */ } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, color: cat.color, icon: cat.icon || "", order: cat.order });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        color: form.color,
        icon: form.icon.trim() || undefined,
        order: Number(form.order),
      };
      if (editingId) {
        const res = await api.put<Category>(`/api/categories/${editingId}`, payload);
        setCategories(prev => prev.map(c => c.id === editingId ? res.data : c));
      } else {
        const res = await api.post<Category>("/api/categories", payload);
        setCategories(prev => [...prev, res.data].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || "Erro ao salvar categoria");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir categoria "${name}"? Os cursos vinculados perderão a categoria.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/api/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch { alert("Erro ao excluir categoria"); } finally { setDeleting(null); }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.ink, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Categorias</h1>
          <p style={{ fontSize: 14, color: S.muted, margin: 0 }}>Organize os cursos por categoria</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
            color: "white", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: `0 4px 14px ${S.rose}30`,
          }}
        >
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <Loader2 size={28} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : categories.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 0",
          background: S.bg, borderRadius: 16, border: `1px dashed ${S.border}`,
        }}>
          <Tag size={32} color={`${S.muted}66`} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: S.muted, margin: 0 }}>Nenhuma categoria criada ainda.</p>
        </div>
      ) : (
        <div style={{ background: S.white, borderRadius: 16, border: `1px solid ${S.border}`, overflow: "hidden" }}>
          {categories.map((cat, i) => (
            <div key={cat.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              borderBottom: i < categories.length - 1 ? `1px solid ${S.border}` : "none",
            }}>
              {/* Color dot + icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: cat.color, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {cat.icon
                  ? <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  : <Tag size={16} color="white" />
                }
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: S.ink }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: S.muted }}>{cat.slug} · ordem {cat.order}</div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => openEdit(cat)}
                  style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${S.border}`, background: S.white, color: S.ink, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}
                >
                  <Pencil size={12} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={deleting === cat.id}
                  style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #dc262633", background: "transparent", color: "#dc2626", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}
                >
                  {deleting === cat.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,10,18,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: S.white, borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: S.ink, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              {editingId ? "Editar categoria" : "Nova categoria"}
            </h2>

            {/* Name */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.muted, marginBottom: 5 }}>Nome *</label>
            <input
              autoFocus
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
              placeholder="Ex: Manicure, Estética, Design..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 9,
                border: `1.5px solid ${S.border}`, fontSize: 14, color: S.ink,
                background: S.white, outline: "none", fontFamily: "inherit",
                boxSizing: "border-box", marginBottom: 16,
              }}
              onFocus={e => (e.target.style.borderColor = S.rose)}
              onBlur={e => (e.target.style.borderColor = S.border)}
            />

            {/* Icon emoji */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.muted, marginBottom: 5 }}>Emoji / Ícone (opcional)</label>
            <input
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              placeholder="Ex: 💅 ✨ 🎨"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 9,
                border: `1.5px solid ${S.border}`, fontSize: 20, color: S.ink,
                background: S.white, outline: "none", fontFamily: "inherit",
                boxSizing: "border-box", marginBottom: 16,
              }}
              onFocus={e => (e.target.style.borderColor = S.rose)}
              onBlur={e => (e.target.style.borderColor = S.border)}
            />

            {/* Color */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.muted, marginBottom: 8 }}>Cor</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: 7, background: c, border: "none",
                    cursor: "pointer", outline: form.color === c ? `2px solid ${S.ink}` : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${S.border}`, cursor: "pointer", padding: 0 }}
              />
            </div>
            <div style={{ marginBottom: 16, fontSize: 12, color: S.muted }}>{form.color}</div>

            {/* Order */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.muted, marginBottom: 5 }}>Ordem de exibição</label>
            <input
              type="number"
              value={form.order}
              onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 9,
                border: `1.5px solid ${S.border}`, fontSize: 14, color: S.ink,
                background: S.white, outline: "none", fontFamily: "inherit",
                boxSizing: "border-box", marginBottom: 24,
              }}
              onFocus={e => (e.target.style.borderColor = S.rose)}
              onBlur={e => (e.target.style.borderColor = S.border)}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${S.border}`, background: "transparent", color: S.muted, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                style={{
                  padding: "9px 20px", borderRadius: 9, border: "none",
                  background: S.rose, color: "white", fontSize: 14, fontWeight: 700,
                  cursor: saving || !form.name.trim() ? "not-allowed" : "pointer",
                  opacity: saving || !form.name.trim() ? 0.6 : 1,
                  fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {editingId ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
