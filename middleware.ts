import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Fenêtre / max par IP et préfixe de chemin (Edge — mémoire par instance). */
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let arr = hits.get(key) ?? [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 30_000) {
    for (const [k, v] of hits) {
      if (v.length === 0 || now - v[v.length - 1]! > windowMs * 3) hits.delete(k);
    }
  }
  return true;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = clientIp(req);
  const windowMs = 60_000;

  if (path.startsWith("/api/chat")) {
    if (!allow(`${ip}:chat`, 20, windowMs)) {
      return NextResponse.json({ error: "rate_limited", detail: "Too many chat requests." }, { status: 429 });
    }
    return NextResponse.next();
  }

  if (!allow(`${ip}:api`, 200, windowMs)) {
    return NextResponse.json({ error: "rate_limited", detail: "Too many API requests." }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
