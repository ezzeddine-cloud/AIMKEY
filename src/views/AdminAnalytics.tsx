"use client";

import { BarChart3 } from "lucide-react";

export function AdminAnalytics({ t }: { t: (fr: string, ar: string) => string }) {
  return (
    <div className="bg-white/40 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white min-h-[500px] flex flex-col items-center justify-center text-center">
      <BarChart3 size={80} className="text-emerald-500 mb-8" />
      <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter mb-4">{t("Analytique Stratégique", "التحليل الاستراتيجي")}</h2>
      <p className="text-zinc-500 font-bold max-w-lg mx-auto mb-10">
        {t(
          "Visualisez l'évolution du climat, de la pollution et de l'engagement citoyen à Gabès.",
          "عرض تطور المناخ، التلوث ومشاركة المواطنين في قابس.",
        )}
      </p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <div className="p-8 bg-zinc-900 rounded-[2rem] text-white">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">AQI_AVERAGE</p>
          <p className="text-3xl font-black">104</p>
        </div>
        <div className="p-8 bg-emerald-500 rounded-[2rem] text-white">
          <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-2">ENGAGEMENT</p>
          <p className="text-3xl font-black">88%</p>
        </div>
      </div>
    </div>
  );
}
