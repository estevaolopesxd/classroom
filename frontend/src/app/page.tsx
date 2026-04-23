import Link from "next/link";
import {
  BookOpen, Play, Users, Star, ChevronRight,
  Sparkles, Heart, Award, CheckCircle, ArrowRight,
  Clock, Gem, Palette
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

  const C = {
    rose: "#c9476e",
    roseDark: "#a8375a",
    roseLight: "#f7d6e3",
    blush: "#fdf0f5",
    cream: "#fffaf8",
    black: "#1a1014",
    charcoal: "#3d2535",
    muted: "#8a6070",
    gold: "#c9963a",
    goldLight: "#fdf3e0",
    white: "#ffffff",
    border: "#f0d5e2",
  };

  return (
    <div style={{ background: C.cream, color: C.black, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>

      {/* ── Navbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,250,248,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.black }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 12px ${C.rose}40`,
            }}>
              <Gem size={18} color="white" />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em", color: C.black }}>Nail</span>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em", color: C.rose }}>Class</span>
            </div>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <Link href="/courses" style={{ color: C.muted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Cursos</Link>
            <Link href="#sobre" style={{ color: C.muted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sobre</Link>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/login" style={{ color: C.muted, textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "8px 16px" }}>
              Entrar
            </Link>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: 10,
              background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
              color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600,
              boxShadow: `0 4px 14px ${C.rose}45`,
            }}>
              Começar agora
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: "relative", padding: "90px 24px 80px", overflow: "hidden" }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -100, right: -150, width: 500, height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.roseLight}80 0%, transparent 70%)`,
          zIndex: 0,
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -120, width: 400, height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.roseLight}60 0%, transparent 70%)`,
          zIndex: 0,
        }} />

        {/* Decorative dots */}
        <div style={{ position: "absolute", top: 60, left: "8%", width: 6, height: 6, borderRadius: "50%", background: C.rose, opacity: 0.3 }} />
        <div style={{ position: "absolute", top: 120, left: "12%", width: 4, height: 4, borderRadius: "50%", background: C.gold, opacity: 0.4 }} />
        <div style={{ position: "absolute", top: 80, right: "10%", width: 5, height: 5, borderRadius: "50%", background: C.rose, opacity: 0.3 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 16px", borderRadius: 100,
            background: C.blush,
            border: `1px solid ${C.border}`,
            color: C.rose, fontSize: 13, fontWeight: 600,
            marginBottom: 28,
            boxShadow: `0 2px 8px ${C.rose}15`,
          }}>
            <Sparkles size={13} />
            A escola de beleza mais completa do Brasil
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(38px, 6vw, 68px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            marginBottom: 22,
            color: C.black,
          }}>
            Transforme sua{" "}
            <span style={{
              background: `linear-gradient(135deg, ${C.rose}, #e0567a, #e8729a)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              paixão por unhas
            </span>
            <br />em uma carreira de sucesso
          </h1>

          <p style={{
            fontSize: 17, color: C.muted, maxWidth: 520, margin: "0 auto 36px",
            lineHeight: 1.7, letterSpacing: "-0.01em"
          }}>
            Aprenda nail art, gel, esmaltação em gel, manicure e muito mais com professoras especialistas.
            Do iniciante ao avançado — do seu jeito, no seu tempo.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
            <Link href="/courses" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 30px", borderRadius: 12,
              background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
              color: "white", textDecoration: "none", fontSize: 15, fontWeight: 700,
              boxShadow: `0 8px 24px ${C.rose}40`,
              letterSpacing: "-0.01em",
            }}>
              <Play size={17} fill="white" />
              Ver todos os cursos
            </Link>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 12,
              border: `1.5px solid ${C.border}`,
              background: "white",
              color: C.charcoal, textDecoration: "none", fontSize: 15, fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              Criar minha conta
              <ArrowRight size={16} color={C.rose} />
            </Link>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex" }}>
              {["#f9a8c9","#f472a8","#e91e8c","#c9476e","#a8375a"].map((bg, i) => (
                <div key={i} style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
                  border: "2.5px solid white",
                  marginLeft: i === 0 ? 0 : -10,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "white"
                }}>
                  {["A","B","C","D","E"][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />)}
              </div>
              <span style={{ fontSize: 13, color: C.muted }}>
                <strong style={{ color: C.black }}>+2.400 alunas</strong> já transformaram suas vidas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: "0 24px 70px" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}>
          {[
            { value: "50+", label: "Cursos disponíveis", icon: BookOpen, color: C.rose },
            { value: "2.4k+", label: "Alunas ativas", icon: Users, color: "#e8729a" },
            { value: "100h+", label: "De conteúdo", icon: Clock, color: C.gold },
            { value: "98%", label: "Recomendam", icon: Heart, color: "#e05595" },
          ].map(({ value, label, icon: Icon, color }) => (
            <div key={label} style={{
              padding: "24px 20px",
              borderRadius: 18,
              background: "white",
              border: `1px solid ${C.border}`,
              textAlign: "center",
              boxShadow: "0 2px 12px rgba(201,71,110,0.06)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: C.black }}>{value}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="sobre" style={{ padding: "70px 24px", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 100,
              background: C.blush, border: `1px solid ${C.border}`,
              color: C.rose, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 16,
            }}>
              Por que nos escolher
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", color: C.black, marginBottom: 12 }}>
              Tudo que você precisa para<br />se tornar uma profissional
            </h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
              Uma plataforma pensada especialmente para profissionais da beleza.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {[
              {
                icon: Palette,
                iconBg: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
                title: "Técnicas exclusivas",
                desc: "Aprenda nail art, gel, fibra de vidro, acrílico e muito mais. Conteúdo atualizado com as últimas tendências do mercado.",
              },
              {
                icon: Play,
                iconBg: "linear-gradient(135deg, #e8729a, #f0a0c0)",
                title: "Vídeos em alta qualidade",
                desc: "Aulas gravadas em HD com close das técnicas. Pause, volte e assista quantas vezes quiser — sem pressa.",
              },
              {
                icon: Heart,
                iconBg: `linear-gradient(135deg, ${C.gold}, #e0c060)`,
                title: "Lives ao vivo",
                desc: "Participe de aulas ao vivo direto pelo navegador. Tire dúvidas em tempo real com a professora.",
              },
              {
                icon: Award,
                iconBg: "linear-gradient(135deg, #a8375a, #c9476e)",
                title: "Certificado de conclusão",
                desc: "Receba seu certificado ao completar o curso. Valorize seu currículo e comprove sua qualificação.",
              },
              {
                icon: Gem,
                iconBg: "linear-gradient(135deg, #8e5a8e, #b57ab5)",
                title: "Do básico ao avançado",
                desc: "Trilhas completas para quem está começando e para profissionais que querem se especializar ainda mais.",
              },
              {
                icon: Users,
                iconBg: "linear-gradient(135deg, #c96090, #e890b0)",
                title: "Comunidade exclusiva",
                desc: "Faça parte de uma comunidade de profissionais apaixonadas por beleza. Troque experiências e inspire-se.",
              },
            ].map(({ icon: Icon, iconBg, title, desc }) => (
              <div key={title} style={{
                padding: "28px",
                borderRadius: 20,
                border: `1px solid ${C.border}`,
                background: C.cream,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14,
                  background: iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18,
                  boxShadow: `0 6px 16px ${C.rose}30`,
                }}>
                  <Icon size={22} color="white" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.black, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ── */}
      {Array.isArray(courses) && courses.length > 0 && (
        <section style={{ padding: "70px 24px", background: C.blush }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 12px", borderRadius: 100,
                  background: "white", border: `1px solid ${C.border}`,
                  color: C.rose, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                  marginBottom: 12,
                }}>
                  Destaques
                </div>
                <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", color: C.black }}>
                  Cursos em destaque
                </h2>
              </div>
              <Link href="/courses" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: C.rose, textDecoration: "none", fontSize: 14, fontWeight: 600,
                padding: "8px 16px", borderRadius: 10,
                border: `1.5px solid ${C.rose}`,
                background: "white",
              }}>
                Ver todos <ChevronRight size={16} />
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {courses.slice(0, 6).map((course: {
                id: string; title: string; thumbnailUrl?: string; level?: string;
                shortDescription?: string; totalLessons: number; totalModules: number;
                isForSale: boolean; price?: number; currency: string;
              }) => (
                <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    borderRadius: 20, background: "white",
                    border: `1px solid ${C.border}`,
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(201,71,110,0.07)",
                    display: "flex", flexDirection: "column", height: "100%",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}>
                    <div style={{ aspectRatio: "16/9", position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${C.roseLight}, ${C.blush})` }}>
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Gem size={48} color={`${C.rose}40`} />
                        </div>
                      )}
                      {course.level && (
                        <div style={{
                          position: "absolute", top: 12, left: 12,
                          padding: "3px 10px", borderRadius: 100,
                          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
                          color: C.rose, fontSize: 11, fontWeight: 700,
                          border: `1px solid ${C.border}`,
                        }}>
                          {course.level}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.black, marginBottom: 8, letterSpacing: "-0.02em", lineHeight: 1.4 }}>
                        {course.title}
                      </h3>
                      {course.shortDescription && (
                        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
                          {course.shortDescription}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 12, color: C.muted }}>
                          {course.totalModules} módulos · {course.totalLessons} aulas
                        </span>
                        <span style={{
                          fontSize: 14, fontWeight: 800, color: "white",
                          padding: "4px 12px", borderRadius: 8,
                          background: course.isForSale && course.price
                            ? `linear-gradient(135deg, ${C.rose}, #e8729a)`
                            : "linear-gradient(135deg, #22c55e, #16a34a)",
                        }}>
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

      {/* ── Checklist ── */}
      <section style={{ padding: "70px 24px", background: "white" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{
              display: "inline-block", fontSize: 12, color: C.rose, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em",
              padding: "5px 14px", borderRadius: 100,
              background: C.blush, border: `1px solid ${C.border}`,
              marginBottom: 20,
            }}>
              Vantagens exclusivas
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", color: C.black, marginBottom: 14 }}>
              A plataforma certa para<br />quem quer crescer
            </h2>
            <p style={{ color: C.muted, lineHeight: 1.7, fontSize: 15, marginBottom: 28 }}>
              Criada especialmente para profissionais da beleza que querem aprender com qualidade e se destacar no mercado.
            </p>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 12,
              background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
              color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600,
              boxShadow: `0 6px 20px ${C.rose}35`,
            }}>
              Quero começar agora <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              "Aulas em vídeo HD assistidas quando quiser",
              "Lives ao vivo com a professora",
              "Acesso vitalício ao conteúdo comprado",
              "Certificado de conclusão incluso",
              "Técnicas do básico ao nível profissional",
              "Suporte e comunidade de alunas",
              "Novas aulas adicionadas regularmente",
              "Funciona no celular, tablet e computador",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 2px 8px ${C.rose}30`,
                }}>
                  <CheckCircle size={13} color="white" />
                </div>
                <span style={{ fontSize: 14, color: C.charcoal, fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "70px 24px", background: C.blush }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", color: C.black, marginBottom: 8 }}>
              O que nossas alunas dizem
            </h2>
            <p style={{ color: C.muted, fontSize: 15 }}>Histórias reais de quem já transformou a carreira</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {[
              {
                name: "Mariana S.", role: "Nail Designer",
                text: "Em 3 meses aprendi tudo sobre gel e hoje atendo mais de 40 clientes por mês. A qualidade das aulas é incrível!",
                stars: 5, color: C.rose,
              },
              {
                name: "Juliana R.", role: "Manicure Profissional",
                text: "As técnicas de nail art que aprendi aqui transformaram meu trabalho. Minhas clientes ficam apaixonadas com os resultados!",
                stars: 5, color: "#e8729a",
              },
              {
                name: "Priscila M.", role: "Estudante",
                text: "Comecei do zero e em poucos meses já estou atendendo. Os vídeos são muito detalhados e as lives tiram todas as dúvidas.",
                stars: 5, color: C.gold,
              },
            ].map(({ name, role, text, stars, color }) => (
              <div key={name} style={{
                padding: "28px",
                borderRadius: 20,
                background: "white",
                border: `1px solid ${C.border}`,
                boxShadow: "0 4px 16px rgba(201,71,110,0.06)",
              }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(stars)].map((_, i) => <Star key={i} size={15} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <p style={{ fontSize: 14, color: C.charcoal, lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>
                  "{text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${color}, ${color}88)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "white", fontSize: 15,
                  }}>
                    {name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.black }}>{name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{
          maxWidth: 680, margin: "0 auto", textAlign: "center",
          background: `linear-gradient(135deg, ${C.rose}, #e0567a, #e8729a)`,
          borderRadius: 28,
          padding: "60px 40px",
          boxShadow: `0 20px 60px ${C.rose}40`,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* decorations inside CTA */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💅</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", color: "white", marginBottom: 12 }}>
              Comece sua jornada hoje
            </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
              Junte-se a milhares de alunas que já transformaram<br />suas vidas com a arte das unhas.
            </p>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 12,
              background: "white",
              color: C.rose, textDecoration: "none", fontSize: 15, fontWeight: 700,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              letterSpacing: "-0.01em",
            }}>
              Criar minha conta — é grátis <ArrowRight size={17} />
            </Link>
            <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              Sem cartão de crédito · Acesso imediato
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: C.black, padding: "40px 24px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 28, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Gem size={17} color="white" />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: 17, color: "white" }}>Nail</span>
                <span style={{ fontWeight: 800, fontSize: 17, color: C.rose }}>Class</span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
              A escola de beleza mais completa do Brasil
            </p>
            <div style={{ display: "flex", gap: 24 }}>
              {[["Cursos", "/courses"], ["Entrar", "/login"]].map(([label, href]) => (
                <Link key={href} href={href} style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} NailClass. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
