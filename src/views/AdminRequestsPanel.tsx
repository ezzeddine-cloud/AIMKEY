"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Mail, Phone, CheckCircle, Clock } from "lucide-react";
import { motion } from "motion/react";
import { subscribeInstallationRequests, updateInstallationRequestStatus } from "@/lib/firebase/appContentRepos";
import type { InstallationRequest } from "@/models/types";
import { cn } from "@/lib/cn";

export function AdminRequestsPanel({ t }: { t: (fr: string, ar: string) => string }) {
  const [requests, setRequests] = useState<InstallationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeInstallationRequests((data) => {
      setRequests(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleStatusChange(id: string, currentStatus: string) {
    const nextStatus = currentStatus === "pending" ? "contacted" : currentStatus === "contacted" ? "installed" : "pending";
    try {
      await updateInstallationRequestStatus(id, nextStatus as InstallationRequest["status"]);
    } catch (err) {
      console.error(err);
      alert(t("Erreur de mise à jour.", "خطأ في التحديث."));
    }
  }

  async function handleSendEmail(req: InstallationRequest) {
    if (!req.email) {
      alert(t("Pas d'email fourni par ce fermier.", "لم يتم توفير بريد إلكتروني."));
      return;
    }
    
    // Call our SMTP API route
    try {
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #059669; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Gabes bin ydik</h1>
            <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Smart City Oasis</p>
          </div>
          <div style="padding: 32px; background-color: white;">
            <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">Bonjour ${req.name},</h2>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Nous avons bien reçu votre demande d'installation IoT pour votre ferme située à <strong>${req.location}</strong>.
            </p>
            <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">Prochaine étape :</p>
              <p style="margin: 4px 0 0 0; color: #15803d; font-size: 14px;">
                Notre équipe technique va analyser vos besoins et vous contactera très prochainement au <strong>${req.phone}</strong> pour planifier l'intervention.
              </p>
            </div>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 32px;">
              Merci de faire confiance à <strong>Gabes bin ydik</strong> pour la modernisation de votre exploitation et la préservation de nos ressources en eau.
            </p>
            <div style="border-top: 1px solid #f3f4f6; pt-24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                © 2026 Gabes Smart City — Projet Hackathon.
              </p>
            </div>
          </div>
        </div>
      `;

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: req.email,
          subject: "Confirmation de votre demande - Gabes bin ydik",
          text: `Bonjour ${req.name}, nous avons reçu votre demande pour votre ferme à ${req.location}. Nous vous contacterons au ${req.phone}.`,
          html: emailHtml
        })
      });
      
      if (!res.ok) throw new Error("API error");
      alert(t("Email envoyé avec succès !", "تم إرسال البريد بنجاح!"));
      if (req.status === "pending") {
        await updateInstallationRequestStatus(req.id, "contacted");
      }
    } catch (err) {
      console.error(err);
      alert(t("Erreur lors de l'envoi de l'email. Vérifiez la console ou le fichier .env.local", "خطأ في الإرسال."));
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-800">
            <ClipboardList size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
              {t("Demandes d'installation", "طلبات التركيب")}
            </h2>
            <p className="text-xs text-zinc-500 font-bold mt-1">
              {t("Gérez les demandes de capteurs IoT des agriculteurs.", "إدارة طلبات أجهزة استشعار IoT من المزارعين.")}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-500">{t("Chargement...", "جاري التحميل...")}</div>
      ) : requests.length === 0 ? (
        <div className="p-8 rounded-[2rem] bg-white/50 border border-white text-center font-bold text-zinc-500 shadow-sm">
          {t("Aucune demande pour le moment.", "لا توجد طلبات حالياً.")}
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="p-6 rounded-[2rem] bg-white border border-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-zinc-900">{req.name}</h3>
                  <button 
                    onClick={() => handleStatusChange(req.id, req.status)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                      req.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" :
                      req.status === "contacted" ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" :
                      "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                    )}
                  >
                    {req.status === "pending" && <Clock size={12} />}
                    {req.status === "contacted" && <Mail size={12} />}
                    {req.status === "installed" && <CheckCircle size={12} />}
                    {req.status === "pending" ? t("En attente", "قيد الانتظار") : req.status === "contacted" ? t("Contacté", "تم الاتصال") : t("Installé", "تم التركيب")}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs font-bold text-zinc-500">
                  <p>📍 {req.location}</p>
                  <p>📏 {req.size}</p>
                  <p>📅 {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "--"}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a 
                  href={`tel:${req.phone}`}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <Phone size={16} />
                  {req.phone}
                </a>
                
                <button 
                  onClick={() => handleSendEmail(req)}
                  disabled={!req.email}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                >
                  <Mail size={16} />
                  {req.email ? t("Envoyer Email", "إرسال بريد") : t("Pas d'email", "لا يوجد بريد")}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
