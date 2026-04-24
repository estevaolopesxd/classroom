"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import { Loader2, Eye, EyeOff, CheckCircle, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setToken(data.accessToken, data.user);
      toast.success(`Bem-vinda, ${data.user.firstName}! 💅`);
      router.push(data.user.role === "Admin" ? "/admin" : "/dashboard");
    } catch {
      toast.error("E-mail ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: "#FEFAF8",
      overflow: "hidden",
    }}>

      {/* ── LEFT PANEL ── */}
      <div
        className="login-left-panel"
        style={{
          flex: "0 0 42%",
          background: "#0F0A0D",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
        }}
      >
        {/* Rose gradient orb */}
        <div style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,67,124,0.22) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,26,66,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          top: "45%",
          right: 60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,169,122,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(140deg, #E05890 0%, #D4437C 50%, #8B1A42 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(212,67,124,0.4), inset 0 1px 0 rgba(255,255,255,.18)",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M6 3L2 9l10 12L22 9l-4-6H6z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
                <path d="M2 9h20M6 3l3 6M18 3l-3 6M12 21L9 9M12 21l3-12" stroke="rgba(255,255,255,.65)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em", color: "#FEFAF8" }}>
              Nail<span style={{ color: "#D4437C" }}>Class</span>
            </span>
          </Link>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Diamond accent */}
          <div style={{ marginBottom: 28 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M6 3L2 9l10 12L22 9l-4-6H6z" fill="rgba(212,67,124,0.18)" stroke="#D4437C" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M2 9h20M6 3l3 6M18 3l-3 6M12 21L9 9M12 21l3-12" stroke="rgba(212,67,124,.6)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(28px, 3vw, 42px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#FEFAF8",
            lineHeight: 1.06,
            marginBottom: 16,
          }}>
            Bem-vinda<br />
            <em style={{ fontStyle: "italic", color: "#E05890" }}>de volta.</em>
          </h2>
          <p style={{
            fontSize: 15,
            color: "rgba(254,250,248,0.5)",
            lineHeight: 1.75,
            marginBottom: 40,
            maxWidth: 340,
          }}>
            Continue sua jornada de aprendizado e evolua suas habilidades em nail art.
          </p>

          {/* Feature bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {[
              "Mais de 50 cursos em vídeo HD",
              "+2.400 alunas já transformaram suas vidas",
              "Certificado de conclusão em todos os cursos",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(212,67,124,0.15)",
                  border: "1px solid rgba(212,67,124,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <CheckCircle size={13} color="#D4437C" />
                </div>
                <span style={{ fontSize: 14, color: "rgba(254,250,248,0.7)", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial quote */}
        <div style={{
          position: "relative",
          zIndex: 1,
          padding: "24px",
          borderRadius: 20,
          background: "rgba(254,250,248,0.04)",
          border: "1px solid rgba(212,67,124,0.15)",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={13} color="#C8A97A" fill="#C8A97A" />)}
          </div>
          <p style={{
            fontSize: 13,
            color: "rgba(254,250,248,0.65)",
            lineHeight: 1.75,
            fontStyle: "italic",
            marginBottom: 16,
          }}>
            &ldquo;Em 3 meses aprendi tudo sobre gel e hoje atendo 40+ clientes. A melhor decisão da minha carreira.&rdquo;
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #D4437C, #8B1A42)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "white",
              fontSize: 13,
              flexShrink: 0,
            }}>
              M
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FEFAF8" }}>Mariana S.</div>
              <div style={{ fontSize: 11, color: "rgba(254,250,248,0.35)" }}>Nail Designer Profissional</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
        background: "#FEFAF8",
        position: "relative",
      }}>
        {/* Back link */}
        <div style={{ position: "absolute", top: 32, left: 32 }}>
          <Link href="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#7A5A68",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
            padding: "8px 14px",
            borderRadius: 100,
            border: "1px solid #EDCFDE",
            background: "white",
            transition: "all 0.2s",
          }}>
            <ArrowLeft size={14} />
            Voltar ao início
          </Link>
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Logo mark (visible on mobile) */}
          <div className="login-logo-mobile" style={{
            display: "none",
            justifyContent: "center",
            marginBottom: 40,
          }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: "linear-gradient(140deg, #E05890 0%, #D4437C 50%, #8B1A42 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(212,67,124,.35)",
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M6 3L2 9l10 12L22 9l-4-6H6z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
                  <path d="M2 9h20M6 3l3 6M18 3l-3 6M12 21L9 9M12 21l3-12" stroke="rgba(255,255,255,.65)" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em", color: "#1A0A12" }}>
                Nail<span style={{ color: "#D4437C" }}>Class</span>
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              color: "#0F0A0D",
              marginBottom: 10,
              lineHeight: 1.1,
            }}>
              Acesse sua conta
            </h1>
            <p style={{ fontSize: 14, color: "#7A5A68", lineHeight: 1.6 }}>
              Entre com suas credenciais para continuar aprendendo.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F0A0D",
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: emailFocused ? "1.5px solid #D4437C" : "1.5px solid #EDCFDE",
                  background: emailFocused ? "white" : "#FEFAF8",
                  color: "#0F0A0D",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                  boxShadow: emailFocused ? "0 0 0 3px rgba(212,67,124,0.12)" : "none",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 32 }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F0A0D",
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 48px 13px 16px",
                    borderRadius: 12,
                    border: passwordFocused ? "1.5px solid #D4437C" : "1.5px solid #EDCFDE",
                    background: passwordFocused ? "white" : "#FEFAF8",
                    color: "#0F0A0D",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                    boxShadow: passwordFocused ? "0 0 0 3px rgba(212,67,124,0.12)" : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#7A5A68",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                    borderRadius: 6,
                    transition: "color 0.2s",
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 100,
                border: "none",
                background: loading
                  ? "rgba(212,67,124,0.5)"
                  : "linear-gradient(135deg, #D4437C 0%, #8B1A42 100%)",
                backgroundSize: "200% auto",
                color: "white",
                fontSize: 15,
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: loading ? "none" : "0 8px 28px rgba(212,67,124,0.4)",
                transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
                fontFamily: "inherit",
                letterSpacing: "-0.02em",
                animation: loading ? "none" : "shimmer 3s linear infinite",
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 36px rgba(212,67,124,0.5)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(212,67,124,0.4)";
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Entrando...
                </>
              ) : (
                "Entrar na plataforma"
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#EDCFDE" }} />
            <span style={{ fontSize: 12, color: "#7A5A68", fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "#EDCFDE" }} />
          </div>

          {/* Bottom link */}
          <p style={{ textAlign: "center", fontSize: 13, color: "#7A5A68" }}>
            Ainda não tem conta?{" "}
            <Link href="/login" style={{
              color: "#D4437C",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}>
              Fale conosco
            </Link>
          </p>

          {/* Footer note */}
          <p style={{ textAlign: "center", marginTop: 40, fontSize: 12, color: "rgba(122,90,104,0.5)" }}>
            © {new Date().getFullYear()} NailClass · Todos os direitos reservados
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-logo-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
