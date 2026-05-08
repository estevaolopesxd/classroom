"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/lib/api/courses";
import api from "@/lib/api/client";
import type { Course } from "@/types";
import { PRICING_TYPE_SHORT } from "@/types";
import { BookOpen, Search, Loader2, Star, Tag } from "lucide-react";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
};

interface Category { id: string; name: string; slug: string; color: string; icon?: string; order: number }

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coursesApi.getAll({ published: true, pageSize: 100 }),
      api.get<Category[]>("/api/categories"),
    ]).then(([coursesRes, catRes]) => {
      setCourses(coursesRes.data);
      setCategories(catRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.shortDescription?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategoryId || c.categoryId === activeCategoryId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
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

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          <button
            onClick={() => setActiveCategoryId(null)}
            style={{
              padding: "6px 14px", borderRadius: 100, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${!activeCategoryId ? S.rose : S.border}`,
              background: !activeCategoryId ? `${S.rose}12` : S.white,
              color: !activeCategoryId ? S.rose : S.muted,
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >
            <Tag size={12} /> Todas
          </button>
          {categories.map(cat => {
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(isActive ? null : cat.id)}
                style={{
                  padding: "6px 14px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${isActive ? cat.color : S.border}`,
                  background: isActive ? `${cat.color}15` : S.white,
                  color: isActive ? cat.color : S.muted,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                {cat.icon && <span style={{ fontSize: 14 }}>{cat.icon}</span>}
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={32} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <BookOpen size={56} color={S.border} style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: S.ink, marginBottom: 4 }}>Nenhum curso encontrado</p>
          <p style={{ fontSize: 14, color: S.muted }}>Tente outro termo ou categoria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {filtered.map((course) => {
            const catColor = course.categoryColor;
            const catName = course.categoryName;
            return (
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
                    aspectRatio: "16/9", overflow: "hidden", position: "relative",
                    background: `linear-gradient(135deg, ${S.rose}22, ${S.roseDark}22)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {course.thumbnailUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={course.thumbnailUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <BookOpen size={48} color={S.rose + "55"} />
                    }
                    {/* Category badge overlay */}
                    {catName && (
                      <div style={{
                        position: "absolute", top: 10, left: 10,
                        padding: "3px 10px", borderRadius: 100,
                        background: catColor ? `${catColor}ee` : `${S.rose}ee`,
                        color: "white", fontSize: 11, fontWeight: 700,
                        backdropFilter: "blur(4px)",
                      }}>
                        {catName}
                      </div>
                    )}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: S.muted }}>{course.totalLessons} aula{course.totalLessons !== 1 ? "s" : ""}</span>
                        {course.averageRating && course.averageRating > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Star size={11} fill="#F59E0B" color="#F59E0B" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: S.ink }}>{course.averageRating.toFixed(1)}</span>
                            <span style={{ fontSize: 10, color: S.muted }}>({course.totalRatings})</span>
                          </div>
                        ) : null}
                      </div>
                      <span style={{ fontWeight: 700, color: course.isForSale && course.price ? S.ink : S.rose }}>
                        {course.isForSale && course.price
                          ? `${new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency || "BRL" }).format(course.price)}${PRICING_TYPE_SHORT[course.pricingType ?? "OneTime"]}`
                          : "Gratuito"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
