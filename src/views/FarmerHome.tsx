/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { Droplets, Sprout, Store, PlusCircle, Thermometer, Zap } from "lucide-react";
import { motion } from "motion/react";
import { StatCard } from "./StatCards";

export function FarmerHome({ t }: { t: (fr: string, ar: string) => string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Droplets} label={t("Humidité Sol", "رطوبة التربة")} value="65%" sub="+2% vs hier" color="emerald" />
        <StatCard icon={Thermometer} label={t("Temp. Air", "حرارة الجو")} value="28°C" sub="Optimale" color="orange" />
        <StatCard icon={Zap} label={t("Conso. IoT", "استهلاك")} value="12kW/h" sub="-15% Eco" color="cyan" />
        <StatCard icon={Sprout} label={t("Santé Oasis", "صحة الواحة")} value="STABLE" sub="Protocole V3" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border border-white/40 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-black text-2xl text-zinc-900 uppercase tracking-tighter">{t("Gestion de l'Eau", "إدارة المياه")}</h3>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
                <Droplets size={24} />
              </div>
            </div>
            <div className="space-y-8">
              <div className="h-6 w-full bg-zinc-100 rounded-full overflow-hidden p-1 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "70%" }}
                  className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                />
              </div>
              <div className="flex justify-between text-xs font-black text-zinc-400 uppercase tracking-widest">
                <span>{t("Quota mensuel atteint", "تحقيق الحصة")}</span>
                <span className="text-zinc-900 italic">GBS_MODEL_v2.1</span>
              </div>
              <p className="text-sm font-bold text-zinc-500 leading-relaxed bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 border-dashed">
                {t(
                  "Modèle de prédiction Smart City: Irrigation recommandée à 22:00 (Taux évaporation minimum).",
                  "نموذج التوقع الذكي: ينصح بالري الساعة 22:00 (أدنى معدل تبخر).",
                )}
              </p>
            </div>
          </div>
          <button className="mt-12 w-full py-5 bg-zinc-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors">
            {t("Ouvrir les vannes", "فتح الصمامات")}
          </button>
        </div>

        <div className="bg-zinc-900 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white backdrop-blur-md group-hover:rotate-12 transition-transform">
                  <Store size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{t("Vendre mes Produits", "بيع المنتجات")}</h3>
                  <p className="text-xs text-emerald-400 font-bold tracking-widest uppercase">{t("Marketplace de l'Oasis", "سوق الواحات")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-12">
                {["Grenades", "Dattes", "Tomates", "Olive"].map((cat) => (
                  <div
                    key={cat}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group-hover:bg-white/10 transition-colors"
                  >
                    <span className="text-[10px] font-black text-white/60 uppercase">{cat}</span>
                    <PlusCircle size={14} className="text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full py-5 bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-[2rem] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-900/40">
              {t("Ajouter un lot", "إضافة شحنة جديدة")}
            </button>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
}
