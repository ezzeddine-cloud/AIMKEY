/**
 * Crée .env.local depuis env.emulator.local.example si .env.local est absent.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "env.emulator.local.example");
const dst = path.join(root, ".env.local");

if (!fs.existsSync(src)) {
  console.error("Fichier manquant: env.emulator.local.example");
  process.exit(1);
}

if (fs.existsSync(dst)) {
  console.log(".env.local existe déjà — aucune modification.");
  process.exit(0);
}

fs.copyFileSync(src, dst);
console.log("OK : .env.local créé (mode émulateur Firebase). Lancez : npm run dev:stack");
