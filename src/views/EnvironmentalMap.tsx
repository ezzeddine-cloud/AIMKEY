"use client";

import { CloudSun, Droplets, Zap, Sprout } from "lucide-react";
import { PollutionHeatmap } from "./PollutionHeatmap";

export function EnvironmentalMap({ t }: { t: (fr: string, ar: string) => string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
      <div className="lg:col-span-3">
        <PollutionHeatmap />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border border-white shadow-2xl h-full flex flex-col">
          <h3 className="text-2xl font-black text-zinc-900 mb-8 uppercase tracking-tighter">{t("Données Météo", "بيانات الطقس")}</h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex flex-col justify-center">
              <CloudSun className="text-orange-500 mb-3" size={32} />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t("Température", "الحرارة")}</p>
              <p className="text-3xl font-black text-zinc-900">29°C</p>
            </div>
            <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex flex-col justify-center">
              <Droplets className="text-cyan-500 mb-3" size={32} />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t("Humidité", "الرطوبة")}</p>
              <p className="text-3xl font-black text-zinc-900">42%</p>
            </div>
            <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex flex-col justify-center">
              <Zap className="text-emerald-500 mb-3" size={32} />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t("Vitesse Vent", "سرعة الرياح")}</p>
              <p className="text-2xl font-black text-zinc-900">12 km/h</p>
            </div>
            <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex flex-col justify-center">
              <Sprout className="text-emerald-600 mb-3" size={32} />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t("Point Rosée", "نقطة الندى")}</p>
              <p className="text-2xl font-black text-zinc-900">16°C</p>
            </div>
          </div>
          <div className="mt-8 p-6 bg-emerald-500 text-white rounded-[2rem] shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Status Monitor</p>
            <p className="font-bold leading-relaxed text-sm">
              {t("Conditions optimales pour les cultures irriguées ce soir.", "ظروف مثالية للمحاصيل المروية هذا المساء.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
