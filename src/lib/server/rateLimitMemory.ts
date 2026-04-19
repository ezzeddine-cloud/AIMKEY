/**
 * Fenêtre glissante simple (mémoire process). Suffisant pour un seul nœud Next ;
 * en production multi-instances, utiliser Redis / Upstash ou le rate limiting du CDN.
 */
type Bucket = { hits: number; windowStart: number };

const store = new Map<string, Bucket>();

export function rateLimitHit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  let b = store.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    b = { hits: 0, windowStart: now };
    store.set(key, b);
  }
  if (b.hits >= max) {
    const retryAfterSec = Math.ceil((b.windowStart + windowMs - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  b.hits += 1;
  if (store.size > 50_000) {
    for (const [k, v] of store) {
      if (now - v.windowStart > windowMs * 2) store.delete(k);
    }
  }
  return { ok: true };
}
