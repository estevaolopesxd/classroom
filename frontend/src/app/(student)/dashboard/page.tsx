"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { coursesApi } from "@/lib/api/courses";
import { progressApi } from "@/lib/api/progress";
import type { Course, ContinueWatching } from "@/types";
import { BookOpen, Play, Clock, ChevronRight, GraduationCap, Loader2 } from "lucide-react";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatching[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coursesApi.getMy(),
      progressApi.getContinueWatching()
    ]).then(([c, cw]) => {
      setCourses(c);
      setContinueWatching(cw);
    }).finally(() => setLoading(false));
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: S.ink, margin: 0, letterSpacing: "-0.03em" }}>
          Olá, {user?.firstName}! 👋
        </h1>
        <p style={{ fontSize: 14, color: S.muted, margin: "4px 0 0" }}>
          Continue seu aprendizado de onde parou.
        </p>
      </div>

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Play size={18} color={S.rose} />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: S.ink, margin: 0 }}>Continuar assistindo</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {continueWatching.map((item) => (
              <Link key={item.lessonId} href={`/courses/${item.courseId}/learn/${item.lessonId}`} style={{ textDecoration: "none" }}>
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
                  {/* Thumbnail with play overlay and progress bar */}
                  <div style={{
                    aspectRatio: "16/9", position: "relative", overflow: "hidden",
                    background: `linear-gradient(135deg, ${S.rose}22, ${S.roseDark}22)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.courseThumbnailUrl
                      ? <img src={item.courseThumbnailUrl} alt={item.courseTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <BookOpen size={40} color={S.rose + "55"} />
                    }
                    {/* Play overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.2s",
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.35)";
                        const btn = e.currentTarget.querySelector(".play-btn") as HTMLElement | null;
                        if (btn) btn.style.opacity = "1";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0)";
                        const btn = e.currentTarget.querySelector(".play-btn") as HTMLElement | null;
                        if (btn) btn.style.opacity = "0";
                      }}
                    >
                      <div className="play-btn" style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: S.rose, opacity: 0, transition: "opacity 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Play size={16} color="white" style={{ marginLeft: 2 }} />
                      </div>
                    </div>
                    {/* Progress bar */}
                    {item.durationSeconds && (
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(0,0,0,0.3)" }}>
                        <div style={{
                          height: "100%", background: S.rose,
                          width: `${Math.min(100, (item.watchedSeconds / item.durationSeconds) * 100)}%`,
                          transition: "width 0.3s",
                        }} />
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "12px 14px" }}>
                    <p style={{ fontSize: 11, color: S.muted, margin: "0 0 3px" }}>{item.courseTitle}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: S.ink, margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.lessonTitle}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: S.muted }}>
                      <Clock size={12} />
                      <span>{formatTime(item.watchedSeconds)}</span>
                      {item.durationSeconds && <span>/ {formatTime(item.durationSeconds)}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* My Courses */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={18} color={S.rose} />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: S.ink, margin: 0 }}>
              Meus cursos ({courses.length})
            </h2>
          </div>
          {courses.length > 0 && (
            <Link href="/my-courses" style={{ textDecoration: "none" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "6px 12px", borderRadius: 8, border: `1px solid ${S.border}`,
                background: "transparent", color: S.muted, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Ver todos <ChevronRight size={14} />
              </button>
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={28} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : courses.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "56px 24px",
            border: `2px dashed ${S.border}`, borderRadius: 16, background: S.bg,
          }}>
            <BookOpen size={48} color={S.border} style={{ margin: "0 auto 14px" }} />
            <p style={{ fontSize: 15, color: S.muted, margin: "0 0 20px" }}>
              Você ainda não está inscrito em nenhum curso.
            </p>
            <Link href="/courses" style={{ textDecoration: "none" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                color: "white", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 3px 10px rgba(212,67,124,0.3)",
              }}>
                <BookOpen size={15} />
                Explorar cursos
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {courses.slice(0, 6).map((course) => (
              <Link key={course.id} href={`/courses/${course.id}/learn`} style={{ textDecoration: "none" }}>
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
                      : <BookOpen size={40} color={S.rose + "55"} />
                    }
                  </div>

                  <div style={{ padding: "14px 16px" }}>
                    <h3 style={{
                      fontSize: 14, fontWeight: 700, color: S.ink,
                      margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {course.title}
                    </h3>
                    <p style={{ fontSize: 12, color: S.muted, margin: "0 0 10px" }}>
                      {course.totalLessons} aulas · {course.totalModules} módulos
                    </p>
                    {/* Progress bar (static at 0 — real progress loaded separately) */}
                    <div style={{ height: 4, borderRadius: 2, background: S.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "0%", background: S.rose, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Browse more */}
      {!loading && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <Link href="/courses" style={{ textDecoration: "none" }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: 10,
              border: `1.5px solid ${S.border}`, background: S.white,
              color: S.ink, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              <BookOpen size={15} color={S.rose} />
              Explorar mais cursos
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
