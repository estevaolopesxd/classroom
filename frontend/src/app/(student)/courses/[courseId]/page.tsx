"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { coursesApi } from "@/lib/api/courses";
import { paymentsApi } from "@/lib/api/payments";
import { couponsApi, type ValidateCouponResponse } from "@/lib/api/coupons";
import { useAuthStore } from "@/lib/stores/authStore";
import type { CourseDetail } from "@/types";
import { PRICING_TYPE_SHORT, PRICING_TYPE_LABELS } from "@/types";
import { BookOpen, Play, Lock, CheckCircle, Loader2, ChevronLeft, ChevronRight, ChevronDown, Tag, X } from "lucide-react";
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

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

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
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: S.ink, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            {course.title}
          </h1>
          {course.description && (
            <p style={{ fontSize: 15, color: S.muted, lineHeight: 1.7, margin: 0 }}>{course.description}</p>
          )}

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
