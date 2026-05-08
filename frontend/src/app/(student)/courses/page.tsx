"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/lib/api/courses";
import type { Course } from "@/types";
import { BookOpen, Search, Loader2 } from "lucide-react";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getAll({ published: true, pageSize: 50 })
      .then(({ data }) => setCourses(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.shortDescription?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: S.ink, margin: 0, letterSpacing: "-0.03em" }}>
            Catálogo de Cursos
          </h1>
          <p style={{ fontSize: 14, color: S.muted, margin: "4px 0 0" }}>
            {courses.length} curso{courses.length !== 1 ? "s" : ""} disponíve{courses.length !== 1 ? "is" : "l"}
          </p>
        </div>
        <div style={{ position: "relative", width: 280 }}>
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
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={32} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <BookOpen size={56} color={S.border} style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: S.ink, marginBottom: 4 }}>Nenhum curso encontrado</p>
          <p style={{ fontSize: 14, color: S.muted }}>Tente outro termo de pesquisa.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {filtered.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: S.white, borderRadius: 16,
                border: `1.5px solid ${S.border}`,
                overflow: "hidden", cursor: "pointer",
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(212,67,124,0.12)";
                  (e.currentTarget as HTMLElement).style.borderColor = S.rose + "55";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = S.border;
                }}
              >
                {/* Cover */}
                <div style={{
                  aspectRatio: "16/9", overflow: "hidden",
                  background: `linear-gradient(135deg, ${S.rose}22, ${S.roseDark}22)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {course.thumbnailUrl
                    ? <img src={course.thumbnailUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <BookOpen size={48} color={S.rose + "55"} />
                  }
                </div>

                {/* Info */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: S.ink, margin: 0, lineHeight: 1.3 }}>
                      {course.title}
                    </h3>
                    {course.level && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 100, flexShrink: 0,
                        background: `${S.rose}14`, color: S.rose,
                      }}>
                        {course.level}
                      </span>
                    )}
                  </div>
                  {course.shortDescription && (
                    <p style={{ fontSize: 13, color: S.muted, margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {course.shortDescription}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: S.muted }}>{course.totalLessons} aula{course.totalLessons !== 1 ? "s" : ""}</span>
                    <span style={{ fontWeight: 700, color: course.isForSale && course.price ? S.ink : S.rose }}>
                      {course.isForSale && course.price
                        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency || "BRL" }).format(course.price)
                        : "Gratuito"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
