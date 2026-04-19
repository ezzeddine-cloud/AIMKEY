/**
 * E-mails reconnus pour le **parcours admin** côté client (ex. contournement vérif. e-mail au login).
 * Aucune adresse codée en dur dans le dépôt : définir `NEXT_PUBLIC_ADMIN_EMAILS` (séparés par des virgules).
 * Le rôle effectif reste `users/{uid}.role === 'ADMIN'` dans Firestore.
 *
 * Note : `NEXT_PUBLIC_*` est injecté dans le bundle client — ne listez que des e-mails, jamais de mots de passe ou clés API.
 */
const FROM_ENV = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** Gmail / Googlemail : la partie locale ignore les points (même compte). */
function normalizeForCompare(email: string): string {
  const e = email.trim().toLowerCase();
  const m = /^([^@]+)@(gmail\.com|googlemail\.com)$/.exec(e);
  if (!m) return e;
  const localNoDots = m[1].replace(/\./g, "");
  return `${localNoDots}@${m[2]}`;
}

function adminEmailList(): string[] {
  return [...new Set(FROM_ENV)];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const n = normalizeForCompare(email);
  return adminEmailList().some((a) => normalizeForCompare(a) === n);
}
