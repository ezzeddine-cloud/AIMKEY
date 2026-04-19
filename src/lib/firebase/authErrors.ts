type TFunctionType = (fr: string, ar: string) => string;

export function getFirebaseAuthErrorCode(e: unknown): string {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code: unknown }).code;
    if (typeof c === "string" && c.length > 0) return c;
  }
  return "";
}

/** Fenêtre Google fermée par l’utilisateur — pas un vrai échec. */
export function isAuthPopupDismissed(e: unknown): boolean {
  const code = getFirebaseAuthErrorCode(e);
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

export function mapFirebaseAuthError(e: unknown, t: TFunctionType): string {
  const code = getFirebaseAuthErrorCode(e);

  const map: Record<string, [string, string]> = {
    "auth/invalid-email": ["Adresse e-mail invalide.", "البريد الإلكتروني غير صالح."],
    "auth/user-disabled": ["Ce compte a été désactivé.", "تم تعطيل هذا الحساب."],
    "auth/user-not-found": ["Aucun compte avec cet e-mail.", "لا يوجد حساب بهذا البريد."],
    "auth/wrong-password": ["Mot de passe incorrect.", "كلمة المرور غير صحيحة."],
    "auth/invalid-credential": ["E-mail ou mot de passe incorrect.", "البريد أو كلمة المرور غير صحيحة."],
    "auth/email-already-in-use": ["Cet e-mail est déjà utilisé.", "البريد مستعمل من قبل."],
    "auth/weak-password": ["Mot de passe trop faible (Firebase : min. 6 caractères ; l’application recommande 8+ avec lettre et chiffre).", "كلمة المرور ضعيفة (فايربيس يسمح بـ6؛ التطبيق ينصح بـ8+ مع حرف ورقم)."],
    "auth/too-many-requests": ["Trop de tentatives. Réessayez plus tard.", "محاولات كثيرة. حاول لاحقًا."],
    "auth/network-request-failed": ["Problème réseau. Vérifiez la connexion.", "مشكل في الشبكة."],
    "auth/account-exists-with-different-credential": [
      "Ce compte existe déjà avec une autre méthode (e-mail). Connectez-vous par e-mail ou utilisez le même compte Google.",
      "الحساب موجود بطريقة أخرى. سجّل بالبريد أو بنفس حساب جوجل.",
    ],
    "auth/popup-blocked": ["Popup bloquée par le navigateur. Autorisez les popups pour ce site.", "المتصفح حظر النافذة المنبثقة."],
    "auth/operation-not-allowed": [
      "La connexion par e-mail / mot de passe n’est pas activée dans Firebase (Console → Authentication → Sign-in method → E-mail / mot de passe).",
      "تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في فايربيس (Authentication → Sign-in method).",
    ],
    "auth/invalid-api-key": ["Clé API Firebase invalide. Vérifiez NEXT_PUBLIC_FIREBASE_API_KEY dans .env.local.", "مفتاح API فايربيس غير صالح."],
    "auth/app-deleted": ["L’application Firebase a été supprimée.", "تم حذف تطبيق فايربيس."],
    "auth/invalid-user-token": ["Session invalide. Déconnectez-vous et reconnectez-vous.", "جلسة غير صالحة."],
    "auth/user-token-expired": ["Session expirée. Reconnectez-vous.", "انتهت الجلسة."],
    "auth/web-storage-unsupported": [
      "Ce navigateur bloque le stockage nécessaire à la connexion (cookies / stockage local).",
      "المتصفح يمنع التخزين المطلوب للدخول.",
    ],
    "permission-denied": [
      "Accès refusé à la base Firestore (règles ou projet). Vérifiez firestore.rules et le projet Firebase.",
      "رفض الوصول لفايرستور (القواعد أو المشروع).",
    ],
    "failed-precondition": [
      "Opération impossible dans l’état actuel (Firestore). Réessayez dans un instant.",
      "العملية غير ممكنة حالياً.",
    ],
    "unavailable": ["Service temporairement indisponible. Réessayez.", "الخدمة غير متوفرة مؤقتاً."],
  };

  const pair = map[code];
  if (pair) return t(pair[0], pair[1]);

  if (code) {
    return t(
      `Erreur technique (${code}). Si le problème continue, vérifiez la console Firebase et votre fichier .env.local.`,
      `خطأ تقني (${code}). تحقق من إعدادات فايربيس وملف البيئة.`,
    );
  }

  if (e instanceof Error && e.message) {
    return t(`Erreur : ${e.message}`, `خطأ: ${e.message}`);
  }

  return t("Une erreur est survenue. Réessayez.", "حدث خطأ. حاول مرة أخرى.");
}
