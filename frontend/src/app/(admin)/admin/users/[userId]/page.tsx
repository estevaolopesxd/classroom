"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import type { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, BookOpen, CheckCircle } from "lucide-react";
import Link from "next/link";

interface UserProgress {
  enrollments: Array<{
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
  }>;
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getUser(userId),
      adminApi.getUserProgress(userId),
    ])
      .then(([u, p]) => { setUser(u); setProgress(p as UserProgress); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users">
          <button style={{
            width: 34, height: 34, borderRadius: 10, border: "1px solid #EDCFDE",
            background: "#FFFFFF", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <ArrowLeft size={16} color="#1A0A12" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.fullName}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <Badge variant={user.role === "Admin" ? "default" : "secondary"} className="ml-auto">
          {user.role === "Admin" ? "Admin" : "Aluno"}
        </Badge>
      </div>

      {/* User info card */}
      <Card className="border-border/50">
        <CardContent className="p-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nome</p>
            <p className="font-medium">{user.firstName} {user.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">E-mail</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Badge variant={user.isActive ? "default" : "secondary"}>
              {user.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cursos matriculados</p>
            <p className="font-medium">{progress?.enrollments?.length || 0}</p>
          </div>
        </CardContent>
      </Card>

      {/* Progress per course */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Progresso por curso</CardTitle>
        </CardHeader>
        <CardContent>
          {!progress?.enrollments?.length ? (
            <div className="text-center py-8">
              <BookOpen className="size-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum curso matriculado.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {progress.enrollments.map((e) => (
                <div key={e.courseId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/admin/courses/${e.courseId}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {e.courseTitle}
                    </Link>
                    <div className="flex items-center gap-2">
                      {e.progressPercent >= 100 && <CheckCircle className="size-4 text-green-500" />}
                      <span className="text-xs text-muted-foreground">{e.completedLessons}/{e.totalLessons} aulas</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={e.progressPercent} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(e.progressPercent)}%</span>
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
