// Ajoute le titleId (gamecode) dans chaque app JSON depuis la ROM.
// Usage: node scripts/add-titleid.mjs --roms <dossier>
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);
const romsArg = args[args.indexOf("--roms") + 1];
const APPS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../source/apps");
const ROMS_DIR = romsArg;

if (!ROMS_DIR || !fs.existsSync(ROMS_DIR)) {
  console.error("Usage: node scripts/add-titleid.mjs --roms <dossier ROMs>");
  process.exit(1);
}

function decodeName(url) {
  try {
    return decodeURIComponent(url.split("/").pop() || "");
  } catch {
    return "";
  }
}

function readTitleId(romPath) {
  try {
    const fd = fs.openSync(romPath, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0x0c);
    fs.closeSync(fd);
    const code = buf.toString("latin1").replace(/[^A-Z0-9]/g, "");
    return code.length === 4 ? code : null;
  } catch {
    return null;
  }
}

const apps = fs.readdirSync(APPS_DIR).filter((f) => f.endsWith(".json"));
let ok = 0;

for (const file of apps) {
  const appPath = path.join(APPS_DIR, file);
  const app = JSON.parse(fs.readFileSync(appPath, "utf8"));
  if (app.titleId) { ok++; continue; }

  const dlKey = Object.keys(app.downloads || {}).find((k) => /\.(nds|dsi)$/i.test(k));
  let romName = dlKey || "";
  if (dlKey && app.downloads[dlKey]?.url) {
    const urlName = decodeName(app.downloads[dlKey].url);
    if (urlName) romName = urlName;
  }

  let titleId = null;
  if (romName) {
    const full = path.join(ROMS_DIR, romName);
    if (fs.existsSync(full)) {
      titleId = readTitleId(full);
    } else {
      const f = fs.readdirSync(ROMS_DIR).find(
        (rf) => rf.toLowerCase().replace(/\s/g, "") === romName.toLowerCase().replace(/\s/g, "")
      );
      if (f) titleId = readTitleId(path.join(ROMS_DIR, f));
    }
  }

  if (!titleId) {
    console.log(`✗ ${file} → aucun titleId`);
    continue;
  }

  app.titleId = titleId;
  fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + "\n");
  console.log(`✓ ${file} → ${titleId}`);
  ok++;
}

console.log(`\nMis à jour : ${ok}/${apps.length}`);