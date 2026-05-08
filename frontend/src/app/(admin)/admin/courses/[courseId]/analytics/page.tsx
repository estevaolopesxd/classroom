"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  ArrowLeft, Users, CheckCircle, Clock, XCircle,
  TrendingUp, BarChart2, DollarSign, ShoppingCart,
  RefreshCw, Repeat, Search, ChevronUp, ChevronDown
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PerLesson {
  lessonId: string;
  title: string;
  moduleTitle: string;
  completedCount: number;
  completionRate: number;
}

interface EnrollmentByDay {
  date: string;
  count: number;
}

interface Student {
  userId: string;
  name: string;
  email: string;
  source: string;
  subscriptionStatus: string;
  enrolledAt: string;
  lastActivity: string | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

interface Analytics {
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  isForSale: boolean;
  price: number;
  currency: string;
  pricingType: string;
  // Overview
  totalEnrolled: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  completionRate: number;
  avgProgress: number;
  // Revenue
  totalRevenue: number;
  completedPurchases: number;
  pendingAbandoned: number;
  refundedCount: number;
  activeSubscriptions: number;
  checkoutConvRate: number;
  // Breakdown
  bySource: { purchase: number; free: number; admin: number };
  perLesson: PerLesson[];
  enrollmentsByDay: EnrollmentByDay[];
  students: Student[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const fmtCurrency = (val: number, currency: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(val);

const SOURCE_LABELS: Record<string, string> = {
  Purchase: "Compra",
  Free: "Grátis",
  Admin: "Admin",
};

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  Purchase: { bg: "#1A3A2A", text: "#4ADE80" },
  Free:     { bg: "#1A2D3A", text: "#60A5FA" },
  Admin:    { bg: "#2D1A2A", text: "#E879F9" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active:    { bg: "#1A3A2A", text: "#4ADE80" },
  PastDue:   { bg: "#3A2A1A", text: "#FBBF24" },
  Cancelled: { bg: "#3A1A1A", text: "#F87171" },
  None:      { bg: "#1A1A1A", text: "#6B7280" },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, color, bg,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div style={{
      background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14,
      padding: "20px 22px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "#9F6A80", fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#FAF0F5", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9F6A80", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, color = "#C4267A" }: { value: number; color?: string }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: "#3D1A2A", overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${Math.min(100, value)}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const c = SOURCE_COLORS[source] || { bg: "#1A1A1A", text: "#6B7280" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 10,
      fontWeight: 700, background: c.bg, color: c.text, letterSpacing: "0.05em",
    }}>
      {SOURCE_LABELS[source] || source}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (!status || status === "None") return null;
  const c = STATUS_COLORS[status] || { bg: "#1A1A1A", text: "#6B7280" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 10,
      fontWeight: 700, background: c.bg, color: c.text,
    }}>
      {status}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type SortKey = "name" | "progressPercent" | "enrolledAt" | "lastActivity";
type SortDir = "asc" | "desc";

export default function CourseAnalyticsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("progressPercent");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    adminApi.getCourseAnalytics(courseId)
      .then((data) => setAnalytics(data as Analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const filteredStudents = useMemo(() => {
    if (!analytics) return [];
    const q = studentSearch.toLowerCase();
    return analytics.students
      .filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .sort((a, b) => {
        const getRaw = (s: Student) => {
          if (sortKey === "name") return s.name;
          if (sortKey === "progressPercent") return s.progressPercent;
          if (sortKey === "enrolledAt") return s.enrolledAt ? new Date(s.enrolledAt).getTime() : 0;
          if (sortKey === "lastActivity") return s.lastActivity ? new Date(s.lastActivity).getTime() : 0;
          return 0;
        };
        const av = getRaw(a);
        const bv = getRaw(b);
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [analytics, studentSearch, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Bar chart for enrollments over 30 days
  const chartMax = useMemo(() => {
    if (!analytics?.enrollmentsByDay.length) return 1;
    return Math.max(...analytics.enrollmentsByDay.map(d => d.count), 1);
  }, [analytics]);

  // Fill all 30 days
  const chartDays = useMemo(() => {
    if (!analytics) return [];
    const map = Object.fromEntries(analytics.enrollmentsByDay.map(d => [d.date, d.count]));
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 29 + i);
      const key = d.toISOString().slice(0, 10);
      return { date: key, count: map[key] || 0 };
    });
  }, [analytics]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #3D1A2A", borderTopColor: "#C4267A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!analytics) return null;

  const { bySource, totalEnrolled } = analytics;
  const sourceTotal = bySource.purchase + bySource.free + bySource.admin || 1;

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronDown size={12} color="#9F6A80" />;
    return sortDir === "asc"
      ? <ChevronUp size={12} color="#C4267A" />
      : <ChevronDown size={12} color="#C4267A" />;
  };

  return (
    <div style={{ maxWidth: 1100, padding: "0 0 48px 0" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <Link href={`/admin/courses/${courseId}`}>
          <button style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid #3D1A2A",
            background: "#1A0A12", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <ArrowLeft size={16} color="#FAF0F5" />
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FAF0F5", margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: "#9F6A80", margin: 0, marginTop: 2 }}>{analytics.courseTitle}</p>
        </div>
      </div>

      {/* ── Overview metrics ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Matriculados" value={analytics.totalEnrolled} icon={Users} color="#60A5FA" bg="#1A2D3A" />
        <MetricCard label="Concluíram" value={analytics.completed} sub={`${analytics.completionRate}% do total`} icon={CheckCircle} color="#4ADE80" bg="#1A3A2A" />
        <MetricCard label="Em progresso" value={analytics.inProgress} icon={Clock} color="#FBBF24" bg="#3A2A1A" />
        <MetricCard label="Não iniciaram" value={analytics.notStarted} icon={XCircle} color="#F87171" bg="#3A1A1A" />
        <MetricCard label="Taxa conclusão" value={`${analytics.completionRate}%`} icon={TrendingUp} color="#C4267A" bg="#2D0F1E" />
        <MetricCard label="Progresso médio" value={`${analytics.avgProgress}%`} icon={BarChart2} color="#E879F9" bg="#2D1A2A" />
      </div>

      {/* ── Revenue (if for sale) ─────────────────────────────────────────────── */}
      {analytics.isForSale && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#9F6A80", letterSpacing: "0.08em", textTransform: "uppercase", margin: "28px 0 12px" }}>
            Financeiro
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
            <MetricCard label="Receita total" value={fmtCurrency(analytics.totalRevenue, analytics.currency)} icon={DollarSign} color="#4ADE80" bg="#1A3A2A" />
            <MetricCard label="Compras concluídas" value={analytics.completedPurchases} icon={ShoppingCart} color="#60A5FA" bg="#1A2D3A" />
            <MetricCard label="Checkouts abandonados" value={analytics.pendingAbandoned} sub="Pending > 1h" icon={XCircle} color="#FBBF24" bg="#3A2A1A" />
            <MetricCard label="Reembolsos" value={analytics.refundedCount} icon={RefreshCw} color="#F87171" bg="#3A1A1A" />
            <MetricCard label="Assinaturas ativas" value={analytics.activeSubscriptions} icon={Repeat} color="#E879F9" bg="#2D1A2A" />
            <MetricCard label="Conv. checkout" value={`${analytics.checkoutConvRate}%`} sub="Iniciou → Pagou" icon={TrendingUp} color="#C4267A" bg="#2D0F1E" />
          </div>
        </>
      )}

      {/* ── Two-column row: Source breakdown + Enrollment chart ──────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 20 }}>

        {/* Source breakdown */}
        <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14, padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#FAF0F5", margin: "0 0 18px" }}>Origem das matrículas</h3>
          {[
            { key: "purchase", label: "Compra", count: bySource.purchase, color: "#4ADE80" },
            { key: "free",     label: "Grátis",  count: bySource.free,     color: "#60A5FA" },
            { key: "admin",    label: "Admin",   count: bySource.admin,    color: "#E879F9" },
          ].map(({ key, label, count, color }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#9F6A80" }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#FAF0F5" }}>
                  {count} <span style={{ color: "#9F6A80", fontWeight: 400 }}>({totalEnrolled > 0 ? Math.round(count / totalEnrolled * 100) : 0}%)</span>
                </span>
              </div>
              <ProgressBar value={count / sourceTotal * 100} color={color} />
            </div>
          ))}
        </div>

        {/* 30-day enrollment chart */}
        <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14, padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#FAF0F5", margin: "0 0 18px" }}>Matrículas — últimos 30 dias</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
            {chartDays.map(({ date, count }) => (
              <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div
                    title={`${fmtDateShort(date)}: ${count}`}
                    style={{
                      width: "100%",
                      height: count > 0 ? `${Math.max(4, count / chartMax * 100)}%` : 3,
                      background: count > 0 ? "#C4267A" : "#3D1A2A",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.3s",
                      cursor: count > 0 ? "default" : "default",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* X-axis: show every 5 days */}
          <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
            {chartDays.map(({ date }, i) => (
              <div key={date} style={{ flex: 1, textAlign: "center" }}>
                {(i === 0 || i === 14 || i === 29) && (
                  <span style={{ fontSize: 9, color: "#9F6A80" }}>{fmtDateShort(date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Per-lesson completion ─────────────────────────────────────────────── */}
      {analytics.perLesson.length > 0 && (
        <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14, padding: 22, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#FAF0F5", margin: "0 0 16px" }}>
            Conclusão por aula
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {analytics.perLesson.map((lesson) => (
              <div key={lesson.lessonId}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 12, color: "#FAF0F5", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lesson.title}
                    </span>
                    <span style={{ fontSize: 10, color: "#9F6A80" }}>{lesson.moduleTitle}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "#9F6A80" }}>{lesson.completedCount}/{totalEnrolled} alunos</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#FAF0F5", width: 42, textAlign: "right" }}>
                      {lesson.completionRate}%
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={lesson.completionRate}
                  color={lesson.completionRate >= 70 ? "#4ADE80" : lesson.completionRate >= 40 ? "#FBBF24" : "#F87171"}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Student list ──────────────────────────────────────────────────────── */}
      <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#FAF0F5", margin: 0 }}>
            Alunos ({analytics.students.length})
          </h3>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9F6A80" }} />
            <input
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="Buscar aluno..."
              style={{
                background: "#0D0509", border: "1px solid #3D1A2A", borderRadius: 8,
                padding: "7px 12px 7px 30px", fontSize: 12, color: "#FAF0F5",
                outline: "none", width: 200,
              }}
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9F6A80", padding: "32px 0", fontSize: 13 }}>
            {analytics.students.length === 0 ? "Nenhum aluno matriculado ainda." : "Nenhum aluno encontrado."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #3D1A2A" }}>
                  {([
                    { key: "name" as SortKey, label: "Aluno" },
                    { key: null, label: "Origem" },
                    { key: "enrolledAt" as SortKey, label: "Matriculado" },
                    { key: "lastActivity" as SortKey, label: "Última atividade" },
                    { key: "progressPercent" as SortKey, label: "Progresso" },
                  ] as { key: SortKey | null; label: string }[]).map(({ key, label }) => (
                    <th
                      key={label}
                      onClick={key ? () => toggleSort(key) : undefined}
                      style={{
                        padding: "8px 10px", textAlign: "left", color: "#9F6A80",
                        fontWeight: 500, cursor: key ? "pointer" : "default",
                        userSelect: "none", whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {label} {key && <SortIcon k={key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.userId} style={{ borderBottom: "1px solid #1F0D17" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: "#2D0F1E",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#C4267A", flexShrink: 0,
                        }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: "#FAF0F5", fontWeight: 500 }}>{s.name}</div>
                          <div style={{ color: "#9F6A80", fontSize: 11 }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <SourceBadge source={s.source} />
                        {s.subscriptionStatus && s.subscriptionStatus !== "None" && (
                          <StatusBadge status={s.subscriptionStatus} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 10px", color: "#9F6A80", whiteSpace: "nowrap" }}>
                      {fmtDate(s.enrolledAt)}
                    </td>
                    <td style={{ padding: "12px 10px", color: "#9F6A80", whiteSpace: "nowrap" }}>
                      {s.lastActivity ? fmtDate(s.lastActivity) : <span style={{ color: "#3D1A2A" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 10px", minWidth: 140 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ProgressBar
                          value={s.progressPercent}
                          color={s.progressPercent >= 100 ? "#4ADE80" : s.progressPercent > 0 ? "#C4267A" : "#3D1A2A"}
                        />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#FAF0F5", width: 36, textAlign: "right", flexShrink: 0 }}>
                          {s.progressPercent}%
                        </span>
                        <span style={{ fontSize: 10, color: "#9F6A80", flexShrink: 0 }}>
                          {s.completedLessons}/{s.totalLessons}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
