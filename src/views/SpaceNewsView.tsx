"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { motion } from "motion/react";
import { subscribeNews } from "@/lib/firebase/appContentRepos";
import type { NewsArticle } from "@/models/types";

export function SpaceNewsView({ t }: { t: (fr: string, ar: string) => string }) {
  const [items, setItems] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const unsub = subscribeNews(setItems);
    return () => unsub();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-700">
          <Newspaper size={26} />
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t("Actualités", "الأخبار")}</h2>
          <p className="text-xs text-zinc-500 font-bold mt-1">{t("Articles publiés par l’administration.", "مقالات من الإدارة.")}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm font-bold text-zinc-500 text-center py-12 rounded-2xl bg-white/50 border border-white">
          {t("Aucune actualité pour le moment.", "لا أخبار حالياً.")}
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm overflow-hidden">
              <h3 className="text-lg font-black text-zinc-900">{t(item.titleFr, item.titleAr)}</h3>
              <p className="text-xs text-zinc-400 font-bold mt-1">
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
              </p>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="mt-4 w-full max-h-72 object-cover rounded-2xl border border-zinc-100"
                />
              ) : null}
              <p className="text-sm text-zinc-700 font-medium leading-relaxed mt-4 whitespace-pre-wrap">{t(item.bodyFr, item.bodyAr)}</p>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
