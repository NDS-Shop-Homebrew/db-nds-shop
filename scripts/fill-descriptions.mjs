// Met à jour les meta.json de ndsdb avec descriptions FR + EN (Wikipedia).
// Usage: node scripts/fill-descriptions.mjs
//
// Ajoute description_fr et description_en dans chaque meta.json
// sans toucher aux autres champs (genres, developer, etc.)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_BASE = path.resolve(__dirname, "../backend/public/db/nds/base");

async function fetchExtract(title, lang) {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query` +
    `&generator=search&gsrsearch=${encodeURIComponent(title)}&gsrlimit=1` +
    `&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
  const r = await fetch(url, { headers: { "User-Agent": "NDS-Shop/1.0" } });
  if (!r.ok) return null;
  const j = await r.json();
  const pages = j.query?.pages || {};
  const page = Object.values(pages)[0];
  return page?.extract || null;
}

async function fetchWithRetry(title, lang, retries = 4) {
  for (let i = 1; i <= retries; i++) {
    try {
      const text = await fetchExtract(title, lang);
      if (text) return text;
    } catch {}
    if (i < retries) {
      const wait = 3000 * i + Math.random() * 2000;
      console.log(`  ⏳ rate limit, attente ${wait / 1000}s (${i}/${retries})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return null;
}

function cleanTitle(title) {
  return title
    .replace(/\s*\(.*?\)/g, "")
    .replace(/\s*\[.*?\]/g, "")
    .replace(/\s*[:&-]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const dirs = fs.readdirSync(DB_BASE).filter((d) => d !== "Example" && fs.statSync(path.join(DB_BASE, d)).isDirectory());
  let ok = 0;
  for (const serial of dirs) {
    const metaPath = path.join(DB_BASE, serial, "meta.json");
    if (!fs.existsSync(metaPath)) continue;
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

    // Si déjà remplies, skip
    if (meta.description_fr && meta.description_en && meta.description_fr !== meta.description_en) {
      console.log(`= ${meta.name} → déjà fait`);
      ok++;
      continue;
    }

    const title = cleanTitle(meta.name || serial);
    const descFr = await fetchWithRetry(title, "fr");
    await new Promise((r) => setTimeout(r, 1200));
    const descEn = await fetchWithRetry(title, "en");
    await new Promise((r) => setTimeout(r, 1200));

    if (!descFr && !descEn) {
      console.log(`✗ ${meta.name} → aucune description`);
      continue;
    }

    meta.description_fr = descFr?.slice(0, 2000) || null;
    meta.description_en = descEn?.slice(0, 2000) || null;
    // Conserve description (ancienne) pour rétrocompat
    if (!meta.description) meta.description = descEn?.slice(0, 1500) || descFr?.slice(0, 1500) || null;

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
    console.log(`✓ ${meta.name} → ${descFr ? "FR" : ""} ${descEn ? "EN" : ""}`);
    ok++;
  }

  console.log(`\nMis à jour : ${ok}/${dirs.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });