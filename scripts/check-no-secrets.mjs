/**
 * Détecte des motifs ressemblant à des clés API / jetons dans le code versionné.
 * Usage : npm run security:scan
 * Ne remplace pas une revue manuelle ; échoue si un motif suspect est trouvé.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const EXTS = new Set([".ts", ".tsx", ".mts", ".mjs", ".cjs", ".js", ".md", ".json", ".yaml", ".yml"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", "coverage", ".git"]);

/** Motifs : clés longues (pas les placeholders vides dans .env.example). */
const PATTERNS = [
  { name: "OpenRouter / OpenAI-style sk-…", re: /\bsk-or-v1-[a-zA-Z0-9]{20,}\b/ },
  { name: "OpenAI sk-proj-…", re: /\bsk-proj-[a-zA-Z0-9_-]{20,}\b/ },
  { name: "OpenAI sk-svcacct-…", re: /\bsk-svcacct-[a-zA-Z0-9_-]{20,}\b/ },
  { name: "Google API key (AIza…)", re: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { name: "GitHub PAT ghp_", re: /\bghp_[a-zA-Z0-9]{20,}\b/ },
  { name: "Slack token xox", re: /\bxox[baprs]-[a-zA-Z0-9-]{10,}\b/ },
];

function walk(dir, out = []) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else if (EXTS.has(extname(name))) out.push(p);
  }
  return out;
}

function main() {
  const files = walk(ROOT);
  const self = "check-no-secrets.mjs";
  let failed = false;

  for (const abs of files) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (rel.endsWith(self)) continue;
    if (rel === "package-lock.json") continue;

    let text;
    try {
      text = readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    for (const { name, re } of PATTERNS) {
      const m = text.match(re);
      if (m) {
        console.error(`[check-no-secrets] ${rel}: motif « ${name} » (${m[0].slice(0, 24)}…)`);
        failed = true;
      }
    }
  }

  if (failed) {
    console.error("\nÉchec : retirez les clés du dépôt et utilisez des variables d’environnement (serveur uniquement pour les secrets).");
    process.exit(1);
  }
  console.log("check-no-secrets: aucun motif suspect détecté dans les fichiers scannés.");
}

main();
