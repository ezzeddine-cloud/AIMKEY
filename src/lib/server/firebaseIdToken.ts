import * as jose from "jose";

const JWKS = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/**
 * Vérifie un ID token Firebase (Auth) côté serveur, sans exposer de secret client.
 * Incompatible avec les jetons de l’émulateur Auth (non signés par Google) — utiliser le mode émulateur pour désactiver l’exigence côté route.
 */
export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<{ uid: string; email?: string }> {
  const issuer = `https://securetoken.google.com/${projectId}`;
  const { payload } = await jose.jwtVerify(idToken, JWKS, {
    issuer,
    audience: projectId,
    algorithms: ["RS256"],
  });
  const uid = typeof payload.sub === "string" ? payload.sub : "";
  if (!uid) {
    throw new Error("invalid_token_payload");
  }
  const email = typeof payload.email === "string" ? payload.email : undefined;
  return { uid, email };
}
