"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import { coursesApi } from "@/lib/api/courses";
import type { User, Course } from "@/types";
import { PRICING_TYPE_SHORT } from "@/types";
import {
  ArrowLeft, BookOpen, CheckCircle, Loader2, Plus, Trash2,
  UserCheck, UserX, TrendingUp, Award, Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

/* ── Design tokens ─────────────────────────────────── */
const S = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  green: "#16a34a",
  greenBg: "rgba(22,163,74,0.08)",
  red: "#dc2626",
  redBg: "rgba(220,38,38,0.08)",
  yellow: "#ca8a04",
  yellowBg: "rgba(202,138,4,0.08)",
};

/* ── Types ─────────────────────────────────────────── */
interface Enrollment {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseThumbnailUrl: string | null;
  enrolledAt: string;
  source: "Purchase" | "Free" | "Admin";
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

/* ── Small components ──────────────────────────────── */
function SourceBadge({ source }: { source: string }) {
  const cfg = {
    Purchase: { bg: "rgba(212,67,124,0.1)", color: S.rose, label: "Compra" },
    Free:     { bg: S.greenBg,              color: S.green, label: "Gratuito" },
    Admin:    { bg: S.yellowBg,             color: S.yellow, label: "Admin" },
  }[source] ?? { bg: S.bg, color: S.muted, label: source };

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 6, borderRadius: 99, background: S.border, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 99, width: `${Math.min(100, value)}%`,
        background: value >= 100
          ? S.green
          : `linear-gradient(90deg, ${S.rose}, ${S.roseDark})`,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

/* ── Main page ─────────────────────────────────────── */
export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();

  const [user, setUser]               = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allCourses, setAllCourses]   = useState<Course[]>([]);
  const [loading, setLoading]         = useState(true);

  // Add enrollment modal
  const [addOpen, setAddOpen]         = useState(false);
  const [addCourseId, setAddCourseId] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [adding, setAdding]           = useState(false);

  // Remove confirmation
  const [removing, setRemoving]       = useState<string | null>(null); // courseId being removed

