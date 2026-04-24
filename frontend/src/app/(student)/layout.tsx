"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import { useEffect, useState } from "react";
import {
  BookOpen, LayoutDashboard, GraduationCap,
  LogOut, Settings, ChevronDown
} from "lucide-react";

const LogoIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 3L2 9l10 12L22 9l-4-6H6z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.18)"/>
    <path d="M2 9h20M6 3l3 6M18 3l-3 6M12 21L9 9M12 21l3-12" stroke="rgba(255,255,255,.65)" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
import { toast } from "sonner";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try { await authApi.revoke(); } catch {}
    logout();
    router.push("/login");
    toast.success("Até logo! 👋");
  };

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "Explorar", icon: BookOpen },
    { href: "/my-courses", label: "Meus Cursos", icon: GraduationCap },
  ];

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FEFAF8",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* ── Sticky Navbar ── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(254,250,248,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid #EDCFDE",
      }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 28px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}>

          {/* Logo */}
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: "linear-gradient(135deg, #D4437C, #8B1A42)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 12px rgba(212,67,124,0.35)",
            }}>
              <LogoIcon size={16} />
            </div>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.04em", color: "#0F0A0D" }}>
              Nail<span style={{ color: "#D4437C" }}>✦</span>Class
            </span>
          </Link>

          {/* Center nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#D4437C" : "#7A5A68",
                  background: active ? "#F9E8F0" : "transparent",
                  position: "relative",
                  transition: "all 0.18s",
                  letterSpacing: "-0.01em",
                }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "#0F0A0D";
                      (e.currentTarget as HTMLElement).style.background = "rgba(212,67,124,0.04)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "#7A5A68";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  <Icon size={15} />
                  {label}
                  {/* Rose underline for active */}
                  {active && (
                    <div style={{
                      position: "absolute",
                      bottom: -1,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "calc(100% - 24px)",
                      height: 2,
                      borderRadius: 2,
                      background: "#D4437C",
                    }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right — avatar + dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 14px 6px 6px",
                borderRadius: 100,
                border: "1.5px solid #EDCFDE",
                background: "white",
                cursor: "pointer",
                transition: "border-color 0.18s, box-shadow 0.18s",
                boxShadow: dropdownOpen ? "0 0 0 3px rgba(212,67,124,0.1)" : "none",
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "white",
                letterSpacing: "0.02em",
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F0A0D", letterSpacing: "-0.01em" }}>
                {user.firstName}
              </span>
              <ChevronDown
                size={14}
                color="#7A5A68"
                style={{
                  transition: "transform 0.2s",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setDropdownOpen(false)}
                />
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  zIndex: 50,
                  background: "white",
                  border: "1px solid #EDCFDE",
                  borderRadius: 18,
                  padding: "8px",
                  boxShadow: "0 8px 30px rgba(212,67,124,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  minWidth: 220,
                  animation: "dropdownIn 0.15s ease",
                }}>
                  {/* User info */}
                  <div style={{
                    padding: "10px 14px 14px",
                    borderBottom: "1px solid #EDCFDE",
                    marginBottom: 6,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "white",
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F0A0D", letterSpacing: "-0.02em" }}>
                          {user.firstName} {user.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: "#7A5A68", marginTop: 2 }}>{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Admin link */}
                  {user.role === "Admin" && (
                    <button
                      onClick={() => { router.push("/admin"); setDropdownOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0F0A0D",
                        fontFamily: "inherit",
                        transition: "background 0.15s",
                        textAlign: "left",
                        letterSpacing: "-0.01em",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F9E8F0")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Settings size={13} color="white" />
                      </div>
                      Área Admin
                    </button>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#e03060",
                      fontFamily: "inherit",
                      transition: "background 0.15s",
                      textAlign: "left",
                      letterSpacing: "-0.01em",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fff0f3")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "rgba(224,48,96,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <LogOut size={13} color="#e03060" />
                    </div>
                    Sair da conta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 700px) {
          nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
