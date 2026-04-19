"use client";

import { useEffect, useState, useMemo } from "react";
import { Droplets, TrendingDown, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface IrrigationRow {
  date: string;
  heure: string;
  humidite: number;
  temperature: number;
  luminosite: number;
  score: number;
  etat: string;
  ledVerte: string;
  ledRouge: string;
  prediction: string;
  etatReel: string;
}

function parseCSV(text: string): IrrigationRow[] {
  const lines = text.trim().split("\n");
  const start = lines[0]?.includes("Date") ? 1 : 0;
  return lines.slice(start).map((line) => {
    const cols = line.split(",");
    return {
      date: cols[0] ?? "",
      heure: cols[1] ?? "",
      humidite: parseFloat(cols[2]) || 0,
      temperature: parseFloat(cols[3]) || 0,
      luminosite: parseFloat(cols[4]) || 0,
      score: parseInt(cols[5]) || 0,
      etat: cols[6] ?? "",
      ledVerte: cols[7] ?? "OFF",
      ledRouge: cols[8] ?? "OFF",
      prediction: cols[9] ?? "",
      etatReel: cols[10] ?? "",
    };
  });
}

/* Simple bar chart */
function BarViz({ data, color, label }: { data: { label: string; value: number }[]; color: string; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">{label}</p>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-zinc-500 w-16 truncate">{d.label}</span>
            <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={cn("h-full rounded-full", color)}
              />
            </div>
            <span className="text-[10px] font-black text-zinc-600 w-10 text-right">{d.value.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FarmerWaterWasteView({ t }: { t: (fr: string, ar: string) => string }) {
  const [rows, setRows] = useState<IrrigationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      fetch(`/irrigation_data.csv?t=${Date.now()}`)
        .then((r) => r.text())
        .then((text) => {
          setRows(parseCSV(text));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  /* Analytics */
  const stats = useMemo(() => {
    if (!rows.length) return null;

    const totalReadings = rows.length;
    const irrigationActive = rows.filter((r) => r.ledVerte.trim().toUpperCase() === "ON").length;
    const irrigationPct = (irrigationActive / totalReadings) * 100;

    // Score distribution
    const critical = rows.filter((r) => r.score >= 70).length;
    const attention = rows.filter((r) => r.score >= 40 && r.score < 70).length;
    const optimal = rows.filter((r) => r.score < 40).length;

    // Average humidity
    const avgHum = rows.reduce((s, r) => s + r.humidite, 0) / totalReadings;
    const avgTemp = rows.reduce((s, r) => s + r.temperature, 0) / totalReadings;

    // Water waste: estimation based on irrigations happening when humidity > 60%
    const unnecessaryIrrigation = rows.filter(
      (r) => r.ledVerte.trim().toUpperCase() === "ON" && r.humidite > 60
    ).length;
    const wasteRatio = irrigationActive > 0 ? (unnecessaryIrrigation / irrigationActive) * 100 : 0;

    // AI accuracy (if prediction matches etat reel)
    const correctPredictions = rows.filter((r) => {
      const pred = r.prediction.trim().toUpperCase();
      const reel = r.etatReel.trim().toUpperCase();
      return pred === reel;
    }).length;
    const aiAccuracy = (correctPredictions / totalReadings) * 100;

    // Hourly distribution of irrigation events
    const hourlyIrrigation = new Map<string, number>();
    rows.forEach((r) => {
      if (r.ledVerte.trim().toUpperCase() === "ON") {
        const hour = r.heure.split(":")[0] + ":00";
        hourlyIrrigation.set(hour, (hourlyIrrigation.get(hour) || 0) + 1);
      }
    });

    return {
      totalReadings,
      irrigationActive,
      irrigationPct,
      critical,
      attention,
      optimal,
      avgHum,
      avgTemp,
      wasteRatio,
      aiAccuracy,
      unnecessaryIrrigation,
      hourlyIrrigation: Array.from(hourlyIrrigation.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, value]) => ({ label, value })),
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-zinc-500 font-bold">
        {t("Aucune donnée disponible.", "لا توجد بيانات.")}
      </div>
    );
  }

  const wasteLevel = stats.wasteRatio < 10 ? "low" : stats.wasteRatio < 30 ? "medium" : "high";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="p-3 rounded-2xl bg-sky-500/15 text-sky-800">
          <Droplets size={26} />
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
            {t("Analyse Gaspillage d'Eau", "تحليل هدر المياه")}
          </h2>
          <p className="text-xs text-zinc-500 font-bold mt-1">
            {t(
              `Basé sur ${stats.totalReadings} lectures capteur IoT`,
              `بناءً على ${stats.totalReadings} قراءات من المستشعر`
            )}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[2rem] bg-white/80 border border-white shadow-sm text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
            {t("Activations Pompe", "تشغيلات المضخة")}
          </p>
          <p className="text-3xl font-black text-sky-600 mt-2">{stats.irrigationActive}</p>
          <p className="text-[10px] text-zinc-400 font-bold mt-1">{stats.irrigationPct.toFixed(1)}%</p>
        </div>
        <div className="p-5 rounded-[2rem] bg-white/80 border border-white shadow-sm text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
            {t("Gaspillage estimé", "هدر تقديري")}
          </p>
          <p className={cn(
            "text-3xl font-black mt-2",
            wasteLevel === "low" ? "text-emerald-600" : wasteLevel === "medium" ? "text-amber-600" : "text-red-600"
          )}>
            {stats.wasteRatio.toFixed(0)}%
          </p>
          <p className="text-[10px] text-zinc-400 font-bold mt-1">
            {stats.unnecessaryIrrigation} {t("inutiles", "غير ضرورية")}
          </p>
        </div>
        <div className="p-5 rounded-[2rem] bg-white/80 border border-white shadow-sm text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
            {t("Précision IA", "دقة الذكاء الاصطناعي")}
          </p>
          <p className="text-3xl font-black text-violet-600 mt-2">{stats.aiAccuracy.toFixed(0)}%</p>
          <p className="text-[10px] text-zinc-400 font-bold mt-1">GradientBoosting</p>
        </div>
        <div className="p-5 rounded-[2rem] bg-white/80 border border-white shadow-sm text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
            {t("Humidité moy.", "متوسط الرطوبة")}
          </p>
          <p className="text-3xl font-black text-zinc-800 mt-2">{stats.avgHum.toFixed(1)}%</p>
          <p className="text-[10px] text-zinc-400 font-bold mt-1">{stats.avgTemp.toFixed(1)}°C {t("moy.", "متوسط")}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Waste indicator */}
        <div className="p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown size={18} className="text-sky-500" />
            <p className="text-sm font-black uppercase tracking-tight text-zinc-700">
              {t("Indicateur de Gaspillage", "مؤشر الهدر")}
            </p>
          </div>
          <div className="h-5 rounded-full bg-zinc-100 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stats.wasteRatio, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                wasteLevel === "low" ? "bg-emerald-500" : wasteLevel === "medium" ? "bg-amber-500" : "bg-red-500"
              )}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] font-black text-zinc-400 uppercase">{t("Faible", "منخفض")}</span>
            <span className="text-[9px] font-black text-zinc-400 uppercase">{t("Élevé", "مرتفع")}</span>
          </div>

          <div className={cn(
            "mt-6 p-4 rounded-2xl border flex items-start gap-3",
            wasteLevel === "low"
              ? "bg-emerald-50 border-emerald-200"
              : wasteLevel === "medium"
              ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200"
          )}>
            {wasteLevel === "low" ? (
              <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={18} className={wasteLevel === "medium" ? "text-amber-600" : "text-red-600"} />
            )}
            <p className="text-sm font-bold text-zinc-700 leading-relaxed">
              {wasteLevel === "low"
                ? t(
                    "Excellent ! Faible gaspillage détecté. Votre système d'irrigation est efficace.",
                    "ممتاز! هدر منخفض. نظام الري فعال."
                  )
                : wasteLevel === "medium"
                ? t(
                    "Attention : quelques irrigations inutiles détectées quand l'humidité était suffisante.",
                    "انتبه: تم اكتشاف بعض الري غير الضروري عندما كانت الرطوبة كافية."
                  )
                : t(
                    "Alerte ! Trop d'irrigations alors que le sol est humide. Ajustez vos seuils.",
                    "تنبيه! ري مفرط بينما التربة رطبة. عدّل الحدود."
                  )}
            </p>
          </div>
        </div>

        {/* Score distribution */}
        <div className="p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-violet-500" />
            <p className="text-sm font-black uppercase tracking-tight text-zinc-700">
              {t("Distribution des Scores", "توزيع النتائج")}
            </p>
          </div>
          <BarViz
            label={t("Répartition", "التوزيع")}
            color="bg-emerald-500"
            data={[
              { label: t("Optimal", "مثالي"), value: (stats.optimal / stats.totalReadings) * 100 },
              { label: t("Attention", "انتبه"), value: (stats.attention / stats.totalReadings) * 100 },
              { label: t("Critique", "حرج"), value: (stats.critical / stats.totalReadings) * 100 },
            ]}
          />
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-lg font-black text-emerald-700">{stats.optimal}</p>
              <p className="text-[8px] font-black uppercase text-emerald-500">{t("Optimal", "مثالي")}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-lg font-black text-amber-700">{stats.attention}</p>
              <p className="text-[8px] font-black uppercase text-amber-500">{t("Attention", "انتبه")}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-lg font-black text-red-700">{stats.critical}</p>
              <p className="text-[8px] font-black uppercase text-red-500">{t("Critique", "حرج")}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
