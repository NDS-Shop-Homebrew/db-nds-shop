// Generates the store assets for the NDS games in source/apps:
//   --icons       : extract the 32x32 banner icon from each local ROM -> 48x48 PNG
//   --boxart      : download boxarts from libretro-thumbnails (pinned commit)
//   --screenshots : download game previews from libretro-thumbnails Named_Snaps
// All three run by default. Sources are pinned to a fixed commit for stability:
//   https://github.com/libretro-thumbnails/Nintendo_-_Nintendo_DS

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { buildManifest } from "./lib/manifest.mjs";
import { extractIconPng } from "./lib/extractIcon.mjs";

const COMMIT =
  process.env.LIBRETRO_THUMBNAILS_COMMIT ||
  "f4792152a0848920ac26c90054cdf4c6c62554a8";
const DS_GH = `libretro-thumbnails/Nintendo_-_Nintendo_DS@${COMMIT}`;
// multiple jsdelivr providers share the same repo cache but separate rate-limit buckets
const PROVIDERS = [
  (folder, file) =>
    `https://cdn.jsdelivr.net/gh/${DS_GH}/${folder}/${file.split("/").map(encodeURIComponent).join("/")}`,
  (folder, file) =>
    `https://fastly.jsdelivr.net/gh/${DS_GH}/${folder}/${file.split("/").map(encodeURIComponent).join("/")}`,
  (folder, file) =>
    `https://gcore.jsdelivr.net/gh/${DS_GH}/${folder}/${file.split("/").map(encodeURIComponent).join("/")}`,
  (folder, file) =>
    `https://testingcf.jsdelivr.net/gh/${DS_GH}/${folder}/${file.split("/").map(encodeURIComponent).join("/")}`,
  (folder, file) =>
    `https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Nintendo_DS/${COMMIT}/${folder}/${file.split("/").map(encodeURIComponent).join("/")}`,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryFetch(folder, file) {
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const base of PROVIDERS) {
      try {
        const res = await fetch(base(folder, file), {
          redirect: "follow",
          signal: AbortSignal.timeout(30000),
        });
        if (res.ok) return Buffer.from(await res.arrayBuffer());
        // 403/429/5xx = transient (rate limit / CDN hiccup), retry after a pause
        if (res.status === 403 || res.status === 429 || res.status >= 500) {
          console.error(`  ⚠ ${res.status} ${folder}/${file.slice(0, 50)} (tentative ${attempt + 1})`);
          await sleep(4000 * (attempt + 1));
        }
      } catch {
        // try next source
      }
    }
    if (attempt < 2) await sleep(1500 * (attempt + 1));
  }
  return null;
}

// ---- argument parsing ----
const a = {};
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith("--no-")) a[arg.slice(5)] = false;
  else if (arg.startsWith("--")) {
    const key = arg.slice(2);
    a[key] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
    if (typeof a[key] !== "boolean") i++;
  }
}
const appsDir = a.apps || "source/apps";
const romsDir = a.roms || null;
const outDir = a.out || "frontend/public";
const doIcons = a.icons !== false;
const doBoxart = a.boxart !== false;
const doScreenshots = a.screenshots !== false;

function decodeName(url) {
  try {
    return decodeURIComponent(url.split("/").pop());
  } catch {
    return url.split("/").pop();
  }
}

// webName replica of generate.py (lowercase alnum, "_"/"-", "." and " " -> "-")
function webName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split("")
    .map((c) => (/[a-z0-9_-]/.test(c) ? c : c === "." || c === " " ? "-" : ""))
    .join("");
}

