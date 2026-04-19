"use client";

import { useState } from "react";
import { PlusCircle, Info } from "lucide-react";

export function AdminEventsManager({
  t,
  onAddCityEvent,
}: {
  t: (fr: string, ar: string) => string;
  onAddCityEvent: (titleFr: string, titleAr: string, date: string) => void;
}) {
  const [titleFr, setTitleFr] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [date, setDate] = useState("");

  const handleAdd = () => {
    if (titleFr && titleAr && date) {
      onAddCityEvent(titleFr, titleAr, date);
      setTitleFr("");
      setTitleAr("");
      setDate("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="bg-white/60 backdrop-blur-3xl p-16 rounded-[4rem] border border-white shadow-[0_30px_100px_rgba(16,185,129,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full" />
        <h3 className="text-4xl font-black text-zinc-900 mb-12 border-b border-zinc-100 pb-8 flex items-center gap-4 uppercase tracking-tighter">
          <PlusCircle className="text-emerald-500" size={36} />
          {t("Créer un Événement", "إنشاء حدث جديد")}
        </h3>
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-4">{t("Titre (Français)", "العنوان (فرنسية)")}</label>
              <input
                value={titleFr}
                onChange={(e) => setTitleFr(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-[1.5rem] p-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-zinc-300"
                placeholder="Ex: Festival de la Grenade..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-4 text-right w-full block">
                {t("Titre (Arabe)", "العنوان (عربية)")}
              </label>
              <input
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                dir="rtl"
                className="w-full bg-zinc-50 border-none rounded-[1.5rem] p-6 text-base font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-zinc-300 text-right"
                placeholder="Ex: مهرجان الرمان..."
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-4">{t("Sélectionner une Date", "اختر التاريخ")}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-50 border-none rounded-[1.5rem] p-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 hover:scale-[1.01] active:scale-95 transition-all mt-6"
          >
            {t("Diffuser aux Citoyens", "نشر للمواطنين")}
          </button>
        </div>
      </div>
      <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-xs font-bold text-emerald-800 flex items-center gap-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-500">
          <Info size={24} />
        </div>
        <p className="leading-relaxed">
          {t(
            "PROTOCOLE SYNC: Cette action notifiera les utilisateurs agricoles enregistrés sur Gabes bin ydik.",
            "بروتوكول المزامنة: سيقوم هذا الإجراء بإشعار جميع مواطني قابس المسجلين في منصة ڤَابس بين يديك فورا.",
          )}
        </p>
      </div>
    </div>
  );
}
