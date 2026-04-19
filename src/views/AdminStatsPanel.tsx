"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  PieChart,
  Loader2,
  RefreshCw,
  Users,
  Newspaper,
  ClipboardList,
  MessagesSquare,
  Store,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { fetchAdminDashboardStats, type AdminDashboardStats } from "@/lib/firebase/adminStats";

type MetricKey = "users" | "news" | "reclamations" | "forumPosts" | "marketplaceProducts";

type MetricDef = {
  key: MetricKey;
  fr: string;
  ar: string;
  /** Tailwind: fond icône + texte */
  iconWrap: string;
  /** hex pour donut / barre */
  accent: string;
  icon: typeof Users;
  getValue: (s: AdminDashboardStats) => number;
};

const METRICS: MetricDef[] = [
  {
    key: "users",
    fr: "Utilisateurs",
    ar: "المستخدمون",
    iconWrap: "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20",
    accent: "#10b981",
    icon: Users,
    getValue: (s) => s.users,
  },
  {
    key: "news",
    fr: "News",
    ar: "الأخبار",
    iconWrap: "bg-violet-500/15 text-violet-800 ring-1 ring-violet-500/20",
    accent: "#7c3aed",
    icon: Newspaper,
    getValue: (s) => s.news,
  },
  {
    key: "reclamations",
    fr: "Réclamations",
    ar: "الشكاوى",
    iconWrap: "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/25",
    accent: "#d97706",
    icon: ClipboardList,
    getValue: (s) => s.reclamations,
  },
  {
    key: "forumPosts",
    fr: "Forum",
    ar: "المنتدى",
    iconWrap: "bg-sky-500/15 text-sky-800 ring-1 ring-sky-500/20",
    accent: "#0284c7",
    icon: MessagesSquare,
    getValue: (s) => s.forumPosts,
  },
  {
    key: "marketplaceProducts",
    fr: "Marketplace",
    ar: "السوق",
    iconWrap: "bg-teal-500/15 text-teal-800 ring-1 ring-teal-500/20",
    accent: "#0d9488",
    icon: Store,
    getValue: (s) => s.marketplaceProducts,
  },
];

function SparklineArea({ values, fillGradId, strokeGradId }: { values: number[]; fillGradId: string; strokeGradId: string }) {
  const w = 280;
  const h = 72;
  const pad = 4;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const linePts = values
    .map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
      const y = pad + (h - pad * 2) * (1 - (v - min) / span);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const firstX = pad;
  const lastX = pad + (w - pad * 2);
  const bottomY = h - pad;
  const areaPts = `${linePts} ${lastX},${bottomY} ${firstX},${bottomY}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[4.5rem] overflow-visible" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((r) => (
        <line
          key={r}
          x1={pad}
          x2={w - pad}
          y1={pad + r * (h - pad * 2)}
          y2={pad + r * (h - pad * 2)}
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-200/80"
          strokeDasharray="4 6"
        />
      ))}
      <polygon fill={`url(#${fillGradId})`} points={areaPts} />
      <polyline
        fill="none"
        stroke={`url(#${strokeGradId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePts}
      />
    </svg>
  );
}

/** Anneau de progression (0–100 %) — SVG */
function RingGauge({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-zinc-100" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

/** Donut conic-gradient + trou central */
function DistributionDonut({
  slices,
  centerLabel,
  centerSub,
}: {
  slices: { pct: number; color: string }[];
  centerLabel: string;
  centerSub: string;
}) {
  const gradient =
    slices.length === 0
      ? "conic-gradient(#e4e4e7 0deg 360deg)"
      : `conic-gradient(${slices
          .reduce<{ start: number; parts: string[] }>(
            (acc, s) => {
              const deg = s.pct * 360;
              const from = acc.start;
              const to = acc.start + deg;
              acc.parts.push(`${s.color} ${from}deg ${to}deg`);
              acc.start = to;
              return acc;
            },
            { start: 0, parts: [] as string[] },
          )
          .parts.join(", ")})`;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-44 h-44 sm:w-52 sm:h-52">
      <div
        className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/80"
        style={{ background: gradient }}
      />
      <div className="absolute inset-[26%] rounded-full bg-white/95 border border-white shadow-inner flex flex-col items-center justify-center text-center px-1">
        <span className="text-xl sm:text-2xl font-black text-zinc-900 tabular-nums leading-none tracking-tight">{centerLabel}</span>
        <span className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 leading-tight">{centerSub}</span>
      </div>
    </div>
  );
}

function BarStrip({
  label,
  value,
  max,
  accent,
  delay,
}: {
  label: string;
  value: number;
  max: number;
  accent: string;
  delay: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="relative rounded-2xl border border-white bg-white/60 overflow-hidden shadow-sm"
    >
      <div className="absolute start-0 top-0 bottom-0 w-1.5 rounded-s-2xl" style={{ backgroundColor: accent }} />
      <div className="ps-5 pe-4 py-3.5">
        <div className="flex justify-between items-baseline gap-2 mb-2">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest truncate">{label}</span>
          <span className="text-sm font-black tabular-nums shrink-0" style={{ color: accent }}>
            {value.toLocaleString("fr-TN")}
          </span>
        </div>
        <div className="h-3 rounded-full bg-zinc-100/90 overflow-hidden border border-zinc-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: delay + 0.1, duration: 0.65, ease: "circOut" }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 55%, white))`,
            }}
          />
        </div>
        <p className="text-[9px] font-bold text-zinc-400 mt-1.5 tabular-nums">{pct}%</p>
      </div>
    </motion.div>
  );
}

