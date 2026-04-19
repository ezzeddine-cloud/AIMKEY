"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Download, Wind, Layers3, Activity, BarChart3, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";

interface OpenDataStatsModalProps {
  t: (fr: string, ar: string) => string;
  isOpen: boolean;
  onClose: () => void;
}

export function OpenDataStatsModal({ t, isOpen, onClose }: OpenDataStatsModalProps) {
  const [pollutionData, setPollutionData] = useState<string>("");
  const [irrigationData, setIrrigationData] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pollution" | "irrigation">("pollution");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      fetch("/data.csv").then((r) => r.text()).catch(() => ""),
      fetch("/irrigation_data.csv").then((r) => r.text()).catch(() => "")
    ]).then(([pol, irr]) => {
      setPollutionData(pol);
      setIrrigationData(irr);
      setLoading(false);
    });
  }, [isOpen]);

  // Compute pollution stats
  const polStats = useMemo(() => {
    if (!pollutionData) return null;
    const lines = pollutionData.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return null;
    const records = lines.map(l => l.split(","));
    
    let totalPm25 = 0;
    const levels = { "Faible": 0, "Moyen": 0, "Élevé": 0 };
    
    records.forEach(r => {
      if (r.length < 5) return;
      const pm25 = parseFloat(r[3]);
      if (!isNaN(pm25)) totalPm25 += pm25;
      const lvl = r[4]?.trim();
      if (lvl === "Faible" || lvl === "Moyen" || lvl === "Élevé") {
        levels[lvl]++;
      }
    });

    return {
      count: records.length,
      avgPm25: records.length ? (totalPm25 / records.length).toFixed(1) : 0,
      levels
    };
  }, [pollutionData]);

  // Compute irrigation stats
  const irrStats = useMemo(() => {
    if (!irrigationData) return null;
    const lines = irrigationData.trim().split("\n").filter(Boolean);
    // skip header
    const dataLines = lines[0]?.includes("Date") ? lines.slice(1) : lines;
    if (dataLines.length === 0) return null;
    
    const records = dataLines.map(l => l.split(","));
    let sumHum = 0, sumTemp = 0, sumLum = 0;
    let irrigations = 0;
    let aiPredictions = 0;
    let pompeActivations = 0;

    records.forEach(r => {
      if (r.length < 9) return;
      sumHum += parseFloat(r[2]) || 0;
      sumTemp += parseFloat(r[3]) || 0;
      sumLum += parseFloat(r[4]) || 0;
      
      const etat = r[6] || "";
      if (etat.includes("TRES SEC") || etat.includes("IRRIGATION ACTIVEE")) irrigations++;
      
      const ledV = r[7] || "";
      if (ledV.trim() === "ON") pompeActivations++;

      const pred = r[9] || "";
      if (pred.includes("IRRIGATION") && !pred.includes("PAS")) aiPredictions++;
    });

    const count = records.length;
    return {
      count,
      avgHum: (sumHum / count).toFixed(1),
      avgTemp: (sumTemp / count).toFixed(1),
      avgLum: (sumLum / count).toFixed(1),
      irrigations,
      pompeActivations,
      aiPredictions,
      irrigationPct: ((irrigations / count) * 100).toFixed(1)
    };
  }, [irrigationData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-sm" role="dialog">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-700">
              <Database size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
                {t("Open Data Hub", "مركز البيانات المفتوحة")}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {t("Statistiques avancées & Téléchargements", "إحصائيات متقدمة وتحميلات")}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 shrink-0 border-b border-zinc-100 bg-zinc-50/50">
          <button
            onClick={() => setActiveTab("pollution")}
            className={cn(
              "px-5 py-3 rounded-t-2xl text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-2",
              activeTab === "pollution" 
                ? "bg-white text-blue-600 border-t border-l border-r border-zinc-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]" 
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
            )}
          >
            <Wind size={16} />
            {t("Pollution (PM2.5)", "تلوث")}
          </button>
          <button
            onClick={() => setActiveTab("irrigation")}
            className={cn(
              "px-5 py-3 rounded-t-2xl text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-2",
              activeTab === "irrigation" 
                ? "bg-white text-emerald-600 border-t border-l border-r border-zinc-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]" 
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
            )}
          >
            <Layers3 size={16} />
            {t("Irrigation IoT", "الري IoT")}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-zinc-50/30">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "pollution" ? (
                <motion.div key="pol" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  
                  {/* Download Banner */}
                  <div className="p-5 rounded-[2rem] bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-blue-900 text-lg">{t("Jeu de données Qualité de l'Air", "مجموعة بيانات جودة الهواء")}</h3>
                      <p className="text-xs font-bold text-blue-700/70 mt-1">
                        {t("Données réelles des capteurs de particules fines (PM2.5) par zone géographique.", "بيانات حقيقية لمستشعرات الجسيمات الدقيقة حسب المنطقة الجغرافية.")}
                      </p>
                    </div>
                    <a
                      href="/data.csv"
                      download
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap shadow-md shadow-blue-500/20"
                    >
                      <Download size={16} />
                      {t("Télécharger CSV", "تحميل CSV")}
                    </a>
                  </div>

                  {/* Advanced Stats */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                      <BarChart3 size={14} /> {t("Analyse du dataset", "تحليل مجموعة البيانات")}
                    </h4>
                    
                    {polStats ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label={t("Total relevés", "إجمالي القراءات")} value={polStats.count.toString()} />
                        <StatCard label={t("PM2.5 Moyen", "متوسط PM2.5")} value={polStats.avgPm25} unit="µg/m³" color="text-blue-600" />
                        <StatCard label={t("Alertes Élevées", "تنبيهات عالية")} value={polStats.levels["Élevé"].toString()} color="text-red-500" />
                        <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm flex flex-col justify-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">{t("Distribution", "توزيع")}</p>
                          <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-zinc-100 mb-1">
                            <div className="bg-emerald-400" style={{ width: `${(polStats.levels["Faible"] / polStats.count) * 100}%` }} />
                            <div className="bg-amber-400" style={{ width: `${(polStats.levels["Moyen"] / polStats.count) * 100}%` }} />
                            <div className="bg-red-500" style={{ width: `${(polStats.levels["Élevé"] / polStats.count) * 100}%` }} />
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-zinc-400 uppercase">
                            <span>{t("Faible", "منخفض")}</span>
                            <span>{t("Moyen", "متوسط")}</span>
                            <span>{t("Élevé", "عالي")}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-zinc-400">{t("Aucune donnée disponible.", "لا توجد بيانات.")}</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="irr" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  
                  {/* Download Banner */}
                  <div className="p-5 rounded-[2rem] bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-emerald-900 text-lg">{t("Historique Irrigation IoT & IA", "سجل الري IoT والذكاء الاصطناعي")}</h3>
                      <p className="text-xs font-bold text-emerald-700/70 mt-1">
                        {t("Logs détaillés des capteurs (humidité, temp, lumière), états actuateurs et prédictions de l'Intelligence Artificielle.", "سجلات مفصلة للمستشعرات والمحركات وتنبؤات الذكاء الاصطناعي.")}
                      </p>
                    </div>
                    <a
                      href="/irrigation_data.csv"
                      download
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap shadow-md shadow-emerald-500/20"
                    >
                      <Download size={16} />
                      {t("Télécharger CSV", "تحميل CSV")}
                    </a>
                  </div>

                  {/* Advanced Stats */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                      <Activity size={14} /> {t("Analyse du dataset", "تحليل مجموعة البيانات")}
                    </h4>
                    
                    {irrStats ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label={t("Total relevés", "إجمالي القراءات")} value={irrStats.count.toString()} />
                        <StatCard label={t("Humidité Moyenne", "متوسط الرطوبة")} value={irrStats.avgHum} unit="%" color="text-sky-500" />
                        <StatCard label={t("Température Moy.", "متوسط الحرارة")} value={irrStats.avgTemp} unit="°C" color="text-orange-500" />
                        <StatCard label={t("Luminosité Moy.", "متوسط الإضاءة")} value={irrStats.avgLum} unit="%" color="text-yellow-500" />
                        
                        <div className="col-span-2 p-5 rounded-[2rem] bg-white border border-zinc-100 shadow-sm flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t("Taux d'irrigation", "معدل الري")}</p>
                            <p className="text-3xl font-black text-emerald-600">{irrStats.irrigationPct}%</p>
                            <p className="text-xs font-bold text-zinc-400 mt-1">{irrStats.irrigations} {t("états critiques", "حالات حرجة")}</p>
                          </div>
                          <div className="w-16 h-16 rounded-full border-4 border-emerald-100 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${irrStats.irrigationPct}%, 0 ${irrStats.irrigationPct}%)` }} />
                            <Layers3 size={20} className="text-emerald-600 relative z-10" />
                          </div>
                        </div>

                        <StatCard label={t("Prédictions IA Positives", "تنبؤات إيجابية IA")} value={irrStats.aiPredictions.toString()} color="text-violet-500" />
                        <StatCard label={t("Activations Pompe", "تشغيلات المضخة")} value={irrStats.pompeActivations.toString()} color="text-emerald-500" />
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-zinc-400">{t("Aucune donnée disponible.", "لا توجد بيانات.")}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, unit, color = "text-zinc-800" }: { label: string, value: string, unit?: string, color?: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
      <p className={cn("text-2xl font-black", color)}>
        {value} {unit && <span className="text-sm font-bold text-zinc-400">{unit}</span>}
      </p>
    </div>
  );
}
