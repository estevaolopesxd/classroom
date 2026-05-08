"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { coursesApi } from "@/lib/api/courses";
import type { CourseDetail, Lesson } from "@/types";
import { VideoUploader } from "@/components/video/VideoUploader";
import { VideoRecorder } from "@/components/video/VideoRecorder";
import { VideoEditorModal } from "@/components/video/VideoEditorModal";
import { VideoTutorial } from "@/components/video/VideoTutorial";
import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
  Loader2, Eye, EyeOff, BookOpen, Video, FileText, Save, DollarSign, Play,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

/* ── Design tokens ─────────────────────────────────────────── */
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
  yellow: "#ca8a04",
  yellowBg: "rgba(202,138,4,0.1)",
  overlay: "rgba(26,10,18,0.45)",
};

/* ── Shared style helpers ───────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${S.border}`, background: S.white,
  fontSize: 14, color: S.ink, outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: S.ink,
  display: "block", marginBottom: 6,
};

/* ── Rose primary button ────────────────────────────────────── */
function BtnRose({ children, onClick, disabled, type = "button", fullWidth = false, small = false }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  fullWidth?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: small ? "7px 14px" : "10px 20px",
        borderRadius: 10, border: "none", width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
        background: disabled ? "#d0bbc5" : `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
        color: "white", fontSize: small ? 13 : 14, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 3px 10px rgba(212,67,124,0.3)",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

/* ── Outline button ─────────────────────────────────────────── */
function BtnOutline({ children, onClick, small = false }: {
  children: React.ReactNode;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: small ? "7px 14px" : "10px 18px",
        borderRadius: 10, border: `1.5px solid ${S.border}`, background: S.white,
        color: S.ink, fontSize: small ? 13 : 14, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

/* ── Icon button ────────────────────────────────────────────── */
function BtnIcon({ children, onClick, danger = false, title }: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 8,
        border: `1px solid ${danger ? "rgba(212,67,124,0.3)" : S.border}`,
        background: danger ? "rgba(212,67,124,0.06)" : S.white,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

/* ── Custom toggle ──────────────────────────────────────────── */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
          background: checked ? S.rose : "#d0bbc5",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
          padding: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: "50%",
          background: "white", transition: "left 0.2s",
        }} />
      </button>
      <span style={{ fontSize: 13, color: S.ink }}>{label}</span>
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: S.overlay,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: S.white, borderRadius: 16, padding: 28,
        width: "100%", maxWidth: wide ? 680 : 460,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(26,10,18,0.18)",
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: S.ink, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

/* ── Status badge ───────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    Published: { bg: S.greenBg, color: S.green, label: "Publicado" },
    Draft: { bg: S.yellowBg, color: S.yellow, label: "Rascunho" },
    Archived: { bg: "rgba(0,0,0,0.06)", color: S.muted, label: "Arquivado" },
  };
  const s = map[status] ?? map.Archived;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════════ */
export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "info" | "sale">("content");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", shortDescription: "", level: "", price: "" });
  const [saleEnabled, setSaleEnabled] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);

  // Module modal
  const [modModal, setModModal] = useState(false);
  const [modForm, setModForm] = useState({ title: "", isIntro: false });
  const [modLoading, setModLoading] = useState(false);

  // Lesson modal
  const [lessonModal, setLessonModal] = useState<{ open: boolean; moduleId: string }>({ open: false, moduleId: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", type: "Video", isFreePreview: false, textContent: "" });
  const [lessonLoading, setLessonLoading] = useState(false);

  // Video modal (adicionar/trocar vídeo)
  const [videoModal, setVideoModal] = useState<{ open: boolean; lesson: Lesson | null }>({ open: false, lesson: null });
  const [videoTab, setVideoTab] = useState<"upload" | "record">("upload");

  // Editor modal (visualizar + editar vídeo já vinculado)
  const [editorModal, setEditorModal] = useState<{ open: boolean; videoId: string; lessonTitle: string } | null>(null);

  /* ── Data loading ─────────────────────────────────────────── */
  const load = useCallback(async () => {
    try {
      const data = await coursesApi.getById(courseId);
      setCourse(data);
      setCourseForm({
        title: data.title,
        description: data.description || "",
        shortDescription: data.shortDescription || "",
        level: data.level || "",
        price: data.price?.toString() || "",
      });
      setSaleEnabled(data.isForSale);
    } catch {
      toast.error("Erro ao carregar curso");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  /* ── Actions ──────────────────────────────────────────────── */
  const saveCourse = async () => {
    setSaving(true);
    try {
      await coursesApi.update(courseId, {
        title: courseForm.title,
        description: courseForm.description || undefined,
        shortDescription: courseForm.shortDescription || undefined,
        level: courseForm.level || undefined,
      });
      toast.success("Curso salvo");
      load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const togglePublish = async () => {
    if (!course) return;
    setSaving(true);
    try {
      if (course.status === "Published") {
        await coursesApi.archive(courseId);
        toast.success("Curso arquivado");
      } else {
        await coursesApi.publish(courseId);
        toast.success("Curso publicado!");
      }
      load();
    } catch { toast.error("Erro ao atualizar status"); }
    finally { setSaving(false); }
  };

  const saveSaleSettings = async () => {
    setSaleLoading(true);
    try {
      await coursesApi.updateSaleSettings(courseId, {
        isForSale: saleEnabled,
        price: saleEnabled && courseForm.price ? parseFloat(courseForm.price) : undefined,
        currency: "BRL",
      });
      toast.success("Configurações de venda salvas");
      load();
    } catch { toast.error("Erro ao salvar configurações de venda"); }
    finally { setSaleLoading(false); }
  };

  const createModule = async () => {
    if (!modForm.title) return;
    setModLoading(true);
    try {
      await coursesApi.createModule(courseId, { title: modForm.title, isIntro: modForm.isIntro });
      toast.success("Módulo criado");
      setModModal(false);
      setModForm({ title: "", isIntro: false });
      load();
    } catch { toast.error("Erro ao criar módulo"); }
    finally { setModLoading(false); }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm("Excluir módulo e todas as aulas?")) return;
    try {
      await coursesApi.deleteModule(courseId, moduleId);
      toast.success("Módulo excluído");
      load();
    } catch { toast.error("Erro ao excluir módulo"); }
  };

  const createLesson = async () => {
    if (!lessonForm.title) return;
    setLessonLoading(true);
    try {
      await coursesApi.createLesson(lessonModal.moduleId, {
        title: lessonForm.title,
        type: lessonForm.type,
        isFreePreview: lessonForm.isFreePreview,
        textContent: lessonForm.type === "Text" ? lessonForm.textContent : undefined,
      });
      toast.success("Aula criada");
      setLessonModal({ open: false, moduleId: "" });
      setLessonForm({ title: "", type: "Video", isFreePreview: false, textContent: "" });
      load();
    } catch { toast.error("Erro ao criar aula"); }
    finally { setLessonLoading(false); }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm("Excluir esta aula?")) return;
    try {
      await coursesApi.deleteLesson(moduleId, lessonId);
      toast.success("Aula excluída");
      load();
    } catch { toast.error("Erro ao excluir aula"); }
  };

  const handleVideoReady = async (videoId: string) => {
    if (!videoModal.lesson) return;
    try {
      await coursesApi.updateLesson(videoModal.lesson.moduleId, videoModal.lesson.id, { videoId });
      toast.success("Vídeo vinculado à aula");
      setVideoModal({ open: false, lesson: null });
      load();
    } catch { toast.error("Erro ao vincular vídeo"); }
  };

  const toggleModule = (id: string) =>
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ── Loading / not found ──────────────────────────────────── */
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
      <Loader2 size={28} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!course) return null;

  /* ── Tab styles ───────────────────────────────────────────── */
  const tabBtn = (tab: typeof activeTab): React.CSSProperties => ({
    padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
    fontFamily: "inherit", fontSize: 14, fontWeight: 600, transition: "background 0.15s, color 0.15s",
    background: activeTab === tab ? S.rose : "transparent",
    color: activeTab === tab ? S.white : S.muted,
  });

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 780 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/courses" style={{ textDecoration: "none" }}>
            <button style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${S.border}`,
              background: S.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowLeft size={16} color={S.ink} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: S.ink, margin: 0, letterSpacing: "-0.03em" }}>
              {course.title}
            </h1>
            <div style={{ marginTop: 4 }}>
              <StatusBadge status={course.status} />
            </div>
          </div>
        </div>

        <button
          onClick={togglePublish}
          disabled={saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: 10, border: `1.5px solid ${S.border}`,
            background: course.status === "Published" ? S.white : `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
            color: course.status === "Published" ? S.ink : S.white,
            fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", boxShadow: course.status === "Published" ? "none" : "0 3px 12px rgba(212,67,124,0.3)",
          }}
        >
          {saving
            ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            : course.status === "Published" ? <EyeOff size={14} /> : <Eye size={14} />}
          {course.status === "Published" ? "Arquivar" : "Publicar"}
        </button>
      </div>

      {/* ── Tabs bar ── */}
      <div style={{
        display: "flex", gap: 4, background: S.bg,
        borderRadius: 12, padding: 4, marginBottom: 24,
        border: `1px solid ${S.border}`,
      }}>
        {(["content", "info", "sale"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabBtn(t)}>
            {t === "content" ? "Conteúdo" : t === "info" ? "Informações" : "Venda"}
          </button>
        ))}
      </div>

      {/* ══ CONTENT TAB ══ */}
      {activeTab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: S.muted }}>
              {course.totalModules} módulo{course.totalModules !== 1 ? "s" : ""} · {course.totalLessons} aula{course.totalLessons !== 1 ? "s" : ""}
            </span>
            <BtnRose small onClick={() => setModModal(true)}>
              <Plus size={14} /> Novo módulo
            </BtnRose>
          </div>

          {course.modules?.length ? course.modules.map(mod => (
            <div key={mod.id} style={{
              background: S.white, borderRadius: 14, border: `1px solid ${S.border}`,
              overflow: "hidden",
            }}>
              {/* Module header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
                cursor: "pointer",
              }}
                onClick={() => toggleModule(mod.id)}
              >
                <GripVertical size={16} color={S.border} style={{ flexShrink: 0 }} />
                {expandedModules.has(mod.id)
                  ? <ChevronDown size={16} color={S.muted} />
                  : <ChevronRight size={16} color={S.muted} />}
                <span style={{ fontWeight: 700, color: S.ink, fontSize: 14, flex: 1 }}>
                  {mod.title}
                </span>
                {mod.isIntro && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100,
                    background: "rgba(212,67,124,0.08)", color: S.rose, marginRight: 4,
                  }}>Intro</span>
                )}
                <span style={{ fontSize: 12, color: S.muted, marginRight: 8 }}>
                  {mod.lessons?.length || 0} aulas
                </span>
                <BtnIcon onClick={() => deleteModule(mod.id)} danger title="Excluir módulo">
                  <Trash2 size={13} color={S.rose} />
                </BtnIcon>
              </div>

              {/* Lessons */}
              {expandedModules.has(mod.id) && (
                <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {mod.lessons?.map(lesson => (
                    <div key={lesson.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      background: S.bg, border: `1px solid ${S.border}`,
                    }}>
                      <GripVertical size={14} color={S.border} style={{ flexShrink: 0 }} />

                      {/* Icon */}
                      {lesson.type === "Video" ? <Video size={14} color={S.rose} />
                        : lesson.type === "Text" ? <FileText size={14} color="#3b82f6" />
                          : <BookOpen size={14} color="#a855f7" />}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: S.ink }}>{lesson.title}</span>
                          {lesson.isFreePreview && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 100,
                              border: `1px solid ${S.border}`, color: S.muted,
                            }}>Grátis</span>
                          )}
                        </div>
                        {lesson.type === "Video" && (() => {
                          const vs = lesson.videoStatus;
                          if (!lesson.videoId) return <p style={{ fontSize: 11, color: S.muted, margin: "2px 0 0" }}>Sem vídeo</p>;
                          if (vs?.status === "Ready") return (
                            <p style={{ fontSize: 11, color: S.green, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                              ✓ Pronto {vs.durationSeconds ? `(${Math.floor(vs.durationSeconds / 60)}:${String(vs.durationSeconds % 60).padStart(2, "0")})` : ""}
                            </p>
                          );
                          if (vs?.status === "Processing") return <p style={{ fontSize: 11, color: S.yellow, margin: "2px 0 0" }}>⏳ Processando...</p>;
                          if (vs?.status === "Failed") return <p style={{ fontSize: 11, color: S.rose, margin: "2px 0 0" }}>❌ Falhou — envie novamente</p>;
                          return <p style={{ fontSize: 11, color: S.muted, margin: "2px 0 0" }}>⏳ Aguardando...</p>;
                        })()}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {lesson.type === "Video" && (
                          <>
                            {/* Botão Ver/Editar — aparece só quando o vídeo está pronto */}
                            {lesson.videoId && lesson.videoStatus?.status === "Ready" && (
                              <button
                                onClick={() => setEditorModal({ open: true, videoId: lesson.videoId!, lessonTitle: lesson.title })}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 5,
                                  padding: "5px 10px", borderRadius: 8,
                                  border: `1px solid ${S.rose}44`,
                                  background: `${S.rose}08`,
                                  color: S.rose, fontSize: 12, fontWeight: 700,
                                  cursor: "pointer", fontFamily: "inherit",
                                }}
                              >
                                <Play size={11} fill={S.rose} /> Ver / Editar
                              </button>
                            )}
                            <button
                              onClick={() => setVideoModal({ open: true, lesson })}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "5px 10px", borderRadius: 8, border: `1px solid ${S.border}`,
                                background: S.white, color: S.ink, fontSize: 12, fontWeight: 600,
                                cursor: "pointer", fontFamily: "inherit",
                              }}
                            >
                              <Video size={12} />
                              {lesson.videoId ? "Trocar" : "Adicionar vídeo"}
                            </button>
                          </>
                        )}
                        <BtnIcon onClick={() => deleteLesson(mod.id, lesson.id)} danger title="Excluir aula">
                          <Trash2 size={13} color={S.rose} />
                        </BtnIcon>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setLessonForm({ title: "", type: "Video", isFreePreview: false, textContent: "" });
                      setLessonModal({ open: true, moduleId: mod.id });
                    }}
                    style={{
                      width: "100%", padding: "9px", borderRadius: 10, marginTop: 4,
                      border: `1.5px dashed ${S.border}`, background: "transparent",
                      color: S.muted, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      fontFamily: "inherit",
                    }}
                  >
                    <Plus size={14} /> Nova aula
                  </button>
                </div>
              )}
            </div>
          )) : (
            <div style={{
              textAlign: "center", padding: "56px 24px",
              border: `2px dashed ${S.border}`, borderRadius: 16, background: S.bg,
            }}>
              <BookOpen size={36} color={S.rose + "55"} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: S.ink, marginBottom: 4 }}>Nenhum módulo ainda</p>
              <p style={{ fontSize: 13, color: S.muted, marginBottom: 20 }}>Organize o conteúdo em módulos e aulas.</p>
              <BtnRose onClick={() => setModModal(true)}>
                <Plus size={15} /> Criar primeiro módulo
              </BtnRose>
            </div>
          )}
        </div>
      )}

      {/* ══ INFO TAB ══ */}
      {activeTab === "info" && (
        <div style={{
          background: S.white, borderRadius: 16, border: `1px solid ${S.border}`, padding: 28,
          display: "flex", flexDirection: "column", gap: 20,
        }}>
          {/* Thumbnail */}
          <div>
            <label style={labelStyle}>Capa do curso</label>
            <div
              style={{
                width: "100%", aspectRatio: "16/9", maxWidth: 320,
                borderRadius: 12, overflow: "hidden", position: "relative",
                border: `2px dashed ${S.border}`,
                background: course?.thumbnailUrl ? "transparent" : S.bg,
                cursor: thumbnailUploading ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onClick={() => !thumbnailUploading && document.getElementById("thumb-input")?.click()}
            >
              {course?.thumbnailUrl
                ? <img src={course.thumbnailUrl} alt="capa" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center", color: S.muted }}>
                    <ImagePlus size={28} style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 13, margin: 0 }}>Clique para adicionar capa</p>
                    <p style={{ fontSize: 11, margin: "4px 0 0" }}>JPEG, PNG, WebP — máx. 5MB</p>
                  </div>
              }
              {thumbnailUploading && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={28} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              )}
              {course?.thumbnailUrl && !thumbnailUploading && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
                >
                  <span style={{ color: "white", fontSize: 13, fontWeight: 700, opacity: 0, transition: "opacity 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                  >Trocar imagem</span>
                </div>
              )}
            </div>
            <input
              id="thumb-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !courseId) return;
                setThumbnailUploading(true);
                try {
                  const updated = await coursesApi.uploadThumbnail(courseId as string, file);
                  setCourse(prev => prev ? { ...prev, thumbnailUrl: updated.thumbnailUrl } : prev);
                  toast.success("Capa atualizada!");
                } catch {
                  toast.error("Erro ao enviar capa");
                } finally {
                  setThumbnailUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Título</label>
            <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descrição curta</label>
            <input value={courseForm.shortDescription} onChange={e => setCourseForm(f => ({ ...f, shortDescription: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descrição completa</label>
            <textarea rows={5} value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelStyle}>Nível</label>
            <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))} style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}>
              <option value="">Selecionar...</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>
          </div>
          <div>
            <BtnRose onClick={saveCourse} disabled={saving}>
              {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
              Salvar alterações
            </BtnRose>
          </div>
        </div>
      )}

      {/* ══ SALE TAB ══ */}
      {activeTab === "sale" && (
        <div style={{
          background: S.white, borderRadius: 16, border: `1px solid ${S.border}`, padding: 28,
          display: "flex", flexDirection: "column", gap: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <DollarSign size={16} color={S.rose} />
            <span style={{ fontSize: 15, fontWeight: 700, color: S.ink }}>Configurações de venda</span>
          </div>

          {/* Sale toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${S.border}`,
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: S.ink, margin: 0 }}>Disponível para venda</p>
              <p style={{ fontSize: 12, color: S.muted, margin: "2px 0 0" }}>Exibir botão de compra para alunos</p>
            </div>
            <Toggle checked={saleEnabled} onChange={setSaleEnabled} label="" />
          </div>

          {saleEnabled && (
            <div>
              <label style={labelStyle}>Preço (R$)</label>
              <input
                type="number" min="0" step="0.01" placeholder="Ex: 97.00"
                value={courseForm.price}
                onChange={e => setCourseForm(f => ({ ...f, price: e.target.value }))}
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: S.muted, marginTop: 6 }}>
                O produto será criado/atualizado no Stripe automaticamente.
              </p>
            </div>
          )}

          {course.isForSale && course.price && (
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: S.greenBg, border: `1px solid ${S.green}33`,
              fontSize: 13, color: S.green, fontWeight: 600,
            }}>
              Curso à venda por {new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency || "BRL" }).format(course.price)}
            </div>
          )}

          <div>
            <BtnRose onClick={saveSaleSettings} disabled={saleLoading}>
              {saleLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
              Salvar configurações
            </BtnRose>
          </div>
        </div>
      )}

      {/* ══ CREATE MODULE MODAL ══ */}
      <Modal open={modModal} onClose={() => setModModal(false)} title="Novo módulo">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Título do módulo</label>
            <input
              placeholder="Ex: Introdução"
              value={modForm.title}
              onChange={e => setModForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && createModule()}
              style={inputStyle}
              autoFocus
            />
          </div>
          <Toggle
            checked={modForm.isIntro}
            onChange={v => setModForm(f => ({ ...f, isIntro: v }))}
            label="Módulo de introdução (acesso gratuito)"
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <BtnRose onClick={createModule} disabled={modLoading || !modForm.title}>
            {modLoading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            Criar módulo
          </BtnRose>
          <BtnOutline onClick={() => setModModal(false)}>Cancelar</BtnOutline>
        </div>
      </Modal>

      {/* ══ CREATE LESSON MODAL ══ */}
      <Modal open={lessonModal.open} onClose={() => setLessonModal({ open: false, moduleId: "" })} title="Nova aula">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Título da aula</label>
            <input
              placeholder="Ex: Preparação das unhas"
              value={lessonForm.title}
              onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
              style={inputStyle}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select
              value={lessonForm.type}
              onChange={e => setLessonForm(f => ({ ...f, type: e.target.value }))}
              style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
            >
              <option value="Video">Vídeo</option>
              <option value="Text">Texto</option>
              <option value="LiveStream">Live</option>
            </select>
          </div>
          {lessonForm.type === "Text" && (
            <div>
              <label style={labelStyle}>Conteúdo</label>
              <textarea
                rows={4}
                value={lessonForm.textContent}
                onChange={e => setLessonForm(f => ({ ...f, textContent: e.target.value }))}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          )}
          <Toggle
            checked={lessonForm.isFreePreview}
            onChange={v => setLessonForm(f => ({ ...f, isFreePreview: v }))}
            label="Prévia gratuita"
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <BtnRose onClick={createLesson} disabled={lessonLoading || !lessonForm.title}>
            {lessonLoading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            Criar aula
          </BtnRose>
          <BtnOutline onClick={() => setLessonModal({ open: false, moduleId: "" })}>Cancelar</BtnOutline>
        </div>
      </Modal>

      {/* ══ VIDEO MODAL (adicionar/trocar) ══ */}
      <Modal
        open={videoModal.open}
        onClose={() => setVideoModal({ open: false, lesson: null })}
        title={`Vídeo — ${videoModal.lesson?.title ?? ""}`}
        wide
      >
        {/* Mini tab bar */}
        <div style={{
          display: "flex", gap: 4, background: S.bg,
          borderRadius: 10, padding: 4, marginBottom: 20,
          border: `1px solid ${S.border}`,
        }}>
          {(["upload", "record"] as const).map(t => (
            <button key={t} onClick={() => setVideoTab(t)} style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 600,
              background: videoTab === t ? S.rose : "transparent",
              color: videoTab === t ? S.white : S.muted,
            }}>
              {t === "upload" ? "Upload de arquivo" : "Gravar vídeo"}
            </button>
          ))}
        </div>

        {videoTab === "upload" && <VideoUploader onVideoReady={handleVideoReady} />}
        {videoTab === "record" && <VideoRecorder onVideoReady={handleVideoReady} />}

        {/* Tutorial contextual */}
        <VideoTutorial defaultOpen={videoTab === "upload" ? "upload" : "camera"} />
      </Modal>

      {/* ══ EDITOR MODAL (visualizar + editar vídeo pronto) ══ */}
      {editorModal?.open && (
        <VideoEditorModal
          videoId={editorModal.videoId}
          lessonTitle={editorModal.lessonTitle}
          onClose={() => setEditorModal(null)}
          onTrimReady={(newId) => {
            toast.success("Vídeo cortado criado! Agora você pode vinculá-lo a uma aula.");
            setEditorModal(null);
            load(); // recarrega o curso para mostrar o novo vídeo
          }}
        />
      )}
    </div>
  );
}
