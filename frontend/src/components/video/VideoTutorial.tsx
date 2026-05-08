"use client";

/**
 * VideoTutorial
 *
 * Guia interativo colapsável que explica todas as funcionalidades de vídeo:
 * upload, gravação (câmera, tela, PiP) e edição (trim).
 *
 * Props:
 *  section?: "upload" | "record" | "editor" | "all"
 *    Qual seção mostrar por padrão aberta. "all" mostra o guia completo.
 */

import { useState } from "react";
import {
  HelpCircle, ChevronDown, ChevronUp,
  Upload, Video, Monitor, PictureInPicture2,
  Scissors, AlertTriangle, CheckCircle2,
} from "lucide-react";

const C = {
  rose: "#D4437C",
  roseDark: "#8B1A42",
  bg: "#F8F3F6",
  white: "#FFFFFF",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  green: "#16a34a",
  greenBg: "rgba(22,163,74,0.08)",
  amber: "#d97706",
  amberBg: "rgba(217,119,6,0.08)",
  blue: "#2563eb",
  blueBg: "rgba(37,99,235,0.06)",
};

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  bg: string;
  steps: Step[];
  tip?: string;
  warning?: string;
}

interface Step {
  num: number;
  text: string;
}

const sections: (Section & { id: SectionId })[] = [
  {
    id: "upload",
    icon: <Upload size={16} />,
    title: "Upload de Arquivo",
    color: C.blue,
    bg: C.blueBg,
    steps: [
      { num: 1, text: 'Clique na aba "Upload de arquivo" no modal de vídeo.' },
      { num: 2, text: 'Clique na área pontilhada ou arraste um arquivo de vídeo (MP4, MOV, AVI, WebM — até 2 GB).' },
      { num: 3, text: 'Acompanhe a barra de progresso enquanto o arquivo é enviado em partes.' },
      { num: 4, text: 'Após o envio, o sistema processa automaticamente o vídeo para streaming HLS. Aguarde o status "Vídeo pronto!".' },
      { num: 5, text: 'O vídeo é vinculado à aula automaticamente.' },
    ],
    tip: "Arquivos grandes (>500 MB) podem demorar alguns minutos para processar. A página não precisa ficar aberta — o processamento roda em segundo plano.",
  },
  {
    id: "camera",
    icon: <Video size={16} />,
    title: "Gravar com Câmera",
    color: C.rose,
    bg: `${C.rose}10`,
    steps: [
      { num: 1, text: 'Clique na aba "Gravar vídeo" e selecione o modo "Só a Câmera".' },
      { num: 2, text: 'Clique em "Iniciar gravação de câmera". O navegador pedirá permissão para acessar a câmera e o microfone — clique em Permitir.' },
      { num: 3, text: 'O preview ao vivo aparece na tela. Fale normalmente — sua voz é gravada pelo microfone.' },
      { num: 4, text: 'Clique em "Parar gravação" quando terminar.' },
      { num: 5, text: 'Confira o resultado e clique em "Enviar gravação". O mesmo fluxo de upload/processamento é iniciado.' },
    ],
    tip: "Prefira iluminação frontal (janela ou abajur à frente do rosto) e um ambiente silencioso para melhor qualidade.",
  },
  {
    id: "screen",
    icon: <Monitor size={16} />,
    title: "Gravar a Tela",
    color: C.blue,
    bg: C.blueBg,
    steps: [
      { num: 1, text: 'Clique na aba "Gravar vídeo" e selecione o modo "Só a Tela".' },
      { num: 2, text: 'Clique em "Iniciar gravação de tela". O navegador abre um seletor — escolha qual janela, aba ou monitor compartilhar.' },
      { num: 3, text: 'A gravação começa após a seleção. O microfone é gravado junto (se habilitado).' },
      { num: 4, text: 'Clique em "Parar gravação" ou feche o compartilhamento de tela.' },
      { num: 5, text: 'Envie a gravação normalmente.' },
    ],
    warning: "Gravação de tela exige HTTPS. Se a plataforma estiver em HTTP, esse modo não funciona. Peça ao administrador do servidor para configurar SSL (certificado gratuito via Let's Encrypt).",
  },
  {
    id: "pip",
    icon: <PictureInPicture2 size={16} />,
    title: "Tela + Câmera (PiP)",
    color: C.rose,
    bg: `${C.rose}10`,
    steps: [
      { num: 1, text: 'Clique na aba "Gravar vídeo". O modo padrão já é "Tela + Câmera".' },
      { num: 2, text: 'Escolha a posição da câmera (inferior direito, inferior esquerdo, etc.) e o tamanho (pequena ou grande).' },
      { num: 3, text: 'Opcional: clique em "Testar câmera" para ver o preview antes de gravar.' },
      { num: 4, text: 'Clique em "Iniciar gravação (Tela + Câmera)". O navegador pedirá acesso à câmera e depois abrirá o seletor de tela.' },
      { num: 5, text: 'Você verá a composição em tempo real: sua tela com o rosto sobreposto no canto.' },
      { num: 6, text: 'Clique "Parar" e envie normalmente.' },
    ],
    warning: "Também exige HTTPS. Consulte a seção \"Gravação de Tela\" acima para detalhes.",
    tip: "Posição recomendada para aulas: câmera no canto inferior direito, tamanho pequena (22%). Assim o conteúdo da tela fica bem visível.",
  },
  {
    id: "editor",
    icon: <Scissors size={16} />,
    title: "Editar Vídeo (Cortar)",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.07)",
    steps: [
      { num: 1, text: 'Na lista de aulas, localize a aula com vídeo pronto (status verde "✓ Pronto").' },
      { num: 2, text: 'Clique no botão rosa "▶ Ver / Editar" para abrir o editor.' },
      { num: 3, text: 'Use o player para assistir e encontrar os pontos de corte desejados.' },
      { num: 4, text: 'Arraste o handle da esquerda (▐) na linha do tempo para definir o início do corte, e o da direita para o fim.' },
      { num: 5, text: 'Ou navegue no player até o momento exato e clique "Definir aqui" nos cards de Início ou Fim.' },
      { num: 6, text: 'Dê um nome ao vídeo cortado e clique "Aparar vídeo".' },
      { num: 7, text: 'O sistema cria um novo vídeo processado. O original não é apagado.' },
      { num: 8, text: 'Após o processamento, vincule o novo vídeo à aula usando o botão "Trocar".' },
    ],
    tip: "Você pode fazer vários cortes do mesmo vídeo original. Cada corte vira um vídeo independente que pode ser vinculado a qualquer aula.",
  },
];

