import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, Users, Award, ChevronRight } from "lucide-react";

async function getPublishedCourses() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://api:8080"}/api/courses?pageSize=6`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="size-4 text-primary" />
            </div>
            Classroom
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/courses">
              <Button variant="ghost" size="sm">Cursos</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Entrar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 lg:py-32 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30" variant="outline">
            Plataforma Profissional de Cursos
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Aprenda com os melhores
            <br />
            <span className="text-primary">cursos online</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Acesse conteúdo profissional, aprenda no seu ritmo e transforme sua carreira com nossa plataforma completa de ensino.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/courses">
              <Button size="lg" className="gap-2 text-base px-8">
                <Play className="size-5" />
                Ver cursos
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                Começar agora
                <ChevronRight className="size-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: BookOpen, label: "Cursos", value: "50+" },
            { icon: Users, label: "Alunos", value: "5.000+" },
            { icon: Play, label: "Horas de conteúdo", value: "500+" },
            { icon: Award, label: "Certificados", value: "100%" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="space-y-2">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="size-6 text-primary" />
              </div>
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Courses Grid */}
      {Array.isArray(courses) && courses.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold">Cursos em destaque</h2>
              <p className="text-muted-foreground mt-1">Escolha seu próximo aprendizado</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="gap-1">
                Ver todos <ChevronRight className="size-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 6).map((course: {
              id: string; title: string; thumbnailUrl?: string; level?: string;
              shortDescription?: string; totalLessons: number; isForSale: boolean;
              price?: number; currency: string;
            }) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <div className="group rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-primary/10">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="size-12 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      {course.level && (
                        <Badge variant="secondary" className="shrink-0 text-xs">{course.level}</Badge>
                      )}
                    </div>
                    {course.shortDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.shortDescription}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{course.totalLessons} aulas</span>
                      <span className="font-semibold text-sm">
                        {course.isForSale && course.price
                          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency }).format(course.price)
                          : "Gratuito"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-y border-border/40">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Entre na plataforma e acesse centenas de aulas, vídeos e lives exclusivas.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-base px-10">Criar minha conta</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4" />
            <span>Classroom © 2025</span>
          </div>
          <div className="flex gap-4">
            <Link href="/courses" className="hover:text-foreground transition-colors">Cursos</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
