"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/lib/api/courses";
import type { Course } from "@/types";
import { Plus, Search, BookOpen, Edit, BarChart2, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

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
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getAll({ pageSize: 100 })
      .then(({ data }) => setCourses(data))
      .catch(() => toast.error("Erro ao carregar cursos"))
      .finally(() => setLoading(false));
  }, []);

  const handlePublish = async (course: Course) => {
    try {
      if (course.status === "Published") {
        await coursesApi.archive(course.id);
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: "Archived" } : c));
        toast.success("Curso arquivado");
      } else {
        await coursesApi.publish(course.id);
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: "Published" } : c));
        toast.success("Curso publicado!");
      }
    } catch {
      toast.error("Erro ao atualizar status do curso");
    }
  };

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.ink, margin: 0, letterSpacing: "-0.03em" }}>
            Cursos
          </h1>
          <p style={{ fontSize: 14, color: S.muted, margin: "4px 0 0" }}>
            {courses.length} curso{courses.length !== 1 ? "s" : ""} criado{courses.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Link href="/admin/courses/new" style={{ textDecoration: "none" }}>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
            color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(212,67,124,0.35)", fontFamily: "inherit",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(212,67,124,0.45)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(212,67,124,0.35)";
            }}
          >
            <Plus size={16} />
            Novo curso
          </button>
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 380 }}>
        <Search size={16} color={S.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          placeholder="Pesquisar cursos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 14px 10px 38px", borderRadius: 10,
            border: `1.5px solid ${S.border}`, background: S.white,
            fontSize: 14, color: S.ink, outline: "none", fontFamily: "inherit",
          }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
          <Loader2 size={28} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", border: `2px dashed ${S.border}`, borderRadius: 16, background: S.bg }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(212,67,124,0.1)", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={24} color={S.rose} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: S.ink, marginBottom: 6 }}>Nenhum curso ainda</p>
          <p style={{ fontSize: 14, color: S.muted, marginBottom: 24 }}>
            {search ? "Nenhum curso corresponde à pesquisa." : "Crie seu primeiro curso agora."}
          </p>
          {!search && (
            <Link href="/admin/courses/new" style={{ textDecoration: "none" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(212,67,124,0.35)", fontFamily: "inherit",
              }}>
                <Plus size={16} />
                Criar primeiro curso
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(course => (
            <div key={course.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", background: S.white,
              borderRadius: 12, border: `1px solid ${S.border}`,
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = S.rose + "55";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(212,67,124,0.08)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = S.border;
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Thumb */}
              <div style={{
                width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${S.rose}22, ${S.roseDark}22)`,
                border: `1px solid ${S.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {course.thumbnailUrl
                  ? <img src={course.thumbnailUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <BookOpen size={22} color={S.rose + "88"} />
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: S.ink, letterSpacing: "-0.02em" }}>
                    {course.title}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                    background: course.status === "Published" ? S.greenBg : course.status === "Draft" ? S.yellowBg : "rgba(0,0,0,0.06)",
                    color: course.status === "Published" ? S.green : course.status === "Draft" ? S.yellow : S.muted,
                  }}>
                    {course.status === "Published" ? "Publicado" : course.status === "Draft" ? "Rascunho" : "Arquivado"}
                  </span>
                  {course.isForSale && course.price && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                      background: "rgba(212,67,124,0.08)", color: S.rose,
                    }}>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency || "BRL" }).format(course.price)}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: S.muted }}>
                  {course.totalModules} módulo{course.totalModules !== 1 ? "s" : ""} · {course.totalLessons} aula{course.totalLessons !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handlePublish(course)}
                  title={course.status === "Published" ? "Arquivar" : "Publicar"}
                  style={{
                    width: 34, height: 34, borderRadius: 8, border: `1px solid ${S.border}`,
                    background: S.white, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = S.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = S.white)}
                >
                  {course.status === "Published"
                    ? <EyeOff size={15} color={S.muted} />
                    : <Eye size={15} color={S.muted} />
                  }
                </button>

                <Link href={`/admin/courses/${course.id}/analytics`}>
                  <button title="Analytics" style={{
                    width: 34, height: 34, borderRadius: 8, border: `1px solid ${S.border}`,
                    background: S.white, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = S.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = S.white)}
                  >
                    <BarChart2 size={15} color={S.muted} />
                  </button>
                </Link>

                <Link href={`/admin/courses/${course.id}`}>
                  <button title="Editar curso" style={{
                    width: 34, height: 34, borderRadius: 8, border: `1px solid ${S.rose}44`,
                    background: "rgba(212,67,124,0.06)", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,67,124,0.14)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(212,67,124,0.06)")}
                  >
                    <Edit size={15} color={S.rose} />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
