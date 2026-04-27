"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboard } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, GraduationCap, DollarSign, TrendingUp, Plus, ChevronRight, Loader2 } from "lucide-react";

const BtnSm = ({ children, href, outline = false }: { children: React.ReactNode; href: string; outline?: boolean }) => (
  <Link href={href}>
    <button style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 9, border: outline ? "1.5px solid #EDCFDE" : "none",
      background: outline ? "#FFFFFF" : "linear-gradient(135deg, #D4437C, #8B1A42)",
      color: outline ? "#1A0A12" : "white", fontSize: 13, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
    }}>
      {children}
    </button>
  </Link>
);

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (!data) return null;

  const stats = [
    { label: "Alunos", value: data.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Cursos", value: data.totalCourses, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Matrículas", value: data.totalEnrollments, icon: GraduationCap, color: "text-green-400", bg: "bg-green-400/10" },
    {
      label: "Receita",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalRevenue),
      icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-400/10"
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da plataforma</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <BtnSm href="/admin/courses/new"><Plus size={14} /> Novo curso</BtnSm>
          <BtnSm href="/admin/users" outline><Plus size={14} /> Novo usuário</BtnSm>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Cursos recentes</CardTitle>
            <Link href="/admin/courses">
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#8B6676", display: "flex", alignItems: "center", gap: 2 }}>
                Ver todos <ChevronRight size={12} />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentCourses.map(course => (
              <Link key={course.id} href={`/admin/courses/${course.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-card/80 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.totalLessons} aulas</p>
                  </div>
                  <Badge
                    variant={course.status === "Published" ? "default" : "secondary"}
                    className={`shrink-0 ml-2 text-xs ${course.status === "Published" ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}`}
                  >
                    {course.status === "Published" ? "Publicado" : course.status === "Draft" ? "Rascunho" : "Arquivado"}
                  </Badge>
                </div>
              </Link>
            ))}
            {data.recentCourses.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum curso criado ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Usuários recentes</CardTitle>
            <Link href="/admin/users">
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#8B6676", display: "flex", alignItems: "center", gap: 2 }}>
                Ver todos <ChevronRight size={12} />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-card/80 transition-colors">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {user.role === "Admin" ? "Admin" : "Aluno"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
