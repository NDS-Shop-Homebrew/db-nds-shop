// generate-ndsdb.mjs
//
// Génère public/db/nds/base/<SERIAL>/meta.json pour chaque jeu de source/apps.
// Le serial (titleId) est extrait de la ROM (gamecode à l'offset 0x0C).
// La description + métadonnées viennent de Wikipedia (API REST, gratuit, sans clé).
//
// Usage:
//   node scripts/generate-ndsdb.mjs [--roms <dossier>] [--out <dossier>] [--dry]
//   --roms  dossier des ROMs (défaut: détection automatique)
//   --out   dossier de sortie (défaut: backend/public/db/nds/base)
//   --dry   n'écrit rien, affiche ce qui serait généré

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const APPS_DIR = path.join(REPO_ROOT, "source/apps");

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined;
}
const romsArg = getArg("--roms");
const outArg = getArg("--out");
const dry = args.includes("--dry");
const limit = parseInt(getArg("--limit") || "0", 10) || 0;

const CANDIDATE_ROMS = [
  romsArg,
  "/srv/nds-shop/roms",
  path.join(REPO_ROOT, "../../roms NDS"),
  path.join(REPO_ROOT, "..", "roms"),
].filter(Boolean).find((p) => p && fs.existsSync(p));

const OUT_DIR = outArg || path.join(REPO_ROOT, "backend/public/db/nds/base");

// --- Lecture du gamecode (titleId) dans le header ROM ---
function readTitleId(romPath) {
  try {
    const fd = fs.openSync(romPath, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0x0c); // gamecode à l'offset 0x0C
    fs.closeSync(fd);
    const code = buf.toString("latin1").replace(/[^A-Z0-9]/g, "");
    return code.length === 4 ? code : null;
  } catch {
    return null;
  }
}

// --- Récupération sur Wikipedia (API REST) ---

// Une seule requête par jeu : recherche + extrait du meilleur résultat.
// generator=search + prop=extracts renvoie directement l'extrait sans cascade.
// Retry avec backoff sur 429 (rate limit Wikipedia).
async function fetchWithRetry(url, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "NDS-Shop/1.0" } });
      if (r.ok) return r;
      if (r.status === 429 || r.status === 503) {
        const wait = 3000 * attempt + Math.random() * 1000;
        console.log(`  ⏳ rate limit, attente ${wait / 1000}s (tentative ${attempt}/${retries})`);
        await new Promise((res) => setTimeout(res, wait));
        continue;
      }
      return r;
    } catch {
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
  return null;
}

async function fetchWikiExtract(title, lang) {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query` +
    `&generator=search&gsrsearch=${encodeURIComponent(title)}&gsrlimit=1` +
    `&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
  const r = await fetchWithRetry(url);
  if (!r) return null;
  const j = await r.json();
  const pages = j.query?.pages || {};
  const page = Object.values(pages)[0];
  return page?.extract || null;
}

// Récupère le titre exact trouvé pour le nommer proprement
async function fetchWikiSummary(title, lang) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const r = await fetch(url, { headers: { "User-Agent": "NDS-Shop/1.0" } });
  if (!r.ok) return null;
  return r.json();
}

async function fetchWikiMeta(title, lang) {
  // API action=query pour genres/developer/etc via infobox (limité, sans clé)
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  const pages = j.query?.pages || {};
  const page = Object.values(pages)[0];
  return page?.extract || null;
}

const REGION_LANG = [
  ["(France)", "fr"],
  ["(Europe)", "en"],
  ["(USA)", "en"],
  ["(Japan)", "en"],
];

function detectLang(title) {
  for (const [region, lang] of REGION_LANG) {
    if (title.includes(region)) return lang;
  }
  return "en";
}

// No-Intro: le dernier caractère du gamecode = région.
// https://wiki.no-intro.org/index.php?title=Nintendo_-_Nintendo_DSi_%28Digital%29_%28CDN%29_dat_notes
const CODE_REGION = {
  E: "USA",
  J: "Japan",
  P: "Europe",
  U: "Australia",
  K: "Korea",
  V: "Europe, Australia",
  C: "China",
  D: "Germany",
  F: "France",
  I: "Italy",
  S: "Spain",
  O: "USA, Europe",
  X: "Europe",
  T: "USA, Australia",
  H: "Netherlands",
  A: "World",
};

function regionFromCode(gameCode) {
  const c = (gameCode || "").charAt(3).toUpperCase();
  return CODE_REGION[c] || null;
}

function langFromRegion(region) {
  if (!region) return "en";
  if (region.includes("France")) return "fr";
  if (region.includes("Japan")) return "ja";
  if (region.includes("Korea")) return "ko";
  if (region.includes("China")) return "zh";
  if (region.includes("Germany")) return "de";
  if (region.includes("Italy")) return "it";
  if (region.includes("Spain")) return "es";
  if (region.includes("Netherlands")) return "nl";
  return "en";
}

