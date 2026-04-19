"use client";

import { useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  X,
  Loader2,
  Trash2,
  UserCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { ForumPost, ForumReplyDoc, UserRole } from "@/models/types";

const REPLY_EMOJIS = ["🌱", "💧", "👍", "👎", "❤️", "🙂", "🌾", "☀️"];
const ANON_AVATAR =
  "https://ui-avatars.com/api/?background=64748b&color=fff&name=A&rounded=true&size=128";

function organizeForumReplies(flat: ForumReplyDoc[]) {
  const roots = flat.filter((r) => !r.parentReplyId);
  const children: Record<string, ForumReplyDoc[]> = {};
  flat.forEach((r) => {
    const pid = r.parentReplyId;
    if (pid) {
      if (!children[pid]) children[pid] = [];
      children[pid].push(r);
    }
  });
  Object.keys(children).forEach((k) => {
    children[k].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  });
  roots.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  return { roots, children };
}

type ProfileModal =
  | { kind: "post"; post: ForumPost }
  | { kind: "reply"; reply: ForumReplyDoc; postTitle: string }
  | null;

export function ForumView({
  t,
  isRTL,
  posts,
  repliesByPostId,
  onVote,
  onVoteReply,
  onReport,
  onCreatePost,
  onAddReply,
  onDeletePost,
  userUid,
  onDeleteReply,
  currentUserLabel,
  viewerRole,
  isAdmin = false,
}: {
  t: (fr: string, ar: string) => string;
  isRTL: boolean;
  posts: ForumPost[];
  repliesByPostId: Record<string, ForumReplyDoc[]>;
  onVote: (postId: string, type: "like" | "dislike") => void;
  onVoteReply?: (postId: string, replyId: string, type: "like" | "dislike") => void;
  onReport: (post: ForumPost, reason: string) => void | Promise<void>;
  onCreatePost?: (input: { title: string; content: string; tags: string[]; anonymous: boolean }) => Promise<void>;
  onAddReply: (
    postId: string,
    payload: { text: string; emoji?: string; anonymous: boolean; parentReplyId?: string },
  ) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
  userUid?: string;
  onDeleteReply?: (postId: string, replyId: string) => Promise<void>;
  currentUserLabel?: string;
  viewerRole: UserRole;
  isAdmin?: boolean;
}) {
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newAnonymous, setNewAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<{ title?: string; content?: string }>({});
  const [createSubmitError, setCreateSubmitError] = useState<string | null>(null);

  const [replyDraft, setReplyDraft] = useState<Record<string, { text: string; emoji: string; anonymous: boolean }>>({});
  const [replySending, setReplySending] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingReplyKey, setDeletingReplyKey] = useState<string | null>(null);
  const [profileModal, setProfileModal] = useState<ProfileModal>(null);
  const [reportPost, setReportPost] = useState<ForumPost | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  function roleLabel(role: UserRole): string {
    if (role === "ADMIN") return t("Administrateur", "مسؤول");
    if (role === "FARMER") return t("Agriculteur", "فلاح");
    return t("Citoyen", "مواطن");
  }

  function displayPostAuthor(post: ForumPost): string {
    if (post.anonymous && !isAdmin) return t("Anonyme", "مجهول");
    return post.author;
  }

  function displayPostAvatar(post: ForumPost): string {
    if (post.anonymous && !isAdmin) return ANON_AVATAR;
    return post.avatar;
  }

  function displayReplyAuthor(r: ForumReplyDoc): string {
    if (r.anonymous && !isAdmin) return t("Anonyme", "مجهول");
    return r.authorName;
  }

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    if (sortBy === "popular") {
      copy.sort((a, b) => b.likes - a.likes || new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return copy;
  }, [posts, sortBy]);

  async function submitCreate() {
    setCreateErrors({});
    setCreateSubmitError(null);
    const title = newTitle.trim();
    const content = newContent.trim();
    const err: { title?: string; content?: string } = {};
    if (title.length < 3) err.title = t("Titre trop court (3 car. min).", "عنوان قصير جداً.");
    if (title.length > 200) err.title = t("Titre trop long (200 max).", "عنوان طويل جداً.");
    if (content.length < 5) err.content = t("Message trop court (5 car. min).", "النص قصير جداً.");
    if (content.length > 8000) err.content = t("Message trop long.", "النص طويل جداً.");
    if (Object.keys(err).length) {
      setCreateErrors(err);
      return;
    }
    if (!onCreatePost) return;
    const tags = newTags
      .split(/[,#]/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.startsWith("#") ? s : `#${s}`));
    setCreating(true);
    try {
      await onCreatePost({ title, content, tags: tags.length ? tags : ["#Gabès"], anonymous: newAnonymous });
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setNewAnonymous(false);
      setShowCreate(false);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "permission-denied"
          ? t(
              "Publication refusée (règles Firestore ou profil). Vérifiez que vous êtes connecté et que les règles sont déployées.",
              "رفض النشر (قواعد فايربيس). تحقق من الاتصال ونشر القواعد.",
            )
          : e instanceof Error
            ? e.message
            : t("Impossible de publier. Réessayez.", "تعذر النشر.");
      setCreateSubmitError(msg);
    } finally {
      setCreating(false);
    }
  }

  function replyDraftKey(postId: string, parentReplyId?: string | null) {
    return parentReplyId ? `${postId}::${parentReplyId}` : postId;
  }

  async function submitReply(postId: string, parentReplyId?: string | null) {
    const key = replyDraftKey(postId, parentReplyId);
    const draft = replyDraft[key] || { text: "", emoji: "", anonymous: false };
    const text = draft.text.trim();
    const emoji = draft.emoji.trim();
    if (!text && !emoji) return;
    if (text.length > 2000) return;
    setReplySending(key);
    try {
      await onAddReply(postId, {
        text,
        emoji: emoji || undefined,
        anonymous: draft.anonymous,
        ...(parentReplyId ? { parentReplyId } : {}),
      });
      setReplyDraft((p) => ({ ...p, [key]: { text: "", emoji: "", anonymous: false } }));
    } finally {
      setReplySending(null);
    }
  }

  function mergeReplyDraft(
    postId: string,
    partial: Partial<{ text: string; emoji: string; anonymous: boolean }>,
    parentReplyId?: string | null,
  ) {
    const key = replyDraftKey(postId, parentReplyId);
    setReplyDraft((p) => ({
      ...p,
      [key]: {
        text: partial.text !== undefined ? partial.text : (p[key]?.text ?? ""),
        emoji: partial.emoji !== undefined ? partial.emoji : (p[key]?.emoji ?? ""),
        anonymous: partial.anonymous !== undefined ? partial.anonymous : (p[key]?.anonymous ?? false),
      },
    }));
  }

  const profilePortal =
    profileModal && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={() => setProfileModal(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-100 shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-zinc-900 uppercase flex items-center gap-2">
                  <UserCircle className="text-emerald-600" size={22} />
                  {t("Profil", "الملف")}
                </h3>
                <button type="button" onClick={() => setProfileModal(null)} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500">
                  <X size={20} />
                </button>
              </div>
              {profileModal.kind === "post" ? (
                <PostProfileBody t={t} post={profileModal.post} isAdmin={!!isAdmin} roleLabel={roleLabel} />
              ) : (
                <ReplyProfileBody t={t} reply={profileModal.reply} isAdmin={!!isAdmin} roleLabel={roleLabel} postTitle={profileModal.postTitle} />
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  const reportPortal =
    reportPost && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={() => !reportSending && setReportPost(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-100 shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-zinc-900 uppercase flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={22} />
                {t("Signaler cette publication", "تبليغ عن هذا المنشور")}
              </h3>
              <p className="text-xs text-zinc-600 font-bold leading-relaxed">
                {t(
                  "Un message sera envoyé à l’administration avec le titre du post, votre compte et le motif ci-dessous.",
                  "سيتم إرسال تنبيه للإدارة يتضمن عنوان المنشور وحسابك والسبب أدناه.",
                )}
              </p>
              <p className="text-[11px] font-black text-zinc-800 line-clamp-2">{reportPost.title}</p>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400">{t("Motif (optionnel)", "السبب (اختياري)")}</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={t("Ex. contenu offensant, spam…", "مثال: محتوى مسيء، إزعاج…")}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold resize-none"
                />
              </div>
              {reportError ? <p className="text-xs font-bold text-red-600">{reportError}</p> : null}
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <button
                  type="button"
                  disabled={reportSending}
                  onClick={() => {
                    if (!reportSending) setReportPost(null);
                  }}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-[10px] font-black uppercase text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {t("Annuler", "إلغاء")}
                </button>
                <button
                  type="button"
                  disabled={reportSending}
                  onClick={() => {
                    void (async () => {
                      if (!reportPost) return;
                      setReportSending(true);
                      setReportError(null);
                      try {
                        await onReport(reportPost, reportReason);
                        setReportPost(null);
                        setReportReason("");
                      } catch {
                        setReportError(t("Envoi impossible. Réessayez.", "تعذر الإرسال."));
                      } finally {
                        setReportSending(false);
                      }
                    })();
                  }}
                  className="rounded-xl bg-red-600 text-white px-4 py-2 text-[10px] font-black uppercase hover:bg-red-700 disabled:opacity-50"
                >
                  {reportSending ? t("Envoi…", "جاري الإرسال…") : t("Envoyer le signalement", "إرسال التبليغ")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-8 pb-12 relative">
      {profilePortal}
      {reportPortal}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{t("Forum", "المنتدى")}</h2>
          <p className="text-zinc-500 font-bold mt-2">
            {t("Discussions ouvertes à tous les utilisateurs connectés.", "نقاشات مفتوحة لكل المستخدمين.")}
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="flex bg-white/60 p-1 rounded-full border border-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setSortBy("newest")}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all",
                sortBy === "newest" ? "bg-zinc-900 text-white" : "text-zinc-400",
              )}
            >
              {t("Récent", "الأحدث")}
            </button>
            <button
              type="button"
              onClick={() => setSortBy("popular")}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all",
                sortBy === "popular" ? "bg-zinc-900 text-white" : "text-zinc-400",
              )}
            >
              {t("Populaire", "الأكثر شعبية")}
            </button>
          </div>
          {onCreatePost ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="p-3 bg-emerald-500 text-white rounded-[1.5rem] shadow-lg shadow-emerald-500/20 flex items-center gap-3 px-6 hover:bg-emerald-600 transition-colors"
            >
              <PlusCircle size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t("Publier", "نشر")}</span>
            </button>
          ) : null}
        </div>
      </div>

      {showCreate && onCreatePost && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="forum-new-post-title"
            >
              <form
                className="w-full max-w-lg bg-white rounded-3xl border border-zinc-100 shadow-2xl p-8 space-y-4 max-h-[90vh] overflow-y-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitCreate();
                }}
              >
                <div className="flex justify-between items-center">
                  <h3 id="forum-new-post-title" className="text-lg font-black text-zinc-900 uppercase">
                    {t("Nouvelle publication", "منشور جديد")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setCreateSubmitError(null);
                    }}
                    className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                {createSubmitError ? <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl px-3 py-2">{createSubmitError}</p> : null}
                {currentUserLabel ? <p className="text-xs text-zinc-500 font-bold">{currentUserLabel}</p> : null}
                <p className="text-[10px] font-bold text-zinc-500">
                  {t("Votre rôle affiché :", "دورك المعروض:")} <span className="text-emerald-700">({roleLabel(viewerRole)})</span>
                </p>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newAnonymous}
                    onChange={(e) => setNewAnonymous(e.target.checked)}
                    className="mt-1 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <span className="text-sm font-black text-zinc-900 block">{t("Publier en anonyme", "نشر بشكل مجهول")}</span>
                    <span className="text-[11px] font-medium text-zinc-500 leading-snug">
                      {t(
                        "Votre nom et e-mail seront masqués pour les autres. L’administration peut toujours consulter les données techniques (modération).",
                        "يُخفى الاسم والبريد عن الآخرين. الإدارة قد ترى البيانات الفنية للمراجعة.",
                      )}
                    </span>
                  </span>
                </label>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400">{t("Titre", "العنوان")}</label>
                  <input
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      setCreateErrors((c) => ({ ...c, title: undefined }));
                    }}
                    className={cn(
                      "mt-1 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30",
                      createErrors.title ? "border-red-300" : "border-zinc-200",
                    )}
                    maxLength={200}
                  />
                  {createErrors.title ? <p className="text-xs text-red-600 mt-1">{createErrors.title}</p> : null}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400">{t("Contenu", "المحتوى")}</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => {
                      setNewContent(e.target.value);
                      setCreateErrors((c) => ({ ...c, content: undefined }));
                    }}
                    rows={5}
                    className={cn(
                      "mt-1 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none",
                      createErrors.content ? "border-red-300" : "border-zinc-200",
                    )}
                    maxLength={8000}
                  />
                  {createErrors.content ? <p className="text-xs text-red-600 mt-1">{createErrors.content}</p> : null}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400">{t("Tags (séparés par virgule)", "وسوم (مفصولة بفاصلة)")}</label>
                  <input
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="#Oasis, #Gabès"
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim() || !newContent.trim()}
                  className="w-full py-4 rounded-xl bg-zinc-900 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="animate-spin" size={18} /> : null}
                  {t("Publier", "نشر")}
                </button>
              </form>
            </div>,
            document.body,
          )
        : null}

      <div className="space-y-6">
        {sortedPosts.length === 0 ? (
          <p className="text-center text-sm font-bold text-zinc-500 py-16">{t("Aucun message pour le moment.", "لا توجد منشورات بعد.")}</p>
        ) : null}
        {sortedPosts.map((post) => {
          const replies: ForumReplyDoc[] = repliesByPostId[post.id] ?? [];
          return (
            <motion.div
              key={post.id}
              className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl group hover:bg-white transition-all"
            >
              <div className="flex justify-between items-start mb-6 gap-4">
                <button
                  type="button"
                  onClick={() => setProfileModal({ kind: "post", post })}
                  className="flex items-center gap-4 min-w-0 text-left rounded-2xl p-2 -m-2 hover:bg-zinc-50/80 transition-colors"
                >
                  <img src={displayPostAvatar(post)} className="w-12 h-12 rounded-2xl object-cover shadow-sm shrink-0" alt="" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-zinc-900 uppercase tracking-tight truncate">
                      {displayPostAuthor(post)}{" "}
                      <span className="text-zinc-500 font-bold normal-case">({roleLabel(post.authorRole)})</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mt-0.5">
                      {t("Voir le profil", "عرض الملف")}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(post.date).toLocaleString()}</p>
                  </div>
                </button>
                <div className="flex flex-wrap gap-2 justify-end items-start">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[9px] font-black rounded-full uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                  {isAdmin && onDeletePost ? (
                    <button
                      type="button"
                      disabled={deletingId === post.id}
                      onClick={async () => {
                        if (!confirm(t("Supprimer ce post et ses réponses ?", "حذف المنشور والردود؟"))) return;
                        setDeletingId(post.id);
                        try {
                          await onDeletePost(post.id);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      title={t("Supprimer (admin)", "حذف (إدارة)")}
                    >
                      {deletingId === post.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    </button>
                  ) : null}
                </div>
              </div>

              <h3 className="text-2xl font-black text-zinc-900 mb-4 leading-tight uppercase tracking-tighter">{post.title}</h3>
              <p className="text-zinc-600 font-medium leading-relaxed mb-8 whitespace-pre-wrap">{post.content}</p>

              <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-4 bg-zinc-50 p-2 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => onVote(post.id, "like")}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-xl transition-all text-emerald-600"
                  >
                    <ArrowUp size={18} className="font-bold" />
                    <span className="text-xs font-black">{post.likes}</span>
                  </button>
                  <div className="w-px h-4 bg-zinc-200" />
                  <button
                    type="button"
                    onClick={() => onVote(post.id, "dislike")}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-xl transition-all text-red-500"
                  >
                    <ArrowDown size={18} className="font-bold" />
                    <span className="text-xs font-black">{post.dislikes}</span>
                  </button>
                </div>

                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-3 text-zinc-500">
                    <MessageSquare size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {replies.length} {t("Réponses", "ردود")}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReportError(null);
                      setReportReason("");
                      setReportPost(post);
                    }}
                    className="flex items-center gap-3 text-zinc-300 hover:text-red-500 transition-colors"
                  >
                    <AlertTriangle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t("Signaler", "تبليغ")}</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-4 border-t border-zinc-100 pt-6">
                {(() => {
                  const { roots, children } = organizeForumReplies(replies);
                  function renderReplyNode(r: ForumReplyDoc, depth: number): ReactNode {
                    const kids = children[r.id] ?? [];
                    const rk = replyDraftKey(post.id, r.id);
                    return (
                      <div
                        key={r.id}
                        className={cn(
                          "rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4",
                          isRTL && "text-right",
                          depth > 0 && "ms-2 sm:ms-5 mt-2 border-s-2 border-emerald-200/80 ps-3",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setProfileModal({ kind: "reply", reply: r, postTitle: post.title })}
                          className="flex flex-wrap items-center gap-2 mb-2 text-left rounded-xl p-1 -m-1 hover:bg-white/60 w-full"
                        >
                          <span className="text-[10px] font-black text-zinc-900 uppercase">
                            {displayReplyAuthor(r)} <span className="text-zinc-500">({roleLabel(r.authorRole)})</span>
                          </span>
                          <span className="text-[8px] text-emerald-700 font-bold uppercase">{t("Profil", "ملف")}</span>
                          <span className="text-[8px] text-zinc-400 font-bold uppercase ms-auto">
                            {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                          </span>
                          {r.emoji ? <span className="text-lg" aria-hidden>{r.emoji}</span> : null}
                        </button>
                        {r.text.trim() ? <p className="text-xs text-zinc-700 font-medium whitespace-pre-wrap">{r.text}</p> : null}
                        {(() => {
                          const showVotes = Boolean(onVoteReply);
                          const showDel = Boolean(onDeleteReply && userUid && (r.authorUid === userUid || isAdmin));
                          if (!showVotes && !showDel) return null;
                          return (
                            <div
                              className={cn(
                                "flex flex-wrap items-center gap-3 mt-3",
                                showVotes && showDel ? "justify-between" : showDel ? "justify-end" : "justify-start",
                              )}
                            >
                              {showVotes && onVoteReply ? (
                                <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2 border border-zinc-100 w-fit">
                                  <button
                                    type="button"
                                    onClick={() => onVoteReply(post.id, r.id, "like")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 text-[10px] font-black"
                                  >
                                    <ArrowUp size={16} />
                                    {r.likes}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onVoteReply(post.id, r.id, "dislike")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-[10px] font-black"
                                  >
                                    <ArrowDown size={16} />
                                    {r.dislikes}
                                  </button>
                                </div>
                              ) : null}
                              {showDel && onDeleteReply ? (
                              <button
                                type="button"
                                title={t("Supprimer ce commentaire", "حذف هذا التعليق")}
                                disabled={deletingReplyKey === `${post.id}::${r.id}`}
                                onClick={async () => {
                                  if (!onDeleteReply) return;
                                  const key = `${post.id}::${r.id}`;
                                  setDeletingReplyKey(key);
                                  try {
                                    await onDeleteReply(post.id, r.id);
                                  } catch (e) {
                                    const msg =
                                      e instanceof Error && e.message === "forum_reply_has_other_authors"
                                        ? t(
                                            "Impossible de supprimer tout le fil : d'autres personnes ont répondu. Un administrateur peut supprimer la branche entière.",
                                            "تعذر حذف السلسلة بالكامل لأن مستخدمين آخرين ردوا. يمكن للمسؤول حذف الفرع كاملاً.",
                                          )
                                        : e instanceof Error
                                          ? e.message
                                          : t("Suppression impossible.", "تعذر الحذف.");
                                    window.alert(msg);
                                  } finally {
                                    setDeletingReplyKey(null);
                                  }
                                }}
                                className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 shrink-0"
                              >
                                {deletingReplyKey === `${post.id}::${r.id}` ? (
                                  <Loader2 className="animate-spin" size={16} />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                              ) : null}
                            </div>
                          );
                        })()}
                        <div className="mt-3 rounded-xl border border-emerald-100/80 bg-emerald-50/40 p-3 space-y-2">
                          <p className="text-[9px] font-black uppercase text-emerald-800">{t("Répondre à ce commentaire", "رد على هذا التعليق")}</p>
                          <textarea
                            value={replyDraft[rk]?.text ?? ""}
                            onChange={(e) => mergeReplyDraft(post.id, { text: e.target.value }, r.id)}
                            rows={2}
                            maxLength={2000}
                            placeholder={t("Votre réponse…", "ردك…")}
                            className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-bold resize-none"
                          />
                          <div className="flex flex-wrap items-center gap-2 justify-between">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={replyDraft[rk]?.anonymous ?? false}
                                onChange={(e) => mergeReplyDraft(post.id, { anonymous: e.target.checked }, r.id)}
                                className="rounded border-zinc-300 text-emerald-600"
                              />
                              <span className="text-[10px] font-bold text-zinc-600">{t("Anonyme", "مجهول")}</span>
                            </label>
                            <button
                              type="button"
                              disabled={
                                replySending === rk || (!(replyDraft[rk]?.text ?? "").trim() && !(replyDraft[rk]?.emoji ?? "").trim())
                              }
                              onClick={() => void submitReply(post.id, r.id)}
                              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[9px] font-black uppercase disabled:opacity-40"
                            >
                              {replySending === rk ? <Loader2 className="animate-spin" size={14} /> : t("Répondre", "رد")}
                            </button>
                          </div>
                        </div>
                        {kids.length > 0 ? <div className="space-y-2 mt-2">{kids.map((k) => renderReplyNode(k, depth + 1))}</div> : null}
                      </div>
                    );
                  }
                  return (
                    <>
                      {roots.map((r) => renderReplyNode(r, 0))}
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase text-emerald-800">{t("Répondre au fil", "رد على المنشور")}</p>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={replyDraft[post.id]?.anonymous ?? false}
                            onChange={(e) => mergeReplyDraft(post.id, { anonymous: e.target.checked })}
                            className="mt-0.5 rounded border-zinc-300 text-emerald-600"
                          />
                          <span className="text-[11px] font-bold text-zinc-700">{t("Réponse anonyme", "رد مجهول")}</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {REPLY_EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              className={cn(
                                "text-xl p-1.5 rounded-lg hover:bg-white/80 transition-colors",
                                (replyDraft[post.id]?.emoji || "") === em ? "ring-2 ring-emerald-400 bg-white" : "",
                              )}
                              onClick={() => mergeReplyDraft(post.id, { emoji: em })}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={replyDraft[post.id]?.text ?? ""}
                          onChange={(e) => mergeReplyDraft(post.id, { text: e.target.value })}
                          rows={2}
                          maxLength={2000}
                          placeholder={t("Votre message…", "رسالتك…")}
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold resize-none"
                        />
                        <button
                          type="button"
                          disabled={
                            replySending === post.id ||
                            (!(replyDraft[post.id]?.text ?? "").trim() && !(replyDraft[post.id]?.emoji ?? "").trim())
                          }
                          onClick={() => void submitReply(post.id, null)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase disabled:opacity-40"
                        >
                          {replySending === post.id ? <Loader2 className="animate-spin" size={16} /> : null}
                          {t("Envoyer la réponse", "إرسال")}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PostProfileBody({
  t,
  post,
  isAdmin,
  roleLabel,
}: {
  t: (fr: string, ar: string) => string;
  post: ForumPost;
  isAdmin: boolean;
  roleLabel: (r: UserRole) => string;
}) {
  const showIdentity = !post.anonymous || isAdmin;
  return (
    <div className="space-y-3 text-sm">
      <p className="text-[10px] font-black uppercase text-zinc-400">{t("Publication", "منشور")}</p>
      <p className="font-bold text-zinc-900">{post.title}</p>
      <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3 space-y-2 text-xs">
        <p>
          <span className="font-black text-zinc-500">{t("Rôle", "الدور")}:</span>{" "}
          <span className="font-bold text-zinc-900">({roleLabel(post.authorRole)})</span>
        </p>
        {showIdentity ? (
          <>
            <p>
              <span className="font-black text-zinc-500">{t("Nom affiché", "الاسم")}:</span>{" "}
              <span className="font-medium text-zinc-800 break-all">{post.author}</span>
            </p>
            <p>
              <span className="font-black text-zinc-500">{t("E-mail", "البريد")}:</span>{" "}
              <span className="font-medium text-zinc-800 break-all">{post.authorEmail || "—"}</span>
            </p>
            <p>
              <span className="font-black text-zinc-500">UID:</span>{" "}
              <span className="font-mono text-[10px] text-zinc-600 break-all">{post.authorUid || "—"}</span>
            </p>
          </>
        ) : (
          <p className="text-zinc-600 font-medium leading-relaxed">
            {t(
              "Auteur anonyme : nom et e-mail masqués. Le type de compte reste indiqué entre parenthèses sur le forum.",
              "كاتب مجهول: الاسم والبريد مخفيان. نوع الحساب يظهر بين قوسين في المنتدى.",
            )}
          </p>
        )}
        {post.anonymous && isAdmin ? (
          <p className="text-[10px] font-bold text-violet-700 bg-violet-50 rounded-lg px-2 py-1.5">
            {t("Vue administrateur : données complètes.", "عرض إداري: بيانات كاملة.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ReplyProfileBody({
  t,
  reply,
  isAdmin,
  roleLabel,
  postTitle,
}: {
  t: (fr: string, ar: string) => string;
  reply: ForumReplyDoc;
  isAdmin: boolean;
  roleLabel: (r: UserRole) => string;
  postTitle: string;
}) {
  const showIdentity = !reply.anonymous || isAdmin;
  return (
    <div className="space-y-3 text-sm">
      <p className="text-[10px] font-black uppercase text-zinc-400">{t("Réponse sur", "رد على")}</p>
      <p className="font-bold text-zinc-900 line-clamp-2">{postTitle}</p>
      <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3 space-y-2 text-xs">
        <p>
          <span className="font-black text-zinc-500">{t("Rôle", "الدور")}:</span>{" "}
          <span className="font-bold text-zinc-900">({roleLabel(reply.authorRole)})</span>
        </p>
        {showIdentity ? (
          <>
            <p>
              <span className="font-black text-zinc-500">{t("Nom affiché", "الاسم")}:</span>{" "}
              <span className="font-medium text-zinc-800 break-all">{reply.authorName}</span>
            </p>
            <p>
              <span className="font-black text-zinc-500">{t("E-mail", "البريد")}:</span>{" "}
              <span className="font-medium text-zinc-800 break-all">{reply.authorEmail || "—"}</span>
            </p>
            <p>
              <span className="font-black text-zinc-500">UID:</span>{" "}
              <span className="font-mono text-[10px] text-zinc-600 break-all">{reply.authorUid || "—"}</span>
            </p>
          </>
        ) : (
          <p className="text-zinc-600 font-medium leading-relaxed">
            {t("Réponse anonyme : identité masquée pour les autres utilisateurs.", "رد مجهول: الهوية مخفية للآخرين.")}
          </p>
        )}
        {reply.anonymous && isAdmin ? (
          <p className="text-[10px] font-bold text-violet-700 bg-violet-50 rounded-lg px-2 py-1.5">
            {t("Vue administrateur : données complètes.", "عرض إداري: بيانات كاملة.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
