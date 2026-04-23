"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import { Gem, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const C = {
    rose: "#c9476e",
    roseLight: "#f7d6e3",
    blush: "#fdf0f5",
    cream: "#fffaf8",
    black: "#1a1014",
    muted: "#8a6070",
    border: "#f0d5e2",
    inputBorder: "#e8c8d8",
  };

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
      background: C.cream,
      display: "flex",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Left panel — decorative */}
      <div style={{
        display: "none",
        flex: "0 0 45%",
        background: `linear-gradient(145deg, ${C.rose}, #e0567a, #d4386a)`,
        position: "relative",
        overflow: "hidden",
      }} className="md-show">
        {/* decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: 80, left: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", top: "40%", right: 40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

        <div style={{ position: "relative", zIndex: 1, padding: 48, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gem size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>NailClass</span>
          </Link>

          <div>
            <div style={{ fontSize: 56, marginBottom: 24 }}>💅</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "white", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>
              Transforme sua<br />paixão em carreira
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.7, maxWidth: 320 }}>
              Aprenda nail art, gel e muito mais com as melhores professoras do Brasil. Do seu jeito, no seu tempo.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Mais de 50 cursos disponíveis",
              "+2.400 alunas já transformaram suas vidas",
              "Certificado de conclusão incluso",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles size={11} color="white" />
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Logo (mobile) */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", justifyContent: "center", marginBottom: 36 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 14px ${C.rose}40`,
            }}>
              <Gem size={20} color="white" />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 20, color: C.black }}>Nail</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: C.rose }}>Class</span>
            </div>
          </Link>

          {/* Card */}
          <div style={{
            background: "white",
            borderRadius: 24,
            border: `1px solid ${C.border}`,
            padding: "36px 32px",
            boxShadow: `0 8px 40px ${C.rose}12`,
          }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginBottom: 6 }}>
                Bem-vinda de volta 💕
              </h1>
              <p style={{ color: C.muted, fontSize: 14 }}>
                Entre com suas credenciais para acessar a plataforma
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.black, marginBottom: 7 }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "11px 14px", borderRadius: 10,
                    border: `1.5px solid ${C.inputBorder}`,
                    background: C.blush,
                    color: C.black, fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = C.rose; e.target.style.background = "white"; }}
                  onBlur={(e) => { e.target.style.borderColor = C.inputBorder; e.target.style.background = C.blush; }}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.black, marginBottom: 7 }}>
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
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "11px 42px 11px 14px", borderRadius: 10,
                      border: `1.5px solid ${C.inputBorder}`,
                      background: C.blush,
                      color: C.black, fontSize: 14,
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = C.rose; e.target.style.background = "white"; }}
                    onBlur={(e) => { e.target.style.borderColor = C.inputBorder; e.target.style.background = C.blush; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2,
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  borderRadius: 12, border: "none",
                  background: loading ? `${C.rose}80` : `linear-gradient(135deg, ${C.rose}, #e8729a)`,
                  color: "white", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : `0 6px 20px ${C.rose}40`,
                  transition: "opacity 0.2s",
                  fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
                    Entrando...
                  </>
                ) : (
                  "Entrar na plataforma"
                )}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <span style={{ fontSize: 13, color: C.muted }}>Não tem conta? </span>
              <Link href="/login" style={{ fontSize: 13, color: C.rose, fontWeight: 600, textDecoration: "none" }}>
                Fale conosco
              </Link>
            </div>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: C.muted }}>
            © {new Date().getFullYear()} NailClass · Todos os direitos reservados
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) { .md-show { display: flex !important; } }
      `}</style>
    </div>
  );
}
