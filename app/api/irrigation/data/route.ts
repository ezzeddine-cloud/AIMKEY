import { NextResponse } from "next/server";

/**
 * Proxy vers le Flask backend (port 5000) pour récupérer
 * les données capteur + prédiction AI en temps réel.
 */
export async function GET() {
  try {
    const res = await fetch("http://localhost:5000/api/data", {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Flask backend unreachable" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Flask backend non démarré (python app.py sur port 5000)" },
      { status: 502 },
    );
  }
}
