import Link from "next/link";
import { BookOpen, Play, Users, Award, Star, ChevronRight, Zap, Shield, Video } from "lucide-react";

async function getPublishedCourses() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://api:8080"}/api/courses?pageSize=6&published=true`,
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
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="size-4 text-primary-foreground" />
            </div>
            <span>Classroom</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/courses" className="hover:text-foreground transition-colors">Cursos</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Recursos</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Entrar
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Começar agora
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="size-3.5" />
            Plataforma completa de ensino online
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
            Aprenda do jeito
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-400 to-accent bg-clip-text text-transparent">
              que você merece
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Vídeos, lives ao vivo, trilhas de aprendizado e acompanhamento de progresso. Tudo em um único lugar, do jeito mais bonito e simples.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/courses"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/30">
              <Play className="size-5" />
              Explorar cursos
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border bg-card text-foreground text-base font-medium hover:bg-card/80 hover:border-primary/40 transition-all">
              Criar conta grátis
              <ChevronRight className="size-5" />
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-1.5 mt-10 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {["bg-pink-400", "bg-violet-400", "bg-sky-400", "bg-amber-400"].map((c, i) => (
                <div key={i} className={`size-7 rounded-full ${c} border-2 border-background`} />
              ))}
            </div>
            <span className="ml-2">Junte-se a milhares de alunos</span>
            <div className="flex text-yellow-400 ml-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "50+", label: "Cursos", icon: BookOpen },
            { value: "5k+", label: "Alunos", icon: Users },
            { value: "500h", label: "Conteúdo", icon: Video },
            { value: "100%", label: "Online", icon: Award },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-5 text-center">
              <Icon className="size-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Tudo que você precisa para ensinar e aprender</h2>
            <p className="text-muted-foreground">Uma plataforma completa, sem complicação.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Video,
                color: "from-violet-500/20 to-violet-500/5",
                iconColor: "text-violet-400",
                title: "Vídeos em HD",
                desc: "Upload de vídeos com transcodificação automática para streaming adaptativo. Qualidade garantida em qualquer dispositivo.",
              },
              {
                icon: Zap,
                color: "from-amber-500/20 to-amber-500/5",
                iconColor: "text-amber-400",
                title: "Lives ao vivo",
                desc: "Transmita direto do navegador, sem software extra. Câmera ou tela compartilhada, com chat em tempo real.",
              },
              {
                icon: Award,
                color: "from-emerald-500/20 to-emerald-500/5",
                iconColor: "text-emerald-400",
                title: "Progresso rastreado",
                desc: "Cada aluno tem seu progresso salvo automaticamente. Continue de onde parou, em qualquer dispositivo.",
              },
              {
                icon: Shield,
                color: "from-sky-500/20 to-sky-500/5",
                iconColor: "text-sky-400",
                title: "Pagamentos seguros",
                desc: "Integração com Stripe. Seus alunos pagam com cartão e têm acesso liberado automaticamente.",
              },
              {
                icon: Users,
                color: "from-pink-500/20 to-pink-500/5",
                iconColor: "text-pink-400",
                title: "Gestão de alunos",
                desc: "Veja o progresso de cada aluno, matricule manualmente ou deixe que eles comprem e acessem sozinhos.",
              },
              {
                icon: BookOpen,
                color: "from-primary/20 to-primary/5",
                iconColor: "text-primary",
                title: "Trilhas de aprendizado",
                desc: "Organize seu conteúdo em módulos e aulas. Defina pré-visualizações gratuitas para atrair novos alunos.",
              },
            ].map(({ icon: Icon, color, iconColor, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border/50 bg-card/60 p-6 hover:border-primary/30 transition-colors">
                <div className={`size-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                  <Icon className={`size-6 ${iconColor}`} />
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ───────────────────────────────────────────────────────── */}
      {Array.isArray(courses) && courses.length > 0 && (
        <section className="px-6 py-20 bg-card/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold">Cursos em destaque</h2>
                <p className="text-muted-foreground mt-1">Comece hoje mesmo</p>
              </div>
              <Link href="/courses" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                Ver todos <ChevronRight className="size-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.slice(0, 6).map((course: {
                id: string; title: string; thumbnailUrl?: string; level?: string;
                shortDescription?: string; totalLessons: number; totalModules: number;
                isForSale: boolean; price?: number; currency: string;
              }) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="group">
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col">
                    {/* Thumbnail */}
                    <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/10">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="size-14 text-primary/20" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="size-14 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center">
                          <Play className="size-6 text-white ml-0.5" />
                        </div>
                      </div>
                      {course.level && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-white text-xs font-medium">
                          {course.level}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-semibold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      {course.shortDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                          {course.shortDescription}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
                        <span className="text-xs text-muted-foreground">
                          {course.totalModules} módulos · {course.totalLessons} aulas
                        </span>
                        <span className={`text-sm font-bold ${course.isForSale && course.price ? "text-primary" : "text-emerald-400"}`}>
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
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Crie sua conta agora e acesse todos os cursos disponíveis.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all hover:scale-105 shadow-xl shadow-primary/30">
            Criar minha conta
            <ChevronRight className="size-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <div className="size-6 rounded-md bg-primary flex items-center justify-center">
              <BookOpen className="size-3.5 text-primary-foreground" />
            </div>
            Classroom
          </div>
          <p>© {new Date().getFullYear()} Classroom. Todos os direitos reservados.</p>
          <div className="flex gap-5">
            <Link href="/courses" className="hover:text-foreground transition-colors">Cursos</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
