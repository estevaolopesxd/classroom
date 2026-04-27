"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import type { User } from "@/types";
import { Plus, Search, Users, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  green: "#16a34a",
  overlay: "rgba(26,10,18,0.45)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${S.border}`, background: S.white,
  fontSize: 14, color: S.ink, outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: S.ink, display: "block", marginBottom: 6,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", role: "Student" });
  const [creating, setCreating] = useState(false);

  const load = () => {
    adminApi.getUsers().then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createUser = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) return;
    setCreating(true);
    try {
      await adminApi.createUser(form);
      toast.success("Usuário criado com sucesso");
      setModal(false);
      setForm({ email: "", password: "", firstName: "", lastName: "", role: "Student" });
      load();
    } catch {
      toast.error("Erro ao criar usuário");
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const disabled = creating || !form.email || !form.password || !form.firstName || !form.lastName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.ink, margin: 0, letterSpacing: "-0.03em" }}>Usuários</h1>
          <p style={{ fontSize: 14, color: S.muted, margin: "4px 0 0" }}>{users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
            color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(212,67,124,0.35)", fontFamily: "inherit",
          }}
        >
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 380 }}>
        <Search size={16} color={S.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 38 }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
          <Loader2 size={28} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(user => (
            <Link key={user.id} href={`/admin/users/${user.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", background: S.white,
                borderRadius: 12, border: `1px solid ${S.border}`,
                transition: "border-color 0.15s, box-shadow 0.15s", cursor: "pointer",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = S.rose + "55";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(212,67,124,0.08)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = S.border;
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(212,67,124,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: S.rose,
                }}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: S.ink, margin: 0 }}>{user.fullName}</p>
                  <p style={{ fontSize: 12, color: S.muted, margin: "2px 0 0" }}>{user.email}</p>
                </div>

                {/* Badges + arrow */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
                    background: user.role === "Admin" ? "rgba(212,67,124,0.1)" : "rgba(0,0,0,0.06)",
                    color: user.role === "Admin" ? S.rose : S.muted,
                  }}>
                    {user.role === "Admin" ? "Admin" : "Aluno"}
                  </span>
                  {!user.isActive && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
                      background: "rgba(239,68,68,0.1)", color: "#ef4444",
                    }}>Inativo</span>
                  )}
                  <ChevronRight size={16} color={S.muted} />
                </div>
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 24px" }}>
              <Users size={40} color={S.border} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: S.muted }}>Nenhum usuário encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create user modal ── */}
      {modal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: S.overlay, display: "flex",
            alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}
        >
          <div style={{
            background: S.white, borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 460,
            boxShadow: "0 20px 60px rgba(26,10,18,0.18)",
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: S.ink, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Novo usuário
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input placeholder="João" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Sobrenome</label>
                  <input placeholder="Silva" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input type="email" placeholder="joao@exemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Senha</label>
                <input type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Papel</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}>
                  <option value="Student">Aluno</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={createUser}
                disabled={disabled}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: disabled ? "#d0bbc5" : `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                  color: "white", fontSize: 14, fontWeight: 700,
                  cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {creating && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                Criar usuário
              </button>
              <button
                onClick={() => setModal(false)}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "10px 18px", borderRadius: 10,
                  border: `1.5px solid ${S.border}`, background: S.white,
                  color: S.ink, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
