"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { initialEvents } from "@/models/initialData";
import { isAdminEmail } from "@/lib/adminEmails";
import { isAuthPopupDismissed, mapFirebaseAuthError } from "@/lib/firebase/authErrors";
import { ensureAdminUserDoc, fetchUserRoleWithRetry, saveUserProfileWithRetry } from "@/lib/firebase/userProfile";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { subscribeCityEvents } from "@/lib/firebase/appContentRepos";
import { LANG_STORAGE_KEY } from "@/models/session";
import type { CityEvent, GoogleProfilePending, Lang, PublicUserRole, UserProfileExtras, UserRole } from "@/models/types";

function defaultTabForRole(r: UserRole): string {
  if (r === "FARMER" || r === "CITIZEN") return "capteur";
  if (r === "ADMIN") return "reclamations";
  return "capteur";
}

export function useDimaApp() {
  const signInThrottleRef = useRef<number>(0);
  const [hydrated, setHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);
  const [role, setRole] = useState<UserRole>("FARMER");
  const [userUid, setUserUid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [googleProfilePending, setGoogleProfilePending] = useState<GoogleProfilePending | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lang, setLangState] = useState<Lang>("fr");
  const [activeTab, setActiveTab] = useState("capteur");
  const [events, setEvents] = useState<CityEvent[]>(() => (isFirebaseConfigured() ? [] : initialEvents));

  const isRTL = lang === "ar";
  const t = useCallback((fr: string, ar: string) => (isRTL ? ar : fr), [isRTL]);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === "fr" || savedLang === "ar") {
        setLangState(savedLang);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setAuthReady(true);
      setHydrated(true);
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthError(null);

      if (!user) {
        setSessionActive(false);
        setPendingEmailVerification(false);
        setUserUid(null);
        setUserEmail(null);
        setRole("FARMER");
        setGoogleProfilePending(null);
        setAuthReady(true);
        setHydrated(true);
        return;
      }

      setUserUid(user.uid);
      setUserEmail(user.email ?? null);

      const usesPassword = user.providerData.some((p) => p.providerId === "password");
      if (usesPassword && !user.emailVerified && !isAdminEmail(user.email)) {
        setPendingEmailVerification(true);
        setSessionActive(false);
        setGoogleProfilePending(null);
        setRole("FARMER");
        setAuthReady(true);
        setHydrated(true);
        return;
      }
      setPendingEmailVerification(false);

      try {
        if (isAdminEmail(user.email)) {
          try {
            await ensureAdminUserDoc(user.uid, user.email ?? "");
          } catch {
            /* Firestore indisponible : éviter session admin qui casserait les règles isAdmin() */
          }
          setRole("ADMIN");
          setSessionActive(true);
          setGoogleProfilePending(null);
        } else {
          const r = await fetchUserRoleWithRetry(user.uid);
          if (r === "ADMIN") {
            setRole("ADMIN");
            setSessionActive(true);
            setGoogleProfilePending(null);
          } else if (r === "CITIZEN" || r === "FARMER") {
            setRole(r === "CITIZEN" ? "FARMER" : r);
            setSessionActive(true);
            setGoogleProfilePending(null);
          } else {
            setSessionActive(false);
            setGoogleProfilePending({
              uid: user.uid,
              email: user.email ?? "",
            });
          }
        }
      } catch {
        setSessionActive(false);
        setUserUid(null);
        setUserEmail(null);
        setGoogleProfilePending(null);
        await signOut(auth).catch(() => {});
      }

      setAuthReady(true);
      setHydrated(true);
    });

    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setAuthError(t("Firebase non configuré (.env.local).", "فايربيس غير مهيأ."));
      return;
    }
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      provider.addScope("email");
      provider.addScope("profile");
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (e) {
      if (isAuthPopupDismissed(e)) return;
      setAuthError(mapFirebaseAuthError(e, t));
    }
  }, [t]);

  const completeGoogleProfile = useCallback(
    async (userRole: PublicUserRole, extras?: UserProfileExtras) => {
      if (!googleProfilePending) return;
      setAuthError(null);
      try {
        if (isAdminEmail(googleProfilePending.email)) {
          try {
            await ensureAdminUserDoc(googleProfilePending.uid, googleProfilePending.email || "");
          } catch {
            /* ignore */
          }
          setRole("ADMIN");
          setSessionActive(true);
          setGoogleProfilePending(null);
          setUserEmail(googleProfilePending.email || null);
          return;
        }
        await saveUserProfileWithRetry(googleProfilePending.uid, googleProfilePending.email, userRole, {
          phone: extras?.phone ?? googleProfilePending.phone,
          address: extras?.address ?? googleProfilePending.address,
          displayName: extras?.displayName,
        });
        setRole(userRole);
        setSessionActive(true);
        setGoogleProfilePending(null);
        setUserEmail(googleProfilePending.email || null);
      } catch (e) {
        setAuthError(mapFirebaseAuthError(e, t));
      }
    },
    [googleProfilePending, t],
  );

  const cancelGoogleProfile = useCallback(async () => {
    setGoogleProfilePending(null);
    setAuthError(null);
    if (isFirebaseConfigured()) {
      try {
        await signOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isFirebaseConfigured()) {
        setAuthError(t("Firebase non configuré (.env.local).", "فايربيس غير مهيأ."));
        return;
      }
      const now = Date.now();
      if (now - signInThrottleRef.current < 2500) {
        setAuthError(t("Patientez un instant entre deux tentatives.", "انتظر شوية بين محاولتين."));
        return;
      }
      signInThrottleRef.current = now;
      setAuthError(null);
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      } catch (e) {
        setAuthError(mapFirebaseAuthError(e, t));
      }
    },
    [t],
  );

  const signUp = useCallback(
    async (email: string, password: string, userRole: PublicUserRole, extras?: UserProfileExtras) => {
      if (!isFirebaseConfigured()) {
        setAuthError(t("Firebase non configuré (.env.local).", "فايربيس غير مهيأ."));
        return;
      }
      setAuthError(null);
      try {
        const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
        const resolvedEmail = cred.user.email ?? email.trim();
        if (isAdminEmail(resolvedEmail)) {
          try {
            await ensureAdminUserDoc(cred.user.uid, resolvedEmail);
          } catch {
            /* ignore */
          }
          return;
        }
        try {
          await saveUserProfileWithRetry(cred.user.uid, resolvedEmail, userRole, extras);
          try {
            await sendEmailVerification(cred.user);
          } catch {
            /* envoi e-mail : ne bloque pas l’inscription si la boîte refuse */
          }
        } catch (fsErr) {
          try {
            await deleteUser(cred.user);
          } catch {
            /* ignore */
          }
          setAuthError(mapFirebaseAuthError(fsErr, t));
        }
      } catch (e) {
        setAuthError(mapFirebaseAuthError(e, t));
      }
    },
    [t],
  );

  const resendEmailVerification = useCallback(async () => {
    const u = getFirebaseAuth().currentUser;
    if (!u) return;
    setAuthError(null);
    try {
      await sendEmailVerification(u);
      setAuthError(
        t("E-mail de vérification renvoyé. Vérifiez votre boîte (et les spams).", "تم إعادة إرسال رسالة التحقق. راجع بريدك والسبام."),
      );
    } catch (e) {
      setAuthError(mapFirebaseAuthError(e, t));
    }
  }, [t]);

  const reloadAuthUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    if (!u) return;
    setAuthError(null);
    try {
      await reload(u);
      if (!u.emailVerified) {
        setAuthError(
          t("E-mail pas encore vérifié. Cliquez sur le lien reçu puis réessayez.", "البريد ما زال غير مؤكّد. اضغط على الرابط ثم جرّب من جديد."),
        );
        return;
      }
      setPendingEmailVerification(false);
      if (isAdminEmail(u.email)) {
        try {
          await ensureAdminUserDoc(u.uid, u.email ?? "");
        } catch {
          /* ignore */
        }
        setRole("ADMIN");
        setSessionActive(true);
        setGoogleProfilePending(null);
        return;
      }
      const r = await fetchUserRoleWithRetry(u.uid);
      if (r === "ADMIN") {
        setRole("ADMIN");
        setSessionActive(true);
        setGoogleProfilePending(null);
      } else if (r === "CITIZEN" || r === "FARMER") {
        setRole(r === "CITIZEN" ? "FARMER" : r);
        setSessionActive(true);
        setGoogleProfilePending(null);
      } else {
        setSessionActive(false);
        setGoogleProfilePending({
          uid: u.uid,
          email: u.email ?? "",
        });
      }
    } catch (e) {
      setAuthError(mapFirebaseAuthError(e, t));
    }
  }, [t]);

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (!isFirebaseConfigured()) {
        setAuthError(t("Firebase non configuré (.env.local).", "فايربيس غير مهيأ."));
        return;
      }
      const trimmed = email.trim();
      if (!trimmed) {
        setAuthError(t("Indiquez votre e-mail pour la réinitialisation.", "أدخل بريدك لإعادة التعيين."));
        return;
      }
      setAuthError(null);
      try {
        await sendPasswordResetEmail(getFirebaseAuth(), trimmed);
        setAuthError(
          t("Si un compte existe, un e-mail de réinitialisation vient d’être envoyé.", "إذا كان هناك حساب، تم إرسال بريد لإعادة تعيين كلمة المرور."),
        );
      } catch (e) {
        setAuthError(mapFirebaseAuthError(e, t));
      }
    },
    [t],
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    setPendingEmailVerification(false);
    setGoogleProfilePending(null);
    setActiveTab("capteur");
    if (isFirebaseConfigured()) {
      try {
        await signOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    setActiveTab(defaultTabForRole(role));
  }, [role]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setEvents(initialEvents);
      return;
    }
    if (!sessionActive || !userUid) {
      setEvents([]);
      return;
    }
    const unsub = subscribeCityEvents(setEvents);
    return () => unsub();
  }, [sessionActive, userUid]);

  const ready = hydrated && authReady;

  return {
    ready,
    hydrated,
    authReady,
    firebaseConfigured: isFirebaseConfigured(),
    sessionActive,
    pendingEmailVerification,
    userUid,
    userEmail,
    googleProfilePending,
    authError,
    setAuthError,
    signInWithGoogle,
    completeGoogleProfile,
    cancelGoogleProfile,
    signIn,
    signUp,
    resendEmailVerification,
    reloadAuthUser,
    sendPasswordReset,
    logout,
    role,
    lang,
    setLang,
    activeTab,
    setActiveTab,
    events,
    isRTL,
    t,
  };
}