// ---- boxart / screenshot name matching ----
const ALIASES = [
  ["Super Mario DS", "Super Mario 64 DS"],
  ["Beyblade Metal Fusion Cyber Pegasus", "Beyblade Metal Fusion - Cyber Pegasus"],
  ["WarioWareTouched!", "WarioWare - Touched!"],
  ["Dr Kawashima's Brain Training How Old Is Your Brain", "Dr Kawashima's Brain Training - How Old Is Your Brain"],
  ["Dragon Quest IX Sentinels of the Starry Skies", "Dragon Quest IX - Sentinels of the Starry Skies"],
  ["Legend of Zelda, The Phantom Hourglass", "Legend of Zelda, The - Phantom Hourglass"],
  ["Legend of Zelda, The Spirit Tracks", "Legend of Zelda, The - Spirit Tracks"],
  ["Fire EmblemShadow Dragon", "Fire Emblem - Shadow Dragon"],
  ["Code Lyoko Fall of X.A.N.A.", "Code Lyoko - Fall of X.A.N.A."],
  ["Jackass The Game DS", "Jackass - The Game DS"],
  ["Wario Master of Disguise", "Wario - Master of Disguise"],
  ["Michael Jackson The Experience", "Michael Jackson - The Experience"],
  ["Mario & Luigi Bowser's Inside Story", "Mario & Luigi - Bowser's Inside Story"],
  ["Mario & Luigi Partners in Time", "Mario & Luigi - Partners in Time"],
  ["Nintendogs Dachshund & Friends", "Nintendogs - Dachshund & Friends"],
  ["Nintendogs Dalmatian & Friends", "Nintendogs - Dalmatian & Friends"],
  ["Nintendogs Labrador & Friends", "Nintendogs - Labrador & Friends"],
  ["Nintendogs Chihuahua & Friends", "Nintendogs - Chihuahua & Friends"],
  ["Inazuma Eleven Tempete de Feu", "Inazuma Eleven 2 - Tempete de Feu"],
  ["Inazuma Eleven Tempete de Glace", "Inazuma Eleven 2 - Tempete de Glace"],
  ["Pokemon Version Argent SoulSilver", "Pokemon - Version Argent SoulSilver"],
  ["Pokemon Version Or HeartGold", "Pokemon - Version Or HeartGold"],
  ["Pokemon Version Platine", "Pokemon - Version Platine"],
  ["Pokemon Version Diamant", "Pokemon - Version Diamant"],
  ["Pokemon Version Perle", "Pokemon - Version Perle"],
  ["Pokemon Version Noire 2", "Pokemon - Version Noire 2"],
  ["Pokemon Version Noire", "Pokemon - Version Noire"],
  ["Pokemon Version Blanche 2", "Pokemon - Version Blanche 2"],
  ["Pokemon Version Blanche", "Pokemon - Version Blanche"],
  ["Welcome to Animal Crossing Wild World", "Welcome to Animal Crossing - Wild World"],
];

function cleanTitle(romName) {
  let t = romName.replace(/\.(nds|dsi)$/i, "");
  t = t.replace(/\s*\(NDSi Enhanced\)/gi, "");
  t = t.replace(/\s*\(Rev(\s?\d*)?\)/gi, "");
  t = t.replace(/\s*\[[^\]]*\]/g, "");
  // region + following parenthesized groups, e.g. "(Europe) (En,Fr,De,Es,It)"
  t = t.replace(/\s*\((Europe|France|USA|Japan)\)(\s*\([^)]*\))*/gi, "");
  return t.trim();
}

function regionSets(romName) {
  if (/France/i.test(romName))
    return ["(France)", "(France) (Rev 1)", "(France) (Rev 5)", "(Europe) (Fr)", "(Europe) (En,Fr)"];
  return ["(Europe) (En,Fr,De,Es,It)", "(Europe)", "(USA)"];
}

function candidates(romName) {
  const clean = cleanTitle(romName);
  const titles = [clean];
  for (const [from, to] of ALIASES) {
    if (clean.includes(from)) titles.push(clean.replace(from, to));
  }
  const regions = regionSets(romName);
  const out = [];
  for (const t of titles) {
    for (const r of regions) {
      out.push(`${t} ${r}.png`);
      out.push(`${t} ${r} (Rev 1).png`);
    }
  }
  return [...new Set(out)];
}

