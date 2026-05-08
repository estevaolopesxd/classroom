"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api/client";
import { CheckCircle, XCircle, Award, Download } from "lucide-react";
import Link from "next/link";

interface VerifyResult {
  code: string;
  studentName: string;
  courseName: string;
  institutionName: string;
  issuedAt: string;
  courseDurationMinutes: number;
  isValid: boolean;
}

export default function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<VerifyResult>(`/api/certificates/verify/${code}`)
      .then(r => setResult(r.data))
      .catch(() => setResult({ code, studentName: "", courseName: "", institutionName: "", issuedAt: "", courseDurationMinutes: 0, isValid: false }))
      .finally(() => setLoading(false));
  }, [code]);

  const hours = result && result.courseDurationMinutes > 0
    ? Math.ceil(result.courseDurationMinutes / 60)
    : null;

  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/certificates/${code}/download`;

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0509",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        {/* Logo / brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "#2D0F1E",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          }}>
            <Award size={28} color="#C4267A" />
          </div>
          <span style={{ fontSize: 13, color: "#9F6A80" }}>Verificação de Certificado</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{
              width: 36, height: 36, border: "3px solid #3D1A2A", borderTopColor: "#C4267A",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : result?.isValid ? (
          <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 20, overflow: "hidden" }}>
            {/* Green success header */}
            <div style={{ background: "#1A3A2A", padding: "24px 28px", display: "flex", alignItems: "center", gap: 14 }}>
              <CheckCircle size={32} color="#4ADE80" />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#4ADE80" }}>Certificado Válido</div>
                <div style={{ fontSize: 12, color: "#86EFAC", marginTop: 2 }}>
                  Este certificado é autêntico e foi emitido por {result.institutionName || "esta plataforma"}.
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "28px 28px 24px" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#9F6A80", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  Certificamos que
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#FAF0F5" }}>{result.studentName}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#9F6A80", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  Concluiu o curso
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#FAF0F5" }}>{result.courseName}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
                <div style={{ background: "#0D0509", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#9F6A80", marginBottom: 3 }}>Data de emissão</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#FAF0F5" }}>
                    {new Date(result.issuedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
                {hours && (
                  <div style={{ background: "#0D0509", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#9F6A80", marginBottom: 3 }}>Carga horária</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#FAF0F5" }}>{hours} horas</div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20, padding: "10px 14px", background: "#0D0509", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#9F6A80" }}>Código de verificação:</span>
                <code style={{ fontSize: 12, color: "#C4267A", fontWeight: 700, letterSpacing: "0.05em" }}>{result.code}</code>
              </div>

              {result.institutionName && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#9F6A80", textAlign: "center" }}>
                  Emitido por: <strong style={{ color: "#FAF0F5" }}>{result.institutionName}</strong>
                </div>
              )}

              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 24, padding: "12px 24px", background: "#C4267A", color: "#fff",
                  borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 14,
                }}
              >
                <Download size={16} /> Baixar PDF
              </a>
            </div>
          </div>
        ) : (
          <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "#3A1A1A", padding: "24px 28px", display: "flex", alignItems: "center", gap: 14 }}>
              <XCircle size={32} color="#F87171" />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#F87171" }}>Certificado Inválido</div>
                <div style={{ fontSize: 12, color: "#FCA5A5", marginTop: 2 }}>
                  O código <code style={{ background: "#2D0F0F", padding: "1px 5px", borderRadius: 4 }}>{code}</code> não corresponde a nenhum certificado.
                </div>
              </div>
            </div>
            <div style={{ padding: "28px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9F6A80", margin: "0 0 20px" }}>
                Verifique se o código foi digitado corretamente ou se o certificado foi revogado.
              </p>
              <Link href="/" style={{ color: "#C4267A", fontSize: 13 }}>← Voltar para a plataforma</Link>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#6B3A5A", marginTop: 20 }}>
          Para verificar a autenticidade, acesse <code style={{ color: "#9F6A80" }}>/verify/[código]</code>
        </p>
      </div>
    </div>
  );
}
