"use client";

import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";

// Dynamically import the Leaflet implementation to avoid SSR issues
const LeafletHeatmap = dynamic(() => import("./LeafletHeatmap"), {
  ssr: false,
  loading: () => (
    <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/40 overflow-hidden flex flex-col h-full shadow-xl shadow-emerald-900/5 min-h-[400px] animate-pulse">
      <div className="p-6 border-b border-white/40 flex justify-between items-center bg-white/20">
        <div>
          <h3 className="font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-tight">
            <BarChart3 size={18} className="text-emerald-500" />
            POLLUTION_LIVE
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5 uppercase tracking-widest italic">Chargement de la carte...</p>
        </div>
      </div>
    </div>
  ),
});

export function PollutionHeatmap() {
  return <LeafletHeatmap />;
}
