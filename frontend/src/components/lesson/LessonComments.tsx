"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { MessageSquare, Send, Reply, Trash2, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Author { id: string; fullName: string; avatarUrl?: string }

interface Comment {
  id: string;
  lessonId: string;
  author: Author;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
}

const S = {
  rose: "#D4437C",
  ink: "#1A0A12",
  muted: "#8B6676",
  border: "#EDCFDE",
  bg: "#F8F3F6",
  white: "#FFFFFF",
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ author, size = 32 }: { author: Author; size?: number }) {
  return author.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={author.avatarUrl} alt={author.fullName}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${S.rose}, #8B1A42)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color: "white",
    }}>
      {author.fullName.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Single comment (recursive for replies) ────────────────────────────────────
function CommentItem({
  comment, currentUserId, isAdmin, lessonId, onDeleted, onReplied, depth = 0,
}: {
  comment: Comment; currentUserId?: string; isAdmin?: boolean;
  lessonId: string; onDeleted: (id: string) => void;
  onReplied: (reply: Comment, parentId: string) => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const canDelete = currentUserId === comment.author.id || isAdmin;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<Comment>(
        `/api/lessons/${lessonId}/comments`,
        { content: replyText.trim(), parentId: comment.id }
      );
      onReplied(data, comment.id);
      setReplyText("");
      setReplying(false);
      setShowReplies(true);
    } catch { /* silencioso */ } finally { setSubmitting(false); }
  };

  const deleteComment = async () => {
    if (!confirm("Deletar este comentário?")) return;
    try {
      await api.delete(`/api/lessons/${lessonId}/comments/${comment.id}`);
      onDeleted(comment.id);
    } catch { /* silencioso */ }
  };

  return (
    <div style={{ marginLeft: depth > 0 ? 40 : 0, marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Avatar author={comment.author} size={depth > 0 ? 28 : 34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Bubble */}
          <div style={{
            background: depth > 0 ? S.white : S.bg,
            border: `1px solid ${S.border}`, borderRadius: 12,
            padding: "10px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: S.ink }}>{comment.author.fullName}</span>
              <span style={{ fontSize: 11, color: S.muted }}>{fmtDate(comment.createdAt)}</span>
            </div>
            <p style={{ fontSize: 14, color: S.ink, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 5, paddingLeft: 4 }}>
            {depth === 0 && currentUserId && (
              <button
                onClick={() => setReplying(!replying)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: S.muted, fontFamily: "inherit" }}
              >
                <Reply size={13} /> Responder
              </button>
            )}
            {canDelete && (
              <button
                onClick={deleteComment}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#dc2626", fontFamily: "inherit" }}
              >
                <Trash2 size={13} /> Excluir
              </button>
            )}
            {comment.replies.length > 0 && depth === 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: S.rose, fontFamily: "inherit", marginLeft: "auto" }}
              >
                {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {comment.replies.length} resposta{comment.replies.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* Reply box */}
          {replying && (
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitReply(); }}
                placeholder="Escreva sua resposta... (Ctrl+Enter para enviar)"
                rows={2}
                autoFocus
                style={{
                  flex: 1, resize: "none", border: `1.5px solid ${S.border}`, borderRadius: 8,
                  padding: "8px 12px", fontSize: 13, color: S.ink, background: S.white,
                  outline: "none", fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  onClick={submitReply}
                  disabled={submitting || !replyText.trim()}
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "none",
                    background: S.rose, color: "white", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, opacity: submitting ? 0.7 : 1,
                  }}
                >
                  <Send size={14} />
                </button>
                <button
                  onClick={() => { setReplying(false); setReplyText(""); }}
                  style={{ padding: "6px", borderRadius: 8, border: `1px solid ${S.border}`, background: "transparent", cursor: "pointer", fontSize: 11, color: S.muted }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {showReplies && comment.replies.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {comment.replies.map(r => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  lessonId={lessonId}
                  onDeleted={onDeleted}
                  onReplied={onReplied}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LessonComments({ lessonId }: { lessonId: string }) {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get<Comment[]>(`/api/lessons/${lessonId}/comments`, { params: { page: p, pageSize: 20 } });
      setComments(p === 1 ? res.data : prev => [...prev, ...res.data]);
      setTotal(parseInt(res.headers["x-total-count"] || "0"));
      setPage(p);
    } catch { /* silencioso */ } finally { setLoading(false); }
  }, [lessonId]);

  useEffect(() => { load(1); }, [load]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<Comment>(`/api/lessons/${lessonId}/comments`, { content: text.trim() });
      setComments(prev => [data, ...prev]);
      setTotal(t => t + 1);
      setText("");
    } catch { /* silencioso */ } finally { setSubmitting(false); }
  };

  const handleDeleted = (id: string) => {
    setComments(prev => {
      // Remove from top-level or from replies
      return prev
        .filter(c => c.id !== id)
        .map(c => ({ ...c, replies: c.replies.filter(r => r.id !== id) }));
    });
    setTotal(t => t - 1);
  };

  const handleReplied = (reply: Comment, parentId: string) => {
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
    ));
  };

  const hasMore = comments.length < total;

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${S.border}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <MessageSquare size={18} color={S.rose} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: S.ink, margin: 0 }}>
          Comentários {total > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: S.muted }}>({total})</span>}
        </h3>
      </div>

      {/* New comment box */}
      {isAuthenticated ? (
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <Avatar author={{ id: user!.id, fullName: user!.firstName + " " + user!.lastName, avatarUrl: user?.avatarUrl }} />
          <div style={{ flex: 1 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
              placeholder="Faça uma pergunta ou deixe um comentário... (Ctrl+Enter para enviar)"
              rows={3}
              style={{
                width: "100%", resize: "none", border: `1.5px solid ${S.border}`, borderRadius: 10,
                padding: "10px 14px", fontSize: 14, color: S.ink, background: S.white,
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = S.rose)}
              onBlur={e => (e.target.style.borderColor = S.border)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <button
                onClick={handleSubmit}
                disabled={submitting || !text.trim()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 8, border: "none",
                  background: S.rose, color: "white", cursor: submitting ? "wait" : "pointer",
                  fontSize: 13, fontWeight: 600, opacity: (submitting || !text.trim()) ? 0.6 : 1,
                  fontFamily: "inherit",
                }}
              >
                <Send size={14} /> Enviar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "14px 18px", background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10, marginBottom: 20, fontSize: 13, color: S.muted }}>
          <a href="/login" style={{ color: S.rose, fontWeight: 600 }}>Faça login</a> para participar da discussão.
        </div>
      )}

      {/* List */}
      {loading && comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: S.muted, fontSize: 13 }}>Carregando...</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: S.muted, fontSize: 14 }}>
          Seja o primeiro a comentar nesta aula! 💬
        </div>
      ) : (
        <>
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={user?.id}
              isAdmin={user?.role === "Admin"}
              lessonId={lessonId}
              onDeleted={handleDeleted}
              onReplied={handleReplied}
            />
          ))}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => load(page + 1)}
                disabled={loading}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${S.border}`,
                  background: "white", color: S.muted, cursor: "pointer", fontSize: 13,
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Carregando..." : `Ver mais (${total - comments.length} restantes)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
