"use client";

import { cn } from "@/lib/cn";

export function AdminStat({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };
  return (
    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 flex items-center gap-6 shadow-xl">
      <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center", colorMap[color])}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-900 leading-none tracking-tighter">{value}</span>
          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">{sub}</span>
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };
  return (
    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 flex flex-col items-center justify-center text-center shadow-xl hover:bg-white transition-all">
      <div className={cn("p-4 rounded-[1.5rem] mb-6", colorMap[color])}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-zinc-900 leading-none">{value}</p>
      <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase">{sub}</p>
    </div>
  );
}

