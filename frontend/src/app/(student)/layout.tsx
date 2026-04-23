"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import { useEffect, useState } from "react";
import { BookOpen, LayoutDashboard, GraduationCap, LogOut, Settings, ChevronDown, Gem, Menu, X } from "lucide-react";
import { toast } from "sonner";

const C = {
  rose: "#c9476e",
  roseLight: "#f7d6e3",
  blush: "#fdf0f5",
  cream: "#fffaf8",
  black: "#1a1014",
  muted: "#8a6070",
  border: "#f0d5e2",
  white: "#ffffff",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
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
    { href: "/courses", label: "Explorar Cursos", icon: BookOpen },
    { href: "/my-courses", label: "Meus Cursos", icon: GraduationCap },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,250,248,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          {/* Logo */}
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 3px 10px ${C.rose}35`,
            }}>
              <Gem size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: C.black, letterSpacing: "-0.02em" }}>
              Nail<span style={{ color: C.rose }}>Class</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 9, textDecoration: "none",
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  background: active ? C.blush : "transparent",
                  color: active ? C.rose : C.muted,
                  border: active ? `1px solid ${C.border}` : "1px solid transparent",
                  transition: "all 0.15s",
                }}>
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 12px 6px 6px", borderRadius: 10,
                border: `1.5px solid ${C.border}`,
                background: "white", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "white",
              }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.black }}>{user.firstName}</span>
              <ChevronDown size={14} color={C.muted} />
            </button>

            {dropdownOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setDropdownOpen(false)} />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
                  background: "white", border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: "6px",
                  boxShadow: `0 8px 30px ${C.rose}15`,
                  minWidth: 200,
                }}>
                  <div style={{ padding: "8px 12px 10px", borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.black }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{user.email}</div>
                  </div>
                  {user.role === "Admin" && (
                    <button onClick={() => { router.push("/admin"); setDropdownOpen(false); }} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 12px", borderRadius: 8, border: "none",
                      background: "none", cursor: "pointer", fontSize: 13, color: C.black, fontWeight: 500,
                      transition: "background 0.15s", fontFamily: "inherit",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.blush)}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <Settings size={15} color={C.rose} />
                      Administração
                    </button>
                  )}
                  <button onClick={handleLogout} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 12px", borderRadius: 8, border: "none",
                    background: "none", cursor: "pointer", fontSize: 13, color: "#e03060", fontWeight: 500,
                    fontFamily: "inherit",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fff0f3")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu btn */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", display: "none", padding: 4 }} className="mobile-menu-btn">
            {menuOpen ? <X size={22} color={C.black} /> : <Menu size={22} color={C.black} />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div style={{ borderTop: `1px solid ${C.border}`, background: "white", padding: "12px 16px 16px" }}>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                color: pathname === href ? C.rose : C.black,
                background: pathname === href ? C.blush : "transparent",
                fontSize: 14, fontWeight: 500, marginBottom: 4,
              }}>
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <style>{`@media (max-width: 767px) { .mobile-menu-btn { display: block !important; } nav { display: none !important; } }`}</style>
    </div>
  );
}
