"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Send, Loader2, User, Mail, Fingerprint } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import {
  createReclamation,
  replyToReclamation,
  subscribeMyReclamations,
  subscribeReclamations,
  updateReclamationStatus,
} from "@/lib/firebase/appContentRepos";
import type { ReclamationDoc } from "@/models/types";

export function SpaceReclamationView({
  t,
  variant,
  userUid,
  userEmail,
}: {
  t: (fr: string, ar: string) => string;
  variant: "citizen" | "admin";
  userUid?: string | null;
  userEmail?: string | null;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [list, setList] = useState<ReclamationDoc[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ subject?: string; body?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [adminReplyDraft, setAdminReplyDraft] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyBanner, setReplyBanner] = useState<{ rowId: string; kind: "ok" | "err"; msg?: string } | null>(null);

  function statusLabel(s: ReclamationDoc["status"]): string {
    if (s === "open") return t("Ouverte", "مفتوحة");
    if (s === "in_progress") return t("En cours", "قيد المعالجة");
    return t("Clôturée", "مغلقة");
  }

  useEffect(() => {
    if (variant === "admin") {
      return subscribeReclamations(setList);
    }
    if (userUid) {
      return subscribeMyReclamations(userUid, setList);
    }
    return undefined;
  }, [variant, userUid]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    if (!userUid || !userEmail) return;

    const sub = subject.trim();
    const b = body.trim();
    const err: { subject?: string; body?: string } = {};
    if (sub.length < 3) err.subject = t("Objet trop court (3 car. min).", "موضوع قصير جداً.");
    if (sub.length > 200) err.subject = t("Objet trop long (200 max).", "موضوع طويل جداً.");
    if (b.length < 10) err.body = t("Description trop courte (10 car. min).", "وصف قصير جداً.");
    if (b.length > 5000) err.body = t("Description trop longue.", "وصف طويل جداً.");
    if (Object.keys(err).length) {
      setFieldErrors(err);
      return;
    }

    setSending(true);
    try {
      await createReclamation({
        subject: sub,
        body: b,
        authorUid: userUid,
        authorEmail: userEmail,
      });
      setSubject("");
      setBody("");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (e: unknown) {
      const denied =
        e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "permission-denied";
      setSubmitError(
        denied
          ? t(
              "Envoi refusé : publiez les règles Firestore du projet (collection reclamations) ou reconnectez-vous.",
              "رفض الإرسال: انشر قواعد فايربيس (reclamations) أو أعد الاتصال.",
            )
          : e instanceof Error
            ? e.message
            : t("Impossible d’envoyer la réclamation.", "تعذر إرسال الشكوى."),
      );
    } finally {
      setSending(false);
    }
  };

  async function sendAdminReply(row: ReclamationDoc) {
    const text = (adminReplyDraft[row.id] ?? "").trim();
    if (text.length < 3) return;
    if (text.length > 4000) return;
    setReplyBanner(null);
    setReplyingId(row.id);
    try {
      await replyToReclamation(row.id, text);
      setAdminReplyDraft((p) => ({ ...p, [row.id]: "" }));
      setReplyBanner({ rowId: row.id, kind: "ok" });
      setTimeout(() => setReplyBanner((b) => (b?.rowId === row.id && b.kind === "ok" ? null : b)), 4000);
    } catch (e: unknown) {
      const denied =
        e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "permission-denied";
      setReplyBanner({
        rowId: row.id,
        kind: "err",
        msg: denied
          ? t("Réponse refusée : compte admin ou règles Firestore.", "رفض الرد: حساب إداري أو القواعد.")
          : t("Échec de l’envoi de la réponse.", "فشل إرسال الرد."),
      });
    } finally {
      setReplyingId(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className={cn("p-3 rounded-2xl", variant === "admin" ? "bg-violet-500/15 text-violet-800" : "bg-amber-500/15 text-amber-800")}>
          <ClipboardList size={26} />
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t("Réclamations", "الشكاوى")}</h2>
          <p className="text-xs text-zinc-500 font-bold mt-1">
            {variant === "admin"
              ? t("Consultez l’auteur (e-mail, identifiant), traitez la demande et répondez.", "اطّلع على المرسل، عالج الطلب، وأجب.")
              : t("Votre message est transmis à l’administration. Vous verrez la réponse ici.", "تُرسل شكواك للإدارة. سيظهر الرد هنا.")}
          </p>
        </div>
      </div>

      {variant === "citizen" && userUid && userEmail && (
        <form onSubmit={onSubmit} className="p-6 rounded-[2rem] bg-white/60 border border-white space-y-4 shadow-sm">
          {submitError ? <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl px-3 py-2">{submitError}</p> : null}
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{t("Objet", "الموضوع")}</label>
            <input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setFieldErrors((f) => ({ ...f, subject: undefined }));
              }}
              className={cn(
                "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30",
                fieldErrors.subject ? "border-red-300" : "border-zinc-200",
              )}
              placeholder={t("Ex. : éclairage public", "مثال: الإنارة العمومية")}
              maxLength={200}
            />
            {fieldErrors.subject ? <p className="text-xs text-red-600 mt-1">{fieldErrors.subject}</p> : null}
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{t("Description", "الوصف")}</label>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setFieldErrors((f) => ({ ...f, body: undefined }));
              }}
              rows={4}
              maxLength={5000}
              className={cn(
                "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none",
                fieldErrors.body ? "border-red-300" : "border-zinc-200",
              )}
              placeholder={t("Décrivez la situation…", "صف الوضع…")}
            />
            {fieldErrors.body ? <p className="text-xs text-red-600 mt-1">{fieldErrors.body}</p> : null}
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 text-white px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
            {t("Envoyer", "إرسال")}
          </button>
          {sent ? <p className="text-xs font-bold text-emerald-600">{t("Réclamation enregistrée.", "تم تسجيل الشكوى.")}</p> : null}
        </form>
      )}

      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
          {variant === "admin" ? t("Liste", "القائمة") : t("Mes réclamations", "شكواي")}
        </h3>
        {list.length === 0 ? (
          <p className="text-sm font-bold text-zinc-500 py-6 text-center rounded-xl bg-white/40 border border-white">{t("Aucune entrée.", "لا شيء.")}</p>
        ) : (
          list.map((row) => (
            <div key={row.id} className="p-5 rounded-2xl bg-white/70 border border-white text-xs font-bold text-zinc-800 space-y-3 shadow-sm">
              <div className="flex justify-between gap-2 flex-wrap items-start">
                <span className="text-base font-black text-emerald-900 uppercase tracking-tight">{row.subject}</span>
                {variant === "admin" ? (
                  <select
                    value={row.status}
                    onChange={(e) => void updateReclamationStatus(row.id, e.target.value as ReclamationDoc["status"])}
                    className="text-[10px] border border-violet-200 rounded-xl px-3 py-2 bg-white font-black text-violet-900"
                  >
                    <option value="open">{statusLabel("open")}</option>
                    <option value="in_progress">{statusLabel("in_progress")}</option>
                    <option value="closed">{statusLabel("closed")}</option>
                  </select>
                ) : (
                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    {statusLabel(row.status)}
                  </span>
                )}
              </div>
              <p className="text-zinc-600 font-medium whitespace-pre-wrap text-sm leading-relaxed">{row.body}</p>

              {variant === "admin" ? (
                <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3 space-y-2">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t("Auteur de la réclamation", "صاحب الشكوى")}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <span className="inline-flex items-center gap-2 text-zinc-800 font-bold">
                      <Mail size={14} className="text-violet-600 shrink-0" />
                      <span className="break-all">{row.authorEmail || "—"}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-zinc-500 font-mono text-[10px]">
                      <Fingerprint size={14} className="text-violet-500 shrink-0" />
                      <span className="break-all" title={row.authorUid}>
                        {row.authorUid || "—"}
                      </span>
                    </span>
                  </div>
                </div>
              ) : null}

              {row.adminReply ? (
                <div className="mt-2 p-3 rounded-lg bg-violet-50 border border-violet-100">
                  <p className="text-[10px] font-black uppercase text-violet-700 mb-1">{t("Réponse administration", "رد الإدارة")}</p>
                  <p className="text-zinc-700 font-medium whitespace-pre-wrap">{row.adminReply}</p>
                  <p className="text-[9px] text-zinc-400 mt-1">
                    {row.adminReplyAt ? new Date(row.adminReplyAt).toLocaleString() : ""}
                  </p>
                </div>
              ) : null}
              <p className="text-[10px] text-zinc-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</p>

              {variant === "admin" ? (
                <div className="pt-3 border-t border-violet-100 space-y-2">
                  <label className="text-[10px] font-black uppercase text-violet-700 flex items-center gap-2">
                    <User size={14} />
                    {t("Réponse à envoyer au citoyen", "الرد للمواطن")}
                  </label>
                  {replyBanner?.rowId === row.id && replyBanner.kind === "err" ? (
                    <p className="text-xs font-bold text-red-600 bg-red-50 rounded-lg px-2 py-1.5">{replyBanner.msg}</p>
                  ) : null}
                  {replyBanner?.rowId === row.id && replyBanner.kind === "ok" ? (
                    <p className="text-xs font-bold text-emerald-600">{t("Réponse enregistrée.", "تم حفظ الرد.")}</p>
                  ) : null}
                  <textarea
                    value={adminReplyDraft[row.id] ?? ""}
                    onChange={(e) => setAdminReplyDraft((p) => ({ ...p, [row.id]: e.target.value }))}
                    rows={4}
                    maxLength={4000}
                    placeholder={
                      row.adminReply
                        ? t("Nouvelle réponse (remplace la précédente)…", "رد جديد (يستبدل السابق)…")
                        : t("Votre réponse officielle…", "الرد الرسمي…")
                    }
                    className="w-full rounded-xl border border-violet-200 px-3 py-2 text-sm font-medium text-zinc-800 resize-none"
                  />
                  <button
                    type="button"
                    disabled={replyingId === row.id || (adminReplyDraft[row.id] ?? "").trim().length < 3}
                    onClick={() => void sendAdminReply(row)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-700 text-white px-4 py-2.5 text-[10px] font-black uppercase disabled:opacity-40 hover:bg-violet-800"
                  >
                    {replyingId === row.id ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    {t("Envoyer la réponse au citoyen", "إرسال الرد للمواطن")}
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
