/** Validation côté client avant appel Firebase (complète les attributs HTML). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Aligné sur une politique plus stricte que le minimum Firebase (6) — le client impose 8+ complexité légère. */
export const SIGNUP_PASSWORD_MIN = 8;
export const SIGNUP_PASSWORD_MAX = 128;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateSignupEmail(email: string): "empty" | "invalid" | "too_long" | null {
  const e = email.trim();
  if (!e) return "empty";
  if (e.length > 254) return "too_long";
  if (!EMAIL_RE.test(e)) return "invalid";
  return null;
}

/** Au moins une lettre (latin ou arabe) et un chiffre pour éviter mots de passe triviaux. */
export function validateSignupPassword(password: string): "empty" | "too_short" | "too_long" | "weak_pattern" | null {
  if (!password) return "empty";
  if (password.length < SIGNUP_PASSWORD_MIN) return "too_short";
  if (password.length > SIGNUP_PASSWORD_MAX) return "too_long";
  const hasLetter = /[A-Za-z\u0600-\u06FF]/.test(password);
  const hasDigit = /\d/.test(password);
  if (!hasLetter || !hasDigit) return "weak_pattern";
  return null;
}
