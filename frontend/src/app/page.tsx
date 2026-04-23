import Link from "next/link";
import {
  BookOpen, Play, Users, Award, Star, ChevronRight,
  Zap, Shield, Video, Clock, TrendingUp, CheckCircle,
  ArrowRight, Sparkles, Globe, Lock
} from "lucide-react";

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
    <div className="min-h-screen" style={{ background: "#0a0a0f", color: "#f0f0f5", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Navbar ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,10,15,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(124,58,237,0.4)"
            }}>
              <BookOpen size={18} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Classroom</span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Link href="/courses" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "white")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>
              Cursos
            </Link>
            <Link href="#features" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>
              Recursos
            </Link>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>
              Entrar
            </Link>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 20px", borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600,
              boxShadow: "0 0 20px rgba(124,58,237,0.35)",
              transition: "opacity 0.2s",
            }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: "relative", padding: "160px 24px 100px", overflow: "hidden" }}>
        {/* Mesh gradient background */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 20% -20%, rgba(124,58,237,0.25) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 120%, rgba(168,85,247,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 60% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)
          `
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, opacity: 0.03,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 16px", borderRadius: 100,
            border: "1px solid rgba(124,58,237,0.4)",
            background: "rgba(124,58,237,0.12)",
            color: "#c4b5fd", fontSize: 13, fontWeight: 500,
            marginBottom: 32,
          }}>
            <Sparkles size={13} />
            Plataforma completa de ensino online
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(42px, 7vw, 76px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: 24,
          }}>
            <span style={{ display: "block", color: "#f0f0f5" }}>Aprenda sem</span>
            <span style={{
              display: "block",
              background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 40%, #f0abfc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              limites.
            </span>
            <span style={{ display: "block", color: "#f0f0f5" }}>Ensine com impacto.</span>
          </h1>

          <p style={{
            fontSize: 18, color: "rgba(255,255,255,0.55)", maxWidth: 560, margin: "0 auto 40px",
            lineHeight: 1.7, letterSpacing: "-0.01em"
          }}>
            Vídeos em HD, lives ao vivo pelo navegador, progresso rastreado e pagamentos integrados.
            Tudo que você precisa para uma escola online de sucesso.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
            <Link href="/courses" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 12,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "white", textDecoration: "none", fontSize: 15, fontWeight: 600,
              boxShadow: "0 8px 32px rgba(124,58,237,0.4), 0 0 0 1px rgba(124,58,237,0.2)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}>
              <Play size={18} />
              Explorar cursos
            </Link>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 15, fontWeight: 500,
              backdropFilter: "blur(10px)",
            }}>
              Criar conta grátis
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ display: "flex" }}>
              {[
                "linear-gradient(135deg,#f472b6,#ec4899)",
                "linear-gradient(135deg,#a78bfa,#7c3aed)",
                "linear-gradient(135deg,#38bdf8,#0284c7)",
                "linear-gradient(135deg,#fb923c,#f59e0b)",
                "linear-gradient(135deg,#34d399,#059669)",
              ].map((bg, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: bg,
                  border: "2px solid #0a0a0f",
                  marginLeft: i === 0 ? 0 : -8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "white"
                }}>
                  {["A","B","C","D","E"][i]}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} color="#fbbf24" fill="#fbbf24" />
                ))}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                +2.000 alunos satisfeitos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1,
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, overflow: "hidden",
          background: "rgba(255,255,255,0.04)"
        }}>
          {[
            { value: "50+", label: "Cursos disponíveis", icon: BookOpen, color: "#a78bfa" },
            { value: "5k+", label: "Alunos ativos", icon: Users, color: "#60a5fa" },
            { value: "500h", label: "De conteúdo", icon: Clock, color: "#34d399" },
            { value: "98%", label: "Satisfação", icon: TrendingUp, color: "#fb923c" },
          ].map(({ value, label, icon: Icon, color }, i) => (
            <div key={label} style={{
              padding: "32px 24px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
              textAlign: "center",
            }}>
              <div style={{ marginBottom: 10 }}>
                <Icon size={22} color={color} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: "white", marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 100,
              border: "1px solid rgba(96,165,250,0.3)",
              background: "rgba(96,165,250,0.08)",
              color: "#93c5fd", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: 20
            }}>
              Recursos
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14, color: "white" }}>
              Tudo que você precisa,<br />em um só lugar
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Uma plataforma completa e moderna para criar, vender e acompanhar cursos online.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {[
              {
                icon: Video,
                gradient: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.03))",
                border: "rgba(124,58,237,0.2)",
                iconBg: "linear-gradient(135deg, #7c3aed, #a855f7)",
                iconGlow: "rgba(124,58,237,0.4)",
                title: "Vídeos em streaming HD",
                desc: "Upload direto para o MinIO com transcodificação automática HLS. Qualidade adaptativa em qualquer dispositivo, sem buffering.",
                tag: "Upload · HLS · Adaptive"
              },
              {
                icon: Zap,
                gradient: "linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.02))",
                border: "rgba(251,146,60,0.2)",
                iconBg: "linear-gradient(135deg, #ea580c, #fb923c)",
                iconGlow: "rgba(251,146,60,0.4)",
                title: "Lives direto do navegador",
                desc: "Transmita câmera ou tela compartilhada sem OBS ou software extra. Stream WebSocket → FFmpeg → RTMP → HLS.",
                tag: "WebRTC · RTMP · Real-time"
              },
              {
                icon: TrendingUp,
                gradient: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.02))",
                border: "rgba(52,211,153,0.2)",
                iconBg: "linear-gradient(135deg, #059669, #34d399)",
                iconGlow: "rgba(52,211,153,0.4)",
                title: "Progresso inteligente",
                desc: "Cada segundo assistido é salvo. Continue exatamente onde parou, em qualquer dispositivo. Veja o progresso por módulo e curso.",
                tag: "Auto-save · Multi-device"
              },
              {
                icon: Shield,
                gradient: "linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.02))",
                border: "rgba(96,165,250,0.2)",
                iconBg: "linear-gradient(135deg, #1d4ed8, #60a5fa)",
                iconGlow: "rgba(96,165,250,0.4)",
                title: "Pagamentos com Stripe",
                desc: "Checkout seguro, webhooks automáticos. O acesso é liberado instantaneamente após o pagamento confirmado.",
                tag: "Stripe · Webhook · Seguro"
              },
              {
                icon: Users,
                gradient: "linear-gradient(135deg, rgba(244,114,182,0.12), rgba(244,114,182,0.02))",
                border: "rgba(244,114,182,0.2)",
                iconBg: "linear-gradient(135deg, #be185d, #f472b6)",
                iconGlow: "rgba(244,114,182,0.4)",
                title: "Gestão de alunos",
                desc: "Dashboard admin completo. Veja quem está assistindo o quê, matricule manualmente, acompanhe cada etapa do progresso.",
                tag: "Dashboard · Analytics"
              },
              {
                icon: Globe,
                gradient: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.02))",
                border: "rgba(167,139,250,0.2)",
                iconBg: "linear-gradient(135deg, #5b21b6, #a78bfa)",
                iconGlow: "rgba(167,139,250,0.4)",
                title: "Tema personalizado",
                desc: "Adapte cores, logo e identidade visual em segundos. A plataforma inteira muda instantaneamente — sem código.",
                tag: "White-label · Branding"
              },
            ].map(({ icon: Icon, gradient, border, iconBg, iconGlow, title, desc, tag }) => (
              <div key={title} style={{
                borderRadius: 20,
                border: `1px solid ${border}`,
                background: gradient,
                padding: "28px 28px 24px",
                backdropFilter: "blur(10px)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                  boxShadow: `0 6px 20px ${iconGlow}`,
                }}>
                  <Icon size={22} color="white" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "white", letterSpacing: "-0.02em" }}>{title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: 16 }}>{desc}</p>
                <div style={{
                  display: "inline-flex", fontSize: 11, color: "rgba(255,255,255,0.35)",
                  padding: "3px 10px", borderRadius: 100,
                  border: "1px solid rgba(255,255,255,0.08)",
                  letterSpacing: "0.04em", fontWeight: 500
                }}>
                  {tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, letterSpacing: "-0.03em", color: "white", marginBottom: 12 }}>
              Do zero ao seu curso online em minutos
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>
              Simples para o admin. Incrível para o aluno.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              {
                step: "01", icon: BookOpen, color: "#a78bfa",
                title: "Crie seu curso", desc: "Organize módulos e aulas, faça upload de vídeos ou grave direto no navegador."
              },
              {
                step: "02", icon: Lock, color: "#60a5fa",
                title: "Configure o preço", desc: "Ative a venda com Stripe, defina o valor e o curso já aparece no catálogo."
              },
              {
                step: "03", icon: Users, color: "#34d399",
                title: "Alunos se inscrevem", desc: "Compram com cartão, o acesso é liberado automaticamente via webhook."
              },
              {
                step: "04", icon: TrendingUp, color: "#fb923c",
                title: "Acompanhe o progresso", desc: "Veja quem está assistindo, % concluído e engajamento em tempo real."
              },
            ].map(({ step, icon: Icon, color, title, desc }, i, arr) => (
              <div key={step} style={{ display: "flex", gap: 24, position: "relative" }}>
                {/* Line connector */}
                {i < arr.length - 1 && (
                  <div style={{
                    position: "absolute", left: 23, top: 52, bottom: -2,
                    width: 1, background: "rgba(255,255,255,0.06)"
                  }} />
                )}
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Icon size={20} color={color} />
                </div>
                <div style={{ paddingBottom: 32 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.1em" }}>PASSO {step}</span>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "white", margin: "4px 0 6px", letterSpacing: "-0.02em" }}>{title}</h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 480 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cursos ── */}
      {Array.isArray(courses) && courses.length > 0 && (
        <section style={{ padding: "80px 24px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", color: "white", marginBottom: 6 }}>
                  Cursos em destaque
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>Comece sua jornada hoje</p>
              </div>
              <Link href="/courses" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: "#a78bfa", textDecoration: "none", fontSize: 14, fontWeight: 500
              }}>
                Ver todos os cursos <ChevronRight size={16} />
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {courses.slice(0, 6).map((course: {
                id: string; title: string; thumbnailUrl?: string; level?: string;
                shortDescription?: string; totalLessons: number; totalModules: number;
                isForSale: boolean; price?: number; currency: string;
              }) => (
                <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.03)",
                    overflow: "hidden",
                    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                    height: "100%",
                    display: "flex", flexDirection: "column"
                  }}>
                    {/* Thumbnail */}
                    <div style={{ aspectRatio: "16/9", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))" }}>
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <BookOpen size={48} color="rgba(167,139,250,0.4)" />
                        </div>
                      )}
                      {course.level && (
                        <div style={{
                          position: "absolute", top: 12, left: 12,
                          padding: "3px 10px", borderRadius: 100,
                          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
                          color: "white", fontSize: 11, fontWeight: 600
                        }}>
                          {course.level}
                        </div>
                      )}
                      {/* Play overlay */}
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "opacity 0.2s"
                      }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: "50%",
                          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.3)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <Play size={20} color="white" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 8, letterSpacing: "-0.02em", lineHeight: 1.4 }}>
                        {course.title}
                      </h3>
                      {course.shortDescription && (
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 16, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {course.shortDescription}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                          {course.totalModules} módulos · {course.totalLessons} aulas
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: course.isForSale && course.price ? "#a78bfa" : "#34d399" }}>
                          {course.isForSale && course.price
                            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency || "BRL" }).format(course.price)
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

      {/* ── Checklist / Why us ── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{
              display: "inline-flex", fontSize: 12, color: "#a78bfa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em",
              padding: "4px 12px", borderRadius: 100, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)",
              marginBottom: 20
            }}>
              Por que escolher
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", color: "white", marginBottom: 16 }}>
              Simples para você.<br />Incrível para seus alunos.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7, fontSize: 15, marginBottom: 28 }}>
              Construída para educadores que querem focar no conteúdo, não na tecnologia. Deploy em um comando. Funciona do primeiro dia.
            </p>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 12,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600,
              boxShadow: "0 6px 24px rgba(124,58,237,0.35)"
            }}>
              Criar minha conta <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Upload de vídeo sem tamanho máximo",
              "Lives ao vivo pelo navegador, sem OBS",
              "Progresso salvo automaticamente",
              "Pagamentos via Stripe com webhook seguro",
              "Tema e cores totalmente personalizáveis",
              "Deploy simples com Docker Compose",
              "Sem taxa por aluno ou por curso",
              "Seus dados, no seu servidor",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(52,211,153,0.15)",
                  border: "1px solid rgba(52,211,153,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  <CheckCircle size={13} color="#34d399" />
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 24px 100px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)"
        }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)" }} />

        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.04em", color: "white", marginBottom: 14 }}>
            Pronto para começar?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
            Crie sua conta agora e tenha sua escola online funcionando em minutos.
            Sem cartão de crédito. Sem complicação.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 36px", borderRadius: 14,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "white", textDecoration: "none", fontSize: 16, fontWeight: 700,
              boxShadow: "0 12px 40px rgba(124,58,237,0.45), 0 0 0 1px rgba(124,58,237,0.3)",
              letterSpacing: "-0.01em"
            }}>
              Começar agora — é grátis
              <ArrowRight size={18} />
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            Sem taxa mensal · Seus dados no seu servidor · Open source
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <BookOpen size={14} color="white" />
            </div>
            <span style={{ fontWeight: 700, color: "white", fontSize: 15 }}>Classroom</span>
          </div>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} Classroom. Todos os direitos reservados.
          </p>

          <div style={{ display: "flex", gap: 24 }}>
            {[["Cursos", "/courses"], ["Entrar", "/login"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
