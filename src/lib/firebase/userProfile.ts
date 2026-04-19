import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { PublicUserRole, UserProfileExtras, UserRole } from "@/models/types";

export const USERS_COLLECTION = "users";

export type UserProfileData = {
  email: string;
  role: UserRole;
  phone?: string | null;
  address?: string | null;
  displayName?: string | null;
};

export async function fetchUserRole(uid: string): Promise<UserRole | null> {
  const snap = await getDoc(doc(getFirebaseDb(), USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  const r = snap.data()?.role;
  if (r === "ADMIN") return "ADMIN";
  if (r === "CITIZEN" || r === "FARMER") return r === "CITIZEN" ? "FARMER" : r;
  return null;
}

export async function fetchUserProfile(uid: string): Promise<UserProfileData | null> {
  const snap = await getDoc(doc(getFirebaseDb(), USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  const role = d?.role;
  const r: UserRole =
    role === "ADMIN" ? "ADMIN" : role === "FARMER" ? "FARMER" : role === "CITIZEN" ? "FARMER" : "FARMER";
  return {
    email: typeof d?.email === "string" ? d.email : "",
    role: r,
    phone: typeof d?.phone === "string" ? d.phone : null,
    address: typeof d?.address === "string" ? d.address : null,
    displayName: typeof d?.displayName === "string" ? d.displayName : null,
  };
}

/** Après inscription, le doc Firestore peut arriver juste après onAuthStateChanged — on réessaie. */
export async function fetchUserRoleWithRetry(uid: string, retries = 8, delayMs = 200): Promise<UserRole | null> {
  for (let i = 0; i < retries; i++) {
    const r = await fetchUserRole(uid);
    if (r) return r;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}

export async function saveUserProfile(uid: string, email: string, role: UserRole, extras?: UserProfileExtras) {
  const payload: Record<string, unknown> = {
    email,
    role,
    updatedAt: serverTimestamp(),
  };
  if (extras?.phone !== undefined) payload.phone = extras.phone?.trim() || null;
  if (extras?.address !== undefined) payload.address = extras.address?.trim() || null;
  if (extras?.displayName !== undefined) payload.displayName = extras.displayName?.trim() || null;
  await setDoc(doc(getFirebaseDb(), USERS_COLLECTION, uid), payload, { merge: true });
}

/** Compte admin (e-mail liste) : assure role ADMIN dans Firestore pour les règles sécurisées. */
export async function ensureAdminUserDoc(uid: string, email: string) {
  await setDoc(
    doc(getFirebaseDb(), USERS_COLLECTION, uid),
    { email, role: "ADMIN" as const, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Quelques échecs juste après createUser : le jeton Auth n’est pas toujours prêt pour Firestore — on réessaie. */
export async function saveUserProfileWithRetry(
  uid: string,
  email: string,
  role: PublicUserRole | UserRole,
  extras?: UserProfileExtras,
  attempts = 4,
  baseDelayMs = 250,
) {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await saveUserProfile(uid, email, role as UserRole, extras);
      return;
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }
  throw last;
}
