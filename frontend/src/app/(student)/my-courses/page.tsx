"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/lib/api/courses";
import api from "@/lib/api/client";
import type { Course } from "@/types";
import { BookOpen, Play, Award, Download, ExternalLink } from "lucide-react";

interface Certificate {
  id: string;
  code: string;
  courseId: string;
  courseName: string;
  studentName: string;
  issuedAt: string;
  courseDurationMinutes: number;
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coursesApi.getMy(),
      api.get<Certificate[]>("/api/certificates/my").then(r => r.data).catch(() => []),
    ]).then(([c, certs]) => {
      setCourses(c);
      setCertificates(certs);
    }).finally(() => setLoading(false));
  }, []);

  const certByCourse = Object.fromEntries(certificates.map(c => [c.courseId, c]));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #3D1A2A", borderTopColor: "#C4267A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#FAF0F5", margin: 0 }}>Meus Cursos</h1>
        <p style={{ fontSize: 14, color: "#9F6A80", margin: "4px 0 0" }}>
          {courses.length} curso{courses.length !== 1 ? "s" : ""} adquirido{courses.length !== 1 ? "s" : ""}
          {certificates.length > 0 && ` · ${certificates.length} certificado${certificates.length !== 1 ? "s" : ""} emitido${certificates.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Certificates banner */}
      {certificates.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #1A2D1A, #1A3A2A)",
          border: "1px solid #2A5A2A", borderRadius: 14, padding: "16px 20px",
          marginBottom: 24, display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0F2A0F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Award size={20} color="#4ADE80" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#4ADE80" }}>
              🎉 Parabéns! Você tem {certificates.length} certificado{certificates.length !== 1 ? "s" : ""} disponível{certificates.length !== 1 ? "is" : ""}
            </div>
            <div style={{ fontSize: 12, color: "#86EFAC", marginTop: 2 }}>
              Baixe seus certificados de conclusão abaixo em cada curso concluído
            </div>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#1A0A12", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <BookOpen size={28} color="#3D1A2A" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#FAF0F5", margin: "0 0 8px" }}>Nenhum curso ainda</h2>
          <p style={{ fontSize: 14, color: "#9F6A80", margin: "0 0 24px" }}>
            Explore nosso catálogo e comece sua jornada de aprendizado.
          </p>
          <Link href="/courses" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 24px", background: "#C4267A", color: "#fff",
            borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 14,
          }}>
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {courses.map(course => {
            const cert = certByCourse[course.id];
            const downloadUrl = cert
              ? `${process.env.NEXT_PUBLIC_API_URL}/api/certificates/${cert.code}/download`
              : null;

            return (
              <div key={course.id} style={{
                background: "#1A0A12", border: `1px solid ${cert ? "#2A5A2A" : "#3D1A2A"}`,
                borderRadius: 14, overflow: "hidden", transition: "transform 0.15s, border-color 0.15s",
                position: "relative",
              }}>
                {/* Certificate badge */}
                {cert && (
                  <div style={{
                    position: "absolute", top: 10, right: 10, zIndex: 10,
                    background: "#1A3A2A", border: "1px solid #2A5A2A",
                    borderRadius: 20, padding: "4px 10px",
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 10, fontWeight: 700, color: "#4ADE80",
                  }}>
                    <Award size={11} /> Concluído
                  </div>
                )}

                {/* Thumbnail */}
                <Link href={`/courses/${course.id}`} style={{ display: "block", textDecoration: "none" }}>
                  <div style={{ aspectRatio: "16/9", background: "linear-gradient(135deg, #2D0F1E, #1A0A12)", position: "relative", overflow: "hidden" }}>
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnailUrl} alt={course.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={36} color="#3D1A2A" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: 0, transition: "opacity 0.2s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Play size={20} color="#fff" />
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Content */}
                <div style={{ padding: 16 }}>
                  <Link href={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#FAF0F5", margin: "0 0 6px", lineHeight: 1.3 }}>
                      {course.title}
                    </h3>
                  </Link>
                  <p style={{ fontSize: 12, color: "#9F6A80", margin: "0 0 12px" }}>
                    {course.totalModules} módulos · {course.totalLessons} aulas
                    {course.level && ` · ${course.level}`}
                  </p>

                  {/* Certificate actions */}
                  {cert ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <a
                        href={downloadUrl!}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "8px 12px", background: "#1A3A2A", border: "1px solid #2A5A2A",
                          borderRadius: 8, color: "#4ADE80", textDecoration: "none",
                          fontSize: 12, fontWeight: 600,
                        }}
                      >
                        <Download size={13} /> Certificado
                      </a>
                      <a
                        href={`/verify/${cert.code}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "8px 10px", background: "#0D0509", border: "1px solid #3D1A2A",
                          borderRadius: 8, color: "#9F6A80", textDecoration: "none",
                          display: "flex", alignItems: "center",
                        }}
                        title="Verificar certificado"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  ) : (
                    <Link
                      href={`/courses/${course.id}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "8px 12px", background: "#C4267A", borderRadius: 8,
                        color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 600,
                      }}
                    >
                      <Play size={13} /> Continuar
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
