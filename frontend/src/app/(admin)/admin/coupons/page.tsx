"use client";

import { useEffect, useState, useCallback } from "react";
import { couponsApi, type CouponDto, type CreateCouponRequest } from "@/lib/api/coupons";
import { coursesApi } from "@/lib/api/courses";
import type { Course } from "@/types";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Tag, ChevronDown, ChevronUp, X } from "lucide-react";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  green: "#16a34a",
  greenBg: "rgba(22,163,74,0.1)",
  red: "#dc2626",
  redBg: "rgba(220,38,38,0.1)",
  yellow: "#ca8a04",
  yellowBg: "rgba(202,138,4,0.1)",
};

const fmt = (val: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(val);

function Badge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 99,
        background: active ? S.greenBg : S.redBg,
        color: active ? S.green : S.red,
      }}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

interface FormState {
  code: string;
  discountPercent: string;
  courseId: string;
  isActive: boolean;
  expiresAt: string;
  maxUses: string;
}

const emptyForm: FormState = {
  code: "",
  discountPercent: "",
  courseId: "",
  isActive: true,
  expiresAt: "",
  maxUses: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Live preview
  const selectedCourse = courses.find((c) => c.id === form.courseId);
  const discountNum = parseFloat(form.discountPercent) || 0;
  const originalPrice = selectedCourse?.price ?? 0;
  const savedAmount = originalPrice > 0 ? Math.round(originalPrice * discountNum) / 100 : 0;
  const finalPrice = Math.max(0, originalPrice - savedAmount);

  const load = useCallback(async () => {
    try {
      const [c, cs] = await Promise.all([
        couponsApi.getAll(),
        coursesApi.getAll({ pageSize: 100 }).then((r) => r.data),
      ]);
      setCoupons(c);
      setCourses(cs.filter((c) => c.price && c.price > 0));
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const { code } = await couponsApi.generateCode();
      setForm((f) => ({ ...f, code }));
    } catch {
      toast.error("Erro ao gerar código");
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = parseFloat(form.discountPercent);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      toast.error("Desconto deve ser entre 1% e 100%");
      return;
    }
    setSaving(true);
    try {
      const req: CreateCouponRequest = {
        code: form.code.trim() || null,
        discountPercent: pct,
        courseId: form.courseId || null,
        isActive: form.isActive,
        expiresAt: form.expiresAt || null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      };
      await couponsApi.create(req);
      toast.success("Cupom criado com sucesso!");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erro ao criar cupom");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await couponsApi.toggle(id);
      setCoupons((prev) => prev.map((c) => (c.id === id ? updated : c)));
      toast.success(updated.isActive ? "Cupom ativado" : "Cupom desativado");
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Deletar cupom "${code}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await couponsApi.delete(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cupom deletado");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erro ao deletar cupom");
    }
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Tag size={22} color={S.rose} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: S.ink }}>Cupons de Desconto</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: S.rose, color: "#fff", border: "none",
            padding: "8px 16px", borderRadius: 8, cursor: "pointer",
            fontWeight: 600, fontSize: 14,
          }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Novo Cupom"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          style={{
            background: S.white, border: `1.5px solid ${S.border}`,
            borderRadius: 12, padding: 24, marginBottom: 28,
          }}
        >
          <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: S.ink }}>
            Criar novo cupom
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Code */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: S.ink }}>
                  Código
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="Deixe vazio para gerar automaticamente"
                    style={{
                      flex: 1, padding: "9px 12px", border: `1.5px solid ${S.border}`,
                      borderRadius: 8, fontSize: 14, fontFamily: "monospace",
                      background: S.white, color: S.ink, outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                    title="Gerar código aleatório"
                    style={{
                      padding: "9px 12px", border: `1.5px solid ${S.border}`,
                      borderRadius: 8, background: S.bg, cursor: "pointer",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <RefreshCw size={15} color={S.muted} className={generatingCode ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Discount % */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: S.ink }}>
                  Desconto (%)
                </label>
                <input
                  type="number"
                  value={form.discountPercent}
                  onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                  placeholder="Ex: 20"
                  min={1}
                  max={100}
                  required
                  style={{
                    width: "100%", padding: "9px 12px", border: `1.5px solid ${S.border}`,
                    borderRadius: 8, fontSize: 14, background: S.white,
                    color: S.ink, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Course */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: S.ink }}>
                  Curso (opcional)
                </label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                  style={{
                    width: "100%", padding: "9px 12px", border: `1.5px solid ${S.border}`,
                    borderRadius: 8, fontSize: 14, background: S.white,
                    color: form.courseId ? S.ink : S.muted, outline: "none", boxSizing: "border-box",
                  }}
                >
                  <option value="">Válido para todos os cursos</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {fmt(c.price!, c.currency || "BRL")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max uses */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: S.ink }}>
                  Máx. de usos (opcional)
                </label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Ilimitado"
                  min={1}
                  style={{
                    width: "100%", padding: "9px 12px", border: `1.5px solid ${S.border}`,
                    borderRadius: 8, fontSize: 14, background: S.white,
                    color: S.ink, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Expires at */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: S.ink }}>
                  Expira em (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  style={{
                    width: "100%", padding: "9px 12px", border: `1.5px solid ${S.border}`,
                    borderRadius: 8, fontSize: 14, background: S.white,
                    color: S.ink, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Active */}
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: S.rose, cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 14, color: S.ink }}>Cupom ativo</span>
                </label>
              </div>
            </div>

            {/* Live preview */}
            {selectedCourse && discountNum > 0 && (
              <div
                style={{
                  background: "rgba(212,67,124,0.06)", border: `1px solid ${S.border}`,
                  borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                  display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: 12, color: S.muted }}>Curso</span>
                  <div style={{ fontWeight: 600, fontSize: 14, color: S.ink }}>{selectedCourse.title}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: S.muted }}>Preço original</span>
                  <div style={{ fontWeight: 600, fontSize: 14, color: S.ink }}>{fmt(originalPrice, selectedCourse.currency || "BRL")}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: S.muted }}>Desconto ({discountNum}%)</span>
                  <div style={{ fontWeight: 600, fontSize: 14, color: S.red }}>− {fmt(savedAmount, selectedCourse.currency || "BRL")}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: S.muted }}>Preço final</span>
                  <div style={{ fontWeight: 700, fontSize: 18, color: S.green }}>{fmt(finalPrice, selectedCourse.currency || "BRL")}</div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); }}
                style={{
                  padding: "9px 18px", border: `1.5px solid ${S.border}`,
                  borderRadius: 8, background: S.white, color: S.muted,
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "9px 18px", border: "none",
                  borderRadius: 8, background: saving ? S.muted : S.rose,
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Salvando..." : "Criar Cupom"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: S.muted }}>Carregando...</div>
      ) : coupons.length === 0 ? (
        <div
          style={{
            background: S.white, border: `1.5px dashed ${S.border}`,
            borderRadius: 12, padding: 48, textAlign: "center", color: S.muted,
          }}
        >
          <Tag size={36} color={S.border} style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 15 }}>Nenhum cupom criado ainda.</p>
        </div>
      ) : (
        <div style={{ background: S.white, border: `1.5px solid ${S.border}`, borderRadius: 12, overflow: "hidden" }}>
          {coupons.map((coupon, idx) => {
            const expanded = expandedId === coupon.id;
            const cpOriginal = coupon.coursePrice ?? 0;
            const cpSaved = cpOriginal > 0 ? Math.round(cpOriginal * coupon.discountPercent) / 100 : 0;
            const cpFinal = Math.max(0, cpOriginal - cpSaved);

            return (
              <div
                key={coupon.id}
                style={{
                  borderTop: idx > 0 ? `1px solid ${S.border}` : "none",
                }}
              >
                {/* Row */}
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 20px", flexWrap: "wrap",
                  }}
                >
                  {/* Code */}
                  <span
                    style={{
                      fontFamily: "monospace", fontWeight: 700, fontSize: 15,
                      color: S.roseDark, background: "rgba(212,67,124,0.08)",
                      padding: "3px 10px", borderRadius: 6, letterSpacing: 1,
                      minWidth: 110, textAlign: "center",
                    }}
                  >
                    {coupon.code}
                  </span>

                  {/* Discount */}
                  <span
                    style={{
                      fontWeight: 700, fontSize: 15, color: S.rose,
                      minWidth: 50, textAlign: "center",
                    }}
                  >
                    {coupon.discountPercent}%
                  </span>

                  {/* Course or global */}
                  <span style={{ flex: 1, fontSize: 13, color: S.muted }}>
                    {coupon.courseTitle
                      ? `🎓 ${coupon.courseTitle}`
                      : "✅ Todos os cursos"}
                  </span>

                  {/* Usage */}
                  <span style={{ fontSize: 13, color: S.muted, minWidth: 70 }}>
                    {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ""} uso{coupon.usedCount !== 1 ? "s" : ""}
                  </span>

                  {/* Status badge */}
                  <Badge active={coupon.isActive} />

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(coupon.id)}
                      title={coupon.isActive ? "Desativar" : "Ativar"}
                      style={{
                        background: "none", border: `1.5px solid ${S.border}`,
                        borderRadius: 7, padding: "5px 7px", cursor: "pointer",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      {coupon.isActive
                        ? <ToggleRight size={17} color={S.green} />
                        : <ToggleLeft size={17} color={S.muted} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(coupon.id, coupon.code)}
                      title="Deletar"
                      disabled={coupon.usedCount > 0}
                      style={{
                        background: "none", border: `1.5px solid ${S.border}`,
                        borderRadius: 7, padding: "5px 7px",
                        cursor: coupon.usedCount > 0 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center",
                        opacity: coupon.usedCount > 0 ? 0.4 : 1,
                      }}
                    >
                      <Trash2 size={15} color={S.red} />
                    </button>

                    {/* Expand */}
                    <button
                      onClick={() => setExpandedId(expanded ? null : coupon.id)}
                      style={{
                        background: "none", border: `1.5px solid ${S.border}`,
                        borderRadius: 7, padding: "5px 7px", cursor: "pointer",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      {expanded
                        ? <ChevronUp size={15} color={S.muted} />
                        : <ChevronDown size={15} color={S.muted} />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div
                    style={{
                      background: S.bg, borderTop: `1px solid ${S.border}`,
                      padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 20,
                    }}
                  >
                    {coupon.courseTitle && coupon.coursePrice && (
                      <>
                        <div>
                          <div style={{ fontSize: 11, color: S.muted, marginBottom: 2 }}>Preço original</div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: S.ink }}>
                            {fmt(cpOriginal, coupon.courseCurrency || "BRL")}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: S.muted, marginBottom: 2 }}>Desconto</div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: S.red }}>
                            − {fmt(cpSaved, coupon.courseCurrency || "BRL")}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: S.muted, marginBottom: 2 }}>Preço com cupom</div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: S.green }}>
                            {fmt(cpFinal, coupon.courseCurrency || "BRL")}
                          </div>
                        </div>
                        <div style={{ width: 1, background: S.border }} />
                      </>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: S.muted, marginBottom: 2 }}>Usos</div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: S.ink }}>
                        {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : " (ilimitado)"}
                      </div>
                    </div>
                    {coupon.expiresAt && (
                      <div>
                        <div style={{ fontSize: 11, color: S.muted, marginBottom: 2 }}>Expira em</div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: S.ink }}>
                          {new Date(coupon.expiresAt).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: S.muted, marginBottom: 2 }}>Criado em</div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: S.ink }}>
                        {new Date(coupon.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