// ---- offline matching against the cached libretro file list ----
// cache/libretro-files.json is a flat listing (boxarts[], snaps[]) fetched from
// the GitHub API at the pinned commit. Matching offline avoids probing the CDN.

const CACHE_FILE = new URL("./cache/libretro-files.json", import.meta.url);

function loadLibretroCache() {
  if (!existsSync(CACHE_FILE)) return null;
  try {
    const j = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
    if (j.commit !== COMMIT) return null;
    return j;
  } catch {
    return null;
  }
}

function regionScore(name, wantFrance) {
  let s = 0;
  if (/\((France|Europe|Germany)/.test(name)) s += 10;
  if (wantFrance && /\(France\)/.test(name)) s += 5;
  if (/\(Europe\)/.test(name) && !wantFrance) s += 5;
  if (/\(USA\)/.test(name) && !wantFrance) s -= 3;
  if (wantFrance && /\(USA\)/.test(name)) s -= 5;
  if (/\(Rev/.test(name)) s -= 2;
  if (/\(NDSi Enhanced\)/.test(name)) s -= 1;
  if (/\(Demo\)|\(Kiosk\)/.test(name)) s -= 10;
  if (/\(En,Ja/.test(name)) s += 1;
  if (/\(En,Fr/.test(name)) s += 2;
  return s;
}

function matchFromList(list, romName) {
  const wantFrance = /France/i.test(romName);
  const clean = cleanTitle(romName);
  const titles = [clean];
  for (const [from, to] of ALIASES) {
    if (clean.includes(from)) titles.push(clean.replace(from, to));
  }
  let best = null;
  let bestScore = -Infinity;
  for (const t of titles) {
    // libretro replaces "&" with "_" in filenames
    const prefixes = [t + " (", t.replace(/&/g, "_") + " ("];
    for (const prefix of prefixes) {
      for (const name of list) {
        if (!name.startsWith(prefix) || !name.endsWith(".png")) continue;
        const s = regionScore(name, wantFrance);
        if (s > bestScore) {
          bestScore = s;
          best = name;
        }
      }
    }
  }
  return best;
}

async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ---- main ----
const apps = readdirSync(appsDir)
  .filter((f) => f.endsWith(".json"))
  .sort();
const manifest = buildManifest(appsDir);
const entryByRom = new Map(manifest.map((e) => [e.rom, e]));

const games = [];
for (const file of apps) {
  const app = JSON.parse(readFileSync(path.join(appsDir, file), "utf8"));
  const dlKey = Object.keys(app.downloads || {}).find((k) => /\.(nds|dsi)$/i.test(k));
  if (!dlKey) continue;
  const entry = entryByRom.get(decodeName(app.downloads[dlKey]?.url || ""));
  if (!entry) continue;
  const boxartStep = (app.screenshots || []).find((s) => s?.description === "Boxart");
  games.push({
    app,
    file,
    dlKey,
    entry,
    romName: entry.rom,
    iconName: app.icon ? decodeName(app.icon) : `${webName(app.title)}.png`,
    boxartName: boxartStep ? decodeName(boxartStep.url) : null,
  });
}
console.log(`Jeux à traiter : ${games.length}`);

const summary = { icons: 0, iconsMiss: [], boxart: 0, boxartMiss: [], screenshots: 0, screenshotsMiss: [] };

// ---- icons from ROMs ----
if (doIcons) {
  if (!romsDir || !existsSync(romsDir)) {
    console.error("⚠ --roms requis pour les icônes");
  } else {
    const iconsDir = path.join(outDir, "assets", "images", "icons");
    mkdirSync(iconsDir, { recursive: true });
    for (const g of games) {
      const romPath = path.join(romsDir, g.romName);
      if (!existsSync(romPath)) {
        summary.iconsMiss.push(`${g.file}: ROM absente (${g.romName})`);
        continue;
      }
      try {
        writeFileSync(path.join(iconsDir, g.iconName), extractIconPng(readFileSync(romPath)));
        summary.icons++;
      } catch (e) {
        summary.iconsMiss.push(`${g.file}: ${e.message}`);
      }
    }
    console.log(`Icônes extraites : ${summary.icons}/${games.length}`);
  }
}

// ---- boxart from libretro-thumbnails ----
if (doBoxart) {
  const cache = loadLibretroCache();
  const boxartDir = path.join(outDir, "assets", "images", "boxart");
  mkdirSync(boxartDir, { recursive: true });
  const targets = games.filter((g) => g.boxartName);
  const results = await pool(targets, 1, async (g) => {
    if (existsSync(path.join(boxartDir, g.boxartName))) return "existing";
    const file = cache ? matchFromList(cache.boxarts, g.romName) : candidates(g.romName)[0];
    const names = file ? [file] : candidates(g.romName);
    for (const n of names) {
      const data = await tryFetch("Named_Boxarts", n);
      if (data) {
        writeFileSync(path.join(boxartDir, g.boxartName), data);
        return `ok (${n})`;
      }
      await sleep(1500);
    }
    return "miss";
  });
  targets.forEach((g, i) => {
    if (results[i] === "miss") summary.boxartMiss.push(`${g.file} (${g.boxartName})`);
    else summary.boxart++;
  });
  console.log(`Boxart téléchargés : ${summary.boxart}/${targets.length}`);
}

// ---- screenshots from libretro-thumbnails Named_Snaps ----
if (doScreenshots) {
  const cache = loadLibretroCache();
  const fullJsonPath = path.join(outDir, "data", "full.json");
  if (existsSync(fullJsonPath)) {
    const full = JSON.parse(readFileSync(fullJsonPath, "utf8"));
    const previewApps = full.filter((a) =>
      (a.screenshots || []).some((s) => s?.description !== "Boxart")
    );
    console.log(`Screenshots à récupérer : ${previewApps.length}`);
    for (const app of previewApps) {
      const shots = app.screenshots.filter((s) => s?.description !== "Boxart");
      for (const shot of shots) {
        const rel = shot.url.replace(/^https:\/\/db-nds-shop\.fr\//, "");
        const target = path.join(outDir, ...rel.split("/"));
        if (existsSync(target)) {
          summary.screenshots++;
          continue;
        }
        const game = games.find((g) => g.app.title === app.title);
        const names = game
          ? [matchFromList(cache?.snaps || [], game.romName)].filter(Boolean)
          : [];
        let got = null;
        for (const n of names) {
          const data = await tryFetch("Named_Snaps", n);
          if (data) {
            got = data;
            break;
          }
          await sleep(1500);
        }
        if (got) {
          mkdirSync(path.dirname(target), { recursive: true });
          writeFileSync(target, got);
          summary.screenshots++;
        } else {
          summary.screenshotsMiss.push(rel);
        }
      }
    }
  } else {
    console.error("⚠ full.json introuvable (" + fullJsonPath + ") — screenshots ignorés");
  }
}

// ---- report ----
console.log("\n===== RAPPORT =====");
console.log(`Icônes       : ${summary.icons}/${games.length}`);
console.log(`Boxart       : ${summary.boxart}/${games.length}`);
console.log(`Screenshots  : ${summary.screenshots}`);
if (summary.boxartMiss.length) {
  console.log("\nBoxart RATÉS (à faire manuellement via advanscene) :");
  summary.boxartMiss.forEach((m) => console.log(" - " + m));
}
if (summary.screenshotsMiss.length) {
  console.log("\nScreenshots RATÉS :");
  summary.screenshotsMiss.forEach((m) => console.log(" - " + m));
}
if (summary.iconsMiss.length) {
  console.log("\nIcônes RATÉES :");
  summary.iconsMiss.forEach((m) => console.log(" - " + m));
}
