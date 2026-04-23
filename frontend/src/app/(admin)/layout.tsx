"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { authApi } from "@/lib/api/auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  BookOpen, LayoutDashboard, Users, Radio, Settings,
  LogOut, ChevronDown, GraduationCap, Home
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Cursos", icon: BookOpen },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/live", label: "Lives", icon: Radio },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "Admin") { router.push("/dashboard"); }
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    try { await authApi.revoke(); } catch {}
    logout();
    router.push("/login");
    toast.success("Você saiu da plataforma");
  };

  if (!user || user.role !== "Admin") return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border/40 flex-col bg-card/20 fixed inset-y-0">
        <div className="p-4 border-b border-border/40">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="size-4 text-primary" />
            </div>
            Classroom
          </Link>
          <div className="text-xs text-muted-foreground mt-1 ml-10">Administração</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                )}>
                  <Icon className="size-4" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/40 space-y-1">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors">
              <Home className="size-4" />
              Área do aluno
            </div>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="px-4 h-16 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2 font-bold">
              <BookOpen className="size-5 text-primary" />
              Admin
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 hover:bg-accent hover:text-accent-foreground transition-colors">
                Menu
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sidebarItems.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} onClick={() => router.push(href)}>
                    <Icon className="size-4 mr-2" />
                    {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="size-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
