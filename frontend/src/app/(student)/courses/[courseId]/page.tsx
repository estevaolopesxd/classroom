"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { coursesApi } from "@/lib/api/courses";
import { paymentsApi } from "@/lib/api/payments";
import { useAuthStore } from "@/lib/stores/authStore";
import type { CourseDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Play, Clock, Lock, CheckCircle, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    Promise.all([
      coursesApi.getById(courseId),
      isAuthenticated ? coursesApi.getMy() : Promise.resolve([])
    ]).then(([c, myCourses]) => {
      setCourse(c);
      setIsEnrolled((myCourses as {id: string}[]).some(mc => mc.id === courseId));
    }).catch(() => router.push("/courses"))
      .finally(() => setLoading(false));
  }, [courseId, isAuthenticated, router]);

  const handleBuy = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setBuying(true);
    try {
      const { checkoutUrl } = await paymentsApi.createCheckout(courseId);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao processar pagamento");
    } finally {
      setBuying(false);
    }
  };

  const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (!course) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/courses">
        <Button variant="ghost" size="sm" className="gap-1 mb-6">
          <ChevronLeft className="size-4" />
          Voltar aos cursos
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero */}
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl overflow-hidden">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="size-20 text-primary/20" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {course.level && <Badge variant="secondary">{course.level}</Badge>}
              <Badge variant="outline" className="text-muted-foreground">{totalLessons} aulas</Badge>
              <Badge variant="outline" className="text-muted-foreground">{course.modules.length} módulos</Badge>
            </div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground leading-relaxed">{course.description}</p>
            )}
          </div>

          {/* Modules */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Conteúdo do curso</h2>
            <Accordion multiple className="space-y-2">
              {course.modules.map((module) => (
                <AccordionItem key={module.id} value={module.id} className="border border-border/50 rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-card/50">
                    <div className="flex items-center gap-3 text-left">
                      {module.isIntro && (
                        <Badge variant="secondary" className="text-xs">Intro</Badge>
                      )}
                      <span className="font-medium">{module.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto mr-2">
                        {module.lessons.length} aulas
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className="divide-y divide-border/30">
                      {module.lessons.map((lesson) => {
                        const canAccess = isEnrolled || lesson.isFreePreview;
                        return (
                          <div key={lesson.id} className={`flex items-center gap-3 px-4 py-3 ${canAccess ? "hover:bg-card/50" : ""}`}>
                            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              {canAccess ? (
                                <Play className="size-3.5 text-primary ml-0.5" />
                              ) : (
                                <Lock className="size-3 text-muted-foreground" />
                              )}
                            </div>
                            <span className={`text-sm flex-1 ${!canAccess ? "text-muted-foreground" : ""}`}>
                              {lesson.title}
                            </span>
                            {lesson.isFreePreview && !isEnrolled && (
                              <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">Grátis</Badge>
                            )}
                            {lesson.durationSeconds && (
                              <span className="text-xs text-muted-foreground">
                                {Math.floor(lesson.durationSeconds / 60)}min
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Sidebar CTA */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-6 space-y-4">
            {course.isForSale && course.price && !isEnrolled ? (
              <>
                <div className="text-3xl font-bold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency }).format(course.price)}
                </div>
                <Button onClick={handleBuy} disabled={buying} size="lg" className="w-full">
                  {buying ? <><Loader2 className="size-4 animate-spin mr-2" />Processando...</> : "Comprar agora"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Acesso vitalício ao curso</p>
              </>
            ) : isEnrolled ? (
              <>
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="size-5" />
                  <span className="font-medium">Você está inscrito!</span>
                </div>
                <Link href={`/courses/${course.id}/learn`}>
                  <Button size="lg" className="w-full gap-2">
                    <Play className="size-4" />
                    Acessar curso
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-green-500">Gratuito</div>
                <Button onClick={handleBuy} size="lg" className="w-full">
                  Acessar gratuitamente
                </Button>
              </>
            )}

            <div className="space-y-2 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4" />
                <span>{totalLessons} aulas</span>
              </div>
              {course.durationMinutes && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  <span>{course.durationMinutes} minutos de conteúdo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
