"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api/admin";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Award, Plus, Trash2, Save, Eye, GripVertical, CheckCircle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Sponsor {
  id?: string;
  name: string;
  logoUrl: string;
  order: number;
  _tempId?: string; // for new unsaved sponsors
}

interface CertConfig {
  id?: string;
  institutionName: string;
  institutionLogoUrl: string;
  signatureImageUrl: string;
  signerName: string;
  signerTitle: string;
  bodyText: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  cityName: string;
  sponsors: Sponsor[];
}

const DEFAULT_BODY = "Certificamos que {{studentName}} concluiu com êxito o curso {{courseName}}, com carga horária de {{hours}} horas.";

const EMPTY_CONFIG: CertConfig = {
  institutionName: "",
  institutionLogoUrl: "",
  signatureImageUrl: "",
  signerName: "",
  signerTitle: "",
  bodyText: DEFAULT_BODY,
  primaryColor: "#C4267A",
  backgroundColor: "#FFFFFF",
  textColor: "#1A0A12",
  cityName: "",
  sponsors: [],
};

// ── Certificate Preview ────────────────────────────────────────────────────────

function CertPreview({ config }: { config: CertConfig }) {
  const body = config.bodyText
    .replace("{{studentName}}", "Maria Silva")
    .replace("{{courseName}}", config.institutionName || "Nome do Curso")
    .replace("{{hours}}", "20")
    .replace("{{date}}", new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    }));

  const primary = config.primaryColor || "#C4267A";
  const bg      = config.backgroundColor || "#FFFFFF";
  const text    = config.textColor || "#1A0A12";

  return (
    <div style={{
      background: bg, border: `2px solid ${primary}`, borderRadius: 8,
      overflow: "hidden", width: "100%", aspectRatio: "297/210",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)", fontFamily: "Arial, sans-serif",
      position: "relative",
    }}>
      {/* Top bar */}
      <div style={{ height: 8, background: primary }} />

      <div style={{ padding: "20px 28px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            {config.institutionLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.institutionLogoUrl} alt="logo" style={{ maxHeight: 40, maxWidth: 120, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 80, height: 30, background: "#f0f0f0", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: "#999" }}>Logo</span>
              </div>
            )}
            <div style={{ fontSize: 9, fontWeight: 700, color: primary, marginTop: 3 }}>
              {config.institutionName || "Nome da Instituição"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: primary }}>
              CERTIFICADO DE CONCLUSÃO
            </div>
            <div style={{ height: 2, background: primary, marginTop: 2 }} />
          </div>
        </div>

        <div style={{ fontSize: 9, color: text }}>Certificamos que</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: primary, margin: "4px 0 2px" }}>Maria Silva</div>
        <div style={{ height: 1.5, background: primary, width: "60%", marginBottom: 10 }} />

        <div style={{ fontSize: 9, color: text, lineHeight: 1.6 }}>{body}</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 }}>
          <div>
            {config.signatureImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.signatureImageUrl} alt="assinatura" style={{ maxHeight: 30, maxWidth: 90, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 80, height: 20, borderBottom: `1px solid ${text}` }} />
            )}
            <div style={{ fontSize: 7, color: text, fontWeight: 600, marginTop: 2 }}>
              {config.signerName || "Assinante"}
            </div>
            <div style={{ fontSize: 7, color: text }}>{config.signerTitle || "Cargo"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 7, color: text }}>{config.cityName || "Cidade"}, {new Date().toLocaleDateString("pt-BR")}</div>
            <div style={{ fontSize: 6, color: primary, marginTop: 4 }}>Código: ABC123XYZ456</div>
          </div>
        </div>

        {/* Sponsors */}
        {config.sponsors.length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid #ddd", paddingTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 7, color: text }}>Apoio:</span>
            {config.sponsors.map((s, i) => (
              <div key={i}>
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt={s.name} style={{ maxHeight: 20, maxWidth: 60, objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 7, color: text, fontWeight: 600 }}>{s.name}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: primary }} />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CertificatesAdminPage() {
  const [config, setConfig] = useState<CertConfig>(EMPTY_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"general" | "visual" | "sponsors" | "issued">("general");
  const [newSponsor, setNewSponsor] = useState({ name: "", logoUrl: "" });
  const [addingSpn, setAddingSpn] = useState(false);
  const [issuedCerts, setIssuedCerts] = useState<{
    id: string; code: string; studentName: string; courseName: string; issuedAt: string;
  }[]>([]);
  const [certsTotal, setCertsTotal] = useState(0);
  const [certsPage, setCertsPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getCertificateConfig();
      if (data) {
        setConfig({
          id: data.id,
          institutionName:    data.institutionName    ?? "",
          institutionLogoUrl: data.institutionLogoUrl ?? "",
          signatureImageUrl:  data.signatureImageUrl  ?? "",
          signerName:         data.signerName         ?? "",
          signerTitle:        data.signerTitle        ?? "",
          bodyText:           data.bodyText           ?? DEFAULT_BODY,
          primaryColor:       data.primaryColor       ?? "#C4267A",
          backgroundColor:    data.backgroundColor   ?? "#FFFFFF",
          textColor:          data.textColor          ?? "#1A0A12",
          cityName:           data.cityName           ?? "",
          sponsors:           (data.sponsors ?? []) as Sponsor[],
        });
      }
    } catch { /* primeiro acesso, config vazia */ }
  }, []);

  const loadCerts = useCallback(async () => {
    try {
      const { data, total } = await adminApi.getAllCertificates(certsPage);
      setIssuedCerts(data);
      setCertsTotal(total);
    } catch { /* silencioso */ }
  }, [certsPage]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "issued") loadCerts(); }, [tab, loadCerts]);

  const set = (key: keyof CertConfig, val: string) =>
    setConfig(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.saveCertificateConfig({
        institutionName:    config.institutionName,
        institutionLogoUrl: config.institutionLogoUrl || null,
        signatureImageUrl:  config.signatureImageUrl  || null,
        signerName:         config.signerName         || null,
        signerTitle:        config.signerTitle        || null,
        bodyText:           config.bodyText,
        primaryColor:       config.primaryColor,
        backgroundColor:    config.backgroundColor,
        textColor:          config.textColor,
        backgroundImageUrl: null,
        cityName:           config.cityName           || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch { /* error toast */ } finally { setSaving(false); }
  };

  const handleAddSponsor = async () => {
    if (!newSponsor.name.trim()) return;
    setAddingSpn(true);
    try {
      await adminApi.addSponsor({
        name:    newSponsor.name,
        logoUrl: newSponsor.logoUrl,
        order:   config.sponsors.length,
      });
      setNewSponsor({ name: "", logoUrl: "" });
      await load();
    } catch { /* erro */ } finally { setAddingSpn(false); }
  };

  const handleDeleteSponsor = async (id: string) => {
    try {
      await adminApi.deleteSponsor(id);
      await load();
    } catch { /* erro */ }
  };

  const TABS = [
    { key: "general",  label: "Geral" },
    { key: "visual",   label: "Visual" },
    { key: "sponsors", label: `Patrocinadores (${config.sponsors.length})` },
    { key: "issued",   label: "Emitidos" },
  ] as const;

  // ── input styles ─────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: "#0D0509", border: "1px solid #3D1A2A", borderRadius: 8,
    padding: "9px 12px", fontSize: 13, color: "#FAF0F5",
    outline: "none", width: "100%", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: "#9F6A80", marginBottom: 5, display: "block", fontWeight: 500,
  };
  const fieldWrap: React.CSSProperties = { marginBottom: 16 };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#2D0F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={20} color="#C4267A" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FAF0F5", margin: 0 }}>Certificados</h1>
            <p style={{ fontSize: 13, color: "#9F6A80", margin: 0 }}>Configure o modelo de certificado de conclusão</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            background: saved ? "#1A3A2A" : "#C4267A", color: saved ? "#4ADE80" : "#fff",
            border: "none", borderRadius: 10, cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: 14, transition: "all 0.2s", opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? <><CheckCircle size={16} /> Salvo!</> : <><Save size={16} /> {saving ? "Salvando..." : "Salvar"}</>}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 24 }}>
        {/* Left: form */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#1A0A12", padding: 4, borderRadius: 10, border: "1px solid #3D1A2A" }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: "8px 6px", borderRadius: 7, border: "none",
                  background: tab === t.key ? "#C4267A" : "transparent",
                  color: tab === t.key ? "#fff" : "#9F6A80",
                  cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: General ───────────────────────────────────────────────── */}
          {tab === "general" && (
            <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14, padding: 24 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Nome da Instituição *</label>
                <input style={inputStyle} value={config.institutionName}
                  onChange={e => set("institutionName", e.target.value)}
                  placeholder="Ex: Academia de Beleza Silva" />
              </div>
              <div style={fieldWrap}>
                <ImageUpload
                  label="Logo da Instituição"
                  value={config.institutionLogoUrl}
                  onChange={url => set("institutionLogoUrl", url)}
                  folder="logos"
                  hint="Recomendado: PNG ou SVG transparente, máx. 5 MB"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Nome do Assinante</label>
                  <input style={inputStyle} value={config.signerName}
                    onChange={e => set("signerName", e.target.value)}
                    placeholder="Ex: Ana Silva" />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Cargo do Assinante</label>
                  <input style={inputStyle} value={config.signerTitle}
                    onChange={e => set("signerTitle", e.target.value)}
                    placeholder="Ex: Diretora Pedagógica" />
                </div>
              </div>
              <div style={fieldWrap}>
                <ImageUpload
                  label="Imagem da Assinatura (PNG/SVG transparente)"
                  value={config.signatureImageUrl}
                  onChange={url => set("signatureImageUrl", url)}
                  folder="signatures"
                  hint="Fundo transparente garante melhor resultado no certificado"
                />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Cidade</label>
                <input style={inputStyle} value={config.cityName}
                  onChange={e => set("cityName", e.target.value)}
                  placeholder="Ex: São Paulo" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Texto do Certificado</label>
                <textarea
                  style={{ ...inputStyle, height: 90, resize: "vertical", lineHeight: 1.6 }}
                  value={config.bodyText}
                  onChange={e => set("bodyText", e.target.value)}
                />
                <div style={{ fontSize: 11, color: "#6B3A5A", marginTop: 6 }}>
                  Variáveis disponíveis:{" "}
                  {["{{studentName}}", "{{courseName}}", "{{hours}}", "{{date}}"].map(v => (
                    <code key={v} style={{ background: "#2D0F1E", padding: "1px 5px", borderRadius: 4, marginRight: 6, color: "#C4267A", fontSize: 10 }}>{v}</code>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Visual ────────────────────────────────────────────────── */}
          {tab === "visual" && (
            <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {([
                  { key: "primaryColor",     label: "Cor primária"  },
                  { key: "backgroundColor",  label: "Fundo"         },
                  { key: "textColor",        label: "Cor do texto"  },
                ] as { key: keyof CertConfig; label: string }[]).map(({ key, label }) => (
                  <div key={key} style={fieldWrap}>
                    <label style={labelStyle}>{label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="color"
                        value={config[key] as string}
                        onChange={e => set(key, e.target.value)}
                        style={{ width: 40, height: 36, borderRadius: 6, border: "none", cursor: "pointer", background: "transparent" }}
                      />
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={config[key] as string}
                        onChange={e => set(key, e.target.value)}
                        placeholder="#RRGGBB"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, padding: 14, background: "#0D0509", borderRadius: 10, border: "1px solid #3D1A2A" }}>
                <p style={{ fontSize: 12, color: "#9F6A80", margin: 0 }}>
                  💡 Para certificados formais, use <strong style={{ color: "#FAF0F5" }}>fundo branco (#FFFFFF)</strong> e texto escuro. A cor primária aparece nas bordas, título e nome do aluno.
                </p>
              </div>
            </div>
          )}

          {/* ── Tab: Sponsors ──────────────────────────────────────────────── */}
          {tab === "sponsors" && (
            <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14, padding: 24 }}>
              <p style={{ fontSize: 13, color: "#9F6A80", marginTop: 0, marginBottom: 20 }}>
                Logos de parceiros e patrocinadores aparecem na parte inferior do certificado.
              </p>

              {/* Existing sponsors */}
              {config.sponsors.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  {config.sponsors.sort((a, b) => a.order - b.order).map((sp) => (
                    <div key={sp.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      background: "#0D0509", border: "1px solid #3D1A2A", borderRadius: 10, marginBottom: 8,
                    }}>
                      <GripVertical size={16} color="#3D1A2A" />
                      {sp.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sp.logoUrl} alt={sp.name} style={{ height: 32, maxWidth: 80, objectFit: "contain" }} />
                      ) : (
                        <div style={{ width: 48, height: 28, background: "#2D0F1E", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 8, color: "#9F6A80" }}>sem logo</span>
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#FAF0F5" }}>{sp.name}</div>
                        {sp.logoUrl && <div style={{ fontSize: 10, color: "#9F6A80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>{sp.logoUrl}</div>}
                      </div>
                      <button
                        onClick={() => sp.id && handleDeleteSponsor(sp.id)}
                        style={{ padding: 6, borderRadius: 6, border: "none", background: "#3A1A1A", cursor: "pointer", display: "flex" }}
                      >
                        <Trash2 size={14} color="#F87171" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new sponsor */}
              <div style={{ padding: 16, border: "1px dashed #3D1A2A", borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#FAF0F5", marginBottom: 14 }}>
                  <Plus size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  Adicionar patrocinador / logo
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Nome *</label>
                  <input style={inputStyle} value={newSponsor.name}
                    onChange={e => setNewSponsor(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Salon Line" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <ImageUpload
                    label="Logo do Patrocinador"
                    value={newSponsor.logoUrl}
                    onChange={url => setNewSponsor(p => ({ ...p, logoUrl: url }))}
                    folder="sponsors"
                    hint="PNG ou SVG transparente recomendado"
                    compact={false}
                  />
                </div>
                <button
                  onClick={handleAddSponsor}
                  disabled={addingSpn || !newSponsor.name.trim()}
                  style={{
                    padding: "9px 18px", borderRadius: 8, border: "none",
                    background: "#C4267A", color: "#fff", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, opacity: addingSpn ? 0.7 : 1,
                  }}
                >
                  {addingSpn ? "Adicionando..." : "Adicionar"}
                </button>
              </div>

              <div style={{ marginTop: 16, fontSize: 12, color: "#6B3A5A" }}>
                Dica: Salve a configuração geral antes de adicionar patrocinadores.
              </div>
            </div>
          )}

          {/* ── Tab: Issued ────────────────────────────────────────────────── */}
          {tab === "issued" && (
            <div style={{ background: "#1A0A12", border: "1px solid #3D1A2A", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "#9F6A80" }}>Total: {certsTotal} certificados</span>
              </div>
              {issuedCerts.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9F6A80", padding: "32px 0", fontSize: 13 }}>
                  Nenhum certificado emitido ainda.
                </p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #3D1A2A" }}>
                      {["Código", "Aluno", "Curso", "Emitido em", ""].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#9F6A80", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {issuedCerts.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #1F0D17" }}>
                        <td style={{ padding: "10px", fontFamily: "monospace", color: "#C4267A", fontSize: 11 }}>{c.code}</td>
                        <td style={{ padding: "10px", color: "#FAF0F5" }}>{c.studentName}</td>
                        <td style={{ padding: "10px", color: "#9F6A80" }}>{c.courseName}</td>
                        <td style={{ padding: "10px", color: "#9F6A80", whiteSpace: "nowrap" }}>
                          {new Date(c.issuedAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/${c.code}/download`}
                            target="_blank" rel="noreferrer"
                            style={{
                              padding: "4px 10px", borderRadius: 6, fontSize: 11,
                              background: "#2D0F1E", color: "#C4267A", textDecoration: "none",
                              fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4,
                            }}
                          >
                            <Eye size={11} /> Ver PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {certsTotal > 20 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                  <button
                    disabled={certsPage === 1}
                    onClick={() => setCertsPage(p => p - 1)}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #3D1A2A", background: "transparent", color: "#9F6A80", cursor: "pointer" }}
                  >Anterior</button>
                  <span style={{ fontSize: 12, color: "#9F6A80", alignSelf: "center" }}>Página {certsPage}</span>
                  <button
                    disabled={certsPage * 20 >= certsTotal}
                    onClick={() => setCertsPage(p => p + 1)}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #3D1A2A", background: "transparent", color: "#9F6A80", cursor: "pointer" }}
                  >Próxima</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div style={{ position: "sticky", top: 24, alignSelf: "flex-start" }}>
          <div style={{ fontSize: 12, color: "#9F6A80", marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Pré-visualização (A4 paisagem)
          </div>
          <CertPreview config={config} />
          <p style={{ fontSize: 11, color: "#6B3A5A", marginTop: 8, textAlign: "center" }}>
            O PDF final é gerado em alta resolução pelo servidor
          </p>
        </div>
      </div>
    </div>
  );
}
