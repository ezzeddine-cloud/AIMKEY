"use client";

import { useEffect, useState } from "react";
import { User, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { fetchUserProfile, saveUserProfile } from "@/lib/firebase/userProfile";
import type { UserProfileExtras, UserRole } from "@/models/types";

function validateProfile(
  displayName: string,
  phone: string,
  address: string,
  t: (fr: string, ar: string) => string,
): { displayName?: string; phone?: string; address?: string } | null {
  const err: { displayName?: string; phone?: string; address?: string } = {};
  const dn = displayName.trim();
  if (dn.length > 80) err.displayName = t("Nom trop long (80 car. max).", "الاسم طويل جداً.");
  const ph = phone.trim();
  if (ph.length > 0 && ph.replace(/\D/g, "").length < 8) {
    err.phone = t("Numéro invalide (8 chiffres min. si renseigné).", "رقم غير صالح.");
  }
  if (address.trim().length > 500) err.address = t("Adresse trop longue (500 max).", "عنوان طويل جداً.");
  return Object.keys(err).length ? err : null;
}

export function ProfileView({
  t,
  userUid,
  userEmail,
}: {
  t: (fr: string, ar: string) => string;
  userUid: string;
  userEmail: string | null;
}) {
  const [role, setRole] = useState<UserRole>("FARMER");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ displayName?: string; phone?: string; address?: string }>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await fetchUserProfile(userUid);
        if (cancelled) return;
        if (p) {
          setRole(p.role);
          setDisplayName(p.displayName ?? "");
          setPhone(p.phone ?? "");
          setAddress(p.address ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userUid]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setFieldErrors({});
    const ve = validateProfile(displayName, phone, address, t);
    if (ve) {
      setFieldErrors(ve);
      return;
    }
    setSaving(true);
    try {
      const extras: UserProfileExtras = {
        displayName: displayName.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      };
      await saveUserProfile(userUid, userEmail ?? "", role, extras);
      setMsg(t("Profil enregistré.", "تم حفظ الملف."));
    } catch {
      setMsg(t("Échec de l’enregistrement.", "فشل الحفظ."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/70 border border-white shadow-sm">
        <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-700">
          <User size={26} />
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t("Mon profil", "ملفي الشخصي")}</h2>
          <p className="text-xs text-zinc-500 font-bold mt-1">{t("Informations visibles par vous uniquement (sauf rôle).", "معلوماتك.")}</p>
        </div>
      </div>

      <form onSubmit={onSave} className="p-6 rounded-[2rem] bg-white/70 border border-white space-y-4 shadow-sm">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400">{t("E-mail", "البريد")}</label>
          <input readOnly value={userEmail ?? ""} className="mt-1 w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-500" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400">{t("Nom affiché", "الاسم الظاهر")}</label>
          <input
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setFieldErrors((f) => ({ ...f, displayName: undefined }));
            }}
            maxLength={80}
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm font-bold ${fieldErrors.displayName ? "border-red-300" : "border-zinc-200"}`}
          />
          {fieldErrors.displayName ? <p className="text-xs text-red-600 mt-1">{fieldErrors.displayName}</p> : null}
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400">{t("Téléphone", "الهاتف")}</label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setFieldErrors((f) => ({ ...f, phone: undefined }));
            }}
            maxLength={32}
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm font-bold ${fieldErrors.phone ? "border-red-300" : "border-zinc-200"}`}
          />
          {fieldErrors.phone ? <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p> : null}
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400">{t("Adresse", "العنوان")}</label>
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setFieldErrors((f) => ({ ...f, address: undefined }));
            }}
            rows={3}
            maxLength={500}
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm font-bold resize-none ${fieldErrors.address ? "border-red-300" : "border-zinc-200"}`}
          />
          {fieldErrors.address ? <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p> : null}
        </div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase">
          {t("Rôle du compte (non modifiable ici)", "دور الحساب")}: {role}
        </p>
        {msg ? <p className="text-sm font-bold text-emerald-700">{msg}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-xl bg-zinc-900 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 flex justify-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : null}
          {t("Enregistrer", "حفظ")}
        </button>
      </form>
    </motion.div>
  );
}
