"use client";

import { Code } from "lucide-react";
import type { AdminEventSync } from "@/models/types";

export function SchemaView({ schemaData, t }: { schemaData: AdminEventSync; t: (fr: string, ar: string) => string }) {
  return (
    <div className="bg-zinc-900 rounded-[3.5rem] border border-white/10 overflow-hidden flex flex-col h-full shadow-2xl relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="p-10 border-b border-white/5 bg-white/5 backdrop-blur-3xl flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{t("Documentation API", "توثيق الـ API")}</h3>
          <p className="text-[10px] font-black text-emerald-400 mt-2 uppercase tracking-widest italic">SYNC_PROTOCOL_v1.0.0_STABLE</p>
        </div>
        <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl">
          <Code size={24} />
        </div>
      </div>
      <div className="flex-1 p-10 font-mono text-sm bg-zinc-950/50 text-emerald-400/80 overflow-auto selection:bg-emerald-500/30 scrollbar-hide relative z-10">
        <pre className="p-8 bg-black/40 rounded-[2rem] border border-white/5">{JSON.stringify(schemaData, null, 2)}</pre>
      </div>
      <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between relative z-10">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Verified // GBS_CORE</span>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">STABLE_BUILD</span>
      </div>
    </div>
  );
}
