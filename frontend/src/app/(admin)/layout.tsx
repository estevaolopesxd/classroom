"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import { useEffect, useState } from "react";
import {
  BookOpen, LayoutDashboard, Users, Radio, Settings,
  LogOut, Gem, Home, ChevronRight, Menu, X
} from "lucide-react";
import { toast } from "sonner";

const C = {
  rose: "#c9476e",
  roseDark: "#a8375a",
  roseLight: "#f7d6e3",
  blush: "#fdf0f5",
  cream: "#fffaf8",
  black: "#1a1014",
  charcoal: "#3d2535",
  muted: "#8a6070",
  border: "#f0d5e2",
  white: "#ffffff",
  sidebarBg: "#1a1014",
  sidebarBorder: "rgba(255,255,255,0.06)",
};

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Cursos", icon: BookOpen },
  { href: "/admin/users", label: "Alunas", icon: Users },
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

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.sidebarBorder}` }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${C.rose}50`,
          }}>
            <Gem size={17} color="white" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "white" }}>Nail</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: C.rose }}>Class</span>
          </div>
        </Link>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, paddingLeft: 2, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
          Administração
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, padding: "4px 10px 10px" }}>
          Menu principal
        </div>
        {sidebarItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 12px", borderRadius: 10, marginBottom: 2, textDecoration: "none",
              background: isActive ? `${C.rose}20` : "transparent",
              border: isActive ? `1px solid ${C.rose}30` : "1px solid transparent",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon size={16} color={isActive ? C.rose : "rgba(255,255,255,0.5)"} />
                <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? "white" : "rgba(255,255,255,0.6)" }}>
                  {label}
                </span>
              </div>
              {isActive && <ChevronRight size={14} color={C.rose} />}
            </Link>
          );
        })}
      </nav>

      {/* User / bottom */}
      <div style={{ padding: "12px", borderTop: `1px solid ${C.sidebarBorder}` }}>
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 10, textDecoration: "none",
          color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 4,
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
        >
          <Home size={15} />
          Área da Aluna
        </Link>

        {/* User info */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${C.sidebarBorder}`,
          marginBottom: 6,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.rose}, #e8729a)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
          }}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </div>
          </div>
        </div>

        <button onClick={handleLogout} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 10, border: "none",
          background: "none", cursor: "pointer",
          color: "rgba(255,100,120,0.7)", fontSize: 13, fontWeight: 500,
          fontFamily: "inherit", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,71,110,0.1)"; e.currentTarget.style.color = "#ff8090"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,100,120,0.7)"; }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex" }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: C.sidebarBg,
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, bottom: 0, left: 0,
        overflowY: "auto",
        zIndex: 40,
      }} className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 45 }} onClick={() => setMobileOpen(false)} />
          <aside style={{
            position: "fixed", top: 0, bottom: 0, left: 0, width: 240,
            background: C.sidebarBg, display: "flex", flexDirection: "column",
            zIndex: 50, overflowY: "auto",
          }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }} className="admin-content">
        {/* Mobile topbar */}
        <header style={{
          background: "white", borderBottom: `1px solid ${C.border}`,
          position: "sticky", top: 0, zIndex: 30,
          display: "none",
        }} className="mobile-header">
          <div style={{ padding: "0 16px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.rose}, #e8729a)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gem size={14} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, color: C.black }}>Nail<span style={{ color: C.rose }}>Class</span></span>
            </Link>
            <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Menu size={22} color={C.black} />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px 28px" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .admin-content { margin-left: 240px; }
        }
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: block !important; }
          .admin-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
