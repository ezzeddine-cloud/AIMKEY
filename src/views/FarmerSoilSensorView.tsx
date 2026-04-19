"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Layers3 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/* ─── Types ─── */
interface SensorData {
  humidite: number;
  temperature: number;
  luminosite: number;
  score: number;
  etat: string;
  led_verte: string;
  led_rouge: string;
  heure: string;
  date: string;
  ai_prediction: string;
  ai_confiance: number;
  seuil_irrigation: number;
  heure_prevue: string | null;
  temps_restant_min: number | null;
  tendance_par_min: number | null;
}

interface HistoryData {
  heures: string[];
  humidites: number[];
  temperatures: number[];
  luminosites: number[];
  scores: number[];
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                           */
/* ═══════════════════════════════════════════════════════════ */
export function FarmerSoilSensorView({ t }: { t: (fr: string, ar: string) => string }) {
  const [data, setData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  /* ── Fetch live data every 2s ── */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/irrigation/data");
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setData(d);
      setError(null);
    } catch {
      setError("Connexion au backend impossible");
    }
  }, []);

  /* ── Fetch history every 5s ── */
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/irrigation/history");
      const d = await res.json();
      if (!d.error) setHistory(d);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
    fetchHistory();
    const t1 = setInterval(fetchData, 2000);
    const t2 = setInterval(fetchHistory, 5000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchData, fetchHistory]);

  /* ── Chart.js ── */
  useEffect(() => {
    if (!chartRef.current || !history) return;
    const loadChart = async () => {
      const { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip } = await import("chart.js");
      Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip);

      if (chartInstanceRef.current) {
        chartInstanceRef.current.data.labels = history.heures;
        chartInstanceRef.current.data.datasets[0].data = history.humidites;
        chartInstanceRef.current.data.datasets[1].data = history.humidites.map(() => 40);
        chartInstanceRef.current.update("none");
        return;
      }

      chartInstanceRef.current = new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels: history.heures,
          datasets: [
            {
              label: "Humidité %",
              data: history.humidites,
              borderColor: "#10b981",
              backgroundColor: "rgba(16,185,129,0.08)",
              fill: true,
              tension: 0.4,
              pointRadius: 2,
            },
            {
              label: "Seuil Irrigation",
              data: history.humidites.map(() => 40),
              borderColor: "#ef4444",
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 100, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#a1a1aa" } },
            x: { grid: { color: "rgba(0,0,0,0.02)" }, ticks: { color: "#a1a1aa", maxTicksLimit: 10 } },
          },
          plugins: { legend: { labels: { color: "#71717a" } } },
        },
      });
    };
    loadChart();
  }, [history]);

  useEffect(() => {
    return () => { if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); chartInstanceRef.current = null; } };
  }, []);

  /* ── Score helpers ── */
  const scoreColor = (s: number) => {
    if (s >= 70) return { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50 border-red-200 text-red-700" };
    if (s >= 40) return { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50 border-amber-200 text-amber-700" };
    return { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50 border-emerald-200 text-emerald-700" };
  };

  /* ── Error state ── */
  if (error && !data) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-8">
        <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-800"><Layers3 size={26} /></div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
              {t("Capteur Sol — IoT + IA", "مستشعر التربة — IoT + ذكاء اصطناعي")}
            </h2>
          </div>
        </div>
        <div className="p-8 rounded-[2rem] bg-red-50 border border-red-200 text-center">
          <p className="text-red-600 font-bold text-lg mb-2">⚠️ {t("Backend non connecté", "الخادم غير متصل")}</p>
          <p className="text-red-500 text-sm font-mono">{error}</p>
          <p className="text-zinc-500 text-xs mt-4">
            {t("Lancez : python app.py (port 5000) + predict.py (COM4)", "شغّل: python app.py (port 5000) + predict.py (COM4)")}
          </p>
        </div>
      </motion.div>
    );
  }

  const sc = data ? scoreColor(data.score) : scoreColor(0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-800">
          <Layers3 size={26} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
            {t("Capteur Sol — IoT + IA", "مستشعر التربة — IoT + ذكاء اصطناعي")}
          </h2>
          <p className="text-xs text-zinc-500 font-bold mt-1">
            {t("Données temps réel COM4", "بيانات وقت حقيقي COM4")} — {data?.date ?? "--"} {data?.heure ?? "--:--:--"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">LIVE</span>
        </div>
      </div>

      {/* ─── État banner ─── */}
      {data && (
        <div className={cn("p-4 rounded-2xl border text-sm font-bold text-center", sc.light)}>
          {data.etat.includes("TRES SEC") ? "🔴" : data.etat.includes("SEC") ? "🟡" : "🟢"} {data.etat}
        </div>
      )}

      {/* ─── Metric cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="💧" label={t("Humidité Sol", "رطوبة التربة")} value={data?.humidite} unit="%" accent="text-sky-600" />
        <MetricCard icon="🌡️" label={t("Température", "الحرارة")} value={data?.temperature} unit="°C" accent="text-orange-500" />
        <MetricCard icon="☀️" label={t("Luminosité", "الإضاءة")} value={data?.luminosite} unit="%" accent="text-yellow-500" />
        <MetricCard icon="📊" label={t("Score Besoin Eau", "مؤشر الحاجة للماء")} value={data?.score} unit="/100" accent={sc.text} />
      </div>

      {/* ─── AI Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI prediction */}
        <div className="p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            🤖 {t("Prédiction AI", "تنبؤ الذكاء الاصطناعي")}
          </p>

          <div className={cn(
            "text-center py-3 px-5 rounded-2xl text-sm font-black border",
            data?.ai_prediction === "IRRIGATION"
              ? "bg-red-50 border-red-200 text-red-600"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          )}>
            {data?.ai_prediction === "IRRIGATION"
              ? `🔴 ${t("IRRIGATION NÉCESSAIRE", "يجب الري الآن")}`
              : `🟢 ${t("PAS D'IRRIGATION", "لا حاجة للري")}`}
          </div>

          {/* Confidence bar */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
              {t("Confiance du modèle", "ثقة النموذج")}
            </p>
            <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-all duration-500"
                initial={{ width: 0 }}
                animate={{ width: `${data?.ai_confiance ?? 0}%` }}
                style={{ background: data?.ai_prediction === "IRRIGATION" ? "#ef4444" : "#10b981" }}
              />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 mt-1 font-mono">{data?.ai_confiance ?? "--"}%</p>
          </div>

          {/* LEDs */}
          <div className="flex gap-3 pt-2">
            <LedBadge label={t("LED Verte (Pompe)", "LED أخضر (مضخة)")} on={data?.led_verte === "ON"} color="emerald" />
            <LedBadge label={t("LED Rouge (Valve)", "LED أحمر (صمام)")} on={data?.led_rouge === "ON"} color="red" />
          </div>
        </div>

        {/* Temporal prediction */}
        <div className="p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm space-y-3 flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            ⏰ {t("Prédiction Temporelle", "التنبؤ الزمني")}
          </p>

          <p className={cn(
            "text-center text-4xl font-black my-2",
            data?.ai_prediction === "IRRIGATION" ? "text-red-500"
              : data?.heure_prevue ? "text-amber-500" : "text-emerald-600"
          )}>
            {data?.ai_prediction === "IRRIGATION"
              ? t("MAINTENANT", "الآن")
              : data?.heure_prevue ?? "∞"}
          </p>

          <p className="text-center text-xs font-bold text-zinc-500">
            {data?.ai_prediction === "IRRIGATION"
              ? t("Irrigation nécessaire immédiatement", "يحتاج ري فوري")
              : data?.heure_prevue
              ? `${t("Besoin d'eau dans", "حاجة للماء خلال")} ~${data.temps_restant_min} min`
              : t("Pas de besoin d'irrigation prévu", "لا حاجة متوقعة للري")}
          </p>

          {data?.tendance_par_min != null && (
            <div className="mt-auto p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-center">
              <p className="text-[10px] font-bold text-zinc-500">
                {data.heure_prevue
                  ? `📉 ${t("Tendance", "الاتجاه")} : ${data.tendance_par_min}%/min · ${t("Seuil AI", "حد AI")} : ${data.seuil_irrigation}%`
                  : `📊 ${t("Tendance", "الاتجاه")} : ${data.tendance_par_min}%/min`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Chart ─── */}
      <div className="p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">
          📈 {t("Historique Humidité (60 dernières mesures)", "سجل الرطوبة (آخر 60 قراءة)")}
        </p>
        <div className="relative" style={{ height: "220px" }}>
          <canvas ref={chartRef} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Metric Card ─── */
function MetricCard({ icon, label, value, unit, accent }: {
  icon: string; label: string; value?: number; unit: string; accent: string;
}) {
  return (
    <div className="p-5 rounded-[2rem] bg-white/80 border border-white shadow-sm text-center hover:shadow-md transition-shadow">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
      <p className={cn("text-3xl font-black", accent)}>
        {value ?? "--"}
        <span className="text-sm font-bold text-zinc-400">{unit}</span>
      </p>
    </div>
  );
}

/* ─── LED Badge ─── */
function LedBadge({ label, on, color }: { label: string; on: boolean; color: "emerald" | "red" }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
      on
        ? color === "emerald"
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-600"
        : "bg-zinc-50 border-zinc-100 text-zinc-400"
    )}>
      <div className={cn(
        "w-3 h-3 rounded-full transition-all",
        on
          ? color === "emerald"
            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          : "bg-zinc-200"
      )} />
      {label}
      <span className="font-mono">{on ? "ON" : "OFF"}</span>
    </div>
  );
}
