/**
 * Supprime les caches Next / bundler (utile si chunks manquants type ./611.js,
 * souvent avec cache .next corrompu ou synchro OneDrive).
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const targets = [".next", path.join("node_modules", ".cache")];

for (const rel of targets) {
  const p = path.join(root, rel);
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`[clean] supprimé: ${rel}`);
    }
  } catch (e) {
    console.warn(`[clean] impossible de supprimer ${rel}:`, e?.message ?? e);
    process.exitCode = 1;
  }
}
