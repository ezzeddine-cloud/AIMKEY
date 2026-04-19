/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/cn";
import { getFirebaseAuth, isEmulatorMode, isFirebaseConfigured } from "@/lib/firebase";
import type { Message } from "@/models/types";

export function Chatbot({ t }: { t: (fr: string, ar: string) => string; isRTL: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: t(
        "Bienvenue sur **اسألني** ! Assistant **uniquement agricole** pour **Gabes bin ydik** — les réponses du modèle sont **en arabe tunisien (tounsi)**, même si vous écrivez en français. Hors agriculture : refus court. Question sur la ferme, l’eau, le sol ? 🌴",
        "أهلاً بيك في **اسألني**! مساعد **فلاحي فقط** مع **ڤَابس بين يديك**. الجواب **دايما بالتونسي** — حتى لو كتبت بالفرنساوي. ما نحكيش على حاجة برّا الفلاحة. **اسأل على الزرع، الماء، التربة، الآفات… كيفاش نعاونك؟** 🌴",
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // Note: L'API est maintenant publique pour le Chatbot de la Landing Page.
      // Nous n'avons plus besoin d'envoyer le Bearer Token.

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = (await res.json()) as { text?: string; error?: string; detail?: string; hint?: string };
      if (!res.ok || data.error) {
        if (data.error === "unauthorized") {
          throw new Error(
            t("Session expirée ou non authentifié. Reconnectez-vous.", "انتهت الجلسة أو غير مصرّح. سجّل الدخول من جديد."),
          );
        }
        if (data.error === "missing_api_key") {
          throw new Error(
            t(
              "Clé LLM manquante côté serveur : définissez OPENROUTER_API_KEY (OpenRouter) ou GEMINI_API_KEY dans .env.local / l’hébergeur, puis redémarrez ou redeployez.",
              "مفتاح النموذج ناقص: OPENROUTER_API_KEY أو GEMINI_API_KEY في .env.local أو الاستضافة ثم أعد التشغيل أو النشر.",
            ),
          );
        }
        if (data.error === "invalid_messages") {
          throw new Error(t("Message invalide.", "رسالة غير صالحة."));
        }
        if (data.error === "empty_response") {
          throw new Error(
            t(
              "Réponse vide (filtre de sécurité ou modèle). Réessayez avec une autre formulation.",
              "رد فارغ (فلتر أو نموذج). جرّب صياغة أخرى.",
            ),
          );
        }
        if (data.hint === "invalid_api_key") {
          throw new Error(
            t(
              "Clé API refusée (401/403). Vérifiez OPENROUTER_API_KEY ou GEMINI_API_KEY sur le serveur.",
              "مفتاح API مرفوض. تحقق من OPENROUTER_API_KEY أو GEMINI_API_KEY.",
            ),
          );
        }
        if (data.error === "rate_limited" || data.hint === "rate_limited") {
          throw new Error(
            t("Trop de requêtes. Patientez une minute puis réessayez.", "طلبات بزاف. انتظر دقيقة وجرب."),
          );
        }
        if (data.hint === "timeout") {
          throw new Error(
            t("Délai dépassé. Réessayez.", "انتهت المهلة. أعد المحاولة."),
          );
        }
        const detail = data.detail ? ` — ${data.detail}` : "";
        throw new Error((data.error ?? "request_failed") + detail);
      }
      const reply = data.text || t("SYS_ERROR: Échec de connexion.", "خطأ في النظام: فشل الاتصال.");
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (error) {
      console.error(error);
      const fallback = t("SYS_FAULT: Connexion API perdue.", "خطأ في الاتصال.");
      const msg = error instanceof Error && error.message && error.message !== "request_failed" ? error.message : fallback;
      setMessages((prev) => [...prev, { role: "model", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/40 overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/40 flex items-center gap-5">
        <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-500/20">
          أ
        </div>
        <div>
          <h3 className="font-black text-lg text-zinc-900 uppercase tracking-tight leading-none">اسألني _ LIVE</h3>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1 italic">
            {t("Réponses en tounsi — agriculture seulement", "جواب بالتونسي — فلاحة فقط")}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-white/10 custom-scrollbar">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "max-w-[85%] p-6 rounded-[2rem] font-medium text-sm leading-relaxed shadow-sm",
              m.role === "user"
                ? "bg-emerald-600 text-white self-end ml-auto rounded-tr-none shadow-emerald-500/20"
                : "bg-white text-zinc-700 self-start shadow-zinc-200/50 rounded-tl-none border border-zinc-100",
            )}
          >
            <div className="prose prose-sm font-inherit text-inherit">
              <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-emerald-600 p-4 font-black text-[10px] uppercase tracking-widest">
            <Loader2 size={14} className="animate-spin" />
            {t("Rédaction en tounsi…", "شوية صبر — الجواب يجهّز بالتونسي…")}
          </div>
        )}
      </div>

      <div className="p-8 border-t border-white/40 bg-white/30 backdrop-blur-md">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("Question sur cultures, eau, sol, ravageurs…", "سؤال على الزرع، الماء، التربة، الآفات…")}
            className="flex-1 bg-white border border-zinc-100 rounded-[1.5rem] py-4 px-6 text-zinc-900 font-medium text-sm focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-4 bg-emerald-600 text-white rounded-[1.5rem] hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
