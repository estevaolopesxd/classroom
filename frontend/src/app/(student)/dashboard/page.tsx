"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { coursesApi } from "@/lib/api/courses";
import { progressApi } from "@/lib/api/progress";
import type { Course, ContinueWatching } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, Clock, ChevronRight, GraduationCap } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.firstName}! 👋</h1>
        <p className="text-muted-foreground mt-1">Continue seu aprendizado de onde parou.</p>
      </div>

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Play className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Continuar assistindo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {continueWatching.map((item) => (
              <Link key={item.lessonId} href={`/courses/${item.courseId}/learn/${item.lessonId}`}>
                <Card className="hover:border-primary/50 transition-colors group cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                    {item.courseThumbnailUrl ? (
                      <img src={item.courseThumbnailUrl} alt={item.courseTitle} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="size-10 text-primary/40" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="size-10 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Play className="size-4 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                    {item.durationSeconds && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, (item.watchedSeconds / item.durationSeconds) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">{item.courseTitle}</p>
                    <p className="text-sm font-medium line-clamp-1">{item.lessonTitle}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{formatTime(item.watchedSeconds)}</span>
                      {item.durationSeconds && <span>/ {formatTime(item.durationSeconds)}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* My Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Meus cursos ({courses.length})</h2>
          </div>
          {courses.length > 0 && (
            <Link href="/my-courses">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todos <ChevronRight className="size-4" />
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <BookOpen className="size-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Você ainda não está inscrito em nenhum curso.</p>
            <Link href="/courses" className="mt-4 inline-block">
              <Button>Explorar cursos</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <Link key={course.id} href={`/courses/${course.id}/learn`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="size-10 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="text-xs text-muted-foreground">
                      {course.totalLessons} aulas · {course.totalModules} módulos
                    </div>
                    <Progress value={0} className="h-1.5" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Browse more */}
      {!loading && (
        <div className="flex justify-center pt-4">
          <Link href="/courses">
            <Button variant="outline" className="gap-2">
              <BookOpen className="size-4" />
              Explorar mais cursos
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
