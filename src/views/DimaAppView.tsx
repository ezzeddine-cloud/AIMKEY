/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import {
  MessageCircle,
  TreeDeciduous,
  Wind,
  ClipboardList,
  LogOut,
  Layers3,
  Droplets,
  Inbox,
  CalendarDays,
  PieChart,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";
import type { Lang, UserRole } from "@/models/types";
import { AdminEventsPanel } from "./AdminEventsPanel";
import { AdminStatsPanel } from "./AdminStatsPanel";

import { EnvironmentalMap } from "./EnvironmentalMap";
import { FarmerSoilSensorView } from "./FarmerSoilSensorView";
import { FarmerWaterWasteView } from "./FarmerWaterWasteView";
import { ProfileView } from "./ProfileView";
import { SpaceReclamationView } from "./SpaceReclamationView";
import { OpenDataStatsModal } from "./OpenDataStatsModal";
import { AdminRequestsPanel } from "./AdminRequestsPanel";

type NavItem = { id: string; label: string; icon: typeof MessageCircle };

export type DimaAppViewProps = {
  role: UserRole;
  userUid: string;
  userEmail: string | null;
  lang: Lang;
  setLang: (l: Lang) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  events: import("@/models/types").CityEvent[];
  isRTL: boolean;
  t: (fr: string, ar: string) => string;
  logout: () => void | Promise<void>;
};

function navForRole(role: UserRole, t: (fr: string, ar: string) => string): NavItem[] {
  if (role === "FARMER" || role === "CITIZEN") {
    return [
      { id: "capteur", label: t("Capteur sol", "مستشعر التربة"), icon: Layers3 },
      { id: "eau", label: t("Modèle gaspillage d’eau", "نموذج هدر المياه"), icon: Droplets },
      { id: "pollution", label: t("Alerte & heatmap pollution air", "تنبيه وخريطة تلوث الهواء"), icon: Wind },
      { id: "reclamation", label: t("Réclamation", "شكوى"), icon: ClipboardList },

      { id: "profile", label: t("Mon profil", "ملفي"), icon: User },
    ];
  }
  return [
    // Admin Dash
    { id: "reclamations", label: t("Réclamation", "شكوى"), icon: Inbox },
    { id: "installations", label: t("Demandes d'installation", "طلبات التركيب"), icon: ClipboardList },
    { id: "events", label: t("Événement", "فعاليات"), icon: CalendarDays },
    { id: "stats", label: t("Statistique", "إحصائيات"), icon: PieChart },
    { id: "profile", label: t("Mon profil", "ملفي"), icon: User },
  ];
}

export function DimaAppView({
  role,
  userUid,
  userEmail,
  lang,
  setLang,
  activeTab,
  setActiveTab,
  events,
  isRTL,
  t,
  logout,
}: DimaAppViewProps) {
  const nav = navForRole(role, t);

  return (
    <div
      className={cn("min-h-screen font-sans transition-colors duration-500", isRTL ? "font-arabic" : "font-sans")}
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: "linear-gradient(180deg, #ecfdf3 0%, #f0f4f0 45%, #e8f5ec 100%)" }}
    >
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-300/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col p-4 md:p-8 relative z-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 shrink-0">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-wrap">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center shrink-0 p-2 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1
                className={cn(
                  "text-2xl md:text-3xl font-black text-zinc-900 tracking-tighter leading-none",
                  !isRTL && "uppercase",
                )}
              >
                {t("Gabes bin ydik", "ڤَابس بين يديك")}
              </h1>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SMART_CITY_GBS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white/50 backdrop-blur-md p-3 rounded-full border border-white/80 shadow-sm">
            {userEmail && (
              <span className="hidden sm:inline max-w-[200px] truncate text-[10px] font-bold text-zinc-500 px-2" title={userEmail}>
                {userEmail}
              </span>
            )}
            <span
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase shrink-0 border",
                role === "ADMIN"
                  ? "bg-violet-100 text-violet-800 border-violet-200"
                  : "bg-zinc-900 text-white border-transparent",
              )}
            >
              {role === "ADMIN" ? t("Espace admin", "فضاء الإدارة") : t("Espace agriculteur", "فضاء الفلاح")}
            </span>

            <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block" />

            <div className="flex bg-zinc-200/40 p-1 rounded-full overflow-hidden">
              <button
                type="button"
                onClick={() => setLang("fr")}
                className={cn("px-4 py-2 rounded-full text-[10px] font-black transition-all", lang === "fr" ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-400")}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLang("ar")}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-black transition-all font-arabic",
                  lang === "ar" ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-400",
                )}
              >
                AR
              </button>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              {t("Déconnexion", "خروج")}
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-[22rem] shrink-0 lg:sticky lg:top-8 max-h-[min(70vh,32rem)] lg:max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 -mr-1">
            <nav className="flex flex-col gap-2.5 pb-2">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex items-center gap-4 py-4 px-5 rounded-full transition-all relative border text-left shadow-sm",
                      isRTL && "text-right flex-row-reverse",
                      active
                        ? "bg-white border-white text-emerald-600 shadow-md"
                        : "bg-white/35 border-white/50 text-zinc-500 hover:bg-white/55 hover:text-zinc-700",
                    )}
                  >
                    <Icon size={20} className={cn("shrink-0", active ? "text-emerald-600" : "text-zinc-400")} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-snug flex-1">{item.label}</span>
                    {active ? (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                    ) : (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-transparent" aria-hidden />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 w-full min-h-[560px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${role}-${activeTab}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.28, ease: "circOut" }}
                className="h-full"
              >
                {(role === "FARMER" || role === "CITIZEN") && (
                  <>
                    {activeTab === "capteur" && <FarmerSoilSensorView t={t} />}
                    {activeTab === "eau" && <FarmerWaterWasteView t={t} />}
                    {activeTab === "pollution" && (
                      <div className="space-y-4">
                        <div className="rounded-[2rem] bg-white/70 border border-white px-6 py-4 shadow-sm">
                          <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                            <Wind className="text-emerald-600" size={22} />
                            {t("Alerte qualité de l’air & heatmap", "تنبيه جودة الهواء والخريطة الحرارية")}
                          </h2>
                          <p className="text-xs text-zinc-500 font-bold mt-1">
                            {t("Visualisation indicative (PM2.5, zones sensibles).", "عرض توضيحي (جسيمات، مناطق حساسة).")}
                          </p>
                        </div>
                        <EnvironmentalMap t={t} />
                      </div>
                    )}
                    {activeTab === "reclamation" && (
                      <SpaceReclamationView t={t} variant="citizen" userUid={userUid} userEmail={userEmail} />
                    )}

                    {activeTab === "profile" && <ProfileView t={t} userUid={userUid} userEmail={userEmail} />}
                  </>
                )}

                {role === "ADMIN" && (
                  <>
                    {/* Tech Dash views */}
                    {activeTab === "capteur" && <FarmerSoilSensorView t={t} />}
                    {activeTab === "eau" && <FarmerWaterWasteView t={t} />}
                    {activeTab === "pollution" && (
                      <div className="space-y-4">
                        <div className="rounded-[2rem] bg-white/70 border border-white px-6 py-4 shadow-sm">
                          <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                            <Wind className="text-emerald-600" size={22} />
                            {t("Alerte qualité de l’air & heatmap", "تنبيه جودة الهواء والخريطة الحرارية")}
                          </h2>
                          <p className="text-xs text-zinc-500 font-bold mt-1">
                            {t("Visualisation indicative (PM2.5, zones sensibles).", "عرض توضيحي (جسيمات، مناطق حساسة).")}
                          </p>
                        </div>
                        <EnvironmentalMap t={t} />
                      </div>
                    )}

                    
                    {/* Admin views */}
                    {activeTab === "reclamations" && (
                      <SpaceReclamationView t={t} variant="admin" userUid={userUid} userEmail={userEmail} />
                    )}
                    {activeTab === "installations" && <AdminRequestsPanel t={t} />}
                    {activeTab === "events" && <AdminEventsPanel t={t} events={events} />}
                    {activeTab === "stats" && <AdminStatsPanel t={t} />}
                    {activeTab === "profile" && <ProfileView t={t} userUid={userUid} userEmail={userEmail} />}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <footer className="mt-16 pt-8 border-t border-emerald-200/40 flex flex-col md:flex-row justify-between items-center gap-6 pb-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              © 2026 {t("Gabes bin ydik", "ڤَابس بين يديك")}
            </span>
            <div className="h-4 w-px bg-zinc-200" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t("Smart City", "مدينة ذكية")}</span>
          </div>
          <div className="flex flex-wrap gap-4 justify-center md:justify-end text-[10px] font-black text-zinc-400 uppercase tracking-tighter items-center">
            <button type="button" onClick={logout} className="hover:text-emerald-600 transition-colors flex items-center gap-2">
              <LogOut size={14} />
              {t("Déconnexion", "خروج")}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
