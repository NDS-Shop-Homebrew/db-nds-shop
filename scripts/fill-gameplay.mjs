// Récupère la section "Gameplay" des articles Wikipedia comme description,
// pour les jeux qui n'ont pas de description IGDB.
// Usage: node scripts/fill-gameplay.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_BASE = path.resolve(__dirname, "../backend/public/db/nds/base");
const SECTIONS = ["Gameplay", "Gameplay|Jeu", "Gameplay|Jouabilité", "Gameplay|Système de jeu", "Plot|Synopsis", "Story"];

async function fetchSection(title, section, lang) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&section=${section}&format=json&origin=*`;
  const r = await fetch(url, { headers: { "User-Agent": "NDS-Shop/1.0" } });
  if (!r.ok) return null;
  const j = await r.json();
  const pages = j.query?.pages || {};
  const page = Object.values(pages)[0];
  return page?.extract || null;
}

async function searchWikipedia(title, lang) {
  const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(title)}&gsrlimit=1&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
  const r = await fetch(searchUrl, { headers: { "User-Agent": "NDS-Shop/1.0" } });
  if (!r.ok) return null;
  const j = await r.json();
  const pages = j.query?.pages || {};
  const page = Object.values(pages)[0];
  return { title: page?.title || title, extract: page?.extract || null };
}

async function getDescription(title) {
  let clean = title.replace(/\s*\(.*?\)/g, "").replace(/\s*\[.*?\]/g, "").replace(/\s*[:&-]\s*/g, " ").replace(/\s+/g, " ").trim();
  
  // Cherche d'abord le gameplay section dans la bonne langue
  for (const lang of ["en", "fr"]) {
    let wiki = await searchWikipedia(clean, lang);
    // Chercher la section gameplay par mot-clé dans l'extrait
    if (wiki?.extract) {
      // L'extrait complet de l'article (sections gameplay, plot etc)
      const fullUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(wiki.title)}&format=json&origin=*`;
      const r = await fetch(fullUrl, { headers: { "User-Agent": "NDS-Shop/1.0" } });
      if (r.ok) {
        const j = await r.json();
        const p = Object.values(j.query?.pages || {})[0];
        const text = p?.extract || wiki.extract;
        // Prendre le premier paragraphe significatif après l'infobox
        const lines = text.split("\n").filter(l => l.trim().length > 100);
        if (lines.length > 0) return lines[0].slice(0, 2000);
        return text.slice(0, 2000);
      }
      return wiki.extract.slice(0, 2000);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}

async function main() {
  const dirs = fs.readdirSync(DB_BASE).filter(d => d !== "Example" && fs.statSync(path.join(DB_BASE, d)).isDirectory());
  let ok = 0;
  for (const serial of dirs) {
    const metaPath = path.join(DB_BASE, serial, "meta.json");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    // Ne faire que les jeux SANS description IGDB
    if (meta.description_igdb) { console.log("= " + meta.name + " → déjà IGDB"); ok++; continue; }

    const title = meta.name || serial;
    process.stdout.write("  " + title + "... ");
    const desc = await getDescription(title);
    if (desc) {
      meta.description_igdb = desc;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
      console.log("✅ (" + desc.slice(0, 60) + "…)");
      ok++;
    } else {
      console.log("⚠ pas trouvé");
    }
    await new Promise(r => setTimeout(r, 800));
  }
  console.log("\n📊 " + ok + " mis à jour");
}

main().catch(e => { console.error(e); process.exit(1); });