"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { coursesApi } from "@/lib/api/courses";
import { paymentsApi } from "@/lib/api/payments";
import { couponsApi, type ValidateCouponResponse } from "@/lib/api/coupons";
import { useAuthStore } from "@/lib/stores/authStore";
import api from "@/lib/api/client";
import type { CourseDetail } from "@/types";
import { PRICING_TYPE_SHORT, PRICING_TYPE_LABELS } from "@/types";
import { BookOpen, Play, Lock, CheckCircle, Loader2, ChevronLeft, ChevronRight, ChevronDown, Tag, X, Star, Send } from "lucide-react";
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
  greenBg: "rgba(22,163,74,0.08)",
  red: "#dc2626",
  redBg: "rgba(220,38,38,0.08)",
};

const fmt = (val: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(val);

// ── Rating types ──────────────────────────────────────────────────────────────
interface RatingAuthor { id: string; fullName: string; avatarUrl?: string }
interface RatingItem { id: string; courseId: string; author: RatingAuthor; rating: number; comment?: string; createdAt: string }
interface RatingSummary { average: number; total: number; star5: number; star4: number; star3: number; star2: number; star1: number }

function StarRow({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ background: "none", border: "none", cursor: onChange ? "pointer" : "default", padding: 1, lineHeight: 0 }}
        >
          <Star size={size} fill={(hover || value) >= n ? "#F59E0B" : "none"} color={(hover || value) >= n ? "#F59E0B" : "#D4B896"} />
        </button>
      ))}
    </div>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Ratings state
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [myRating, setMyRating] = useState<RatingItem | null>(null);
  const [ratingPage, setRatingPage] = useState(1);
  const [ratingTotal, setRatingTotal] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [myRatingValue, setMyRatingValue] = useState(0);
  const [myRatingComment, setMyRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult] = useState<ValidateCouponResponse | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      coursesApi.getById(courseId),
      isAuthenticated ? coursesApi.getMy() : Promise.resolve([]),
    ])
      .then(([c, myCourses]) => {
        setCourse(c);
        setIsEnrolled((myCourses as { id: string }[]).some((mc) => mc.id === courseId));
        if (c.modules?.length) setExpandedModules(new Set([c.modules[0].id]));
      })
      .catch(() => router.push("/courses"))
      .finally(() => setLoading(false));
  }, [courseId, isAuthenticated, router]);

  const loadRatings = useCallback(async (p = 1) => {
    setRatingLoading(true);
    try {
      const res = await api.get(`/api/courses/${courseId}/ratings`, { params: { page: p, pageSize: 5 } });
      setRatingSummary(res.data.summary);
      setRatings(p === 1 ? res.data.ratings : prev => [...prev, ...res.data.ratings]);
      setRatingTotal(parseInt(res.headers["x-total-count"] || "0"));
      setRatingPage(p);
    } catch { /* silencioso */ } finally { setRatingLoading(false); }
  }, [courseId]);

  const loadMyRating = useCallback(async () => {
    try {
      const res = await api.get(`/api/courses/${courseId}/ratings/my`);
      if (res.data) {
        setMyRating(res.data);
        setMyRatingValue(res.data.rating);
        setMyRatingComment(res.data.comment || "");
      }
    } catch { /* silencioso */ }
  }, [courseId]);

  useEffect(() => { loadRatings(1); }, [loadRatings]);
  useEffect(() => { if (isAuthenticated) loadMyRating(); }, [isAuthenticated, loadMyRating]);

  const submitRating = async () => {
    if (myRatingValue === 0) return;
    setRatingSubmitting(true);
    try {
      await api.post(`/api/courses/${courseId}/ratings`, { rating: myRatingValue, comment: myRatingComment.trim() || undefined });
      toast.success("Avaliação salva!");
      setShowRatingForm(false);
      loadRatings(1);
      loadMyRating();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Erro ao salvar avaliação");
    } finally { setRatingSubmitting(false); }
  };

  const deleteMyRating = async () => {
    if (!confirm("Remover sua avaliação?")) return;
    try {
      await api.delete(`/api/courses/${courseId}/ratings/my`);
      setMyRating(null); setMyRatingValue(0); setMyRatingComment("");
      loadRatings(1);
    } catch { /* silencioso */ }
  };

  const isFree = !course?.isForSale || !course?.price || course.price === 0;
  const firstLessonId = course?.modules.flatMap((m) => m.lessons)[0]?.id;

  // Validate coupon with debounce
  const handleCouponChange = (value: string) => {
    const upper = value.toUpperCase();
    setCouponCode(upper);
    setCouponResult(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!upper.trim() || upper.length < 4) return;

    debounceRef.current = setTimeout(async () => {
      setCouponValidating(true);
      try {
        const result = await couponsApi.validate(upper.trim(), courseId);
        setCouponResult(result);
      } catch {
        setCouponResult(null);
      } finally {
        setCouponValidating(false);
      }
    }, 600);
  };

  const clearCoupon = () => {
    setCouponCode("");
    setCouponResult(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleAction = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isEnrolled) {
      if (firstLessonId) router.push(`/courses/${courseId}/learn/${firstLessonId}`);
      return;
    }
    setActionLoading(true);
    try {
      if (isFree) {
        await coursesApi.enrollFree(courseId);
        toast.success("Inscrito com sucesso!");
        setIsEnrolled(true);
        if (firstLessonId) router.push(`/courses/${courseId}/learn/${firstLessonId}`);
      } else {
        const appliedCode = couponResult?.valid ? couponCode.trim() : undefined;
        const result = await paymentsApi.createCheckout(courseId, appliedCode);
        if (result.isFree) {
          toast.success("Cupom de 100%! Acesso liberado gratuitamente 🎉");
          setIsEnrolled(true);
          if (firstLessonId) router.push(`/courses/${courseId}/learn/${firstLessonId}`);
        } else if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Erro ao acessar curso");
    } finally {
      setActionLoading(false);
    }
  };

  const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;

  // Pricing with coupon
  const basePrice = course?.price ?? 0;
  const displayPrice = couponResult?.valid ? couponResult.finalPrice : basePrice;
  const currency = course?.currency || "BRL";
  const pricingSuffix = PRICING_TYPE_SHORT[course?.pricingType ?? "OneTime"];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Loader2 size={32} color={S.rose} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!course) return null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <Link href="/courses" style={{ textDecoration: "none" }}>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 10, border: `1px solid ${S.border}`,
          background: S.white, color: S.ink, fontSize: 13, fontWeight: 600,
          cursor: "pointer", marginBottom: 24, fontFamily: "inherit",
        }}>
          <ChevronLeft size={15} /> Voltar aos cursos
        </button>
      </Link>

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 320px",
        gap: 40,
        alignItems: "start",
      }}>
        {/* ── Main content ── */}
        <div>
          {/* Hero image */}
          <div style={{
            width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden",
            background: `linear-gradient(135deg, ${S.rose}22, ${S.roseDark}11)`,
            marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {course.thumbnailUrl
              ? <img src={course.thumbnailUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <BookOpen size={64} color={`${S.rose}44`} />
            }
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {course.categoryName && (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                background: course.categoryColor ? `${course.categoryColor}18` : `${S.rose}14`,
                color: course.categoryColor || S.rose,
                border: `1px solid ${course.categoryColor ? `${course.categoryColor}44` : `${S.rose}44`}`,
              }}>
                {course.categoryName}
              </span>
            )}
            {course.level && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}>
                {course.level}
              </span>
            )}
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}>
              {totalLessons} aula{totalLessons !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}>
              {course.modules.length} módulo{course.modules.length !== 1 ? "s" : ""}
            </span>
            {/* Rating summary badge */}
            {ratingSummary && ratingSummary.total > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "rgba(245,158,11,0.12)", color: "#92400e", border: "1px solid rgba(245,158,11,0.3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                ⭐ {ratingSummary.average.toFixed(1)} ({ratingSummary.total})
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: S.ink, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            {course.title}
          </h1>
          {course.description && (
            <p style={{ fontSize: 15, color: S.muted, lineHeight: 1.7, margin: 0 }}>{course.description}</p>
          )}

          {/* Tags */}
          {course.tags && (() => {
            try {
              const parsed: string[] = JSON.parse(course.tags);
              if (parsed.length > 0) return (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                  {parsed.map(t => (
                    <span key={t} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 100, background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}>
                      #{t}
                    </span>
                  ))}
                </div>
              );
            } catch { return null; }
            return null;
          })()}

          {/* Modules */}
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: S.ink, marginBottom: 16 }}>Conteúdo do curso</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {course.modules.map((module) => (
                <div key={module.id} style={{
                  borderRadius: 12, border: `1px solid ${S.border}`,
                  background: S.white, overflow: "hidden",
                }}>
                  <button
                    onClick={() =>
                      setExpandedModules((prev) => {
                        const next = new Set(prev);
                        next.has(module.id) ? next.delete(module.id) : next.add(module.id);
                        return next;
                      })
                    }
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "14px 16px", background: "none", border: "none",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    }}
                  >
                    {module.isIntro && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: S.bg, color: S.rose, border: `1px solid ${S.border}`, flexShrink: 0 }}>
                        Intro
                      </span>
                    )}
                    <span style={{ fontWeight: 600, color: S.ink, fontSize: 14, flex: 1 }}>{module.title}</span>
                    <span style={{ fontSize: 12, color: S.muted, marginRight: 6 }}>{module.lessons.length} aulas</span>
                    {expandedModules.has(module.id)
                      ? <ChevronDown size={16} color={S.muted} />
                      : <ChevronRight size={16} color={S.muted} />
                    }
                  </button>

                  {expandedModules.has(module.id) && (
                    <div style={{ borderTop: `1px solid ${S.border}` }}>
                      {module.lessons.map((lesson, i) => {
                        const canAccess = isEnrolled || lesson.isFreePreview;
                        return (
                          <div key={lesson.id} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "11px 16px",
                            borderBottom: i < module.lessons.length - 1 ? `1px solid ${S.border}` : "none",
                          }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%",
                              background: canAccess ? `${S.rose}15` : S.bg,
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              {canAccess
                                ? <Play size={12} color={S.rose} />
                                : <Lock size={11} color={S.muted} />
                              }
                            </div>
                            <span style={{ fontSize: 13, flex: 1, color: canAccess ? S.ink : S.muted }}>
                              {lesson.title}
                            </span>
                            {lesson.isFreePreview && !isEnrolled && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, border: `1px solid ${S.green}44`, color: S.green }}>
                                Grátis
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Ratings ── */}
          <div style={{ marginTop: 40, paddingTop: 28, borderTop: `1px solid ${S.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Star size={18} color="#F59E0B" fill="#F59E0B" />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: S.ink, margin: 0 }}>
                  Avaliações
                  {ratingSummary && ratingSummary.total > 0 && (
                    <span style={{ fontSize: 14, fontWeight: 400, color: S.muted, marginLeft: 8 }}>
                      {ratingSummary.average.toFixed(1)} · {ratingSummary.total} avaliação{ratingSummary.total !== 1 ? "ões" : ""}
                    </span>
                  )}
                </h2>
              </div>
              {isEnrolled && !showRatingForm && (
                <button
                  onClick={() => setShowRatingForm(true)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${S.border}`,
                    background: S.white, color: S.rose, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}
                >
                  <Star size={13} /> {myRating ? "Editar avaliação" : "Avaliar curso"}
                </button>
              )}
            </div>

            {/* Summary bar */}
            {ratingSummary && ratingSummary.total > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, padding: "16px 20px", background: S.bg, borderRadius: 12, border: `1px solid ${S.border}` }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: S.ink, lineHeight: 1 }}>{ratingSummary.average.toFixed(1)}</div>
                  <StarRow value={Math.round(ratingSummary.average)} size={14} />
                  <div style={{ fontSize: 11, color: S.muted, marginTop: 4 }}>{ratingSummary.total} avaliações</div>
                </div>
                <div style={{ flex: 1 }}>
                  {([5,4,3,2,1] as const).map(star => {
                    const count = ratingSummary[`star${star}` as keyof RatingSummary] as number;
                    const pct = ratingSummary.total > 0 ? (count / ratingSummary.total) * 100 : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: S.muted, width: 10, textAlign: "right" }}>{star}</span>
                        <Star size={10} fill="#F59E0B" color="#F59E0B" />
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: S.border, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "#F59E0B", width: `${pct}%`, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: S.muted, width: 24, textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* My rating form */}
            {isEnrolled && showRatingForm && (
              <div style={{ marginBottom: 20, padding: "16px 20px", background: S.bg, borderRadius: 12, border: `1px solid ${S.border}` }}>
                <div style={{ fontWeight: 700, color: S.ink, fontSize: 14, marginBottom: 10 }}>
                  {myRating ? "Sua avaliação" : "Avalie este curso"}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <StarRow value={myRatingValue} onChange={setMyRatingValue} size={28} />
                </div>
                <textarea
                  value={myRatingComment}
                  onChange={e => setMyRatingComment(e.target.value)}
                  placeholder="Deixe um comentário opcional..."
                  rows={3}
                  style={{
                    width: "100%", resize: "none", border: `1.5px solid ${S.border}`,
                    borderRadius: 8, padding: "8px 12px", fontSize: 13, color: S.ink,
                    background: S.white, outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box", marginBottom: 10,
                  }}
                  onFocus={e => (e.target.style.borderColor = S.rose)}
                  onBlur={e => (e.target.style.borderColor = S.border)}
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  {myRating && (
                    <button onClick={deleteMyRating} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid #dc262633`, background: "transparent", color: "#dc2626", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                      Remover
                    </button>
                  )}
                  <button onClick={() => setShowRatingForm(false)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${S.border}`, background: "transparent", color: S.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    Cancelar
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={ratingSubmitting || myRatingValue === 0}
                    style={{
                      padding: "7px 16px", borderRadius: 8, border: "none",
                      background: S.rose, color: "white", fontSize: 13, fontWeight: 600,
                      cursor: ratingSubmitting || myRatingValue === 0 ? "not-allowed" : "pointer",
                      opacity: ratingSubmitting || myRatingValue === 0 ? 0.6 : 1,
                      fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <Send size={13} /> Enviar
                  </button>
                </div>
              </div>
            )}

            {/* Ratings list */}
            {ratings.length === 0 && !ratingLoading ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: S.muted, fontSize: 13 }}>
                Ainda não há avaliações. {isEnrolled ? "Seja o primeiro a avaliar!" : ""}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ratings.map(r => (
                  <div key={r.id} style={{ padding: "14px 16px", background: S.white, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {r.author.avatarUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={r.author.avatarUrl} alt={r.author.fullName} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{r.author.fullName.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: S.ink }}>{r.author.fullName}</div>
                        <StarRow value={r.rating} size={12} />
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: 11, color: S.muted }}>
                        {new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: 13, color: S.ink, margin: 0, lineHeight: 1.6 }}>{r.comment}</p>
                    )}
                  </div>
                ))}
                {ratings.length < ratingTotal && (
                  <div style={{ textAlign: "center" }}>
                    <button
                      onClick={() => loadRatings(ratingPage + 1)}
                      disabled={ratingLoading}
                      style={{ padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${S.border}`, background: S.white, color: S.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {ratingLoading ? "Carregando..." : `Ver mais (${ratingTotal - ratings.length} restantes)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar CTA ── */}
        <div>
          <div style={{
            position: "sticky", top: 24,
            background: S.white, borderRadius: 16, border: `1px solid ${S.border}`,
            padding: 24, display: "flex", flexDirection: "column", gap: 16,
          }}>
            {/* Price / enrolled status */}
            {isEnrolled ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={20} color={S.green} />
                <span style={{ fontSize: 15, fontWeight: 700, color: S.green }}>Você está inscrita!</span>
              </div>
            ) : isFree ? (
              <div style={{ fontSize: 26, fontWeight: 800, color: S.green }}>Gratuito</div>
            ) : (
              <div>
                {/* Original price (with strike when coupon applied) */}
                {couponResult?.valid && (
                  <div style={{ fontSize: 14, color: S.muted, textDecoration: "line-through", marginBottom: 2 }}>
                    {fmt(basePrice, currency)}{pricingSuffix}
                  </div>
                )}
                {/* Final price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: couponResult?.valid ? S.green : S.ink }}>
                    {fmt(displayPrice, currency)}
                  </span>
                  {pricingSuffix && !couponResult?.valid && (
                    <span style={{ fontSize: 15, fontWeight: 600, color: S.muted }}>{pricingSuffix}</span>
                  )}
                  {couponResult?.valid && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: S.green }}>
                      −{couponResult.discountPercent}%
                    </span>
                  )}
                </div>
                {/* Subscription label */}
                {course?.pricingType && course.pricingType !== "OneTime" && !couponResult?.valid && (
                  <div style={{ fontSize: 12, color: S.muted, marginTop: 3 }}>
                    {PRICING_TYPE_LABELS[course.pricingType]} · cancele a qualquer momento
                  </div>
                )}
                {couponResult?.valid && (
                  <div style={{ fontSize: 12, color: S.green, marginTop: 2 }}>
                    Você economiza {fmt(couponResult.savedAmount, currency)}
                  </div>
                )}
              </div>
            )}

            {/* Coupon input (only for paid courses, not enrolled) */}
            {!isEnrolled && !isFree && (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.muted, marginBottom: 6 }}>
                  <Tag size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Cupom de desconto
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => handleCouponChange(e.target.value)}
                    placeholder="Ex: ABCD-1234"
                    maxLength={20}
                    style={{
                      width: "100%",
                      padding: "9px 36px 9px 12px",
                      border: `1.5px solid ${
                        couponResult?.valid ? S.green
                        : couponResult && !couponResult.valid ? S.red
                        : S.border
                      }`,
                      borderRadius: 9,
                      fontSize: 14,
                      fontFamily: "monospace",
                      letterSpacing: 1,
                      background: couponResult?.valid ? S.greenBg : couponResult && !couponResult.valid ? S.redBg : S.white,
                      color: S.ink,
                      outline: "none",
                      boxSizing: "border-box",
                      textTransform: "uppercase",
                    }}
                  />
                  {/* Spinner or clear */}
                  <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
                    {couponValidating ? (
                      <Loader2 size={14} color={S.muted} style={{ animation: "spin 1s linear infinite" }} />
                    ) : couponCode ? (
                      <button
                        onClick={clearCoupon}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                      >
                        <X size={14} color={S.muted} />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Coupon feedback */}
                {couponResult && !couponValidating && (
                  <div style={{
                    marginTop: 6, fontSize: 12, fontWeight: 600,
                    color: couponResult.valid ? S.green : S.red,
                  }}>
                    {couponResult.valid
                      ? `✓ Cupom aplicado: ${couponResult.discountPercent}% de desconto`
                      : `✗ ${couponResult.message}`
                    }
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleAction}
              disabled={actionLoading}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: actionLoading ? "#d0bbc5" : `linear-gradient(135deg, ${S.rose}, ${S.roseDark})`,
                color: S.white, fontSize: 15, fontWeight: 700,
                cursor: actionLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: actionLoading ? "none" : `0 6px 20px ${S.rose}33`,
                fontFamily: "inherit",
              }}
            >
              {actionLoading ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Processando...</>
              ) : isEnrolled ? (
                <><Play size={16} /> Acessar curso</>
              ) : isFree ? (
                "Acessar gratuitamente"
              ) : course?.pricingType && course.pricingType !== "OneTime" ? (
                `Assinar${pricingSuffix}`
              ) : (
                "Comprar agora"
              )}
            </button>

            <p style={{ fontSize: 12, textAlign: "center", color: S.muted, margin: 0 }}>
              {isEnrolled
                ? "Seu acesso está ativo"
                : isFree
                ? "Acesso imediato e gratuito"
                : course?.pricingType && course.pricingType !== "OneTime"
                ? "Cancele a qualquer momento pelo Stripe"
                : "Acesso vitalício ao curso"}
            </p>

            {/* Course stats */}
            <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: S.muted }}>
                <BookOpen size={15} />
                <span>{totalLessons} aula{totalLessons !== 1 ? "s" : ""}</span>
              </div>
              {course.durationMinutes && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: S.muted }}>
                  <span>⏱</span>
                  <span>{course.durationMinutes} minutos de conteúdo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
