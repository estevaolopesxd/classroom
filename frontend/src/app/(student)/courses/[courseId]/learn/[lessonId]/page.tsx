"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { coursesApi } from "@/lib/api/courses";
import { videosApi } from "@/lib/api/videos";
import { progressApi } from "@/lib/api/progress";
import type { CourseDetail, LessonProgress } from "@/types";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Circle, ChevronLeft, ChevronRight, BookOpen, Play, FileText, Loader2, Lock } from "lucide-react";
import Link from "next/link";

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const currentModule = course?.modules.find(m => m.lessons.some(l => l.id === lessonId));
  const currentLesson = currentModule?.lessons.find(l => l.id === lessonId);
  const allLessons = course?.modules.flatMap(m => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const completedCount = [...progress.values()].filter(p => p.isCompleted).length;
  const progressPercent = allLessons.length > 0 ? Math.round(completedCount / allLessons.length * 100) : 0;

  useEffect(() => {
    Promise.all([
      coursesApi.getById(courseId),
      progressApi.getCourseProgress(courseId).catch(() => null)
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
    setProgress(prev => {
      const next = new Map(prev);
      next.set(lessonId, { lessonId, title: currentLesson?.title ?? "", isCompleted: true, watchedSeconds: 0 });
      return next;
    });
    if (nextLesson) router.push(`/courses/${courseId}/learn/${nextLesson.id}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (!course || !currentLesson) return null;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="hidden lg:flex w-80 border-r border-border/40 flex-col bg-card/30">
        <div className="p-4 border-b border-border/40 space-y-2">
          <Link href={`/courses/${courseId}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="size-3.5" />
            {course.title}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Progress value={progressPercent} className="h-1.5 flex-1" />
            <span>{progressPercent}%</span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {course.modules.map(module => (
            <div key={module.id}>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-card/50">
                {module.title}
              </div>
              {module.lessons.map(lesson => {
                const isActive = lesson.id === lessonId;
                const lessonProg = progress.get(lesson.id);
                return (
                  <Link key={lesson.id} href={`/courses/${courseId}/learn/${lesson.id}`}>
                    <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-card/80 ${isActive ? "bg-primary/10 border-r-2 border-primary" : ""}`}>
                      <div className="shrink-0">
                        {lessonProg?.isCompleted ? (
                          <CheckCircle className="size-4 text-green-500" />
                        ) : isActive ? (
                          <Play className="size-4 text-primary" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <span className={`text-sm line-clamp-2 ${isActive ? "text-primary font-medium" : ""}`}>
                        {lesson.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
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
              <div className="aspect-video bg-card rounded-xl flex items-center justify-center border border-border/50">
                <div className="text-center space-y-2">
                  <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Carregando vídeo...</p>
                </div>
              </div>
            )}

            {currentLesson.type === "Text" && (
              <div className="rounded-xl border border-border/50 p-6 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="size-5 text-primary" />
                  <span className="font-medium">Conteúdo da aula</span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {currentLesson.textContent}
                  </p>
                </div>
              </div>
            )}

            {/* Lesson info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentModule?.title}</Badge>
                {progress.get(lessonId)?.isCompleted && (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Concluída</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
              {currentLesson.description && (
                <p className="text-muted-foreground">{currentLesson.description}</p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
              {prevLesson ? (
                <Link href={`/courses/${courseId}/learn/${prevLesson.id}`}>
                  <Button variant="outline" className="gap-2">
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                </Link>
              ) : <div />}

              {!progress.get(lessonId)?.isCompleted && currentLesson.type === "Text" && (
                <Button onClick={handleLessonComplete} className="gap-2">
                  <CheckCircle className="size-4" />
                  Marcar como concluída
                </Button>
              )}

              {nextLesson && (
                <Link href={`/courses/${courseId}/learn/${nextLesson.id}`}>
                  <Button className="gap-2">
                    Próxima
                    <ChevronRight className="size-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
