"use client";

import { useState } from "react";
import { CalendarDays, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { createCityEvent, deleteCityEvent, updateCityEvent } from "@/lib/firebase/appContentRepos";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { CityEvent } from "@/models/types";

export function AdminEventsPanel({ t, events }: { t: (fr: string, ar: string) => string; events: CityEvent[] }) {
  const firebaseOk = isFirebaseConfigured();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CityEvent | null>(null);
  const [titleFr, setTitleFr] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setTitleFr("");
    setTitleAr("");
    setDate("");
    setImageUrl("");
    setMsg(null);
    setDialogOpen(true);
  }

  function openEdit(e: CityEvent) {
    setEditing(e);
    setTitleFr(e.title.fr);
    setTitleAr(e.title.ar);
    setDate(e.date);
    setImageUrl(e.imageUrl || "");
    setMsg(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;
    setDialogOpen(false);
    setEditing(null);
    setMsg(null);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!firebaseOk) return;
    setMsg(null);
    setSaving(true);
    try {
      if (editing) {
        await updateCityEvent(editing.id, { titleFr, titleAr, date, imageUrl: imageUrl.trim() });
      } else {
        await createCityEvent({ titleFr, titleAr, date, imageUrl: imageUrl.trim() || undefined });
      }
      setDialogOpen(false);
      setEditing(null);
      setTitleFr("");
      setTitleAr("");
      setDate("");
      setImageUrl("");
    } catch {
      setMsg(t("Échec (droits admin / réseau).", "فشل (صلاحيات أو شبكة)."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: CityEvent) {
    if (!firebaseOk) return;
    const ok = window.confirm(
      t(`Supprimer « ${e.title.fr} » ?`, `حذف « ${e.title.ar} »؟`),
    );
    if (!ok) return;
    setMsg(null);
    try {
      await deleteCityEvent(e.id);
    } catch {
      setMsg(t("Suppression impossible.", "تعذر الحذف."));
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-violet-500/15 text-violet-800">
            <CalendarDays size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t("Événements", "الفعاليات")}</h2>
            <p className="text-xs text-zinc-500 font-bold mt-1">
              {firebaseOk
                ? t("Ajouter, modifier ou supprimer les dates affichées aux utilisateurs connectés.", "إضافة أو تعديل أو حذف التواريخ للمستخدمين.")
                : t("Mode démo : configurez Firebase pour synchroniser le calendrier.", "وضع تجريبي: فعّل فايربيس للمزامنة.")}
            </p>
          </div>
        </div>
        {firebaseOk ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-white px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shrink-0"
          >
            <Plus size={18} />
            {t("Nouvel événement", "حدث جديد")}
          </button>
        ) : null}
      </div>

      {msg && !dialogOpen ? <p className="text-sm font-bold text-amber-700 px-2">{msg}</p> : null}

      <ul className="space-y-3">
        {events.length === 0 ? (
          <li className="p-8 rounded-2xl bg-white/50 border border-white text-center text-sm font-bold text-zinc-500">
            {t("Aucun événement pour le moment.", "لا توجد فعاليات حالياً.")}
          </li>
        ) : (
          events.map((e) => (
            <li
              key={e.id}
              className="p-5 rounded-2xl bg-white/70 border border-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
            >
              {e.imageUrl ? (
                <img src={e.imageUrl} alt="" className="w-full sm:w-24 h-24 object-cover rounded-xl border border-zinc-100 shrink-0" />
              ) : (
                <div className="w-full sm:w-24 h-24 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-300 shrink-0">
                  <ImageIcon size={28} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-black text-zinc-900 text-sm block">{t(e.title.fr, e.title.ar)}</span>
                <span className="text-xs font-bold text-violet-600 uppercase tracking-wider mt-1 inline-block">{e.date}</span>
              </div>
              {firebaseOk ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(e)}
                    className="p-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-violet-50 hover:border-violet-200 transition-colors"
                    aria-label={t("Modifier", "تعديل")}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(e)}
                    className="p-2.5 rounded-xl border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    aria-label={t("Supprimer", "حذف")}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-lg rounded-[2rem] bg-white border border-white shadow-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
              {editing ? t("Modifier l’événement", "تعديل الحدث") : t("Nouvel événement", "حدث جديد")}
            </h3>
            {msg ? <p className="text-sm font-bold text-red-600">{msg}</p> : null}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400">{t("Titre (FR)", "عنوان (فرنسي)")}</label>
                  <input
                    required
                    value={titleFr}
                    onChange={(ev) => setTitleFr(ev.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400">{t("Titre (AR)", "عنوان (عربي)")}</label>
                  <input
                    required
                    value={titleAr}
                    onChange={(ev) => setTitleAr(ev.target.value)}
                    dir="rtl"
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold text-right"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400">{t("Date", "التاريخ")}</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(ev) => setDate(ev.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1">
                  <ImageIcon size={12} />
                  {t("URL image (optionnel)", "رابط صورة (اختياري)")}
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(ev) => setImageUrl(ev.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-violet-700 text-white px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-violet-800 disabled:opacity-50"
                >
                  {saving ? t("Enregistrement…", "جاري الحفظ…") : editing ? t("Enregistrer", "حفظ") : t("Créer", "إنشاء")}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeDialog}
                  className="rounded-xl border border-zinc-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {t("Annuler", "إلغاء")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
