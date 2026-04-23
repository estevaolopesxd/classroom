"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/lib/api/courses";
import type { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, BookOpen, Edit, BarChart, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getAll({ pageSize: 100 }).then(({ data }) => setCourses(data)).finally(() => setLoading(false));
  }, []);

  const handlePublish = async (course: Course) => {
    try {
      if (course.status === "Published") {
        await coursesApi.archive(course.id);
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: "Archived" } : c));
        toast.success("Curso arquivado");
      } else {
        await coursesApi.publish(course.id);
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: "Published" } : c));
        toast.success("Curso publicado!");
      }
    } catch {
      toast.error("Erro ao atualizar status do curso");
    }
  };

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cursos</h1>
          <p className="text-muted-foreground">{courses.length} cursos criados</p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            Novo curso
          </Button>
        </Link>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Pesquisar cursos..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(course => (
            <Card key={course.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="size-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 shrink-0 flex items-center justify-center overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <BookOpen className="size-6 text-primary/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{course.title}</h3>
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${
                        course.status === "Published" ? "bg-green-500/20 text-green-500 border-green-500/30" :
                        course.status === "Draft" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" :
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {course.status === "Published" ? "Publicado" : course.status === "Draft" ? "Rascunho" : "Arquivado"}
                    </Badge>
                    {course.isForSale && course.price && (
                      <Badge variant="outline" className="text-xs text-primary border-primary/30 shrink-0">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency }).format(course.price)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {course.totalModules} módulos · {course.totalLessons} aulas
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handlePublish(course)}
                    title={course.status === "Published" ? "Arquivar" : "Publicar"}
                  >
                    {course.status === "Published" ? (
                      <EyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <Eye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Link href={`/admin/courses/${course.id}/analytics`}>
                    <Button variant="ghost" size="icon" className="size-8" title="Analytics">
                      <BarChart className="size-4 text-muted-foreground" />
                    </Button>
                  </Link>
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button variant="ghost" size="icon" className="size-8" title="Editar">
                      <Edit className="size-4 text-muted-foreground" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum curso encontrado.</p>
              <Link href="/admin/courses/new" className="mt-4 inline-block">
                <Button>Criar primeiro curso</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
