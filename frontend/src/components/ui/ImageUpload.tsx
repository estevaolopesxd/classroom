"use client";

import { useRef, useState, DragEvent } from "react";
import api from "@/lib/api/client";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface Props {
  value: string;           // URL atual
  onChange: (url: string) => void;
  folder?: string;         // subpasta no MinIO: "logos", "signatures", "sponsors"
  label?: string;
  hint?: string;
  maxSizeMb?: number;
  compact?: boolean;       // layout menor (para sponsors em linha)
}

export function ImageUpload({
  value,
  onChange,
  folder = "misc",
  label,
  hint,
  maxSizeMb = 5,
  compact = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Máximo ${maxSizeMb} MB`);
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setError("Use PNG, JPG, GIF, WebP ou SVG");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<{ url: string }>(`/api/uploads/image?folder=${folder}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
    } catch {
      setError("Falha no upload. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (files: FileList | null) => {
    if (files?.[0]) upload(files[0]);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files);
  };

  const height = compact ? 80 : 130;

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label style={{ fontSize: 12, color: "#9F6A80", marginBottom: 6, display: "block", fontWeight: 500 }}>
          {label}
        </label>
      )}

      {/* Drop zone / preview */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          height,
          border: `2px dashed ${dragging ? "#C4267A" : value ? "#2A5A2A" : "#3D1A2A"}`,
          borderRadius: 10,
          background: dragging ? "#1A0A14" : value ? "#0D1A0D" : "#0D0509",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: uploading ? "wait" : "pointer",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        {/* Preview da imagem */}
        {value && !uploading && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="preview"
              style={{
                maxHeight: height - 16,
                maxWidth: "100%",
                objectFit: "contain",
                borderRadius: 6,
              }}
            />
            {/* Overlay no hover */}
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6,
              opacity: 0, transition: "opacity 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
            >
              <Upload size={18} color="#fff" />
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Trocar imagem</span>
            </div>
          </>
        )}

        {/* Estado: uploading */}
        {uploading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Loader2 size={22} color="#C4267A" style={{ animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 11, color: "#9F6A80" }}>Enviando...</span>
          </div>
        )}

        {/* Estado: vazio */}
        {!value && !uploading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 6 : 10 }}>
            {compact ? (
              <ImageIcon size={20} color="#3D1A2A" />
            ) : (
              <>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "#1A0A12", border: "1px solid #3D1A2A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Upload size={18} color="#9F6A80" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: "#FAF0F5", fontWeight: 500 }}>
                    Clique ou arraste a imagem
                  </span>
                  <br />
                  <span style={{ fontSize: 11, color: "#6B3A5A" }}>
                    PNG, JPG, SVG, WebP — máx. {maxSizeMb} MB
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files)}
        />
      </div>

      {/* Remover + erro */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <div>
          {error && <span style={{ fontSize: 11, color: "#F87171" }}>{error}</span>}
          {hint && !error && <span style={{ fontSize: 11, color: "#6B3A5A" }}>{hint}</span>}
        </div>
        {value && !uploading && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(""); }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 5, border: "none",
              background: "#3A1A1A", cursor: "pointer",
              fontSize: 11, color: "#F87171",
            }}
          >
            <X size={11} /> Remover
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