function cleanSearchTitle(title) {
  return title
    .replace(/\s*\(.*?\)/g, "") // enlève (Europe), (France), etc.
    .replace(/\s*\[.*?\]/g, "")
    .replace(/\s*[:&-]\s*/g, " ") // "Mario & Luigi" → "Mario Luigi", tirets → espace
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "");
}

// --- Main ---
async function main() {
  if (!CANDIDATE_ROMS) {
    console.error("⚠ Dossier de ROMs introuvable. Passe --roms <dossier>.");
    process.exit(1);
  }
  const romsDir = CANDIDATE_ROMS;
  console.log(`ROMs : ${romsDir}`);
  console.log(`Apps : ${APPS_DIR}`);
  console.log(`Sortie : ${OUT_DIR}${dry ? " [DRY]" : ""}`);
  console.log("");

  const appFiles = fs.readdirSync(APPS_DIR).filter((f) => f.endsWith(".json"));
  if (limit > 0) console.log(`Limit : ${limit} jeux`);
  let ok = 0;
  let processed = 0;
  const misses = [];

  for (const file of appFiles) {
    if (limit > 0 && processed >= limit) break;
    processed++;
    const app = JSON.parse(fs.readFileSync(path.join(APPS_DIR, file), "utf-8"));
    const dlKey = Object.keys(app.downloads || {}).find((k) => /\.nds$/i.test(k));
    // Le nom réel de la ROM est dans le basename de l'URL décodée (comme nds-assets.mjs),
    // pas forcément dans la clé (ex: Inazuma 2 dont la clé et l'URL diffèrent).
    let romName = dlKey || null;
    if (dlKey && app.downloads[dlKey]?.url) {
      try {
        const urlName = decodeURIComponent(app.downloads[dlKey].url.split("/").pop() || "");
        if (urlName) romName = urlName;
      } catch {}
    }

    // Cherche la ROM dans le dossier
    let titleId = null;
    let romPath = null;
    if (romName) {
      const full = path.join(romsDir, romName);
      if (fs.existsSync(full)) {
        romPath = full;
        titleId = readTitleId(full);
      } else {
        // fuzzy: on scanne les fichiers du dossier
        const f = fs.readdirSync(romsDir).find((rf) => rf.toLowerCase().replace(/\s/g, "") === romName.toLowerCase().replace(/\s/g, ""));
        if (f) {
          romPath = path.join(romsDir, f);
          titleId = readTitleId(romPath);
        }
      }
    }

    const searchTitle = cleanSearchTitle(app.title || "");
    const region = regionFromCode(titleId);
    const lang = langFromRegion(region);

    let description = null;
    let formalName = null;
    try {
      description = await fetchWikiExtract(searchTitle, lang);
      if (!description) description = await fetchWikiExtract(searchTitle, "en");
    } catch {}

    if (!description) {
      try {
        description = await fetchWikiMeta(searchTitle, lang);
      } catch {}
    }

    if (!titleId || !description) {
      misses.push({ file, title: app.title, titleId: titleId || "?", why: !titleId ? "pas de ROM/gamecode" : "pas de description Wiki" });
      console.log(`✗ ${app.title} [${titleId || "?"}]`);
      await new Promise((r) => setTimeout(r, 1200));
      continue;
    }

    const serialDir = path.join(OUT_DIR, titleId);
    const meta = {
      name: app.title,
      formal_name: app.title,
      description: description.slice(0, 1500),
      release_date: null,
      product_code: titleId,
      platform_name: "Nintendo DS",
      region: region || app.version || "Europe",
      genres: app.categories || ["game"],
      features: app.systems || ["Touch Screen"],
      languages: [],
      rating_system: { name: null, age: null },
      developer: app.author || null,
      publisher: app.author || null,
    };

    if (dry) {
      console.log(`· ${app.title} → ${titleId} (desc: ${description.length} car.)`);
      ok++;
      await new Promise((r) => setTimeout(r, 1200));
      continue;
    }

    fs.mkdirSync(serialDir, { recursive: true });
    fs.writeFileSync(path.join(serialDir, "meta.json"), JSON.stringify(meta, null, 2));
    console.log(`✓ ${app.title} → ${titleId}`);
    ok++;
    await new Promise((r) => setTimeout(r, 1200)); // respecte le rate limit Wikipedia
  }

  console.log("");
  console.log(`=== RÉSULTAT ===`);
  console.log(`Générés : ${ok}/${appFiles.length}`);
  if (misses.length) {
    console.log("RATÉS :");
    misses.forEach((m) => console.log(` - ${m.file} (${m.why})`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});