type SectionId = "upload" | "camera" | "screen" | "pip" | "editor";

interface Props {
  defaultOpen?: SectionId | null;
}

export function VideoTutorial({ defaultOpen = null }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<SectionId | null>(defaultOpen);

  const toggle = (id: SectionId) => setExpanded(prev => prev === id ? null : id);

  return (
    <div style={{ marginTop: 16 }}>
      {/* Botão principal */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderRadius: 10,
          border: `1.5px solid ${C.border}`,
          background: open ? C.bg : C.white,
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: C.muted }}>
          <HelpCircle size={15} color={C.rose} />
          Como usar? — Guia rápido
        </span>
        {open
          ? <ChevronUp size={15} color={C.muted} />
          : <ChevronDown size={15} color={C.muted} />
        }
      </button>

      {/* Conteúdo do guia */}
      {open && (
        <div style={{
          marginTop: 8, borderRadius: 12,
          border: `1.5px solid ${C.border}`,
          background: C.white, overflow: "hidden",
        }}>
          {sections.map((sec, i) => {
            const isOpen = expanded === sec.id;
            return (
              <div
                key={sec.id}
                style={{ borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : "none" }}
              >
                {/* Cabeçalho da seção */}
                <button
                  onClick={() => toggle(sec.id)}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px",
                    background: isOpen ? sec.bg : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit", transition: "background 0.15s",
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: sec.bg, border: `1.5px solid ${sec.color}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: sec.color,
                  }}>
                    {sec.icon}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.ink }}>
                    {sec.title}
                  </span>
                  {isOpen
                    ? <ChevronUp size={14} color={C.muted} />
                    : <ChevronDown size={14} color={C.muted} />
                  }
                </button>

                {/* Passos */}
                {isOpen && (
                  <div style={{ padding: "0 16px 16px" }}>

                    {/* Aviso (warning) */}
                    {sec.warning && (
                      <div style={{
                        display: "flex", gap: 10, padding: "10px 12px",
                        borderRadius: 8, background: C.amberBg,
                        border: `1px solid ${C.amber}40`, marginBottom: 12,
                      }}>
                        <AlertTriangle size={15} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: C.amber, margin: 0, lineHeight: 1.5 }}>
                          {sec.warning}
                        </p>
                      </div>
                    )}

                    {/* Lista de passos */}
                    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      {sec.steps.map((step) => (
                        <li key={step.num} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            background: sec.bg, border: `1.5px solid ${sec.color}44`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 800, color: sec.color,
                          }}>
                            {step.num}
                          </span>
                          <p style={{ fontSize: 13, color: C.ink, margin: 0, lineHeight: 1.5, paddingTop: 2 }}>
                            {step.text}
                          </p>
                        </li>
                      ))}
                    </ol>

                    {/* Dica */}
                    {sec.tip && (
                      <div style={{
                        display: "flex", gap: 10, padding: "10px 12px",
                        borderRadius: 8, background: C.greenBg,
                        border: `1px solid ${C.green}30`, marginTop: 12,
                      }}>
                        <CheckCircle2 size={15} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: C.green, margin: 0, lineHeight: 1.5 }}>
                          <strong>Dica:</strong> {sec.tip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Rodapé com requisitos gerais */}
          <div style={{
            padding: "12px 16px",
            background: `${C.rose}06`,
            borderTop: `1px solid ${C.border}`,
          }}>
            <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: C.ink }}>Formatos aceitos para upload:</strong> MP4, MOV, AVI, MKV, WebM — até 2 GB. &nbsp;
              <strong style={{ color: C.ink }}>Requisito de gravação de tela:</strong> HTTPS (ou localhost para desenvolvimento).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
