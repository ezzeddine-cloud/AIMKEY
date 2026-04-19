"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Loader2, Newspaper, Pencil, Send, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { createNewsArticle, deleteNewsArticle, subscribeNews, updateNewsArticle } from "@/lib/firebase/appContentRepos";
import type { NewsArticle } from "@/models/types";

export function AdminNewsPanel({ t, authorUid }: { t: (fr: string, ar: string) => string; authorUid: string }) {
  const [list, setList] = useState<NewsArticle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleFr, setTitleFr] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [bodyFr, setBodyFr] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeNews(setList);
    return () => unsub();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitleFr("");
    setTitleAr("");
    setBodyFr("");
    setBodyAr("");
    setImageUrl("");
    setMsg(null);
  }

  function startEdit(a: NewsArticle) {
    setEditingId(a.id);
    setTitleFr(a.titleFr);
    setTitleAr(a.titleAr);
    setBodyFr(a.bodyFr);
    setBodyAr(a.bodyAr);
    setImageUrl(a.imageUrl || "");
    setMsg(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      if (editingId) {
        await updateNewsArticle(editingId, {
          titleFr: titleFr.trim(),
          titleAr: titleAr.trim() || titleFr.trim(),
          bodyFr: bodyFr.trim(),
          bodyAr: bodyAr.trim() || bodyFr.trim(),
          imageUrl: imageUrl.trim(),
        });
        setMsg(t("Article mis à jour.", "تم التحديث."));
      } else {
        await createNewsArticle({
          titleFr: titleFr.trim(),
          titleAr: titleAr.trim() || titleFr.trim(),
          bodyFr: bodyFr.trim(),
          bodyAr: bodyAr.trim() || bodyFr.trim(),
          authorUid,
          imageUrl: imageUrl.trim() || undefined,
        });
        setMsg(t("Article publié.", "تم النشر."));
      }
      resetForm();
    } catch {
      setMsg(t("Échec (droits admin / réseau).", "فشل العملية."));
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteArticle(id: string) {
    if (!window.confirm(t("Supprimer cet article ?", "حذف هذا المقال؟"))) return;
    setBusyDeleteId(id);
    setMsg(null);
    try {
      await deleteNewsArticle(id);
      if (editingId === id) resetForm();
    } catch {
      setMsg(t("Suppression impossible.", "تعذر الحذف."));
    } finally {
      setBusyDeleteId(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-violet-500/15 text-violet-800">
            <Newspaper size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
              {editingId ? t("Modifier une actualité", "تعديل خبر") : t("Publier une actualité", "نشر خبر")}
            </h2>
            <p className="text-xs text-zinc-500 font-bold mt-1">{t("Visible par tous les utilisateurs connectés.", "يظهر لكل المستخدمين.")}</p>
          </div>
        </div>
        {editingId ? (
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-[10px] font-black uppercase text-zinc-700 hover:bg-zinc-50 shrink-0"
          >
            <X size={14} />
            {t("Fermer l’édition", "إغلاق التعديل")}
          </button>
        ) : null}
      </div>

      {msg ? <p className="text-sm font-bold text-emerald-700">{msg}</p> : null}

      <form onSubmit={(e) => void onSubmit(e)} className="p-6 rounded-[2rem] bg-white/70 border border-white space-y-4 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400">{t("Titre (FR)", "عنوان (فرنسي)")}</label>
            <input required value={titleFr} onChange={(e) => setTitleFr(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400">{t("Titre (AR)", "عنوان (عربي)")}</label>
            <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400">{t("Texte (FR)", "نص (فرنسي)")}</label>
          <textarea required value={bodyFr} onChange={(e) => setBodyFr(e.target.value)} rows={5} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold resize-none" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400">{t("Texte (AR)", "نص (عربي)")}</label>
          <textarea value={bodyAr} onChange={(e) => setBodyAr(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold resize-none" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2">
            <ImageIcon size={14} className="text-violet-600" />
            {t("URL de la photo (optionnel)", "رابط الصورة (اختياري)")}
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold"
          />
          <p className="text-[10px] text-zinc-400 font-bold mt-1">
            {t("Collez un lien https vers une image déjà hébergée.", "الصق رابط https لصورة مستضافة.")}
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-700 text-white px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-violet-800 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : editingId ? <Pencil size={16} /> : <Send size={16} />}
          {editingId ? t("Enregistrer les modifications", "حفظ التعديلات") : t("Publier", "نشر")}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-3">{t("Articles publiés", "المقالات المنشورة")}</h3>
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id} className="p-4 rounded-2xl bg-white/70 border border-white flex flex-col sm:flex-row gap-4 shadow-sm">
              {a.imageUrl ? (
                <img src={a.imageUrl} alt="" className="w-full sm:w-28 h-28 object-cover rounded-xl border border-zinc-100 shrink-0" />
              ) : (
                <div className="w-full sm:w-28 h-28 rounded-xl bg-zinc-100 border border-zinc-200 shrink-0 flex items-center justify-center text-zinc-300">
                  <ImageIcon size={28} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-black text-zinc-900 text-sm line-clamp-2">{t(a.titleFr, a.titleAr)}</p>
                <p className="text-[10px] text-zinc-400 font-bold mt-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</p>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-violet-200 px-3 py-2 text-[10px] font-black uppercase text-violet-800 hover:bg-violet-50"
                >
                  <Pencil size={14} />
                  {t("Modifier", "تعديل")}
                </button>
                <button
                  type="button"
                  disabled={busyDeleteId === a.id}
                  onClick={() => void onDeleteArticle(a.id)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {busyDeleteId === a.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  {t("Supprimer", "حذف")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
