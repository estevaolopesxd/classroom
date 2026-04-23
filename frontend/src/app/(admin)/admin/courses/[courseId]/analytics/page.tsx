"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import { coursesApi } from "@/lib/api/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BookOpen, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

interface Analytics {
  totalEnrollments: number;
  completionRate: number;
  averageProgress: number;
  students: Array<{
    userId: string;
    fullName: string;
    email: string;
    enrolledAt: string;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
  }>;
}

export default function CourseAnalyticsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getCourseAnalytics(courseId),
      coursesApi.getById(courseId).then(c => setCourseTitle(c.title)).catch(() => {}),
    ])
      .then(([data]) => setAnalytics(data as Analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (!analytics) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/courses/${courseId}`}>
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm truncate">{courseTitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Matrículas", value: analytics.totalEnrollments, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Taxa de conclusão", value: `${Math.round(analytics.completionRate)}%`, icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10" },
          { label: "Progresso médio", value: `${Math.round(analytics.averageProgress)}%`, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-400/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className={`size-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Progress Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Progresso por aluno</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum aluno matriculado ainda.</p>
          ) : (
            <div className="space-y-4">
              {analytics.students.map((s) => (
                <div key={s.userId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {s.completedLessons}/{s.totalLessons} aulas
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={s.progressPercent} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(s.progressPercent)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
