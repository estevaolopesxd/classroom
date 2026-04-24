import Link from "next/link";
import {
  Play, Users, Star, Sparkles, ArrowRight,
  Gem, CheckCircle, BookOpen, Clock, Heart, Award
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
    <div style={{
      background: "#FEFAF8",
      color: "#0F0A0D",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflowX: "hidden",
    }}>

      {/* ── NAV ── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(254,250,248,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid #EDCFDE",
      }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #D4437C, #8B1A42)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(212,67,124,0.35)",
            }}>
              <Gem size={18} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.04em", color: "#0F0A0D" }}>
              Nail<span style={{ color: "#D4437C" }}>✦</span>Class
            </span>
          </Link>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 36 }}>
            {[["Cursos", "/courses"], ["Sobre", "#sobre"], ["Depoimentos", "#depoimentos"]].map(([label, href]) => (
              <Link key={href} href={href} style={{
                color: "#7A5A68",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                transition: "color 0.2s",
              }}
                onMouseEnter={undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/login" style={{
              color: "#7A5A68",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              padding: "9px 18px",
              borderRadius: 10,
              border: "1.5px solid #EDCFDE",
              background: "transparent",
              transition: "all 0.2s",
            }}>
              Entrar
            </Link>
            <Link href="/login" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 22px",
              borderRadius: 100,
              background: "linear-gradient(135deg, #D4437C 0%, #8B1A42 100%)",
              backgroundSize: "200% auto",
              color: "white",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              boxShadow: "0 4px 18px rgba(212,67,124,0.4)",
              animation: "shimmer 3s linear infinite",
            }}>
              Começar grátis ✦
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        background: "#0F0A0D",
        minHeight: "92vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        padding: "80px 32px",
      }}>
        {/* Background gradient orbs */}
        <div style={{
          position: "absolute",
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,67,124,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: -150,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,26,66,0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          top: "30%",
          left: "38%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,169,122,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 80,
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}>
          {/* LEFT — Text */}
          <div>
            {/* Badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 100,
              background: "rgba(212,67,124,0.12)",
              border: "1px solid rgba(212,67,124,0.3)",
              color: "#F9E8F0",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 32,
              letterSpacing: "0.02em",
            }}>
              <span style={{ color: "#D4437C" }}>✦</span>
              A escola de unhas mais completa
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(52px, 6vw, 88px)",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1.0,
              color: "#FEFAF8",
              marginBottom: 28,
            }}>
              Aprenda a arte<br />
              das unhas.{" "}
              <span style={{
                background: "linear-gradient(135deg, #D4437C, #C8A97A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Do zero ao
              </span>
              <br />
              <span style={{
                background: "linear-gradient(135deg, #C8A97A, #D4437C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                profissional.
              </span>
            </h1>

            <p style={{
              fontSize: 17,
              color: "rgba(254,250,248,0.55)",
              lineHeight: 1.75,
              marginBottom: 44,
              maxWidth: 480,
              letterSpacing: "-0.01em",
            }}>
              Domine técnicas de nail art, gel UV, acrílico e muito mais.
              Aulas em HD, lives ao vivo, certificado incluso.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 52, flexWrap: "wrap" }}>
              <Link href="/courses" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 36px",
                borderRadius: 100,
                background: "linear-gradient(135deg, #D4437C 0%, #8B1A42 100%)",
                backgroundSize: "200% auto",
                color: "white",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                boxShadow: "0 8px 32px rgba(212,67,124,0.45)",
                animation: "shimmer 3s linear infinite",
              }}>
                <Play size={16} fill="white" />
                Explorar cursos
              </Link>
              <Link href="/login" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 32px",
                borderRadius: 100,
                border: "1.5px solid rgba(254,250,248,0.15)",
                background: "rgba(254,250,248,0.05)",
                color: "#FEFAF8",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
                backdropFilter: "blur(8px)",
              }}>
                Criar conta grátis
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Trust indicators */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* Avatars */}
              <div style={{ display: "flex" }}>
                {["#D4437C", "#C8A97A", "#8B1A42", "#e8729a", "#b55a8a"].map((bg, i) => (
                  <div key={i} style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${bg}, ${bg}99)`,
                    border: "2.5px solid #0F0A0D",
                    marginLeft: i === 0 ? 0 : -12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    position: "relative",
                    zIndex: 5 - i,
                  }}>
                    {["M","J","P","A","L"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} color="#C8A97A" fill="#C8A97A" />)}
                </div>
                <span style={{ fontSize: 13, color: "rgba(254,250,248,0.5)", letterSpacing: "-0.01em" }}>
                  <strong style={{ color: "#FEFAF8", fontWeight: 700 }}>+2.400 alunas</strong> já aprenderam
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — floating cards */}
          <div style={{ position: "relative", height: 540, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Card 1 — background */}
            <div style={{
              position: "absolute",
              top: 20,
              right: -20,
              width: 260,
              borderRadius: 24,
              background: "rgba(212,67,124,0.08)",
              border: "1px solid rgba(212,67,124,0.2)",
              padding: "20px",
              backdropFilter: "blur(12px)",
              transform: "rotate(4deg)",
              animation: "float 6s ease-in-out infinite",
              animationDelay: "1s",
            }}>
              <div style={{
                height: 130,
                borderRadius: 14,
                background: "linear-gradient(135deg, #8B1A42, #D4437C)",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                <Award size={36} color="rgba(255,255,255,0.9)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FEFAF8", marginBottom: 4 }}>Nail Art Avançado</div>
              <div style={{ fontSize: 12, color: "rgba(254,250,248,0.5)" }}>18 módulos · 96 aulas</div>
            </div>

            {/* Card 2 — center, main */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 280,
              borderRadius: 28,
              background: "rgba(254,250,248,0.06)",
              border: "1px solid rgba(212,67,124,0.25)",
              padding: "24px",
              backdropFilter: "blur(20px)",
              animation: "float 6s ease-in-out infinite",
              zIndex: 2,
            }}>
              <div style={{
                height: 150,
                borderRadius: 18,
                background: "linear-gradient(135deg, #D4437C 0%, #8B1A42 50%, #C8A97A 100%)",
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(0,0,0,0.1)" }} />
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(255,255,255,0.4)",
                }}>
                  <Play size={22} fill="white" color="white" />
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#FEFAF8", marginBottom: 6, letterSpacing: "-0.02em" }}>
                Gel UV Profissional
              </div>
              <div style={{ fontSize: 12, color: "rgba(254,250,248,0.5)", marginBottom: 14 }}>12 módulos · 64 aulas</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} color="#C8A97A" fill="#C8A97A" />)}
                </div>
                <div style={{
                  padding: "4px 12px",
                  borderRadius: 100,
                  background: "rgba(212,67,124,0.2)",
                  border: "1px solid rgba(212,67,124,0.3)",
                  color: "#F9E8F0",
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  Destaque
                </div>
              </div>
            </div>

            {/* Card 3 — bottom left */}
            <div style={{
              position: "absolute",
              bottom: 30,
              left: -10,
              width: 240,
              borderRadius: 20,
              background: "rgba(200,169,122,0.08)",
              border: "1px solid rgba(200,169,122,0.2)",
              padding: "18px",
              backdropFilter: "blur(12px)",
              transform: "rotate(-3deg)",
              animation: "float 6s ease-in-out infinite",
              animationDelay: "2s",
            }}>
              <div style={{
                height: 110,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(200,169,122,0.3), rgba(212,67,124,0.2))",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(200,169,122,0.15)",
              }}>
                <Sparkles size={28} color="#C8A97A" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FEFAF8", marginBottom: 3 }}>Decoração & Nail Art</div>
              <div style={{ fontSize: 11, color: "rgba(254,250,248,0.45)" }}>8 módulos · 42 aulas</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div style={{
        background: "#D4437C",
        overflow: "hidden",
        padding: "16px 0",
        borderTop: "1px solid #8B1A42",
        borderBottom: "1px solid #8B1A42",
      }}>
        <div style={{
          display: "flex",
          width: "max-content",
          animation: "marquee 28s linear infinite",
        }}>
          {[1, 2].map((n) => (
            <div key={n} style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              whiteSpace: "nowrap",
              paddingRight: 0,
            }}>
              {["Nail Art", "Gel UV", "Esmaltação em Gel", "Unhas Acrílicas", "Alongamento", "Nail Design", "French", "Baby Boomer", "Decoração"].map((item, i) => (
                <span key={i} style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.92)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  padding: "0 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                }}>
                  {item}
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8 }}>◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="sobre" style={{ background: "white", padding: "120px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          {/* Section heading */}
          <div style={{ textAlign: "center", marginBottom: 100 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 18px",
              borderRadius: 100,
              background: "#F9E8F0",
              border: "1px solid #EDCFDE",
              color: "#D4437C",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 20,
            }}>
              Por que a NailClass
            </div>
            <h2 style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#0F0A0D",
              lineHeight: 1.08,
            }}>
              Tudo que você precisa para<br />se tornar profissional
            </h2>
          </div>

          {/* Row 1 — Video HD */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
            marginBottom: 120,
          }}>
            <div style={{ paddingRight: 40 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "#D4437C",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 20,
                background: "#F9E8F0",
                padding: "5px 14px",
                borderRadius: 100,
                border: "1px solid #EDCFDE",
              }}>
                01 — Conteúdo
              </div>
              <h3 style={{
                fontSize: "clamp(28px, 3vw, 44px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#0F0A0D",
                lineHeight: 1.1,
                marginBottom: 24,
              }}>
                Vídeos em HD com<br />close das técnicas
              </h3>
              <p style={{
                fontSize: 16,
                color: "#7A5A68",
                lineHeight: 1.8,
                marginBottom: 36,
                maxWidth: 420,
              }}>
                Cada detalhe das técnicas gravado em alta definição com câmera de close. Pause, volte e assista quantas vezes precisar — sem pressa, no seu ritmo.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {["Qualidade 4K em todos os vídeos", "Close detalhado das técnicas", "Acesso vitalício ao conteúdo"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <CheckCircle size={12} color="white" />
                    </div>
                    <span style={{ fontSize: 14, color: "#0F0A0D", fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{
                borderRadius: 28,
                background: "linear-gradient(135deg, #D4437C 0%, #8B1A42 50%, #C8A97A 100%)",
                padding: "48px 40px",
                aspectRatio: "4/3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 32px 80px rgba(212,67,124,0.3)",
              }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                <div style={{ position: "absolute", bottom: -30, left: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(0,0,0,0.1)" }} />
                <div style={{ position: "absolute", top: 20, left: 20, display: "flex", gap: 6 }}>
                  {["rgba(255,255,255,0.3)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0.15)"].map((bg, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: bg }} />
                  ))}
                </div>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  border: "2px solid rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 1,
                }}>
                  <Play size={32} fill="white" color="white" />
                </div>
                {/* Sparkle decorations */}
                <div style={{ position: "absolute", top: 40, right: 30, color: "rgba(255,255,255,0.6)", fontSize: 20 }}>✦</div>
                <div style={{ position: "absolute", bottom: 50, right: 50, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>✦</div>
                <div style={{ position: "absolute", bottom: 30, left: 40, color: "rgba(200,169,122,0.7)", fontSize: 16 }}>✦</div>
              </div>
              {/* Floating stat card */}
              <div style={{
                position: "absolute",
                bottom: -24,
                left: -28,
                background: "white",
                borderRadius: 18,
                padding: "16px 20px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                border: "1px solid #EDCFDE",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <BookOpen size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#0F0A0D", letterSpacing: "-0.03em" }}>100h+</div>
                  <div style={{ fontSize: 12, color: "#7A5A68" }}>De conteúdo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 — Lives (reversed) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
            marginBottom: 100,
          }}>
            {/* Visual left */}
            <div style={{ position: "relative" }}>
              <div style={{
                borderRadius: 28,
                background: "#0F0A0D",
                padding: "32px",
                aspectRatio: "4/3",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 32px 80px rgba(15,10,13,0.4)",
                border: "1px solid rgba(212,67,124,0.2)",
              }}>
                {/* Mock live UI */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4437C", boxShadow: "0 0 8px #D4437C" }} />
                    <span style={{ fontSize: 12, color: "#D4437C", fontWeight: 700, letterSpacing: "0.08em" }}>AO VIVO</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(254,250,248,0.4)" }}>124 assistindo</div>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[40, 65, 45, 80, 55, 70, 48, 62].map((h, i) => (
                    <div key={i} style={{
                      width: 8,
                      height: h,
                      borderRadius: 4,
                      background: i % 2 === 0
                        ? "linear-gradient(to top, #D4437C, #8B1A42)"
                        : "rgba(212,67,124,0.2)",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "white",
                  }}>
                    P
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#FEFAF8" }}>Prof. Patrícia Lima</div>
                    <div style={{ fontSize: 11, color: "rgba(254,250,248,0.4)" }}>Técnica Baby Boomer</div>
                  </div>
                </div>
                {/* Glow */}
                <div style={{
                  position: "absolute",
                  bottom: -60,
                  right: -60,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212,67,124,0.15) 0%, transparent 70%)",
                }} />
              </div>
              {/* Badge */}
              <div style={{
                position: "absolute",
                top: -20,
                right: -20,
                background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                borderRadius: 16,
                padding: "12px 18px",
                boxShadow: "0 8px 24px rgba(212,67,124,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white", boxShadow: "0 0 6px white" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "white", letterSpacing: "0.06em" }}>LIVE HOJE</span>
              </div>
            </div>

            {/* Text right */}
            <div style={{ paddingLeft: 40 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "#D4437C",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 20,
                background: "#F9E8F0",
                padding: "5px 14px",
                borderRadius: 100,
                border: "1px solid #EDCFDE",
              }}>
                02 — Interativo
              </div>
              <h3 style={{
                fontSize: "clamp(28px, 3vw, 44px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#0F0A0D",
                lineHeight: 1.1,
                marginBottom: 24,
              }}>
                Lives ao vivo,<br />direto do navegador
              </h3>
              <p style={{
                fontSize: 16,
                color: "#7A5A68",
                lineHeight: 1.8,
                marginBottom: 36,
                maxWidth: 420,
              }}>
                Participe de aulas ao vivo com as professoras, tire dúvidas em tempo real e aprenda de qualquer dispositivo, sem instalar nada.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {["Dúvidas respondidas em tempo real", "Gravação disponível após a live", "Calendário de lives semanais"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <CheckCircle size={12} color="white" />
                    </div>
                    <span style={{ fontSize: 14, color: "#0F0A0D", fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3 — Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid #EDCFDE",
          }}>
            {[
              { value: "50+", label: "Cursos", icon: BookOpen, desc: "disponíveis agora" },
              { value: "2.4k", label: "Alunas", icon: Users, desc: "já aprenderam" },
              { value: "100h", label: "Conteúdo", icon: Clock, desc: "de aulas em vídeo" },
              { value: "98%", label: "Satisfação", icon: Heart, desc: "recomendam" },
            ].map(({ value, label, icon: Icon, desc }, i) => (
              <div key={label} style={{
                padding: "48px 32px",
                background: i % 2 === 0 ? "#FEFAF8" : "white",
                textAlign: "center",
                borderRight: i < 3 ? "1px solid #EDCFDE" : "none",
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #F9E8F0, #EDCFDE)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}>
                  <Icon size={22} color="#D4437C" />
                </div>
                <div style={{
                  fontSize: 52,
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                  color: "#0F0A0D",
                  lineHeight: 1,
                  marginBottom: 8,
                }}>
                  {value}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0F0A0D", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: "#7A5A68" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COURSES ── */}
      <section style={{ background: "#FEFAF8", padding: "120px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Heading row */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 100,
                background: "#F9E8F0",
                border: "1px solid #EDCFDE",
                color: "#D4437C",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 16,
              }}>
                Destaques
              </div>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#0F0A0D",
                lineHeight: 1.05,
              }}>
                Cursos em destaque
              </h2>
            </div>
            <Link href="/courses" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#D4437C",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              padding: "10px 20px",
              borderRadius: 100,
              border: "1.5px solid #D4437C",
              background: "transparent",
              transition: "all 0.2s",
            }}>
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>

          {/* Course grid */}
          {Array.isArray(courses) && courses.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}>
              {courses.slice(0, 6).map((course: {
                id: string;
                title: string;
                thumbnailUrl?: string;
                level?: string;
                shortDescription?: string;
                totalLessons: number;
                totalModules: number;
                isForSale: boolean;
                price?: number;
                currency: string;
              }) => (
                <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    borderRadius: 24,
                    background: "white",
                    border: "1px solid #EDCFDE",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                    boxShadow: "0 4px 20px rgba(212,67,124,0.06)",
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(212,67,124,0.18)";
                      (e.currentTarget as HTMLElement).style.borderColor = "#D4437C";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(212,67,124,0.06)";
                      (e.currentTarget as HTMLElement).style.borderColor = "#EDCFDE";
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      aspectRatio: "16/9",
                      position: "relative",
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #F9E8F0, #EDCFDE)",
                    }}>
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(135deg, #D4437C 0%, #8B1A42 60%, #C8A97A 100%)",
                          position: "relative",
                          overflow: "hidden",
                        }}>
                          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                          <Gem size={42} color="rgba(255,255,255,0.5)" />
                        </div>
                      )}
                      {course.level && (
                        <div style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          padding: "4px 12px",
                          borderRadius: 100,
                          background: "rgba(15,10,13,0.7)",
                          backdropFilter: "blur(8px)",
                          color: "#F9E8F0",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          border: "1px solid rgba(212,67,124,0.3)",
                        }}>
                          {course.level}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: "22px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#0F0A0D",
                        marginBottom: 8,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.3,
                      }}>
                        {course.title}
                      </h3>
                      {course.shortDescription && (
                        <p style={{
                          fontSize: 13,
                          color: "#7A5A68",
                          lineHeight: 1.65,
                          marginBottom: 20,
                          flex: 1,
                        }}>
                          {course.shortDescription}
                        </p>
                      )}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 16,
                        borderTop: "1px solid #EDCFDE",
                        marginTop: "auto",
                      }}>
                        <span style={{ fontSize: 12, color: "#7A5A68" }}>
                          {course.totalModules} módulos · {course.totalLessons} aulas
                        </span>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "white",
                          padding: "5px 14px",
                          borderRadius: 100,
                          background: course.isForSale && course.price
                            ? "linear-gradient(135deg, #D4437C, #8B1A42)"
                            : "linear-gradient(135deg, #22c55e, #16a34a)",
                          letterSpacing: "-0.01em",
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
          ) : (
            // Skeleton cards
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{
                  borderRadius: 24,
                  background: "white",
                  border: "1px solid #EDCFDE",
                  overflow: "hidden",
                }}>
                  <div style={{
                    aspectRatio: "16/9",
                    background: "linear-gradient(90deg, #F9E8F0 25%, #EDCFDE 50%, #F9E8F0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }} />
                  <div style={{ padding: "22px 24px" }}>
                    <div style={{ height: 20, borderRadius: 8, background: "#F9E8F0", marginBottom: 10, width: "80%" }} />
                    <div style={{ height: 14, borderRadius: 6, background: "#F9E8F0", marginBottom: 6, width: "100%" }} />
                    <div style={{ height: 14, borderRadius: 6, background: "#F9E8F0", width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="depoimentos" style={{ background: "#0F0A0D", padding: "120px 32px", position: "relative", overflow: "hidden" }}>
        {/* Background orbs */}
        <div style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,67,124,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,26,66,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Large quote mark */}
          <div style={{
            fontSize: 160,
            lineHeight: 1,
            color: "#D4437C",
            fontFamily: "Georgia, serif",
            marginBottom: -60,
            opacity: 0.6,
            letterSpacing: "-0.05em",
          }}>
            &ldquo;
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 72 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 18px",
              borderRadius: 100,
              background: "rgba(212,67,124,0.1)",
              border: "1px solid rgba(212,67,124,0.25)",
              color: "#D4437C",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 20,
            }}>
              Depoimentos
            </div>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#FEFAF8",
              lineHeight: 1.08,
              maxWidth: 560,
            }}>
              O que nossas alunas dizem
            </h2>
          </div>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              {
                name: "Mariana S.",
                role: "Nail Designer Profissional",
                text: "Em 3 meses aprendi tudo sobre gel e hoje atendo mais de 40 clientes por mês. A qualidade das aulas é absolutamente incrível, cada detalhe explicado com perfeição.",
                stars: 5,
                color: "#D4437C",
                initial: "M",
              },
              {
                name: "Juliana R.",
                role: "Manicure & Nail Artist",
                text: "As técnicas de nail art que aprendi aqui transformaram completamente o meu trabalho. Minhas clientes ficam apaixonadas com os resultados. Não tem comparação.",
                stars: 5,
                color: "#C8A97A",
                initial: "J",
              },
              {
                name: "Priscila M.",
                role: "Estudante → Profissional",
                text: "Comecei totalmente do zero e em poucos meses já estou atendendo clientes. Os vídeos são detalhados e as lives tiram todas as dúvidas. Melhor investimento da minha vida.",
                stars: 5,
                color: "#8B1A42",
                initial: "P",
              },
            ].map(({ name, role, text, stars, color, initial }) => (
              <div key={name} style={{
                padding: "36px 32px",
                borderRadius: 24,
                background: "rgba(254,250,248,0.04)",
                border: "1px solid rgba(212,67,124,0.15)",
                backdropFilter: "blur(10px)",
                transition: "border-color 0.25s, background 0.25s",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,67,124,0.4)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(254,250,248,0.07)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,67,124,0.15)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(254,250,248,0.04)";
                }}
              >
                <div style={{ display: "flex", gap: 3, marginBottom: 24 }}>
                  {[...Array(stars)].map((_, i) => (
                    <Star key={i} size={16} color="#C8A97A" fill="#C8A97A" />
                  ))}
                </div>
                <p style={{
                  fontSize: 15,
                  color: "rgba(254,250,248,0.8)",
                  lineHeight: 1.8,
                  marginBottom: 32,
                  fontStyle: "italic",
                  letterSpacing: "-0.01em",
                }}>
                  &ldquo;{text}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${color}, ${color}88)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "white",
                    fontSize: 17,
                    flexShrink: 0,
                    border: "2px solid rgba(212,67,124,0.3)",
                  }}>
                    {initial}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#FEFAF8", letterSpacing: "-0.01em" }}>{name}</div>
                    <div style={{ fontSize: 12, color: "rgba(254,250,248,0.4)", marginTop: 3 }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FULL-BLEED ── */}
      <section style={{
        background: "linear-gradient(135deg, #D4437C 0%, #8B1A42 100%)",
        padding: "120px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative shapes */}
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: "rgba(0,0,0,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 40, right: "20%", color: "rgba(255,255,255,0.15)", fontSize: 60, fontWeight: 900, pointerEvents: "none" }}>✦</div>
        <div style={{ position: "absolute", bottom: 40, left: "15%", color: "rgba(255,255,255,0.08)", fontSize: 40, fontWeight: 900, pointerEvents: "none" }}>✦</div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 56, marginBottom: 20, lineHeight: 1 }}>💅</div>
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 64px)",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            color: "white",
            lineHeight: 1.0,
            marginBottom: 20,
          }}>
            Comece sua<br />transformação hoje
          </h2>
          <p style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.7,
            marginBottom: 44,
            maxWidth: 480,
            margin: "0 auto 44px",
          }}>
            Junte-se a mais de 2.400 alunas que já transformaram sua paixão por unhas em uma carreira lucrativa.
          </p>
          <Link href="/login" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "18px 44px",
            borderRadius: 100,
            background: "white",
            color: "#8B1A42",
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 50px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.2)";
            }}
          >
            Criar minha conta — é grátis
            <ArrowRight size={18} />
          </Link>
          <p style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            Sem cartão de crédito · Acesso imediato
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0F0A0D", padding: "56px 32px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 40,
            paddingBottom: 48,
            marginBottom: 32,
            borderBottom: "1px solid rgba(212,67,124,0.15)",
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(212,67,124,0.4)",
                }}>
                  <Gem size={17} color="white" />
                </div>
                <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.04em", color: "#FEFAF8" }}>
                  Nail<span style={{ color: "#D4437C" }}>✦</span>Class
                </span>
              </div>
              <p style={{ fontSize: 14, color: "rgba(254,250,248,0.35)", maxWidth: 260, lineHeight: 1.7 }}>
                A escola de unhas mais completa do Brasil. Do zero ao profissional.
              </p>
            </div>

            {/* Nav links */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(254,250,248,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                Navegação
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Cursos", "/courses"], ["Entrar", "/login"], ["Sobre", "#sobre"]].map(([label, href]) => (
                  <Link key={href} href={href} style={{
                    fontSize: 14,
                    color: "rgba(254,250,248,0.45)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: "rgba(254,250,248,0.2)" }}>
              © {new Date().getFullYear()} NailClass. Todos os direitos reservados.
            </p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#D4437C", opacity: 0.5 }} />
              <span style={{ fontSize: 13, color: "rgba(254,250,248,0.2)" }}>Feito com ✦ para profissionais da beleza</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-cards { display: none !important; }
          .features-row { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
          .courses-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .footer-top { flex-direction: column !important; }
        }
        @media (max-width: 600px) {
          .courses-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
