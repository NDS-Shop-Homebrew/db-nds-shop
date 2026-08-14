// Builds the list of ROMs to turn into forwarders from a db-nds-shop
// "source/apps" folder (one JSON per game, with a "downloads" object and an
// install "scripts" object).
//
// Each field is derived from the authoritative source in the app data:
//   - rom:      the download URL basename (the actual file on the server/disk)
//   - out:      the forwarder URL basename (what the store downloads)
//   - gamepath: the "output" of the ROM download step (where the store puts
//               the ROM on the SD card)
// These can all differ (typos, hyphens, renames in source/apps), so the
// manifest follows the script, not the download key.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const LOCAL = /^https:\/\/db-nds-shop\.fr\//i;

function decodeName(url) {
  try {
    return decodeURIComponent(url.split("/").pop());
  } catch {
    return url.split("/").pop();
  }
}

export function buildManifest(appsDir, gamePathPrefix = "/roms/nds") {
  const prefix = gamePathPrefix.replace(/\/+$/, "");
  const files = readdirSync(appsDir).filter((f) => f.endsWith(".json")).sort();
  const entries = [];

  for (const file of files) {
    const app = JSON.parse(readFileSync(path.join(appsDir, file), "utf8"));
    const scripts = Object.values(app.scripts || {}).flat();

    for (const [name, dl] of Object.entries(app.downloads || {})) {
      if (!/\.(nds|dsi)$/i.test(name)) continue;
      const url = dl?.url || "";
      const rom = LOCAL.test(url) ? decodeName(url) : name;

      const romStep = scripts.find((s) => s?.type === "downloadFile" && s.file === url);
      const fwStep = scripts.find(
        (s) => s?.type === "downloadFile" && /\/forwarder\//.test(s.file || "")
      );

      entries.push({
        rom,
        gamepath: romStep?.output || `${prefix}/${name}`,
        out: fwStep ? decodeName(fwStep.file) : `${rom.replace(/\.(nds|dsi)$/i, "")}.cia`,
      });
    }
  }

  return entries;
}
