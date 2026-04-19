"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  TreeDeciduous,
  Tractor,
  Loader2,
  Mail,
  Lock,
  LogIn,
  Chrome,
  UserPlus,
  Phone,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { normalizeEmail, validateSignupEmail, validateSignupPassword, SIGNUP_PASSWORD_MIN } from "@/lib/validation/signup";
import type { GoogleProfilePending, Lang, PublicUserRole, UserProfileExtras } from "@/models/types";

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-beige" />
      </div>
      <div className="relative flex justify-center text-xs uppercase text-ink/40">
        <span className="bg-white px-2">{label}</span>
      </div>
    </div>
  );
}

export function LoginView({
  t,
  isRTL,
  lang,
  setLang,
  signIn,
  signUp,
  signInWithGoogle,
  googleProfilePending,
  completeGoogleProfile,
  cancelGoogleProfile,
  authError,
  firebaseConfigured,
  pendingEmailVerification = false,
  resendEmailVerification,
  reloadAuthUser,
  sendPasswordReset,
  logout,
}: {
  t: (fr: string, ar: string) => string;
  isRTL: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: PublicUserRole, extras?: UserProfileExtras) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  googleProfilePending: GoogleProfilePending | null;
  completeGoogleProfile: (role: PublicUserRole, extras?: UserProfileExtras) => Promise<void>;
  cancelGoogleProfile: () => Promise<void>;
  authError: string | null;
  firebaseConfigured: boolean;
  pendingEmailVerification?: boolean;
  resendEmailVerification?: () => Promise<void>;
  reloadAuthUser?: () => Promise<void>;
  sendPasswordReset?: (email: string) => Promise<void>;
  logout?: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phoneReg, setPhoneReg] = useState("");
  const [addressReg, setAddressReg] = useState("");
  const [googlePhone, setGooglePhone] = useState("");
  const [googleAddress, setGoogleAddress] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  /** Erreurs par champ (inscription) */
  const [registerFieldErrors, setRegisterFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
    phone?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    if (googleProfilePending) {
      setGooglePhone(googleProfilePending.phone ?? "");
      setGoogleAddress(googleProfilePending.address ?? "");
    } else {
      setGooglePhone("");
      setGoogleAddress("");
    }
  }, [googleProfilePending?.uid]);

  const errorMsg = localError ?? authError;
  const loadingLabel = t("Chargement…", "جاري التحميل…");

  async function onSubmitLogin(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!firebaseConfigured) return;
    setSubmitting(true);
    await signIn(email, password);
    setSubmitting(false);
  }

  async function onSubmitRegister(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setRegisterFieldErrors({});
    if (!firebaseConfigured) return;

    const emailNorm = normalizeEmail(email);
    const fe: { email?: string; password?: string; confirm?: string; phone?: string } = {};

    const emailIssue = validateSignupEmail(emailNorm);
    if (emailIssue === "empty") {
      fe.email = t("L’e-mail est obligatoire.", "البريد إلزامي.");
    } else if (emailIssue === "invalid") {
      fe.email = t("Format d’e-mail invalide (ex. : nom@domaine.com).", "صيغة البريد غير صالحة.");
    } else if (emailIssue === "too_long") {
      fe.email = t("E-mail trop long.", "البريد طويل جداً.");
    }

    const pwdIssue = validateSignupPassword(password);
    if (pwdIssue === "empty") {
      fe.password = t("Le mot de passe est obligatoire.", "كلمة المرور إلزامية.");
    } else if (pwdIssue === "too_short") {
      fe.password = t(
        `Mot de passe : au moins ${SIGNUP_PASSWORD_MIN} caractères (exigence Firebase).`,
        `كلمة المرور: ${SIGNUP_PASSWORD_MIN} أحرف على الأقل (مطلوب فايربيس).`,
      );
    } else if (pwdIssue === "too_long") {
      fe.password = t("Mot de passe trop long.", "كلمة المرور طويلة جداً.");
    } else if (pwdIssue === "weak_pattern") {
      fe.password = t(
        "Mot de passe : au moins une lettre et un chiffre (8 caractères min.).",
        "كلمة المرور: حرف ورقم على الأقل (8 أحرف كحد أدنى).",
      );
    }

    if (password !== confirm) {
      fe.confirm = t("La confirmation ne correspond pas au mot de passe.", "التأكيد لا يطابق كلمة المرور.");
    }

    const ph = phoneReg.trim();
    if (ph.length > 0 && ph.replace(/\D/g, "").length < 8) {
      fe.phone = t("Numéro trop court (8 chiffres min. si renseigné).", "رقم قصير (8 أرقام على الأقل إن وُجد).");
    }

    if (Object.keys(fe).length > 0) {
      setRegisterFieldErrors(fe);
      return;
    }

    setSubmitting(true);
    const extras: UserProfileExtras = {
      phone: ph.length ? ph : undefined,
      address: addressReg.trim() || undefined,
    };
    await signUp(emailNorm, password, "FARMER", extras);
    setSubmitting(false);
  }

  async function onGoogleClick() {
    setLocalError(null);
    if (!firebaseConfigured) return;
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  }

  async function onCompleteProfile() {
    setLocalError(null);
    setCompleteSubmitting(true);
    await completeGoogleProfile("FARMER", {
      phone: googlePhone.trim() || undefined,
      address: googleAddress.trim() || undefined,
    });
    setCompleteSubmitting(false);
  }

  async function onCancelProfile() {
    setCompleteSubmitting(true);
    await cancelGoogleProfile();
    setCompleteSubmitting(false);
  }

  const inputClass =
    "w-full ps-10 pe-4 py-3 bg-beige/20 border border-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-rosegold/20 transition-all disabled:opacity-50 text-ink text-sm";
  const labelClass = "block text-xs font-medium uppercase tracking-wider text-ink/60 mb-2";

  return (
    <div
      className={cn("min-h-screen pt-28 pb-20 px-4 bg-beige/30 font-sans", isRTL ? "font-arabic" : "font-sans")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <TreeDeciduous className="text-rosegold shrink-0" size={22} aria-hidden />
            <span className="text-sm font-semibold text-ink/80 truncate tracking-tight">
              {lang === "ar" ? "ڤَابس بين يديك" : "Gabes bin ydik"}
            </span>
          </div>
          <div className="flex shrink-0 rounded-full border border-beige bg-white/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setLang("fr")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase transition-all",
                lang === "fr" ? "bg-ink text-white" : "text-ink/50 hover:text-ink",
              )}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLang("ar")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase transition-all font-arabic",
                lang === "ar" ? "bg-ink text-white" : "text-ink/50 hover:text-ink",
              )}
            >
              AR
            </button>
          </div>
        </div>

        {!googleProfilePending && pendingEmailVerification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-beige mb-6 space-y-4"
          >
            <h2 className="text-xl font-display text-ink">
              {t("Vérifiez votre e-mail", "أكّد بريدك الإلكتروني")}
            </h2>
            <p className="text-sm text-ink/70 leading-relaxed">
              {t(
                "Un lien de confirmation a été envoyé. Cliquez sur le lien, puis sur « J’ai confirmé » ci-dessous. Les sessions restent fermées tant que l’e-mail n’est pas vérifié.",
                "تم إرسال رابط التأكيد. اضغط الرابط ثم « أكّدت ». ما تفتحش الجلسة حتى يتأكد البريد.",
              )}
            </p>
            {authError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm font-medium">{authError}</div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={verifyBusy || !resendEmailVerification}
                onClick={async () => {
                  setVerifyBusy(true);
                  try {
                    await resendEmailVerification?.();
                  } finally {
                    setVerifyBusy(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-ink text-white text-sm font-medium disabled:opacity-50"
              >
                {verifyBusy ? loadingLabel : t("Renvoyer l’e-mail", "أعد الإرسال")}
              </button>
              <button
                type="button"
                disabled={verifyBusy || !reloadAuthUser}
                onClick={async () => {
                  setVerifyBusy(true);
                  try {
                    await reloadAuthUser?.();
                  } finally {
                    setVerifyBusy(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl border border-beige bg-beige/20 text-sm font-medium disabled:opacity-50"
              >
                {t("J’ai confirmé mon e-mail", "أكّدت البريد")}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void logout?.()}
              className="text-xs font-medium text-ink/50 underline underline-offset-2"
            >
              {t("Se déconnecter", "قطع الاتصال")}
            </button>
          </motion.div>
        )}

        {!googleProfilePending && !pendingEmailVerification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-beige"
          >
            {!firebaseConfigured && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium leading-relaxed">
                {process.env.NODE_ENV === "development"
                  ? t(
                      "En local : copiez .env.example vers .env.local, renseignez toutes les variables NEXT_PUBLIC_FIREBASE_*, puis redémarrez npm run dev.",
                      "محليًا: انسخ .env.example إلى .env.local، عبّئ كل متغيرات NEXT_PUBLIC_FIREBASE_*، ثم أعد تشغيل npm run dev.",
                    )
                  : t(
                      "Firebase n’est pas configuré dans ce déploiement. Dans Netlify : Site configuration → Environment variables, ajoutez les NEXT_PUBLIC_FIREBASE_* (voir .env.example), puis Deploys → Clear cache and deploy. Même principe sur Vercel / Render : variables sur l’hébergeur + nouveau build, car Next.js injecte NEXT_PUBLIC_* au build.",
                      "Firebase غير مهيأ. في Netlify: Environment variables ثم Clear cache and deploy. أضف NEXT_PUBLIC_FIREBASE_* كما في .env.example؛ Next.js يدمجها عند البناء.",
                    )}
              </div>
            )}

            {errorMsg && !pendingEmailVerification && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm font-medium">{errorMsg}</div>
            )}

            <div className="text-center mb-8">
              <h1 className="text-3xl font-display text-ink mb-2">
                {mode === "login" ? t("Connexion", "تسجيل الدخول") : t("Inscription", "إنشاء حساب")}
              </h1>
              <p className="text-ink/60 text-sm">
                {mode === "login"
                  ? t("Accédez à votre espace Gabes bin ydik.", "ادخل إلى فضاء ڤَابس بين يديك.")
                  : t("Créez un compte agriculteur.", "أنشئ حسابًا كفلاح.")}
              </p>
            </div>

            {mode === "login" ? (
              <>
                <form onSubmit={onSubmitLogin} className="space-y-6">
                  <div>
                    <label className={labelClass}>{t("E-mail", "البريد")}</label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" size={18} />
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={!firebaseConfigured}
                        className={inputClass}
                        placeholder={t("votre@email.com", "بريدك@email.com")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t("Mot de passe", "كلمة المرور")}</label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" size={18} />
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={SIGNUP_PASSWORD_MIN}
                        disabled={!firebaseConfigured}
                        className={inputClass}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        disabled={!firebaseConfigured || resetBusy || !sendPasswordReset}
                        onClick={async () => {
                          setResetBusy(true);
                          try {
                            await sendPasswordReset?.(normalizeEmail(email));
                          } finally {
                            setResetBusy(false);
                          }
                        }}
                        className="text-xs font-medium text-rosegold hover:underline disabled:opacity-40"
                      >
                        {resetBusy ? loadingLabel : t("Mot de passe oublié ?", "نسيت كلمة السر؟")}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!firebaseConfigured || submitting}
                    className="w-full bg-ink text-white py-4 rounded-xl font-medium hover:bg-ink/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>{loadingLabel}</span>
                    ) : (
                      <>
                        <LogIn size={20} />
                        <span>{t("Se connecter", "دخول")}</span>
                      </>
                    )}
                  </button>
                </form>

                <AuthDivider label={t("Ou continuer avec", "أو المتابعة باستخدام")} />

                <button
                  type="button"
                  onClick={onGoogleClick}
                  disabled={!firebaseConfigured || googleLoading || submitting}
                  className="w-full bg-white border border-beige text-ink py-4 rounded-xl font-medium hover:bg-beige/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Chrome size={20} className="text-rosegold shrink-0" />
                  <span>{googleLoading ? loadingLabel : "Google"}</span>
                </button>

                <p className="mt-8 text-center text-sm text-ink/60">
                  {t("Pas encore de compte ?", "ليس لديك حساب؟")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setLocalError(null);
                      setRegisterFieldErrors({});
                    }}
                    className="text-rosegold font-medium hover:underline"
                  >
                    {t("Inscription", "سجّل")}
                  </button>
                </p>
              </>
            ) : (
              <>
                <form onSubmit={onSubmitRegister} className="space-y-6">
                  <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-rosegold/40 bg-beige/30 text-ink">
                    <Tractor size={28} className="text-rosegold shrink-0" aria-hidden />
                    <p className="text-sm font-medium leading-snug">
                      {t(
                        "Inscription réservée aux agriculteurs. Le profil est défini une seule fois.",
                        "التسجيل للفلاحين فقط. الملف يُحدَّد مرة واحدة.",
                      )}
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>{t("E-mail", "البريد")}</label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" size={18} />
                      <input
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setRegisterFieldErrors((p) => ({ ...p, email: undefined }));
                        }}
                        disabled={!firebaseConfigured}
                        className={cn(inputClass, registerFieldErrors.email && "border-red-300 ring-1 ring-red-200")}
                        placeholder={t("votre@email.com", "بريدك@email.com")}
                        maxLength={254}
                        aria-invalid={!!registerFieldErrors.email}
                        aria-describedby={registerFieldErrors.email ? "reg-email-err" : undefined}
                      />
                    </div>
                    {registerFieldErrors.email ? (
                      <p id="reg-email-err" className="mt-1.5 text-xs font-medium text-red-600">
                        {registerFieldErrors.email}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass}>
                      {t("Téléphone (optionnel)", "الهاتف (اختياري)")}
                    </label>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" size={18} />
                      <input
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        value={phoneReg}
                        onChange={(e) => {
                          setPhoneReg(e.target.value);
                          setRegisterFieldErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        disabled={!firebaseConfigured}
                        className={cn(inputClass, registerFieldErrors.phone && "border-red-300 ring-1 ring-red-200")}
                        placeholder={t("+216 …", "+216 …")}
                        maxLength={32}
                        aria-invalid={!!registerFieldErrors.phone}
                        aria-describedby={registerFieldErrors.phone ? "reg-phone-err" : undefined}
                      />
                    </div>
                    {registerFieldErrors.phone ? (
                      <p id="reg-phone-err" className="mt-1.5 text-xs font-medium text-red-600">
                        {registerFieldErrors.phone}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-ink/50 font-medium">
                        {t("Laissez vide si vous préférez ne pas l’indiquer.", "اتركه فارغاً إن أردت.")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      {t("Adresse (optionnelle)", "العنوان (اختياري)")}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute start-3 top-3 text-ink/40 pointer-events-none" size={18} />
                      <textarea
                        autoComplete="street-address"
                        value={addressReg}
                        onChange={(e) => setAddressReg(e.target.value)}
                        disabled={!firebaseConfigured}
                        rows={2}
                        className={cn(inputClass, "min-h-[4.5rem] py-3 resize-none ps-10")}
                        placeholder={t("Ville, quartier…", "المدينة، الحي…")}
                        maxLength={300}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t("Mot de passe", "كلمة المرور")}</label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" size={18} />
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setRegisterFieldErrors((p) => ({ ...p, password: undefined }));
                        }}
                        disabled={!firebaseConfigured}
                        className={cn(inputClass, registerFieldErrors.password && "border-red-300 ring-1 ring-red-200")}
                        placeholder="••••••••"
                        minLength={SIGNUP_PASSWORD_MIN}
                        maxLength={128}
                        aria-invalid={!!registerFieldErrors.password}
                        aria-describedby={registerFieldErrors.password ? "reg-pwd-err reg-pwd-hint" : "reg-pwd-hint"}
                      />
                    </div>
                    <p id="reg-pwd-hint" className="mt-1.5 text-[11px] text-ink/50 font-medium">
                      {t(
                        `Au moins ${SIGNUP_PASSWORD_MIN} caractères (recommandé : lettres + chiffres).`,
                        `على الأقل ${SIGNUP_PASSWORD_MIN} أحرف (يُفضّل أحرف وأرقام).`,
                      )}
                    </p>
                    {registerFieldErrors.password ? (
                      <p id="reg-pwd-err" className="mt-1.5 text-xs font-medium text-red-600">
                        {registerFieldErrors.password}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass}>{t("Confirmer le mot de passe", "تأكيد كلمة المرور")}</label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" size={18} />
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => {
                          setConfirm(e.target.value);
                          setRegisterFieldErrors((p) => ({ ...p, confirm: undefined }));
                        }}
                        disabled={!firebaseConfigured}
                        className={cn(inputClass, registerFieldErrors.confirm && "border-red-300 ring-1 ring-red-200")}
                        placeholder="••••••••"
                        maxLength={128}
                        aria-invalid={!!registerFieldErrors.confirm}
                        aria-describedby={registerFieldErrors.confirm ? "reg-confirm-err" : undefined}
                      />
                    </div>
                    {registerFieldErrors.confirm ? (
                      <p id="reg-confirm-err" className="mt-1.5 text-xs font-medium text-red-600">
                        {registerFieldErrors.confirm}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={!firebaseConfigured || submitting}
                    className="w-full bg-ink text-white py-4 rounded-xl font-medium hover:bg-ink/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>{loadingLabel}</span>
                    ) : (
                      <>
                        <UserPlus size={20} />
                        <span>{t("Créer mon compte", "إنشاء الحساب")}</span>
                      </>
                    )}
                  </button>
                </form>

                <AuthDivider label={t("Ou continuer avec", "أو المتابعة باستخدام")} />

                <button
                  type="button"
                  onClick={onGoogleClick}
                  disabled={!firebaseConfigured || googleLoading || submitting}
                  className="w-full bg-white border border-beige text-ink py-4 rounded-xl font-medium hover:bg-beige/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Chrome size={20} className="text-rosegold shrink-0" />
                  <span>{googleLoading ? loadingLabel : "Google"}</span>
                </button>

                <p className="mt-8 text-center text-sm text-ink/60">
                  {t("Déjà un compte ?", "لديك حساب؟")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setLocalError(null);
                      setRegisterFieldErrors({});
                    }}
                    className="text-rosegold font-medium hover:underline"
                  >
                    {t("Connexion", "دخول")}
                  </button>
                </p>
              </>
            )}
          </motion.div>
        )}

        {googleProfilePending && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-beige"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display text-ink mb-2">{t("Complétez votre profil", "أكمل ملفك")}</h2>
                <p className="text-ink/60 text-sm leading-relaxed">
                  {t(
                    "Compte agriculteur — le rôle est enregistré une seule fois.",
                    "حساب فلاح — الدور يُسجَّل مرة واحدة.",
                  )}
                </p>
                {googleProfilePending.email ? (
                  <p className="text-xs font-medium text-rosegold mt-3 truncate" title={googleProfilePending.email}>
                    {googleProfilePending.email}
                  </p>
                ) : null}
              </div>

              {authError ? (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm font-medium">{authError}</div>
              ) : null}

              <div className="space-y-4 mb-6">
                <div>
                  <label className={labelClass}>{t("Téléphone (optionnel)", "الهاتف (اختياري)")}</label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" size={18} />
                    <input
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={googlePhone}
                      onChange={(e) => setGooglePhone(e.target.value)}
                      disabled={completeSubmitting}
                      className={inputClass}
                      placeholder={t("+216 …", "+216 …")}
                      maxLength={32}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("Adresse (optionnelle)", "العنوان (اختياري)")}</label>
                  <div className="relative">
                    <MapPin className="absolute start-3 top-3 text-ink/40 pointer-events-none" size={18} />
                    <textarea
                      autoComplete="street-address"
                      value={googleAddress}
                      onChange={(e) => setGoogleAddress(e.target.value)}
                      disabled={completeSubmitting}
                      rows={2}
                      className={cn(inputClass, "min-h-[4.5rem] py-3 resize-none ps-10")}
                      placeholder={t("Ville, quartier…", "المدينة، الحي…")}
                      maxLength={300}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onCompleteProfile}
                  disabled={completeSubmitting}
                  className="w-full bg-ink text-white py-4 rounded-xl font-medium hover:bg-ink/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {completeSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
                  {t("Enregistrer et continuer", "حفظ ومتابعة")}
                </button>
                <button
                  type="button"
                  onClick={onCancelProfile}
                  disabled={completeSubmitting}
                  className="w-full py-3 text-ink/50 text-xs font-medium uppercase tracking-wide hover:text-ink disabled:opacity-40"
                >
                  {t("Annuler et se déconnecter", "إلغاء وتسجيل الخروج")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <p className="text-center text-xs text-ink/40 mt-10 font-medium tracking-wide">
          {t("Gabes bin ydik — Smart City", "ڤَابس بين يديك — المدينة الذكية")}
        </p>
      </div>
    </div>
  );
}