export function AdminStatsPanel({ t }: { t: (fr: string, ar: string) => string }) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uid = useId().replace(/:/g, "");
  const fillGradId = `${uid}-spark-fill`;
  const strokeGradId = `${uid}-spark-stroke`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchAdminDashboardStats();
      setStats(s);
    } catch {
      setError(t("Impossible de charger les statistiques.", "تعذر تحميل الإحصائيات."));
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const numericForMax = useCallback((s: AdminDashboardStats, m: MetricDef) => m.getValue(s), []);

  const maxBar = useMemo(() => {
    if (!stats) return 1;
    return Math.max(1, ...METRICS.map((m) => numericForMax(stats, m)));
  }, [stats, numericForMax]);

  const sparkValues = useMemo(() => {
    if (!stats) return METRICS.map(() => 0);
    return METRICS.map((m) => numericForMax(stats, m));
  }, [stats, numericForMax]);

  const donutSlices = useMemo(() => {
    if (!stats) return [];
    const sum = METRICS.reduce((acc, m) => acc + m.getValue(stats), 0);
    if (sum === 0) return [{ pct: 1, color: "#d4d4d8" }];
    return METRICS.map((m) => ({
      pct: m.getValue(stats) / sum,
      color: m.accent,
    }));
  }, [stats]);

  const donutTotal = useMemo(() => {
    if (!stats) return 0;
    return METRICS.reduce((s, m) => s + m.getValue(stats), 0);
  }, [stats]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-emerald-500/15 text-violet-800 ring-1 ring-violet-500/15 shadow-sm">
            <PieChart size={26} strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight font-display">{t("Statistiques", "إحصائيات")}</h2>
            <p className="text-xs text-zinc-500 font-bold mt-1">{t("Données réelles Firestore (agrégations).", "بيانات فعلية من فايربيس.")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-violet-200/90 bg-white/80 text-violet-800 text-[10px] font-black uppercase tracking-widest hover:bg-violet-50 hover:border-violet-300 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          {t("Actualiser", "تحديث")}
        </button>
      </div>

      {error ? (
        <p className="text-sm font-bold text-red-600 px-2 py-3 rounded-2xl bg-red-50 border border-red-100">{error}</p>
      ) : null}

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-[2rem] bg-white/50 border border-white">
          <Loader2 className="animate-spin text-violet-600" size={40} />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t("Chargement des métriques…", "جاري تحميل المؤشرات…")}</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Bento : donut + légende + sparkline */}
          <div className="grid gap-6 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-5 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-white/90 via-violet-50/40 to-emerald-50/50 border border-white shadow-sm flex flex-col sm:flex-row items-center gap-8"
            >
              <DistributionDonut
                slices={donutSlices}
                centerLabel={String(donutTotal)}
                centerSub={t("Entités indexées", "عناصر")}
              />
              <div className="flex-1 w-full min-w-0 space-y-3">
                <p className="text-[10px] font-black uppercase text-violet-800/90 tracking-[0.2em]">
                  {t("Répartition des volumes", "توزيع الحجوم")}
                </p>
                <ul className="space-y-2.5">
                  {METRICS.map((m) => {
                    const v = m.getValue(stats);
                    const pct = donutTotal > 0 ? Math.round((v / donutTotal) * 100) : 0;
                    const Icon = m.icon;
                    return (
                      <li key={m.key} className="flex items-center gap-3 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ring-2 ring-white" style={{ backgroundColor: m.accent }} />
                        <Icon size={16} className="text-zinc-400 shrink-0" aria-hidden />
                        <span className="text-xs font-bold text-zinc-600 truncate flex-1">{t(m.fr, m.ar)}</span>
                        <span className="text-xs font-black tabular-nums text-zinc-900 shrink-0">
                          {v}{" "}
                          <span className="text-[10px] font-bold text-zinc-400">({pct}%)</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="lg:col-span-7 p-6 sm:p-8 rounded-[2rem] bg-white/70 border border-white shadow-sm flex flex-col justify-center"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                  {t("Profil d’activité (relatif)", "نشاط نسبي")}
                </p>
                <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  {t("Aperçu", "لمحة")}
                </span>
              </div>
              <div className="text-violet-600 w-full">
                <SparklineArea values={sparkValues} fillGradId={fillGradId} strokeGradId={strokeGradId} />
              </div>
              <p className="text-[10px] text-zinc-500 font-bold mt-3 leading-relaxed">
                {t(
                  "Courbe indicative : chaque point représente une catégorie (échelle interne).",
                  "منحنى توضيحي لكل فئة (مقياس داخلي).",
                )}
              </p>
            </motion.div>
          </div>

          {/* Cartes métriques + anneaux */}
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-4 px-1">
              {t("Indicateurs clés", "مؤشرات رئيسية")}
            </p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {METRICS.map((m, i) => {
                const raw = m.getValue(stats);
                const forRing = numericForMax(stats, m);
                const ringPct = maxBar > 0 ? Math.min(100, Math.round((forRing / maxBar) * 100)) : 0;
                const barPct = maxBar > 0 ? Math.min(100, Math.round((forRing / maxBar) * 100)) : 0;
                const Icon = m.icon;
                const display = String(raw);
                return (
                  <motion.div
                    key={m.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i }}
                    className="relative overflow-hidden rounded-2xl border border-white bg-white/70 shadow-sm p-5 sm:p-6"
                  >
                    <div
                      className="pointer-events-none absolute -end-6 -top-6 h-28 w-28 rounded-full opacity-[0.12] blur-2xl"
                      style={{ backgroundColor: m.accent }}
                    />
                    <div className="relative flex gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", m.iconWrap)}>
                        <Icon size={22} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest truncate">{t(m.fr, m.ar)}</p>
                        <p className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1 tabular-nums tracking-tight break-words">{display}</p>
                        <div className="mt-4 flex items-center gap-3">
                          <RingGauge pct={ringPct} color={m.accent} size={48} />
                          <div className="flex-1 min-w-0">
                            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-100/80">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barPct}%` }}
                                transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: "circOut" }}
                                className="h-full rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, ${m.accent}, color-mix(in srgb, ${m.accent} 50%, #a7f3d0))`,
                                }}
                              />
                            </div>
                            <p className="text-[9px] font-bold text-zinc-500 mt-1.5 uppercase tracking-wide">
                              {t("Intensité relative", "شدة نسبية")} · {ringPct}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Barres horizontales */}
          <div className="p-6 sm:p-8 rounded-[2rem] bg-white/70 border border-white shadow-sm space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                {t("Comparatif barres", "مقارنة بالأعمدة")}
              </p>
              <span className="text-[9px] font-bold text-zinc-400">{t("Échelle max. tableau", "أقصى في الجدول")}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {METRICS.map((m, i) => (
                <BarStrip
                  key={`bar-${m.key}`}
                  label={t(m.fr, m.ar)}
                  value={m.getValue(stats)}
                  max={maxBar}
                  accent={m.accent}
                  delay={0.04 * i}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
