"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { coursesApi } from "@/lib/api/courses";
import { videosApi } from "@/lib/api/videos";
import { progressApi } from "@/lib/api/progress";
import type { CourseDetail, LessonProgress } from "@/types";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import {
  CheckCircle, Circle, ChevronLeft, ChevronRight,
  Play, FileText, Loader2,
} from "lucide-react";
import Link from "next/link";
import { LessonComments } from "@/components/lesson/LessonComments";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  green: "#16a34a",
};

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const currentModule = course?.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
  const currentLesson = currentModule?.lessons.find((l) => l.id === lessonId);
  const allLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const completedCount = [...progress.values()].filter((p) => p.isCompleted).length;
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  useEffect(() => {
    Promise.all([
      coursesApi.getById(courseId),
      progressApi.getCourseProgress(courseId).catch(() => null),
    ]).then(([c, prog]) => {
      setCourse(c);
      if (prog) {
        const map = new Map<string, LessonProgress>();
        prog.modules?.forEach((m: any) => {
          m.lessons?.forEach((l: any) => map.set(l.lessonId, l));
        });
        setProgress(map);
      }
    }).finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (!currentLesson?.videoId) { setVideoUrl(null); return; }
    videosApi.getPlayUrl(currentLesson.videoId)
      .then(({ url }) => setVideoUrl(url))
      .catch(() => setVideoUrl(null));
  }, [currentLesson?.videoId]);

  const handleLessonComplete = () => {
    setProgress((prev) => {
      const next = new Map(prev);
      next.set(lessonId, { lessonId, title: currentLesson?.title ?? "", isCompleted: true, watchedSeconds: 0 });
      return next;
    });
    if (nextLesson) router.push(`/courses/${courseId}/learn/${nextLesson.id}`);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Loader2 size={32} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!course || !currentLesson) return null;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Sidebar ── */}
      <div style={{
        width: 300, flexShrink: 0,
        borderRight: `1px solid ${S.border}`,
        display: "flex", flexDirection: "column",
        background: S.white,
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${S.border}` }}>
          <Link
            href={`/courses/${courseId}`}
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: S.muted, marginBottom: 8 }}
          >
            <ChevronLeft size={13} /> {course.title}
          </Link>
          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: S.border, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: `linear-gradient(90deg, ${S.rose}, ${S.roseDark})`,
                width: `${progressPercent}%`, transition: "width 0.3s",
              }} />
            </div>
            <span style={{ fontSize: 11, color: S.muted, flexShrink: 0 }}>{progressPercent}%</span>
          </div>
        </div>

        {/* Lesson list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {course.modules.map((module) => (
            <div key={module.id}>
              <div style={{
                padding: "8px 16px",
                fontSize: 10, fontWeight: 700, color: S.muted,
                textTransform: "uppercase", letterSpacing: "0.08em",
                background: S.bg,
              }}>
                {module.title}
              </div>
              {module.lessons.map((lesson) => {
                const isActive = lesson.id === lessonId;
                const lessonProg = progress.get(lesson.id);
                return (
                  <Link key={lesson.id} href={`/courses/${courseId}/learn/${lesson.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 16px", cursor: "pointer",
                      background: isActive ? `${S.rose}10` : "transparent",
                      borderRight: isActive ? `3px solid ${S.rose}` : "3px solid transparent",
                      transition: "background 0.15s",
                    }}>
                      <div style={{ flexShrink: 0 }}>
                        {lessonProg?.isCompleted
                          ? <CheckCircle size={15} color={S.green} />
                          : isActive
                            ? <Play size={15} color={S.rose} />
                            : <Circle size={15} color={`${S.muted}66`} />
                        }
                      </div>
                      <span style={{
                        fontSize: 13, lineHeight: 1.4,
                        color: isActive ? S.rose : S.ink,
                        fontWeight: isActive ? 600 : 400,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {lesson.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px" }}>

            {/* Video */}
            {currentLesson.type === "Video" && videoUrl && (
              <VideoPlayer
                hlsUrl={videoUrl}
                lessonId={lessonId}
                initialSeconds={progress.get(lessonId)?.watchedSeconds}
                onComplete={handleLessonComplete}
              />
            )}

            {currentLesson.type === "Video" && !videoUrl && (
              <div style={{
                aspectRatio: "16/9", background: "#111", borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${S.border}`,
              }}>
                <div style={{ textAlign: "center" }}>
                  <Loader2 size={32} color={S.rose} style={{ animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
                  <p style={{ fontSize: 13, color: S.muted }}>Carregando vídeo...</p>
                </div>
              </div>
            )}

            {currentLesson.type === "Text" && (
              <div style={{
                borderRadius: 16, border: `1px solid ${S.border}`,
                padding: 28, background: S.white,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <FileText size={18} color={S.rose} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: S.ink }}>Conteúdo da aula</span>
                </div>
                <p style={{ fontSize: 15, color: S.muted, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>
                  {currentLesson.textContent}
                </p>
              </div>
            )}

            {/* Lesson info */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}>
                  {currentModule?.title}
                </span>
                {progress.get(lessonId)?.isCompleted && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: `${S.green}15`, color: S.green, border: `1px solid ${S.green}33` }}>
                    ✓ Concluída
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: S.ink, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                {currentLesson.title}
              </h1>
              {currentLesson.description && (
                <p style={{ fontSize: 14, color: S.muted, margin: 0 }}>{currentLesson.description}</p>
              )}
            </div>

            {/* Navigation */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, marginTop: 28, paddingTop: 24, borderTop: `1px solid ${S.border}`,
            }}>
              {prevLesson ? (
                <Link href={`/courses/${courseId}/learn/${prevLesson.id}`} style={{ textDecoration: "none" }}>
                  <button style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 10,
                    border: `1.5px solid ${S.border}`, background: S.white,
                    color: S.ink, fontSize: 14, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <ChevronLeft size={16} /> Anterior
                  </button>
                </Link>
              ) : <div />}

              {!progress.get(lessonId)?.isCompleted && currentLesson.type === "Text" && (
                <button
                  onClick={handleLessonComplete}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 20px", borderRadius: 10, border: "none",
                    background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                    color: S.white, fontSize: 14, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: `0 4px 14px ${S.rose}30`,
                  }}
                >
                  <CheckCircle size={16} /> Marcar como concluída
                </button>
              )}

              {nextLesson ? (
                <Link href={`/courses/${courseId}/learn/${nextLesson.id}`} style={{ textDecoration: "none" }}>
                  <button style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 10, border: "none",
                    background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                    color: S.white, fontSize: 14, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: `0 4px 14px ${S.rose}30`,
                  }}
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </Link>
              ) : <div />}
            </div>

            {/* Comments */}
            <LessonComments lessonId={lessonId} />
          </div>
        </div>
      </div>
    </div>
  );
}