  const load = useCallback(async () => {
    try {
      const [u, e] = await Promise.all([
        adminApi.getUser(userId),
        adminApi.getEnrollments(userId),
      ]);
      setUser(u);
      setEnrollments(e as Enrollment[]);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Load courses once when opening the add modal
  useEffect(() => {
    if (addOpen && allCourses.length === 0) {
      coursesApi.getAll({ pageSize: 100 })
        .then((r) => setAllCourses(r.data))
        .catch(() => {});
    }
  }, [addOpen, allCourses.length]);

  // Courses not yet enrolled
  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const available   = allCourses.filter((c) => !enrolledIds.has(c.id));

  const handleAdd = async () => {
    if (!addCourseId) return;
    setAdding(true);
    try {
      await adminApi.addEnrollment(userId, addCourseId);
      toast.success("Aluna matriculada com sucesso!");
      setAddOpen(false);
      setAddCourseId("");
      setCourseSearch("");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erro ao matricular");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Remover "${courseTitle}" desta aluna? O acesso será revogado imediatamente.`)) return;
    setRemoving(courseId);
    try {
      await adminApi.removeEnrollment(userId, courseId);
      toast.success("Matrícula removida");
      setEnrollments((prev) => prev.filter((e) => e.courseId !== courseId));
    } catch {
      toast.error("Erro ao remover matrícula");
    } finally {
      setRemoving(null);
    }
  };

  /* ── Stats ─────────────────────────────────────────── */
  const totalCompleted   = enrollments.filter((e) => e.progressPercent >= 100).length;
  const avgProgress      = enrollments.length
    ? Math.round(enrollments.reduce((acc, e) => acc + e.progressPercent, 0) / enrollments.length)
    : 0;

  /* ── Loading ────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Loader2 size={28} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "4px 0 40px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href="/admin/users" style={{ textDecoration: "none" }}>
          <button style={{
            width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${S.border}`,
            background: S.white, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <ArrowLeft size={16} color={S.ink} />
          </button>
        </Link>

        {/* Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 800, fontSize: 17,
          boxShadow: "0 4px 12px rgba(212,67,124,0.3)",
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: S.ink, letterSpacing: "-0.03em" }}>
            {user.firstName} {user.lastName}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: S.muted }}>{user.email}</p>
        </div>

        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {user.isActive
            ? <><UserCheck size={14} color={S.green} /><span style={{ fontSize: 12, fontWeight: 700, color: S.green }}>Ativa</span></>
            : <><UserX size={14} color={S.red} /><span style={{ fontSize: 12, fontWeight: 700, color: S.red }}>Inativa</span></>
          }
        </div>
      </div>

      {/* ── Info + stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { icon: <BookOpen size={16} color={S.rose} />, label: "Cursos", value: enrollments.length },
          { icon: <Award size={16} color={S.green} />, label: "Concluídos", value: totalCompleted },
          { icon: <TrendingUp size={16} color={S.rose} />, label: "Progresso médio", value: `${avgProgress}%` },
          { icon: <Clock size={16} color={S.muted} />, label: "Desde", value: new Date(user.createdAt).toLocaleDateString("pt-BR") },
        ].map((s) => (
          <div key={s.label} style={{
            background: S.white, border: `1.5px solid ${S.border}`, borderRadius: 12,
            padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              {s.icon}
              <span style={{ fontSize: 11, fontWeight: 600, color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: S.ink }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Enrollments section ── */}
      <div style={{
        background: S.white, border: `1.5px solid ${S.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px", borderBottom: `1px solid ${S.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={16} color={S.rose} />
            <span style={{ fontWeight: 700, fontSize: 15, color: S.ink }}>Cursos matriculados</span>
            {enrollments.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                background: "rgba(212,67,124,0.1)", color: S.rose,
              }}>
                {enrollments.length}
              </span>
            )}
          </div>

          <button
            onClick={() => setAddOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 9, border: "none",
              background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
              color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 3px 10px rgba(212,67,124,0.25)", fontFamily: "inherit",
            }}
          >
            <Plus size={14} /> Adicionar curso
          </button>
        </div>

        {/* List */}
        {enrollments.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <BookOpen size={40} color={S.border} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14, color: S.muted }}>Nenhum curso matriculado.</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: S.muted }}>
              Clique em "Adicionar curso" para matricular esta aluna.
            </p>
          </div>
        ) : (
          enrollments.map((e, idx) => (
            <div
              key={e.enrollmentId}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 20px",
                borderTop: idx > 0 ? `1px solid ${S.border}` : "none",
              }}
            >
              {/* Thumbnail or placeholder */}
              <div style={{
                width: 52, height: 38, borderRadius: 8, flexShrink: 0, overflow: "hidden",
                background: `linear-gradient(135deg, ${S.rose}22, ${S.roseDark}11)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {e.courseThumbnailUrl
                  ? <img src={e.courseThumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <BookOpen size={16} color={`${S.rose}55`} />
                }
              </div>

              {/* Course info + progress */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <Link href={`/admin/courses/${e.courseId}`} style={{ textDecoration: "none" }}>
                    <span style={{
                      fontWeight: 600, fontSize: 14, color: S.ink,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      maxWidth: 260, display: "block",
                    }}>
                      {e.courseTitle}
                    </span>
                  </Link>
                  <SourceBadge source={e.source} />
                  {e.progressPercent >= 100 && (
                    <CheckCircle size={13} color={S.green} />
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, maxWidth: 240 }}>
                    <ProgressBar value={e.progressPercent} />
                  </div>
                  <span style={{ fontSize: 12, color: S.muted, whiteSpace: "nowrap" }}>
                    {e.completedLessons}/{e.totalLessons} aulas · {Math.round(e.progressPercent)}%
                  </span>
                </div>

                {/* Subscription info if relevant */}
                {e.subscriptionStatus !== "None" && (
                  <div style={{ marginTop: 4, fontSize: 11, color: S.muted }}>
                    {e.subscriptionStatus === "Active" && <span style={{ color: S.green }}>● Assinatura ativa</span>}
                    {e.subscriptionStatus === "PastDue" && <span style={{ color: S.yellow }}>● Pagamento pendente</span>}
                    {e.subscriptionStatus === "Cancelled" && e.currentPeriodEnd && (
                      <span style={{ color: S.muted }}>
                        ● Cancelada · acesso até {new Date(e.currentPeriodEnd).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Enrolled date */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: S.muted }}>
                  {new Date(e.enrolledAt).toLocaleDateString("pt-BR")}
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemove(e.courseId, e.courseTitle)}
                disabled={removing === e.courseId}
                title="Remover matrícula"
                style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  border: `1.5px solid ${S.border}`, background: S.white,
                  cursor: removing === e.courseId ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: removing === e.courseId ? 0.5 : 1,
                }}
              >
                {removing === e.courseId
                  ? <Loader2 size={13} color={S.muted} style={{ animation: "spin 1s linear infinite" }} />
                  : <Trash2 size={13} color={S.red} />
                }
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Add enrollment modal ── */}
      {addOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => { setAddOpen(false); setAddCourseId(""); setCourseSearch(""); }}
            style={{
              position: "fixed", inset: 0, background: "rgba(26,10,18,0.45)",
              zIndex: 50, backdropFilter: "blur(4px)",
            }}
          />

          {/* Modal */}
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            background: S.white, borderRadius: 16, padding: 28,
            width: "min(500px, 94vw)", zIndex: 51,
            boxShadow: "0 24px 64px rgba(26,10,18,0.25)",
          }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: S.ink }}>
              Dar acesso a um curso
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: S.muted }}>
              Aluna: <strong style={{ color: S.ink }}>{user.firstName} {user.lastName}</strong>
            </p>

            {/* Info banner */}
            <div style={{
              display: "flex", gap: 8, alignItems: "flex-start",
              padding: "10px 13px", borderRadius: 9, marginBottom: 16,
              background: S.yellowBg, border: `1px solid ${S.yellow}44`,
            }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>🎁</span>
              <p style={{ margin: 0, fontSize: 12, color: S.yellow, fontWeight: 600, lineHeight: 1.5 }}>
                Cursos pagos podem ser cedidos gratuitamente pelo admin. Nenhuma cobrança é feita — o acesso é liberado diretamente, sem passar pelo Stripe.
              </p>
            </div>

            {/* Search */}
            {available.length > 4 && (
              <input
                type="text"
                placeholder="Filtrar cursos..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box", marginBottom: 10,
                  padding: "8px 12px", border: `1.5px solid ${S.border}`,
                  borderRadius: 9, fontSize: 13, color: S.ink,
                  background: S.bg, outline: "none", fontFamily: "inherit",
                }}
              />
            )}

            {available.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: S.muted, fontSize: 14 }}>
                {allCourses.length === 0
                  ? "Carregando cursos..."
                  : "Esta aluna já está matriculada em todos os cursos."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, maxHeight: 340, overflowY: "auto" }}>
                {available
                  .filter((c) => !courseSearch || c.title.toLowerCase().includes(courseSearch.toLowerCase()))
                  .map((c) => {
                    const selected = addCourseId === c.id;
                    const isPaid = !!(c.isForSale && c.price && c.price > 0);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setAddCourseId(c.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "11px 13px", borderRadius: 10, textAlign: "left",
                          border: `2px solid ${selected ? S.rose : S.border}`,
                          background: selected ? "rgba(212,67,124,0.06)" : S.white,
                          cursor: "pointer", fontFamily: "inherit",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{
                          width: 46, height: 34, borderRadius: 7, flexShrink: 0, overflow: "hidden",
                          background: `linear-gradient(135deg, ${S.rose}22, ${S.roseDark}11)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {c.thumbnailUrl
                            ? <img src={c.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <BookOpen size={14} color={`${S.rose}55`} />
                          }
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: S.ink, marginBottom: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
                              {c.title}
                            </span>
                            {isPaid && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "1px 6px",
                                borderRadius: 99, background: "rgba(212,67,124,0.1)",
                                color: S.rose, flexShrink: 0,
                              }}>
                                PAGO
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: S.muted, display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{c.totalLessons} aula{c.totalLessons !== 1 ? "s" : ""}</span>
                            {isPaid ? (
                              <>
                                <span style={{ color: S.border }}>·</span>
                                <span style={{ textDecoration: "line-through", color: S.muted }}>
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: c.currency || "BRL" }).format(c.price!)}
                                  {PRICING_TYPE_SHORT[c.pricingType ?? "OneTime"]}
                                </span>
                                <span style={{ color: S.green, fontWeight: 700 }}>🎁 Grátis (admin)</span>
                              </>
                            ) : (
                              <><span style={{ color: S.border }}>·</span><span>Gratuito</span></>
                            )}
                          </div>
                        </div>

                        {selected && (
                          <CheckCircle size={16} color={S.rose} style={{ flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setAddOpen(false); setAddCourseId(""); setCourseSearch(""); }}
                style={{
                  padding: "9px 18px", border: `1.5px solid ${S.border}`,
                  borderRadius: 9, background: S.white, color: S.muted,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={!addCourseId || adding}
                style={{
                  padding: "9px 18px", border: "none",
                  borderRadius: 9,
                  background: !addCourseId || adding ? "#d0bbc5" : `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                  color: "white", fontSize: 14, fontWeight: 700,
                  cursor: !addCourseId || adding ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {adding
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Matriculando...</>
                  : <><Plus size={14} /> Matricular</>
                }
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
