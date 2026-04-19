"use client";

import { useState } from "react";
import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { deleteAdminNotification, markAdminNotificationRead } from "@/lib/firebase/appContentRepos";
import type { AdminNotification } from "@/models/types";

export function AdminAlertsPanel({ t, items }: { t: (fr: string, ar: string) => string; items: AdminNotification[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onMarkRead(id: string) {
    setBusyId(id);
    try {
      await markAdminNotificationRead(id);
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string) {
    setBusyId(id);
    try {
      await deleteAdminNotification(id);
    } finally {
      setBusyId(null);
    }
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8 max-w-3xl">
      <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-800">
          <Bell size={26} />
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t("Signalements & alertes", "تنبيهات وبلاغات")}</h2>
          <p className="text-xs text-zinc-500 font-bold mt-1">
            {unread > 0
              ? t(`${unread} notification(s) non lue(s).`, `${unread} إشعار غير مقروء.`)
              : t("Les citoyens signalent ici les publications du forum.", "تبليغات المنتدى تظهر هنا.")}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm font-bold text-zinc-500 text-center py-12 rounded-2xl bg-white/50 border border-white">
          {t("Aucune notification.", "لا توجد تنبيهات.")}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`p-5 rounded-2xl border shadow-sm ${n.read ? "bg-white/50 border-zinc-100" : "bg-amber-50/80 border-amber-200"}`}
            >
              <p className="text-xs text-zinc-400 font-bold mb-2">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</p>
              <p className="text-sm font-bold text-zinc-900 leading-relaxed whitespace-pre-wrap">{t(n.bodyFr, n.bodyAr)}</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-end">
                {!n.read ? (
                  <button
                    type="button"
                    disabled={busyId === n.id}
                    onClick={() => void onMarkRead(n.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[10px] font-black uppercase text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {busyId === n.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    {t("Marquer lu", "تعليم كمقروء")}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busyId === n.id}
                  onClick={() => void onDelete(n.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-black uppercase text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {t("Supprimer", "حذف")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
