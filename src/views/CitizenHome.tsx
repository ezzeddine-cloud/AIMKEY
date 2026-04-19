/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { PlusCircle, History, Heart, Droplets } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { CityEvent } from "@/models/types";

export function CitizenHome({
  t,
  events,
}: {
  t: (fr: string, ar: string) => string;
  events: CityEvent[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <section className="relative h-[400px] rounded-[3rem] overflow-hidden group shadow-2xl shadow-emerald-900/10 shrink-0">
        <img
          src="https://picsum.photos/seed/gabes-oasis/1200/800"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          alt="Gabes"
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-emerald-600/90 via-emerald-600/30 to-transparent flex flex-col justify-end p-12 text-white",
          )}
        >
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase leading-[0.85]">
              {t("VOTRE VILLE,", "مدينتكم،")} <br />{" "}
              <span className="text-emerald-200">{t("VOTRE AVENIR.", "مستقبلكم.")}</span>
            </h1>
            <p className="max-w-xl text-emerald-50/80 leading-relaxed font-bold text-lg">
              {t(
                "Bienvenue sur Gabes bin ydik, la plateforme citoyenne pour un avenir durable et connecté.",
                "مرحبًا بكم في ڤَابس بين يديك، المنصة المواطنية لمستقبل مستدام ومتصل.",
              )}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-2xl text-zinc-900 flex items-center gap-3 uppercase tracking-tighter">
              <PlusCircle className="text-emerald-500" />
              {t("Agenda de la Ville", "أجندة المدينة")}
            </h3>
            <button className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 px-4 py-2 rounded-full transition-all">
              {t("VOIR TOUT", "عرض الكل")}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-xl hover:-translate-y-2 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-100">
                    {t("Public", "عام")}
                  </span>
                  <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <History size={18} />
                  </div>
                </div>
                <h4 className="font-black text-zinc-900 text-xl mb-3 leading-tight uppercase tracking-tight">
                  {t(event.title.fr, event.title.ar)}
                </h4>
                <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-8">
                  {t(
                    "Participez activement à la vie locale avec Gabes bin ydik. Événement publié par la municipalité.",
                    "شارك بفعالية في الحياة المحلية مع ڤَابس بين يديك. حدث مقدم من البلدية.",
                  )}
                </p>
                <button className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-zinc-900/10">
                  {t("Je m'inscris", "سجل الآن")}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="font-black text-2xl text-zinc-900 flex items-center gap-3 px-2 uppercase tracking-tighter">
            <Heart className="text-danger" />
            {t("Solidarité", "تضامن")}
          </h3>
          <div className="bg-emerald-500 text-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/20 relative overflow-hidden group">
            <Droplets className="absolute -top-4 -right-4 w-48 h-48 text-white/10 group-hover:scale-110 transition-transform" />
            <h4 className="text-3xl font-black mb-4 leading-[0.9] uppercase tracking-tighter">
              {t("Soutenons nos Oasis", "لندعم واحاتنا")}
            </h4>
            <p className="text-emerald-50/80 mb-10 font-bold leading-relaxed">
              {t(
                "Contribuez au fonds de préservation des palmeraies millénaires de Chenini.",
                "ساهموا في صندوق الحفاظ على واحات شنني العريقة.",
              )}
            </p>
            <button className="bg-white text-emerald-600 w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-black/10">
              {t("Faire un don", "تبرع الآن")}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
