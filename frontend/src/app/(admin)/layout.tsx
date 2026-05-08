"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import { useEffect, useState } from "react";
import {
  BookOpen, LayoutDashboard, Users, Radio, Settings,
  LogOut, Home, Menu, X, ChevronRight, Tag, Award
} from "lucide-react";

const LogoIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 3L2 9l10 12L22 9l-4-6H6z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.18)"/>
    <path d="M2 9h20M6 3l3 6M18 3l-3 6M12 21L9 9M12 21l3-12" stroke="rgba(255,255,255,.65)" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
import { toast } from "sonner";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Cursos", icon: BookOpen },
  { href: "/admin/users", label: "Alunas", icon: Users },
  { href: "/admin/coupons", label: "Cupons", icon: Tag },
  { href: "/admin/certificates", label: "Certificados", icon: Award },
  { href: "/admin/live", label: "Lives", icon: Radio },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "Admin") router.push("/dashboard");
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    try { await authApi.revoke(); } catch {}
    logout();
    router.push("/login");
    toast.success("Até logo! 👋");
  };

  if (!user || user.role !== "Admin") return null;

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#0F0A0D",
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: "1px solid rgba(254,250,248,0.06)",
      }}>
        <Link
          href="/admin"
          onClick={onClose}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "linear-gradient(135deg, #D4437C, #8B1A42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(212,67,124,0.45)",
          }}>
            <LogoIcon size={17} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.04em", color: "#FEFAF8" }}>
            Nail<span style={{ color: "#D4437C" }}>✦</span>Class
          </span>
        </Link>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(254,250,248,0.2)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginTop: 8,
          paddingLeft: 2,
        }}>
          Painel Administrativo
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(254,250,248,0.2)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "4px 10px 14px",
        }}>
          MENU
        </div>

        {sidebarItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderRadius: 12,
                marginBottom: 3,
                textDecoration: "none",
                background: isActive ? "rgba(212,67,124,0.1)" : "transparent",
                borderLeft: isActive ? "3px solid #D4437C" : "3px solid transparent",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(254,250,248,0.04)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: isActive ? "rgba(212,67,124,0.15)" : "rgba(254,250,248,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.18s",
                }}>
                  <Icon size={15} color={isActive ? "#D4437C" : "rgba(254,250,248,0.4)"} />
                </div>
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "#FEFAF8" : "rgba(254,250,248,0.5)",
                  letterSpacing: "-0.01em",
                  transition: "color 0.18s",
                }}>
                  {label}
                </span>
              </div>
              {isActive && (
                <ChevronRight size={14} color="#D4437C" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(254,250,248,0.06)" }}>
        {/* Área da Aluna link */}
        <Link
          href="/dashboard"
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 12,
            textDecoration: "none",
            color: "rgba(254,250,248,0.35)",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 8,
            transition: "all 0.18s",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(254,250,248,0.04)";
            (e.currentTarget as HTMLElement).style.color = "rgba(254,250,248,0.65)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(254,250,248,0.35)";
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(254,250,248,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Home size={13} color="rgba(254,250,248,0.35)" />
          </div>
          Área da Aluna
        </Link>

        {/* User card */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 14,
          background: "rgba(254,250,248,0.04)",
          border: "1px solid rgba(254,250,248,0.06)",
          marginBottom: 8,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #D4437C, #8B1A42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: "white",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(212,67,124,0.3)",
          }}>
            {initials}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#FEFAF8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "-0.02em",
            }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{
              fontSize: 11,
              color: "rgba(254,250,248,0.3)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 2,
            }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Logout button */}
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
            color: "rgba(255,80,110,0.65)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "all 0.18s",
            textAlign: "left",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(212,67,124,0.1)";
            (e.currentTarget as HTMLElement).style.color = "#ff6080";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "none";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,80,110,0.65)";
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(212,67,124,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <LogOut size={13} />
          </div>
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FEFAF8",
      display: "flex",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>

      {/* ── Desktop Sidebar (fixed 250px) ── */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          width: 250,
          flexShrink: 0,
          background: "#0F0A0D",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          overflowY: "auto",
          zIndex: 40,
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,10,13,0.6)",
              zIndex: 45,
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Slide-in sidebar */}
          <aside style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            width: 250,
            background: "#0F0A0D",
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
            overflowY: "auto",
            animation: "slideInLeft 0.22s ease",
          }}>
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(254,250,248,0.06)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <X size={15} color="rgba(254,250,248,0.5)" />
            </button>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Main content area ── */}
      <div
        className="admin-main-content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* Mobile top header */}
        <header
          className="admin-mobile-header"
          style={{
            background: "white",
            borderBottom: "1px solid #EDCFDE",
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "none",
          }}
        >
          <div style={{
            padding: "0 20px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "linear-gradient(135deg, #D4437C, #8B1A42)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(212,67,124,0.3)",
              }}>
                <LogoIcon size={14} />
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.04em", color: "#0F0A0D" }}>
                Nail<span style={{ color: "#D4437C" }}>✦</span>Class
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu size={22} color="#0F0A0D" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "32px" }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (min-width: 768px) {
          .admin-main-content { margin-left: 250px; }
        }
        @media (max-width: 767px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-header { display: block !important; }
          .admin-main-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
