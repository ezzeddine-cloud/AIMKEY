"use client";

import { TreeDeciduous } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#f0f4f0" }}>
      <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-2xl flex items-center justify-center text-emerald-600 border border-white animate-pulse">
        <TreeDeciduous size={32} />
      </div>
      <p className="text-[10px] font-black text-zinc-400 tracking-[0.2em] text-center max-w-[90vw] leading-relaxed">
        <span className="uppercase">Gabes bin ydik</span>
        <span className="mx-2 text-zinc-300">·</span>
        <span className="font-arabic normal-case">ڤَابس بين يديك</span>
      </p>
    </div>
  );
}
