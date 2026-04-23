"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/lib/api/courses";
import type { Course } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, Loader2 } from "lucide-react";

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getMy().then(setCourses).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus cursos</h1>
        <p className="text-muted-foreground">{courses.length} curso{courses.length !== 1 ? "s" : ""} adquirido{courses.length !== 1 ? "s" : ""}</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="size-14 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum curso ainda</h2>
          <p className="text-muted-foreground mb-6">Explore nosso catálogo e comece sua jornada de aprendizado.</p>
          <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="border-border/50 hover:border-primary/30 transition-all hover:-translate-y-0.5 cursor-pointer overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="size-12 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                    <div className="size-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="size-6 text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate mb-1">{course.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {course.totalModules} módulos · {course.totalLessons} aulas
                  </p>
                  {course.level && (
                    <Badge variant="secondary" className="mt-2 text-xs">{course.level}</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
